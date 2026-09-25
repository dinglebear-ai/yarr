use anyhow::Result;
use std::time::Duration;

use yarr::ServiceKind;
use yarr::openapi::OperationSpec;

use crate::live::{process, reset, ssh};

use super::{FixtureStore, OpResult, PreparedOp, RunOut, invoke, prepare_op_args, synth::Spec};

pub(super) fn run_reset_required_ops(
    yarr: &process::YarrProcess,
    svc: &str,
    kind: ServiceKind,
    spec: &Spec,
    fixtures: &FixtureStore,
    ops: &[&'static OperationSpec],
    no_destructive: bool,
) -> Vec<RunOut> {
    let reset_ops: Vec<_> = ops
        .iter()
        .copied()
        .filter(|op| super::op_requires_stack_reset(op))
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
                    OpResult {
                        name: op.name,
                        method: op.method.as_str(),
                        path: op.path,
                        outcome: "skipped",
                        detail:
                            "requires stack reset/reseed but no shart ZFS golden target exists for this service"
                                .into(),
                        args: None,
                    },
                    None,
                )
            })
            .collect();
    }

    let mut outs = Vec::with_capacity(reset_ops.len());
    for op in reset_ops {
        if let Err(err) = reset::reset_service(svc) {
            outs.push((op, reset_error(op, "pre-operation reset failed", err), None));
            continue;
        }
        if let Some(url) = reset::service_url(&yarr.env, svc)
            && let Err(err) = reset::wait_service_url(&url)
        {
            outs.push((
                op,
                reset_error(op, "post-reset health wait failed", err),
                None,
            ));
            continue;
        }
        let (result, value) =
            run_op_with_reset(yarr, svc, kind, spec, op, fixtures, no_destructive);
        outs.push((op, result, value));
        if let Err(err) = reset::reset_service(svc) {
            outs.push((
                op,
                reset_error(op, "post-operation reset failed", err),
                None,
            ));
        }
    }
    outs
}

pub(in crate::live) fn cleanup_service_fixtures(kind: ServiceKind) -> Result<()> {
    let command = match kind {
        ServiceKind::Prowlarr => {
            "fuser -k 18080/tcp >/dev/null 2>&1 || true; docker exec prowlarr sh -lc 'fuser -k 8191/tcp >/dev/null 2>&1 || true'"
        }
        ServiceKind::Sonarr => "fuser -k 18081/tcp >/dev/null 2>&1 || true",
        _ => return Ok(()),
    };
    ssh::run(command, Duration::from_secs(30))?.ensure_success("cleanup live helper servers")?;
    Ok(())
}

fn reset_error(op: &OperationSpec, label: &str, err: anyhow::Error) -> OpResult {
    OpResult {
        name: op.name,
        method: op.method.as_str(),
        path: op.path,
        outcome: "rejected",
        detail: format!("{label}: {err}"),
        args: None,
    }
}

fn run_op_with_reset(
    yarr: &process::YarrProcess,
    svc: &str,
    kind: ServiceKind,
    spec: &Spec,
    op: &OperationSpec,
    fixtures: &FixtureStore,
    no_destructive: bool,
) -> (OpResult, Option<serde_json::Value>) {
    let mk = |outcome, detail: String| OpResult {
        name: op.name,
        method: op.method.as_str(),
        path: op.path,
        outcome,
        detail,
        args: None,
    };
    let args = match prepare_op_args(kind, spec, op, fixtures, no_destructive, true) {
        PreparedOp::Call(args) => args,
        PreparedOp::Skip(detail) => return (mk("skipped", detail), None),
    };
    match invoke::invoke(yarr, svc, op.name, &args) {
        Ok(Some(value)) => {
            let result = match op.response_type {
                Some(ty) => match spec.validate_response(ty, &value) {
                    Ok(()) => mk("ok", format!("2xx + matches {ty}")),
                    Err(e) => mk(
                        "schema_mismatch",
                        format!("{e}").chars().take(500).collect(),
                    ),
                },
                None => mk("ok", "2xx (no declared response type to validate)".into()),
            };
            (result, Some(value))
        }
        Ok(None) => (mk("ok", "2xx (empty/non-JSON body)".into()), None),
        Err(e) => (
            mk("rejected", format!("{e}").chars().take(500).collect()),
            None,
        ),
    }
}
