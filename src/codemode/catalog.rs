//! Code Mode discovery catalog.
//!
//! Builds a list of **fully-qualified callables** for the *configured* services,
//! derived from the action registry (the SSOT). Each curated command and the
//! per-service status verb becomes one entry whose `path` is exactly what a script
//! calls — `sonarr.list`, `radarr.add`, `plex.media_sessions` — with the service
//! baked in. This mirrors lab's `codemode.<upstream>.<tool>` and Cloudflare's
//! `<connector>.<method>`: the agent searches by capability and gets back a
//! self-contained callable, so it never enumerates services or passes a `service`
//! param.
//!
//! The catalog is serialized once and injected as `globalThis.__codemodeCatalog`;
//! the pure-JS `codemode.search`/`codemode.describe` helpers (see [`super::proxy`])
//! read it with zero host round-trips. The raw passthrough client is documented by
//! four service-agnostic `api.<service>.{get,post,put,delete}` entries.

use serde::Serialize;

use crate::actions::{
    CommandDescriptor, READ_SCOPE, WRITE_SCOPE, action_is_destructive, curated_command,
    curated_commands, required_params_for_action, required_scope_for_action,
};
use crate::capability::Capability;
use crate::config::ServiceKind;

/// One catalog row, surfaced to scripts via `codemode.search`/`describe`.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum CatalogEntry {
    Operation {
        /// The exact in-sandbox callable, e.g. `sonarr.get_series`.
        path: String,
        /// The configured service the callable is bound to.
        service: String,
        /// The generated operation name.
        method: &'static str,
        /// `"read"` / `"write"` / `"public"`.
        scope: CatalogScope,
        /// True only for generated DELETE operations.
        destructive: bool,
        /// OpenAPI tag for generated operations.
        capability: String,
        /// Required params, with the baked-in `service` dropped.
        required_params: Vec<&'static str>,
        description: &'static str,
        /// Request-body component type name, if any.
        #[serde(skip_serializing_if = "Option::is_none")]
        request_type: Option<&'static str>,
        /// 2xx response component type name, if any.
        #[serde(skip_serializing_if = "Option::is_none")]
        response_type: Option<&'static str>,
    },
    Curated {
        path: String,
        service: String,
        method: &'static str,
        scope: CatalogScope,
        destructive: bool,
        capability: Capability,
        required_params: Vec<&'static str>,
        description: &'static str,
    },
    Generic {
        path: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        service: Option<String>,
        method: &'static str,
        scope: CatalogScope,
        destructive: bool,
        capability: &'static str,
        required_params: Vec<&'static str>,
        description: &'static str,
    },
}

/// Always-available accessors (unlike the rest of this impl, below, which is
/// test-only): `path()` and `description()` are what `codemode::semantic` embeds
/// and ranks by, so real (non-test) code needs them too.
impl CatalogEntry {
    pub fn path(&self) -> &str {
        match self {
            Self::Operation { path, .. }
            | Self::Curated { path, .. }
            | Self::Generic { path, .. } => path,
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            Self::Operation { description, .. }
            | Self::Curated { description, .. }
            | Self::Generic { description, .. } => description,
        }
    }
}

#[cfg(test)]
impl CatalogEntry {
    pub fn service(&self) -> Option<&str> {
        match self {
            Self::Operation { service, .. } | Self::Curated { service, .. } => Some(service),
            Self::Generic { service, .. } => service.as_deref(),
        }
    }

    pub fn method(&self) -> &'static str {
        match self {
            Self::Operation { method, .. }
            | Self::Curated { method, .. }
            | Self::Generic { method, .. } => method,
        }
    }

    pub fn kind(&self) -> &'static str {
        match self {
            Self::Operation { .. } => "operation",
            Self::Curated { .. } => "curated",
            Self::Generic { .. } => "generic",
        }
    }

    pub fn scope(&self) -> CatalogScope {
        match self {
            Self::Operation { scope, .. }
            | Self::Curated { scope, .. }
            | Self::Generic { scope, .. } => *scope,
        }
    }

    pub fn destructive(&self) -> bool {
        match self {
            Self::Operation { destructive, .. }
            | Self::Curated { destructive, .. }
            | Self::Generic { destructive, .. } => *destructive,
        }
    }

    pub fn required_params(&self) -> &[&'static str] {
        match self {
            Self::Operation {
                required_params, ..
            }
            | Self::Curated {
                required_params, ..
            }
            | Self::Generic {
                required_params, ..
            } => required_params,
        }
    }

    pub fn capability_label(&self) -> String {
        match self {
            Self::Operation { capability, .. } => capability.clone(),
            Self::Curated { capability, .. } => format!("{capability:?}"),
            Self::Generic { capability, .. } => (*capability).to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum CatalogScope {
    Public,
    Read,
    Write,
}

#[cfg(test)]
impl CatalogScope {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Public => "public",
            Self::Read => "read",
            Self::Write => "write",
        }
    }
}

