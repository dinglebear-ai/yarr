//! MCP tool dispatch — thin shims only.

use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
};

use lab_auth::AuthContext;
use rmcp::{RoleServer, service::Peer};
use serde_json::{Map, Value};

use crate::actions::{YarrAction, execute_service_action, required_scope_for_action};
use crate::app::codemode::CodeModeCallGuard;
use crate::server::AppState;

use super::schemas::YARR_TOOL_NAME;

pub(super) async fn execute_tool(
    state: &AppState,
    name: &str,
    args: Value,
    peer: &Peer<RoleServer>,
    auth: Option<AuthContext>,
    confirmed_destructive_targets: Option<Vec<String>>,
) -> anyhow::Result<Value> {
    if guarded_script(name, &args) {
        let destructive_authorization = match confirmed_destructive_targets {
            Some(targets) => {
                DestructiveAuthorization::Confirmed(Arc::new(Mutex::new(target_budget(targets))))
            }
            None => DestructiveAuthorization::Legacy,
        };
        let guard = Arc::new(McpCodeModeGuard {
            state: state.clone(),
            peer: peer.clone(),
            auth,
            destructive_authorization,
        });
        return dispatch_script_with_guard(state, name, args, guard).await;
    }
    dispatch_tool(state, name, args).await
}

pub(super) async fn preflight_script_destructive_targets(
    state: &AppState,
    name: &str,
    args: &Value,
    peer: &Peer<RoleServer>,
    auth: Option<AuthContext>,
) -> anyhow::Result<Vec<String>> {
    if !guarded_script(name, args) {
        return Ok(Vec::new());
    }
    let guard = Arc::new(McpCodeModeGuard {
        state: state.clone(),
        peer: peer.clone(),
        auth,
        destructive_authorization: DestructiveAuthorization::Planning,
    });
    match parse_script_action(name, args.clone())? {
        YarrAction::CodeMode { code } => {
            state
                .service
                .codemode_destructive_targets(&code, guard)
                .await
        }
        YarrAction::SnippetRun { name, input } => {
            state
                .service
                .snippet_destructive_targets(&name, &input, guard)
                .await
        }
        _ => Ok(Vec::new()),
    }
}

pub(super) fn direct_destructive_target(
    state: &AppState,
    tool_name: &str,
    action_name: &str,
    args: &Value,
) -> anyhow::Result<String> {
    let mut object = match args.clone() {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    object.insert("action".to_owned(), Value::String(action_name.to_owned()));
    if tool_name != YARR_TOOL_NAME {
        object.insert("service".to_owned(), Value::String(tool_name.to_owned()));
    }
    let action = YarrAction::from_mcp_args(&Value::Object(object))?;
    destructive_target(state, &action)
        .ok_or_else(|| anyhow::anyhow!("action is not destructive: {action_name}"))
}

fn guarded_script(name: &str, args: &Value) -> bool {
    name == YARR_TOOL_NAME
        || args
            .get("action")
            .and_then(Value::as_str)
            .is_some_and(|action| matches!(action, "codemode" | "snippet_run"))
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
    match parse_script_action(tool_name, args)? {
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

fn parse_script_action(tool_name: &str, args: Value) -> anyhow::Result<YarrAction> {
    let mut object = match args {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    if tool_name == YARR_TOOL_NAME {
        object.insert("action".to_owned(), Value::String("codemode".to_owned()));
    } else {
        object.insert("service".to_owned(), Value::String(tool_name.to_owned()));
    }
    YarrAction::from_mcp_args(&Value::Object(object))
}

enum DestructiveAuthorization {
    Legacy,
    Planning,
    Confirmed(Arc<Mutex<BTreeMap<String, usize>>>),
}

struct McpCodeModeGuard {
    state: AppState,
    peer: Peer<RoleServer>,
    auth: Option<AuthContext>,
    destructive_authorization: DestructiveAuthorization,
}

impl McpCodeModeGuard {
    fn check_scope(&self, action: &YarrAction) -> Result<(), String> {
        if let (Some(auth), Some(required)) =
            (self.auth.as_ref(), required_scope_for_action(action.name()))
            && !crate::actions::scopes_satisfy(&auth.scopes, required)
        {
            return Err(format!(
                "forbidden inner Code Mode action '{}': requires scope {required}",
                action.name()
            ));
        }
        Ok(())
    }
}

impl CodeModeCallGuard for McpCodeModeGuard {
    fn authorize<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            self.check_scope(action)?;
            let Some(target) = destructive_target(&self.state, action) else {
                return Ok(());
            };
            match &self.destructive_authorization {
                DestructiveAuthorization::Planning => Err(format!(
                    "destructive inner Code Mode action '{}' cannot execute during preflight",
                    action.name()
                )),
                DestructiveAuthorization::Confirmed(authorized) => {
                    consume_confirmed_target(authorized, &target).map_err(|_| {
                        format!(
                            "destructive inner Code Mode action '{}' exceeded the confirmed preflight occurrence count or was not present in the confirmed target set; nothing changed",
                            action.name()
                        )
                    })
                }
                DestructiveAuthorization::Legacy => {
                    if self.peer.supported_elicitation_modes().is_empty() {
                        return Err(format!(
                            "destructive inner Code Mode action '{}' requires an elicitation-capable MCP client; nothing changed",
                            action.name()
                        ));
                    }
                    let (_, service_name) = destructive_inner_call(&self.state, action);
                    if super::elicit::gate_destructive(&self.peer, action.name(), service_name)
                        .await
                        == super::elicit::DeleteGate::Declined
                    {
                        return Err(format!(
                            "destructive inner Code Mode action '{}' was not confirmed; nothing changed",
                            action.name()
                        ));
                    }
                    Ok(())
                }
            }
        })
    }

    fn authorize_planning_action<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move { self.check_scope(action) })
    }

    fn planned_destructive_target(&self, action: &YarrAction) -> Option<String> {
        destructive_target(&self.state, action)
    }
}

