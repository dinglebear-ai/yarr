//! Tests for the `OpenAPI` → operation/type table generator.
//!
//! These exercise the parse/emit core on tiny inline specs so a regression in
//! path-prefixing, param classification, the phantom-path-param skip, name
//! derivation, or the components→TS pass fails CI here rather than silently
//! shipping a broken generated table.

use super::*;
use serde_json::json;

#[test]
fn server_base_path_strips_host_and_keeps_api_prefix() {
    // Host-only URLs (the common Servarr/Jellyfin case) → empty base.
    assert_eq!(server_base_path(&json!({})), "");
    assert_eq!(
        server_base_path(&json!({ "servers": [{ "url": "http://localhost:7878" }] })),
        ""
    );
    assert_eq!(
        server_base_path(&json!({ "servers": [{ "url": "{protocol}://{host}" }] })),
        ""
    );
    // Overseerr-style API prefix is preserved (trailing slash trimmed).
    assert_eq!(
        server_base_path(&json!({ "servers": [{ "url": "{server}/api/v1/" }] })),
        "/api/v1"
    );
}

#[test]
fn extract_operations_prefixes_base_and_classifies_params() {
    let spec = json!({
        "servers": [{ "url": "{server}/api/v1" }],
        "paths": {
            "/movie/{id}": {
                "get": {
                    "operationId": "getMovieById",
                    "parameters": [
                        { "name": "id", "in": "path" },
                        { "name": "extended", "in": "query" }
                    ],
                    "responses": { "200": { "content": {
                        "application/json": { "schema": { "$ref": "#/components/schemas/Movie" } }
                    } } }
                },
                "post": {
                    "operationId": "updateMovie",
                    "parameters": [{ "name": "id", "in": "path" }],
                    "requestBody": { "content": {
                        "application/json": { "schema": { "$ref": "#/components/schemas/Movie" } }
                    } }
                }
            }
        }
    });
    let ops = extract_operations(&spec).unwrap();
    assert_eq!(ops.len(), 2);

    let get = ops.iter().find(|o| o.method == "GET").unwrap();
    // Server base path is prefixed onto the operation path.
    assert_eq!(get.path, "/api/v1/movie/{id}");
    assert_eq!(get.name, "get_movie_by_id");
    let id = get.parameters.iter().find(|p| p.name == "id").unwrap();
    assert_eq!(id.location, "path");
    assert!(id.required);
    assert_eq!(id.style, "simple");
    assert!(!id.explode);
    let extended = get
        .parameters
        .iter()
        .find(|p| p.name == "extended")
        .unwrap();
    assert_eq!(extended.location, "query");
    assert!(!extended.required);
    assert_eq!(extended.style, "form");
    assert!(extended.explode);
    assert!(get.request_body.is_none());
    assert_eq!(get.response_type.as_deref(), Some("Movie"));

    let post = ops.iter().find(|o| o.method == "POST").unwrap();
    assert!(post.request_body.is_some());
    assert_eq!(post.request_type.as_deref(), Some("Movie"));
}

#[test]
fn extract_operations_preserves_parameter_protocol_semantics() {
    let spec = json!({
        "paths": { "/things/{id}": { "get": {
            "operationId": "getThing",
            "parameters": [
                { "name": "id", "in": "path", "required": true,
                  "style": "label", "explode": true,
                  "schema": { "type": "array", "items": { "type": "integer" } } },
                { "name": "filters", "in": "query", "required": true,
                  "style": "deepObject", "explode": true,
                  "schema": { "type": "object", "additionalProperties": { "type": "string" } } },
                { "name": "X-Mode", "in": "header", "required": true,
                  "style": "simple", "explode": false,
                  "schema": { "type": "string", "enum": ["full", "slim"] } },
                { "name": "session", "in": "cookie", "required": true,
                  "schema": { "type": "string" } }
            ],
            "responses": { "200": { "content": {
                "application/octet-stream": { "schema": { "type": "string", "format": "binary" } }
            } } }
        } } }
    });
    let ops = extract_operations(&spec).unwrap();
    let op = &ops[0];
    assert!(op.omission_reason.is_none());
    assert_eq!(op.parameters.len(), 4);
    assert!(
        op.parameters
            .iter()
            .all(|parameter| !parameter.schema.is_empty())
    );
    assert_eq!(op.responses.len(), 1);
    assert_eq!(op.responses[0].media_type, "application/octet-stream");
    assert_eq!(op.responses[0].encoding, "binary");
}

