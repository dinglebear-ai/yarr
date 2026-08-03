//! Configuration structs for the Yarr MCP server.
//!
//! Values are loaded in priority order:
//!   1. `config.toml` (checked in, defaults only — no secrets)
//!   2. Environment variables (`YARR_*`, `YARR_MCP_*`)
//!
//! Service credentials are loaded from `YARR_SERVICES` plus per-service
//! `YARR_<NAME>_*` environment variables.
//!
//! This module is a facade: the concrete config types are split by concern into
//! the `config/` submodules and re-exported here so the rest of the crate keeps
//! importing them from `crate::config::*`.

use serde::{Deserialize, Serialize};

pub mod auth;
mod environment;
pub mod mcp;
pub mod services;

// Re-export the public config surface so existing `crate::config::*` import
// paths keep working unchanged.
pub use auth::{AuthConfig, AuthMode, acquire_oauth_instance_lock};
pub use mcp::{McpConfig, ToolMode};
pub use services::{ServiceConfig, ServiceKind, default_data_dir, resolve_data_dir};

// Bring the private env helpers into this module's scope. They are used by
// `Config::load` below and exercised by the colocated tests via `super::*`.
pub(crate) use environment::env_value;
pub(crate) use environment::install_plugin_env_overlay;
use environment::{EnvOverlayGuard, load_env_overlay};
use mcp::{env_bool, env_list, env_opt_str, env_parse, env_str};
use services::{
    SERVICE_HOME_DIRNAME, apply_readonly_services, load_services_from_env,
    validate_service_identities,
};

/// Top-level config (maps to `config.toml` sections).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Config {
    pub mcp: McpConfig,
    #[serde(alias = "rustarr")]
    pub yarr: YarrConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct YarrConfig {
    pub services: Vec<ServiceConfig>,
}

