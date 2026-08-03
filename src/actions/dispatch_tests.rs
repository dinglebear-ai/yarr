use super::*;
use crate::actions::YarrAction;
use crate::testing::loopback_state;

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

#[tokio::test]
async fn readonly_instance_refuses_mutation_before_upstream_dispatch() {
    use crate::{
        app::YarrService,
        config::{ServiceConfig, ServiceKind, YarrConfig},
        yarr::YarrClient,
    };

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex_prod".into(),
            kind: ServiceKind::Plex,
            base_url: "http://127.0.0.1:9".into(),
            read_only: true,
            ..ServiceConfig::default()
        }],
    };
    let service = YarrService::new(YarrClient::new(&config).unwrap(), config);
    let error = execute_service_action(
        &service,
        &YarrAction::ApiPost {
            service: "plex_prod".into(),
            path: "/library/sections/1/refresh".into(),
            body: serde_json::json!({}),
        },
    )
    .await
    .unwrap_err();

    assert!(error.to_string().contains("read-only"));
    assert!(error.to_string().contains("plex_prod"));
}
