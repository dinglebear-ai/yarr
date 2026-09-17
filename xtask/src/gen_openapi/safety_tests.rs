//! Safety-manifest tests for the `OpenAPI` generator.

use super::safety::SafetyIdentity;
use super::*;
use serde_json::json;

#[test]
fn safety_manifest_requires_reviewed_candidate_rows_and_exact_source_identity() {
    let spec = json!({ "paths": {
        "/items/{id}": { "delete": { "operationId": "DeleteItem", "responses": { "204": {} } } },
        "/reset": { "get": { "responses": { "200": {} } } }
    }});
    let operations = extract_operations(&spec).unwrap();
    let manifest = r#"
[[operation]]
kind = "jellyfin"
operation_id = "DeleteItem"
method = "DELETE"
path = "/items/{id}"
safety = "Destructive"
reason = "Reviewed deletion."

[[operation]]
kind = "jellyfin"
method = "GET"
path = "/reset"
safety = "Mutation"
reason = "Reviewed side effect."
"#;
    assert!(
        validate_safety_manifest(
            "jellyfin",
            &operations,
            manifest,
            &[
                SafetyCandidate::operation_id("DeleteItem", "DELETE", "/items/{id}"),
                SafetyCandidate::method_path("GET", "/reset"),
            ],
        )
        .is_ok()
    );
    assert!(
        validate_safety_manifest(
            "jellyfin",
            &operations,
            "",
            &[SafetyCandidate::operation_id(
                "DeleteItem",
                "DELETE",
                "/items/{id}"
            )],
        )
        .is_err()
    );
    assert!(
        validate_safety_manifest(
            "jellyfin",
            &operations,
            manifest.replace("/items/{id}", "/drifted").as_str(),
            &[SafetyCandidate::operation_id(
                "DeleteItem",
                "DELETE",
                "/items/{id}"
            )],
        )
        .is_err()
    );
}

#[test]
fn safety_candidates_reject_missing_no_operation_id_method_path_row() {
    let spec = json!({ "paths": {
        "/safe": { "get": { "responses": { "200": {} } } },
        "/reset": { "get": { "responses": { "200": {} } } }
    }});
    let operations = extract_operations(&spec).unwrap();
    let manifest = r#"
[[operation]]
kind = "inline"
method = "GET"
path = "/safe"
safety = "ReadOnly"
reason = "Reviewed retrieval."
"#;

    assert!(
        validate_safety_manifest(
            "inline",
            &operations,
            manifest,
            &[SafetyCandidate::method_path("GET", "/reset")],
        )
        .is_err()
    );
}

#[test]
fn no_operation_id_candidates_use_source_path_not_derived_callable_name() {
    let mut operations = extract_operations(&json!({ "paths": {
        "/reset": { "get": { "responses": { "200": {} } } }
    }}))
    .unwrap();
    assert_eq!(operations[0].operation_id, None);

    // Callable names are generator-owned implementation details. Changing one
    // must not alter reviewed method/path candidate discovery.
    operations[0].name = "renamed_callable".to_string();

    let candidates = safety_candidates(&operations);
    assert_eq!(candidates.len(), 1);
    assert_eq!(
        candidates[0].identity("inline"),
        SafetyIdentity::new("inline", None, "GET", "/reset")
    );
}

#[test]
fn no_operation_id_delete_candidates_use_source_method_not_derived_callable_name() {
    let mut operations = extract_operations(&json!({ "paths": {
        "/items/{id}": { "delete": { "responses": { "204": {} } } }
    }}))
    .unwrap();
    assert_eq!(operations[0].operation_id, None);

    operations[0].name = "renamed_callable".to_string();

    let candidates = safety_candidates(&operations);
    assert_eq!(candidates.len(), 1);
    assert_eq!(
        candidates[0].identity("inline"),
        SafetyIdentity::new("inline", None, "DELETE", "/items/{id}")
    );
}

#[test]
fn safety_manifest_uses_strict_toml_and_decodes_quoted_values() {
    let operations = extract_operations(&json!({ "paths": {
        "/quoted": { "get": { "operationId": "quoted", "responses": { "200": {} } } }
    }}))
    .unwrap();
    let manifest = r#"
[[operation]]
kind = "inline"
operation_id = "quoted"
method = "GET"
path = "/quoted"
safety = "ReadOnly"
reason = "A quoted \"review\" reason."
unexpected = "must fail"
"#;

    let error = validate_safety_manifest(
        "inline",
        &operations,
        manifest,
        &[SafetyCandidate::operation_id("quoted", "GET", "/quoted")],
    )
    .unwrap_err();
    assert!(format!("{error:#}").contains("unexpected"));
}

#[test]
fn unreviewed_operations_default_to_mutation() {
    for method in ["GET", "POST", "PUT", "PATCH", "DELETE"] {
        assert_eq!(default_safety(method), "Mutation", "{method}");
    }
}

