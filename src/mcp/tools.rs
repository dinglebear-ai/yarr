//! MCP tool dispatch — thin shims only.

use std::sync::Arc;

use lab_auth::AuthContext;
use rmcp::{RoleServer, service::Peer};
use serde_json::{Map, Value};

use crate::actions::{YarrAction, execute_service_action};
use crate::app::codemode::CodeModeCallGuard;
use crate::server::AppState;

use super::schemas::YARR_TOOL_NAME;

pub(super) async fn execute_tool(
    state: &AppState,
    name: &str,
    args: Value,
    peer: &Peer<RoleServer>,
    auth: Option<AuthContext>,
) -> anyhow::Result<Value> {
    let guarded_script = name == YARR_TOOL_NAME
        || args
            .get("action")
            .and_then(Value::as_str)
            .is_some_and(|action| matches!(action, "codemode" | "snippet_run"));
    if guarded_script {
        let guard = Arc::new(McpCodeModeGuard {
            state: state.clone(),
            peer: peer.clone(),
            auth,
        });
        return dispatch_script_with_guard(state, name, args, guard).await;
    }
    dispatch_tool(state, name, args).await
}

#[cfg(any(test, feature = "test-support"))]
#[doc(hidden)]
pub async fn execute_tool_without_peer_for_test(
    state: &AppState,
    name: &str,
    args: Value,
) -> anyhow::Result<Value> {
    dispatch_tool(state, name, args).await
}

/// Route a tool call. In `codemode` mode (default) the only tool `list_tools`
/// ever advertises is `yarr` (→ the `codemode` action) — but this function has
/// always accepted service-named calls too, since a `yarr` script's own
/// `callTool` dispatches through this same path internally, and it's also
/// exercised directly by the dispatch-layer test helper. In `flat`
/// [`crate::config::ToolMode`], `list_tools` advertises those service-named
/// tools for real, so this same branch becomes the live MCP surface instead of
/// an internal-only one.
async fn dispatch_tool(state: &AppState, name: &str, args: Value) -> anyhow::Result<Value> {
    if name == YARR_TOOL_NAME {
        return dispatch_yarr(state, args).await;
    }
    match state.service.kind_of(name)? {
        Some(_) => dispatch_service_tool(state, name, args).await,
        None => Err(anyhow::anyhow!("unknown tool: {name}")),
    }
}