/// The action names exposed as `<service>.<method>()` callables for a kind: the
/// per-service status verb plus every curated command whose capability matches the
/// kind. Generic passthroughs (`api_*`) are NOT here — they live under the separate
/// `api.<service>` client. `help`/`codemode`/`snippet_*` are not service-scoped.
pub fn service_action_names(kind: ServiceKind) -> Vec<&'static str> {
    let cap = kind.capability();
    let mut names = vec!["service_status"];
    names.extend(
        curated_commands()
            .iter()
            .filter(|cmd| cmd.capability == cap)
            .map(|cmd| cmd.name),
    );
    names
}

/// Build the catalog for the configured services. For spec-backed (generated)
/// kinds this is one entry per generated operation; for the doc-based kinds it is
/// `service_status` + the kind's curated commands. Plus four service-agnostic
/// raw-API client entries.
pub fn build_catalog(services: &[(String, ServiceKind)]) -> Vec<CatalogEntry> {
    let mut out: Vec<CatalogEntry> = Vec::new();
    for (name, kind) in services {
        if crate::openapi::is_generated(*kind) {
            // The per-service `service_status` callable is still synthesized.
            out.push(service_entry(name, "service_status"));
            for op in crate::openapi::operations_for_kind(*kind) {
                out.push(operation_entry(name, *kind, op));
            }
        } else {
            for action in service_action_names(*kind) {
                out.push(service_entry(name, action));
            }
        }
    }
    out.extend(generic_api_entries());
    out
}

/// A catalog entry for one generated OpenAPI operation. The callable is
/// `<service>.<op.name>(args)`; reads (GET/HEAD) are flagged `read`, mutations
/// `write`, and DELETE ops `destructive` — metadata only, they dispatch
/// immediately like any other write (see `docs/API.md`). The OpenAPI `tag` is
/// surfaced as the capability for grouping.
fn operation_entry(
    service: &str,
    kind: ServiceKind,
    op: &crate::openapi::OperationSpec,
) -> CatalogEntry {
    let mut required: Vec<&'static str> = op.path_params.to_vec();
    if op.has_body {
        required.push("body");
    }
    let description = if op.summary.is_empty() {
        // Leak-free: fall back to the method+path which are already 'static.
        op.path
    } else {
        op.summary
    };
    let safety = crate::openapi::operation_safety(kind, op);
    CatalogEntry::Operation {
        path: format!("{service}.{}", op.name),
        service: service.to_string(),
        method: op.name,
        scope: if safety == crate::openapi::OperationSafety::Read {
            CatalogScope::Read
        } else {
            CatalogScope::Write
        },
        destructive: safety == crate::openapi::OperationSafety::Destructive,
        capability: op.tag.to_string(),
        required_params: required,
        description,
        request_type: op.request_type,
        response_type: op.response_type,
    }
}

/// A `<service>.<action>` callable entry.
fn service_entry(service: &str, action: &'static str) -> CatalogEntry {
    let cmd: Option<&'static CommandDescriptor> = curated_command(action);
    let scope = match required_scope_for_action(action) {
        Some(WRITE_SCOPE) => CatalogScope::Write,
        Some(READ_SCOPE) => CatalogScope::Read,
        _ => CatalogScope::Public,
    };
    let required_params = required_params_for_action(action)
        .into_iter()
        .filter(|param| *param != "service")
        .collect();
    if let Some(cmd) = cmd {
        CatalogEntry::Curated {
            path: format!("{service}.{action}"),
            service: service.to_string(),
            method: action,
            scope,
            destructive: action_is_destructive(action),
            capability: cmd.capability,
            required_params,
            description: cmd.description,
        }
    } else {
        CatalogEntry::Generic {
            path: format!("{service}.{action}"),
            service: Some(service.to_string()),
            method: action,
            scope,
            destructive: action_is_destructive(action),
            capability: "infra",
            required_params,
            description: generic_description(action),
        }
    }
}

/// The four service-agnostic raw-API client callables, documented once.
fn generic_api_entries() -> Vec<CatalogEntry> {
    [
        ("api.<service>.get", "api_get"),
        ("api.<service>.post", "api_post"),
        ("api.<service>.put", "api_put"),
        ("api.<service>.delete", "api_delete"),
    ]
    .into_iter()
    .map(|(path, action)| CatalogEntry::Generic {
        path: path.to_string(),
        service: None,
        method: action,
        scope: CatalogScope::Write,
        destructive: action_is_destructive(action),
        capability: "infra",
        required_params: vec!["path"],
        description: generic_description(action),
    })
    .collect()
}

/// Short prose for the infra verbs (curated commands carry their own).
fn generic_description(name: &str) -> &'static str {
    match name {
        "service_status" => "Call the service's default status endpoint.",
        "api_get" => "Raw GET passthrough: api.<service>.get(path).",
        "api_post" => "Raw POST passthrough (runs immediately): api.<service>.post(path, body).",
        "api_put" => "Raw PUT passthrough (runs immediately): api.<service>.put(path, body).",
        "api_delete" => {
            "Raw DELETE passthrough (runs immediately, no confirm): api.<service>.delete(path)."
        }
        _ => "",
    }
}

/// The catalog serialized to a JSON array string for preamble injection.
pub fn catalog_json(services: &[(String, ServiceKind)]) -> String {
    serde_json::to_string(&build_catalog(services)).unwrap_or_else(|_| "[]".to_string())
}

#[cfg(test)]
#[path = "catalog_tests.rs"]
mod tests;
