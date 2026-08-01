//! `yarr` library crate.
//!
//! Runtime library for the `yarr` binary, MCP server, and integration tests.
//!
//! This crate is not a public SDK. Prefer the root re-exports below for the
//! binary, `xtask`, and integration tests; implementation modules are private so
//! internal organization can keep moving without turning every module into API.
//!
//! The one deliberate exception is [`models`]: a public, namespaced layer of
//! typed upstream response structs (one set per supported `ServiceKind`) that
//! external consumers — integration tests, `xtask`, downstream tooling — can
//! decode into directly.

// Some complete upstream-contract test fixtures (e.g. qBittorrent's 46-field
// torrent row) are single `serde_json::json!` literals that exceed the default
// macro recursion limit of 128.
#![recursion_limit = "256"]
// This internal application crate predates Clippy's documentation style lints.
// Keep new code warning-clean without requiring a bulk public-API documentation rewrite.
#![allow(clippy::doc_markdown, clippy::missing_errors_doc)]

mod actions;
mod app;
mod capability;
mod cli;
mod codemode;
mod config;
pub(crate) mod logging;
mod mcp;
pub mod models;
pub mod openapi;
mod run_mode;
mod server;
pub(crate) mod token_limit;
mod yarr;

pub use actions::{
    ACTION_SPECS, ActionSpec, CommandDescriptor, READ_SCOPE, WRITE_SCOPE, YarrAction,
    action_allowed_for_kind, action_is_destructive, all_action_names, curated_commands,
    required_scope_for_action, valid_actions_for_kind,
};
pub use app::YarrService;
pub use capability::Capability;
pub use cli::{
    Command, SetupCommand, apply_plugin_options, capability_verb_tables, parse_args,
    parse_args_configured, parse_args_from, run as run_cli_command, run_doctor, run_setup,
    run_watch, usage as cli_usage,
};
pub use config::{
    AuthConfig, Config, McpConfig, ServiceConfig, ServiceKind, YarrConfig,
    acquire_oauth_instance_lock, resolve_data_dir,
};
/// Initialise dual logging for the binary: pretty colored output on stderr plus
/// a JSON-lines file at `{data_dir}/logs/{service}.log` (non-blocking and
/// rotated at 10 MiB with three retained backups).
///
/// Re-exported from the crate-private `logging` module so the binary can wire up
/// logging without widening the whole module's visibility.
pub use logging::init as init_logging;
#[cfg(any(test, feature = "test-support"))]
#[doc(hidden)]
pub use mcp::execute_tool_without_peer_for_test;
pub use mcp::rmcp_server;
pub use run_mode::RunMode;
pub use server::{AppState, AuthPolicy, AuthPolicyKind, resolve_auth_policy_kind, router};
pub use yarr::YarrClient;

/// Test helpers — available when `features = ["test-support"]` or in `cfg(test)`.
///
/// Use these in integration tests to construct `AppState` without real creds.
#[cfg(any(test, feature = "test-support"))]
#[doc(hidden)]
pub mod testing {
    use std::{
        ffi::{OsStr, OsString},
        sync::{Arc, Mutex, MutexGuard},
    };

    /// Process-wide lock serialising any test that mutates environment variables.
    ///
    /// # Requirement (enforced by convention)
    ///
    /// `std::env::set_var` / `std::env::remove_var` mutate **process-global**
    /// state, and Rust runs tests on multiple threads within a single process.
    /// Therefore every test that mutates process environment variables should use
    /// [`TestEnv`], which holds this lock and restores every touched key on drop.
    ///
    /// This is a single shared instance precisely so the lock is *global*:
    /// `config_tests` and `setup_tests` previously each defined their own
    /// independent `Mutex`, which did not actually serialise them against each
    /// other. New test modules that touch env vars must reuse this lock — do not
    /// introduce a second mutex.
    pub static ENV_LOCK: Mutex<()> = Mutex::new(());

    /// RAII process-environment editor for tests.
    ///
    /// The guard serializes all participating tests through [`ENV_LOCK`] and
    /// remembers each key before its first mutation. Dropping the guard restores
    /// the complete original state, including unwinding after a panic.
    pub struct TestEnv {
        _lock: MutexGuard<'static, ()>,
        original: Vec<(OsString, Option<OsString>)>,
    }

    impl TestEnv {
        pub fn new() -> Self {
            Self {
                _lock: ENV_LOCK
                    .lock()
                    .unwrap_or_else(std::sync::PoisonError::into_inner),
                original: Vec::new(),
            }
        }

