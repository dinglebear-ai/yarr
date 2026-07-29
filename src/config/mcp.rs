//! MCP HTTP server configuration ([`McpConfig`]) and the shared `YARR_*`
//! environment-variable parsing helpers used during [`super::Config::load`].

use serde::{Deserialize, Serialize};

use super::AuthConfig;

/// MCP HTTP server configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct McpConfig {
    /// Bind host (YARR_MCP_HOST). Default: `127.0.0.1` (loopback).
    /// Set to `0.0.0.0` to listen on all interfaces — requires auth configured.
    #[serde(default = "default_mcp_host")]
    pub host: String,
    /// Bind port (YARR_MCP_PORT). Default: `40070`.
    #[serde(default = "default_mcp_port")]
    pub port: u16,
    /// MCP server name advertised to clients (YARR_MCP_SERVER_NAME).
    #[serde(default = "default_server_name")]
    pub server_name: String,
    /// Disable auth entirely — only safe when bound to loopback (YARR_MCP_NO_AUTH).
    pub no_auth: bool,
    /// Allow unauthenticated access on non-loopback when behind a trusted reverse proxy
    /// that enforces its own auth (YARR_NOAUTH). Loaded here so it participates in
    /// typed config rather than being a raw env read at call sites.
    pub trusted_gateway: bool,
    /// Static bearer token for simple auth (YARR_MCP_TOKEN).
    pub api_token: Option<String>,
    /// Scopes granted to the static bearer token (YARR_MCP_STATIC_TOKEN_SCOPES).
    /// Defaults to read-only. Grant `yarr:write` explicitly to use the default
    /// Code Mode tool with a static token.
    #[serde(default = "default_static_token_scopes")]
    pub static_token_scopes: Vec<String>,
    /// Additional allowed Host header values (comma-separated in env).
    pub allowed_hosts: Vec<String>,
    /// Additional allowed CORS origins (comma-separated in env).
    pub allowed_origins: Vec<String>,
    /// OAuth sub-config (nested under `[mcp.auth]` in config.toml).
    pub auth: AuthConfig,
    /// Tool-registration mode (YARR_MCP_TOOL_MODE). Default: `codemode`.
    pub tool_mode: ToolMode,
    /// Maximum concurrent Code Mode runtimes (YARR_MCP_CODEMODE_MAX_CONCURRENT).
    pub codemode_max_concurrent: usize,
    /// Maximum queue wait in milliseconds before overload rejection.
    pub codemode_queue_timeout_ms: u64,
    /// Absolute Code Mode wall-clock deadline in seconds.
    pub codemode_timeout_secs: u64,
}

/// MCP tool-registration mode (YARR_MCP_TOOL_MODE).
///
/// `Codemode` (default) advertises exactly one `yarr` tool; the whole fleet is
/// reached inside a Code Mode script (`callTool`/`<service>.<verb>()`/discovery).
/// `Flat` advertises one MCP tool per configured service, action-dispatched, with
/// no Code Mode sandbox layer at all.
///
/// Flat mode exists for deployments proxied through a gateway that already
/// provides its own dynamic-discovery/Code Mode layer (e.g. Labby): in that
/// setup, `codemode` mode makes the gateway wrap a single opaque
/// `{code: string}` tool in its own sandbox, so an agent ends up writing JS
/// that itself writes JS to reach rustarr — the gateway's own search/describe
/// catalog only ever sees one tool and can't resolve real per-operation
/// parameter schemas. Flat mode gives the gateway real, individually-typed
/// tools to index instead, eliminating that nested-sandbox indirection. For a
/// standalone client with no discovery layer of its own, `codemode` mode stays
/// the better default — one tool schema instead of eleven.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ToolMode {
    #[default]
    Codemode,
    Flat,
}

