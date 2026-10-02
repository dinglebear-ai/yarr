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
fn config_load_rejects_runtime_owned_service_name() {
    let dir = tempfile::tempdir().unwrap();
    let config_path = dir.path().join("config.toml");
    std::fs::write(
        &config_path,
        r#"
[yarr]
[[yarr.services]]
name = "fleet"
kind = "sonarr"
base_url = "http://127.0.0.1:8989"
"#,
    )
    .unwrap();

    let mut env = TestEnv::new();
    env.set("YARR_CONFIG", config_path.as_os_str());
    env.set("YARR_HOME", dir.path());
    env.set("HOME", dir.path());
    env.remove("YARR_SERVICES");

    let error = Config::load().expect_err("runtime-owned Code Mode name must be rejected");
    assert!(error.to_string().contains("fleet"), "{error:#}");
    assert!(error.to_string().contains("reserved"), "{error:#}");
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

// ── Service credential references (Task 7) ────────────────────────────────────

/// Load a config from a TOML body written to a temp dir, with the standard
/// `TestEnv` isolation and an extra-env hook.
fn load_toml(toml_body: &str, env_setup: impl FnOnce(&mut TestEnv)) -> anyhow::Result<Config> {
    let dir = tempfile::tempdir().unwrap();
    let config_path = dir.path().join("config.toml");
    std::fs::write(&config_path, toml_body).unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_CONFIG", config_path.as_os_str());
    env.set("YARR_HOME", dir.path());
    env.set("HOME", dir.path());
    env.remove("YARR_SERVICES");
    env_setup(&mut env);
    Config::load()
}

fn service_toml(name: &str, extra: &str) -> String {
    format!(
        "[yarr]\n[[yarr.services]]\nname = \"{name}\"\nkind = \"sonarr\"\nbase_url = \"http://127.0.0.1:8989\"\n{extra}"
    )
}

#[test]
fn toml_credential_references_resolve_from_the_own_service_namespace() {
    let toml = "
[yarr]
[[yarr.services]]
name = \"sonarr\"
kind = \"sonarr\"
base_url = \"http://127.0.0.1:8989\"
api_key_env = \"YARR_SONARR_API_KEY\"
[[yarr.services]]
name = \"plex-den\"
kind = \"plex\"
base_url = \"http://127.0.0.1:32400\"
token_env = \"YARR_PLEX_DEN_TOKEN\"
";
    let loaded = load_toml(toml, |env| {
        env.set("YARR_SONARR_API_KEY", "ref-secret");
        env.set("YARR_PLEX_DEN_TOKEN", "plex-ref-secret");
    })
    .expect("references resolve");
    let sonarr = &loaded.yarr.services[0];
    assert_eq!(sonarr.api_key.as_deref(), Some("ref-secret"));
    // Provenance: the reference itself is preserved alongside the value.
    assert_eq!(sonarr.api_key_env.as_deref(), Some("YARR_SONARR_API_KEY"));
    let plex = &loaded.yarr.services[1];
    assert_eq!(plex.token.as_deref(), Some("plex-ref-secret"));
    assert_eq!(plex.token_env.as_deref(), Some("YARR_PLEX_DEN_TOKEN"));
}

#[test]
fn literal_credentials_are_preserved_as_literals() {
    let loaded = load_toml(
        &service_toml("sonarr", "api_key = \"literal-secret\"\n"),
        |env| {
            env.set("YARR_SONARR_API_KEY", "env-secret");
        },
    )
    .expect("literal config loads");
    let service = &loaded.yarr.services[0];
    assert_eq!(service.api_key.as_deref(), Some("literal-secret"));
    assert!(service.api_key_env.is_none());
}

#[test]
fn credential_references_reject_runtime_and_cross_service_names() {
    let cases = [
        ("api_key_env = \"YARR_MCP_TOKEN\"\n", "runtime variable"),
        (
            "api_key_env = \"YARR_FLEET_READONLY\"\n",
            "runtime variable",
        ),
        (
            "api_key_env = \"YARR_RADARR_API_KEY\"\n",
            "belongs to another service's credential namespace",
        ),
        (
            "api_key_env = \"HOME\"\n",
            "must name a YARR_* environment variable",
        ),
        (
            "api_key_env = \"YARR_SONARR_TOKEN\"\n",
            "names the wrong field for this service; only API_KEY",
        ),
    ];
    for (extra, fragment) in cases {
        let error = load_toml(&service_toml("sonarr", extra), |env| {
            env.set("YARR_SONARR_API_KEY", "x");
            env.set("YARR_SONARR_TOKEN", "x");
            env.set("YARR_RADARR_API_KEY", "x");
            env.set("YARR_MCP_TOKEN", "x");
            env.set("YARR_FLEET_READONLY", "1");
        })
        .expect_err("invalid reference must fail the load");
        assert!(
            error.to_string().contains(fragment),
            "expected {fragment:?} in {error:#}"
        );
    }
}

#[test]
fn unknown_service_fields_are_rejected_as_typos() {
    // A typo'd field must fail the load instead of silently producing a
    // credential-less service (serde_ignored is not wired into config loading).
    let error = load_toml(
        &service_toml("sonarr", "api_key_from = \"YARR_SONARR_API_KEY\"\n"),
        |env| {
            env.set("YARR_SONARR_API_KEY", "x");
        },
    )
    .expect_err("a typo'd service field must fail the load");
    assert!(
        error.to_string().contains("api_key_from"),
        "expected the unknown field name in {error:#}"
    );
}

#[test]
fn own_canonical_reference_is_accepted_for_runtime_looking_names() {
    // A service whose own env namespace starts with mcp_/fleet_ may still
    // reference its own canonical variable; only foreign runtime variables
    // are rejected. Env-based loading of the identical name already works, so
    // the TOML path must agree.
    let loaded = load_toml(
        &service_toml(
            "mcp_gateway",
            "api_key_env = \"YARR_MCP_GATEWAY_API_KEY\"\n",
        ),
        |env| {
            env.set("YARR_MCP_GATEWAY_API_KEY", "resolved-secret");
        },
    )
    .expect("the service's own canonical variable must load");
    let service = &loaded.yarr.services[0];
    assert_eq!(service.api_key.as_deref(), Some("resolved-secret"));
    assert_eq!(
        service.api_key_env.as_deref(),
        Some("YARR_MCP_GATEWAY_API_KEY")
    );
}

#[test]
fn missing_or_empty_reference_environment_fails_the_load() {
    let toml = service_toml("sonarr", "api_key_env = \"YARR_SONARR_API_KEY\"\n");
    let error = load_toml(&toml, |env| {
        env.remove("YARR_SONARR_API_KEY");
    })
    .expect_err("missing referenced variable must fail the load");
    assert!(
        error.to_string().contains("YARR_SONARR_API_KEY") && error.to_string().contains("not set"),
        "{error:#}"
    );

    let error = load_toml(&toml, |env| env.set("YARR_SONARR_API_KEY", ""))
        .expect_err("empty referenced variable must fail the load");
    assert!(error.to_string().contains("not set"), "{error:#}");
}

#[test]
fn literal_plus_reference_for_one_credential_is_a_collision() {
    let error = load_toml(
        &service_toml(
            "sonarr",
            "api_key = \"literal\"\napi_key_env = \"YARR_SONARR_API_KEY\"\n",
        ),
        |env| env.set("YARR_SONARR_API_KEY", "env"),
    )
    .expect_err("literal + reference must be rejected");
    assert!(
        error
            .to_string()
            .contains("both a literal value and a reference"),
        "{error:#}"
    );
    assert!(error.to_string().contains("API_KEY"), "{error:#}");
}

#[test]
fn env_service_list_replaces_toml_services_before_reference_resolution() {
    // YARR_SERVICES replaces the TOML service list, so a reference on a
    // replaced entry must not fail the load even when its variable is unset.
    let loaded = load_toml(
        &service_toml("sonarr", "api_key_env = \"YARR_SONARR_API_KEY\"\n"),
        |env| {
            env.set("YARR_SERVICES", "radarr");
            env.set("YARR_RADARR_URL", "http://127.0.0.1:7878");
            env.set("YARR_RADARR_API_KEY", "env-key");
        },
    )
    .expect("env-list replacement loads");
    assert_eq!(loaded.yarr.services.len(), 1);
    assert_eq!(loaded.yarr.services[0].name, "radarr");
    assert_eq!(loaded.yarr.services[0].api_key.as_deref(), Some("env-key"));
    // Env-loaded services carry literal values, never references.
    assert!(loaded.yarr.services[0].api_key_env.is_none());
}

#[tokio::test]
async fn resolved_credential_reference_reaches_the_upstream_request() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let captured = std::sync::Arc::new(std::sync::Mutex::new(String::new()));
    let server_captured = captured.clone();
    let server = tokio::spawn(async move {
        let (mut stream, _) = listener.accept().await.unwrap();
        let mut request = vec![0_u8; 4096];
        let n = stream.read(&mut request).await.unwrap();
        *server_captured.lock().unwrap() = String::from_utf8_lossy(&request[..n]).into_owned();
        let body = br#"{"version":"4.0.0"}"#;
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
            body.len()
        );
        let _ = stream.write_all(response.as_bytes()).await;
        let _ = stream.write_all(body).await;
    });

    let toml = format!(
        "[yarr]\n[[yarr.services]]\nname = \"sonarr\"\nkind = \"sonarr\"\nbase_url = \"http://{addr}\"\napi_key_env = \"YARR_SONARR_API_KEY\"\n"
    );
    let loaded = load_toml(&toml, |env| {
        env.set("YARR_SONARR_API_KEY", "ref-echo-secret")
    })
    .expect("reference resolves");
    let client = crate::yarr::YarrClient::new(&loaded.yarr).expect("client builds");
    let value = client
        .get_json(&loaded.yarr.services[0], "/api/v3/system/status")
        .await
        .expect("stub responds");
    assert_eq!(value["version"], "4.0.0");
    server.await.unwrap();
    let request = captured.lock().unwrap().to_lowercase();
    assert!(
        request.contains("x-api-key: ref-echo-secret"),
        "the resolved reference must reach the upstream request: {request}"
    );
}
