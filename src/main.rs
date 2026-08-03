//! Binary entry point — mode dispatch only.
//!
//! Modes:
//!   `yarr [serve]`        Start MCP HTTP server (default if no args)
//!   `yarr mcp`            Start MCP stdio transport
//!   `yarr help`           CLI action reference
//!   `yarr get ...`        CLI upstream GET command
//!   `yarr status`         CLI status command
//!   `yarr --help`         Print usage
//!   `yarr --version`      Print version
//!
//! Extend the CLI parser/router when adding more user-facing subcommands.

use anyhow::Result;
use std::sync::Arc;
use std::time::Duration;

use rmcp::{ServiceExt, transport::stdio};
use tokio::runtime::Builder;
use tracing::info;
use tracing_subscriber::{EnvFilter, fmt};
use yarr::{
    AppState, AuthPolicy, AuthPolicyKind, Command, Config, READ_SCOPE, RunMode, WRITE_SCOPE,
    YarrClient, YarrService, acquire_oauth_instance_lock, apply_plugin_options, cli_usage,
    init_logging, parse_args_configured, resolve_auth_policy_kind, resolve_data_dir, rmcp_server,
    router, run_cli_command, run_doctor, run_plex_discovery, run_setup, run_watch,
};

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();

    // Handle meta-flags before initialising logging (they print and exit)
    match args.as_slice() {
        [f] if matches!(f.as_str(), "--help" | "-h") => {
            eprintln!("{}", cli_usage());
            return Ok(());
        }
        [f] if matches!(f.as_str(), "--version" | "-V" | "version") => {
            println!("yarr {}", env!("CARGO_PKG_VERSION"));
            return Ok(());
        }
        _ => {}
    }

    let mode = RunMode::classify(&args);
    init_logging_for_mode(mode);

    // Environment promotion from plugin options and `.env` loading mutate the
    // process environment. Do that before constructing Tokio so no runtime worker
    // can concurrently read environment variables.
    if mode == RunMode::Cli {
        apply_plugin_options();
    }
    let config = Config::load()?;

    Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(async move {
            match mode {
                RunMode::Serve => serve_mcp(config).await,
                RunMode::Stdio => serve_stdio_mcp(config).await,
                RunMode::Cli => run_cli(config).await,
            }
        })
}

/// Install the tracing subscriber appropriate for `mode`.
///
/// `Serve` gets dual logging — pretty console on stderr **plus** a JSON-lines
/// file under `{data_dir}/logs/yarr.log` for log aggregators / agents.
/// `Stdio` and `Cli` get a stderr-only `warn` subscriber: stdout carries the MCP
/// JSON-RPC stream or CLI output, so logs must never land there.
///
/// File logging is **best-effort**. If the data dir can't be resolved or the log
/// file can't be opened (read-only mount, permissions, no `HOME`), the server
/// still starts with stderr-only logging rather than aborting — its function
/// doesn't depend on a writable log file. This is safe because every fallible
/// step in `init_logging` runs *before* it installs the global subscriber, so
/// the fallback below can't double-install.
fn init_logging_for_mode(mode: RunMode) {
    if mode.is_serve() {
        match resolve_data_dir().and_then(|dir| init_logging(&dir, "yarr")) {
            Ok(()) => return,
            Err(error) => eprintln!(
                "WARN  file logging unavailable ({error:#}); continuing with stderr-only logs"
            ),
        }
    }

    let log_level = if mode.is_serve() { "info" } else { "warn" };
    fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(log_level)),
        )
        .with_writer(std::io::stderr)
        .with_target(true)
        .init();
}

// ── modes ─────────────────────────────────────────────────────────────────────

