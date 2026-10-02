//! Help payload generation for the `help` action.
//!
//! Two shapes share this module:
//!   * [`rest_help`] — structured JSON used by the CLI `help` command.
//!   * [`help_text`] — generated Markdown used by the MCP `help` action.
//!
//! The Markdown is GENERATED from the action registry + capability map (rather
//! than a static const that drifts) so curated commands appear automatically and
//! a compact capability digest (AN-1/AN-3) aids first-try action selection.

use serde_json::{Value, json};

use super::WRITE_SCOPE;
use super::registry::{
    action_has_route_dependent_safety, all_action_names, capability_digest, curated_command,
    mcp_only_action_names, required_params_for_action, required_scope_for_action,
    rest_action_names,
};

pub fn rest_help() -> Value {
    json!({
        "actions": rest_action_names(),
        "mcp_only_actions": mcp_only_action_names(),
        "usage": "Use the yarr MCP tool or CLI commands such as `yarr sonarr get --path /api/v3/system/status`.",
        "examples": {
            "service_status": {"action": "service_status", "service": "sonarr"},
            "api_get": {"action": "api_get", "service": "radarr", "path": "/api/v3/system/status"},
            "api_post": {"action": "api_post", "service": "overseerr", "path": "/api/v1/request", "body": {}},
            "api_put": {"action": "api_put", "service": "sonarr", "path": "/api/v3/series/editor", "body": {}},
            "api_delete": {"action": "api_delete", "service": "sonarr", "path": "/api/v3/series/123?deleteFiles=false"}
        }
    })
}

/// Static one-line descriptions for the generic/infra actions. Curated commands
/// carry their own `description` in their descriptor.
fn generic_description(action: &str) -> &'static str {
    match action {
        "service_status" => {
            "call the default status endpoint for a configured service. Requires `service`."
        }
        "api_get" | "api_post" | "api_put" | "api_delete" => {
            "Run a generic API request. Requires `service` and `path`; the exact method/path must uniquely resolve to a reviewed generated operation. Its reviewed safety determines the required scope and whether MCP confirmation is required. Unknown or ambiguous routes fail closed."
        }
        "op" => {
            "Run a generated operation. Requires `service` and `op`; its reviewed safety determines the required scope and whether MCP confirmation is required."
        }
        "help" => "return this help text.",
        _ => "",
    }
}

/// Render the full Markdown help text for the single `yarr` tool (MCP `help`).
pub fn help_text() -> String {
    let mut out = String::from("# yarr MCP Tool\n\nSingle tool: `yarr`\n\n");

    if let Some(digest) = capability_digest() {
        out.push_str("Capabilities: ");
        out.push_str(&digest);
        out.push_str("\n\n");
    }

    out.push_str("Actions:\n");
    for action in all_action_names() {
        let desc = match curated_command(action) {
            Some(cmd) => cmd.description.to_string(),
            None => generic_description(action).to_string(),
        };
        let mut line = format!("- `{action}`: {desc}");
        let required = required_params_for_action(action);
        if !required.is_empty() {
            line.push_str(&format!(" (params: {})", required.join(", ")));
        }
        if !action_has_route_dependent_safety(action)
            && required_scope_for_action(action) == Some(WRITE_SCOPE)
        {
            line.push_str(" [requires yarr:write]");
        }
        out.push_str(&line);
        out.push('\n');
    }

    out.push_str(
        "\nCredentials are configured outside tool-call arguments through `YARR_SERVICES`\n\
         and per-service environment variables or config.toml. Do not pass API keys in\n\
         paths or request bodies unless the upstream endpoint itself requires it.\n",
    );
    out
}

#[cfg(test)]
#[path = "help_tests.rs"]
mod tests;
