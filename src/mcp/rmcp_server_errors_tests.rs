use super::*;
#[test]
fn read_scope_satisfies_read_requirement() {
    assert!(scope_satisfied(&scopes(&[READ_SCOPE]), READ_SCOPE));
}

#[test]
fn write_scope_satisfies_read_requirement() {
    assert!(
        scope_satisfied(&scopes(&[WRITE_SCOPE]), READ_SCOPE),
        "write scope should satisfy read requirement (write includes read)"
    );
}

#[test]
fn empty_scopes_denied() {
    assert!(!scope_satisfied(&[], READ_SCOPE));
}

#[test]
fn unrelated_scope_denied() {
    assert!(!scope_satisfied(&scopes(&["other:scope"]), READ_SCOPE));
}

#[test]
fn read_scope_does_not_satisfy_write() {
    assert!(
        !scope_satisfied(&scopes(&[READ_SCOPE]), WRITE_SCOPE),
        "read scope must not satisfy write requirement"
    );
}

#[test]
fn api_get_requires_write_scope() {
    assert_eq!(required_scope_for_action("api_get"), Some(WRITE_SCOPE));
}

#[test]
fn api_post_requires_write_scope() {
    assert_eq!(required_scope_for_action("api_post"), Some(WRITE_SCOPE));
}

#[test]
fn help_requires_no_scope() {
    assert_eq!(required_scope_for_action("help"), None);
}

#[test]
fn unknown_action_gets_deny_scope() {
    use crate::actions::DENY_SCOPE;
    assert_eq!(
        required_scope_for_action("nonexistent_action"),
        Some(DENY_SCOPE)
    );
}

#[test]
fn unknown_action_is_rejected_as_validation_before_scope() {
    let error = reject_unknown_action_before_scope("nonexistent_action")
        .expect_err("unknown action should be invalid params");
    assert!(error.message.contains("unknown yarr action"));
}

#[test]
fn yarr_effective_action_cannot_be_spoofed() {
    let state = sonarr_only_state();
    assert_eq!(
        effective_action(&state, "yarr", Some(&serde_json::Map::new())).unwrap(),
        Some("codemode".to_owned())
    );
    let spoof = serde_json::from_value::<serde_json::Map<String, serde_json::Value>>(json!({
        "action": "help",
        "code": "async () => 1"
    }))
    .unwrap();
    let error = effective_action(&state, "yarr", Some(&spoof)).unwrap_err();
    assert!(error.message.contains("does not accept `action`"));
}

#[test]
fn inactive_tools_are_rejected_in_both_modes() {
    let codemode = sonarr_only_state();
    let args = serde_json::from_value::<serde_json::Map<String, serde_json::Value>>(json!({
        "action": "help"
    }))
    .unwrap();
    assert!(effective_action(&codemode, "sonarr", Some(&args)).is_err());

    let mut flat = sonarr_only_state();
    flat.config.tool_mode = ToolMode::Flat;
    assert!(effective_action(&flat, "yarr", Some(&args)).is_err());
    assert_eq!(
        effective_action(&flat, "sonarr", Some(&args)).unwrap(),
        Some("help".to_owned())
    );
}

#[test]
fn internal_tool_errors_include_stable_kind() {
    let message = internal_tool_error_message("status");
    assert!(message.contains("kind=execution_error"));
    assert!(message.contains("action='status'"));
}

#[test]
fn upstream_failures_become_actionable_sanitized_tool_errors() {
    let error = anyhow::Error::new(crate::yarr::UpstreamError::Http {
        service: "sonarr-east".into(),
        status: reqwest::StatusCode::UNAUTHORIZED,
        body_preview: "password=super-secret&message=nope".into(),
        location: None,
    });
    let result = tool_error_result("sonarr-east", "service_status", &error);
    assert_eq!(result.is_error, Some(true));
    let text = result.content[0].as_text().unwrap().text.as_str();
    assert!(text.contains("tool=sonarr-east"));
    assert!(text.contains("action=service_status"));
    assert!(text.contains("class=upstream_http"));
    assert!(text.contains("Hint:"));
    assert!(!text.contains("super-secret"), "secret leaked: {text}");
    assert!(text.contains("[redacted]"));
}

#[test]
fn tool_result_from_json_applies_response_cap() {
    let result = tool_result_from_json(json!({
        "payload": "x".repeat(MAX_RESPONSE_BYTES + 1)
    }))
    .expect("tool result should serialize");
    let text = result.content[0]
        .as_text()
        .expect("tool result should contain text")
        .text
        .as_str();
    // The over-cap result is now a parseable JSON envelope with a truncation
    // marker (AN-6), not a notice appended after the JSON.
    let parsed: serde_json::Value =
        serde_json::from_str(text).expect("truncated tool result is valid JSON");
    assert_eq!(parsed["truncated"], true);
    assert!(text.len() <= MAX_RESPONSE_BYTES);
}

#[test]
fn declined_result_reports_declined_and_nothing_changed() {
    let result = declined_result("delete").expect("declined result builds");
    let text = result.content[0]
        .as_text()
        .expect("declined result should contain text")
        .text
        .as_str();
    let parsed: serde_json::Value =
        serde_json::from_str(text).expect("declined result is valid JSON");
    assert_eq!(parsed["declined"], json!(true));
    assert_eq!(parsed["action"], json!("delete"));
    assert!(
        parsed["note"]
            .as_str()
            .is_some_and(|n| n.contains("nothing was changed")),
        "declined result must state nothing changed: {parsed}"
    );
}

#[test]
fn destructive_op_call_flags_generated_delete_ops() {
    // sonarr.delete_series_by_id is a generated DELETE op — action_is_destructive
    // has no notion of `op`'s underlying HTTP method, so the MCP elicitation gate
    // checks this separately (is_destructive_op_call) to cover it too, e.g. when
    // reached directly via flat tool mode.
    let state = sonarr_only_state();
    assert!(is_destructive_op_call(
        &state,
        "sonarr",
        &json!({ "op": "delete_series_by_id" })
    ));
}

#[test]
fn destructive_op_call_flags_non_delete_high_impact_ops() {
    let state = plex_only_state();
    assert!(is_destructive_op_call(
        &state,
        "plex_den",
        &json!({ "op": "terminate_session" })
    ));
    assert!(is_destructive_op_call(
        &state,
        "plex_den",
        &json!({ "op": "scan" })
    ));
}

#[test]
fn destructive_op_call_ignores_non_delete_ops() {
    let state = sonarr_only_state();
    assert!(!is_destructive_op_call(
        &state,
        "sonarr",
        &json!({ "op": "get_series" })
    ));
}

#[test]
fn destructive_op_call_ignores_unknown_service_or_op() {
    let state = sonarr_only_state();
    assert!(!is_destructive_op_call(
        &state,
        "not-configured",
        &json!({ "op": "delete_series_by_id" })
    ));
    assert!(!is_destructive_op_call(
        &state,
        "sonarr",
        &json!({ "op": "no_such_op" })
    ));
    assert!(!is_destructive_op_call(&state, "sonarr", &json!({})));
}
