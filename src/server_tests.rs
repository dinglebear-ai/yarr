use super::*;
use crate::config::{AuthConfig, ToolMode, YarrConfig};

fn config(host: &str) -> Config {
    Config {
        mcp: McpConfig {
            host: host.into(),
            ..McpConfig::default()
        },
        yarr: YarrConfig::default(),
    }
}

#[test]
fn loopback_bind_is_loopback_dev_without_credentials() {
    let config = config("127.0.0.1");
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::LoopbackDev
    );
}

#[test]
fn non_loopback_no_auth_without_gateway_is_rejected() {
    let mut config = config("0.0.0.0");
    config.mcp.no_auth = true;
    let error = resolve_auth_policy_kind(&config, false).unwrap_err();
    assert!(error.to_string().contains("YARR_MCP_NO_AUTH=true"));
}

#[test]
fn non_loopback_no_auth_with_gateway_is_trusted_gateway_unscoped() {
    let mut config = config("0.0.0.0");
    config.mcp.no_auth = true;
    config.mcp.allowed_hosts = vec!["yarr.example.com".into()];
    assert_eq!(
        resolve_auth_policy_kind(&config, true).unwrap(),
        AuthPolicyKind::TrustedGatewayUnscoped
    );
}

#[test]
fn non_loopback_gateway_without_credentials_is_trusted_gateway_unscoped() {
    let mut config = config("0.0.0.0");
    config.mcp.allowed_hosts = vec!["yarr.example.com".into()];
    assert_eq!(
        resolve_auth_policy_kind(&config, true).unwrap(),
        AuthPolicyKind::TrustedGatewayUnscoped
    );
}

#[test]
fn non_loopback_gateway_without_provenance_is_rejected() {
    let config = config("0.0.0.0");
    let error = resolve_auth_policy_kind(&config, true).unwrap_err();
    assert!(error.to_string().contains("proxy provenance"));
}

#[test]
fn non_loopback_read_only_bearer_mounts_in_flat_mode() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("a".repeat(64));
    config.mcp.tool_mode = ToolMode::Flat;
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedBearer
    );
}

#[test]
fn non_loopback_weak_bearer_token_is_rejected() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("secret".into());
    config.mcp.tool_mode = ToolMode::Flat;
    let error = resolve_auth_policy_kind(&config, false).unwrap_err();
    assert!(error.to_string().contains("weak bearer token"));
}

#[test]
fn non_loopback_base64url_bearer_token_mounts_bearer_policy() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("A".repeat(43));
    config.mcp.tool_mode = ToolMode::Flat;
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedBearer
    );
}

#[test]
fn loopback_weak_bearer_token_is_honored() {
    // Token strength gates network exposure only; loopback binds stay usable.
    let mut config = config("127.0.0.1");
    config.mcp.api_token = Some("secret".into());
    config.mcp.tool_mode = ToolMode::Flat;
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedBearer
    );
}

#[test]
fn loopback_bearer_is_honored_when_write_scope_enables_codemode() {
    let mut config = config("127.0.0.1");
    config.mcp.api_token = Some("secret".into());
    config.mcp.static_token_scopes = vec![crate::actions::WRITE_SCOPE.into()];
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedBearer
    );
}

#[test]
fn codemode_rejects_read_only_static_bearer() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("secret".into());
    let error = resolve_auth_policy_kind(&config, false).unwrap_err();
    assert!(error.to_string().contains("YARR_MCP_STATIC_TOKEN_SCOPES"));
    assert!(error.to_string().contains("YARR_MCP_TOOL_MODE=flat"));
}

#[test]
fn oauth_codemode_rejects_read_only_static_gateway_token() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("a".repeat(64));
    config.mcp.auth.mode = AuthMode::OAuth;

    let error = resolve_auth_policy_kind(&config, false).unwrap_err();
    assert!(error.to_string().contains("YARR_MCP_STATIC_TOKEN_SCOPES"));
    assert!(error.to_string().contains("yarr:write"));
}

#[test]
fn oauth_codemode_accepts_write_scoped_static_gateway_token() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("a".repeat(64));
    config.mcp.static_token_scopes = vec![crate::actions::WRITE_SCOPE.into()];
    config.mcp.auth.mode = AuthMode::OAuth;

    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedOAuth
    );
}

