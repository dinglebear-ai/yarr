//! Fleet planning and bounded dispatch in the business layer.

use std::time::{Duration, Instant};

use anyhow::{Result, anyhow, bail};
use futures_util::{StreamExt, stream};
use serde_json::Value;

use crate::{
    actions::{dispatch::validate_action_for_service, execute_service_action},
    app::codemode::CodeModeCallGuard,
    fleet::{
        FleetInvocation, FleetResult, FleetResultSummary, FleetSelector, PlannedFleetInvocation,
        PlannedFleetLeaf,
    },
};

use super::YarrService;

#[cfg(test)]
#[path = "fleet_tests.rs"]
mod tests;

const FLEET_MAX_CONCURRENT: usize = 4;
const FLEET_INSTANCE_TIMEOUT: Duration = Duration::from_secs(30);
const FLEET_VALUE_LIMIT_BYTES: usize = 8 * 1024;

impl YarrService {
    /// Resolve every fleet target and parse its immutable, service-bound action
    /// before authorization or upstream work. `Of` intentionally does not use the
    /// normal kind fallback resolver: fleet identities are exact configuration
    /// names, not aliases.
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

        let mut leaves = Vec::with_capacity(selected.len());
        for service in selected {
            let mut params = invocation.params.clone();
            params.insert("service".into(), Value::String(service.name.clone()));
            params.insert("action".into(), Value::String(invocation.action.clone()));
            let action = crate::YarrAction::from_mcp_args(&Value::Object(params))?;
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

    /// Dispatch a planned fleet from trusted local callers. Code Mode routes via
    /// `dispatch_planned_fleet` so each leaf remains guard-authorized.
    pub async fn dispatch_fleet(&self, invocation: FleetInvocation) -> Result<Vec<FleetResult>> {
        let plan = self.plan_fleet(invocation)?;
        Ok(self.dispatch_planned_fleet(plan, None).await)
    }

    pub async fn fleet_status(&self) -> Result<Vec<FleetResult>> {
        self.fleet_status_with_guard(None).await
    }

    pub(super) async fn fleet_status_with_guard(
        &self,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<Vec<FleetResult>> {
        let plan = self.plan_fleet(FleetInvocation {
            selector: FleetSelector::All { kind: None },
            action: "service_status".to_owned(),
            params: serde_json::Map::new(),
        })?;
        Ok(self.dispatch_planned_fleet(plan, guard).await)
    }

    pub(super) async fn dispatch_planned_fleet(
        &self,
        plan: PlannedFleetInvocation,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Vec<FleetResult> {
        let completed = stream::iter(plan.leaves.into_iter().enumerate().map(|(index, leaf)| {
            let guard = guard.clone();
            async move {
                let started = Instant::now();
                let outcome = tokio::time::timeout(FLEET_INSTANCE_TIMEOUT, async {
                    if let Some(guard) = guard.as_ref() {
                        guard
                            .authorize(&leaf.action)
                            .await
                            .map_err(anyhow::Error::msg)?;
                    }
                    Box::pin(execute_service_action(self, &leaf.action)).await
                })
                .await;
                (index, fleet_result(leaf, started.elapsed(), outcome))
            }
        }))
        .buffer_unordered(FLEET_MAX_CONCURRENT)
        .collect::<Vec<_>>()
        .await;
        let mut completed = completed;
        completed.sort_by_key(|(index, _)| *index);
        completed.into_iter().map(|(_, result)| result).collect()
    }
}

fn fleet_action_targets_service(action: &crate::YarrAction) -> bool {
    matches!(
        action,
        crate::YarrAction::ServiceStatus { .. }
            | crate::YarrAction::ApiGet { .. }
            | crate::YarrAction::ApiPost { .. }
            | crate::YarrAction::ApiPut { .. }
            | crate::YarrAction::ApiDelete { .. }
            | crate::YarrAction::Op { .. }
            | crate::YarrAction::Curated { .. }
    )
}

fn fleet_result(
    leaf: PlannedFleetLeaf,
    elapsed: Duration,
    outcome: std::result::Result<Result<Value>, tokio::time::error::Elapsed>,
) -> FleetResult {
    let is_status = matches!(leaf.action, crate::YarrAction::ServiceStatus { .. });
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
