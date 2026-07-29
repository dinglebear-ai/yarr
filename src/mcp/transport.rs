//! MCP transport configuration and allowed-host/origin helpers.
//!
//! Separated from `rmcp_server.rs` to keep the `ServerHandler` impl focused on
//! protocol concerns. Everything in this file is about wiring the HTTP transport
//! layer: how connections are accepted and which origins are allowed.

#[cfg(test)]
#[path = "transport_tests.rs"]
mod tests;

use std::net::Ipv6Addr;

use rmcp::transport::streamable_http_server::{
    StreamableHttpServerConfig, StreamableHttpService, session::local::LocalSessionManager,
};

use crate::config::McpConfig;

use super::rmcp_server::{YarrRmcpServer, rmcp_server as make_server};

// ── Transport builders ────────────────────────────────────────────────────────

pub fn streamable_http_config(config: &McpConfig) -> StreamableHttpServerConfig {
    StreamableHttpServerConfig::default()
        .with_legacy_session_mode(false)
        .with_json_response(true)
        .with_allowed_hosts(allowed_hosts(config))
        .with_allowed_origins(allowed_origins(config))
}

pub fn streamable_http_service(
    state: crate::server::AppState,
    config: StreamableHttpServerConfig,
) -> StreamableHttpService<YarrRmcpServer, LocalSessionManager> {
    StreamableHttpService::new(
        move || Ok(make_server(state.clone())),
        Default::default(),
        config,
    )
}

// ── Allowed hosts / origins ───────────────────────────────────────────────────

pub fn allowed_hosts(config: &McpConfig) -> Vec<String> {
    let mut hosts = vec!["localhost".to_string(), "127.0.0.1".to_string()];
    push_host_variants(&mut hosts, &config.host, config.port);
    push_host_variants(&mut hosts, "localhost", config.port);
    push_host_variants(&mut hosts, "127.0.0.1", config.port);
    push_host_variants(&mut hosts, "::1", config.port);
    for host in &config.allowed_hosts {
        push_host_variants(&mut hosts, host, config.port);
    }
    if let Some(public_url) = config.auth.public_url.as_deref() {
        push_public_url_hosts(&mut hosts, public_url, config.port);
    }
    hosts.sort();
    hosts.dedup();
    hosts
}

pub fn allowed_origins(config: &McpConfig) -> Vec<String> {
    let mut origins = vec![
        format!("http://localhost:{}", config.port),
        format!("http://127.0.0.1:{}", config.port),
    ];
    for origin in &config.allowed_origins {
        push_configured_origin(&mut origins, origin);
    }
    if let Some(public_url) = config.auth.public_url.as_deref()
        && let Some(origin) = extract_origin(public_url)
    {
        origins.push(origin);
    }
    origins.sort();
    origins.dedup();
    origins
}

fn push_configured_origin(origins: &mut Vec<String>, origin: &str) {
    let Some(origin) = extract_configured_origin_with_label(origin, "YARR_MCP_ALLOWED_ORIGINS")
    else {
        return;
    };
    origins.push(origin);
}

fn push_host_variants(hosts: &mut Vec<String>, host: &str, port: u16) {
    let host = host.trim();
    if host.is_empty() {
        return;
    }
    hosts.push(host.to_string());
    if host.starts_with('[') && host.contains("]:") {
        return;
    }
    if let Some(inner) = host.strip_prefix('[').and_then(|v| v.strip_suffix(']')) {
        if !inner.is_empty() {
            hosts.push(format!("[{inner}]:{port}"));
        }
    } else if host.parse::<Ipv6Addr>().is_ok() {
        hosts.push(format!("[{host}]"));
        hosts.push(format!("[{host}]:{port}"));
    } else if !has_port(host) {
        hosts.push(format!("{host}:{port}"));
    }
}

fn push_public_url_hosts(hosts: &mut Vec<String>, url: &str, listen_port: u16) {
    let Ok(parsed) = url::Url::parse(url) else {
        tracing::warn!(public_url = url, "YARR_MCP_PUBLIC_URL is not a valid URL");
        return;
    };
    let Some(host) = parsed.host_str() else {
        return;
    };
    if host.contains('*') {
        tracing::warn!(host, "YARR_MCP_PUBLIC_URL host contains wildcard; skipping");
        return;
    }
    let explicit_port = parsed.port();
    let scheme_default = match parsed.scheme() {
        "https" => Some(443u16),
        "http" => Some(80u16),
        _ => None,
    };
    if let Some(p) = explicit_port {
        push_host_variants(hosts, host, p);
        let with_port = format!("{host}:{p}");
        if !hosts.contains(&with_port) {
            hosts.push(with_port);
        }
    } else if let Some(default_port) = scheme_default {
        let bare = host.to_string();
        if !hosts.contains(&bare) {
            hosts.push(bare);
        }
        let with_default = format!("{host}:{default_port}");
        if !hosts.contains(&with_default) {
            hosts.push(with_default);
        }
    } else {
        push_host_variants(hosts, host, listen_port);
    }
}

fn has_port(host: &str) -> bool {
    host.rsplit_once(':')
        .and_then(|(_, p)| p.parse::<u16>().ok())
        .is_some()
}

fn extract_origin(url: &str) -> Option<String> {
    extract_origin_with_label(url, "YARR_MCP_PUBLIC_URL")
}

fn extract_origin_with_label(url: &str, label: &'static str) -> Option<String> {
    let parsed = url::Url::parse(url)
        .map_err(|e| tracing::warn!(setting = label, url, error = %e, "invalid MCP origin URL"))
        .ok()?;
    let scheme = parsed.scheme();
    let host = parsed.host()?;
    let host_text = format_origin_host(host);
    if host_text.contains('*') {
        tracing::warn!(
            setting = label,
            host = %host_text,
            "MCP origin host contains wildcard; skipping"
        );
        return None;
    }
    let default_port = match scheme {
        "http" => Some(80u16),
        "https" => Some(443u16),
        _ => {
            tracing::warn!(
                setting = label,
                scheme,
                "MCP origin URL must use http or https"
            );
            return None;
        }
    };
    let origin = match parsed.port() {
        Some(port) if default_port != Some(port) => format!("{scheme}://{host_text}:{port}"),
        _ => format!("{scheme}://{host_text}"),
    };
    Some(origin)
}

fn extract_configured_origin_with_label(url: &str, label: &'static str) -> Option<String> {
    match extract_origin_with_label(url, label) {
        Some(origin) => Some(origin),
        None => {
            let parsed = url::Url::parse(url).ok()?;
            if matches!(parsed.scheme(), "http" | "https") {
                return None;
            }
            Some(url.trim().to_string())
        }
    }
}

fn format_origin_host(host: url::Host<&str>) -> String {
    match host {
        url::Host::Domain(domain) => domain.to_string(),
        url::Host::Ipv4(addr) => addr.to_string(),
        url::Host::Ipv6(addr) => format!("[{addr}]"),
    }
}