impl McpConfig {
    pub fn bind_addr(&self) -> String {
        // IPv6-safe: a bare IPv6 host (e.g. `::1`) must be bracketed before the
        // `:port` suffix is appended. Already-bracketed hosts pass through.
        if self.host.contains(':') && !self.host.starts_with('[') {
            format!("[{}]:{}", self.host, self.port)
        } else {
            format!("{}:{}", self.host, self.port)
        }
    }

    /// Return true if the configured bind host resolves to a loopback address.
    ///
    /// Uses `IpAddr::is_loopback()` for numeric addresses. Accepts "localhost"
    /// as a canonical loopback hostname. Any other hostname or parse failure is
    /// treated as non-loopback — callers must not assume safety in that case.
    pub fn is_loopback(&self) -> bool {
        let host = &self.host;
        // Match "localhost" literal and numeric loopback addresses.
        // Strip bracket notation ([::1]) before parsing so IPv6 loopback works.
        host == "localhost"
            || host
                .trim_start_matches('[')
                .trim_end_matches(']')
                .parse::<std::net::IpAddr>()
                .map(|ip| ip.is_loopback())
                .unwrap_or(false)
    }
}

// ── defaults ──────────────────────────────────────────────────────────────────

fn default_mcp_host() -> String {
    // Default to loopback for safety. Operators who need external access must
    // explicitly set YARR_MCP_HOST=0.0.0.0 (and configure auth).
    "127.0.0.1".into()
}
pub(super) fn default_mcp_port() -> u16 {
    40070
}
fn default_server_name() -> String {
    "yarr".into()
}
fn default_static_token_scopes() -> Vec<String> {
    vec![crate::actions::READ_SCOPE.into()]
}

impl Default for McpConfig {
    fn default() -> Self {
        Self {
            host: default_mcp_host(),
            port: default_mcp_port(),
            server_name: default_server_name(),
            no_auth: false,
            trusted_gateway: false,
            api_token: None,
            static_token_scopes: default_static_token_scopes(),
            allowed_hosts: Vec::new(),
            allowed_origins: Vec::new(),
            auth: AuthConfig::default(),
            tool_mode: ToolMode::default(),
            codemode_max_concurrent: crate::codemode::CODEMODE_MAX_CONCURRENT,
            codemode_queue_timeout_ms: crate::codemode::CODEMODE_QUEUE_TIMEOUT.as_millis() as u64,
            codemode_timeout_secs: crate::codemode::CODEMODE_TIMEOUT.as_secs(),
        }
    }
}

// ── env helpers ───────────────────────────────────────────────────────────────

pub(super) fn env_str(key: &str, target: &mut String) {
    if let Some(v) = super::env_value(key)
        && !v.is_empty()
    {
        *target = v;
    }
}

pub(super) fn env_opt_str(key: &str, target: &mut Option<String>) {
    if let Some(v) = super::env_value(key)
        && !v.is_empty()
    {
        *target = Some(v);
    }
}

pub(super) fn env_parse<T: std::str::FromStr>(key: &str, target: &mut T) -> anyhow::Result<()> {
    if let Some(v) = super::env_value(key)
        && !v.is_empty()
    {
        *target = v
            .parse()
            .map_err(|_| anyhow::anyhow!("{key}: invalid value {v:?}"))?;
    }
    Ok(())
}

pub(super) fn env_bool(key: &str, target: &mut bool) -> anyhow::Result<()> {
    if let Some(v) = super::env_value(key) {
        match v.to_lowercase().as_str() {
            "1" | "true" | "yes" => *target = true,
            "0" | "false" | "no" => *target = false,
            other => anyhow::bail!("{key}: expected bool, got {other:?}"),
        }
    }
    Ok(())
}

pub(super) fn env_list(key: &str, target: &mut Vec<String>) {
    if let Some(v) = super::env_value(key) {
        let items: Vec<String> = v
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        if !items.is_empty() {
            *target = items;
        }
    }
}

#[cfg(test)]
#[path = "mcp_tests.rs"]
mod tests;
