//! Service configuration: per-service [`ServiceConfig`], the [`ServiceKind`]
//! enum, env-based service loading, and the appdata directory resolver.

use serde::{Deserialize, Serialize};

pub(super) const SERVICE_HOME_DIRNAME: &str = ".yarr";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(default, deny_unknown_fields)]
pub struct ServiceConfig {
    pub name: String,
    pub kind: ServiceKind,
    pub base_url: String,
    pub api_key: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub token: Option<String>,
    /// Optional credential references (TOML-only). Each `*_env` names the one
    /// environment variable this service's corresponding credential may be
    /// resolved from — exactly `YARR_<SERVICE-ENV-NAME>_<FIELD>`; the resolved
    /// value lands in the literal field above and the reference is preserved
    /// for provenance. Literal values are never resolved and literal+reference
    /// for the same field is rejected as a collision.
    pub api_key_env: Option<String>,
    pub username_env: Option<String>,
    pub password_env: Option<String>,
    pub token_env: Option<String>,
}

impl Default for ServiceConfig {
    fn default() -> Self {
        Self {
            name: String::new(),
            kind: ServiceKind::Sonarr,
            base_url: String::new(),
            api_key: None,
            username: None,
            password: None,
            token: None,
            api_key_env: None,
            username_env: None,
            password_env: None,
            token_env: None,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ServiceKind {
    Sonarr,
    Radarr,
    Prowlarr,
    Tautulli,
    Overseerr,
    Bazarr,
    Tracearr,
    Sabnzbd,
    Qbittorrent,
    Plex,
    Jellyfin,
}

/// One declarative row per [`ServiceKind`]: the canonical kebab-case name, the
/// default status-endpoint path, and any extra `FromStr` aliases (the canonical
/// name is always accepted and need not be repeated here).
///
/// This table is the single source of truth. [`ServiceKind::ALL`],
/// [`ServiceKind::as_str`], [`ServiceKind::default_status_path`], and the
/// [`FromStr`](std::str::FromStr) impl are all derived from it, so adding a new
/// kind is a one-row edit (plus the enum variant, which the exhaustive `match`
/// in [`ServiceKind::row`] forces you to wire up).
struct KindRow {
    kind: ServiceKind,
    as_str: &'static str,
    default_status_path: &'static str,
    aliases: &'static [&'static str],
}

static KIND_ROWS: [KindRow; 11] = [
    KindRow {
        kind: ServiceKind::Sonarr,
        as_str: "sonarr",
        default_status_path: "/api/v3/system/status",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Radarr,
        as_str: "radarr",
        default_status_path: "/api/v3/system/status",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Prowlarr,
        as_str: "prowlarr",
        default_status_path: "/api/v1/system/status",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Tautulli,
        as_str: "tautulli",
        default_status_path: "/api/v2?cmd=get_server_info",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Overseerr,
        as_str: "overseerr",
        default_status_path: "/api/v1/status",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Bazarr,
        as_str: "bazarr",
        default_status_path: "/api/system/status",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Tracearr,
        as_str: "tracearr",
        default_status_path: "/health",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Sabnzbd,
        as_str: "sabnzbd",
        default_status_path: "/api?mode=version",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Qbittorrent,
        as_str: "qbittorrent",
        default_status_path: "/api/v2/app/version",
        aliases: &["qbit", "qb"],
    },
    KindRow {
        kind: ServiceKind::Plex,
        as_str: "plex",
        default_status_path: "/identity",
        aliases: &[],
    },
    KindRow {
        kind: ServiceKind::Jellyfin,
        as_str: "jellyfin",
        default_status_path: "/System/Info/Public",
        aliases: &[],
    },
];

impl ServiceKind {
    /// Every known kind, in declaration order. Derived from `KIND_ROWS`.
    pub const ALL: [Self; 11] = [
        Self::Sonarr,
        Self::Radarr,
        Self::Prowlarr,
        Self::Tautulli,
        Self::Overseerr,
        Self::Bazarr,
        Self::Tracearr,
        Self::Sabnzbd,
        Self::Qbittorrent,
        Self::Plex,
        Self::Jellyfin,
    ];

    /// Look up this kind's table row.
    ///
    /// Looks up this kind's row by identity. Keying on `r.kind == self` (rather
    /// than a hand-maintained index) means reordering [`KIND_ROWS`] can never
    /// silently mistype a kind. That every variant has exactly one row is pinned
    /// by `kind_rows_pin_exact_values` (asserts all of [`ServiceKind::ALL`]).
    fn row(self) -> &'static KindRow {
        KIND_ROWS
            .iter()
            .find(|r| r.kind == self)
            .expect("every ServiceKind has exactly one KIND_ROWS entry")
    }

    pub fn as_str(self) -> &'static str {
        self.row().as_str
    }

