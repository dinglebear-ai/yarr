//! Setup command dispatch and the check / repair / install logic: appdata,
//! `.env` writing, and auth/port validation that runs before the server starts.

use std::net::TcpListener;
use std::path::{Path, PathBuf};

use crate::{
    config::{AuthMode, Config, default_data_dir},
    server::resolve_auth_policy_kind,
};
use anyhow::{Result, bail};

// ── public surface ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SetupCommand {
    Check,
    Repair,
    /// Copy this binary into ~/.local/bin so it is callable as a bare command
    /// in the user's own terminal, independent of Claude Code.
    Install,
    PluginHook {
        no_repair: bool,
    },
}

pub async fn run_setup(config: &Config, command: SetupCommand) -> Result<()> {
    let report = match command {
        SetupCommand::Check => setup_check(config, true),
        SetupCommand::Repair => setup_repair(config)?,
        SetupCommand::Install => {
            let dest = install_self()?;
            println!("installed -> {}", dest.display());
            return Ok(());
        }
        SetupCommand::PluginHook { no_repair } => setup_plugin_hook(config, no_repair)?,
    };

    println!("{}", serde_json::to_string_pretty(&report)?);
    if !report.blocking_failures.is_empty() {
        bail!(
            "setup found {} blocking failure(s)",
            report.blocking_failures.len()
        );
    }
    Ok(())
}

// ── internal types ────────────────────────────────────────────────────────────

#[derive(Debug, serde::Serialize)]
pub(crate) struct SetupFailure {
    pub(crate) code: &'static str,
    pub(crate) message: String,
}

#[derive(Debug, serde::Serialize)]
pub(crate) struct SetupReport {
    pub(crate) exit_policy: &'static str,
    pub(crate) ran_repair: bool,
    no_repair: bool,
    pub(crate) blocking_failures: Vec<SetupFailure>,
    pub(crate) advisory_failures: Vec<SetupFailure>,
}

impl SetupReport {
    pub(crate) fn new(no_repair: bool) -> Self {
        Self {
            exit_policy: "success",
            ran_repair: false,
            no_repair,
            blocking_failures: Vec::new(),
            advisory_failures: Vec::new(),
        }
    }

    pub(crate) fn finish(mut self) -> Self {
        self.exit_policy = if !self.blocking_failures.is_empty() {
            "blocking_failure"
        } else if !self.advisory_failures.is_empty() {
            "advisory_failure"
        } else {
            "success"
        };
        self
    }
}

// ── setup logic ───────────────────────────────────────────────────────────────

/// Copy the running binary into `~/.local/bin/<name>` so it is callable as a
/// bare command in the user's own terminal, independent of Claude Code.
///
/// Uses the running executable's own file name as the destination, so this is
/// identical across every server repo. Copy (not symlink) so it survives
/// `/plugin update`, which changes the plugin cache path a symlink would dangle
/// to. Atomic via temp + rename; idempotent; depends only on std + anyhow.
fn install_self() -> Result<PathBuf> {
    let exe = std::env::current_exe()?;
    let name = exe
        .file_name()
        .ok_or_else(|| anyhow::anyhow!("cannot determine binary name from {}", exe.display()))?;
    let home = std::env::var_os("HOME").ok_or_else(|| anyhow::anyhow!("HOME is not set"))?;
    let bin_dir = PathBuf::from(home).join(".local").join("bin");
    std::fs::create_dir_all(&bin_dir)?;
    let dest = bin_dir.join(name);

    // Running the already-installed copy: nothing to do.
    if dest == exe {
        return Ok(dest);
    }

    // Unique per-process temp name so concurrent installs don't race on a fixed
    // path.
    let tmp = bin_dir.join(format!(
        ".{}.tmp.{}",
        name.to_string_lossy(),
        std::process::id()
    ));
    std::fs::copy(&exe, &tmp)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o755))?;
    }
    std::fs::rename(&tmp, &dest).inspect_err(|_| {
        let _ = std::fs::remove_file(&tmp);
    })?;

    let on_path = std::env::var_os("PATH")
        .map(|p| std::env::split_paths(&p).any(|d| d == bin_dir))
        .unwrap_or(false);
    if !on_path {
        eprintln!(
            "note: {} is not on your PATH; add:  export PATH=\"$HOME/.local/bin:$PATH\"",
            bin_dir.display()
        );
    }
    Ok(dest)
}

fn setup_plugin_hook(config: &Config, no_repair: bool) -> Result<SetupReport> {
    // Keep the user's terminal copy in ~/.local/bin fresh each session so it
    // survives `/plugin update`. Best-effort: never fail the hook over it.
    if let Err(e) = install_self() {
        eprintln!("setup plugin-hook: self-install skipped: {e}");
    }
    // Bridge per-service credentials to the bundled fallback skills' config
    // files so they can reach services over HTTP if the MCP server is down.
    // Best-effort: never fail the hook over it.
    if let Err(e) = super::plugin::write_skill_fallback_config() {
        eprintln!("setup plugin-hook: skill fallback config skipped: {e}");
    }
    let initial = setup_check(config, no_repair);
    if initial.blocking_failures.is_empty() || no_repair {
        return Ok(initial);
    }
    setup_repair(config)
}

