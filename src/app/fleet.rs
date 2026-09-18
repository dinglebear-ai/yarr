//! Fleet planning and bounded dispatch in the business layer.
//!
//! One `fleet.map` invocation materializes a bounded, frozen leaf set from the
//! configured services, validates every leaf through the shared Task-3/5
//! admission (`classify_action`), and then executes each leaf exactly once
//! through [`execute_service_action`] under bounded concurrency and a per-leaf
//! timeout. There is no script-wide planning pass, no dry run, and no replay:
//! the only authorization the bridge can request is one batch decision for the
//! exact destructive leaf set produced by this invocation, and denial only
//! removes those leaves (fail closed) while everything else still runs.

use std::collections::BTreeMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::{Result, anyhow, bail};
use futures_util::{StreamExt, stream};
use serde_json::Value;

use super::YarrService;
use crate::actions::{YarrAction, dispatch::validate_action_for_service, execute_service_action};
use crate::app::codemode::CodeModeCallGuard;
use crate::fleet::{
    FleetInvocation, FleetLeafLabel, FleetResult, FleetResultSummary, FleetSelector,
    PlannedFleetInvocation, PlannedFleetLeaf,
};

#[cfg(test)]
#[path = "fleet_tests.rs"]
mod tests;

/// Bound on the frozen leaf set for one invocation. Bounded fan-out keeps both
/// upstream load and the single batch destructive prompt predictable.
pub(crate) const FLEET_MAX_TARGETS: usize = 32;
pub(crate) const FLEET_MAX_CONCURRENT: usize = 4;
/// Default per-leaf bound; overridable per service via [`YarrService::with_fleet_timeout`].
pub(crate) const DEFAULT_FLEET_INSTANCE_TIMEOUT: Duration = Duration::from_secs(30);
pub(crate) const FLEET_VALUE_LIMIT_BYTES: usize = 8 * 1024;

impl YarrService {
    /// Resolve every fleet target and parse its immutable, service-bound action.
    /// `Of` intentionally does not use the normal kind fallback resolver: fleet
    /// identities are exact configuration names, not aliases. The resolved set
    /// is sorted by name and bounded by [`FLEET_MAX_TARGETS`].
    pub(crate) fn plan_fleet(&self, invocation: FleetInvocation) -> Result<PlannedFleetInvocation> {
        let mut selected = match invocation.selector {
            FleetSelector::Of { name } => self
                .services
                .iter()
                .find(|service| service.name == name)
                .map(|service| vec![service])
                .ok_or_else(|| {
                    anyhow!("fleet selector requires an exact configured service identity `{name}`")
                })?,
            FleetSelector::All { kind } => self
                .services
                .iter()
                .filter(|service| kind.is_none_or(|wanted| service.kind == wanted))
                .collect::<Vec<_>>(),
        };
        selected.sort_by(|left, right| left.name.cmp(&right.name));
        if selected.is_empty() {
            bail!("fleet selector matched no configured services");
        }
        if selected.len() > FLEET_MAX_TARGETS {
            bail!(
                "fleet selector matched {} services; the bound is {FLEET_MAX_TARGETS} per invocation",
                selected.len()
            );
        }

        let mut leaves = Vec::with_capacity(selected.len());
        for service in selected {
            let mut params = invocation.params.clone();
            params.insert("service".into(), Value::String(service.name.clone()));
            params.insert("action".into(), Value::String(invocation.action.clone()));
            let action = YarrAction::from_mcp_args(&Value::Object(params))?;
            if !fleet_action_targets_service(&action) {
                bail!("fleet action `{}` must target a service", action.name());
            }
            validate_action_for_service(self, action.name(), &service.name)?;
            leaves.push(PlannedFleetLeaf {
                service: service.name.clone(),
                kind: service.kind,
                action,
            });
        }
        Ok(PlannedFleetInvocation { leaves })
    }

