//! Exhaustive contract harness for the generated OpenAPI surface.
//!
//! shart is a disposable, dedicated test stack, so this drives **every generated
//! operation** of every spec-backed service (all methods — reads, writes, and
//! destructive deletes) via the `yarr <service> op <name>` CLI verb, with inputs
//! synthesized from the vendored spec, and validates each 2xx response against the
//! operation's declared response schema. Output is a per-service summary plus a
//! per-operation breakdown written to `target/live-full/contract-<svc>.json`.
//!
//! Operations run GET -> POST -> PUT/PATCH -> DELETE so reads/updates see existing
//! resources before deletes remove them. Pass `--no-destructive` to skip DELETEs.

pub(super) mod fixture_args;
pub(super) mod invoke;
pub(super) mod reset_ops;
pub(super) mod seeding;
pub(super) mod synth;

use anyhow::{Context, Result};
use serde::Serialize;
use serde_json::{Map, Value};
use std::collections::BTreeMap;

use yarr::ServiceKind;
use yarr::openapi::{self, HttpMethod, OperationSpec};

use super::{process, report, reset};
use fixture_args::{
    apply_fixture_args, can_reuse_fixture_body, fixture_body_for_op, fixture_parent_path,
    fixture_path_value, live_fixture_body_for_op, should_seed_optional_query,
};
pub(super) use invoke::is_retryable_contract_error;
use invoke::{invoke, write_detail};
pub(super) use reset_ops::cleanup_service_fixtures;
use reset_ops::run_reset_required_ops;
pub(super) use seeding::seed_service_fixtures;
use synth::Spec;

/// (kind str, spec path) for the spec-backed services.
pub(super) const SPECS: &[(&str, &str)] = &[
    ("sonarr", "specs/sonarr.openapi.json"),
    ("radarr", "specs/radarr.openapi.json"),
    ("prowlarr", "specs/prowlarr.openapi.json"),
    ("overseerr", "specs/overseerr.openapi.yml"),
    ("jellyfin", "specs/jellyfin.openapi.json"),
    ("plex", "specs/plex.openapi.yml"),
];

pub(super) fn kind_of(name: &str) -> Option<ServiceKind> {
    Some(match name {
        "sonarr" => ServiceKind::Sonarr,
        "radarr" => ServiceKind::Radarr,
        "prowlarr" => ServiceKind::Prowlarr,
        "overseerr" => ServiceKind::Overseerr,
        "jellyfin" => ServiceKind::Jellyfin,
        "plex" => ServiceKind::Plex,
        _ => return None,
    })
}

#[derive(Serialize)]
pub(super) struct OpResult {
    pub(super) name: &'static str,
    pub(super) method: &'static str,
    pub(super) path: &'static str,
    pub(super) outcome: &'static str, // ok | schema_mismatch | rejected | skipped
    pub(super) detail: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(super) args: Option<Value>,
}

#[derive(Debug, PartialEq, Eq)]
pub(super) struct ContractStatus {
    pub(super) ok: usize,
    pub(super) schema_mismatch: usize,
    pub(super) rejected: usize,
    pub(super) skipped: usize,
    pub(super) total: usize,
    pub(super) passed: bool,
    pub(super) detail: String,
}

pub fn run(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
    matrix: &super::matrix::Matrix,
    no_destructive: bool,
    only_service: Option<&str>,
) -> Result<()> {
    let configured: std::collections::BTreeSet<&str> =
        matrix.services.iter().map(|s| s.kind.as_str()).collect();

    for (svc, spec_path) in SPECS {
        if only_service.is_some_and(|only| only != *svc) {
            continue;
        }
        if !configured.contains(svc) {
            continue;
        }
        let kind = kind_of(svc).expect("spec-backed kind");
        if reset::target_for(svc).is_some() {
            reset::reset_service(svc)?;
            if let Some(url) = reset::service_url(&yarr.env, svc) {
                reset::wait_service_url(&url)?;
            }
        }
        seed_service_fixtures(yarr, svc, kind)
            .with_context(|| format!("seed live fixtures for {svc}"))?;
        let spec = Spec::load(spec_path).with_context(|| format!("load {spec_path}"))?;
        let ops: Vec<&'static OperationSpec> = openapi::operations_for_kind(kind).iter().collect();
        let mut fixtures = FixtureStore {
            provider: seeding::prime_provider_fixtures(yarr, svc, kind),
            ..Default::default()
        };

        // Create-first seeding: run phases in order, harvesting ids between them so
        // later phases can hit real resources:
        //   0  base collection reads (GET, no path/query fixture dependency)
        //   1  query collection reads (GETs needing seeded query ids)
        //   2  creates (POST)                          -> seed ids from created objects
        //   3  resource reads/updates (GET/PUT/PATCH)  -> use seeded ids
        //   4  deletes (DELETE)                        -> use seeded ids; also cleanup
        let mut results: Vec<OpResult> = Vec::with_capacity(ops.len());
        for phase in 0u8..=4 {
            let phase_ops: Vec<&'static OperationSpec> = ops
                .iter()
                .copied()
                .filter(|o| seed_phase(o) == phase)
                .filter(|o| !op_requires_stack_reset(o))
                .collect();
            let outs = parallel_run(
                yarr,
                svc,
                kind,
                &spec,
                &fixtures,
                &phase_ops,
                no_destructive,
            );
            harvest_into(&mut fixtures, &outs);
            results.extend(outs.into_iter().map(|(_, r, _)| r));
        }
        let reset_outs =
            run_reset_required_ops(yarr, svc, kind, &spec, &fixtures, &ops, no_destructive);
        results.extend(reset_outs.into_iter().map(|(_, r, _)| r));

        write_detail(svc, &results)?;
        let status = contract_status(&results);
        if status.passed {
            report.pass(format!("contract {svc}"), status.detail);
        } else {
            report.fail(format!("contract {svc}"), status.detail);
        }
        if let Err(err) = cleanup_service_fixtures(kind) {
            eprintln!("warning: failed to clean live fixtures for {svc}: {err:#}");
        }
    }
    Ok(())
}

