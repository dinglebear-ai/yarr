//! Dispatch: map a parsed `YarrAction` to the corresponding service method.
//!
//! This is the SHARED dispatch path for BOTH the CLI and MCP shims, so the
//! action×kind validation guard lives here (LD4 / architecture F4-a) rather than
//! in `mcp/rmcp_server.rs` — the CLI never touches that file. Every action that
//! targets a service is checked against the resolved [`ServiceKind`](crate::config::ServiceKind) before it
//! runs, so a curated command can never reach an incompatible kind regardless of
//! which transport invoked it.

use anyhow::Result;
use serde_json::Value;

use super::help::help_text;
use super::model::{ValidationError, YarrAction};
use super::registry::{action_allowed_for_kind, curated_command, valid_actions_for_kind};
use crate::app::YarrService;

/// Validate that `action` (by name) may run against the service named `service_name`.
///
/// Resolves the configured service's [`ServiceKind`](crate::config::ServiceKind) and calls
/// [`action_allowed_for_kind`]. On mismatch it returns
/// [`ValidationError::ActionNotValidForKind`], which carries the valid-action
/// list so its `Display` teaches the agent what it *can* run (AN-2). Generic
/// infra actions are allowed for every kind, so this is a no-op for them.
///
/// When the service name does not resolve to a configured kind, validation is
/// skipped here and the downstream service lookup surfaces the canonical
/// "unknown service" error instead.
pub fn validate_action_for_service(
    service: &YarrService,
    action_name: &str,
    service_name: &str,
) -> Result<()> {
    let Some(kind) = service.kind_of(service_name)? else {
        return Ok(());
    };
    if action_allowed_for_kind(action_name, kind) {
        return Ok(());
    }
    Err(ValidationError::ActionNotValidForKind {
        action: action_name.to_owned(),
        kind: kind.as_str().to_owned(),
        valid_actions: valid_actions_for_kind(kind)
            .into_iter()
            .map(ToOwned::to_owned)
            .collect(),
    }
    .into())
}

/// The service name an action targets, if any. Infra actions that don't address
/// a service (`help`) return `None`.
fn target_service(action: &YarrAction) -> Option<&str> {
    match action {
        // Infra actions that don't address a single service: `help` and `codemode`
        // (the script reaches services per-call via the baked-in `<service>.<verb>`
        // callables).
        YarrAction::Help
        | YarrAction::CodeMode { .. }
        | YarrAction::SnippetList
        | YarrAction::SnippetSave { .. }
        | YarrAction::SnippetRun { .. }
        | YarrAction::SnippetDelete { .. } => None,
        YarrAction::ServiceStatus { service }
        | YarrAction::ApiGet { service, .. }
        | YarrAction::ApiPost { service, .. }
        | YarrAction::ApiPut { service, .. }
        | YarrAction::ApiDelete { service, .. }
        | YarrAction::Op { service, .. } => Some(service),
        // Curated commands all carry `service` in their raw params (validated at
        // parse time), so the action×kind guard can resolve the kind for them too.
        YarrAction::Curated { params, .. } => params
            .get("service")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|s| !s.is_empty()),
    }
}

pub async fn execute_service_action(service: &YarrService, action: &YarrAction) -> Result<Value> {
    // Shared action×kind guard: runs for every action that targets a service,
    // on both the CLI and MCP paths. No-op for generic/infra actions.
    if let Some(service_name) = target_service(action) {
        validate_action_for_service(service, action.name(), service_name)?;
        if action_mutates(service, action)? && service.is_read_only(service_name)? {
            anyhow::bail!(
                "service `{service_name}` is read-only via YARR_FLEET_READONLY; mutating action `{}` was refused",
                action.name()
            );
        }
    }
    match action {
        YarrAction::ServiceStatus { service: name } => service.service_status(name).await,
        YarrAction::ApiGet {
            service: name,
            path,
        } => service.api_get(name, path).await,
        // L2-perf: `action` is borrowed (`&YarrAction`) so the passthrough
        // `body` cannot be moved out without changing this shared dispatch
        // signature (the CLI and MCP shims both pass `&action`). This is a single
        // bounded clone of one request body per call — intentional, not a hot loop.
        YarrAction::ApiPost {
            service: name,
            path,
            body,
        } => service.api_post(name, path, body.clone()).await,
        YarrAction::ApiPut {
            service: name,
            path,
            body,
        } => service.api_put(name, path, body.clone()).await,
        YarrAction::ApiDelete {
            service: name,
            path,
            body,
        } => service.api_delete(name, path, body.clone()).await,
        // Help returns the generated Markdown wrapped in the canonical
        // `{ "help": <text> }` shape the MCP client expects. (The CLI `help`
        // command renders the structured [`rest_help`] payload directly and does
        // not route through here.)
        YarrAction::Help => Ok(serde_json::json!({ "help": help_text() })),
        // Generated OpenAPI operation: dispatch to the shared executor, which builds
        // the upstream request from the generated OperationSpec table.
        YarrAction::Op {
            service: name,
            op,
            args,
        } => service.execute_operation(name, op, args).await,
        // Code Mode runs a JS script that calls back into this same dispatch path;
        // all logic lives in the app layer.
        YarrAction::CodeMode { code } => service.codemode(code).await,
        YarrAction::SnippetList => service.snippet_list().await,
        YarrAction::SnippetSave {
            name,
            code,
            description,
        } => {
            service
                .snippet_save(name, code, description.as_deref())
                .await
        }
        YarrAction::SnippetRun { name, input } => service.snippet_run(name, input).await,
        YarrAction::SnippetDelete { name } => service.snippet_delete(name).await,
        // Curated commands route by name to their registry descriptor's handler.
        // The action×kind guard above already rejected incompatible kinds, so the
        // handler runs only for a service whose capability matches the command.
        YarrAction::Curated { name, params } => {
            let cmd = curated_command(name)
                .ok_or_else(|| anyhow::anyhow!("curated command `{name}` is not registered"))?;
            (cmd.handler)(service, params).await
        }
    }
}

fn action_mutates(service: &YarrService, action: &YarrAction) -> Result<bool> {
    Ok(match action {
        YarrAction::ApiPost { .. } | YarrAction::ApiPut { .. } | YarrAction::ApiDelete { .. } => {
            true
        }
        YarrAction::Op {
            service: service_name,
            op,
            ..
        } => service
            .kind_of(service_name)?
            .and_then(|kind| crate::openapi::classify_operation(kind, op))
            .is_some_and(|safety| safety != crate::openapi::OperationSafety::Read),
        YarrAction::Curated { name, .. } => curated_command(name).is_some_and(|cmd| cmd.mutates),
        _ => false,
    })
}

#[cfg(test)]
#[path = "dispatch_tests.rs"]
mod tests;
