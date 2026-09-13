//! Per-type TypeScript interfaces for Code Mode discovery.
//!
//! These are surfaced to the authoring agent ON DEMAND through
//! `codemode.search`/`codemode.describe` (NOT a static resource and NOT the
//! sandbox preamble's runtime JS — both of which are invisible to the agent or
//! defeat Code Mode's "don't dump every type into context" point). Each typed
//! contract in [`crate::models`] becomes one entry `{ name: "service.TypeName",
//! … , dts }`; the agent runs e.g. `codemode.describe("sonarr.SeriesResource")`
//! and gets just that interface back in the result.
//!
//! Generated from the models' `schemars::JsonSchema` derives — this is what those
//! derives are for.

use std::collections::BTreeMap;

use serde::Serialize;
use serde_json::Value;

/// One discoverable type: a service-qualified name + its TypeScript interface.
#[derive(Debug, Clone, Serialize)]
pub struct TypeEntry {
    /// Service-qualified, e.g. `"sonarr.SeriesResource"`.
    pub name: String,
    pub service: &'static str,
    /// Bare type name, e.g. `"SeriesResource"`.
    pub type_name: String,
    /// The TypeScript `interface`/`type` declaration.
    pub dts: String,
}

/// Build the discoverable type catalog from the models' `JsonSchema`. Each headline
/// response type contributes itself plus every nested type it references (`$defs`),
/// so the agent can chain `describe` from a root into its parts.
pub fn type_entries() -> Vec<TypeEntry> {
    macro_rules! ty {
        ($name:literal, $t:ty) => {
            (
                $name,
                serde_json::to_value(schemars::schema_for!($t)).unwrap(),
            )
        };
    }
    use crate::models;

    // Only the 5 doc-based services are hand-modeled here; the 6 spec-backed
    // services' types are generated from OpenAPI (see `crate::openapi`) and merged
    // in by `type_catalog_json_for`.
    let groups: Vec<(&str, Vec<(&str, Value)>)> = vec![
        (
            "tautulli",
            vec![
                ty!(
                    "ActivityEnvelope",
                    models::tautulli::TautulliEnvelope<models::tautulli::GetActivityData>
                ),
                ty!("GetHistoryData", models::tautulli::GetHistoryData),
            ],
        ),
        (
            "sabnzbd",
            vec![
                ty!("QueueResponse", models::sabnzbd::QueueResponse),
                ty!("HistoryResponse", models::sabnzbd::HistoryResponse),
                ty!("VersionResponse", models::sabnzbd::VersionResponse),
            ],
        ),
        (
            "qbittorrent",
            vec![
                ty!("TorrentInfo", models::qbittorrent::TorrentInfo),
                ty!("TransferInfo", models::qbittorrent::TransferInfo),
                ty!("BuildInfo", models::qbittorrent::BuildInfo),
            ],
        ),
        (
            "bazarr",
            vec![ty!("SystemStatus", models::bazarr::SystemStatus)],
        ),
        (
            "tracearr",
            vec![ty!("ServerInfo", models::tracearr::ServerInfo)],
        ),
    ];

    let mut out: Vec<TypeEntry> = Vec::new();
    for (service, roots) in &groups {
        // Dedup within a service (a root + its $defs may repeat across roots).
        let mut decls: BTreeMap<String, String> = BTreeMap::new();
        for (root_name, schema) in roots {
            decls
                .entry((*root_name).to_string())
                .or_insert_with(|| declaration(root_name, schema));
            if let Some(defs) = schema.get("$defs").and_then(Value::as_object) {
                for (def_name, def_schema) in defs {
                    decls
                        .entry(def_name.clone())
                        .or_insert_with(|| declaration(def_name, def_schema));
                }
            }
        }
        for (type_name, dts) in decls {
            out.push(TypeEntry {
                name: format!("{service}.{type_name}"),
                service,
                type_name,
                dts,
            });
        }
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    out
}

/// Build the discoverable type catalog for the CONFIGURED services, merging two
/// sources: generated TypeScript interfaces (from the vendored OpenAPI specs) for
/// the spec-backed kinds, and the hand-modeled `schemars` types ([`type_entries`])
/// for the doc-based kinds. Entries are qualified by the configured service NAME so
/// `codemode.describe("<service>.<Type>")` lines up with the callable namespace.
pub fn type_catalog_json_for(services: &[(String, crate::config::ServiceKind)]) -> String {
    let mut out: Vec<TypeEntry> = Vec::new();
    let model_entries = type_entries();
    for (name, kind) in services {
        let namespace = crate::codemode::javascript_namespace(name);
        if crate::openapi::is_generated(*kind) {
            for t in crate::openapi::types_for_kind(*kind) {
                out.push(TypeEntry {
                    name: format!("{namespace}.{}", t.name),
                    // The configured name is owned; the catalog only needs &'static
                    // for the model path, so store the kind's static str here.
                    service: kind.as_str(),
                    type_name: t.name.to_string(),
                    dts: t.ts.to_string(),
                });
            }
        } else {
            // Doc-based kind: reuse the schemars-derived entries for this kind,
            // re-qualified by the configured service name.
            let kind_str = kind.as_str();
            for entry in model_entries.iter().filter(|e| e.service == kind_str) {
                out.push(TypeEntry {
                    name: format!("{namespace}.{}", entry.type_name),
                    service: entry.service,
                    type_name: entry.type_name.clone(),
                    dts: entry.dts.clone(),
                });
            }
        }
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    serde_json::to_string(&out).unwrap_or_else(|_| "[]".to_string())
}

/// A single TS declaration for one schema node: an `interface` for an object, a
/// string-union `type` for an enum, else a `Record` alias.
fn declaration(name: &str, schema: &Value) -> String {
    if let Some(values) = schema.get("enum").and_then(Value::as_array) {
        let union = values
            .iter()
            .filter_map(Value::as_str)
            .map(|v| format!("\"{v}\""))
            .collect::<Vec<_>>()
            .join(" | ");
        let union = if union.is_empty() {
            "string".into()
        } else {
            union
        };
        return format!("export type {name} = {union};");
    }
    let Some(props) = schema.get("properties").and_then(Value::as_object) else {
        return format!("export type {name} = Record<string, unknown>;");
    };
    let required: Vec<&str> = schema
        .get("required")
        .and_then(Value::as_array)
        .map(|r| r.iter().filter_map(Value::as_str).collect())
        .unwrap_or_default();
    let mut lines = format!("export interface {name} {{\n");
    for (field, prop) in props {
        let opt = if required.contains(&field.as_str()) {
            ""
        } else {
            "?"
        };
        lines.push_str(&format!("  {field}{opt}: {};\n", ts_type(prop)));
    }
    lines.push('}');
    lines
}

/// Map a JSON Schema property node to a TypeScript type expression.
fn ts_type(prop: &Value) -> String {
    if let Some(reference) = prop.get("$ref").and_then(Value::as_str) {
        return ref_name(reference);
    }
    if let Some(branches) = prop.get("anyOf").and_then(Value::as_array) {
        let parts: Vec<String> = branches
            .iter()
            .filter(|b| b.get("type").and_then(Value::as_str) != Some("null"))
            .map(ts_type)
            .collect();
        return if parts.is_empty() {
            "null".into()
        } else {
            parts.join(" | ")
        };
    }
    if let Some(values) = prop.get("enum").and_then(Value::as_array) {
        let union = values
            .iter()
            .filter_map(Value::as_str)
            .map(|v| format!("\"{v}\""))
            .collect::<Vec<_>>()
            .join(" | ");
        if !union.is_empty() {
            return union;
        }
    }
    match prop.get("type") {
        Some(Value::String(t)) if t == "array" => array_type(prop),
        Some(Value::String(t)) => scalar(t),
        Some(Value::Array(types)) => types
            .iter()
            .filter_map(Value::as_str)
            .find(|t| *t != "null")
            .map(scalar)
            .unwrap_or_else(|| "unknown".into()),
        _ => "unknown".into(),
    }
}

fn array_type(prop: &Value) -> String {
    match prop.get("items") {
        Some(Value::Bool(_)) | None => "any[]".into(),
        Some(items) => format!("{}[]", ts_type(items)),
    }
}

fn scalar(t: &str) -> String {
    match t {
        "string" => "string",
        "integer" | "number" => "number",
        "boolean" => "boolean",
        "object" => "Record<string, unknown>",
        "null" => "null",
        _ => "unknown",
    }
    .to_string()
}

fn ref_name(reference: &str) -> String {
    reference
        .rsplit('/')
        .next()
        .unwrap_or(reference)
        .to_string()
}

#[cfg(test)]
#[path = "dts_tests.rs"]
mod tests;
