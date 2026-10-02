//! OpenAPI path/operation extraction and support classification.

use std::collections::BTreeMap;

use anyhow::{Context, Result};
use serde_json::Value;

use super::naming::{derive_name, to_snake, unique};
use super::{OperationOut, ParameterOut, RepresentationOut, RequestBodyOut};

const METHODS: &[&str] = &["get", "post", "put", "delete", "patch"];

pub(super) fn server_base_path(root: &Value) -> String {
    let url = root
        .get("servers")
        .and_then(Value::as_array)
        .and_then(|servers| servers.first())
        .and_then(|server| server.get("url"))
        .and_then(Value::as_str)
        .unwrap_or("");
    let after_host = url.split_once("://").map(|(_, rest)| rest).unwrap_or(url);
    after_host
        .find('/')
        .map(|index| after_host[index..].trim_end_matches('/').to_string())
        .unwrap_or_default()
}

pub(super) fn extract_operations(root: &Value) -> Result<Vec<OperationOut>> {
    let base = server_base_path(root);
    let paths = root
        .get("paths")
        .and_then(Value::as_object)
        .context("spec has no `paths`")?;
    let mut operations = Vec::new();
    let mut used = BTreeMap::new();

    for (raw_path, path_item) in paths {
        let path = format!("{base}{raw_path}");
        for method in METHODS {
            let Some(operation) = path_item.get(method) else {
                continue;
            };
            operations.push(extract_operation(
                root, path_item, operation, method, &path, &mut used,
            ));
        }
    }
    operations.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(operations)
}

fn extract_operation(
    root: &Value,
    path_item: &Value,
    operation: &Value,
    method: &str,
    path: &str,
    used: &mut BTreeMap<String, u32>,
) -> OperationOut {
    let mut reasons = Vec::new();
    let parameters = extract_parameters(root, path_item, operation, &mut reasons);
    let path_params = parameters
        .iter()
        .filter(|parameter| parameter.location == "path")
        .map(|parameter| parameter.name.clone())
        .collect::<Vec<_>>();
    for parameter in &path_params {
        if !path.contains(&format!("{{{parameter}}}")) {
            reasons.push(format!(
                "path parameter `{parameter}` has no matching placeholder"
            ));
        }
    }

    let request_body = extract_request_body(root, operation, &mut reasons).or_else(|| {
        // Servarr's generated document omits the form-file request body from the
        // backup restore upload route even though the endpoint consumes it. Keep
        // the audited compatibility row in generated data rather than production
        // dispatch code or repository-relative fixture handling.
        path.ends_with("/system/backup/restore/upload").then(|| RequestBodyOut {
            required: true,
            representations: vec![RepresentationOut {
                status: None,
                media_type: "multipart/form-data".to_string(),
                encoding: "multipart".to_string(),
                schema: r#"{"type":"object","required":["file"],"properties":{"file":{"type":"string","format":"binary"}}}"#.to_string(),
                encoding_metadata: r#"{"file":{"contentType":"application/zip"}}"#.to_string(),
            }],
        })
    });
    let responses = extract_responses(root, operation, &mut reasons);
    let request_type = request_body
        .as_ref()
        .and_then(|body| body.representations.first())
        .and_then(|representation| type_name_from_json(&representation.schema));
    let response_type = responses
        .first()
        .and_then(|representation| type_name_from_json(&representation.schema));
    let operation_id = operation
        .get("operationId")
        .and_then(Value::as_str)
        .filter(|operation_id| !operation_id.trim().is_empty())
        .map(str::to_string);
    let base_name = operation
        .get("operationId")
        .and_then(Value::as_str)
        .map(to_snake)
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| derive_name(method, path, &path_params));
    let name = unique(used, base_name);
    let tag = operation
        .get("tags")
        .and_then(Value::as_array)
        .and_then(|tags| tags.first())
        .and_then(Value::as_str)
        .unwrap_or("default")
        .to_string();
    let summary = operation
        .get("summary")
        .or_else(|| operation.get("description"))
        .and_then(Value::as_str)
        .unwrap_or("")
        .lines()
        .next()
        .unwrap_or("")
        .chars()
        .take(200)
        .collect();

    OperationOut {
        name,
        operation_id,
        method: method.to_uppercase(),
        path: path.to_string(),
        safety: super::DEFAULT_SAFETY.to_string(),
        parameters,
        request_body,
        responses,
        request_type,
        response_type,
        tag,
        summary,
        omission_reason: (!reasons.is_empty()).then(|| reasons.join("; ")),
    }
}

fn extract_parameters(
    root: &Value,
    path_item: &Value,
    operation: &Value,
    reasons: &mut Vec<String>,
) -> Vec<ParameterOut> {
    let mut merged: BTreeMap<(String, String), Value> = BTreeMap::new();
    for container in [path_item, operation] {
        let Some(parameters) = container.get("parameters").and_then(Value::as_array) else {
            continue;
        };
        for raw in parameters {
            let parameter = resolve_owned(root, raw);
            let Some(name) = parameter.get("name").and_then(Value::as_str) else {
                reasons.push("parameter has no name".to_string());
                continue;
            };
            let Some(location) = parameter.get("in").and_then(Value::as_str) else {
                reasons.push(format!("parameter `{name}` has no location"));
                continue;
            };
            merged.insert((name.to_string(), location.to_string()), parameter);
        }
    }

    merged
        .into_values()
        .map(|parameter| parameter_out(&parameter, reasons))
        .collect()
}

