//! Action data model: validation errors, scopes, spec/transport types, and the
//! `YarrAction` enum for the generic passthrough actions.
//!
//! Curated commands are *not* enum variants — they live in the data-driven
//! [`crate::actions::registry`] descriptor table. This enum covers only the six
//! generic actions plus `help`, which is small enough to stay exhaustive.

use serde_json::Value;

pub const READ_SCOPE: &str = "yarr:read";
pub const WRITE_SCOPE: &str = "yarr:write";
pub const DENY_SCOPE: &str = "yarr:__deny__";

pub fn scopes_satisfy(token_scopes: &[String], required: &str) -> bool {
    token_scopes
        .iter()
        .any(|s| s == required || (required == READ_SCOPE && s == WRITE_SCOPE))
}

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum ValidationError {
    #[error("action is required")]
    MissingAction,
    #[error("`{field}` is required and must not be empty")]
    MissingField { field: String },
    #[error("`{field}` has the wrong type")]
    WrongType { field: String },
    #[error("action={action} is not available over REST; use MCP or action=help for documentation")]
    NotAvailableOverRest { action: String },
    #[error("unknown yarr action: {action}; use action=help for documentation")]
    UnknownAction { action: String },
    #[error(
        "action={action} is not valid for kind={kind}; valid actions for {kind}: [{}]",
        valid_actions.join(", ")
    )]
    ActionNotValidForKind {
        action: String,
        kind: String,
        valid_actions: Vec<String>,
    },
}

pub fn is_validation_error(error: &anyhow::Error) -> bool {
    error.downcast_ref::<ValidationError>().is_some()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActionTransport {
    Any,
    McpOnly,
}

/// Static spec for a generic (infrastructure) action. Drives schema, scope
/// lookup, REST/MCP filtering, and name enumeration so the action list has a
/// single materialization.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ActionSpec {
    pub name: &'static str,
    pub description: &'static str,
    pub required_scope: Option<&'static str>,
    pub transport: ActionTransport,
    pub required_params: &'static [&'static str],
    pub optional_params: &'static [&'static str],
    pub mutates: bool,
    pub destructive: bool,
}

/// The generic passthrough actions plus `help` and the Code Mode verbs.
#[derive(Debug, Clone, PartialEq)]
pub enum YarrAction {
    ServiceStatus {
        service: String,
    },
    ApiGet {
        service: String,
        path: String,
    },
    ApiPost {
        service: String,
        path: String,
        body: Value,
    },
    ApiPut {
        service: String,
        path: String,
        body: Value,
    },
    ApiDelete {
        service: String,
        path: String,
        body: Option<Value>,
    },
    Help,
    /// Code Mode: run a JavaScript async arrow function that calls yarr actions
    /// via `callTool` or the per-service `<service>.<verb>()` / `api.<service>`
    /// callables. Carries the raw user `code`; the engine + the async dispatch
    /// bridge live in `crate::codemode` / `crate::app`. Infra action (no implicit
    /// service); requires `yarr:write`.
    CodeMode {
        code: String,
    },
    /// Snippet store verbs — persisted, named, reusable Code Mode scripts. Infra
    /// actions (service-less), modeled like [`Self::CodeMode`]. `snippet_run`
    /// executes the stored script one level deep.
    SnippetList,
    SnippetSave {
        name: String,
        code: String,
        description: Option<String>,
    },
    SnippetRun {
        name: String,
        /// Arbitrary JSON bound as `globalThis.input` inside the snippet; `Null`
        /// and any shape are intentionally allowed (the wide type is deliberate).
        input: Value,
    },
    SnippetDelete {
        name: String,
    },
    /// A generated OpenAPI operation for a spec-backed kind (Sonarr, Radarr,
    /// Prowlarr, Overseerr, Jellyfin, Plex). `service` resolves the upstream, `op`
    /// names the generated `OperationSpec` (`crate::openapi`), and `args` carries
    /// path params, query params, and (for body ops) `args.body`. The whole
    /// generated surface dispatches through this one variant — no per-op code.
    /// Its required scope and destructive status derive from reviewed operation
    /// metadata, not its HTTP method.
    Op {
        service: String,
        op: String,
        args: Value,
    },
    /// A curated, capability-scoped command resolved from the registry's
    /// descriptor table (e.g. `quality_profiles`, `list`). Carries the registry
    /// command `name` and the raw `params` object so dispatch can hand both to the
    /// descriptor's handler. Curated commands are NOT enum variants — this single
    /// carrier keeps the enum small while every command stays data-driven.
    Curated {
        name: &'static str,
        params: Value,
    },
}

impl YarrAction {
    pub fn name(&self) -> &'static str {
        match self {
            Self::ServiceStatus { .. } => "service_status",
            Self::ApiGet { .. } => "api_get",
            Self::ApiPost { .. } => "api_post",
            Self::ApiPut { .. } => "api_put",
            Self::ApiDelete { .. } => "api_delete",
            Self::Help => "help",
            Self::CodeMode { .. } => "codemode",
            Self::SnippetList => "snippet_list",
            Self::SnippetSave { .. } => "snippet_save",
            Self::SnippetRun { .. } => "snippet_run",
            Self::SnippetDelete { .. } => "snippet_delete",
            Self::Op { .. } => "op",
            Self::Curated { name, .. } => name,
        }
    }
}

#[cfg(test)]
#[path = "model_tests.rs"]
mod tests;
