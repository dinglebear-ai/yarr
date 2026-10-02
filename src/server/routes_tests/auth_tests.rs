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
async fn flat_read_token_can_call_reviewed_readonly_api_route() {
    let (state, calls, server) = super::super::counting_state_for(
        crate::config::ServiceKind::Jellyfin,
        crate::config::ToolMode::Flat,
    )
    .await;
    let response = authenticated_mcp_call(
        state,
        "read-token",
        json!({
            "jsonrpc": "2.0", "id": 41, "method": "tools/call",
            "params": {
                "name": "jellyfin",
                "arguments": {
                    "action": "api_get",
                    "path": "/Items/abc/MetadataEditor"
                }
            }
        }),
    )
    .await;

    assert_eq!(response["result"]["isError"], false, "response: {response}");
    assert_eq!(
        calls.load(Ordering::SeqCst),
        1,
        "reviewed read reached upstream"
    );
    server.abort();
}

#[tokio::test]
async fn flat_unknown_generic_routes_fail_before_upstream_dispatch() {
    let (state, calls, server) = counting_state(crate::config::ToolMode::Flat).await;
    // Reads and writes alike: an unmatched generic route fails closed before
    // any upstream dispatch, without a reviewed route match to authorize it.
    for (id, action) in [(44, "api_get"), (45, "api_post"), (46, "api_delete")] {
        let response = authenticated_mcp_call(
            state.clone(),
            "read-token",
            json!({
                "jsonrpc": "2.0", "id": id, "method": "tools/call",
                "params": {
                    "name": "sonarr",
                    "arguments": {"action": action, "path": "/api/v3/not-a-generated-route"}
                }
            }),
        )
        .await;

        assert!(
            response["error"]["message"]
                .as_str()
                .is_some_and(|message| message.contains("no unique generated operation match")),
            "{action} response: {response}"
        );
    }
    assert_eq!(
        calls.load(Ordering::SeqCst),
        0,
        "unknown generic routes reached upstream"
    );
    server.abort();
}

#[tokio::test]
async fn flat_destructive_admission_is_exact_to_the_resolved_route() {
    let (state, calls, server) = super::super::counting_state_with_scopes_for(
        crate::config::ServiceKind::Sonarr,
        crate::config::ToolMode::Flat,
        "write-token",
        vec![crate::actions::WRITE_SCOPE.to_owned()],
    )
    .await;

    let mutation = authenticated_mcp_call(
        state.clone(),
        "write-token",
        json!({
            "jsonrpc": "2.0", "id": 42, "method": "tools/call",
            "params": {
                "name": "sonarr",
                "arguments": {"action": "api_post", "path": "/api/v3/system/restart"}
            }
        }),
    )
    .await;
    assert_eq!(mutation["result"]["isError"], false, "response: {mutation}");
    assert_eq!(
        calls.load(Ordering::SeqCst),
        1,
        "Mutation POST reached upstream"
    );

    let destructive = authenticated_mcp_call(
        state,
        "write-token",
        json!({
            "jsonrpc": "2.0", "id": 43, "method": "tools/call",
            "params": {
                "name": "sonarr",
                "arguments": {"action": "api_post", "path": "/api/v3/system/backup/restore/1"}
            }
        }),
    )
    .await;
    let Some(text) = destructive["result"]["content"][0]["text"].as_str() else {
        panic!("destructive route must return a declined result: {destructive}");
    };
    let declined: serde_json::Value = serde_json::from_str(text).expect("decline text is JSON");
    assert_eq!(declined["declined"], true, "response: {destructive}");
    assert_eq!(
        calls.load(Ordering::SeqCst),
        1,
        "a destructive route must not inherit the earlier Mutation authorization"
    );
    server.abort();
}

#[tokio::test]
async fn flat_read_token_cannot_call_write_surfaces() {
    let (state, calls, server) = counting_state(crate::config::ToolMode::Flat).await;

    // A resolved generic write route (reviewed Mutation) demands write scope.
    let generic = authenticated_mcp_call(
        state.clone(),
        "read-token",
        json!({
            "jsonrpc": "2.0", "id": 47, "method": "tools/call",
            "params": {
                "name": "sonarr",
                "arguments": {"action": "api_post", "path": "/api/v3/system/restart"}
            }
        }),
    )
    .await;
    assert!(
        generic["error"]["message"]
            .as_str()
            .is_some_and(|message| message.contains("yarr:write")),
        "response: {generic}"
    );

    // A generated Mutation operation demands it too.
    let generated = authenticated_mcp_call(
        state,
        "read-token",
        json!({
            "jsonrpc": "2.0", "id": 48, "method": "tools/call",
            "params": {
                "name": "sonarr",
                "arguments": {"action": "op", "op": "delete_series_by_id", "args": {"id": 1}}
            }
        }),
    )
    .await;
    assert!(
        generated["error"]["message"]
            .as_str()
            .is_some_and(|message| message.contains("yarr:write")),
        "response: {generated}"
    );

    assert_eq!(
        calls.load(Ordering::SeqCst),
        0,
        "a read token reached upstream"
    );
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
    // The saved snippet resolves to the reviewed Destructive sonarr route
    // (`POST /api/v3/system/backup/restore/{id}`).
    state
        .service
        .snippet_save(
            "dangerous",
            "async () => await callTool('api_post', {service:'sonarr', path:'/api/v3/system/backup/restore/1'})",
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
            azp: String::new(),
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
                    "code": "async () => await callTool('api_delete', {service:'sonarr', path:'/api/v3/queue/5'})"
                }
            }
        }),
    )
    .await;
    // A reviewed Mutation route is not verb-gated: the write token runs it
    // through the guarded Code Mode surface and it dispatches once.
    assert_eq!(response["result"]["isError"], false, "response: {response}");
    assert_eq!(
        calls.load(Ordering::SeqCst),
        1,
        "the reviewed Mutation DELETE must dispatch once"
    );

    // The same token cannot reach a resolved Destructive route through ANY
    // inner path: built-in Code Mode scripts and saved snippets both fail
    // closed when the peer cannot elicit, so nothing destructive reaches
    // upstream.
    let mut flat = state;
    flat.config.tool_mode = crate::config::ToolMode::Flat;
    for (id, arguments) in [
        (
            7,
            json!({
                "action": "codemode",
                "code": "async () => await callTool('api_delete', {service:'sonarr', path:'/api/v3/queue/5'})"
            }),
        ),
        (
            8,
            json!({
                "action": "codemode",
                "code": "async () => await callTool('api_post', {service:'sonarr', path:'/api/v3/system/backup/restore/1'})"
            }),
        ),
        (9, json!({"action": "snippet_run", "name": "dangerous"})),
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
        if id == 7 {
            // The reviewed Mutation DELETE dispatches through the flat tool too.
            assert_eq!(response["result"]["isError"], false, "response: {response}");
        } else {
            assert_eq!(response["result"]["isError"], true, "response: {response}");
            let text = response["result"]["content"][0]["text"].as_str().unwrap();
            assert!(
                text.contains("elicitation-capable") || text.contains("nothing changed"),
                "unexpected inner destructive error: {text}"
            );
        }
    }
    assert_eq!(
        calls.load(Ordering::SeqCst),
        2,
        "only the reviewed Mutation calls reach upstream; the Destructive inner calls are stopped by the gate"
    );
    server.abort();
}
