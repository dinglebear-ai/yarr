//! Unit tests for configuration types and loading.

use super::*;
use crate::testing::TestEnv;

fn mcp_with_host(host: &str) -> McpConfig {
    McpConfig {
        host: host.to_owned(),
        ..McpConfig::default()
    }
}

#[test]
fn test_env_guard_restores_values_when_dropped() {
    const KEY: &str = "YARR_TEST_ENV_GUARD_RESTORE";
    let original = std::env::var_os(KEY);
    {
        let mut env = TestEnv::new();
        env.set(KEY, "changed");
        assert_eq!(std::env::var(KEY).as_deref(), Ok("changed"));
    }
    assert_eq!(std::env::var_os(KEY), original);
}

#[test]
fn loopback_host_detection_handles_ip_and_hostname_edges() {
    for host in ["::1", "[::1]", "127.0.0.2"] {
        assert!(
            mcp_with_host(host).is_loopback(),
            "{host} should be loopback"
        );
    }
    for host in ["0.0.0.0", "LOCALHOST", "localhost.yarr.com"] {
        assert!(
            !mcp_with_host(host).is_loopback(),
            "{host} must not be loopback"
        );
    }
}

#[test]
fn auth_mode_serde_accepts_documented_values_and_rejects_unknown_values() {
    assert_eq!(
        serde_json::from_str::<AuthMode>("\"oauth\"").unwrap(),
        AuthMode::OAuth
    );
    assert_eq!(
        serde_json::from_str::<AuthMode>("\"bearer\"").unwrap(),
        AuthMode::Bearer
    );
    assert!(serde_json::from_str::<AuthMode>("\"bad\"").is_err());
}

#[test]
fn static_token_scopes_load_from_env_and_are_deduplicated() {
    let dir = tempfile::tempdir().unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_HOME", dir.path());
    env.set("HOME", dir.path());
    env.remove("YARR_CONFIG");
    env.set(
        "YARR_MCP_STATIC_TOKEN_SCOPES",
        "yarr:write,yarr:read,yarr:write",
    );

    let loaded = Config::load().unwrap();
    assert_eq!(
        loaded.mcp.static_token_scopes,
        vec![
            crate::actions::READ_SCOPE.to_string(),
            crate::actions::WRITE_SCOPE.to_string(),
        ]
    );
}

#[test]
fn invalid_static_token_scope_is_rejected() {
    let dir = tempfile::tempdir().unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_HOME", dir.path());
    env.set("HOME", dir.path());
    env.remove("YARR_CONFIG");
    env.set("YARR_MCP_STATIC_TOKEN_SCOPES", "yarr:admin");

    let error = Config::load().unwrap_err();
    assert!(error.to_string().contains("yarr:admin"));
}
