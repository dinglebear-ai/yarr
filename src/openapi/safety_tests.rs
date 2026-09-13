use super::*;
use crate::{
    config::ServiceKind,
    openapi::safety::{
        classify_operation, operation_safety, validate_generated_write_classification,
    },
};

#[test]
fn operation_safety_is_explicit_and_fails_closed_for_writes() {
    let cases = [
        (
            ServiceKind::Sonarr,
            "get_system_status",
            false,
            false,
            false,
        ),
        (ServiceKind::Sonarr, "delete_series_by_id", true, true, true),
        (ServiceKind::Radarr, "post_movie", true, false, false),
        (ServiceKind::Plex, "terminate_session", true, true, true),
    ];

    for (kind, operation, mutates, destructive, elicitation_required) in cases {
        let safety = operation_safety(kind, operation)
            .unwrap_or_else(|| panic!("missing classification for {}.{operation}", kind.as_str()));
        assert_eq!(
            (
                safety.mutates,
                safety.destructive,
                safety.elicitation_required
            ),
            (mutates, destructive, elicitation_required),
            "{}.{operation}",
            kind.as_str()
        );
    }

    let unknown_write = OperationSpec {
        name: "post_unclassified",
        method: HttpMethod::Post,
        path: "/unclassified",
        path_params: &[],
        query_params: &[],
        has_body: false,
        parameters: &[],
        request_body: None,
        responses: &[],
        request_type: None,
        response_type: None,
        tag: "test",
        summary: "test",
    };
    let error = classify_operation(ServiceKind::Jellyfin, &unknown_write)
        .expect_err("unknown generated write must fail closed");
    assert!(error.contains("jellyfin"));
    assert!(error.contains("post_unclassified"));
    assert!(error.contains("unclassified generated write"));
}

#[test]
fn validator_covers_the_entire_generated_write_registry() {
    validate_generated_write_classification()
        .expect("every generated POST, PUT, and PATCH must have one audited row");
}

#[test]
fn generated_write_audit_has_the_expected_complete_aggregate() {
    let expected = [
        (ServiceKind::Jellyfin, 130),
        (ServiceKind::Overseerr, 62),
        (ServiceKind::Plex, 90),
        (ServiceKind::Prowlarr, 46),
        (ServiceKind::Radarr, 82),
        (ServiceKind::Sonarr, 82),
    ];

    for (kind, expected_count) in expected {
        let actual_count = operations_for_kind(kind)
            .iter()
            .filter(|spec| {
                matches!(
                    spec.method,
                    HttpMethod::Post | HttpMethod::Put | HttpMethod::Patch
                )
            })
            .filter(|spec| classify_operation(kind, spec).is_ok())
            .count();
        assert_eq!(
            actual_count,
            expected_count,
            "{} audited writes",
            kind.as_str()
        );
    }
}