        fn remember(&mut self, key: &OsStr) {
            if self.original.iter().any(|(saved, _)| saved == key) {
                return;
            }
            self.original.push((key.to_owned(), std::env::var_os(key)));
        }

        pub fn set(&mut self, key: impl AsRef<OsStr>, value: impl AsRef<OsStr>) {
            let key = key.as_ref();
            self.remember(key);
            // SAFETY: this guard holds the process-wide ENV_LOCK until drop.
            unsafe { std::env::set_var(key, value) };
        }

        pub fn remove(&mut self, key: impl AsRef<OsStr>) {
            let key = key.as_ref();
            self.remember(key);
            // SAFETY: this guard holds the process-wide ENV_LOCK until drop.
            unsafe { std::env::remove_var(key) };
        }
    }

    impl Default for TestEnv {
        fn default() -> Self {
            Self::new()
        }
    }

    impl Drop for TestEnv {
        fn drop(&mut self) {
            for (key, value) in self.original.drain(..).rev() {
                // SAFETY: this guard still holds the process-wide ENV_LOCK.
                unsafe {
                    match value {
                        Some(value) => std::env::set_var(&key, value),
                        None => std::env::remove_var(&key),
                    }
                }
            }
        }
    }

    use crate::{
        app::YarrService,
        config::{McpConfig, ServiceConfig, ServiceKind, YarrConfig},
        server::{AppState, AuthPolicy},
        yarr::YarrClient,
    };

    fn stub_service() -> YarrService {
        let config = YarrConfig {
            services: vec![ServiceConfig {
                name: "sonarr".into(),
                kind: ServiceKind::Sonarr,
                base_url: "http://localhost:1".into(),
                api_key: Some("test".into()),
                ..ServiceConfig::default()
            }],
        };
        let client = YarrClient::new(&config).expect("stub client should always build");
        YarrService::new(client, config)
    }

    /// `AppState` with no auth (loopback trust boundary).
    /// Use this for unit tests that don't need auth.
    pub fn loopback_state() -> AppState {
        AppState {
            config: McpConfig::default(),
            auth_policy: AuthPolicy::LoopbackDev,
            service: stub_service(),
        }
    }

    /// `AppState` requiring a static bearer token.
    pub fn bearer_state(token: &str) -> AppState {
        AppState {
            config: McpConfig {
                api_token: Some(token.to_string()),
                ..McpConfig::default()
            },
            auth_policy: AuthPolicy::Mounted { auth_state: None },
            service: stub_service(),
        }
    }

    /// `AppState` with full OAuth (requires data directory for SQLite + key file).
    pub async fn oauth_state(data_dir: &std::path::Path) -> AppState {
        let auth_state = build_auth_state(data_dir).await;
        AppState {
            config: McpConfig {
                auth: crate::config::AuthConfig {
                    public_url: Some("https://yarr.yarr.test".to_string()),
                    ..Default::default()
                },
                ..McpConfig::default()
            },
            auth_policy: AuthPolicy::Mounted {
                auth_state: Some(Arc::new(auth_state)),
            },
            service: stub_service(),
        }
    }

    pub async fn build_auth_state(data_dir: &std::path::Path) -> lab_auth::state::AuthState {
        let vars: Vec<(String, String)> = vec![
            ("YARR_MCP_AUTH_MODE".into(), "oauth".into()),
            (
                "YARR_MCP_PUBLIC_URL".into(),
                "https://yarr.yarr.test".into(),
            ),
            ("YARR_MCP_GOOGLE_CLIENT_ID".into(), "test-client-id".into()),
            (
                "YARR_MCP_GOOGLE_CLIENT_SECRET".into(),
                "test-client-secret".into(),
            ),
            ("YARR_MCP_AUTH_ADMIN_EMAIL".into(), "admin@yarr.test".into()),
            (
                "YARR_MCP_AUTH_SQLITE_PATH".into(),
                data_dir.join("auth.db").display().to_string(),
            ),
            (
                "YARR_MCP_AUTH_KEY_PATH".into(),
                data_dir.join("auth-jwt.pem").display().to_string(),
            ),
        ];

        let auth_config = lab_auth::config::AuthConfigBuilder::new()
            .env_prefix("YARR_MCP")
            .session_cookie_name("yarr_mcp_session")
            .scopes_supported(vec![
                crate::actions::READ_SCOPE.into(),
                crate::actions::WRITE_SCOPE.into(),
            ])
            .default_scope("yarr:read")
            .resource_path("/mcp")
            .build_from_sources(vars)
            .expect("test auth config should build");

        lab_auth::state::AuthState::new(auth_config)
            .await
            .expect("test auth state should init")
    }
}