#[test]
fn safety_manifest_rejects_an_unknown_service_kind() {
    let operations = extract_operations(&json!({ "paths": {
        "/items": { "get": { "responses": { "200": {} } } }
    }}))
    .unwrap();
    let manifest = r#"
[[operation]]
kind = "unknown-service"
method = "GET"
path = "/items"
safety = "Mutation"
reason = "Must not be silently ignored."
"#;

    assert!(
        validate_safety_manifest("inline", &operations, manifest, &[]).is_err(),
        "unknown manifest kinds must fail rather than being filtered out"
    );
}

#[test]
fn empty_source_operation_id_uses_method_path_identity() {
    let operations = extract_operations(&json!({ "paths": {
        "/items": { "get": {
            "operationId": "",
            "responses": { "200": {} }
        } }
    }}))
    .unwrap();
    assert_eq!(operations[0].operation_id, None);

    let manifest = r#"
[[operation]]
kind = "inline"
method = "GET"
path = "/items"
safety = "Mutation"
reason = "The source has no stable operation ID."
"#;
    assert!(
        validate_safety_manifest(
            "inline",
            &operations,
            manifest,
            &[SafetyCandidate::method_path("GET", "/items")],
        )
        .is_ok()
    );
}

#[test]
fn safety_manifest_rejects_duplicate_raw_source_operation_ids() {
    let operations = extract_operations(&json!({ "paths": {
        "/items/{id}": { "get": {
            "operationId": "SharedId",
            "responses": { "200": {} }
        } },
        "/other/{id}": { "get": {
            "operationId": "SharedId",
            "responses": { "200": {} }
        } }
    }}))
    .unwrap();
    let manifest = r#"
[[operation]]
kind = "inline"
operation_id = "SharedId"
method = "GET"
path = "/items/{id}"
safety = "ReadOnly"
reason = "Reviewed retrieval."
"#;

    assert!(
        validate_safety_manifest(
            "inline",
            &operations,
            manifest,
            &[SafetyCandidate::operation_id(
                "SharedId",
                "GET",
                "/items/{id}"
            )],
        )
        .is_err(),
        "a raw source operation ID must resolve exactly one operation before path pinning"
    );
}

#[test]
fn safety_manifest_rejects_malformed_or_stale_rows() {
    let operations = extract_operations(&json!({ "paths": {
        "/items/{id}": { "get": {
            "operationId": "GetItem",
            "responses": { "200": {} }
        } }
    }}))
    .unwrap();
    let candidate = SafetyCandidate::operation_id("GetItem", "GET", "/items/{id}");
    let valid = r#"
[[operation]]
kind = "inline"
operation_id = "GetItem"
method = "GET"
path = "/items/{id}"
safety = "ReadOnly"
reason = "Reviewed retrieval."
"#;
    let cases = [
        ("duplicate", format!("{valid}\n{valid}")),
        (
            "stale operation ID",
            valid.replace("GetItem", "MissingItem"),
        ),
        (
            "mismatched source path",
            valid.replace("/items/{id}", "/items/{other}"),
        ),
        (
            "operation ID omitted for an identified source operation",
            valid.replace("operation_id = \"GetItem\"\n", ""),
        ),
        ("blank operation ID", valid.replace("GetItem", "   ")),
        ("lowercase method", valid.replace("GET", "get")),
        (
            "invalid safety token",
            valid.replace("ReadOnly", "readonly"),
        ),
        ("blank reason", valid.replace("Reviewed retrieval.", "   ")),
        (
            "missing required reason",
            valid.replace("reason = \"Reviewed retrieval.\"\n", ""),
        ),
        ("malformed TOML", "operation = [".to_string()),
    ];

    for (case, manifest) in cases {
        assert!(
            validate_safety_manifest(
                "inline",
                &operations,
                &manifest,
                std::slice::from_ref(&candidate)
            )
            .is_err(),
            "{case} must fail validation"
        );
    }
}

#[test]
fn reviewed_manifest_can_explicitly_classify_get_operations() {
    let operations = extract_operations(&json!({ "paths": {
        "/read": { "get": {
            "operationId": "Read",
            "responses": { "200": {} }
        } },
        "/purge": { "get": {
            "operationId": "Purge",
            "responses": { "200": {} }
        } }
    }}))
    .unwrap();
    let manifest = r#"
[[operation]]
kind = "inline"
operation_id = "Read"
method = "GET"
path = "/read"
safety = "ReadOnly"
reason = "Source documents a retrieval-only endpoint."

[[operation]]
kind = "inline"
operation_id = "Purge"
method = "GET"
path = "/purge"
safety = "Destructive"
reason = "Source documents irreversible purge behavior."
"#;
    let reviewed = validate_safety_manifest("inline", &operations, manifest, &[]).unwrap();

    assert_eq!(
        reviewed
            .get(&("GET".to_string(), "/read".to_string()))
            .map(|row| row.safety.as_str()),
        Some("ReadOnly")
    );
    assert_eq!(
        reviewed
            .get(&("GET".to_string(), "/purge".to_string()))
            .map(|row| row.safety.as_str()),
        Some("Destructive")
    );
}
