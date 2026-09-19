use super::*;

#[test]
fn generic_action_metadata_is_complete_and_authoritative() {
    let codemode = action_spec("codemode").unwrap();
    assert!(codemode.mutates);
    assert!(!codemode.destructive);
    assert_eq!(codemode.required_params, &["code"]);

    let snippet_run = action_spec("snippet_run").unwrap();
    assert!(snippet_run.mutates);
    assert_eq!(snippet_run.required_params, &["name"]);
    assert_eq!(snippet_run.optional_params, &["input"]);

    let get = action_spec("api_get").unwrap();
    assert!(
        get.mutates,
        "a generic GET can resolve to a reviewed Mutation operation"
    );
    assert!(
        !get.destructive,
        "generic actions are only destructive after exact route classification"
    );

    let delete = action_spec("api_delete").unwrap();
    assert!(delete.mutates);
    assert!(
        !delete.destructive,
        "generic DELETE is not intrinsically destructive"
    );
}
use crate::config::ServiceKind;

#[test]
fn action_metadata_matches_yarr_surface() {
    assert_eq!(
        action_names(),
        vec![
            "service_status",
            "api_get",
            "api_post",
            "api_put",
            "api_delete",
            "help",
            "codemode",
            "op",
            "snippet_list",
            "snippet_save",
            "snippet_run",
            "snippet_delete",
        ]
    );
    assert_eq!(required_scope_for_action("api_get"), Some(WRITE_SCOPE));
    assert_eq!(required_scope_for_action("api_post"), Some(WRITE_SCOPE));
    assert_eq!(required_scope_for_action("api_put"), Some(WRITE_SCOPE));
    assert_eq!(required_scope_for_action("api_delete"), Some(WRITE_SCOPE));
    assert_eq!(required_scope_for_action("help"), None);
    assert_eq!(required_scope_for_action("codemode"), Some(WRITE_SCOPE));
    // `codemode` is MCP-only (and CLI via the infra path), so it is excluded from
    // the REST action surface.
    assert_eq!(
        rest_action_names(),
        vec![
            "service_status",
            "api_get",
            "api_post",
            "api_put",
            "api_delete",
            "help"
        ]
    );
    assert_eq!(
        mcp_only_action_names(),
        vec![
            "codemode",
            "op",
            "snippet_list",
            "snippet_save",
            "snippet_run",
            "snippet_delete"
        ]
    );
    assert_eq!(required_scope_for_action("snippet_list"), Some(READ_SCOPE));
    assert_eq!(required_scope_for_action("snippet_save"), Some(WRITE_SCOPE));
    // Snippet deletes are mutating-not-destructive.
    assert!(!action_is_destructive("snippet_delete"));
}

/// P2-4: every param a curated command declares (required + optional) — except
/// the always-string, globally-declared `service` — MUST carry a `ParamType` in
/// the command's `typed_params`, so the schema generator never falls back to the
/// `string` default for a param a handler treats as integer/array/boolean.
#[test]
fn typed_params_cover_every_declared_param() {
    for cmd in curated_commands() {
        for p in cmd.required_params.iter().chain(cmd.optional_params) {
            if *p == "service" {
                continue;
            }
            let declared = cmd.typed_params.iter().any(|(name, _)| name == p);
            assert!(
                declared,
                "command `{}` declares param `{p}` without a ParamType in typed_params",
                cmd.name
            );
        }
        // And every typed_params entry corresponds to a declared param (no orphans).
        for (name, _) in cmd.typed_params {
            let declared = cmd
                .required_params
                .iter()
                .chain(cmd.optional_params)
                .any(|p| p == name);
            assert!(
                declared,
                "command `{}` types param `{name}` that is not in required/optional params",
                cmd.name
            );
        }
    }
}