pub(crate) fn setup_check(config: &Config, no_repair: bool) -> SetupReport {
    let mut report = SetupReport::new(no_repair);
    let data_dir = match setup_data_dir() {
        Ok(d) => d,
        Err(e) => {
            report.blocking_failures.push(SetupFailure {
                code: "appdata_dir_unknown",
                message: format!(
                    "cannot determine appdata directory: {e} — set HOME or RUNNING_IN_CONTAINER=1"
                ),
            });
            return report.finish();
        }
    };

    if !data_dir.is_dir() {
        report.blocking_failures.push(SetupFailure {
            code: "appdata_missing",
            message: format!("appdata directory does not exist: {}", data_dir.display()),
        });
    }
    let env_path = data_dir.join(".env");
    if !env_path.is_file() {
        report.advisory_failures.push(SetupFailure {
            code: "env_file_missing",
            message: format!(
                "{} does not exist; setup repair will create one, but process env can supply values",
                env_path.display()
            ),
        });
    }
    if config.yarr.services.is_empty() {
        report.blocking_failures.push(SetupFailure {
            code: "missing_yarr_services",
            message: "YARR_SERVICES or [yarr.services] configuration is required".into(),
        });
    }

    check_auth(config, &mut report);
    check_port(&config.mcp.host, config.mcp.port, &mut report);

    report.finish()
}

pub(crate) fn setup_repair(config: &Config) -> Result<SetupReport> {
    // L8: Two concurrent `setup repair` invocations can clobber each other's
    // .env.tmp → .env rename. For a plugin hook triggered by a single Claude
    // session this is benign, but a proper fix would use flock(2) on the data dir.
    let data_dir = setup_data_dir()?;
    std::fs::create_dir_all(&data_dir)?;
    write_env(&data_dir, config)?;

    // Re-run check after repair; `appdata_missing` is now resolved since
    // `create_dir_all` succeeded above.
    let mut report = setup_check(config, false);
    report.ran_repair = true;

    Ok(report.finish())
}

fn require_oauth_field(
    report: &mut SetupReport,
    value: &Option<String>,
    code: &'static str,
    message: &str,
) {
    if value.as_deref().unwrap_or("").is_empty() {
        report.blocking_failures.push(SetupFailure {
            code,
            message: message.into(),
        });
    }
}

fn check_auth(config: &Config, report: &mut SetupReport) {
    if let Err(error) = resolve_auth_policy_kind(config, config.mcp.trusted_gateway) {
        report.blocking_failures.push(SetupFailure {
            code: "invalid_auth_policy",
            message: error.to_string(),
        });
        return;
    }

    if config.mcp.no_auth {
        return;
    }

    if config.mcp.auth.mode == AuthMode::OAuth {
        require_oauth_field(
            report,
            &config.mcp.auth.public_url,
            "missing_oauth_public_url",
            "YARR_MCP_PUBLIC_URL is required for OAuth mode",
        );
        require_oauth_field(
            report,
            &config.mcp.auth.google_client_id,
            "missing_oauth_client_id",
            "YARR_MCP_GOOGLE_CLIENT_ID is required for OAuth mode",
        );
        require_oauth_field(
            report,
            &config.mcp.auth.google_client_secret,
            "missing_oauth_client_secret",
            "YARR_MCP_GOOGLE_CLIENT_SECRET is required for OAuth mode",
        );
        require_oauth_field(
            report,
            &Some(config.mcp.auth.admin_email.clone()),
            "missing_oauth_admin_email",
            "YARR_MCP_AUTH_ADMIN_EMAIL is required for OAuth mode",
        );
    } else if config.mcp.api_token.as_deref().unwrap_or("").is_empty() {
        report.blocking_failures.push(SetupFailure {
            code: "missing_mcp_token",
            message: "YARR_MCP_TOKEN is required unless no_auth or OAuth mode is enabled".into(),
        });
    }
}

fn check_port(host: &str, port: u16, report: &mut SetupReport) {
    if let Err(error) = TcpListener::bind((host, port)) {
        report.blocking_failures.push(SetupFailure {
            code: "mcp_port_in_use",
            message: format!(
                "MCP bind address {host}:{port} is unavailable: {error}. Find the listener with: ss -tlnp | grep :{port}"
            ),
        });
    }
}

fn setup_data_dir() -> anyhow::Result<PathBuf> {
    // Writes go to the canonical service appdata dir — `~/.yarr/` on bare
    // metal, `/data` in a container (see `default_data_dir`). This is the SAME
    // location the binary loads `.env` from (`config::load_dotenv_defaults`), so
    // the plugin hook's writes and the server's reads always agree.
    //
    // An explicit `YARR_HOME` override is honored (used by tests).
    // `CLAUDE_PLUGIN_DATA` is intentionally NOT consulted: the plugin's sandboxed
    // data dir must not diverge from `~/.yarr/`.
    if let Some(val) = std::env::var_os("YARR_HOME") {
        return Ok(PathBuf::from(val));
    }
    default_data_dir()
}

