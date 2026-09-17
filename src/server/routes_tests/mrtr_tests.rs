//! Wire-level SEP-2322 MRTR tests for destructive tools/call.

use super::super::*;

fn modern_meta_with_elicitation() -> Value {
    json!({
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {
            "elicitation": { "form": {} }
        }
    })
}

fn modern_headers() -> [(&'static str, &'static str); 3] {
    [
        ("mcp-protocol-version", "2026-07-28"),
        ("mcp-method", "tools/call"),
        ("mcp-name", "sonarr"),
    ]
}

fn destructive_params() -> Value {
    json!({
        "_meta": modern_meta_with_elicitation(),
        "name": "sonarr",
        "arguments": {
            "action": "api_delete",
            "path": "/api/v3/series/1"
        }
    })
}

fn write_enabled_flat_state(mut state: crate::server::AppState) -> crate::server::AppState {
    state.config.static_token_scopes = vec![crate::actions::WRITE_SCOPE.to_owned()];
    state.config.tool_mode = crate::config::ToolMode::Flat;
    state
}

#[tokio::test]
async fn modern_destructive_call_requires_input_then_executes_exactly_once() {
    let (state, calls, server) = counting_state(crate::config::ToolMode::Flat).await;
    let state = write_enabled_flat_state(state);
    let first = authenticated_mcp_call_with_headers(
        state.clone(),
        "read-token",
        &modern_headers(),
        json!({
            "jsonrpc": "2.0",
            "id": 300,
            "method": "tools/call",
            "params": destructive_params(),
        }),
    )
    .await;
    assert_eq!(first["result"]["resultType"], "input_required");
    assert_eq!(
        first["result"]["inputRequests"]["confirm"]["method"],
        "elicitation/create"
    );
    let request_state = first["result"]["requestState"]
        .as_str()
        .expect("input_required must include requestState")
        .to_owned();
    assert_eq!(calls.load(Ordering::SeqCst), 0);

    let mut retry_params = destructive_params();
    let params = retry_params.as_object_mut().unwrap();
    params.insert("requestState".into(), json!(request_state));
    params.insert(
        "inputResponses".into(),
        json!({
            "confirm": {
                "action": "accept",
                "content": { "confirm": true }
            }
        }),
    );
    let accepted = authenticated_mcp_call_with_headers(
        state.clone(),
        "read-token",
        &modern_headers(),
        json!({
            "jsonrpc": "2.0",
            "id": 301,
            "method": "tools/call",
            "params": retry_params,
        }),
    )
    .await;
    assert_eq!(accepted["result"]["resultType"], "complete");
    assert_eq!(calls.load(Ordering::SeqCst), 1);

    let (replay_status, replay) = authenticated_mcp_response_with_headers(
        state,
        "read-token",
        &modern_headers(),
        json!({
            "jsonrpc": "2.0",
            "id": 302,
            "method": "tools/call",
            "params": retry_params,
        }),
    )
    .await;
    assert_eq!(replay_status, axum::http::StatusCode::BAD_REQUEST);
    assert!(
        replay["error"]["message"]
            .as_str()
            .is_some_and(|message| message.contains("requestState")),
        "unexpected replay response: {replay}"
    );
    assert_eq!(calls.load(Ordering::SeqCst), 1);
    server.abort();
}

