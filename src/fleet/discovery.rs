//! CLI-only Plex account discovery models.
//!
//! Deliberately independent of service dispatch: normal server, MCP, and Code
//! Mode paths never call plex.tv. Discovery produces an explicit, non-secret
//! [`PlexDiscoveryReport`]; the app layer renders it into an operator-owned
//! export file (see [`render_export`]) that the operator merges into standard
//! configuration. No fleet file, no YAML, and no inventory is persisted by
//! default.

use std::{collections::BTreeMap, path::PathBuf};

use anyhow::{Result, anyhow, bail};
use serde::Serialize;

/// Default plex.tv resources endpoint. Tests point the app layer at loopback.
pub const PLEX_RESOURCES_URL: &str = "https://plex.tv/api/resources";
pub(crate) const PLEX_PRODUCT: &str = "yarr";
pub(crate) const PLEX_CLIENT_IDENTIFIER: &str = "yarr-plex-discovery";

/// First line of every generated export; also the overwrite guard: the app
/// layer refuses to replace a file that does not carry it.
pub const EXPORT_MARKER: &str = "# yarr discover plex export";

#[derive(Debug, Clone)]
pub struct PlexDiscoveryOptions {
    /// Environment variable (name only) holding the Plex account token.
    pub token_env: String,
    /// Operator-chosen export destination. `None` prints the redacted report
    /// only — discovery never writes anything on its own.
    pub out: Option<PathBuf>,
    /// Include servers shared with the account (owned-only by default).
    pub include_shared: bool,
    /// Compare-only: report drift but write nothing.
    pub diff: bool,
    /// Override for the plex.tv resources endpoint. `None` uses
    /// [`PLEX_RESOURCES_URL`]; loopback HTTP is accepted for tests.
    pub resources_url: Option<reqwest::Url>,
}

#[derive(Clone, PartialEq, Eq)]
pub struct PlexResource {
    pub name: String,
    pub client_identifier: String,
    pub owned: bool,
    pub connections: Vec<PlexConnection>,
    access_token: String,
}

impl std::fmt::Debug for PlexResource {
    /// The account/server access token is never rendered.
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("PlexResource")
            .field("name", &self.name)
            .field("client_identifier", &self.client_identifier)
            .field("owned", &self.owned)
            .field("connections", &self.connections)
            .field("access_token", &"<redacted>")
            .finish()
    }
}

