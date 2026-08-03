//! Dispatch and semantic-search bridges for Code Mode scripts.

use serde_json::{Map, Value};

use super::{CodeModeCallGuard, FleetMapRequest};
use crate::{
    actions::{YarrAction, execute_service_action},
    app::YarrService,
};

impl YarrService {
    pub(super) async fn codemode_dispatch(
        &self,
        id: &str,
        params_json: &str,
        in_snippet: bool,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<String, String> {
        if id == "codemode" {
            return Err("codemode cannot invoke codemode".to_owned());
        }
        if in_snippet && id == "snippet_run" {
            return Err(
                "a snippet cannot run another snippet (codemode.run is one level deep)".to_owned(),
            );
        }
        if id == "__fleet_map" {
            let request: FleetMapRequest = serde_json::from_str(params_json)
                .map_err(|error| format!("invalid fleet.map request: {error}"))?;
            if let Some(guard) = guard.as_ref() {
                guard.authorize_fleet(&request).await?;
            }
            let value = self
                .fleet_map(&request)
                .await
                .map_err(|error| error.to_string())?;
            return serde_json::to_string(&value)
                .map_err(|error| format!("could not serialize fleet.map result: {error}"));
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
                .map_err(|error| format!("could not serialize `{id}` result: {error}"));
        }
        let value = Box::pin(execute_service_action(self, &action))
            .await
            .map_err(|error| error.to_string())?;
        serde_json::to_string(&value)
            .map_err(|error| format!("could not serialize `{id}` result: {error}"))
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
