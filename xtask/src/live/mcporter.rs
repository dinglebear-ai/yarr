//! mcporter-backed live contract harness for the generated MCP Code Mode surface.
//!
//! This starts a local Yarr MCP server against the guarded shart environment and
//! uses `mcporter call ... yarr` to execute generated per-service callables over
//! the MCP transport. It mirrors the CLI contract suite's synthesis, seeding, skip,
//! and response-schema validation rules so both suites cover the same OpenAPI
//! surface through different transports.

use anyhow::{Context, Result, bail};
use serde_json::{Map, Value, json};
use std::collections::BTreeMap;
use std::net::TcpListener;
use std::process::Command;

use yarr::ServiceKind;
use yarr::openapi::{self, OperationSpec};

use super::contract::{self, PreparedOp, RunOut, synth::Spec};
use super::{guard, process, report, reset};

mod classify;
mod io;

use classify::{classify_chunk, should_retry_domain_result};
use io::mcporter_output;

// Keep chunks small enough to avoid Code Mode's 30s script budget while still
// avoiding a separate Node/mcporter process for every generated operation. If a
// chunk trips a transport/length limit, `run_chunk` recursively splits it so one
// large response cannot poison neighboring operations.
const BATCH_SIZE: usize = 4;
const MCPORTER_ATTEMPTS: usize = 1;
const MCPORTER_TIMEOUT: &str = "40s";

pub(super) fn run(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
    matrix: &super::matrix::Matrix,
    no_destructive: bool,
    only_service: Option<&str>,
) -> Result<()> {
    ensure_mcporter_available()?;

    let configured: std::collections::BTreeSet<&str> =
        matrix.services.iter().map(|s| s.kind.as_str()).collect();

    for (svc, spec_path) in contract::SPECS {
        if only_service.is_some_and(|only| only != *svc) {
            continue;
        }
        if !configured.contains(svc) {
            continue;
        }
        let kind = contract::kind_of(svc).expect("spec-backed kind");
        if reset::target_for(svc).is_some() {
            reset_after_op(yarr, svc)
                .with_context(|| format!("reset live fixture baseline for {svc}"))?;
        }
        contract::seed_service_fixtures(yarr, svc, kind)
            .with_context(|| format!("seed live fixtures for {svc}"))?;
        let spec = Spec::load(spec_path).with_context(|| format!("load {spec_path}"))?;
        let ops: Vec<&'static OperationSpec> = openapi::operations_for_kind(kind).iter().collect();
        println!(
            "mcporter contract {svc}: calling {} generated OpenAPI callables via yarr",
            ops.len()
        );

        let mut fixtures = contract::FixtureStore::default();
        let mut results = Vec::with_capacity(ops.len());
        for phase in 0u8..=4 {
            let phase_ops: Vec<&'static OperationSpec> = ops
                .iter()
                .copied()
                .filter(|op| contract::seed_phase(op) == phase)
                .collect();
            let outs = run_phase(
                yarr,
                svc,
                kind,
                &spec,
                &fixtures,
                &phase_ops,
                no_destructive,
            );
            contract::harvest_into(&mut fixtures, &outs);
            results.extend(outs.into_iter().map(|(_, result, _)| result));
        }
        let reset_outs =
            run_reset_required_ops(yarr, svc, kind, &spec, &fixtures, &ops, no_destructive);
        results.extend(reset_outs.into_iter().map(|(_, result, _)| result));

        write_detail(svc, &results)?;
        let status = contract::contract_status(&results);
        let detail = format!("{} via mcporter/yarr over MCP against shart", status.detail);
        if status.passed {
            report.pass(format!("mcporter contract {svc}"), detail);
        } else {
            report.fail(format!("mcporter contract {svc}"), detail);
        }
        if let Err(err) = contract::cleanup_service_fixtures(kind) {
            eprintln!("warning: failed to clean live fixtures for {svc}: {err:#}");
        }
    }

    Ok(())
}

fn reserve_local_port() -> Result<u16> {
    let listener = TcpListener::bind(("127.0.0.1", 0)).context("reserve mcporter MCP port")?;
    Ok(listener.local_addr()?.port())
}