    /// Dispatch a fleet invocation for trusted local callers (CLI, direct app
    /// use). No guard: no scope gate and no elicitation channel exists locally.
    pub(crate) async fn dispatch_fleet(
        &self,
        invocation: FleetInvocation,
    ) -> Result<Vec<FleetResult>> {
        let plan = self.plan_fleet(invocation)?;
        self.dispatch_fleet_plan(plan, None).await
    }

    /// Status across every configured service (the `fleet.status()` sugar).
    pub(crate) async fn fleet_status(&self) -> Result<Vec<FleetResult>> {
        self.fleet_status_with_guard(None).await
    }

    pub(crate) async fn fleet_status_with_guard(
        &self,
        guard: Option<Arc<dyn CodeModeCallGuard>>,
    ) -> Result<Vec<FleetResult>> {
        let plan = self.plan_fleet(FleetInvocation {
            selector: FleetSelector::All { kind: None },
            action: "service_status".to_owned(),
            params: serde_json::Map::new(),
        })?;
        self.dispatch_fleet_plan(plan, guard).await
    }

    /// Execute a frozen leaf set. Returns `Err` only for a whole-map rejection
    /// *before any leaf runs* (invalid route, insufficient scope). Per-leaf
    /// failures — including destructive leaves denied by the single batch
    /// authorization — are preserved as ordered, per-leaf results.
    pub(crate) async fn dispatch_fleet_plan(
        &self,
        plan: PlannedFleetInvocation,
        guard: Option<Arc<dyn CodeModeCallGuard>>,
    ) -> Result<Vec<FleetResult>> {
        // Phase 1 — admission for every leaf before anything executes. A single
        // invalid leaf rejects the whole frozen set (fail closed, nothing ran).
        let mut destructive = BTreeMap::<usize, FleetLeafLabel>::new();
        for (index, leaf) in plan.leaves.iter().enumerate() {
            let classification = crate::actions::classify_action(self, &leaf.action).map_err(|error| {
                anyhow!(
                    "fleet map rejected before execution: leaf `{}` on `{}` cannot be admitted: {error}",
                    leaf.action.name(),
                    leaf.service
                )
            })?;
            if classification.destructive {
                destructive.insert(
                    index,
                    FleetLeafLabel {
                        service: leaf.service.clone(),
                        action: leaf.action.name().to_owned(),
                    },
                );
            }
        }

        // Phase 2 — transport policy. Scope is enforced per leaf; destructive
        // authorization is requested exactly once for the frozen destructive
        // subset of this invocation (never service-wide, never reusable).
        let mut denials = BTreeMap::<usize, String>::new();
        if let Some(guard) = guard.as_ref() {
            for leaf in &plan.leaves {
                if let Err(error) = guard.authorize_leaf_scope(&leaf.action).await {
                    bail!(
                        "fleet map rejected before execution: leaf `{}` on `{}` failed scope admission: {error}",
                        leaf.action.name(),
                        leaf.service
                    );
                }
            }
            if !destructive.is_empty() {
                let labels: Vec<FleetLeafLabel> = destructive.values().cloned().collect();
                if let Err(reason) = guard.authorize_destructive_leaves(&labels).await {
                    for index in destructive.keys() {
                        denials.insert(
                            *index,
                            format!(
                                "destructive authorization denied at the fleet boundary: {reason}"
                            ),
                        );
                    }
                }
            }
        }

        // Phase 3 — bounded exactly-once execution. Denied leaves never run.
        let executed = stream::iter(plan.leaves.into_iter().enumerate().map(|(index, leaf)| {
            let denial = denials.get(&index).cloned();
            async move {
                if let Some(reason) = denial {
                    return (index, denial_result(leaf, reason));
                }
                let started = Instant::now();
                let outcome = tokio::time::timeout(
                    self.fleet_instance_timeout,
                    Box::pin(execute_service_action(self, &leaf.action)),
                )
                .await;
                (index, fleet_result(leaf, started.elapsed(), outcome))
            }
        }))
        .buffer_unordered(FLEET_MAX_CONCURRENT)
        .collect::<Vec<_>>()
        .await;

        let mut executed = executed;
        executed.sort_by_key(|(index, _)| *index);
        Ok(executed.into_iter().map(|(_, result)| result).collect())
    }
}

