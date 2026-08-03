//! `YarrRmcpServer` — the `ServerHandler` implementation.
//!
//! This is the adapter between the rmcp crate and Yarr's service layer. It:
//!   - Advertises tools, resources, and prompts to MCP clients
//!   - Enforces auth scopes on every call
//!   - Delegates business logic to `tools.rs` → `app.rs` → `yarr.rs`
//!
//! Update action metadata in `src/actions/` to keep schemas, scope rules, and
//! dispatch in sync.

use std::{borrow::Cow, sync::Arc, time::Instant};

use lab_auth::AuthContext;
use rmcp::{
    ErrorData, RoleServer, ServerHandler,
    model::{
        CallToolRequestParams, CallToolResponse, CallToolResult, ContentBlock,
        GetPromptRequestParams, GetPromptResponse, Implementation, ListPromptsResult,
        ListResourcesResult, ListToolsResult, PaginatedRequestParams, ReadResourceRequestParams,
        ReadResourceResponse, ReadResourceResult, Resource, ResourceContents, ServerCapabilities,
        ServerInfo, Tool,
    },
    service::{Peer, RequestContext},
};
use serde_json::{Map, Value};

use crate::{
    actions::{ValidationError, is_known_action, required_scope_for_action},
    token_limit,
};

use crate::server::{AppState, AuthPolicy};

use super::{elicit, prompts, schemas::tool_definitions, tools::execute_tool};

// ── server ────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct YarrRmcpServer {
    state: AppState,
}

pub fn rmcp_server(state: AppState) -> YarrRmcpServer {
    warn_if_unscoped_with_mutations(&state);
    YarrRmcpServer { state }
}

/// S5: `TrustedGatewayUnscoped` disables auth middleware *and* bypasses scope
/// checks entirely (see `require_auth_context`). When mutating actions are
/// registered, emit a one-time startup warning so operators know writes are not
/// scope-gated in this mode. Note that plain writes (and destructive deletes)
/// run with no per-call scope gate at all in this mode — elicitation is a UX
/// confirmation, not an authz boundary — so the gateway is the sole authz
/// boundary for writes.
fn warn_if_unscoped_with_mutations(state: &AppState) {
    if !matches!(state.auth_policy, AuthPolicy::TrustedGatewayUnscoped) {
        return;
    }
    let mutating: Vec<&str> = crate::actions::all_action_names()
        .into_iter()
        .filter(|name| {
            crate::actions::required_scope_for_action(name) == Some(crate::actions::WRITE_SCOPE)
        })
        .collect();
    if mutating.is_empty() {
        return;
    }
    tracing::warn!(
        mutating_actions = %mutating.join(", "),
        "AuthPolicy::TrustedGatewayUnscoped bypasses scope checks; mutating actions (including \
         destructive deletes) are NOT scope-gated. Ensure the upstream gateway enforces authz."
    );
}

impl ServerHandler for YarrRmcpServer {
    // ── tools ─────────────────────────────────────────────────────────────────

    async fn list_tools(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListToolsResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        let tools = rmcp_tool_definitions_for_service(&self.state)?;
        tracing::debug!(tool_count = tools.len(), "MCP tools listed");
        Ok(ListToolsResult {
            tools,
            ..Default::default()
        })
    }