impl std::fmt::Debug for DiscoveredPlex {
    /// The server access token is never rendered.
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("DiscoveredPlex")
            .field("name", &self.name)
            .field("client_identifier", &self.client_identifier)
            .field("base_url", &self.base_url)
            .field("token_env", &self.token_env)
            .field("relay_only", &self.relay_only)
            .field("access_token", &"<redacted>")
            .finish()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlexConnection {
    pub uri: String,
    pub local: bool,
    pub relay: bool,
    pub protocol: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SelectedConnection {
    pub url: String,
    pub relay_only: bool,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct PlexDiscoveryReport {
    pub resources: Vec<DiscoveredPlex>,
    pub drift: Vec<Drift>,
}

impl PlexDiscoveryReport {
    pub fn empty() -> Self {
        Self {
            resources: Vec::new(),
            drift: Vec::new(),
        }
    }
}

/// One discovered Plex server as it will be exported. `Debug` deliberately
/// omits the token (private field), and serialization skips it too.
#[derive(Clone, Serialize, PartialEq, Eq)]
pub struct DiscoveredPlex {
    pub name: String,
    pub client_identifier: String,
    pub base_url: String,
    pub token_env: String,
    pub relay_only: bool,
    #[serde(skip_serializing)]
    access_token: String,
}

/// A configured Plex-kind service, used for drift comparison. Only identity
/// fields the config actually carries participate; client identifiers live in
/// the discovery report only.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct KnownPlex {
    pub name: String,
    pub base_url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Drift {
    Added {
        name: String,
    },
    Removed {
        name: String,
    },
    UrlChanged {
        name: String,
        from: String,
        to: String,
    },
}

/// Strict plex.tv `/api/resources` parsing: every server field is required and
/// malformed entries fail with the offending field named.
pub fn parse_plex_resources(body: &str) -> Result<Vec<PlexResource>> {
    let root: serde_json::Value =
        serde_json::from_str(body).map_err(|_| anyhow!("Plex resources response is not JSON"))?;
    let devices = root
        .pointer("/MediaContainer/Device")
        .and_then(serde_json::Value::as_array)
        .ok_or_else(|| {
            anyhow!("Plex resources response must contain MediaContainer.Device array")
        })?;
    devices.iter().filter_map(parse_device).collect()
}

fn parse_device(value: &serde_json::Value) -> Option<Result<PlexResource>> {
    let object = value.as_object()?;
    let provides = object.get("provides")?.as_str()?;
    if !provides
        .split(',')
        .map(str::trim)
        .any(|kind| kind == "server")
    {
        return None;
    }
    Some((|| {
        let field = |name: &str| {
            object
                .get(name)
                .and_then(serde_json::Value::as_str)
                .filter(|value| !value.is_empty())
                .ok_or_else(|| anyhow!("Plex server resource is missing {name}"))
        };
        let connections = object
            .get("connections")
            .and_then(serde_json::Value::as_array)
            .ok_or_else(|| anyhow!("Plex server resource is missing connections array"))?
            .iter()
            .filter_map(parse_connection)
            .collect();
        Ok(PlexResource {
            name: field("name")?.to_owned(),
            client_identifier: field("clientIdentifier")?.to_owned(),
            owned: object
                .get("owned")
                .and_then(serde_json::Value::as_bool)
                .unwrap_or(false),
            access_token: field("accessToken")?.to_owned(),
            connections,
        })
    })())
}

fn parse_connection(value: &serde_json::Value) -> Option<PlexConnection> {
    let object = value.as_object()?;
    Some(PlexConnection {
        uri: object.get("uri")?.as_str()?.to_owned(),
        local: object
            .get("local")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false),
        relay: object
            .get("relay")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(false),
        protocol: object
            .get("protocol")
            .and_then(serde_json::Value::as_str)
            .unwrap_or_default()
            .to_owned(),
    })
}

/// Connection preference: local first, then non-relay HTTPS, then relay.
/// Credential-bearing URIs are rejected (they would leak into an export).
pub fn select_connection(resource: &PlexResource) -> Option<SelectedConnection> {
    resource
        .connections
        .iter()
        .filter(|connection| connection.local)
        .chain(resource.connections.iter().filter(|connection| {
            !connection.relay && connection.protocol.eq_ignore_ascii_case("https")
        }))
        .chain(
            resource
                .connections
                .iter()
                .filter(|connection| connection.relay),
        )
        .find_map(|connection| {
            public_url(&connection.uri).map(|url| SelectedConnection {
                url,
                relay_only: connection.relay,
            })
        })
}

fn public_url(value: &str) -> Option<String> {
    let mut url = url::Url::parse(value).ok()?;
    if url.username() != "" || url.password().is_some() {
        return None;
    }
    url.set_query(None);
    url.set_fragment(None);
    Some(url.to_string().trim_end_matches('/').to_owned())
}

/// Build the report from parsed resources: filter owned/shared, select one
/// connection per server, derive stable unique names, and sort by name.
pub fn build_report(
    resources: &[PlexResource],
    include_shared: bool,
) -> Result<PlexDiscoveryReport> {
    let eligible = resources
        .iter()
        .filter(|resource| include_shared || resource.owned)
        .filter_map(|resource| select_connection(resource).map(|connection| (resource, connection)))
        .collect::<Vec<_>>();
    let names = configured_names(
        &eligible
            .iter()
            .map(|(resource, _)| (*resource).clone())
            .collect::<Vec<_>>(),
    );
    let mut discovered = eligible
        .into_iter()
        .zip(names)
        .map(|((resource, selected), name)| DiscoveredPlex {
            token_env: token_env_for(&name),
            name,
            client_identifier: resource.client_identifier.clone(),
            base_url: selected.url,
            relay_only: selected.relay_only,
            access_token: resource.access_token.clone(),
        })
        .collect::<Vec<_>>();
    discovered.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(PlexDiscoveryReport {
        resources: discovered,
        drift: Vec::new(),
    })
}

fn configured_names(resources: &[PlexResource]) -> Vec<String> {
    let slugs = resources
        .iter()
        .map(|resource| slug(&resource.name))
        .collect::<Vec<_>>();
    let counts = slugs
        .iter()
        .fold(BTreeMap::<String, usize>::new(), |mut counts, slug| {
            *counts.entry(slug.clone()).or_default() += 1;
            counts
        });
    resources
        .iter()
        .zip(slugs)
        .map(|(resource, slug)| {
            if counts[&slug] == 1 {
                format!("plex_{slug}")
            } else {
                format!(
                    "plex_{slug}_{:06x}",
                    stable_hash(&resource.client_identifier) & 0xff_ffff
                )
            }
        })
        .collect()
}

fn slug(value: &str) -> String {
    let slug = value
        .chars()
        .map(|char| {
            if char.is_ascii_alphanumeric() {
                char.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect::<String>();
    let slug = slug.trim_matches('_');
    if slug.is_empty() {
        "server".into()
    } else {
        slug.split('_')
            .filter(|part| !part.is_empty())
            .collect::<Vec<_>>()
            .join("_")
    }
}

fn stable_hash(value: &str) -> u64 {
    value.bytes().fold(0xcbf29ce484222325_u64, |hash, byte| {
        (hash ^ u64::from(byte)).wrapping_mul(0x100000001b3)
    })
}

fn token_env_for(name: &str) -> String {
    format!("YARR_{}_TOKEN", name.to_ascii_uppercase())
}

/// Validate an operator-supplied `--token-env` NAME: strict env-var shape so a
/// typo can never smuggle flag text into an environment lookup.
pub fn validate_token_env_name(name: &str) -> Result<()> {
    let mut chars = name.chars();
    let first_ok = chars
        .next()
        .is_some_and(|char| char.is_ascii_alphabetic() || char == '_');
    let rest_ok = chars.all(|char| char.is_ascii_alphanumeric() || char == '_');
    if name.is_empty() || !first_ok || !rest_ok {
        bail!(
            "invalid token_env {name:?}: expected an environment variable name like YARR_PLEX_TOKEN"
        );
    }
    Ok(())
}

/// Drift between configured Plex-kind services and a fresh discovery report,
/// matched by service name.
pub fn classify_drift_against_configured(
    configured: &[KnownPlex],
    current: &PlexDiscoveryReport,
) -> Vec<Drift> {
    let old = configured
        .iter()
        .map(|known| (known.name.as_str(), known))
        .collect::<BTreeMap<_, _>>();
    let new = current
        .resources
        .iter()
        .map(|item| (item.name.as_str(), item))
        .collect::<BTreeMap<_, _>>();
    let mut changes = Vec::new();
    for (name, known) in &old {
        match new.get(name) {
            None => changes.push(Drift::Removed {
                name: (*name).to_owned(),
            }),
            Some(discovered) => {
                if known.base_url != discovered.base_url {
                    changes.push(Drift::UrlChanged {
                        name: (*name).to_owned(),
                        from: known.base_url.clone(),
                        to: discovered.base_url.clone(),
                    });
                }
            }
        }
    }
    for name in new.keys() {
        if !old.contains_key(*name) {
            changes.push(Drift::Added {
                name: (*name).to_owned(),
            });
        }
    }
    changes
}

/// Render the operator-owned export: a marker header, per-server context
/// comments, and dotenv assignments (URL, KIND, TOKEN) ready to merge into the
/// standard environment or referenced from `config.toml` via `token_env`.
pub fn render_export(report: &PlexDiscoveryReport) -> Result<String> {
    let mut out = String::new();
    out.push_str(EXPORT_MARKER);
    out.push_str("\n# Generated by `yarr discover plex`. Review before merging into your\n");
    out.push_str("# environment or config file; this file is overwritten only by yarr and\n");
    out.push_str("# only when requested with --out.\n");
    out.push_str(&format!(
        "# Servers: {} ({} drift)\n",
        report.resources.len(),
        report.drift.len()
    ));
    for resource in &report.resources {
        out.push_str(&format!(
            "#\n# {} — client identifier: {} — relay_only: {}\n",
            resource.name, resource.client_identifier, resource.relay_only
        ));
        out.push_str(&dotenv_assignment(
            &format!("{}_URL", prefix_for(&resource.name)),
            &resource.base_url,
        )?);
        out.push('\n');
        out.push_str(&dotenv_assignment(
            &format!("{}_KIND", prefix_for(&resource.name)),
            "plex",
        )?);
        out.push('\n');
        out.push_str(&dotenv_assignment(
            &resource.token_env,
            &resource.access_token,
        )?);
        out.push('\n');
    }
    Ok(out)
}

fn prefix_for(name: &str) -> String {
    format!("YARR_{}", name.to_ascii_uppercase())
}

pub(crate) fn dotenv_assignment(key: &str, value: &str) -> Result<String> {
    Ok(format!("{key}={}", dotenv_value(value)?))
}

pub(crate) fn dotenv_value(value: &str) -> Result<String> {
    if value.chars().any(|c| matches!(c, '\n' | '\r' | '\0')) {
        bail!("dotenv values cannot contain newlines or NUL bytes");
    }
    if value.chars().all(|c| {
        c.is_ascii_alphanumeric()
            || matches!(c, '_' | '-' | '.' | '/' | ':' | '@' | '%' | '+' | '=' | ',')
    }) {
        return Ok(value.to_owned());
    }
    Ok(format!(
        "\"{}\"",
        value.replace('\\', "\\\\").replace('"', "\\\"")
    ))
}

#[cfg(test)]
#[path = "discovery_tests.rs"]
mod tests;
