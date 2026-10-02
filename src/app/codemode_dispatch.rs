//! Dispatch and semantic-search bridges for Code Mode scripts.

use serde_json::{Map, Value, json};

use super::{CodeModeCallGuard, DispatchOutcome};
use crate::{
    actions::{YarrAction, execute_service_action},
    app::YarrService,
    fleet::{FleetInvocation, FleetSelector},
};

/// Internal engine id for the `fleet.map` bridge (emitted by the `fleet`
/// preamble global; never a registry action).
const FLEET_MAP_ID: &str = "__yarrFleetMap";
/// Internal engine id for the `fleet.status` bridge.
const FLEET_STATUS_ID: &str = "__yarrFleetStatus";

impl YarrService {
    pub(super) async fn codemode_dispatch(
        &self,
        id: &str,
        params_json: &str,
        in_snippet: bool,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<DispatchOutcome, String> {
        if id == "codemode" {
            return Err("codemode cannot invoke codemode".to_owned());
        }
        if id == FLEET_MAP_ID {
            let invocation = crate::fleet::parse_private_invocation(params_json)?;
            let plan = self
                .plan_fleet(invocation)
                .map_err(|error| error.to_string())?;
            return self.dispatch_fleet_bridge(plan, guard).await;
        }
        if id == FLEET_STATUS_ID {
            let plan = self
                .plan_fleet(FleetInvocation {
                    selector: FleetSelector::All { kind: None },
                    action: "service_status".to_owned(),
                    params: Map::new(),
                })
                .map_err(|error| error.to_string())?;
            return self.dispatch_fleet_bridge(plan, guard).await;
        }
        if in_snippet && id == "snippet_run" {
            return Err(
                "a snippet cannot run another snippet (codemode.run is one level deep)".to_owned(),
            );
        }
        let params: Value = serde_json::from_str(params_json)
            .map_err(|error| format!("invalid params for `{id}`: {error}"))?;
        let mut args: Map<String, Value> = match params {
            Value::Object(map) => map,
            _ => return Err(format!("params for `{id}` must be a JSON object")),
        };
        args.insert("action".to_owned(), Value::String(id.to_owned()));

        let action =
            YarrAction::from_mcp_args(&Value::Object(args)).map_err(|error| error.to_string())?;
        if let Some(guard) = guard.as_ref() {
            guard.authorize(&action).await?;
        }
        if let YarrAction::SnippetRun { name, input } = &action {
            let value = self
                .snippet_run_with_guard(name, input, guard)
                .await
                .map_err(|error| error.to_string())?;
            return serde_json::to_string(&value)
                .map(DispatchOutcome::value_only)
                .map_err(|error| format!("could not serialize `{id}` result: {error}"));
        }
        let value = Box::pin(execute_service_action(self, &action))
            .await
            .map_err(|error| error.to_string())?;
        serde_json::to_string(&value)
            .map(DispatchOutcome::value_only)
            .map_err(|error| format!("could not serialize `{id}` result: {error}"))
    }

    /// Run one frozen fleet leaf set through the bounded dispatcher and shape
    /// the bridge response: the serialized per-leaf results plus one audit row
    /// per real leaf action (see [`DispatchOutcome`]).
    async fn dispatch_fleet_bridge(
        &self,
        plan: crate::fleet::PlannedFleetInvocation,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<DispatchOutcome, String> {
        let leaf_ids: Vec<(String, String)> = plan
            .leaves
            .iter()
            .map(|leaf| (leaf.service.clone(), leaf.action.name().to_owned()))
            .collect();
        let results = self
            .dispatch_fleet_plan(plan, guard)
            .await
            .map_err(|error| format!("{error:#}"))?;
        let leaf_calls: Vec<Value> = leaf_ids
            .into_iter()
            .zip(results.iter())
            .map(|((service, action), result)| {
                json!({
                    "action": action,
                    "service": service,
                    "ok": result.ok,
                    "error": result.error,
                    "elapsed_ms": result.elapsed_ms,
                })
            })
            .collect();
        let value = serde_json::to_string(&results)
            .map_err(|error| format!("could not serialize fleet result: {error}"))?;
        Ok(DispatchOutcome { value, leaf_calls })
    }

    pub(super) async fn codemode_semantic_search(&self, query: &str) -> String {
        let catalog = self.codemode_catalog();
        let scores = crate::codemode::semantic_scores(
            self.semantic_cache(),
            crate::codemode::tei_url().as_deref(),
            &catalog,
            query,
        )
        .await;
        serde_json::to_string(&scores).unwrap_or_else(|_| "{}".to_owned())
    }
}

#[cfg(test)]
#[path = "codemode_dispatch_tests.rs"]
mod tests;