fn target_budget(targets: Vec<String>) -> BTreeMap<String, usize> {
    let mut budget = BTreeMap::new();
    for target in targets {
        *budget.entry(target).or_insert(0) += 1;
    }
    budget
}

fn consume_confirmed_target(
    authorized: &Mutex<BTreeMap<String, usize>>,
    target: &str,
) -> Result<(), ()> {
    let mut authorized = authorized.lock().map_err(|_| ())?;
    let Some(remaining) = authorized.get_mut(target) else {
        return Err(());
    };
    if *remaining == 0 {
        return Err(());
    }
    *remaining -= 1;
    Ok(())
}

fn destructive_target(state: &AppState, action: &YarrAction) -> Option<String> {
    if !destructive_inner_call(state, action).0 {
        return None;
    }
    let value = match action {
        YarrAction::ServiceStatus { service } => {
            serde_json::json!({"action": "service_status", "service": service})
        }
        YarrAction::ApiGet { service, path } => {
            serde_json::json!({"action": "api_get", "service": service, "path": path})
        }
        YarrAction::ApiPost {
            service,
            path,
            body,
        } => {
            serde_json::json!({"action": "api_post", "service": service, "path": path, "body": body})
        }
        YarrAction::ApiPut {
            service,
            path,
            body,
        } => {
            serde_json::json!({"action": "api_put", "service": service, "path": path, "body": body})
        }
        YarrAction::ApiDelete {
            service,
            path,
            body,
        } => {
            serde_json::json!({"action": "api_delete", "service": service, "path": path, "body": body})
        }
        YarrAction::Help => serde_json::json!({"action": "help"}),
        YarrAction::CodeMode { code } => serde_json::json!({"action": "codemode", "code": code}),
        YarrAction::SnippetList => serde_json::json!({"action": "snippet_list"}),
        YarrAction::SnippetSave {
            name,
            code,
            description,
        } => {
            serde_json::json!({"action": "snippet_save", "name": name, "code": code, "description": description})
        }
        YarrAction::SnippetRun { name, input } => {
            serde_json::json!({"action": "snippet_run", "name": name, "input": input})
        }
        YarrAction::SnippetDelete { name } => {
            serde_json::json!({"action": "snippet_delete", "name": name})
        }
        YarrAction::Op { service, op, args } => {
            serde_json::json!({"action": "op", "service": service, "op": op, "args": args})
        }
        YarrAction::Curated { name, params } => {
            serde_json::json!({"action": name, "params": params})
        }
    };
    Some(canonical_json(&value))
}

fn canonical_json(value: &Value) -> String {
    match value {
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_) => {
            serde_json::to_string(value).expect("JSON scalar serialization cannot fail")
        }
        Value::Array(values) => format!(
            "[{}]",
            values
                .iter()
                .map(canonical_json)
                .collect::<Vec<_>>()
                .join(",")
        ),
        Value::Object(map) => {
            let mut keys = map.keys().collect::<Vec<_>>();
            keys.sort();
            let fields = keys
                .into_iter()
                .map(|key| {
                    format!(
                        "{}:{}",
                        serde_json::to_string(key).expect("JSON key serialization cannot fail"),
                        canonical_json(&map[key])
                    )
                })
                .collect::<Vec<_>>()
                .join(",");
            format!("{{{fields}}}")
        }
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
    let generated_delete = match action {
        YarrAction::Op { service, op, .. } => state
            .service
            .kind_of(service)
            .ok()
            .flatten()
            .and_then(|kind| crate::openapi::find_operation(kind, op))
            .is_some_and(|spec| spec.method.is_delete()),
        _ => false,
    };
    (
        crate::actions::action_is_destructive(action.name()) || generated_delete,
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
