//! `cargo xtask gen-openapi` generates lossless operation/type tables for the six
//! spec-backed services from the vendored documents under `specs/`.
//!
//! Generated files contain data only. Supported operations preserve parameter
//! serialization and request/response representations; operations that cannot be
//! encoded safely are emitted into an explicit omission table.

use anyhow::{Context, Result};
use serde_json::Value;

mod emit;
mod extract;
mod naming;
mod safety;
mod types;

use emit::emit_rust;
use extract::extract_operations;
#[cfg(test)]
use extract::server_base_path;
#[cfg(test)]
use safety::validate_safety_manifest;
use safety::{SafetyCandidate, validate_safety_manifest_for_services};
use types::extract_types;

/// (service module name, spec path) for each generated service.
const SPECS: &[(&str, &str)] = &[
    ("sonarr", "specs/sonarr.openapi.json"),
    ("radarr", "specs/radarr.openapi.json"),
    ("prowlarr", "specs/prowlarr.openapi.json"),
    ("overseerr", "specs/overseerr.openapi.yml"),
    ("jellyfin", "specs/jellyfin.openapi.json"),
    ("plex", "specs/plex.openapi.yml"),
];

#[derive(Debug)]
struct ParameterOut {
    name: String,
    location: String,
    required: bool,
    schema: String,
    style: String,
    explode: bool,
}

#[derive(Debug)]
struct RepresentationOut {
    status: Option<String>,
    media_type: String,
    encoding: String,
    schema: String,
    encoding_metadata: String,
}

#[derive(Debug)]
struct RequestBodyOut {
    required: bool,
    representations: Vec<RepresentationOut>,
}

#[derive(Debug)]
struct OperationOut {
    name: String,
    operation_id: Option<String>,
    method: String,
    path: String,
    safety: String,
    parameters: Vec<ParameterOut>,
    request_body: Option<RequestBodyOut>,
    responses: Vec<RepresentationOut>,
    request_type: Option<String>,
    response_type: Option<String>,
    tag: String,
    summary: String,
    omission_reason: Option<String>,
}

#[derive(Debug)]
struct TypeOut {
    name: String,
    ts: String,
}

pub fn run(_args: &[String]) -> Result<()> {
    let manifest = std::fs::read_to_string("specs/safety-overrides.toml")?;
    let known_services = SPECS
        .iter()
        .map(|(service, _)| *service)
        .collect::<Vec<_>>();
    for (service, spec_path) in SPECS {
        let root = load_spec(spec_path).with_context(|| format!("loading {spec_path}"))?;
        let operations = extract_operations(&root)
            .with_context(|| format!("extracting operations from {spec_path}"))?;
        let candidates = safety_candidates(&operations);
        let reviewed = validate_safety_manifest_for_services(
            service,
            &known_services,
            &operations,
            &manifest,
            &candidates,
        )?;
        let mut operations = operations;
        for operation in &mut operations {
            operation.safety = reviewed
                .get(&(operation.method.clone(), operation.path.clone()))
                .map(|row| row.safety.clone())
                .unwrap_or_else(|| default_safety(&operation.method).to_string());
        }
        let types = extract_types(&root);
        let supported = operations
            .iter()
            .filter(|operation| operation.omission_reason.is_none())
            .count();
        let omitted = operations.len() - supported;
        let code = emit_rust(service, &operations, &types);
        let output = format!("src/openapi/generated/{service}.rs");
        std::fs::write(&output, code).with_context(|| format!("writing {output}"))?;
        println!(
            "  {service:9} -> {output}  ({supported} supported, {omitted} omitted, {} types)",
            types.len()
        );
    }
    println!("gen-openapi: done. Run `cargo fmt` + `cargo build` to verify.");
    Ok(())
}

const DEFAULT_SAFETY: &str = "Mutation";

fn default_safety(_method: &str) -> &'static str {
    DEFAULT_SAFETY
}

fn safety_candidates(operations: &[OperationOut]) -> Vec<SafetyCandidate> {
    operations
        .iter()
        .filter(|operation| {
            // This is a reviewed-inventory selector, not a safety classifier:
            // candidates must have an exact source-keyed manifest row, while every
            // other operation remains conservatively `Mutation` by default.
            let source_identity = operation
                .operation_id
                .as_deref()
                .unwrap_or(&operation.path)
                .to_ascii_lowercase();
            let no_operation_id_delete =
                operation.operation_id.is_none() && operation.method == "DELETE";
            [
                "delete",
                "trash",
                "restore",
                "reset",
                "regenerate",
                "shutdown",
                "editor",
            ]
            .iter()
            .any(|word| source_identity.contains(word))
                || no_operation_id_delete
                || matches!(
                    (
                        operation.operation_id.as_deref(),
                        operation.method.as_str(),
                        operation.path.as_str(),
                    ),
                    (
                        Some("addSubtitles"),
                        "GET",
                        "/library/metadata/{ids}/subtitles"
                    ) | (
                        Some("startTranscodeSession"),
                        "GET",
                        "/{transcodeType}/:/transcode/universal/start.{extension}",
                    ) | (None, "GET", "/api/v1/settings/discover/reset")
                )
        })
        .map(SafetyCandidate::from_operation)
        .collect()
}

fn load_spec(path: &str) -> Result<Value> {
    let text = std::fs::read_to_string(path)?;
    if path.ends_with(".json") {
        Ok(serde_json::from_str(&text)?)
    } else {
        Ok(noyalib::from_str_strict(&text)?)
    }
}

#[cfg(test)]
#[path = "gen_openapi/safety_audit_tests.rs"]
mod safety_audit_tests;
#[cfg(test)]
#[path = "gen_openapi/safety_manifest_tests.rs"]
mod safety_manifest_tests;
#[cfg(test)]
#[path = "gen_openapi/safety_tests.rs"]
mod safety_tests;
#[cfg(test)]
#[path = "gen_openapi_tests.rs"]
mod tests;