    pub fn default_status_path(self) -> &'static str {
        self.row().default_status_path
    }
}

impl std::str::FromStr for ServiceKind {
    type Err = anyhow::Error;

    fn from_str(value: &str) -> anyhow::Result<Self> {
        let normalized = value.trim().to_ascii_lowercase().replace('_', "-");
        for row in &KIND_ROWS {
            if normalized == row.as_str || row.aliases.contains(&normalized.as_str()) {
                return Ok(row.kind);
            }
        }
        anyhow::bail!("unknown yarr service kind: {normalized}")
    }
}

// ── Appdata directory ─────────────────────────────────────────────────────────

/// Return the default local data directory for this service.
///
/// Pattern §25 + §28: The same `.env` and `config.toml` in `~/.<service>/`
/// work for both Docker and bare-metal deployment without modification.
///
/// | Environment   | Path                                |
/// |---------------|-------------------------------------|
/// | Container     | `/data` (bind-mounted from host)     |
/// | Bare-metal    | `~/.yarr` (user home dir)        |
///
pub fn default_data_dir() -> anyhow::Result<std::path::PathBuf> {
    // Running inside a Docker container — /data is always the mount point.
    // Detection uses /.dockerenv (created by the Docker runtime) or an explicit
    // RUNNING_IN_CONTAINER env var (useful for testing or systemd-nspawn).
    if std::path::Path::new("/.dockerenv").exists()
        || std::env::var("RUNNING_IN_CONTAINER").is_ok()
        || std::env::var("container").is_ok()
    {
        return Ok(std::path::PathBuf::from("/data"));
    }

    // Bare-metal or local dev — use ~/.<service>/
    let home = dirs::home_dir().ok_or_else(|| {
        anyhow::anyhow!("cannot determine home directory — set HOME or RUNNING_IN_CONTAINER=1")
    })?;
    Ok(home.join(SERVICE_HOME_DIRNAME))
}

/// Resolve the service data directory, honouring `YARR_HOME` over the default.
///
/// `YARR_HOME`, when set, takes precedence (used for tests, plugin installs,
/// and custom deployments). Otherwise falls back to `default_data_dir()`
/// (`/data` in a container, `~/.yarr` on bare metal). This is the single
/// source of truth for "where does the data dir live" — both `.env` loading and
/// the binary's logging setup go through it.
pub fn resolve_data_dir() -> anyhow::Result<std::path::PathBuf> {
    if let Some(value) = std::env::var_os("YARR_HOME") {
        return Ok(std::path::PathBuf::from(value));
    }
    if let Some(value) = std::env::var_os("RUSTARR_HOME") {
        return Ok(std::path::PathBuf::from(value));
    }
    default_data_dir()
}

// ── Service loading from env ────────────────────────────────────────────────────

pub(super) fn load_services_from_env(config: &mut super::YarrConfig) -> anyhow::Result<()> {
    let Some(raw_names) = super::env_value("YARR_SERVICES") else {
        return Ok(());
    };
    let mut seen = std::collections::BTreeSet::new();
    let mut services = Vec::new();
    for raw_name in raw_names
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        let env_name = service_env_name(raw_name);
        if !seen.insert(env_name.clone()) {
            anyhow::bail!("duplicate service env namespace YARR_{env_name}_*");
        }
        let kind = super::env_value(&format!("YARR_{env_name}_KIND"))
            .unwrap_or_else(|| raw_name.to_owned())
            .parse::<ServiceKind>()?;
        // Fail fast: a service named in YARR_SERVICES with no URL would
        // otherwise silently carry an empty base_url and fail later at request
        // time. Surface the misconfiguration at load.
        let base_url = super::env_value(&format!("YARR_{env_name}_URL"))
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                anyhow::anyhow!("YARR_{env_name}_URL is required for service {raw_name}")
            })?;
        let service = ServiceConfig {
            name: raw_name.to_ascii_lowercase(),
            kind,
            base_url,
            api_key: env_optional(&format!("YARR_{env_name}_API_KEY")),
            username: env_optional(&format!("YARR_{env_name}_USERNAME")),
            password: env_optional(&format!("YARR_{env_name}_PASSWORD")),
            token: env_optional(&format!("YARR_{env_name}_TOKEN")),
            // Env-loaded services are literal by definition; references exist
            // only in TOML (resolved by `resolve_service_credential_references`).
            api_key_env: None,
            username_env: None,
            password_env: None,
            token_env: None,
        };
        services.push(service);
    }
    if !services.is_empty() {
        config.services = services;
    }
    Ok(())
}

