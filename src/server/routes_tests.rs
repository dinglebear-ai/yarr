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
    let response = router(state)
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/mcp")
                .header("host", "localhost:40070")
                .header("content-type", "application/json")
                .header("accept", "application/json, text/event-stream")
                .header("authorization", format!("Bearer {token}"))
                .body(Body::from(payload.to_string()))
                .expect("request should build"),
        )
        .await
        .expect("router should respond");
    let status = response.status();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("response body should read");
    assert!(
        status.is_success(),
        "HTTP {status}: {}",
        String::from_utf8_lossy(&body)
    );
    serde_json::from_slice(&body).expect("MCP response should be JSON")
}

async fn counting_state(
    tool_mode: crate::config::ToolMode,
) -> (
    crate::server::AppState,
    Arc<AtomicUsize>,
    tokio::task::JoinHandle<()>,
) {
    counting_state_for(crate::config::ServiceKind::Sonarr, tool_mode).await
}

async fn counting_state_for(
    kind: crate::config::ServiceKind,
    tool_mode: crate::config::ToolMode,
) -> (
    crate::server::AppState,
    Arc<AtomicUsize>,
    tokio::task::JoinHandle<()>,
) {
    counting_state_with_scopes_for(
        kind,
        tool_mode,
        "read-token",
        vec![crate::actions::READ_SCOPE.to_owned()],
    )
    .await
}

async fn counting_state_with_scopes_for(
    kind: crate::config::ServiceKind,
    tool_mode: crate::config::ToolMode,
    token: &str,
    static_token_scopes: Vec<String>,
) -> (
    crate::server::AppState,
    Arc<AtomicUsize>,
    tokio::task::JoinHandle<()>,
) {
    use crate::{
        app::YarrService,
        config::{McpConfig, ServiceConfig, YarrConfig},
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
            name: kind.as_str().into(),
            kind,
            base_url: format!("http://{addr}"),
            api_key: Some("upstream-secret".into()),
            ..ServiceConfig::default()
        }],
    };
    let service = YarrService::new(YarrClient::new(&config).unwrap(), config);
    (
        AppState {
            config: McpConfig {
                api_token: Some(token.to_owned()),
                static_token_scopes,
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
#[path = "routes_tests/metrics.rs"]
mod metrics;
