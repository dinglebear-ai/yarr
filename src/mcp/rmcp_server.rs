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
        CacheScope, CallToolRequestParams, CallToolResponse, CallToolResult, ContentBlock,
        GetPromptRequestParams, GetPromptResponse, Implementation, ListPromptsResult,
        ListResourceTemplatesResult, ListResourcesResult, ListToolsResult, PaginatedRequestParams,
        ProtocolVersion, ReadResourceRequestParams, ReadResourceResponse, ReadResourceResult,
        Resource, ResourceContents, ServerCapabilities, ServerInfo, Tool,
    },
    service::{Peer, RequestContext},
};
use serde_json::{Map, Value};

use crate::{
    actions::{ValidationError, is_known_action, required_scope_for_action},
    token_limit,
};

use crate::server::{AppState, AuthPolicy};

use super::{
    elicit, mrtr, prompts,
    schemas::tool_definitions,
    tools::{direct_destructive_target, execute_tool, preflight_script_destructive_targets},
};

/// SEP-2549 (`ttlMs`/`cacheScope`) is required on `tools/list`, `resources/list`,
/// `resources/templates/list`, `resources/read`, and `prompts/list` for clients
/// that negotiate MCP protocol version `2026-07-28` — omitting them (rmcp's
/// `Default::default()` leaves both `None`, which then don't get serialized)
/// makes a spec-strict client at that protocol version reject the whole result.
///
/// `tools/list`, `resources/list`, `resources/templates/list`, and
/// `resources/read` are all derived from config loaded once at startup, so a
/// 5-minute freshness hint is safe for all four.
pub(crate) const CACHEABLE_RESULT_TTL_MS: u64 = 300_000;

/// The prompt list is static per binary (see `prompts::list_prompts`), so it
/// can carry a longer freshness hint than the config-derived results above.
pub(crate) const PROMPTS_LIST_TTL_MS: u64 = 600_000;

/// MCP revisions Yarr deliberately implements and tests. Keep this list owned
/// here instead of inheriting `rmcp::ProtocolVersion::KNOWN_VERSIONS`: an SDK
/// upgrade must never silently opt the server into a new protocol contract.
pub(crate) const SUPPORTED_PROTOCOL_VERSIONS: &[ProtocolVersion] = &[
    ProtocolVersion::V_2024_11_05,
    ProtocolVersion::V_2025_03_26,
    ProtocolVersion::V_2025_06_18,
    ProtocolVersion::V_2025_11_25,
    ProtocolVersion::V_2026_07_28,
];

/// Types that carry SEP-2549's `ttlMs`/`cacheScope` cache hints: every
/// list/read result this server can return that's covered by the spec's
/// `CacheableResult` interface. A trait (rather than a call site per method)
/// keeps "which results are cacheable" and the version gate in
/// [`with_cache_hints`] in one place, instead of duplicated per handler.
trait CacheableResult: Sized {
    fn with_ttl_ms(self, ttl_ms: u64) -> Self;
    fn with_cache_scope(self, cache_scope: CacheScope) -> Self;
}

macro_rules! impl_cacheable_result {
    ($($t:ty),+ $(,)?) => {
        $(
            impl CacheableResult for $t {
                fn with_ttl_ms(self, ttl_ms: u64) -> Self {
                    <$t>::with_ttl_ms(self, ttl_ms)
                }
                fn with_cache_scope(self, cache_scope: CacheScope) -> Self {
                    <$t>::with_cache_scope(self, cache_scope)
                }
            }
        )+
    };
}

impl_cacheable_result!(
    ListToolsResult,
    ListResourcesResult,
    ListResourceTemplatesResult,
    ReadResourceResult,
    ListPromptsResult,
);