/// A given param NAME is a SHARED schema property under `additionalProperties:false`,
/// so it must carry ONE consistent type across every command that declares it —
/// otherwise the schema can only advertise one of them and `curated_param_type`'s
/// first-seen choice would silently mistype the others.
#[test]
fn typed_params_are_consistent_across_commands() {
    use std::collections::HashMap;
    let mut seen: HashMap<&str, ParamType> = HashMap::new();
    for cmd in curated_commands() {
        for (name, ty) in cmd.typed_params {
            if let Some(prev) = seen.get(name) {
                assert_eq!(
                    *prev, *ty,
                    "param `{name}` is typed inconsistently across commands ({prev:?} vs {ty:?})"
                );
            } else {
                seen.insert(name, *ty);
            }
        }
    }
}

#[test]
fn unknown_action_denies() {
    assert_eq!(required_scope_for_action("nope"), Some(DENY_SCOPE));
    assert!(!is_known_action("nope"));
}

#[test]
fn no_read_only_curated_command_carries_write_scope() {
    // Security S2: a non-mutating curated command must NEVER require write scope,
    // so read-only tokens work for dashboards.
    for cmd in curated_commands() {
        if !cmd.mutates {
            assert_ne!(
                cmd.required_scope, WRITE_SCOPE,
                "read-only command {} must not require write scope",
                cmd.name
            );
        }
    }
}

#[test]
fn action_allowed_for_kind_allows_infra_for_all_kinds() {
    for kind in ServiceKind::ALL {
        for action in action_names() {
            assert!(
                action_allowed_for_kind(action, kind),
                "infra action {action} should be allowed for {}",
                kind.as_str()
            );
        }
        // Unknown action fails closed for every kind.
        assert!(!action_allowed_for_kind("totally_unknown", kind));
    }
}

#[test]
fn valid_actions_for_kind_includes_infra() {
    let valid = valid_actions_for_kind(ServiceKind::Plex);
    assert!(valid.contains(&"service_status"));
    assert!(valid.contains(&"help"));
}

#[test]
fn curated_registry_populated_with_doc_based_commands() {
    // The doc-based capabilities (download, stats) keep curated commands; an
    // unknown name still misses. (Spec-backed kinds use generated ops instead.)
    assert!(!curated_commands().is_empty());
    assert!(curated_command("anything").is_none());
    assert!(curated_command("download_queue").is_some());
    assert!(curated_command("stats_activity").is_some());
}

#[test]
fn all_action_names_unions_generic_and_curated() {
    // Generic action names come first, then every curated command name.
    let names = all_action_names();
    for generic in action_names() {
        assert!(names.contains(&generic), "missing generic action {generic}");
    }
    for curated in curated_command_names() {
        assert!(names.contains(&curated), "missing curated action {curated}");
    }
    assert!(!curated_command_names().is_empty());
    // The curated param union is first-seen-ordered and de-duplicated. C1 read
    // commands contribute only `service`; C2 write commands add the selectors and
    // safety flags. Assert the union contains each declared param without pinning
    // exact ordering (so later beads can extend it freely).
    let params = curated_param_names();
    for expected in [
        "service",
        "url",
        "start",
        "length",
        "user",
        "id",
        "hash",
        "delete_files",
    ] {
        assert!(
            params.contains(&expected),
            "curated param union missing {expected}: {params:?}"
        );
    }
}

#[test]
fn required_params_mirror_parser_contract() {
    assert_eq!(required_params_for_action("help"), Vec::<&str>::new());
    assert_eq!(
        required_params_for_action("service_status"),
        vec!["service"]
    );
    assert_eq!(
        required_params_for_action("api_get"),
        vec!["service", "path"]
    );
    // The write passthroughs run immediately with no confirm param. On MCP,
    // confirmation is elicited only when the exact resolved route is reviewed
    // Destructive — it is never a call argument.
    assert_eq!(
        required_params_for_action("api_post"),
        vec!["service", "path"]
    );
    assert_eq!(
        required_params_for_action("api_delete"),
        vec!["service", "path"]
    );
}

#[test]
fn allowed_kind_names_covers_all_kinds_for_infra() {
    let all = allowed_kind_names_for_action("api_get");
    assert_eq!(all.len(), ServiceKind::ALL.len());
    // Unknown action → no allowed kinds (fail closed).
    assert!(allowed_kind_names_for_action("unknown").is_empty());
}

