//! Strict parsing tests for the private fleet bridge params.

use super::*;

#[test]
fn parses_exact_of_selector() {
    let invocation = parse_private_invocation(
        r#"{"selector":{"type":"of","name":"sonarr-4k"},"action":"service_status"}"#,
    )
    .expect("valid of selector");
    assert_eq!(
        invocation.selector,
        FleetSelector::Of {
            name: "sonarr-4k".to_owned()
        }
    );
    assert_eq!(invocation.action, "service_status");
    assert!(invocation.params.is_empty());
}

#[test]
fn parses_kind_filtered_all_selector() {
    let invocation = parse_private_invocation(
        r#"{"selector":{"type":"all","kind":"tautulli"},"action":"stats_activity","params":{"summary":true}}"#,
    )
    .expect("valid all selector");
    assert_eq!(
        invocation.selector,
        FleetSelector::All {
            kind: Some(ServiceKind::Tautulli)
        }
    );
    assert_eq!(invocation.params.get("summary"), Some(&Value::Bool(true)));
}

#[test]
fn all_selector_accepts_null_and_missing_kind() {
    for json in [
        r#"{"selector":{"type":"all","kind":null},"action":"service_status"}"#,
        r#"{"selector":{"type":"all"},"action":"service_status"}"#,
    ] {
        let invocation = parse_private_invocation(json).expect("kind is optional");
        assert_eq!(invocation.selector, FleetSelector::All { kind: None });
    }
}

#[test]
fn rejects_unknown_fields_everywhere() {
    let cases = [
        (
            r#"{"selector":{"type":"all"},"action":"service_status","extra":1}"#,
            "fleet params contains unknown field `extra`",
        ),
        (
            r#"{"selector":{"type":"of","name":"a","kind":"sonarr"},"action":"service_status"}"#,
            "fleet.of selector contains unknown field `kind`",
        ),
        (
            r#"{"selector":{"type":"all","kind":"sonarr","name":"a"},"action":"service_status"}"#,
            "fleet.all selector contains unknown field `name`",
        ),
    ];
    for (json, expected) in cases {
        let error = parse_private_invocation(json).expect_err("unknown field must fail");
        assert_eq!(error, expected);
    }
}

#[test]
fn rejects_malformed_shapes() {
    let cases = [
        (
            r#"{"selector":"all","action":"service_status"}"#,
            "fleet selector must be an object",
        ),
        (
            r#"{"selector":{"type":"some"},"action":"service_status"}"#,
            "fleet selector type must be `of` or `all`",
        ),
        (
            r#"{"selector":{"type":"of"},"action":"service_status"}"#,
            "fleet.of requires a name",
        ),
        (
            r#"{"selector":{"type":"all","kind":7},"action":"service_status"}"#,
            "fleet.all kind must be a string or null",
        ),
        (
            r#"{"selector":{"type":"all","kind":"nope"},"action":"service_status"}"#,
            "unknown yarr service kind",
        ),
        (
            r#"{"selector":{"type":"all"},"action":"  "}"#,
            "fleet action must be a non-empty string",
        ),
        (
            r#"{"selector":{"type":"all"},"action":"service_status","params":[]}"#,
            "fleet params.params must be a JSON object",
        ),
        ("[]", "fleet params must be a JSON object"),
        ("{", "invalid fleet params:"),
    ];
    for (json, expected) in cases {
        let error = parse_private_invocation(json).expect_err("malformed input must fail");
        assert!(
            error.contains(expected),
            "expected {expected:?} in {error:?}"
        );
    }
}

#[test]
fn leaf_labels_serialize_service_and_action() {
    let label = FleetLeafLabel {
        service: "sonarr".to_owned(),
        action: "api_delete".to_owned(),
    };
    let json = serde_json::to_value(&label).unwrap();
    assert_eq!(json["service"], "sonarr");
    assert_eq!(json["action"], "api_delete");
}
