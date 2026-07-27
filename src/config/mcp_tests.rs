//! Tests for [`McpConfig`] defaults, `bind_addr`, and loopback detection.

use super::*;

#[test]
fn mcp_config_defaults() {
    let cfg = McpConfig::default();
    assert_eq!(cfg.host, "127.0.0.1");
    assert_eq!(cfg.port, 40070);
    assert_eq!(cfg.server_name, "yarr");
    assert!(!cfg.no_auth);
    assert!(!cfg.trusted_gateway);
    assert!(cfg.api_token.is_none());
    assert_eq!(
        cfg.static_token_scopes,
        vec![crate::actions::READ_SCOPE.to_string()]
    );
    assert_eq!(cfg.codemode_max_concurrent, 4);
    assert_eq!(cfg.codemode_queue_timeout_ms, 500);
    assert_eq!(cfg.codemode_timeout_secs, 30);
}

#[test]
fn bind_addr_joins_host_and_port() {
    let cfg = McpConfig::default();
    assert_eq!(cfg.bind_addr(), "127.0.0.1:40070");
}

#[test]
fn bind_addr_brackets_ipv6_host() {
    // Bare IPv6 host must be bracketed before the :port suffix.
    let cfg = McpConfig {
        host: "::1".into(),
        ..McpConfig::default()
    };
    assert_eq!(cfg.bind_addr(), "[::1]:40070");
    // Already-bracketed hosts pass through unchanged.
    let cfg = McpConfig {
        host: "[::1]".into(),
        ..McpConfig::default()
    };
    assert_eq!(cfg.bind_addr(), "[::1]:40070");
}

#[test]
fn is_loopback_detection() {
    let mut cfg = McpConfig::default();
    assert!(cfg.is_loopback());
    cfg.host = "localhost".into();
    assert!(cfg.is_loopback());
    cfg.host = "[::1]".into();
    assert!(cfg.is_loopback());
    cfg.host = "0.0.0.0".into();
    assert!(!cfg.is_loopback());
}
