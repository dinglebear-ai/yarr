use super::*;
use crate::actions::YarrAction;
use crate::config::{ServiceConfig, ServiceKind, YarrConfig};
use crate::openapi::OperationSafety;
use crate::testing::loopback_state;
use crate::yarr::YarrClient;

fn generated_service(name: &str, kind: ServiceKind) -> crate::app::YarrService {
    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: name.into(),
            kind,
            base_url: "http://127.0.0.1:1".into(),
            ..ServiceConfig::default()
        }],
    };
    crate::app::YarrService::new(YarrClient::new(&config).unwrap(), config)
}

fn jellyfin_service() -> crate::app::YarrService {
    generated_service("jellyfin", ServiceKind::Jellyfin)
}

#[test]
fn generic_calls_require_a_unique_generated_route_match() {
    let service = jellyfin_service();
    let classified = super::classify_action(
        &service,
        &YarrAction::ApiGet {
            service: "jellyfin".into(),
            path: "/Auth/PasswordResetProviders?include=ignored".into(),
        },
    )
    .expect("generated GET route with only a query suffix must classify");
    assert_eq!(classified.safety, OperationSafety::ReadOnly);

    let unknown = super::classify_action(
        &service,
        &YarrAction::ApiGet {
            service: "jellyfin".into(),
            path: "/not-a-generated-route".into(),
        },
    )
    .expect_err("unmatched api_get must fail closed; GET is not safety evidence");
    assert!(
        unknown
            .to_string()
            .contains("no unique generated operation")
    );
}

#[test]
fn static_read_actions_keep_their_registry_scope() {
    let service = jellyfin_service();
    let classified = super::classify_action(
        &service,
        &YarrAction::ServiceStatus {
            service: "jellyfin".into(),
        },
    )
    .expect("service status should classify without dispatching");

    assert_eq!(classified.safety, OperationSafety::ReadOnly);
    assert_eq!(classified.required_scope, Some(crate::actions::READ_SCOPE));
    assert!(!classified.destructive);
}

#[test]
fn generated_operation_metadata_controls_destructive_admission() {
    let sonarr = generated_service("sonarr", ServiceKind::Sonarr);
    let mutation_delete = super::classify_action(
        &sonarr,
        &YarrAction::Op {
            service: "sonarr".into(),
            op: "delete_queue_by_id".into(),
            args: serde_json::json!({}),
        },
    )
    .expect("known generated operation classifies");
    assert_eq!(mutation_delete.safety, OperationSafety::Mutation);
    assert!(!mutation_delete.destructive);

    // The file-deleting delete-by-id route (`deleteFiles`) classifies
    // Destructive through the generic passthrough too.
    let destructive_generic = super::classify_action(
        &sonarr,
        &YarrAction::ApiDelete {
            service: "sonarr".into(),
            path: "/api/v3/series/1".into(),
            body: None,
        },
    )
    .expect("reviewed file-deleting DELETE route classifies");
    assert_eq!(destructive_generic.safety, OperationSafety::Destructive);
    assert!(destructive_generic.destructive);

    let plex = generated_service("plex", ServiceKind::Plex);
    let destructive_put = super::classify_action(
        &plex,
        &YarrAction::Op {
            service: "plex".into(),
            op: "empty_trash".into(),
            args: serde_json::json!({}),
        },
    )
    .expect("known generated operation classifies");
    assert_eq!(destructive_put.safety, OperationSafety::Destructive);
    assert!(destructive_put.destructive);
}

#[tokio::test]
async fn help_action_dispatches_to_generated_help() {
    // The shared dispatch returns the MCP help shape `{ "help": <markdown> }`
    // (the CLI renders the structured rest_help payload directly, not through here).
    let state = loopback_state();
    let result = execute_service_action(&state.service, &YarrAction::Help)
        .await
        .unwrap();
    let text = result
        .get("help")
        .and_then(|v| v.as_str())
        .expect("help payload carries a `help` markdown string");
    assert!(text.contains("# yarr MCP Tool"));
}

#[tokio::test]
async fn help_action_dispatches() {
    let state = loopback_state();
    let result = execute_service_action(&state.service, &YarrAction::Help)
        .await
        .unwrap();
    assert!(result.get("help").is_some());
}

#[test]
fn shared_guard_allows_infra_actions_for_configured_kind() {
    // loopback_state configures a sonarr (ArrManager) service. Every infra action
    // is allowed for it via the shared guard.
    let state = loopback_state();
    for action in ["service_status", "api_get", "api_post"] {
        validate_action_for_service(&state.service, action, "sonarr")
            .unwrap_or_else(|e| panic!("{action} should be allowed for sonarr: {e}"));
    }
}

#[test]
fn shared_guard_rejects_action_invalid_for_kind_with_valid_actions() {
    // A non-infra, non-curated (unknown) action fails closed and the error carries
    // the valid-action list so its Display teaches the agent (AN-2). `set_quality`
    // is now a real arr command (valid for sonarr), so use an unknown name here.
    let state = loopback_state();
    let err = validate_action_for_service(&state.service, "totally_unknown", "sonarr")
        .expect_err("totally_unknown is not valid for sonarr");
    let msg = err.to_string();
    assert!(msg.contains("not valid for kind=sonarr"), "msg: {msg}");
    assert!(msg.contains("valid actions for sonarr"), "msg: {msg}");
    // The valid-action list includes the infra actions for that kind.
    assert!(msg.contains("service_status"), "msg: {msg}");
    assert!(crate::actions::is_validation_error(&err));
}

#[test]
fn shared_guard_allows_curated_write_command_for_matching_kind() {
    // A curated download command is allowed for a DownloadClient kind and rejected
    // for a mismatched kind — verified via the registry guard directly (no
    // configured service needed).
    use crate::actions::action_allowed_for_kind;
    use crate::config::ServiceKind;
    assert!(action_allowed_for_kind(
        "download_add",
        ServiceKind::Qbittorrent
    ));
    assert!(!action_allowed_for_kind(
        "download_add",
        ServiceKind::Sonarr
    ));
}

#[test]
fn shared_guard_skips_unknown_service_name() {
    // An unconfigured service name resolves to no kind; the guard defers to the
    // downstream service lookup rather than producing a kind error.
    let state = loopback_state();
    validate_action_for_service(&state.service, "set_quality", "not-configured")
        .expect("guard is a no-op for unknown service names");
}
