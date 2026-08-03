use crate::testing::loopback_state;
use serde_json::json;

#[test]
fn inner_codemode_guard_classifies_plex_terminate_as_destructive() {
    use crate::{
        actions::YarrAction,
        app::YarrService,
        config::{McpConfig, ServiceConfig, ServiceKind, YarrConfig},
        server::{AppState, AuthPolicy},
        yarr::YarrClient,
    };
    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex_den".into(),
            kind: ServiceKind::Plex,
            base_url: "http://localhost:32400".into(),
            ..ServiceConfig::default()
        }],
    };
    let state = AppState {
        config: McpConfig::default(),
        auth_policy: AuthPolicy::LoopbackDev,
        service: YarrService::new(YarrClient::new(&config).unwrap(), config),
    };
    let action = YarrAction::Op {
        service: "plex_den".into(),
        op: "terminate_session".into(),
        args: json!({}),
    };

    assert_eq!(
        super::destructive_inner_call(&state, &action),
        (true, "plex_den")
    );
}

#[tokio::test]
async fn yarr_tool_dispatches_codemode() {
    // The single `yarr` tool takes only `code` and runs it as the codemode action.
    let state = loopback_state();
    let value = super::execute_tool_without_peer_for_test(
        &state,
        "yarr",
        json!({ "code": "async () => 6 * 7" }),
    )
    .await
    .unwrap();
    assert_eq!(value["result"], 42);
}

#[tokio::test]
async fn help_dispatch_returns_object() {
    let state = loopback_state();
    let value =
        super::execute_tool_without_peer_for_test(&state, "sonarr", json!({"action": "help"}))
            .await
            .unwrap();
    assert!(value.is_object());
}

#[tokio::test]
async fn service_tool_injects_service_argument() {
    let state = loopback_state();
    let result = super::execute_tool_without_peer_for_test(
        &state,
        "sonarr",
        json!({"action": "service_status"}),
    )
    .await;
    if let Err(err) = result {
        assert!(
            !err.to_string().contains("service"),
            "service-named tool should inject service arg: {err}"
        );
    }
}
