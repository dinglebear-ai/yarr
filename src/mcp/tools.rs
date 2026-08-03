//! MCP tool dispatch — thin shims only.

use std::sync::Arc;

use lab_auth::AuthContext;
use rmcp::{RoleServer, service::Peer};
use serde_json::{Map, Value};

use crate::actions::{YarrAction, execute_service_action, required_scope_for_action};
use crate::app::codemode::{CodeModeCallGuard, FleetMapRequest};
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

impl CodeModeCallGuard for McpCodeModeGuard {
    fn authorize<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            if let (Some(auth), Some(required)) =
                (self.auth.as_ref(), required_scope_for_action(action.name()))
                && !crate::actions::scopes_satisfy(&auth.scopes, required)
            {
                return Err(format!(
                    "forbidden inner Code Mode action `{}`: requires scope {required}",
                    action.name()
                ));
            }

            let (destructive, service_name) = destructive_inner_call(&self.state, action);
            if !destructive {
                return Ok(());
            }
            if self.peer.supported_elicitation_modes().is_empty() {
                return Err(format!(
                    "destructive inner Code Mode action `{}` requires an elicitation-capable MCP client; nothing changed",
                    action.name()
                ));
            }
            if super::elicit::gate_destructive(
                &self.peer,
                action.name(),
                &[service_name.to_owned()],
                self.state.config.destructive_fanout_max,
            )
            .await
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

    fn authorize_fleet<'a>(
        &'a self,
        request: &'a FleetMapRequest,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            let authorization = self
                .state
                .service
                .fleet_authorization(request)
                .map_err(|error| error.to_string())?;
            if let (Some(auth), Some(required)) = (
                self.auth.as_ref(),
                required_scope_for_action(authorization.scope_action),
            ) && !crate::actions::scopes_satisfy(&auth.scopes, required)
            {
                return Err(format!(
                    "forbidden fleet action `{}`: requires scope {required}",
                    authorization.action
                ));
            }
            if !authorization.destructive || authorization.targets.is_empty() {
                return Ok(());
            }
            let targets = super::elicit::validate_destructive_targets(
                &authorization.targets,
                self.state.config.destructive_fanout_max,
            )?;
            if self.peer.supported_elicitation_modes().is_empty() {
                return Err(format!(
                    "destructive fleet action `{}` requires an elicitation-capable MCP client; nothing changed",
                    authorization.action
                ));
            }
            if super::elicit::gate_destructive(
                &self.peer,
                &authorization.action,
                &targets,
                self.state.config.destructive_fanout_max,
            )
            .await
                == super::elicit::DeleteGate::Declined
            {
                return Err(format!(
                    "destructive fleet action `{}` was not confirmed; nothing changed",
                    authorization.action
                ));
            }
            Ok(())
        })
    }
}

fn destructive_inner_call<'a>(state: &AppState, action: &'a YarrAction) -> (bool, &'a str) {
    let service = match action {
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
    };
    let generated_destructive = match action {
        YarrAction::Op { service, op, .. } => {
            state
                .service
                .kind_of(service)
                .ok()
                .flatten()
                .and_then(|kind| crate::openapi::classify_operation(kind, op))
                == Some(crate::openapi::OperationSafety::Destructive)
        }
        _ => false,
    };
    (
        crate::actions::action_is_destructive(action.name()) || generated_destructive,
        service,
    )
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