    async fn call_tool(
        &self,
        request: CallToolRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<CallToolResponse, ErrorData> {
        let tool_name = request.name.to_string();
        let auth = require_auth_context(&self.state, &context)?;
        // Tool identity is authoritative. The default `yarr` tool always means
        // write-scoped Code Mode and never accepts a caller-selected `action`.
        // Flat mode accepts only the exact configured tool names it advertises.
        let action_opt = effective_action(&self.state, &tool_name, request.arguments.as_ref())?;
        if let Some(action_str) = action_opt.as_deref() {
            reject_unknown_action_before_scope(action_str)?;
        }
        // Only scope-check when a known action is present; dispatch_yarr will
        // return the validation error for a missing action below.
        if let (Some(auth), Some(action_str)) = (auth, action_opt.as_deref())
            && let Some(required_scope) = required_scope_for_action(action_str)
        {
            check_scope(auth, required_scope, action_str)?;
        }

        let action: String = action_opt.unwrap_or_default();

        let arguments = request
            .arguments
            .map(Value::Object)
            .unwrap_or_else(|| Value::Object(Map::new()));

        // Clone the peer for client interaction (elicitation) and the dispatcher
        // signature.
        let peer: Peer<RoleServer> = context.peer.clone();

        // Destructive-delete gate (MCP-only). Before a destructive action
        // dispatches, ask the connected client to confirm via elicitation. The
        // tool name IS the service name (the MCP tool is service-named; `action`
        // is a parameter). `action_is_destructive` only recognizes literal
        // destructive action names — it has no notion of `op`'s underlying HTTP
        // method — so a generated DELETE op dispatched via `action=op` (reachable
        // directly here in `flat` tool mode; in `codemode` mode `op` is only ever
        // called from inside a script, which never reaches `call_tool` at all —
        // see `codemode_dispatch`) is checked separately by
        // `is_destructive_op_call`.
        if (crate::actions::action_is_destructive(&action)
            || (action == "op" && is_destructive_op_call(&self.state, &tool_name, &arguments)))
            && elicit::gate_destructive(
                &peer,
                &action,
                std::slice::from_ref(&tool_name),
                self.state.config.destructive_fanout_max,
            )
            .await
                == elicit::DeleteGate::Declined
        {
            tracing::info!(
                tool = %tool_name,
                action = %action,
                "destructive action declined via elicitation; nothing changed"
            );
            return declined_result(&action).map(Into::into);
        }

        let started = Instant::now();
        tracing::info!(tool = %tool_name, action = %action, "MCP tool execution started");

        match execute_tool(&self.state, &tool_name, arguments, &peer, auth.cloned()).await {
            Ok(result) => {
                tracing::info!(
                    tool = %tool_name,
                    elapsed_ms = started.elapsed().as_millis(),
                    "MCP tool execution completed"
                );
                tool_result_from_json(result).map(Into::into)
            }
            Err(error) if crate::actions::is_validation_error(&error) => {
                tracing::warn!(
                    tool = %tool_name,
                    elapsed_ms = started.elapsed().as_millis(),
                    "MCP tool rejected invalid params"
                );
                Err(ErrorData::invalid_params(error.to_string(), None))
            }
            Err(error) => {
                tracing::error!(
                    tool = %tool_name,
                    elapsed_ms = started.elapsed().as_millis(),
                    error = %error,
                    "MCP tool execution failed"
                );
                Ok(tool_error_result(&tool_name, &action, &error).into())
            }
        }
    }

    // ── resources ─────────────────────────────────────────────────────────────

    async fn list_resources(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListResourcesResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        Ok(ListResourcesResult {
            resources: vec![schema_resource()],
            ..Default::default()
        })
    }

    async fn read_resource(
        &self,
        request: ReadResourceRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<ReadResourceResponse, ErrorData> {
        require_auth_context(&self.state, &context)?;
        if request.uri != SCHEMA_RESOURCE_URI {
            return Err(ErrorData::invalid_params(
                format!("unknown resource: {}", request.uri),
                None,
            ));
        }
        let schema = tool_definitions();
        let text = serde_json::to_string_pretty(&schema)
            .map_err(|e| ErrorData::internal_error(format!("serialization error: {e}"), None))?;
        Ok(ReadResourceResult::new(vec![
            ResourceContents::text(text, SCHEMA_RESOURCE_URI).with_mime_type("application/json"),
        ])
        .into())
    }

    // ── prompts ───────────────────────────────────────────────────────────────

    async fn list_prompts(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListPromptsResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        Ok(prompts::list_prompts())
    }

    async fn get_prompt(
        &self,
        request: GetPromptRequestParams,
        context: RequestContext<RoleServer>,
    ) -> Result<GetPromptResponse, ErrorData> {
        require_auth_context(&self.state, &context)?;
        prompts::get_prompt(request)
            .map(Into::into)
            .map_err(|e| ErrorData::invalid_params(e.to_string(), None))
    }

    // ── server info ───────────────────────────────────────────────────────────

    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(
            ServerCapabilities::builder()
                .enable_tools()
                .enable_resources()
                .enable_prompts()
                .build(),
        )
        .with_server_info(Implementation::new(
            self.state.config.server_name.clone(),
            env!("CARGO_PKG_VERSION"),
        ))
    }
}

// ── resource definitions ──────────────────────────────────────────────────────

/// URI for the Yarr MCP tool schema resource.
const SCHEMA_RESOURCE_URI: &str = "yarr://schema/mcp-tool";

#[path = "rmcp_server_definitions.rs"]
mod definitions;
use definitions::*;
#[path = "rmcp_server_errors.rs"]
mod errors;
use errors::*;
