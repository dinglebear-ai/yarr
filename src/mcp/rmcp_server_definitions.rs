use super::*;
pub(super) fn schema_resource() -> Resource {
    Resource::new(SCHEMA_RESOURCE_URI, "yarr service tool schema")
        .with_description("JSON schema for the yarr MCP tool and its Code Mode parameters")
        .with_mime_type("application/json")
}

// ── tool definition conversion ────────────────────────────────────────────────

pub(super) fn rmcp_tool_definitions_for_service(state: &AppState) -> Result<Vec<Tool>, ErrorData> {
    match state.config.tool_mode {
        // ONE tool: `yarr`. The whole fleet is reached inside a yarr script, so
        // the agent carries a single tool schema instead of one per configured
        // service.
        crate::config::ToolMode::Codemode => {
            Ok(vec![rmcp_tool_from_json(crate::mcp::schemas::yarr_tool())?])
        }
        // One tool per configured service, action-dispatched, no Code Mode
        // sandbox layer — see `ToolMode::Flat`'s doc comment for why.
        crate::config::ToolMode::Flat => {
            let services = state.service.configured_service_kinds();
            let mut names = std::collections::BTreeSet::new();
            if let Some((duplicate, _)) = services
                .iter()
                .find(|(name, _)| !names.insert(name.to_ascii_lowercase()))
            {
                return Err(ErrorData::internal_error(
                    format!("duplicate configured service identity: {duplicate}"),
                    None,
                ));
            }
            if let Some((reserved, _)) = services.iter().find(|(name, _)| {
                name == crate::mcp::schemas::YARR_TOOL_NAME
                    || crate::cli::router::is_infra_verb(name)
            }) {
                return Err(ErrorData::internal_error(
                    format!(
                        "configured service identity `{reserved}` is reserved; rename it before using flat MCP mode"
                    ),
                    None,
                ));
            }
            crate::mcp::schemas::tool_definitions_for_configured(&services)
                .into_iter()
                .map(rmcp_tool_from_json)
                .collect()
        }
    }
}

pub(super) fn rmcp_tool_from_json(value: Value) -> Result<Tool, ErrorData> {
    let name = value
        .get("name")
        .and_then(Value::as_str)
        .ok_or_else(|| ErrorData::internal_error("tool definition missing name", None))?;
    let description = value
        .get("description")
        .and_then(Value::as_str)
        .map(|d| Cow::Owned(d.to_string()));
    let input_schema = value
        .get("inputSchema")
        .and_then(Value::as_object)
        .cloned()
        .ok_or_else(|| ErrorData::internal_error("tool definition missing inputSchema", None))?;
    Ok(Tool::new_with_raw(
        Cow::Owned(name.to_string()),
        description,
        Arc::new(input_schema),
    ))
}

pub(super) fn tool_result_from_json(value: Value) -> Result<CallToolResult, ErrorData> {
    // Compact JSON (not pretty) recovers ~30-40% of the 40 KB token budget.
    // When the payload is over the cap, `serialize_with_limit` returns a
    // parseable `{"truncated":true,...}` envelope (AN-6) instead of a notice
    // appended after the closing brace, so the client can always JSON.parse it.
    let (text, truncated) = token_limit::serialize_with_limit(&value);
    if truncated {
        tracing::warn!(
            bytes = text.len(),
            "MCP tool response truncated to fit token budget"
        );
    }
    Ok(CallToolResult::success(vec![ContentBlock::text(text)]))
}

/// Whether `arguments` dispatches a generated operation whose reviewed safety
/// classification requires elicitation. DELETE is always destructive; the
/// explicit safety table also covers high-impact POST/PUT operations such as
/// Plex session termination and library scans.
pub(super) fn is_destructive_op_call(state: &AppState, tool_name: &str, arguments: &Value) -> bool {
    let Some(op_name) = arguments.get("op").and_then(Value::as_str) else {
        return false;
    };
    let Ok(Some(kind)) = state.service.kind_of(tool_name) else {
        return false;
    };
    crate::openapi::classify_operation(kind, op_name)
        == Some(crate::openapi::OperationSafety::Destructive)
}

/// Result returned when a destructive action is declined at the elicitation
/// prompt: a structured success payload (nothing was changed), not an error.
pub(super) fn declined_result(action: &str) -> Result<CallToolResult, ErrorData> {
    tool_result_from_json(serde_json::json!({
        "declined": true,
        "action": action,
        "note": "destructive action not confirmed; nothing was changed",
    }))
}

pub(super) fn reject_unknown_action_before_scope(action: &str) -> Result<(), ErrorData> {
    if is_known_action(action) {
        return Ok(());
    }
    Err(ErrorData::invalid_params(
        ValidationError::UnknownAction {
            action: action.to_owned(),
        }
        .to_string(),
        None,
    ))
}

pub(super) fn effective_action(
    state: &AppState,
    tool_name: &str,
    arguments: Option<&Map<String, Value>>,
) -> Result<Option<String>, ErrorData> {
    match state.config.tool_mode {
        crate::config::ToolMode::Codemode => {
            if tool_name != crate::mcp::schemas::YARR_TOOL_NAME {
                return Err(ErrorData::invalid_params(
                    format!("unknown or inactive MCP tool: {tool_name}"),
                    None,
                ));
            }
            if arguments.is_some_and(|args| args.contains_key("action")) {
                return Err(ErrorData::invalid_params(
                    "the `yarr` tool does not accept `action`; its effective action is always `codemode`",
                    None,
                ));
            }
            Ok(Some("codemode".to_owned()))
        }
        crate::config::ToolMode::Flat => {
            let active = state
                .service
                .configured_service_kinds()
                .iter()
                .any(|(name, _)| name == tool_name);
            if !active {
                return Err(ErrorData::invalid_params(
                    format!("unknown or inactive MCP tool: {tool_name}"),
                    None,
                ));
            }
            match arguments.and_then(|args| args.get("action")) {
                Some(Value::String(action)) => Ok(Some(action.clone())),
                Some(_) => Err(ErrorData::invalid_params("`action` must be a string", None)),
                None => Ok(None),
            }
        }
    }
}
