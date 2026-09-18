//! Runtime tests for the generated-operation registry + scalar rendering.

use super::*;
use serde_json::{Value, json};

#[test]
fn scalar_rendering_covers_string_number_bool_only() {
    assert_eq!(scalar_to_string(&json!("x")).as_deref(), Some("x"));
    assert_eq!(scalar_to_string(&json!(42)).as_deref(), Some("42"));
    assert_eq!(scalar_to_string(&json!(true)).as_deref(), Some("true"));
    // Non-scalars are rejected so we never send `[object Object]`.
    assert!(scalar_to_string(&json!({"a": 1})).is_none());
    assert!(scalar_to_string(&json!([1, 2])).is_none());
    assert!(scalar_to_string(&json!(null)).is_none());
}

#[test]
fn find_operation_resolves_known_and_rejects_unknown() {
    // Sonarr is generated; a known op resolves and an unknown one does not.
    assert!(find_operation(ServiceKind::Sonarr, "get_system_status").is_some());
    assert!(find_operation(ServiceKind::Sonarr, "nope_not_real").is_none());
    // A doc-based kind has no generated operations.
    assert!(operations_for_kind(ServiceKind::Tautulli).is_empty());
    assert!(!is_generated(ServiceKind::Tautulli));
}

#[test]
fn generated_operation_safety_matches_reviewed_examples() {
    for kind in [
        ServiceKind::Sonarr,
        ServiceKind::Radarr,
        ServiceKind::Prowlarr,
        ServiceKind::Overseerr,
        ServiceKind::Jellyfin,
        ServiceKind::Plex,
    ] {
        for operation in operations_for_kind(kind) {
            assert_eq!(
                operation.safety.is_mutating(),
                operation.safety != OperationSafety::ReadOnly,
                "{}.{} has inconsistent safety metadata",
                kind.as_str(),
                operation.name
            );
        }
    }

    assert_eq!(
        find_operation(ServiceKind::Sonarr, "get_system_status")
            .unwrap()
            .safety,
        OperationSafety::Mutation
    );
    for (kind, name) in [
        (ServiceKind::Overseerr, "get_settings_discover_reset"),
        (ServiceKind::Plex, "add_subtitles"),
        (ServiceKind::Plex, "start_transcode_session"),
    ] {
        assert_eq!(
            find_operation(kind, name).unwrap().safety,
            OperationSafety::Mutation,
            "{kind:?}.{name} is a reviewed side-effecting GET"
        );
    }
    assert_eq!(
        find_operation(ServiceKind::Jellyfin, "get_metadata_editor_info")
            .unwrap()
            .safety,
        OperationSafety::ReadOnly
    );
    assert_eq!(
        find_operation(ServiceKind::Jellyfin, "delete_device")
            .unwrap()
            .safety,
        OperationSafety::Mutation
    );
    assert_eq!(
        find_operation(ServiceKind::Jellyfin, "delete_item")
            .unwrap()
            .safety,
        OperationSafety::Destructive
    );
    assert_eq!(
        find_operation(ServiceKind::Jellyfin, "start_restore_backup")
            .unwrap()
            .safety,
        OperationSafety::Destructive
    );
    assert_eq!(
        find_operation(ServiceKind::Plex, "terminate_session")
            .unwrap()
            .safety,
        OperationSafety::Destructive
    );
    for kind in [
        ServiceKind::Prowlarr,
        ServiceKind::Radarr,
        ServiceKind::Sonarr,
    ] {
        for name in [
            "post_system_backup_restore_by_id",
            "post_system_backup_restore_upload",
        ] {
            assert_eq!(
                find_operation(kind, name).unwrap().safety,
                OperationSafety::Destructive,
                "{kind:?}.{name} replaces current state"
            );
        }
    }
}

#[test]
fn file_deleting_operations_are_reviewed_destructive() {
    // These reviewed rows remove media or files from disk, so they must be
    // Destructive — the classification never keys off the HTTP verb, and it
    // has to cover the permitted input (for example `deleteFiles`).
    for (kind, name, why) in [
        (
            ServiceKind::Sonarr,
            "delete_series_by_id",
            "accepts `deleteFiles`",
        ),
        (
            ServiceKind::Radarr,
            "delete_movie_by_id",
            "accepts `deleteFiles`",
        ),
        (
            ServiceKind::Plex,
            "delete_media_item",
            "removes a library media item",
        ),
        (
            ServiceKind::Plex,
            "delete_metadata_item",
            "removes a library item",
        ),
        (
            ServiceKind::Jellyfin,
            "delete_alternate_sources",
            "removes alternate video sources",
        ),
        (
            ServiceKind::Jellyfin,
            "delete_lyrics",
            "deletes an external lyric file",
        ),
        (
            ServiceKind::Jellyfin,
            "delete_subtitle",
            "deletes an external subtitle file",
        ),
    ] {
        assert_eq!(
            find_operation(kind, name).unwrap().safety,
            OperationSafety::Destructive,
            "{kind:?}.{name} {why}"
        );
    }

    // A reviewed record-only DELETE stays a Mutation: safety is never inferred
    // from the verb, in either direction.
    assert_eq!(
        find_operation(ServiceKind::Sonarr, "delete_queue_by_id")
            .unwrap()
            .safety,
        OperationSafety::Mutation
    );
}