fn parameter_out(parameter: &Value, reasons: &mut Vec<String>) -> ParameterOut {
    let name = parameter["name"].as_str().unwrap_or_default().to_string();
    let location = parameter["in"].as_str().unwrap_or_default().to_string();
    let required =
        location == "path" || parameter.get("required").and_then(Value::as_bool) == Some(true);
    let style = parameter
        .get("style")
        .and_then(Value::as_str)
        .unwrap_or_else(|| default_style(&location))
        .to_string();
    let explode = parameter
        .get("explode")
        .and_then(Value::as_bool)
        .unwrap_or(style == "form");
    let schema = parameter.get("schema").cloned().unwrap_or(Value::Null);
    if parameter.get("content").is_some() {
        reasons.push(format!(
            "parameter `{name}` uses unsupported content encoding"
        ));
    }
    if parameter.get("allowReserved").and_then(Value::as_bool) == Some(true) {
        reasons.push(format!(
            "parameter `{name}` requires allowReserved serialization"
        ));
    }
    if !supports_parameter_style(&location, &style) {
        reasons.push(format!(
            "parameter `{name}` uses unsupported {location} style `{style}`"
        ));
    }
    ParameterOut {
        name,
        location,
        required,
        schema: compact_json(&schema),
        style,
        explode,
    }
}

fn extract_request_body(
    root: &Value,
    operation: &Value,
    reasons: &mut Vec<String>,
) -> Option<RequestBodyOut> {
    let raw = operation.get("requestBody")?;
    let body = resolve_owned(root, raw);
    let required = body.get("required").and_then(Value::as_bool) == Some(true);
    let representations = extract_content(body.get("content"), None, reasons);
    if representations.is_empty() {
        reasons.push("request body has no supported representation".to_string());
    }
    Some(RequestBodyOut {
        required,
        representations,
    })
}

fn extract_responses(
    root: &Value,
    operation: &Value,
    reasons: &mut Vec<String>,
) -> Vec<RepresentationOut> {
    let Some(responses) = operation.get("responses").and_then(Value::as_object) else {
        return Vec::new();
    };
    let mut output = Vec::new();
    for (status, raw) in responses
        .iter()
        .filter(|(status, _)| status.starts_with('2') || status.as_str() == "default")
    {
        let response = resolve_owned(root, raw);
        output.extend(extract_content(
            response.get("content"),
            Some(status),
            reasons,
        ));
    }
    output
}

fn extract_content(
    content: Option<&Value>,
    status: Option<&str>,
    reasons: &mut Vec<String>,
) -> Vec<RepresentationOut> {
    let Some(content) = content.and_then(Value::as_object) else {
        return Vec::new();
    };
    content
        .iter()
        .map(|(media_type, media)| {
            let encoding = representation_encoding(media_type, media.get("schema"));
            if encoding.is_none() {
                reasons.push(format!("unsupported media type `{media_type}`"));
            }
            RepresentationOut {
                status: status.map(str::to_string),
                media_type: media_type.to_string(),
                encoding: encoding.unwrap_or("unsupported").to_string(),
                schema: compact_json(media.get("schema").unwrap_or(&Value::Null)),
                encoding_metadata: compact_json(media.get("encoding").unwrap_or(&Value::Null)),
            }
        })
        .collect()
}

fn representation_encoding(media_type: &str, schema: Option<&Value>) -> Option<&'static str> {
    let lower = media_type.to_ascii_lowercase();
    if lower == "*/*" {
        None
    } else if lower == "application/x-www-form-urlencoded" {
        Some("form")
    } else if lower == "multipart/form-data" {
        Some("multipart")
    } else if schema
        .and_then(|schema| schema.get("format"))
        .and_then(Value::as_str)
        == Some("binary")
    {
        // OpenAPI's schema format carries the wire semantics. In particular,
        // Jellyfin models raw lyric/file uploads as `text/plain` plus
        // `format: binary`; those bytes must not pass through UTF-8 coercion.
        Some("binary")
    } else if lower.contains("json") {
        Some("json")
    } else if lower.starts_with("text/") || lower.contains("xml") {
        Some("text")
    } else {
        Some("binary")
    }
}

fn default_style(location: &str) -> &'static str {
    match location {
        "query" | "cookie" => "form",
        _ => "simple",
    }
}

fn supports_parameter_style(location: &str, style: &str) -> bool {
    matches!(
        (location, style),
        ("path", "matrix" | "label" | "simple")
            | (
                "query",
                "form" | "spaceDelimited" | "pipeDelimited" | "deepObject"
            )
            | ("header", "simple")
            | ("cookie", "form")
    )
}

fn resolve_owned(root: &Value, value: &Value) -> Value {
    value
        .get("$ref")
        .and_then(Value::as_str)
        .and_then(|pointer| resolve_pointer(root, pointer))
        .cloned()
        .unwrap_or_else(|| value.clone())
}

pub(super) fn resolve_pointer<'a>(root: &'a Value, pointer: &str) -> Option<&'a Value> {
    let mut current = root;
    for segment in pointer.strip_prefix("#/")?.split('/') {
        current = current.get(segment.replace("~1", "/").replace("~0", "~"))?;
    }
    Some(current)
}

fn compact_json(value: &Value) -> String {
    serde_json::to_string(value).expect("serde_json::Value always serializes")
}

fn type_name_from_json(schema: &str) -> Option<String> {
    let schema: Value = serde_json::from_str(schema).ok()?;
    type_name(&schema)
}

pub(super) fn type_name(schema: &Value) -> Option<String> {
    if let Some(reference) = schema.get("$ref").and_then(Value::as_str) {
        return reference.rsplit('/').next().map(str::to_string);
    }
    (schema.get("type").and_then(Value::as_str) == Some("array"))
        .then(|| schema.get("items"))
        .flatten()
        .and_then(type_name)
}