/// Attach SEP-2549 cache hints to `result` when the caller negotiated MCP
/// protocol version `2026-07-28` or later — the same gate rmcp's own
/// `#[tool_handler]`/`#[prompt_handler]` macros apply (see
/// `rmcp-macros::tool_handler`), which yarr's hand-written `ServerHandler`
/// doesn't get for free. A caller on an older protocol version gets the
/// previous wire format unchanged: the fields are additive and ignored by a
/// client that doesn't understand SEP-2549, but there's no reason to promise a
/// freshness/cache-sharing contract to a client that never negotiated it.
///
/// `cache_scope` is deliberately [`CacheScope::Private`], not rmcp's default
/// `Public` — yarr is commonly deployed in `flat` tool mode behind a shared
/// gateway/cache, where `Public` would let an intermediary serve one caller's
/// `tools/list` (service names) or schema `resources/read` to a different,
/// unauthenticated caller. Every handler here calls `require_auth_context`
/// first and returns content that doesn't vary per caller, so this isn't a
/// cross-user data leak within one process — the risk is purely what a
/// downstream cache is permitted to do with the response.
fn with_cache_hints<T: CacheableResult>(
    result: T,
    context: &RequestContext<RoleServer>,
    ttl_ms: u64,
) -> T {
    let supports_cache_hints = context
        .protocol_version()
        .is_some_and(|version| version >= ProtocolVersion::V_2026_07_28);
    if supports_cache_hints {
        result
            .with_ttl_ms(ttl_ms)
            .with_cache_scope(CacheScope::Private)
    } else {
        result
    }
}

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
        Ok(with_cache_hints(
            ListToolsResult {
                tools,
                ..Default::default()
            },
            &context,
            CACHEABLE_RESULT_TTL_MS,
        ))
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

        let request_state = request.request_state.clone();
        let input_responses = request.input_responses.clone();
        let arguments = request
            .arguments
            .map(Value::Object)
            .unwrap_or_else(|| Value::Object(Map::new()));

        // Clone the peer for client interaction (elicitation) and the dispatcher
        // signature.
        let peer: Peer<RoleServer> = context.peer.clone();

        // Destructive confirmation is transport-era aware. Modern 2026-07-28
        // Code Mode first runs a side-effect-free preflight so MRTR confirms the
        // exact destructive target set before the real script executes once.
        let modern = context
            .protocol_version()
            .is_some_and(|version| version >= ProtocolVersion::V_2026_07_28);
        let modern_script = modern && matches!(action.as_str(), "codemode" | "snippet_run");
        let script_targets = if modern_script {
            preflight_script_destructive_targets(
                &self.state,
                &tool_name,
                &arguments,
                &peer,
                auth.cloned(),
            )
            .await
            .map_err(|error| {
                ErrorData::invalid_params(format!("Code Mode preflight failed: {error}"), None)
            })?
        } else {
            Vec::new()
        };

        let destructive = crate::actions::action_is_destructive(&action)
            || (action == "op" && is_destructive_op_call(&self.state, &tool_name, &arguments));
        let confirmation_targets = if destructive {
            vec![
                direct_destructive_target(&self.state, &tool_name, &action, &arguments)
                    .map_err(|error| ErrorData::invalid_params(error.to_string(), None))?,
            ]
        } else {
            script_targets.clone()
        };

        if !confirmation_targets.is_empty() {
            match mrtr::gate_destructive(
                &context,
                auth,
                mrtr::DestructiveRequest::new(
                    &tool_name,
                    &action,
                    &arguments,
                    &confirmation_targets,
                ),
                request_state.as_deref(),
                input_responses.as_ref(),
            )? {
                mrtr::DeleteGate::InputRequired(result) => return Ok(result.into()),
                mrtr::DeleteGate::Proceed => {}
                mrtr::DeleteGate::Declined => {
                    tracing::info!(
                        tool = %tool_name,
                        action = %action,
                        "destructive action declined via MRTR; nothing changed"
                    );
                    return declined_result(&action).map(Into::into);
                }
                mrtr::DeleteGate::Legacy => {
                    if destructive
                        && elicit::gate_destructive(&peer, &action, &tool_name).await
                            == elicit::DeleteGate::Declined
                    {
                        tracing::info!(
                            tool = %tool_name,
                            action = %action,
                            "destructive action declined via elicitation; nothing changed"
                        );
                        return declined_result(&action).map(Into::into);
                    }
                }
            }
        } else if modern && (request_state.is_some() || input_responses.is_some()) {
            return Err(ErrorData::invalid_params(
                "requestState/inputResponses supplied but this tool call no longer requires confirmation",
                None,
            ));
        }

        // Some(empty) is intentional for modern scripts. Runtime then rejects a
        // destructive branch that was absent during preflight instead of falling
        // back to legacy elicitation.
        let confirmed_script_targets = modern_script.then_some(script_targets);

        let started = Instant::now();
        tracing::info!(tool = %tool_name, action = %action, "MCP tool execution started");

        match execute_tool(
            &self.state,
            &tool_name,
            arguments,
            &peer,
            auth.cloned(),
            confirmed_script_targets,
        )
        .await
        {
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
        Ok(with_cache_hints(
            ListResourcesResult {
                resources: vec![schema_resource()],
                ..Default::default()
            },
            &context,
            CACHEABLE_RESULT_TTL_MS,
        ))
    }

    /// Yarr defines no resource *templates* — only the one concrete schema
    /// resource served by `list_resources`/`read_resource` above — but a
    /// `2026-07-28` client is still free to call this method. Left
    /// unimplemented, rmcp's default (`rmcp::handler::server::ServerHandler`)
    /// returns an empty list with both cache hints unset, which fails the same
    /// SEP-2549 validation this file exists to fix for the other four methods.
    async fn list_resource_templates(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListResourceTemplatesResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        Ok(with_cache_hints(
            ListResourceTemplatesResult::default(),
            &context,
            CACHEABLE_RESULT_TTL_MS,
        ))
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
        Ok(with_cache_hints(
            ReadResourceResult::new(vec![
                ResourceContents::text(text, SCHEMA_RESOURCE_URI)
                    .with_mime_type("application/json"),
            ]),
            &context,
            CACHEABLE_RESULT_TTL_MS,
        )
        .into())
    }

    // ── prompts ───────────────────────────────────────────────────────────────

    async fn list_prompts(
        &self,
        _request: Option<PaginatedRequestParams>,
        context: RequestContext<RoleServer>,
    ) -> Result<ListPromptsResult, ErrorData> {
        require_auth_context(&self.state, &context)?;
        Ok(with_cache_hints(
            prompts::list_prompts(),
            &context,
            PROMPTS_LIST_TTL_MS,
        ))
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

    // ── server info / protocol ownership ──────────────────────────────────────

    fn supported_protocol_versions(&self) -> Cow<'static, [ProtocolVersion]> {
        Cow::Borrowed(SUPPORTED_PROTOCOL_VERSIONS)
    }

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
