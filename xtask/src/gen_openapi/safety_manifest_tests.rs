//! Contract coverage for unconsumed `OpenAPI` safety-manifest rows.

use super::*;
use serde_json::json;

#[test]
fn safety_manifest_rejects_unconsumed_rows_except_explicit_plex_exception() {
    let operations = extract_operations(&json!({ "paths": {
        "/reviewed": { "post": {
            "operationId": "ReviewedMutation",
            "responses": { "200": {} }
        } },
        "/extra": { "get": {
            "operationId": "ExtraRead",
            "responses": { "200": {} }
        } }
    }}))
    .unwrap();
    let manifest = r#"
[[operation]]
kind = "inline"
operation_id = "ReviewedMutation"
method = "POST"
path = "/reviewed"
safety = "Mutation"
reason = "Reviewed mutation."

[[operation]]
kind = "inline"
operation_id = "ExtraRead"
method = "GET"
path = "/extra"
safety = "ReadOnly"
reason = "Must not silently become an override."
"#;
    let error = validate_safety_manifest(
        "inline",
        &operations,
        manifest,
        &[SafetyCandidate::operation_id(
            "ReviewedMutation",
            "POST",
            "/reviewed",
        )],
    )
    .unwrap_err();
    assert_eq!(
        format!("{error:#}"),
        "unconsumed safety manifest row for inline GET /extra",
        "source-valid operation-ID rows outside the reviewed candidate inventory must fail"
    );

    let no_id_operations = extract_operations(&json!({ "paths": {
        "/extra-no-id": { "get": { "responses": { "200": {} } } }
    }}))
    .unwrap();
    let no_id_manifest = r#"
[[operation]]
kind = "inline"
method = "GET"
path = "/extra-no-id"
safety = "ReadOnly"
reason = "Must not silently become an override."
"#;
    let error =
        validate_safety_manifest("inline", &no_id_operations, no_id_manifest, &[]).unwrap_err();
    assert_eq!(
        format!("{error:#}"),
        "unconsumed safety manifest row for inline GET /extra-no-id",
        "source-valid method/path rows outside the reviewed candidate inventory must fail"
    );

    let plex_operations = extract_operations(&json!({ "paths": {
        "/status/sessions/terminate": { "post": {
            "operationId": "terminateSession",
            "responses": { "200": {} }
        } }
    }}))
    .unwrap();
    let plex_exception = r#"
[[operation]]
kind = "plex"
operation_id = "terminateSession"
method = "POST"
path = "/status/sessions/terminate"
safety = "Destructive"
reason = "Reviewed session termination."
"#;
    assert!(
        validate_safety_manifest("plex", &plex_operations, plex_exception, &[]).is_ok(),
        "the one reviewed Plex exception is intentionally outside the candidate selector"
    );
}