fn write_env(data_dir: &Path, config: &Config) -> Result<()> {
    let service_names = config
        .yarr
        .services
        .iter()
        .map(|service| service.name.as_str())
        .collect::<Vec<_>>()
        .join(",");
    let mut lines = vec![
        dotenv_assignment("YARR_SERVICES", &service_names)?,
        dotenv_assignment("YARR_MCP_HOST", &config.mcp.host)?,
        dotenv_assignment("YARR_MCP_PORT", &config.mcp.port.to_string())?,
        dotenv_assignment("YARR_MCP_NO_AUTH", &config.mcp.no_auth.to_string())?,
        dotenv_assignment(
            "YARR_MCP_STATIC_TOKEN_SCOPES",
            &config.mcp.static_token_scopes.join(","),
        )?,
        dotenv_assignment(
            "YARR_MCP_TOOL_MODE",
            match config.mcp.tool_mode {
                crate::config::ToolMode::Codemode => "codemode",
                crate::config::ToolMode::Flat => "flat",
            },
        )?,
    ];
    for service in &config.yarr.services {
        let prefix = service.name.to_ascii_uppercase().replace('-', "_");
        lines.push(dotenv_assignment(
            &format!("YARR_{prefix}_KIND"),
            service.kind.as_str(),
        )?);
        lines.push(dotenv_assignment(
            &format!("YARR_{prefix}_URL"),
            &service.base_url,
        )?);
        if let Some(api_key) = &service.api_key {
            lines.push(dotenv_assignment(
                &format!("YARR_{prefix}_API_KEY"),
                api_key,
            )?);
        }
        if let Some(username) = &service.username {
            lines.push(dotenv_assignment(
                &format!("YARR_{prefix}_USERNAME"),
                username,
            )?);
        }
        if let Some(password) = &service.password {
            lines.push(dotenv_assignment(
                &format!("YARR_{prefix}_PASSWORD"),
                password,
            )?);
        }
        if let Some(token) = &service.token {
            lines.push(dotenv_assignment(&format!("YARR_{prefix}_TOKEN"), token)?);
        }
    }

    if let Some(token) = config.mcp.api_token.as_deref().filter(|v| !v.is_empty()) {
        lines.push(dotenv_assignment("YARR_MCP_TOKEN", token)?);
    }
    if config.mcp.auth.mode == AuthMode::OAuth {
        lines.push("YARR_MCP_AUTH_MODE=oauth".into());
        if let Some(v) = &config.mcp.auth.public_url {
            lines.push(dotenv_assignment("YARR_MCP_PUBLIC_URL", v)?);
        }
        if let Some(v) = &config.mcp.auth.google_client_id {
            lines.push(dotenv_assignment("YARR_MCP_GOOGLE_CLIENT_ID", v)?);
        }
        if let Some(v) = &config.mcp.auth.google_client_secret {
            lines.push(dotenv_assignment("YARR_MCP_GOOGLE_CLIENT_SECRET", v)?);
        }
        if !config.mcp.auth.admin_email.is_empty() {
            lines.push(dotenv_assignment(
                "YARR_MCP_AUTH_ADMIN_EMAIL",
                &config.mcp.auth.admin_email,
            )?);
        }
    }

    let env_path = data_dir.join(".env");
    // Unique per-process temp name so concurrent writes don't race on a fixed path.
    let temp_path = data_dir.join(format!(".env.tmp.{}", std::process::id()));
    #[cfg(unix)]
    {
        use std::io::Write;
        use std::os::unix::fs::OpenOptionsExt;

        // mode(0o600) sets permissions atomically at creation — no second chmod needed.
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .mode(0o600)
            .open(&temp_path)?;
        writeln!(file, "{}", lines.join("\n"))?;
        file.sync_all()?;
    }
    #[cfg(not(unix))]
    std::fs::write(&temp_path, format!("{}\n", lines.join("\n")))?;
    std::fs::rename(&temp_path, &env_path).inspect_err(|_| {
        // Best-effort cleanup: remove the temp file if rename fails to avoid leaking
        // a partially-written file containing secrets.
        let _ = std::fs::remove_file(&temp_path);
    })?;
    Ok(())
}

pub(crate) fn dotenv_assignment(key: &str, value: &str) -> Result<String> {
    Ok(format!("{key}={}", dotenv_value(value)?))
}

fn dotenv_value(value: &str) -> Result<String> {
    if value.chars().any(|c| matches!(c, '\n' | '\r' | '\0')) {
        bail!("dotenv values cannot contain newlines or NUL bytes");
    }

    if value.chars().all(|c| {
        c.is_ascii_alphanumeric()
            || matches!(c, '_' | '-' | '.' | '/' | ':' | '@' | '%' | '+' | '=' | ',')
    }) {
        return Ok(value.to_string());
    }

    let escaped = value.replace('\\', "\\\\").replace('"', "\\\"");
    Ok(format!("\"{escaped}\""))
}

#[cfg(test)]
#[path = "wizard_tests.rs"]
mod tests;
