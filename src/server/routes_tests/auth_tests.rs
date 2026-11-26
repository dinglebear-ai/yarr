use super::super::{
    Body, Ordering, Request, ServiceExt, authenticated_mcp_call, counting_state, json, router,
};

#[test]
fn auth_fixture_uses_codemode_surface() {
    assert_eq!(
        super::codemode_state().config.tool_mode,
        crate::config::ToolMode::Codemode
    );
}

#[tokio::test]
async fn authenticated_read_token_cannot_spoof_yarr_or_call_hidden_tool() {
    let (state, calls, server) = counting_state(crate::config::ToolMode::Codemode).await;
    let spoof = authenticated_mcp_call(
        state.clone(),
        "read-token",
        json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "yarr",
                "arguments": {
                    "action": "help",
                    "code": "async () => await sonarr.service_status()"
                }
            }
        }),
    )
    .await;
    assert!(
        spoof["error"]["message"]
            .as_str()
            .unwrap()
            .contains("does not accept `action`")
    );

    let scoped = authenticated_mcp_call(
        state.clone(),
        "read-token",
        json!({
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {"name": "yarr", "arguments": {"code": "async () => await sonarr.service_status()"}}
        }),
    )
    .await;
    assert!(
        scoped["error"]["message"]
            .as_str()
            .unwrap()
            .contains("yarr:write")
    );

    let hidden = authenticated_mcp_call(
        state,
        "read-token",
        json!({
            "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": {"name": "sonarr", "arguments": {"action": "service_status"}}
        }),
    )
    .await;
    assert!(
        hidden["error"]["message"]
            .as_str()
            .unwrap()
            .contains("inactive MCP tool")
    );
    tokio::task::yield_now().await;
    assert_eq!(
        calls.load(Ordering::SeqCst),
        0,
        "denied calls reached upstream"
    );
    server.abort();
}

#[tokio::test]
async fn static_bearer_is_read_only_but_can_use_flat_read_action() {
    let (state, calls, server) = counting_state(crate::config::ToolMode::Flat).await;
    let response = authenticated_mcp_call(
        state,
        "read-token",
        json!({
            "jsonrpc": "2.0", "id": 4, "method": "tools/call",
            "params": {"name": "sonarr", "arguments": {"action": "service_status"}}
        }),
    )
    .await;
    assert_eq!(response["result"]["isError"], false);
    assert_eq!(calls.load(Ordering::SeqCst), 1);
    server.abort();
}

#[tokio::test]
async fn oauth_disable_static_token_rejects_configured_bearer() {
    let dir = tempfile::tempdir().unwrap();
    let mut state = crate::testing::oauth_state(dir.path()).await;
    state.config.api_token = Some("retired-token".into());
    state.config.auth.mode = crate::config::AuthMode::OAuth;
    state.config.auth.disable_static_token_with_oauth = true;

    let response = router(state)
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/mcp")
                .header("host", "localhost:40070")
                .header("content-type", "application/json")
                .header("accept", "application/json, text/event-stream")
                .header("authorization", "Bearer retired-token")
                .body(Body::from(
                    json!({
                        "jsonrpc": "2.0", "id": 5, "method": "tools/list"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), axum::http::StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn authenticated_write_token_cannot_bypass_inner_destructive_elicitation() {
    let dir = tempfile::tempdir().unwrap();
    let mut state = crate::testing::oauth_state(dir.path()).await;
    let (counting, calls, server) = counting_state(crate::config::ToolMode::Codemode).await;
    state.service = counting.service.with_data_dir(dir.path().to_path_buf());
    state.config.auth.mode = crate::config::AuthMode::OAuth;
    state
        .service
        .snippet_save(
            "dangerous",
            "async () => await callTool('api_delete', {service:'sonarr', path:'/api/v3/series/1'})",
            None,
        )
        .await
        .unwrap();

    let crate::server::AuthPolicy::Mounted {
        auth_state: Some(auth_state),
    } = &state.auth_policy
    else {
        panic!("OAuth state expected")
    };
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;
    let issuer = auth_state
        .config
        .public_url
        .as_ref()
        .unwrap()
        .as_str()
        .trim_end_matches('/')
        .to_owned();
    let token = auth_state
        .signing_keys
        .issue_access_token(&lab_auth::jwt::AccessClaims {
            iss: issuer,
            sub: "writer@yarr.test".into(),
            aud: lab_auth::metadata::canonical_resource_url(auth_state),
            exp: now + 60,
            iat: now,
            jti: "inner-delete-test".into(),
            scope: "yarr:write".into(),
            azp: "yarr-test-client".into(),
            ..Default::default()
        })
        .unwrap();

    let response = authenticated_mcp_call(
        state.clone(),
        &token,
        json!({
            "jsonrpc": "2.0", "id": 6, "method": "tools/call",
            "params": {
                "name": "yarr",
                "arguments": {
                    "code": "async () => await callTool('api_delete', {service:'sonarr', path:'/api/v3/series/1'})"
                }
            }
        }),
    )
    .await;
    assert_eq!(response["result"]["isError"], true);
    let text = response["result"]["content"][0]["text"].as_str().unwrap();
    assert!(
        text.contains("elicitation-capable") || text.contains("nothing changed"),
        "unexpected tool error: {text}"
    );

    let mut flat = state;
    flat.config.tool_mode = crate::config::ToolMode::Flat;
    for (id, arguments) in [
        (
            7,
            json!({
                "action": "codemode",
                "code": "async () => await callTool('api_delete', {service:'sonarr', path:'/api/v3/series/1'})"
            }),
        ),
        (8, json!({"action": "snippet_run", "name": "dangerous"})),
    ] {
        let response = authenticated_mcp_call(
            flat.clone(),
            &token,
            json!({
                "jsonrpc": "2.0", "id": id, "method": "tools/call",
                "params": {"name": "sonarr", "arguments": arguments}
            }),
        )
        .await;
        assert_eq!(response["result"]["isError"], true, "response: {response}");
        let text = response["result"]["content"][0]["text"].as_str().unwrap();
        assert!(
            text.contains("elicitation-capable") || text.contains("nothing changed"),
            "unexpected flat script tool error: {text}"
        );
    }
    assert_eq!(
        calls.load(Ordering::SeqCst),
        0,
        "inner delete reached upstream"
    );
    server.abort();
}
