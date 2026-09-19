//! Tool JSON schema for the service-named MCP tools.
//!
//! The schema is fully GENERATED from the action registry + capability map:
//!   - [`properties`] — the property set (generic params + curated params +
//!     verbose/fields), with the `action` enum coming from `action_names()` plus
//!     curated command names.
//!   - [`conditionals`] — action→required-params and action→allowed-kinds
//!     `allOf` fragments.
//!
//! Each advertised tool is named after one configured media-service kind
//! (`sonarr`, `radarr`, ...). Adding a curated command descriptor makes it
//! appear on every compatible service tool with no hand-maintained schema list.
//! The authoritative action×kind enforcement is the shared dispatch guard, not
//! these schema hints.
//!
//! NOTE: the substring `action_names()` is asserted by the schema-contract doc
//! test (`tests/template_invariants.rs`) — the enum is derived from action
//! metadata via `properties::properties()`, which calls `all_action_names()`
//! (generic `action_names()` plus curated names). Do not remove the reference in
//! this comment or the derivation in `properties`.

mod conditionals;
mod properties;

use std::sync::OnceLock;

use serde_json::{Value, json};

use crate::actions::registry::ParamType;
use crate::actions::{
    ACTION_SPECS, CommandDescriptor, action_allowed_for_kind, action_spec, curated_command,
    required_params_for_action, valid_actions_for_kind,
};
use crate::config::ServiceKind;

/// Cached JSON schema definitions (static data, built once at first call).
static TOOL_DEFINITIONS: OnceLock<Vec<Value>> = OnceLock::new();

pub(super) const SERVICE_TOOL_KINDS: &[ServiceKind] = &[
    ServiceKind::Sonarr,
    ServiceKind::Radarr,
    ServiceKind::Prowlarr,
    ServiceKind::Overseerr,
    ServiceKind::Tautulli,
    ServiceKind::Plex,
    ServiceKind::Tracearr,
    ServiceKind::Sabnzbd,
    ServiceKind::Qbittorrent,
    ServiceKind::Jellyfin,
    ServiceKind::Bazarr,
];

/// Return the JSON schema definitions for all tools (cached after first call).
///
/// Returns a `Vec<Value>` where each item is a tool definition object matching
/// the MCP `Tool` schema: `{ name, description, inputSchema }`.
///
/// This is also used by the schema resource (`yarr://schema/mcp-tool`).
pub(super) fn tool_definitions() -> &'static Vec<Value> {
    TOOL_DEFINITIONS.get_or_init(build_tool_definitions)
}

/// Tool definitions for exactly the given service kinds — the `flat`
/// [`crate::config::ToolMode`]'s `list_tools` surface. Unlike [`tool_definitions`]
/// (all 11 kinds, used by the schema resource as a reference of the full
/// theoretical surface), this only advertises a tool for a kind actually present
/// in the deployment's configured services, so an instance with just Sonarr and
/// Radarr configured doesn't advertise nine tools it can't serve.
pub(super) fn tool_definitions_for_configured(services: &[(String, ServiceKind)]) -> Vec<Value> {
    services
        .iter()
        .map(|(name, kind)| tool_definition_for(name, *kind))
        .collect()
}

/// Build the tool definitions. The action enum for each service is derived from
/// action metadata — see `action_names()` (via `properties::properties`).
fn build_tool_definitions() -> Vec<Value> {
    SERVICE_TOOL_KINDS
        .iter()
        .copied()
        .map(tool_definition)
        .collect()
}

/// The single MCP tool name. The entire media fleet is reached *inside* a `yarr`
/// script (via `callTool`/`api.<service>`/discovery) rather than through one tool
/// per service — so the agent carries one tool schema, not eleven.
pub(super) const YARR_TOOL_NAME: &str = "yarr";

/// The one MCP tool: `yarr`. Takes a single `code` script (the codemode action);
/// everything else is discovered and called from inside the sandbox.
pub(super) fn yarr_tool() -> Value {
    let description = format!(
        "yarr — ONE tool for the whole media-automation fleet (Sonarr, Radarr, Prowlarr, \
         Overseerr, Tautulli, Plex, Jellyfin, SABnzbd, qBittorrent, Bazarr, Tracearr). {}",
        action_spec("codemode").map_or("Run Code Mode.", |spec| spec.description)
    );
    json!({
        "name": YARR_TOOL_NAME,
        "description": description,
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "A JavaScript async arrow function, e.g. `async () => { ... }`. See the tool description for the in-sandbox API; use codemode.search/describe to discover actions and response types."
                }
            },
            "required": ["code"],
            "additionalProperties": false,
            "x-yarr-guidance": {
                "schema_resource": "yarr://schema/mcp-tool"
            }
        }
    })
}

fn tool_definition(kind: ServiceKind) -> Value {
    tool_definition_for(kind.as_str(), kind)
}

fn tool_definition_for(name: &str, kind: ServiceKind) -> Value {
    json!({
    "name": name,
    "description": tool_description(kind),
    "inputSchema": {
        "type": "object",
        "properties": properties::properties(kind),
        "required": ["action"],
        "additionalProperties": false,
        "allOf": conditionals::conditionals(kind),
        "x-yarr-action-metadata": action_metadata(kind),
        "x-yarr-service-metadata": service_metadata(kind),
        "x-yarr-agent-guidance": agent_guidance(kind),
    }
    })
}