fn run_phase(
    yarr: &process::YarrProcess,
    svc: &str,
    kind: ServiceKind,
    spec: &Spec,
    fixtures: &contract::FixtureStore,
    ops: &[&'static OperationSpec],
    no_destructive: bool,
) -> Vec<RunOut> {
    let mut outs = Vec::with_capacity(ops.len());
    let mut prepared = Vec::new();
    for op in ops {
        if contract::op_requires_stack_reset(op) {
            continue;
        }
        match contract::prepare_op_args(kind, spec, op, fixtures, no_destructive, false) {
            PreparedOp::Call(args) => prepared.push(PreparedCall { kind, op, args }),
            PreparedOp::Skip(detail) => outs.push((
                *op,
                op_result(
                    op,
                    "rejected",
                    format!("missing executable fixture: {detail}"),
                ),
                None,
            )),
        }
    }

    let mut harness = match McpHarness::start(yarr, no_destructive) {
        Ok(harness) => harness,
        Err(err) => {
            let detail = format!("failed to start isolated MCP server: {err}");
            outs.extend(prepared.iter().map(|call| {
                (
                    call.op,
                    op_result(call.op, "rejected", detail.clone()),
                    None,
                )
            }));
            return outs;
        }
    };
    for chunk in prepared.chunks(BATCH_SIZE) {
        outs.extend(harness.run_chunk(svc, spec, chunk));
    }
    outs
}

fn run_reset_required_ops(
    yarr: &process::YarrProcess,
    svc: &str,
    kind: ServiceKind,
    spec: &Spec,
    fixtures: &contract::FixtureStore,
    ops: &[&'static OperationSpec],
    no_destructive: bool,
) -> Vec<RunOut> {
    let reset_ops: Vec<_> = ops
        .iter()
        .copied()
        .filter(|op| contract::op_requires_stack_reset(op))
        .collect();
    if reset_ops.is_empty() {
        return Vec::new();
    }

    if reset::target_for(svc).is_none() {
        return reset_ops
            .into_iter()
            .map(|op| {
                (
                    op,
                    op_result(
                        op,
                        "rejected",
                        "requires stack reset/reseed but no shart ZFS golden target exists for this service".into(),
                    ),
                    None,
                )
            })
            .collect();
    }
    if no_destructive {
        return reset_ops
            .into_iter()
            .map(|op| {
                (
                    op,
                    op_result(
                        op,
                        "rejected",
                        "requires stack reset/reseed and is skipped via --no-destructive".into(),
                    ),
                    None,
                )
            })
            .collect();
    }

    let mut outs = Vec::with_capacity(reset_ops.len());
    for op in reset_ops {
        match contract::prepare_op_args(kind, spec, op, fixtures, no_destructive, true) {
            PreparedOp::Call(args) => {
                let call = PreparedCall { kind, op, args };
                let mut result =
                    run_chunk(yarr, svc, spec, std::slice::from_ref(&call), no_destructive);
                outs.append(&mut result);
                if let Err(err) = reset_after_op(yarr, svc) {
                    mark_reset_failure(
                        &mut outs,
                        call.op,
                        format!("post-operation reset failed: {err}"),
                    );
                } else if let Err(err) = contract::seed_service_fixtures(yarr, svc, kind) {
                    mark_reset_failure(
                        &mut outs,
                        call.op,
                        format!("post-operation reseed failed: {err}"),
                    );
                }
            }
            PreparedOp::Skip(detail) => outs.push((
                op,
                op_result(
                    op,
                    "rejected",
                    format!("missing executable reset fixture: {detail}"),
                ),
                None,
            )),
        }
    }
    outs
}

fn mark_reset_failure(outs: &mut [RunOut], op: &'static OperationSpec, detail: String) {
    if let Some((_, result, value)) = outs.iter_mut().rev().find(|(candidate, _, _)| {
        candidate.name == op.name && candidate.method == op.method && candidate.path == op.path
    }) {
        result.outcome = "rejected";
        result.detail = detail;
        *value = None;
    }
}

fn reset_after_op(yarr: &process::YarrProcess, svc: &str) -> Result<()> {
    reset::reset_service(svc)?;
    if let Some(url) = reset::service_url(&yarr.env, svc) {
        reset::wait_service_url(&url)?;
    }
    Ok(())
}

struct PreparedCall {
    kind: ServiceKind,
    op: &'static OperationSpec,
    args: Map<String, Value>,
}

struct McpHarness<'a> {
    yarr: &'a process::YarrProcess,
    no_destructive: bool,
    _server: Option<process::Server>,
    base: String,
}

impl<'a> McpHarness<'a> {
    fn start(yarr: &'a process::YarrProcess, no_destructive: bool) -> Result<Self> {
        let (server, base) = start_isolated_server(yarr, no_destructive)?;
        Ok(Self {
            yarr,
            no_destructive,
            _server: Some(server),
            base,
        })
    }

    fn restart(&mut self) -> Result<()> {
        self._server.take();
        let (server, base) = start_isolated_server(self.yarr, self.no_destructive)?;
        self._server = Some(server);
        self.base = base;
        Ok(())
    }

    fn run_chunk(&mut self, svc: &str, spec: &Spec, calls: &[PreparedCall]) -> Vec<RunOut> {
        let mut last_error = None;
        for attempt in 1..=2 {
            log_chunk_progress(svc, calls, attempt, "invoke");
            match invoke_chunk(&self.base, svc, calls) {
                Ok(values) => {
                    log_chunk_progress(svc, calls, attempt, "classify");
                    if attempt == 1 && should_retry_domain_result(calls, &values) {
                        last_error = Some("retryable domain response".into());
                        std::thread::sleep(std::time::Duration::from_millis(5000));
                        continue;
                    }
                    return classify_chunk(spec, calls, values);
                }
                Err(err) => {
                    log_chunk_progress(svc, calls, attempt, "error");
                    let detail = err.to_string();
                    if attempt == 1 && is_transport_restart_error(&detail) {
                        last_error = Some(detail);
                        if let Err(restart_err) = self.restart() {
                            let prior = last_error
                                .map(|e| format!("; previous transport error: {e}"))
                                .unwrap_or_default();
                            let detail =
                                format!("mcporter server restart failed: {restart_err}{prior}");
                            return rejected_calls(calls, detail);
                        }
                        continue;
                    }
                    let prior = if attempt > 1 {
                        last_error
                            .map(|e| format!("; previous transport error: {e}"))
                            .unwrap_or_default()
                    } else {
                        String::new()
                    };
                    let detail = format!("mcporter batch failed: {detail}{prior}");
                    if calls.len() > 1 && should_split_failed_batch(&detail) {
                        let mid = calls.len() / 2;
                        let mut split = self.run_chunk(svc, spec, &calls[..mid]);
                        split.extend(self.run_chunk(svc, spec, &calls[mid..]));
                        return split;
                    }
                    return rejected_calls(calls, detail);
                }
            }
        }
        unreachable!("mcporter invoke loop always returns")
    }
}

#[path = "mcporter/execution.rs"]
mod execution;
use execution::*;