#[test]
fn action_is_destructive_covers_exactly_the_gated_set() {
    // The statically gated set is exactly the curated destructive deletes.
    for destructive in [
        "download_remove",
        "stats_delete_image_cache",
        "trace_terminate_stream",
    ] {
        assert!(
            action_is_destructive(destructive),
            "{destructive} must be destructive (gated)"
        );
    }
    // Transport shapes are route-dependent: destructiveness comes from the one
    // reviewed generated operation resolved at runtime, never from the action
    // name or the HTTP verb.
    for route_dependent in ["api_get", "api_post", "api_put", "api_delete", "op"] {
        assert!(
            action_has_route_dependent_safety(route_dependent),
            "{route_dependent} must be route-dependent"
        );
        assert!(
            !action_is_destructive(route_dependent),
            "{route_dependent} must not be statically destructive"
        );
    }
    // Representative non-destructive writes, reads, and the other passthroughs
    // must NOT be gated.
    for plain in [
        "set_quality",
        "add",
        "monitor",
        "search",
        "download_add",
        "media_scan",
        "request_create",
        "request_decline",
        "indexer_test",
        "stats_refresh_libraries",
        "list",
        "help",
        "unknown_action",
    ] {
        assert!(
            !action_is_destructive(plain),
            "{plain} must NOT be destructive"
        );
    }

    // SSOT invariant: for every curated command, action_is_destructive agrees
    // with the descriptor's `destructive` flag.
    for cmd in curated_commands() {
        assert_eq!(
            action_is_destructive(cmd.name),
            cmd.destructive,
            "{} destructive flag vs action_is_destructive mismatch",
            cmd.name
        );
    }
}

#[test]
fn capability_digest_lists_doc_based_commands() {
    // The digest renders the doc-based capabilities (download, stats) with their
    // commands and the kinds that share each capability.
    let digest = capability_digest().expect("digest should exist with download/stats commands");
    assert!(
        digest.contains("download_client("),
        "digest should label download capability: {digest}"
    );
    assert!(
        digest.contains("qbittorrent") || digest.contains("sabnzbd"),
        "download kinds should appear: {digest}"
    );
    assert!(
        digest.contains("download_queue"),
        "digest should list commands: {digest}"
    );
}

#[test]
fn download_commands_valid_only_for_download_kinds() {
    // A curated download command is allowed for sabnzbd/qbittorrent but rejected
    // for a non-download kind like plex.
    assert!(action_allowed_for_kind(
        "download_queue",
        ServiceKind::Qbittorrent
    ));
    assert!(action_allowed_for_kind(
        "download_queue",
        ServiceKind::Sabnzbd
    ));
    assert!(!action_allowed_for_kind(
        "download_queue",
        ServiceKind::Plex
    ));
    // And it appears in the valid-action list only for download kinds.
    assert!(valid_actions_for_kind(ServiceKind::Qbittorrent).contains(&"download_queue"));
    assert!(!valid_actions_for_kind(ServiceKind::Plex).contains(&"download_queue"));
    // allowed-kind names for a download command are a strict subset.
    let kinds = allowed_kind_names_for_action("download_queue");
    assert!(kinds.contains(&"sabnzbd") && kinds.contains(&"qbittorrent"));
    assert!(!kinds.contains(&"plex"));
    assert!(kinds.len() < ServiceKind::ALL.len());
}

/// Bazarr and Tracearr expose only their own curated capability in addition to
/// the shared infrastructure/passthrough actions.
#[test]
fn promoted_doc_based_kinds_accept_only_their_curated_capability() {
    assert!(action_allowed_for_kind(
        "subtitles_movies",
        ServiceKind::Bazarr
    ));
    assert!(!action_allowed_for_kind("trace_stats", ServiceKind::Bazarr));
    assert!(action_allowed_for_kind(
        "trace_stats",
        ServiceKind::Tracearr
    ));
    assert!(!action_allowed_for_kind(
        "subtitles_movies",
        ServiceKind::Tracearr
    ));

    for kind in [ServiceKind::Bazarr, ServiceKind::Tracearr] {
        assert!(action_allowed_for_kind("api_get", kind));
        assert!(valid_actions_for_kind(kind).len() > action_names().len());
    }
}