fn fleet_action_targets_service(action: &YarrAction) -> bool {
    matches!(
        action,
        YarrAction::ServiceStatus { .. }
            | YarrAction::ApiGet { .. }
            | YarrAction::ApiPost { .. }
            | YarrAction::ApiPut { .. }
            | YarrAction::ApiDelete { .. }
            | YarrAction::Op { .. }
            | YarrAction::Curated { .. }
    )
}

fn denial_result(leaf: PlannedFleetLeaf, reason: String) -> FleetResult {
    let is_status = matches!(leaf.action, YarrAction::ServiceStatus { .. });
    FleetResult {
        service: leaf.service,
        kind: leaf.kind,
        ok: false,
        elapsed_ms: 0,
        latency_ms: is_status.then_some(0),
        reachable: is_status.then_some(false),
        version: None,
        truncated: false,
        summary: None,
        value: Value::Null,
        error: Some(reason),
    }
}

fn fleet_result(
    leaf: PlannedFleetLeaf,
    elapsed: Duration,
    outcome: std::result::Result<Result<Value>, tokio::time::error::Elapsed>,
) -> FleetResult {
    let is_status = matches!(leaf.action, YarrAction::ServiceStatus { .. });
    match outcome {
        Ok(Ok(value)) => {
            let version = is_status.then(|| status_version(&value)).flatten();
            let (value, summary) = truncate_fleet_value(value);
            FleetResult {
                service: leaf.service,
                kind: leaf.kind,
                ok: true,
                elapsed_ms: elapsed.as_millis(),
                latency_ms: is_status.then_some(elapsed.as_millis()),
                reachable: is_status.then_some(true),
                version,
                truncated: summary.is_some(),
                summary,
                value,
                error: None,
            }
        }
        Ok(Err(error)) => FleetResult {
            service: leaf.service,
            kind: leaf.kind,
            ok: false,
            elapsed_ms: elapsed.as_millis(),
            latency_ms: is_status.then_some(elapsed.as_millis()),
            reachable: is_status.then_some(false),
            version: None,
            truncated: false,
            summary: None,
            value: Value::Null,
            error: Some(error.to_string()),
        },
        Err(_) => FleetResult {
            service: leaf.service,
            kind: leaf.kind,
            ok: false,
            elapsed_ms: elapsed.as_millis(),
            latency_ms: is_status.then_some(elapsed.as_millis()),
            reachable: is_status.then_some(false),
            version: None,
            truncated: false,
            summary: None,
            value: Value::Null,
            error: Some("fleet instance timed out".to_owned()),
        },
    }
}

fn status_version(value: &Value) -> Option<Value> {
    value.get("version").cloned().or_else(|| {
        value
            .get("response")
            .and_then(|response| response.get("data"))
            .and_then(|data| data.get("version"))
            .cloned()
    })
}

fn truncate_fleet_value(value: Value) -> (Value, Option<FleetResultSummary>) {
    let observed_bytes = serde_json::to_vec(&value).map_or(0, |bytes| bytes.len());
    if observed_bytes <= FLEET_VALUE_LIMIT_BYTES {
        return (value, None);
    }
    let item_count = match &value {
        Value::Array(items) => items.len(),
        Value::Object(items) => items.len(),
        Value::Null => 0,
        _ => 1,
    };
    let value_type = match &value {
        Value::Array(_) => "array",
        Value::Object(_) => "object",
        Value::String(_) => "string",
        Value::Number(_) => "number",
        Value::Bool(_) => "boolean",
        Value::Null => "null",
    };
    (
        Value::Null,
        Some(FleetResultSummary {
            value_type,
            item_count,
            observed_bytes,
        }),
    )
}