/// Tool description, with a registry-derived capability digest appended when
/// curated commands exist (AN-1) so agents can pick the right action up front.
fn tool_description(kind: ServiceKind) -> String {
    let actions = crate::actions::valid_actions_for_kind(kind).join(", ");
    format!(
        "{} media-service MCP tool. The service is implicit; pass action plus action-specific params. Valid actions: {actions}",
        kind.as_str()
    )
}

fn action_metadata(kind: ServiceKind) -> Value {
    let actions = valid_actions_for_kind(kind)
        .into_iter()
        .map(|action| match curated_command(action) {
            Some(command) => curated_action_metadata(kind, command),
            None => generic_action_metadata(kind, action),
        })
        .collect::<Vec<_>>();
    Value::Array(actions)
}

fn generic_action_metadata(kind: ServiceKind, action: &'static str) -> Value {
    let spec = ACTION_SPECS
        .iter()
        .find(|spec| spec.name == action)
        .expect("valid generic action should have an ActionSpec");
    let route_dependent = crate::actions::action_has_route_dependent_safety(spec.name);
    json!({
        "name": spec.name,
        "kind": "generic",
        "scope": if route_dependent { "route_dependent" } else { spec.required_scope.unwrap_or("public") },
        "operation_safety": if route_dependent { "route_dependent" } else { "static" },
        "transport": action_transport_label(spec.transport),
        "description": spec.description,
        "required_params": required_params_for_action(spec.name)
            .into_iter()
            .filter(|param| *param != "service")
            .collect::<Vec<_>>(),
        "optional_params": spec.optional_params,
        "destructive": if route_dependent { false } else { spec.destructive },
        "mutates": if route_dependent { true } else { spec.mutates },
        "allowed_kinds": allowed_kinds_for_action(spec.name),
        "available_on_this_tool": action_allowed_for_kind(spec.name, kind),
    })
}

fn curated_action_metadata(kind: ServiceKind, command: &CommandDescriptor) -> Value {
    json!({
        "name": command.name,
        "kind": "curated",
        "capability": format!("{:?}", command.capability),
        "scope": command.required_scope,
        "transport": "any",
        "description": command.description,
        "required_params": command.required_params
            .iter()
            .copied()
            .filter(|param| *param != "service")
            .collect::<Vec<_>>(),
        "optional_params": command.optional_params,
        "typed_params": command.typed_params
            .iter()
            .map(|(name, ty)| json!({ "name": name, "type": param_type_label(*ty) }))
            .collect::<Vec<_>>(),
        "destructive": command.destructive,
        "mutates": command.mutates,
        "allowed_kinds": allowed_kinds_for_action(command.name),
        "available_on_this_tool": action_allowed_for_kind(command.name, kind),
    })
}

fn service_metadata(kind: ServiceKind) -> Value {
    let descriptor = kind.descriptor();
    json!({
        "kind": kind.as_str(),
        "capability": format!("{:?}", descriptor.capability),
        "api_prefix": descriptor.api_prefix,
        "auth_style": format!("{:?}", descriptor.auth_style),
        "resource_noun": descriptor.resource_noun,
        "path_allowlist": descriptor.path_allowlist,
        "has_metadata_profiles": descriptor.has_metadata_profiles,
        "valid_actions": valid_actions_for_kind(kind),
    })
}

fn agent_guidance(kind: ServiceKind) -> Value {
    let read_first = vec!["service_status", "help"];
    json!({
        "cost_order": ["read", "write"],
        "first_pass": read_first,
        "generic_passthrough": {
            "actions": ["api_get", "api_post", "api_put", "api_delete"],
            "scope": "route_dependent",
            "admission": "Every generic method/path must uniquely match a reviewed generated operation; unknown or ambiguous routes fail closed.",
            "path_allowlist": kind.descriptor().path_allowlist,
        },
        "write_guard": {
            "model": "Resolved operations classified Mutation run immediately. Only resolved operations classified Destructive prompt the connected MCP client via elicitation before dispatch; no action argument can skip it, and a client that cannot elicit is denied.",
            "gated_actions": "resolved operation safety=destructive"
        },
        "response_shaping": {
            "default": "slim",
            "opt_in_fields": ["verbose", "fields"]
        },
        "schema_resource": "yarr://schema/mcp-tool"
    })
}

fn action_transport_label(transport: crate::actions::ActionTransport) -> &'static str {
    match transport {
        crate::actions::ActionTransport::Any => "any",
        crate::actions::ActionTransport::McpOnly => "mcp_only",
    }
}

fn param_type_label(ty: ParamType) -> &'static str {
    match ty {
        ParamType::String => "string",
        ParamType::Integer => "integer",
        ParamType::IntegerArray => "integer[]",
        ParamType::StringArray => "string[]",
        ParamType::Boolean => "boolean",
    }
}

fn allowed_kinds_for_action(action: &str) -> Vec<&'static str> {
    SERVICE_TOOL_KINDS
        .iter()
        .copied()
        .filter(|kind| action_allowed_for_kind(action, *kind))
        .map(ServiceKind::as_str)
        .collect()
}

#[cfg(test)]
#[path = "schemas_tests.rs"]
mod tests;
