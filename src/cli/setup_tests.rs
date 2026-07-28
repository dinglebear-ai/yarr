use super::{SetupCommand, SetupReport};
use crate::config::{Config, McpConfig, YarrConfig};

// Use the single process-wide env lock from the testing module to serialise
// all tests that mutate `YARR_HOME`, `YARR_SERVICES`, etc.
use crate::testing::TestEnv;

// ── SetupReport state machine ─────────────────────────────────────────────────

#[test]
fn new_report_has_no_failures() {
    let report = SetupReport::new(false);
    assert!(report.blocking_failures.is_empty());
    assert!(report.advisory_failures.is_empty());
    assert!(!report.ran_repair);
}

#[test]
fn finish_sets_success_when_no_failures() {
    let report = SetupReport::new(false).finish();
    assert_eq!(report.exit_policy, "success");
}

#[test]
fn finish_sets_blocking_failure_when_blocking_present() {
    let mut report = SetupReport::new(false);
    report.blocking_failures.push(super::SetupFailure {
        code: "test_code",
        message: "test message".into(),
    });
    let report = report.finish();
    assert_eq!(report.exit_policy, "blocking_failure");
}

#[test]
fn finish_sets_advisory_failure_when_only_advisory_present() {
    let mut report = SetupReport::new(false);
    report.advisory_failures.push(super::SetupFailure {
        code: "test_advisory",
        message: "advisory message".into(),
    });
    let report = report.finish();
    assert_eq!(report.exit_policy, "advisory_failure");
}

#[test]
fn finish_prefers_blocking_over_advisory() {
    let mut report = SetupReport::new(false);
    report.blocking_failures.push(super::SetupFailure {
        code: "b",
        message: "blocking".into(),
    });
    report.advisory_failures.push(super::SetupFailure {
        code: "a",
        message: "advisory".into(),
    });
    let report = report.finish();
    assert_eq!(report.exit_policy, "blocking_failure");
}

// ── SetupCommand enum ─────────────────────────────────────────────────────────

#[test]
fn setup_command_copy() {
    let cmd = SetupCommand::Check;
    let _copy = cmd;
    let _again = cmd;
}

#[test]
fn all_variants_are_distinct() {
    assert_ne!(SetupCommand::Check, SetupCommand::Repair);
    assert_ne!(
        SetupCommand::Check,
        SetupCommand::PluginHook { no_repair: false }
    );
    assert_ne!(
        SetupCommand::Repair,
        SetupCommand::PluginHook { no_repair: false }
    );
    assert_ne!(
        SetupCommand::PluginHook { no_repair: false },
        SetupCommand::PluginHook { no_repair: true }
    );
}

// ── setup check / repair behavior ────────────────────────────────────────────

fn valid_config() -> Config {
    Config {
        yarr: YarrConfig {
            services: vec![crate::config::ServiceConfig {
                name: "sonarr".into(),
                kind: crate::config::ServiceKind::Sonarr,
                base_url: "https://yarr.test/api".into(),
                api_key: Some("secret with spaces".into()),
                ..crate::config::ServiceConfig::default()
            }],
        },
        mcp: McpConfig {
            host: "127.0.0.1".into(),
            port: 0,
            no_auth: true,
            ..McpConfig::default()
        },
    }
}

fn with_plugin_data<T>(dir: &std::path::Path, f: impl FnOnce() -> T) -> T {
    let mut env = TestEnv::new();
    env.set("YARR_HOME", dir);
    f()
}

#[test]
fn setup_check_reports_missing_env_as_advisory() {
    let dir = tempfile::tempdir().unwrap();
    let config = valid_config();

    let report = with_plugin_data(dir.path(), || super::setup_check(&config, true));

    assert!(report.blocking_failures.is_empty());
    assert_eq!(report.exit_policy, "advisory_failure");
    assert!(
        report
            .advisory_failures
            .iter()
            .any(|failure| failure.code == "env_file_missing")
    );
}

#[test]
fn setup_repair_creates_env_file() {
    let dir = tempfile::tempdir().unwrap();
    let config = valid_config();

    let report = with_plugin_data(dir.path(), || super::setup_repair(&config).unwrap());

    assert!(report.ran_repair);
    assert!(report.blocking_failures.is_empty());
    let env_path = dir.path().join(".env");
    let contents = std::fs::read_to_string(&env_path).unwrap();
    assert!(contents.contains("YARR_SERVICES=sonarr"));
    assert!(contents.contains("YARR_SONARR_URL=https://yarr.test/api"));
    assert!(contents.contains("YARR_SONARR_API_KEY=\"secret with spaces\""));
    assert!(contents.contains("YARR_MCP_STATIC_TOKEN_SCOPES=yarr:read"));
    assert!(contents.contains("YARR_MCP_TOOL_MODE=codemode"));

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = std::fs::metadata(&env_path).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode, 0o600);
    }
}

#[test]
fn setup_check_blocks_when_port_is_already_bound() {
    let dir = tempfile::tempdir().unwrap();
    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    let mut config = valid_config();
    config.mcp.port = listener.local_addr().unwrap().port();

    let report = with_plugin_data(dir.path(), || super::setup_check(&config, true));

    assert!(
        report
            .blocking_failures
            .iter()
            .any(|failure| failure.code == "mcp_port_in_use")
    );
}

#[test]
fn dotenv_values_quote_special_characters_and_escape_quotes() {
    assert_eq!(
        super::dotenv_assignment("YARR_SONARR_API_KEY", "secret # \"quoted\"").unwrap(),
        "YARR_SONARR_API_KEY=\"secret # \\\"quoted\\\"\""
    );
}

#[test]
fn dotenv_values_reject_newlines() {
    let error = super::dotenv_assignment("YARR_SONARR_API_KEY", "line\nbreak").unwrap_err();
    assert!(error.to_string().contains("newlines"));
}