#[tokio::test]
async fn modern_decline_and_request_tampering_never_reach_upstream() {
    let (state, calls, server) = counting_state(crate::config::ToolMode::Flat).await;
    let state = write_enabled_flat_state(state);
    let first = authenticated_mcp_call_with_headers(
        state.clone(),
        "read-token",
        &modern_headers(),
        json!({
            "jsonrpc": "2.0", "id": 310, "method": "tools/call",
            "params": destructive_params()
        }),
    )
    .await;
    let request_state = first["result"]["requestState"].as_str().unwrap().to_owned();

    let mut tampered_params = destructive_params();
    let params = tampered_params.as_object_mut().unwrap();
    params["arguments"]["path"] = json!("/api/v3/series/999");
    params.insert("requestState".into(), json!(request_state));
    params.insert(
        "inputResponses".into(),
        json!({"confirm": {"action": "accept", "content": {"confirm": true}}}),
    );
    let (tampered_status, tampered) = authenticated_mcp_response_with_headers(
        state.clone(),
        "read-token",
        &modern_headers(),
        json!({
            "jsonrpc": "2.0", "id": 311, "method": "tools/call",
            "params": tampered_params
        }),
    )
    .await;
    assert_eq!(tampered_status, axum::http::StatusCode::BAD_REQUEST);
    assert!(
        tampered.get("error").is_some(),
        "unexpected tamper response: {tampered}"
    );
    assert_eq!(calls.load(Ordering::SeqCst), 0);

    let second = authenticated_mcp_call_with_headers(
        state.clone(),
        "read-token",
        &modern_headers(),
        json!({
            "jsonrpc": "2.0", "id": 312, "method": "tools/call",
            "params": destructive_params()
        }),
    )
    .await;
    let second_state = second["result"]["requestState"]
        .as_str()
        .unwrap()
        .to_owned();
    let mut declined_params = destructive_params();
    let params = declined_params.as_object_mut().unwrap();
    params.insert("requestState".into(), json!(second_state));
    params.insert(
        "inputResponses".into(),
        json!({"confirm": {"action": "decline"}}),
    );
    let declined = authenticated_mcp_call_with_headers(
        state,
        "read-token",
        &modern_headers(),
        json!({
            "jsonrpc": "2.0", "id": 313, "method": "tools/call",
            "params": declined_params
        }),
    )
    .await;
    assert_eq!(declined["result"]["isError"], false);
    let declined_payload: Value = serde_json::from_str(
        declined["result"]["content"][0]["text"]
            .as_str()
            .expect("decline result should contain JSON text"),
    )
    .expect("decline result text should be JSON");
    assert_eq!(declined_payload["declined"], true);
    assert_eq!(calls.load(Ordering::SeqCst), 0);
    server.abort();
}

fn modern_yarr_headers() -> [(&'static str, &'static str); 3] {
    [
        ("mcp-protocol-version", "2026-07-28"),
        ("mcp-method", "tools/call"),
        ("mcp-name", "yarr"),
    ]
}

fn write_enabled_codemode_state(mut state: crate::server::AppState) -> crate::server::AppState {
    state.config.static_token_scopes = vec![crate::actions::WRITE_SCOPE.to_owned()];
    state.config.tool_mode = crate::config::ToolMode::Codemode;
    state
}

fn destructive_codemode_params() -> Value {
    json!({
        "_meta": modern_meta_with_elicitation(),
        "name": "yarr",
        "arguments": {
            "code": "async () => await callTool('api_delete', {service:'sonarr', path:'/api/v3/series/1'})"
        }
    })
}

#[tokio::test]
async fn modern_codemode_confirms_preflight_targets_then_executes_once() {
    let (state, calls, server) = counting_state(crate::config::ToolMode::Codemode).await;
    let state = write_enabled_codemode_state(state);

    let first = authenticated_mcp_call_with_headers(
        state.clone(),
        "read-token",
        &modern_yarr_headers(),
        json!({
            "jsonrpc": "2.0",
            "id": 320,
            "method": "tools/call",
            "params": destructive_codemode_params(),
        }),
    )
    .await;
    assert_eq!(first["result"]["resultType"], "input_required");
    let request_state = first["result"]["requestState"]
        .as_str()
        .expect("Code Mode preflight must return requestState")
        .to_owned();
    assert_eq!(calls.load(Ordering::SeqCst), 0);

    let mut retry_params = destructive_codemode_params();
    let params = retry_params.as_object_mut().unwrap();
    params.insert("requestState".into(), json!(request_state));
    params.insert(
        "inputResponses".into(),
        json!({"confirm": {"action": "accept", "content": {"confirm": true}}}),
    );
    let _accepted = authenticated_mcp_call_with_headers(
        state.clone(),
        "read-token",
        &modern_yarr_headers(),
        json!({
            "jsonrpc": "2.0",
            "id": 321,
            "method": "tools/call",
            "params": retry_params.clone(),
        }),
    )
    .await;
    assert_eq!(calls.load(Ordering::SeqCst), 1);

    let (replay_status, replay) = authenticated_mcp_response_with_headers(
        state,
        "read-token",
        &modern_yarr_headers(),
        json!({
            "jsonrpc": "2.0",
            "id": 322,
            "method": "tools/call",
            "params": retry_params,
        }),
    )
    .await;
    assert_eq!(replay_status, axum::http::StatusCode::BAD_REQUEST);
    assert!(
        replay["error"]["message"]
            .as_str()
            .is_some_and(|message| message.contains("requestState")),
        "unexpected replay response: {replay}"
    );
    assert_eq!(calls.load(Ordering::SeqCst), 1);
    server.abort();
}
