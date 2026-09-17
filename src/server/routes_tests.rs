use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

use axum::{body::Body, http::Request};
use serde_json::{Value, json};
use tower::ServiceExt;

use super::router;

async fn authenticated_mcp_call(
    state: crate::server::AppState,
    token: &str,
    payload: Value,
) -> Value {
    authenticated_mcp_call_with_headers(state, token, &[], payload).await
}

/// Same as [`authenticated_mcp_call`], plus arbitrary extra request headers —
/// e.g. `mcp-protocol-version`, to exercise a specific negotiated protocol
/// version on yarr's stateless transport (see `cache_hints_tests.rs`, which
/// needs a `2026-07-28` caller vs. a legacy one on the same request shape).
async fn authenticated_mcp_call_with_headers(
    state: crate::server::AppState,
    token: &str,
    extra_headers: &[(&str, &str)],
    payload: Value,
) -> Value {
    let (status, body) =
        authenticated_mcp_response_with_headers(state, token, extra_headers, payload).await;
    assert!(status.is_success(), "HTTP {status}: {body}");
    body
}

async fn authenticated_mcp_response_with_headers(
    state: crate::server::AppState,
    token: &str,
    extra_headers: &[(&str, &str)],
    payload: Value,
) -> (axum::http::StatusCode, Value) {
    let mut builder = Request::builder()
        .method("POST")
        .uri("/mcp")
        .header("host", "localhost:40070")
        .header("content-type", "application/json")
        .header("accept", "application/json, text/event-stream")
        .header("authorization", format!("Bearer {token}"));
    for (name, value) in extra_headers {
        builder = builder.header(*name, *value);
    }
    let response = router(state)
        .oneshot(
            builder
                .body(Body::from(payload.to_string()))
                .expect("request should build"),
        )
        .await
        .expect("router should respond");
    let status = response.status();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("response body should read");
    let body = serde_json::from_slice(&body).expect("MCP response should be JSON");
    (status, body)
}

async fn counting_state(
    tool_mode: crate::config::ToolMode,
) -> (
    crate::server::AppState,
    Arc<AtomicUsize>,
    tokio::task::JoinHandle<()>,
) {
    use crate::{
        app::YarrService,
        config::{McpConfig, ServiceConfig, ServiceKind, YarrConfig},
        server::{AppState, AuthPolicy},
        yarr::YarrClient,
    };

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let calls = Arc::new(AtomicUsize::new(0));
    let server_calls = calls.clone();
    let handle = tokio::spawn(async move {
        loop {
            let Ok((mut stream, _)) = listener.accept().await else {
                break;
            };
            server_calls.fetch_add(1, Ordering::SeqCst);
            tokio::spawn(async move {
                use tokio::io::{AsyncReadExt, AsyncWriteExt};
                let mut request = [0_u8; 2048];
                let _ = stream.read(&mut request).await;
                let body = br#"{"ok":true}"#;
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                    body.len()
                );
                let _ = stream.write_all(response.as_bytes()).await;
                let _ = stream.write_all(body).await;
            });
        }
    });
    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "sonarr".into(),
            kind: ServiceKind::Sonarr,
            base_url: format!("http://{addr}"),
            api_key: Some("upstream-secret".into()),
            ..ServiceConfig::default()
        }],
    };
    let service = YarrService::new(YarrClient::new(&config).unwrap(), config);
    (
        AppState {
            config: McpConfig {
                api_token: Some("read-token".into()),
                tool_mode,
                ..McpConfig::default()
            },
            auth_policy: AuthPolicy::Mounted { auth_state: None },
            service,
        },
        calls,
        handle,
    )
}

#[path = "routes_tests/auth.rs"]
mod auth;
#[path = "routes_tests/cache_hints_tests.rs"]
mod cache_hints_tests;
#[path = "routes_tests/metrics.rs"]
mod metrics;
#[path = "routes_tests/mrtr_tests.rs"]
mod mrtr_tests;
#[path = "routes_tests/protocol_versions.rs"]
mod protocol_versions;