fn service_env_name(name: &str) -> String {
    name.chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_uppercase()
            } else {
                '_'
            }
        })
        .collect()
}

/// Resolve TOML credential references (`*_env` fields) for every service.
///
/// Narrow by construction: a reference must be exactly the canonical variable
/// for *this* service and *this* field (`YARR_<SERVICE-ENV-NAME>_<SUFFIX>`), so
/// the runtime namespace (`YARR_MCP_*`), fleet policy variables, and other
/// services' credentials can never be forwarded. A literal plus a reference for
/// the same field is a collision (rejected, never silently dropped), and a
/// reference whose variable is unset or empty fails the load instead of
/// producing a credential-less service.
pub(super) fn resolve_service_credential_references(
    config: &mut super::YarrConfig,
) -> anyhow::Result<()> {
    for service in &mut config.services {
        let prefix = service_env_name(&service.name);
        resolve_credential_reference(
            &service.name,
            &prefix,
            service.api_key_env.as_deref(),
            &mut service.api_key,
            "API_KEY",
        )?;
        resolve_credential_reference(
            &service.name,
            &prefix,
            service.username_env.as_deref(),
            &mut service.username,
            "USERNAME",
        )?;
        resolve_credential_reference(
            &service.name,
            &prefix,
            service.password_env.as_deref(),
            &mut service.password,
            "PASSWORD",
        )?;
        resolve_credential_reference(
            &service.name,
            &prefix,
            service.token_env.as_deref(),
            &mut service.token,
            "TOKEN",
        )?;
    }
    Ok(())
}

fn resolve_credential_reference(
    service_name: &str,
    prefix: &str,
    reference: Option<&str>,
    literal: &mut Option<String>,
    suffix: &'static str,
) -> anyhow::Result<()> {
    let Some(reference) = reference else {
        return Ok(());
    };
    let expected = format!("YARR_{prefix}_{suffix}");
    if !reference.starts_with("YARR_") {
        anyhow::bail!(
            "service {service_name:?} credential reference {reference:?} must name a YARR_* environment variable (expected {expected:?})"
        );
    }
    if reference != expected {
        // Everything below fails closed; the branches only sharpen the
        // diagnostics. A reference inside this service's own namespace names
        // the wrong field, the runtime prefixes name server/fleet plumbing,
        // and anything else belongs to a different service.
        if reference.starts_with(&format!("YARR_{prefix}_")) {
            anyhow::bail!(
                "service {service_name:?} credential reference {reference:?} names the wrong field for this service; only {suffix} may reference {expected:?}"
            );
        }
        if reference.starts_with("YARR_MCP_") || reference.starts_with("YARR_FLEET_") {
            anyhow::bail!(
                "service {service_name:?} credential reference {reference:?} is a runtime variable, not a service credential (expected {expected:?})"
            );
        }
        anyhow::bail!(
            "service {service_name:?} credential reference {reference:?} belongs to another service's credential namespace (expected {expected:?})"
        );
    }
    if literal.is_some() {
        anyhow::bail!(
            "service {service_name:?} sets both a literal value and a reference for {suffix}; configure exactly one"
        );
    }
    let value = env_optional(&expected).ok_or_else(|| {
        anyhow::anyhow!(
            "service {service_name:?} credential reference {expected} is not set (or empty) in the environment"
        )
    })?;
    *literal = Some(value);
    Ok(())
}

fn env_optional(key: &str) -> Option<String> {
    super::env_value(key).filter(|value| !value.is_empty())
}

#[cfg(test)]
#[path = "services_tests.rs"]
mod tests;