#[test]
fn generated_registry_exposes_explicit_omission_markers() {
    for kind in [
        ServiceKind::Sonarr,
        ServiceKind::Radarr,
        ServiceKind::Prowlarr,
        ServiceKind::Overseerr,
        ServiceKind::Jellyfin,
        ServiceKind::Plex,
    ] {
        for omitted in omitted_operations_for_kind(kind) {
            assert!(!omitted.name.is_empty());
            assert!(!omitted.path.is_empty());
            assert!(!omitted.reason.is_empty());
            assert!(find_operation(kind, omitted.name).is_none());
        }
    }
}

/// Table-invariant guard over EVERY generated operation across all 6 spec-backed
/// kinds. This enforces, at test time, the contracts the `OperationSpec` doc
/// comments describe but the (generated-data) types don't structurally guarantee —
/// so a regeneration that emits a bad method, a path/param mismatch, or a dangling
/// type reference fails CI instead of surfacing at request time.
#[test]
fn every_generated_operation_is_well_formed() {
    const KINDS: &[ServiceKind] = &[
        ServiceKind::Sonarr,
        ServiceKind::Radarr,
        ServiceKind::Prowlarr,
        ServiceKind::Overseerr,
        ServiceKind::Jellyfin,
        ServiceKind::Plex,
    ];
    for &kind in KINDS {
        let ops = operations_for_kind(kind);
        assert!(
            !ops.is_empty(),
            "{} should have generated ops",
            kind.as_str()
        );
        let type_names: std::collections::HashSet<&str> =
            types_for_kind(kind).iter().map(|t| t.name).collect();
        let mut seen = std::collections::HashSet::new();

        for op in ops {
            let where_ = format!("{}.{}", kind.as_str(), op.name);
            // 1. method is structurally typed and renders to the upstream verb.
            assert!(
                !op.method.as_str().is_empty(),
                "{where_}: method must render"
            );
            // 2. op names are unique per kind (callable dispatch keys).
            assert!(seen.insert(op.name), "{where_}: duplicate op name");
            // 3. Parameter metadata is complete and path placeholders match the
            // declared path parameters in both directions.
            for parameter in op.parameters {
                assert!(!parameter.name.is_empty(), "{where_}: unnamed parameter");
                serde_json::from_str::<Value>(parameter.schema).unwrap_or_else(|error| {
                    panic!("{where_}.{}: invalid schema JSON: {error}", parameter.name)
                });
                if parameter.location == ParameterLocation::Path {
                    assert!(parameter.required, "{where_}: path params are required");
                }
            }
            //    Placeholders may be whole-segment (`/{id}/`) OR embedded
            //    (`stream.{container}`), so scan for every `{name}` substring — the
            //    same way build_operation_url substitutes them.
            let mut placeholders: Vec<&str> = Vec::new();
            let mut rest = op.path;
            while let Some(open) = rest.find('{') {
                let after = &rest[open + 1..];
                let close = after.find('}').expect("balanced braces in generated path");
                placeholders.push(&after[..close]);
                rest = &after[close + 1..];
            }
            for ph in &placeholders {
                assert!(
                    op.parameters
                        .iter()
                        .any(|parameter| parameter.location == ParameterLocation::Path
                            && parameter.name == *ph),
                    "{where_}: path placeholder {{{ph}}} not in parameters"
                );
            }
            for pp in op
                .parameters
                .iter()
                .filter(|parameter| parameter.location == ParameterLocation::Path)
            {
                assert!(
                    placeholders.contains(&pp.name),
                    "{where_}: path parameter `{}` has no matching placeholder",
                    pp.name
                );
            }
            // 4. request/response type references resolve within the kind's TYPES.
            for ty in [op.request_type, op.response_type].into_iter().flatten() {
                assert!(
                    type_names.contains(ty),
                    "{where_}: type `{ty}` not found in generated TYPES"
                );
            }
            if let Some(body) = op.request_body {
                assert!(!body.representations.is_empty());
            }
            for representation in op
                .request_body
                .into_iter()
                .flat_map(|body| body.representations)
                .chain(op.responses.iter())
            {
                assert!(!representation.media_type.is_empty());
                serde_json::from_str::<Value>(representation.schema).unwrap_or_else(|error| {
                    panic!("{where_}: invalid representation schema JSON: {error}")
                });
                serde_json::from_str::<Value>(representation.encoding_metadata).unwrap_or_else(
                    |error| panic!("{where_}: invalid encoding metadata JSON: {error}"),
                );
            }
        }
    }
}
