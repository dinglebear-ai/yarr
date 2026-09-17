use crate::testing::loopback_state;
use serde_json::json;

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

#[test]
fn destructive_targets_bind_the_exact_operation() {
    let state = loopback_state();
    let first = crate::actions::YarrAction::ApiDelete {
        service: "sonarr".to_owned(),
        path: "/api/v3/series/1".to_owned(),
        body: None,
    };
    let second = crate::actions::YarrAction::ApiDelete {
        service: "sonarr".to_owned(),
        path: "/api/v3/series/2".to_owned(),
        body: None,
    };

    let first_target = super::destructive_target(&state, &first).unwrap();
    let second_target = super::destructive_target(&state, &second).unwrap();
    assert_ne!(first_target, second_target);
    assert!(first_target.contains("/api/v3/series/1"));
}

#[test]
fn canonical_target_json_sorts_object_keys() {
    let left = json!({"z": 1, "a": {"y": 2, "b": 3}});
    let right = json!({"a": {"b": 3, "y": 2}, "z": 1});
    assert_eq!(super::canonical_json(&left), super::canonical_json(&right));
}