/// The `yarr` tool's only param is `code`; it dispatches the `codemode` action.
async fn dispatch_yarr(state: &AppState, args: Value) -> anyhow::Result<Value> {
    let mut object = match args {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    object.insert("action".to_owned(), Value::String("codemode".to_owned()));
    let action = YarrAction::from_mcp_args(&Value::Object(object))?;
    execute_service_action(&state.service, &action).await
}

async fn dispatch_script_with_guard(
    state: &AppState,
    tool_name: &str,
    args: Value,
    guard: Arc<dyn CodeModeCallGuard>,
) -> anyhow::Result<Value> {
    let mut object = match args {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    if tool_name == YARR_TOOL_NAME {
        object.insert("action".to_owned(), Value::String("codemode".to_owned()));
    } else {
        object.insert("service".to_owned(), Value::String(tool_name.to_owned()));
    }
    let action = YarrAction::from_mcp_args(&Value::Object(object))?;
    match action {
        YarrAction::CodeMode { code } => state.service.codemode_with_guard(&code, guard).await,
        YarrAction::SnippetRun { name, input } => {
            state
                .service
                .snippet_run_with_guard(&name, &input, Some(guard))
                .await
        }
        _ => unreachable!("only Code Mode and snippet execution use the guarded script path"),
    }
}

struct McpCodeModeGuard {
    state: AppState,
    peer: Peer<RoleServer>,
    auth: Option<AuthContext>,
}

impl McpCodeModeGuard {
    /// Classify the action and enforce the token scope. Returns the
    /// classification so callers can branch on destructiveness without
    /// re-classifying.
    fn check_scope(
        &self,
        action: &YarrAction,
    ) -> Result<crate::actions::ActionClassification, String> {
        let classification = crate::actions::classify_action(&self.state.service, action)
            .map_err(|error| error.to_string())?;
        if let (Some(auth), Some(required_scope)) =
            (self.auth.as_ref(), classification.required_scope)
            && !crate::actions::scopes_satisfy(&auth.scopes, required_scope)
        {
            return Err(format!(
                "forbidden inner Code Mode action `{}`: requires scope {}",
                action.name(),
                required_scope
            ));
        }
        Ok(classification)
    }
}

impl CodeModeCallGuard for McpCodeModeGuard {
    fn authorize<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            let classification = self.check_scope(action)?;
            if !classification.destructive {
                return Ok(());
            }
            let service_name = action_service_name(action);
            if self.peer.supported_elicitation_modes().is_empty() {
                return Err(format!(
                    "destructive inner Code Mode action `{}` requires an elicitation-capable MCP client; nothing changed",
                    action.name()
                ));
            }
            if super::elicit::gate_destructive(&self.peer, action.name(), service_name).await
                == super::elicit::DeleteGate::Declined
            {
                return Err(format!(
                    "destructive inner Code Mode action `{}` was not confirmed; nothing changed",
                    action.name()
                ));
            }
            Ok(())
        })
    }

    /// Scope-only gate for one fleet leaf: no elicitation here. Destructive
    /// leaves are covered by the single batch decision below; everything else
    /// needs only scope.
    fn authorize_leaf_scope<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            self.check_scope(action)?;
            Ok(())
        })
    }

    /// One elicitation for the exact destructive leaf set of a single fleet
    /// invocation. Missing elicitation capability or any non-confirm answer
    /// denies the whole set (fail closed); approval covers only the listed
    /// concrete calls.
    fn authorize_destructive_leaves<'a>(
        &'a self,
        leaves: &'a [crate::fleet::FleetLeafLabel],
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            if leaves.is_empty() {
                return Ok(());
            }
            if self.peer.supported_elicitation_modes().is_empty() {
                return Err(format!(
                    "{} destructive fleet call(s) require an elicitation-capable MCP client; nothing changed",
                    leaves.len()
                ));
            }
            if super::elicit::gate_destructive_fleet(&self.peer, leaves).await
                == super::elicit::DeleteGate::Declined
            {
                return Err(format!(
                    "{} destructive fleet call(s) were not confirmed; nothing changed",
                    leaves.len()
                ));
            }
            Ok(())
        })
    }
}

fn action_service_name(action: &YarrAction) -> &str {
    match action {
        YarrAction::ServiceStatus { service }
        | YarrAction::ApiGet { service, .. }
        | YarrAction::ApiPost { service, .. }
        | YarrAction::ApiPut { service, .. }
        | YarrAction::ApiDelete { service, .. }
        | YarrAction::Op { service, .. } => service.as_str(),
        YarrAction::Curated { params, .. } => params
            .get("service")
            .and_then(Value::as_str)
            .unwrap_or(YARR_TOOL_NAME),
        _ => YARR_TOOL_NAME,
    }
}

async fn dispatch_service_tool(
    state: &AppState,
    service: &str,
    args: Value,
) -> anyhow::Result<Value> {
    // Thin shim: parse args and route EVERY action (including `help`) through the
    // shared service-layer dispatch. No special cases or business logic here.
    let args = inject_service(args, service);
    let action = YarrAction::from_mcp_args(&args)?;
    execute_service_action(&state.service, &action).await
}

fn inject_service(args: Value, service: &str) -> Value {
    let mut object = match args {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    object.insert("service".to_owned(), Value::String(service.to_owned()));
    Value::Object(object)
}

#[cfg(test)]
#[path = "tools_tests.rs"]
mod tests;
