//! `cargo xtask gen-openapi` generates lossless operation/type tables for the six
//! spec-backed services from the vendored documents under `specs/`.
//!
//! Generated files contain data only. Supported operations preserve parameter
//! serialization and request/response representations; operations that cannot be
//! encoded safely are emitted into an explicit omission table.

use anyhow::{Context, Result};
use serde_json::{Value, json};

mod emit;
mod extract;
mod naming;
mod types;

use emit::emit_rust;
use extract::extract_operations;
#[cfg(test)]
use extract::server_base_path;
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

/// Header parameters the transport always supplies for a service
/// (`src/yarr/auth.rs::transport_headers`), so the generated table marks them
/// optional even where the spec requires them.
const TRANSPORT_SUPPLIED_HEADERS: &[(&str, &str)] = &[("plex", "X-Plex-Client-Identifier")];

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
    method: String,
    path: String,
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
    for (service, spec_path) in SPECS {
        let mut root = load_spec(spec_path).with_context(|| format!("loading {spec_path}"))?;
        apply_spec_corrections(service, &mut root)
            .with_context(|| format!("correcting {spec_path}"))?;
        let mut operations = extract_operations(&root)
            .with_context(|| format!("extracting operations from {spec_path}"))?;
        relax_transport_supplied_headers(service, &mut operations);
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

/// Audited corrections to vendored specs, applied before extraction so the
/// vendored files stay byte-identical to upstream and survive a re-fetch.
fn apply_spec_corrections(service: &str, root: &mut Value) -> Result<()> {
    if service == "plex" {
        correct_plex_subtitles(root)?;
    }
    Ok(())
}

/// LukeHagar/plex-api-spec models `GET /library/metadata/{ids}/subtitles` as
/// "add subtitles" with an HTML response and boolean `hearingImpaired`/`forced`,
/// and has no `PUT`. Plex Media Server serves on-demand subtitle search there:
/// the `GET` returns candidate `Stream`s as JSON and attaches nothing, and
/// `PUT ?key=<candidate key>` downloads one (python-plexapi
/// `Video.searchSubtitles`/`downloadSubtitles`).
fn correct_plex_subtitles(root: &mut Value) -> Result<()> {
    const PATH: &str = "/library/metadata/{ids}/subtitles";
    let item = root
        .pointer_mut(&format!(
            "/paths/{}",
            PATH.replace('~', "~0").replace('/', "~1")
        ))
        .and_then(Value::as_object_mut)
        .with_context(|| format!("spec has no `{PATH}`"))?;
    let get = item
        .get("get")
        .with_context(|| format!("spec has no `GET {PATH}`"))?;
    // Keep the shared `$ref` header parameters (client identifier, product, ...).
    let mut shared = get
        .get("parameters")
        .and_then(Value::as_array)
        .map(|parameters| {
            parameters
                .iter()
                .filter(|parameter| parameter.get("$ref").is_some())
                .cloned()
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    shared.push(json!({
        "name": "ids", "in": "path", "required": true,
        "description": "ratingKey of the movie or episode",
        "schema": { "type": "string" }
    }));
    let preference = |what: &str| {
        json!({
            "type": "integer", "enum": [0, 1, 2, 3], "default": 0,
            "description": format!(
                "0 = prefer non-{what}, 1 = prefer {what}, 2 = only {what}, 3 = only non-{what}"
            )
        })
    };
    let mut search_parameters = shared.clone();
    search_parameters.extend([
        json!({
            "name": "language", "in": "query", "required": false,
            "description": "ISO 639-1 language code, e.g. `en`",
            "schema": { "type": "string" }
        }),
        json!({
            "name": "hearingImpaired", "in": "query", "required": false,
            "schema": preference("SDH")
        }),
        json!({
            "name": "forced", "in": "query", "required": false,
            "schema": preference("forced")
        }),
    ]);
    let mut download_parameters = shared;
    download_parameters.push(json!({
        "name": "key", "in": "query", "required": true,
        "description": "`key` of a candidate returned by searchSubtitles, e.g. `/library/streams/200`",
        "schema": { "type": "string" }
    }));
    item.insert(
        "get".to_string(),
        json!({
            "operationId": "searchSubtitles",
            "summary": "Search on-demand subtitles for a movie or episode; returns candidates and attaches nothing",
            "tags": ["Library"],
            "parameters": search_parameters,
            "responses": { "200": {
                "description": "Candidate subtitle streams",
                "content": { "application/json": { "schema": {
                    "type": "object",
                    "properties": { "MediaContainer": {
                        "type": "object",
                        "properties": {
                            "size": { "type": "integer" },
                            "Stream": {
                                "type": "array",
                                "items": { "$ref": "#/components/schemas/Stream" }
                            }
                        }
                    } }
                } } }
            } }
        }),
    );
    item.insert(
        "put".to_string(),
        json!({
            "operationId": "downloadSubtitles",
            "summary": "Download a searchSubtitles candidate and attach it (asynchronous)",
            "tags": ["Library"],
            "parameters": download_parameters,
            "responses": { "200": { "$ref": "#/components/responses/200" } }
        }),
    );
    Ok(())
}

fn relax_transport_supplied_headers(service: &str, operations: &mut [OperationOut]) {
    for parameter in operations
        .iter_mut()
        .flat_map(|operation| operation.parameters.iter_mut())
    {
        if parameter.location == "header"
            && TRANSPORT_SUPPLIED_HEADERS
                .iter()
                .any(|(kind, name)| *kind == service && parameter.name.eq_ignore_ascii_case(name))
        {
            parameter.required = false;
        }
    }
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
#[path = "gen_openapi_tests.rs"]
mod tests;