/// Bounded thread pool: run `ops` through `run_op` concurrently. Returns, per op,
/// `(op, result, success-body)` so the caller can harvest seeded ids between phases.
pub(super) type RunOut = (&'static OperationSpec, OpResult, Option<Value>);

fn parallel_run(
    yarr: &process::YarrProcess,
    svc: &str,
    kind: ServiceKind,
    spec: &Spec,
    fixtures: &FixtureStore,
    ops: &[&'static OperationSpec],
    no_destructive: bool,
) -> Vec<RunOut> {
    // Keep contract execution serial. This suite is the authoritative endpoint
    // coverage gate; concurrent generated writes made the shart services drop
    // connections and produced false "coverage" failures before the endpoint
    // itself could be evaluated.
    const WORKERS: usize = 1;
    if ops.is_empty() {
        return Vec::new();
    }
    let chunk = ops.len().div_ceil(WORKERS).max(1);
    std::thread::scope(|s| {
        let handles: Vec<_> = ops
            .chunks(chunk)
            .map(|c| {
                s.spawn(move || {
                    c.iter()
                        .map(|op| {
                            let (r, v) =
                                run_op(yarr, svc, kind, spec, op, fixtures, no_destructive);
                            (*op, r, v)
                        })
                        .collect::<Vec<RunOut>>()
                })
            })
            .collect();
        handles
            .into_iter()
            .flat_map(|h| h.join().expect("contract worker panicked"))
            .collect()
    })
}

#[derive(Debug, Default)]
pub(super) struct FixtureStore {
    ids: BTreeMap<String, Vec<Value>>,
    bodies: BTreeMap<String, Vec<Value>>,
    provider: seeding::ProviderFixtures,
}

impl FixtureStore {
    fn values_for(&self, path: &str) -> Option<&[Value]> {
        self.ids.get(path).map(Vec::as_slice)
    }

    fn body_for(&self, path: &str) -> Option<&Value> {
        self.bodies.get(path).and_then(|v| v.first())
    }
}

/// Merge resource fixtures a phase's responses expose into the fixture pool, keyed
/// by the op's path. Array/object GETs contribute real `id`/`Id`/`ratingKey`
/// values plus reusable object bodies. Later path-param/body ops must resolve
/// against this pool; the harness no longer fabricates synthetic IDs.
pub(super) fn harvest_into(fixtures: &mut FixtureStore, outs: &[RunOut]) {
    for (op, _result, value) in outs {
        let Some(value) = value else { continue };
        let bodies = harvest_objects(value);
        let mut found = bodies
            .iter()
            .flat_map(harvest_id_values)
            .collect::<Vec<_>>();
        if let Some(id) = first_id_value(value) {
            found.push(id);
        }
        if !found.is_empty() {
            let pool = fixtures.ids.entry(op.path.to_string()).or_default();
            pool.extend(found);
            dedupe_values(pool);
            pool.truncate(8);
        }
        if !bodies.is_empty() {
            let pool = fixtures.bodies.entry(op.path.to_string()).or_default();
            pool.extend(bodies);
            pool.truncate(8);
        }
    }
}

/// Seeding phase for an op: collection reads first (0) to discover ids, then creates
/// (1) to seed more, then resource reads/updates (2) that consume ids, then deletes
/// (3) last so reads/updates precede cleanup.
pub(super) fn seed_phase(op: &OperationSpec) -> u8 {
    match op.method {
        HttpMethod::Get
            if op.path_params.is_empty()
                && !op
                    .query_params
                    .iter()
                    .any(|param| should_seed_optional_query(param)) =>
        {
            0
        }
        HttpMethod::Get if op.path_params.is_empty() => 1,
        HttpMethod::Post => 2,
        HttpMethod::Delete => 4,
        _ => 3, // GET-with-id, PUT, PATCH
    }
}

fn tally(results: &[OpResult]) -> (usize, usize, usize, usize) {
    let mut t = (0, 0, 0, 0);
    for r in results {
        match r.outcome {
            "ok" => t.0 += 1,
            "schema_mismatch" => t.1 += 1,
            "rejected" => t.2 += 1,
            _ => t.3 += 1,
        }
    }
    t
}

pub(super) fn contract_status(results: &[OpResult]) -> ContractStatus {
    let (ok, schema_mismatch, rejected, skipped) = tally(results);
    let total = results.len();
    let passed = rejected == 0 && schema_mismatch == 0 && skipped == 0 && ok > 0;
    let detail = format!(
        "{ok} contract-ok, {schema_mismatch} schema-mismatch, {rejected} contract-rejected (fails coverage), {skipped} skipped of {total} ops"
    );
    ContractStatus {
        ok,
        schema_mismatch,
        rejected,
        skipped,
        total,
        passed,
        detail,
    }
}

#[path = "contract/harvest.rs"]
mod harvest;
use harvest::*;
#[path = "contract/operations.rs"]
mod operations;
pub(super) use operations::*;

#[cfg(test)]
#[path = "contract_tests.rs"]
mod tests;