// ── Config loading ────────────────────────────────────────────────────────────

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let mut config = Config::default();

        // Search for config.toml in priority order (§25: appdata convention):
        //   1. YARR_CONFIG                         — explicit operator override
        //   2. YARR_HOME/config.toml
        //   3. ~/.yarr/config.toml                — user's persistent config
        //   4. ~/.rustarr/config.toml             — legacy fallback during rebrand
        //
        // Deliberately do not read ./config.toml by default. This repo can contain
        // ignored local examples; loading them implicitly has caused stale identity
        // and unsafe bind-address drift in local runs.
        let candidate_paths = config_candidate_paths();

        for path in &candidate_paths {
            match std::fs::read_to_string(path) {
                Ok(contents) => {
                    if path.ends_with(".rustarr/config.toml") {
                        tracing::warn!(
                            legacy = %path.display(),
                            "loading legacy rustarr config.toml during yarr migration; move it to ~/.yarr/config.toml"
                        );
                    }
                    config = toml::from_str(&contents)
                        .map_err(|e| anyhow::anyhow!("Failed to parse {}: {e}", path.display()))?;
                    break;
                }
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
                Err(e) => return Err(anyhow::anyhow!("Failed to read {}: {e}", path.display())),
            }
        }

        let _overlay = EnvOverlayGuard::install(load_env_overlay()?);

        // Env overrides — YARR_MCP_* for server config.
        env_str("YARR_MCP_HOST", &mut config.mcp.host);
        env_parse("YARR_MCP_PORT", &mut config.mcp.port)?;
        env_str("YARR_MCP_SERVER_NAME", &mut config.mcp.server_name);
        env_bool("YARR_MCP_NO_AUTH", &mut config.mcp.no_auth)?;
        env_bool("YARR_NOAUTH", &mut config.mcp.trusted_gateway)?;
        env_opt_str("YARR_MCP_TOKEN", &mut config.mcp.api_token);
        env_list(
            "YARR_MCP_STATIC_TOKEN_SCOPES",
            &mut config.mcp.static_token_scopes,
        );
        env_list("YARR_MCP_ALLOWED_HOSTS", &mut config.mcp.allowed_hosts);
        env_list("YARR_MCP_ALLOWED_ORIGINS", &mut config.mcp.allowed_origins);
        env_parse(
            "YARR_MCP_CODEMODE_MAX_CONCURRENT",
            &mut config.mcp.codemode_max_concurrent,
        )?;
        env_parse(
            "YARR_MCP_CODEMODE_QUEUE_TIMEOUT_MS",
            &mut config.mcp.codemode_queue_timeout_ms,
        )?;
        env_parse(
            "YARR_MCP_CODEMODE_TIMEOUT_SECS",
            &mut config.mcp.codemode_timeout_secs,
        )?;
        env_parse(
            "YARR_MCP_DESTRUCTIVE_FANOUT_MAX",
            &mut config.mcp.destructive_fanout_max,
        )?;
        env_opt_str("YARR_MCP_PUBLIC_URL", &mut config.mcp.auth.public_url);
        env_str(
            "YARR_MCP_AUTH_ADMIN_EMAIL",
            &mut config.mcp.auth.admin_email,
        );
        env_opt_str(
            "YARR_MCP_GOOGLE_CLIENT_ID",
            &mut config.mcp.auth.google_client_id,
        );
        env_opt_str(
            "YARR_MCP_GOOGLE_CLIENT_SECRET",
            &mut config.mcp.auth.google_client_secret,
        );
        env_list(
            "YARR_MCP_AUTH_ALLOWED_EMAILS",
            &mut config.mcp.auth.allowed_emails,
        );
        env_str(
            "YARR_MCP_AUTH_SQLITE_PATH",
            &mut config.mcp.auth.sqlite_path,
        );
        env_str("YARR_MCP_AUTH_KEY_PATH", &mut config.mcp.auth.key_path);
        env_parse(
            "YARR_MCP_AUTH_ACCESS_TOKEN_TTL_SECS",
            &mut config.mcp.auth.access_token_ttl_secs,
        )?;
        env_parse(
            "YARR_MCP_AUTH_REFRESH_TOKEN_TTL_SECS",
            &mut config.mcp.auth.refresh_token_ttl_secs,
        )?;
        env_parse(
            "YARR_MCP_AUTH_CODE_TTL_SECS",
            &mut config.mcp.auth.auth_code_ttl_secs,
        )?;
        env_parse(
            "YARR_MCP_AUTH_REGISTER_RPM",
            &mut config.mcp.auth.register_rpm,
        )?;
        env_parse(
            "YARR_MCP_AUTH_AUTHORIZE_RPM",
            &mut config.mcp.auth.authorize_rpm,
        )?;
        env_list(
            "YARR_MCP_AUTH_ALLOWED_CLIENT_REDIRECT_URIS",
            &mut config.mcp.auth.allowed_client_redirect_uris,
        );
        if let Some(v) = env_value("YARR_MCP_AUTH_MODE")
            && !v.is_empty()
        {
            config.mcp.auth.mode = match v.to_lowercase().as_str() {
                "oauth" => AuthMode::OAuth,
                "bearer" => AuthMode::Bearer,
                other => {
                    return Err(anyhow::anyhow!(
                        "invalid YARR_MCP_AUTH_MODE {:?}: must be \"bearer\" or \"oauth\"",
                        other
                    ));
                }
            };
        }

        if let Some(v) = env_value("YARR_MCP_TOOL_MODE")
            && !v.is_empty()
        {
            config.mcp.tool_mode = match v.to_lowercase().as_str() {
                "codemode" => ToolMode::Codemode,
                "flat" => ToolMode::Flat,
                other => {
                    return Err(anyhow::anyhow!(
                        "invalid YARR_MCP_TOOL_MODE {:?}: must be \"codemode\" or \"flat\"",
                        other
                    ));
                }
            };
        }

        load_services_from_env(&mut config.yarr)?;
        if let Some(readonly) = env_value("YARR_FLEET_READONLY") {
            apply_readonly_services(&mut config.yarr.services, &readonly)?;
        }
        validate_service_identities(&config.yarr.services)?;

        if config.mcp.static_token_scopes.is_empty() {
            anyhow::bail!("YARR_MCP_STATIC_TOKEN_SCOPES must contain at least one scope");
        }
        for scope in &config.mcp.static_token_scopes {
            if scope != crate::actions::READ_SCOPE && scope != crate::actions::WRITE_SCOPE {
                anyhow::bail!(
                    "invalid YARR_MCP_STATIC_TOKEN_SCOPES entry {scope:?}: expected yarr:read or yarr:write"
                );
            }
        }
        config.mcp.static_token_scopes.sort();
        config.mcp.static_token_scopes.dedup();

        if config.mcp.codemode_max_concurrent == 0 {
            anyhow::bail!("YARR_MCP_CODEMODE_MAX_CONCURRENT must be at least 1");
        }
        if config.mcp.codemode_queue_timeout_ms == 0 || config.mcp.codemode_timeout_secs == 0 {
            anyhow::bail!("Code Mode queue and execution timeouts must be greater than zero");
        }
        if config.mcp.destructive_fanout_max == 0 {
            anyhow::bail!("YARR_MCP_DESTRUCTIVE_FANOUT_MAX must be at least 1");
        }

        Ok(config)
    }
}

pub fn config_candidate_paths() -> Vec<std::path::PathBuf> {
    let mut paths = vec![];
    if let Some(path) = std::env::var_os("YARR_CONFIG") {
        paths.push(std::path::PathBuf::from(path));
    }
    if let Some(data_dir) = std::env::var_os("YARR_HOME") {
        paths.push(std::path::PathBuf::from(data_dir).join("config.toml"));
    } else if let Some(data_dir) = std::env::var_os("RUSTARR_HOME") {
        paths.push(std::path::PathBuf::from(data_dir).join("config.toml"));
    }
    if let Some(home) = std::env::var_os("HOME") {
        let home = std::path::PathBuf::from(home);
        paths.push(home.join(SERVICE_HOME_DIRNAME).join("config.toml"));
        paths.push(home.join(".rustarr").join("config.toml"));
    }
    paths
}

#[cfg(test)]
#[path = "config_tests.rs"]
mod tests;
