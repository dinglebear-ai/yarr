use super::*;
use crate::config::{AuthConfig, YarrConfig};

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
fn non_loopback_bearer_token_mounts_bearer_policy() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("a".repeat(64));
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedBearer
    );
}

#[test]
fn non_loopback_weak_bearer_token_is_rejected() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("secret".into());
    let error = resolve_auth_policy_kind(&config, false).unwrap_err();
    assert!(error.to_string().contains("weak bearer token"));
}

#[test]
fn non_loopback_base64url_bearer_token_mounts_bearer_policy() {
    let mut config = config("0.0.0.0");
    config.mcp.api_token = Some("A".repeat(43));
    assert_eq!(
        resolve_auth_policy_kind(&config, false).unwrap(),
        AuthPolicyKind::MountedBearer
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
