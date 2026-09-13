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
fn yarr_config_rejects_colliding_codemode_namespaces() {
    let config = YarrConfig {
        services: vec![
            ServiceConfig {
                name: "home-media".to_string(),
                kind: ServiceKind::Sonarr,
                ..ServiceConfig::default()
            },
            ServiceConfig {
                name: "home_media".to_string(),
                kind: ServiceKind::Radarr,
                ..ServiceConfig::default()
            },
        ],
    };

    let error = config.validate().unwrap_err();
    assert!(error.to_string().contains("home-media"));
    assert!(error.to_string().contains("home_media"));
    assert!(error.to_string().contains("home_media"));
}

#[test]
fn yarr_config_rejects_reserved_codemode_global() {
    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "api".to_string(),
            kind: ServiceKind::Sonarr,
            ..ServiceConfig::default()
        }],
    };

    let error = config
        .validate()
        .expect_err("reserved Code Mode global must fail validation");
    assert!(error.to_string().contains("reserved Code Mode global"));
    assert!(error.to_string().contains("api"));
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

#[test]
fn environment_only_reserved_codemode_global_is_rejected_at_config_load() {
    let home = tempfile::tempdir().unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_HOME", home.path());
    env.set("HOME", home.path());
    env.remove("YARR_CONFIG");
    env.set("YARR_SERVICES", "api");
    env.set("YARR_API_KIND", "sonarr");
    env.set("YARR_API_URL", "https://public.example.invalid");

    let error = Config::load().expect_err("reserved Code Mode global must fail at startup");

    assert!(error.to_string().contains("reserved Code Mode global"));
    assert!(error.to_string().contains("api"));
}

#[test]
fn toml_reserved_codemode_global_is_rejected_at_config_load() {
    let home = tempfile::tempdir().unwrap();
    let config_path = home.path().join("config.toml");
    std::fs::write(
        &config_path,
        "[[yarr.services]]\nname = \"api\"\nkind = \"sonarr\"\nbase_url = \"https://public.example.invalid\"\n",
    )
    .unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_CONFIG", &config_path);
    env.set("HOME", home.path());
    env.remove("YARR_SERVICES");

    let error = Config::load().expect_err("reserved Code Mode global must fail at startup");

    assert!(error.to_string().contains("reserved Code Mode global"));
    assert!(error.to_string().contains("api"));
}

#[test]
fn fleet_readonly_and_destructive_fanout_policy_load_from_env() {
    let dir = tempfile::tempdir().unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_HOME", dir.path());
    env.set("HOME", dir.path());
    env.remove("YARR_CONFIG");
    env.set("YARR_FLEET_READONLY", "true");
    env.set("YARR_MCP_DESTRUCTIVE_FANOUT_MAX", "2");

    let loaded = Config::load().expect("fleet policy config loads");

    assert!(loaded.mcp.fleet_readonly);
    assert!(loaded.yarr.is_readonly("sonarr"));
    assert_eq!(loaded.mcp.destructive_fanout_max, 2);
}

#[test]
fn invalid_fleet_readonly_flag_is_rejected() {
    let dir = tempfile::tempdir().unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_HOME", dir.path());
    env.set("HOME", dir.path());
    env.remove("YARR_CONFIG");
    env.set("YARR_FLEET_READONLY", "sometimes");

    let error = Config::load().expect_err("invalid readonly flag must fail closed");
    assert!(error.to_string().contains("YARR_FLEET_READONLY"));
}
