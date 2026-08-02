//! HTTP server application state and auth policy.
//!
//! `AppState` is injected into every request handler via axum's `State` extractor.
//! `AuthPolicy` determines which auth middleware (if any) is mounted on the router.

use std::sync::Arc;

use lab_auth::AuthLayer;

use anyhow::Result;

use crate::{
    app::YarrService,
    config::{AuthMode, Config, McpConfig, ToolMode},
};

pub mod routes;

pub use routes::router;

/// Authentication policy attached to [`AppState`].
///
/// Intentionally an enum — constructing `AppState` requires an explicit choice.
/// There is no `Default` impl.
#[derive(Clone)]
pub enum AuthPolicy {
    /// No authentication. Only legal when bound to a loopback address.
    /// Scope checks are bypassed — the bind itself is the trust boundary.
    LoopbackDev,
    /// No local authentication or scope checks. The deployment must enforce
    /// both authentication and authorization before traffic reaches this server.
    TrustedGatewayUnscoped,
    /// Authentication middleware is mounted. Scope checks MUST run.
    /// - `Some(auth_state)`: OAuth mode (Google flow + JWKS issuance)
    /// - `None`: static bearer token only
    Mounted {
        auth_state: Option<Arc<lab_auth::state::AuthState>>,
    },
}

impl std::fmt::Debug for AuthPolicy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthPolicy::LoopbackDev => f.write_str("AuthPolicy::LoopbackDev"),
            AuthPolicy::TrustedGatewayUnscoped => f.write_str("AuthPolicy::TrustedGatewayUnscoped"),
            AuthPolicy::Mounted {
                auth_state: Some(_),
            } => f.write_str("AuthPolicy::Mounted { auth_state: Some(<AuthState>) }"),
            AuthPolicy::Mounted { auth_state: None } => {
                f.write_str("AuthPolicy::Mounted { auth_state: None /* bearer-only */ }")
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AuthPolicyKind {
    LoopbackDev,
    TrustedGatewayUnscoped,
    MountedBearer,
    MountedOAuth,
}

pub fn resolve_auth_policy_kind(config: &Config, trusted_gateway: bool) -> Result<AuthPolicyKind> {
    validate_public_url(config)?;

    // No early loopback return: an operator who configures explicit bearer/OAuth
    // credentials on a loopback bind gets that policy honored rather than silently
    // downgraded to LoopbackDev.
    let loopback = config.mcp.is_loopback();
    let bearer_token = config.mcp.api_token.as_deref();
    let has_token = bearer_token.is_some_and(|token| !token.is_empty());
    let has_strong_token = bearer_token.is_some_and(is_strong_bearer_token);
    let has_oauth = config.mcp.auth.mode == AuthMode::OAuth;

    if config.mcp.no_auth {
        if loopback {
            return Ok(AuthPolicyKind::LoopbackDev);
        }
        if trusted_gateway && trusted_gateway_has_provenance(config) {
            return Ok(AuthPolicyKind::TrustedGatewayUnscoped);
        }
        anyhow::bail!(
            "Refusing to bind MCP server to {} with YARR_MCP_NO_AUTH=true.\n\
             \n\
             YARR_MCP_NO_AUTH is only allowed on loopback binds. For a trusted \
             upstream proxy deployment, also set YARR_NOAUTH=true.",
            config.mcp.host
        );
    }

    // OAuth may keep a weak break-glass token or retire the static token
    // entirely. A strong, still-active static gateway token remains an
    // alternate network credential and must carry yarr:write in codemode.
    let static_token_needs_codemode_write = !has_oauth
        || (has_strong_token && !config.mcp.auth.disable_static_token_with_oauth);
    if has_token
        && static_token_needs_codemode_write
        && config.mcp.tool_mode == ToolMode::Codemode
        && !crate::actions::scopes_satisfy(
            &config.mcp.static_token_scopes,
            crate::actions::WRITE_SCOPE,
        )
    {
        anyhow::bail!(
            "Static bearer auth cannot use YARR_MCP_TOOL_MODE=codemode without yarr:write. \
             Add yarr:write to YARR_MCP_STATIC_TOKEN_SCOPES or set YARR_MCP_TOOL_MODE=flat \
             for a read-only bearer deployment."
        );
    }

    if has_oauth {
        Ok(AuthPolicyKind::MountedOAuth)
    } else if has_strong_token || (loopback && has_token) {
        // Token strength is a network-exposure guard. A loopback bind is not
        // reachable off-host, so an explicit token there is honored as-is.
        Ok(AuthPolicyKind::MountedBearer)
    } else if has_token {
        anyhow::bail!(
            "Refusing network exposure with a weak bearer token. Generate 256 bits of entropy with `openssl rand -hex 32`."
        );
    } else if loopback {
        Ok(AuthPolicyKind::LoopbackDev)
    } else if trusted_gateway && trusted_gateway_has_provenance(config) {
        Ok(AuthPolicyKind::TrustedGatewayUnscoped)
    } else if trusted_gateway {
        anyhow::bail!(
            "Refusing trusted gateway mode without explicit proxy provenance.\n\
             \n\
             Set YARR_MCP_ALLOWED_HOSTS to the externally routed hostnames \
             that the upstream gateway owns, or configure local bearer/OAuth auth."
        );
    } else {
        anyhow::bail!(
            "Refusing to bind MCP server to {} without authentication.\n\
             \n\
             Choose one of:\n\
             1. Bind to loopback:    YARR_MCP_HOST=127.0.0.1\n\
             2. Set a bearer token:  YARR_MCP_TOKEN=$(openssl rand -hex 32)\n\
             3. Enable OAuth:        YARR_MCP_AUTH_MODE=oauth (+ OAuth credentials)\n\
             4. Local no-auth dev:   YARR_MCP_HOST=127.0.0.1 YARR_MCP_NO_AUTH=true\n\
	             5. Upstream gateway:    YARR_NOAUTH=true  (if a proxy handles auth)",
            config.mcp.host
        );
    }
}

fn is_strong_bearer_token(token: &str) -> bool {
    (token.len() == 64 && token.bytes().all(|byte| byte.is_ascii_hexdigit()))
        || (token.len() == 43
            && token
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_')))
}

fn trusted_gateway_has_provenance(config: &Config) -> bool {
    !config.mcp.allowed_hosts.is_empty() || !config.mcp.allowed_origins.is_empty()
}

fn validate_public_url(config: &Config) -> Result<()> {
    let Some(public_url) = config.mcp.auth.public_url.as_deref() else {
        return Ok(());
    };
    let parsed = url::Url::parse(public_url)
        .map_err(|error| anyhow::anyhow!("YARR_MCP_PUBLIC_URL is invalid: {error}"))?;
    let Some(host) = parsed.host_str() else {
        anyhow::bail!("YARR_MCP_PUBLIC_URL must include a host");
    };
    if !parsed.username().is_empty() || parsed.password().is_some() {
        anyhow::bail!("YARR_MCP_PUBLIC_URL must not include credentials");
    }
    if parsed.query().is_some() {
        anyhow::bail!("YARR_MCP_PUBLIC_URL must not include a query string");
    }
    if parsed.fragment().is_some() {
        anyhow::bail!("YARR_MCP_PUBLIC_URL must not include a fragment");
    }
    if host.contains('*') {
        anyhow::bail!("YARR_MCP_PUBLIC_URL must not contain wildcard hosts");
    }
    let loopback_host = host.eq_ignore_ascii_case("localhost")
        || host
            .parse::<std::net::IpAddr>()
            .is_ok_and(|ip| ip.is_loopback());
    match parsed.scheme() {
        "https" => {}
        "http" if loopback_host => {}
        "http" => anyhow::bail!(
            "YARR_MCP_PUBLIC_URL must use HTTPS for non-loopback hosts; HTTP is only allowed for loopback development"
        ),
        scheme => anyhow::bail!("YARR_MCP_PUBLIC_URL must use HTTPS, not {scheme}"),
    }
    Ok(())
}

/// Shared application state injected into every request handler.
#[derive(Clone)]
pub struct AppState {
    pub config: McpConfig,
    pub auth_policy: AuthPolicy,
    pub service: YarrService,
}

/// Build an [`AuthLayer`] from an [`AuthPolicy`], or `None` when the trust
/// boundary is outside the mounted HTTP auth layer.
pub fn build_auth_layer(
    policy: &AuthPolicy,
    static_token: Option<Arc<str>>,
    static_token_scopes: Vec<String>,
    resource_url: Option<Arc<str>>,
) -> Option<AuthLayer> {
    match policy {
        AuthPolicy::LoopbackDev | AuthPolicy::TrustedGatewayUnscoped => None,
        AuthPolicy::Mounted { auth_state } => {
            if static_token.is_none() && auth_state.is_none() {
                tracing::warn!(
                    "auth layer mounted but no static_token or auth_state configured — \
                     all requests will be rejected; set YARR_MCP_TOKEN or configure OAuth"
                );
            }
            Some(
                AuthLayer::new()
                    .with_static_token(static_token)
                    .with_auth_state(auth_state.clone())
                    .with_static_token_scopes(static_token_scopes)
                    .with_resource_url(resource_url)
                    .with_allow_session_cookie(false),
            )
        }
    }
}

#[cfg(test)]
#[path = "server_tests.rs"]
mod tests;