/// Start the MCP HTTP server (Streamable HTTP transport).
async fn serve_mcp(config: Config) -> Result<()> {
    let state = build_state(config).await?;

    info!(
        bind = %state.config.bind_addr(),
        server_name = %state.config.server_name,
        auth = ?state.auth_policy,
        "yarr starting"
    );

    let bind = state.config.bind_addr();
    let app = router(state).layer(tower_http::trace::TraceLayer::new_for_http());
    let listener = tokio::net::TcpListener::bind(&bind).await?;
    info!(bind = %bind, "MCP HTTP server listening");

    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

/// Start the MCP stdio transport (for local/subprocess MCP clients).
///
/// Stdio is always `LoopbackDev` — it's a local trusted pipe between parent and
/// child process. HTTP auth middleware doesn't apply; forcing `Mounted` here
/// breaks all stdio clients with "forbidden: missing http context".
async fn serve_stdio_mcp(config: Config) -> Result<()> {
    let mut service = YarrService::new(YarrClient::new(&config.yarr)?, config.yarr.clone())
        .with_codemode_limits(
            config.mcp.codemode_max_concurrent,
            Duration::from_millis(config.mcp.codemode_queue_timeout_ms),
            Duration::from_secs(config.mcp.codemode_timeout_secs),
        );
    // Enable Code Mode `writeArtifact` under the data dir (best-effort).
    if let Ok(dir) = resolve_data_dir() {
        service = service.with_data_dir(dir);
    }
    let state = AppState {
        config: config.mcp,
        auth_policy: AuthPolicy::LoopbackDev, // stdio = trusted local transport
        service,
    };
    let svc = rmcp_server(state).serve(stdio()).await?;
    svc.waiting().await?;
    Ok(())
}

/// Dispatch CLI subcommands.
async fn run_cli(config: Config) -> Result<()> {
    match parse_args_configured(&config.yarr)? {
        Some(Command::Doctor { json }) => {
            // Doctor needs the full Config (not just YarrConfig) to check
            // MCP port, auth mode, etc. — intercept here before service construction.
            run_doctor(&config, json).await
        }
        Some(Command::Watch {
            url,
            interval,
            once,
        }) => {
            // Watch needs the MCP port to build the default URL but no service layer.
            let base = url.unwrap_or_else(|| format!("http://localhost:{}", config.mcp.port));
            run_watch(&base, interval, once).await
        }
        Some(Command::Setup(command)) => run_setup(&config, command).await,
        Some(Command::DiscoverPlex {
            owned_only,
            token_env,
            output,
            env_output,
            diff,
        }) => {
            let (report, has_drift) = run_plex_discovery(
                &config.yarr,
                owned_only,
                &token_env,
                &output,
                &env_output,
                diff,
            )
            .await?;
            println!("{}", serde_json::to_string_pretty(&report)?);
            if has_drift {
                std::process::exit(2);
            }
            Ok(())
        }
        Some(cmd) => run_cli_command(cmd, &config.yarr).await,
        None => {
            eprintln!("Unknown command. Run `yarr --help` for usage.");
            std::process::exit(1);
        }
    }
}

// ── helpers ───────────────────────────────────────────────────────────────────

async fn build_state(config: Config) -> Result<AppState> {
    let auth_policy = build_auth_policy(&config).await?;
    let mut service = YarrService::new(YarrClient::new(&config.yarr)?, config.yarr.clone())
        .with_codemode_limits(
            config.mcp.codemode_max_concurrent,
            Duration::from_millis(config.mcp.codemode_queue_timeout_ms),
            Duration::from_secs(config.mcp.codemode_timeout_secs),
        );
    // Enable Code Mode `writeArtifact` under the data dir (best-effort).
    if let Ok(dir) = resolve_data_dir() {
        service = service.with_data_dir(dir);
    }
    Ok(AppState {
        config: config.mcp,
        auth_policy,
        service,
    })
}

async fn build_auth_policy(config: &Config) -> Result<AuthPolicy> {
    match resolve_auth_policy_kind(config, config.mcp.trusted_gateway)? {
        AuthPolicyKind::LoopbackDev => Ok(AuthPolicy::LoopbackDev),
        AuthPolicyKind::TrustedGatewayUnscoped => Ok(AuthPolicy::TrustedGatewayUnscoped),
        AuthPolicyKind::MountedBearer => Ok(AuthPolicy::Mounted { auth_state: None }),
        AuthPolicyKind::MountedOAuth => {
            let instance_lock =
                acquire_oauth_instance_lock(std::path::Path::new(&config.mcp.auth.sqlite_path))?;
            let auth_cfg = lab_auth::config::AuthConfigBuilder::new()
                .env_prefix("YARR_MCP")
                .session_cookie_name("yarr_mcp_session")
                .scopes_supported(vec![READ_SCOPE.into(), WRITE_SCOPE.into()])
                .default_scope("yarr:read")
                .static_token_scopes(config.mcp.static_token_scopes.clone())
                .disable_static_token_with_oauth(config.mcp.auth.disable_static_token_with_oauth)
                .resource_path("/mcp")
                .enable_dynamic_registration(true)
                .build_from_sources(auth_config_sources(config))
                .map_err(|e| anyhow::anyhow!("OAuth config error: {e}"))?;
            let auth_state = lab_auth::state::AuthState::new(auth_cfg)
                .await
                .map_err(|e| anyhow::anyhow!("OAuth state init error: {e}"))?;
            // AuthPolicy owns AuthState but lab-auth does not expose an extension
            // slot for the OS lock. Keep it for the process lifetime after state
            // initialization succeeds; startup errors still release it normally.
            let _instance_lock = Box::leak(Box::new(instance_lock));
            Ok(AuthPolicy::Mounted {
                auth_state: Some(Arc::new(auth_state)),
            })
        }
    }
}

fn auth_config_sources(config: &Config) -> Vec<(String, String)> {
    let auth = &config.mcp.auth;
    let mut vars = vec![
        ("YARR_MCP_AUTH_MODE".into(), "oauth".into()),
        ("YARR_MCP_AUTH_SQLITE_PATH".into(), auth.sqlite_path.clone()),
        ("YARR_MCP_AUTH_KEY_PATH".into(), auth.key_path.clone()),
        (
            "YARR_MCP_AUTH_ACCESS_TOKEN_TTL_SECS".into(),
            auth.access_token_ttl_secs.to_string(),
        ),
        (
            "YARR_MCP_AUTH_REFRESH_TOKEN_TTL_SECS".into(),
            auth.refresh_token_ttl_secs.to_string(),
        ),
        (
            "YARR_MCP_AUTH_CODE_TTL_SECS".into(),
            auth.auth_code_ttl_secs.to_string(),
        ),
        (
            "YARR_MCP_AUTH_REGISTER_RPM".into(),
            auth.register_rpm.to_string(),
        ),
        (
            "YARR_MCP_AUTH_AUTHORIZE_RPM".into(),
            auth.authorize_rpm.to_string(),
        ),
    ];
    push_optional(&mut vars, "YARR_MCP_PUBLIC_URL", &auth.public_url);
    push_optional(
        &mut vars,
        "YARR_MCP_GOOGLE_CLIENT_ID",
        &auth.google_client_id,
    );
    push_optional(
        &mut vars,
        "YARR_MCP_GOOGLE_CLIENT_SECRET",
        &auth.google_client_secret,
    );
    if !auth.admin_email.is_empty() {
        vars.push(("YARR_MCP_AUTH_ADMIN_EMAIL".into(), auth.admin_email.clone()));
    }
    if !auth.allowed_emails.is_empty() {
        vars.push((
            "YARR_MCP_AUTH_ALLOWED_EMAILS".into(),
            auth.allowed_emails.join(","),
        ));
    }
    if !auth.allowed_client_redirect_uris.is_empty() {
        // lab-auth reads `<PREFIX>_AUTH_ALLOWED_REDIRECT_URIS` (no CLIENT); emitting
        // the CLIENT-suffixed key silently dropped the value.
        vars.push((
            "YARR_MCP_AUTH_ALLOWED_REDIRECT_URIS".into(),
            auth.allowed_client_redirect_uris.join(","),
        ));
    }
    vars
}

fn push_optional(vars: &mut Vec<(String, String)>, key: &str, value: &Option<String>) {
    if let Some(value) = value.as_ref().filter(|value| !value.is_empty()) {
        vars.push((key.into(), value.clone()));
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(e) = tokio::signal::ctrl_c().await {
            tracing::error!(error = %e, "CTRL+C handler failed");
            std::future::pending::<()>().await;
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut s) => {
                s.recv().await;
            }
            Err(e) => {
                tracing::error!(error = %e, "SIGTERM handler failed");
                std::future::pending::<()>().await;
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
    tracing::info!("Shutdown signal received");
}