#[test]
fn extract_operations_preserves_all_supported_request_representations() {
    let representations = [
        ("application/json", "json"),
        ("application/x-www-form-urlencoded", "form"),
        ("multipart/form-data", "multipart"),
        ("text/plain", "text"),
        ("application/octet-stream", "binary"),
    ];
    for (media_type, expected_encoding) in representations {
        let schema = match expected_encoding {
            "binary" => json!({ "type": "string", "format": "binary" }),
            "multipart" => json!({
                "type": "object",
                "properties": { "file": { "type": "string", "format": "binary" } }
            }),
            "json" | "form" => json!({ "type": "object" }),
            "text" => json!({ "type": "string" }),
            _ => unreachable!(),
        };
        let spec = json!({
            "paths": { "/upload": { "post": {
                "operationId": "upload",
                "requestBody": { "required": true, "content": {
                    (media_type): {
                        "schema": schema,
                        "encoding": { "file": { "contentType": "image/png" } }
                    }
                } },
                "responses": { "204": {} }
            } } }
        });
        let op = &extract_operations(&spec).unwrap()[0];
        let request = op.request_body.as_ref().unwrap();
        assert!(request.required);
        assert_eq!(request.representations[0].media_type, media_type);
        assert_eq!(request.representations[0].encoding, expected_encoding);
        if matches!(expected_encoding, "binary" | "multipart") {
            assert!(request.representations[0].schema.contains("binary"));
        }
        assert!(
            request.representations[0]
                .encoding_metadata
                .contains("image/png")
        );
    }
}

#[test]
fn extract_operations_marks_unsafe_representations_omitted() {
    let spec = json!({
        "paths": {
            "/wild": { "post": {
                "operationId": "wildUpload",
                "requestBody": { "content": { "*/*": {} } },
                "responses": { "200": {} }
            } },
            "/reserved": { "get": {
                "operationId": "reservedQuery",
                "parameters": [{
                    "name": "target", "in": "query", "allowReserved": true,
                    "schema": { "type": "string" }
                }],
                "responses": { "200": {} }
            } }
        }
    });
    let ops = extract_operations(&spec).unwrap();
    let wild = ops.iter().find(|op| op.name == "wild_upload").unwrap();
    assert!(wild.omission_reason.as_deref().unwrap().contains("*/*"));
    let reserved = ops.iter().find(|op| op.name == "reserved_query").unwrap();
    assert!(
        reserved
            .omission_reason
            .as_deref()
            .unwrap()
            .contains("allowReserved")
    );

    let emitted = emit_rust("inline", &ops, &[]);
    assert!(emitted.contains("pub static OMITTED_OPERATIONS"));
    let supported_table = emitted
        .split("pub static OMITTED_OPERATIONS")
        .next()
        .unwrap();
    assert!(!supported_table.contains("name: \"wild_upload\""));
    assert!(emitted.contains("OmittedOperationSpec { name: \"wild_upload\""));
}

#[test]
fn extracted_operations_have_a_total_default_safety_before_emission() {
    let operations = extract_operations(&json!({ "paths": {
        "/items": { "get": {
            "operationId": "GetItems",
            "responses": { "200": {} }
        } }
    }}))
    .unwrap();

    assert_eq!(operations[0].safety, "Mutation");
    assert!(emit_rust("inline", &operations, &[]).contains("safety: OperationSafety::Mutation"));
}

#[test]
fn extract_operations_skips_phantom_path_params() {
    // Declared `in:path` param `path` with no `{path}` placeholder (the Servarr SPA
    // catch-all) must be dropped, not emitted as an unaddressable op.
    let spec = json!({
        "paths": {
            "/": {
                "get": {
                    "operationId": "getByPath",
                    "parameters": [{ "name": "path", "in": "path" }],
                    "responses": { "200": {} }
                }
            }
        }
    });
    let operations = extract_operations(&spec).unwrap();
    assert_eq!(operations.len(), 1);
    assert!(
        operations[0]
            .omission_reason
            .as_deref()
            .unwrap()
            .contains("no matching placeholder")
    );
}

#[test]
fn extract_operations_derives_name_when_operation_id_missing() {
    let spec = json!({
        "paths": {
            "/api/v3/system/status": { "get": { "responses": { "200": {} } } }
        }
    });
    let ops = extract_operations(&spec).unwrap();
    assert_eq!(ops.len(), 1);
    // `api` and the `v3` version segment are stripped from the derived name.
    assert_eq!(ops[0].name, "get_system_status");
}

#[test]
fn extract_operations_disambiguates_duplicate_names() {
    let spec = json!({
        "paths": {
            "/a": { "get": { "operationId": "ping", "responses": { "200": {} } } },
            "/b": { "get": { "operationId": "ping", "responses": { "200": {} } } }
        }
    });
    let mut names: Vec<String> = extract_operations(&spec)
        .unwrap()
        .into_iter()
        .map(|o| o.name)
        .collect();
    names.sort_unstable();
    assert_eq!(names, vec!["ping".to_string(), "ping_2".to_string()]);
}

#[test]
fn extract_types_renders_interface_and_enum() {
    let spec = json!({
        "components": { "schemas": {
            "Movie": { "type": "object", "properties": {
                "id": { "type": "integer" },
                "title": { "type": "string" }
            } },
            "Status": { "enum": ["pending", "done"] }
        } }
    });
    let types = extract_types(&spec);
    let movie = types.iter().find(|t| t.name == "Movie").unwrap();
    assert!(movie.ts.starts_with("export interface Movie"));
    assert!(movie.ts.contains("title"));
    let status = types.iter().find(|t| t.name == "Status").unwrap();
    assert!(status.ts.contains("export type Status ="));
    assert!(status.ts.contains("\"pending\""));
}

#[test]
fn extract_types_empty_when_no_components() {
    assert!(extract_types(&json!({ "paths": {} })).is_empty());
}