#[test]
fn non_loopback_oauth_mounts_oauth_policy() {
    let mut config = config("0.0.0.0");
    config.mcp.auth = AuthConfig {
        mode: AuthMode::OAuth,
        ..AuthConfig::default()
    };
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedOAuth
    );
}

#[test]
fn loopback_oauth_is_honored() {
    let mut config = config("127.0.0.1");
    config.mcp.auth.mode = AuthMode::OAuth;
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedOAuth
    );
}

#[test]
fn oauth_can_keep_read_only_break_glass_token_in_codemode() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("break-glass".into());
    config.mcp.auth.mode = AuthMode::OAuth;
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedOAuth
    );
}

#[test]
fn oauth_can_retire_read_only_static_token_in_codemode() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("retired".into());
    config.mcp.auth.mode = AuthMode::OAuth;
    config.mcp.auth.disable_static_token_with_oauth = true;
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedOAuth
    );
}

#[test]
fn non_loopback_without_auth_or_gateway_is_rejected() {
    let config = config("0.0.0.0");
    let error = resolve_auth_policy_kind(&config, false).unwrap_err();
    assert!(error.to_string().contains("without authentication"));
}

#[test]
fn invalid_public_url_is_rejected() {
    let mut config = config("0.0.0.0");
    config.mcp.auth.public_url = Some("not a url".into());
    let error = resolve_auth_policy_kind(&config, true).unwrap_err();
    assert!(error.to_string().contains("YARR_MCP_PUBLIC_URL is invalid"));
}

#[test]
fn wildcard_public_url_is_rejected() {
    let mut config = config("0.0.0.0");
    config.mcp.auth.public_url = Some("https://*.yarr.com".into());
    let error = resolve_auth_policy_kind(&config, true).unwrap_err();
    assert!(
        error
            .to_string()
            .contains("YARR_MCP_PUBLIC_URL must not contain wildcard hosts")
    );
}

#[test]
fn remote_http_public_url_is_rejected() {
    let mut config = config("0.0.0.0");
    config.mcp.auth.public_url = Some("http://yarr.example.com".into());
    let error = resolve_auth_policy_kind(&config, true).unwrap_err();
    assert!(error.to_string().contains("must use HTTPS"));
}

#[test]
fn loopback_http_public_url_is_allowed() {
    let mut config = config("127.0.0.1");
    config.mcp.auth.public_url = Some("http://localhost:40070".into());
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::LoopbackDev
    );
}

#[test]
fn public_url_rejects_credentials_query_and_fragment() {
    for url in [
        "https://user:secret@yarr.example.com",
        "https://yarr.example.com?token=secret",
        "https://yarr.example.com#fragment",
    ] {
        let mut config = config("0.0.0.0");
        config.mcp.auth.public_url = Some(url.into());
        assert!(
            resolve_auth_policy_kind(&config, true).is_err(),
            "must reject {url}"
        );
    }
}

/// Regression for #146: lab-auth's rate-limited OAuth routes extract
/// `ConnectInfo<SocketAddr>`, so the real server must provide it. A missing
/// extension surfaces as an HTTP 500 before any OAuth validation runs.
#[tokio::test]
async fn served_router_supplies_connect_info_to_oauth_routes() {
    let data_dir = tempfile::tempdir().unwrap();
    let app = crate::server::router(crate::testing::oauth_state(data_dir.path()).await);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let (stop, stopped) = tokio::sync::oneshot::channel::<()>();
    let server = tokio::spawn(serve(listener, app, async {
        let _ = stopped.await;
    }));

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();
    for path in ["/authorize", "/register"] {
        let request = if path == "/register" {
            client
                .post(format!("http://{addr}{path}"))
                .json(&serde_json::json!({}))
        } else {
            client.get(format!(
                "http://{addr}{path}?response_type=code&client_id=missing&redirect_uri=http%3A%2F%2F127.0.0.1%2Fcb&state=s&code_challenge=x&code_challenge_method=S256"
            ))
        };
        let response = request
            .header("host", "localhost:40070")
            .send()
            .await
            .unwrap();
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        assert_ne!(
            status,
            reqwest::StatusCode::INTERNAL_SERVER_ERROR,
            "{path} returned 500: {body}"
        );
        assert!(
            !body.contains("ConnectInfo"),
            "{path} is missing ConnectInfo: {body}"
        );
    }

    let _ = stop.send(());
    server.await.unwrap().unwrap();
}
