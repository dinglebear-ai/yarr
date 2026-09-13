//! CLI-only Plex resource discovery.
//!
//! This module is deliberately independent of service dispatch: normal server,
//! MCP, and Code Mode paths never call plex.tv.

use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    io::Write,
    path::{Path, PathBuf},
};

use anyhow::{Context, Result, anyhow, bail};
use serde::{Deserialize, Serialize};

const PLEX_RESOURCES_URL: &str = "https://plex.tv/api/resources";
const PLEX_PRODUCT: &str = "yarr";
const PLEX_CLIENT_IDENTIFIER: &str = "yarr-plex-discovery";

#[derive(Debug, Clone)]
pub struct PlexDiscoveryOptions {
    pub token_env: String,
    pub fleet_file: PathBuf,
    pub secret_file: PathBuf,
    pub include_shared: bool,
    pub diff: bool,
}

impl PlexDiscoveryOptions {
    #[cfg(test)]
    fn for_test(fleet_file: PathBuf, secret_file: PathBuf, diff: bool) -> Self {
        Self {
            token_env: "YARR_TEST_PLEX_TOKEN".into(),
            fleet_file,
            secret_file,
            include_shared: false,
            diff,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlexResource {
    pub name: String,
    pub client_identifier: String,
    pub owned: bool,
    pub connections: Vec<PlexConnection>,
    access_token: String,
}

impl PlexResource {
    #[cfg(test)]
    fn for_test(name: &str, client_identifier: &str) -> Self {
        Self {
            name: name.into(),
            client_identifier: client_identifier.into(),
            owned: true,
            connections: vec![PlexConnection {
                uri: "https://example.invalid".into(),
                local: false,
                relay: false,
                protocol: "https".into(),
            }],
            access_token: "<redacted>".into(),
        }
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

#[derive(Debug, Clone, Serialize)]
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

#[derive(Debug, Clone, Serialize)]
pub struct DiscoveredPlex {
    pub name: String,
    pub client_identifier: String,
    pub base_url: String,
    pub token_env: String,
    pub relay_only: bool,
    #[serde(skip_serializing)]
    access_token: String,
}

pub trait PlexDiscoveryClient {
    fn fetch_resources(&self, token: &str) -> Result<String>;
}

/// Run discovery through the dedicated plex.tv transport. This synchronous
/// operator entry point is called only by `yarr discover plex`.
pub fn discover_plex(options: PlexDiscoveryOptions) -> Result<PlexDiscoveryReport> {
    discover_plex_with_client(options, &PlexTvClient)
}

pub fn discover_plex_with_client(
    options: PlexDiscoveryOptions,
    client: &dyn PlexDiscoveryClient,
) -> Result<PlexDiscoveryReport> {
    validate_env_reference(&options.token_env)?;
    let token = std::env::var(&options.token_env).with_context(|| {
        format!(
            "Plex token environment variable {} is not set",
            options.token_env
        )
    })?;
    let resources = parse_plex_resources(&client.fetch_resources(&token)?)?;
    let mut report = build_report(&resources, options.include_shared)?;
    let previous = read_existing_report(&options.fleet_file)?;
    report.drift = write_or_diff(&options, &previous, &report)?;
    Ok(report)
}

pub struct PlexTvClient;
impl PlexDiscoveryClient for PlexTvClient {
    fn fetch_resources(&self, token: &str) -> Result<String> {
        let token = token.to_owned();
        std::thread::spawn(move || -> Result<String> {
            let runtime = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()?;
            runtime.block_on(async move {
                let response = reqwest::Client::new()
                    .get(PLEX_RESOURCES_URL)
                    .header("X-Plex-Product", PLEX_PRODUCT)
                    .header("X-Plex-Client-Identifier", PLEX_CLIENT_IDENTIFIER)
                    .header("X-Plex-Token", token)
                    .send()
                    .await
                    .map_err(|_| anyhow!("Plex discovery request failed"))?
                    .error_for_status()
                    .map_err(|_| anyhow!("Plex discovery request was rejected"))?;
                response
                    .text()
                    .await
                    .map_err(|_| anyhow!("Plex discovery response could not be read"))
            })
        })
        .join()
        .map_err(|_| anyhow!("Plex discovery transport thread failed"))?
    }
}

pub fn parse_plex_resources(body: &str) -> Result<Vec<PlexResource>> {
    let root: serde_json::Value =
        serde_json::from_str(body).context("Plex resources response is not JSON")?;
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

pub fn select_connection(resource: &PlexResource) -> Option<SelectedConnection> {
    let connection = resource
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
        })?;
    Some(connection)
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

fn build_report(resources: &[PlexResource], include_shared: bool) -> Result<PlexDiscoveryReport> {
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
fn validate_env_reference(name: &str) -> Result<()> {
    crate::validate_env_reference(name).map_err(|error| anyhow!("invalid token_env: {error}"))
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
    Renamed {
        client_identifier: String,
        from: String,
        to: String,
    },
    UrlChanged {
        name: String,
        from: String,
        to: String,
    },
    RelayStateChanged {
        name: String,
        from: bool,
        to: bool,
    },
}

fn classify_drift(previous: &PlexDiscoveryReport, current: &PlexDiscoveryReport) -> Vec<Drift> {
    let old_by_id = previous
        .resources
        .iter()
        .map(|item| (item.client_identifier.as_str(), item))
        .collect::<BTreeMap<_, _>>();
    let new_by_id = current
        .resources
        .iter()
        .map(|item| (item.client_identifier.as_str(), item))
        .collect::<BTreeMap<_, _>>();
    let mut changes = Vec::new();
    for (id, old) in &old_by_id {
        match new_by_id.get(id) {
            None => changes.push(Drift::Removed {
                name: old.name.clone(),
            }),
            Some(new) => {
                if old.name != new.name {
                    changes.push(Drift::Renamed {
                        client_identifier: (*id).into(),
                        from: old.name.clone(),
                        to: new.name.clone(),
                    });
                }
                if old.base_url != new.base_url {
                    changes.push(Drift::UrlChanged {
                        name: new.name.clone(),
                        from: old.base_url.clone(),
                        to: new.base_url.clone(),
                    });
                }
                if old.relay_only != new.relay_only {
                    changes.push(Drift::RelayStateChanged {
                        name: new.name.clone(),
                        from: old.relay_only,
                        to: new.relay_only,
                    });
                }
            }
        }
    }
    for (id, new) in &new_by_id {
        if !old_by_id.contains_key(id) {
            changes.push(Drift::Added {
                name: new.name.clone(),
            });
        }
    }
    changes
}

fn write_or_diff(
    options: &PlexDiscoveryOptions,
    previous: &PlexDiscoveryReport,
    report: &PlexDiscoveryReport,
) -> Result<Vec<Drift>> {
    let drift = classify_drift(previous, report);
    if !options.diff {
        write_discovery_outputs(&options.fleet_file, &options.secret_file, report)?;
    }
    Ok(drift)
}

#[derive(Serialize)]
struct PublicFleetFile {
    services: Vec<PublicFleetService>,
}
#[derive(Serialize)]
struct PublicFleetService {
    name: String,
    kind: String,
    client_identifier: String,
    base_url: String,
    token_env: String,
    relay_only: bool,
}

#[derive(Deserialize)]
struct ExistingFleetFile {
    services: Vec<ExistingFleetService>,
}

#[derive(Deserialize)]
struct ExistingFleetService {
    name: Option<String>,
    kind: Option<String>,
    client_identifier: Option<String>,
    base_url: Option<String>,
    token_env: Option<String>,
    relay_only: Option<bool>,
}

fn serialize_public_fleet(fleet_file: &Path, public: &PublicFleetFile) -> Result<String> {
    match fleet_file
        .extension()
        .and_then(|extension| extension.to_str())
    {
        Some("yaml" | "yml") => Ok(serde_yaml_ng::to_string(public)?),
        Some("toml") => Ok(toml::to_string_pretty(public)?),
        _ => bail!(
            "fleet file {} must use a .yaml, .yml, or .toml extension",
            fleet_file.display()
        ),
    }
}

fn write_discovery_outputs(
    fleet_file: &Path,
    secret_file: &Path,
    report: &PlexDiscoveryReport,
) -> Result<()> {
    let public = serialize_public_fleet(
        fleet_file,
        &PublicFleetFile {
            services: report
                .resources
                .iter()
                .map(|item| PublicFleetService {
                    name: item.name.clone(),
                    kind: "plex".into(),
                    client_identifier: item.client_identifier.clone(),
                    base_url: item.base_url.clone(),
                    token_env: item.token_env.clone(),
                    relay_only: item.relay_only,
                })
                .collect(),
        },
    )?;
    let secret = report
        .resources
        .iter()
        .map(|item| dotenv_assignment(&item.token_env, &item.access_token))
        .collect::<Result<Vec<_>>>()?
        .join("\n")
        + "\n";
    atomic_write(fleet_file, public.as_bytes(), false)?;
    atomic_write(secret_file, secret.as_bytes(), true)
}

fn dotenv_assignment(key: &str, value: &str) -> Result<String> {
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
        return Ok(value.to_owned());
    }
    Ok(format!(
        "\"{}\"",
        value.replace('\\', "\\\\").replace('"', "\\\"")
    ))
}

fn atomic_write(path: &Path, contents: &[u8], secret: bool) -> Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| anyhow!("output path has no parent"))?;
    fs::create_dir_all(parent)?;
    let mut file = tempfile::NamedTempFile::new_in(parent)?;
    #[cfg(unix)]
    if secret {
        use std::os::unix::fs::PermissionsExt;
        file.as_file_mut()
            .set_permissions(fs::Permissions::from_mode(0o600))?;
    }
    file.as_file_mut().write_all(contents)?;
    file.as_file_mut().sync_all()?;
    file.persist(path).map_err(|error| error.error)?;
    Ok(())
}
fn read_existing_report(path: &Path) -> Result<PlexDiscoveryReport> {
    if !path.exists() {
        return Ok(PlexDiscoveryReport::empty());
    }
    let contents = fs::read_to_string(path)?;
    let parsed: ExistingFleetFile = match path.extension().and_then(|extension| extension.to_str())
    {
        Some("yaml" | "yml") => {
            serde_yaml_ng::from_str(&contents).context("existing fleet file is not YAML")?
        }
        Some("toml") => toml::from_str(&contents).context("existing fleet file is not TOML")?,
        _ => bail!(
            "fleet file {} must use a .yaml, .yml, or .toml extension",
            path.display()
        ),
    };
    let mut seen = BTreeSet::new();
    let mut resources = Vec::new();
    for item in parsed.services {
        if item.kind.as_deref() != Some("plex") {
            continue;
        }
        let name = item
            .name
            .ok_or_else(|| anyhow!("Plex fleet service missing name"))?;
        if !seen.insert(name.clone()) {
            bail!("duplicate Plex fleet service {name}");
        }
        resources.push(DiscoveredPlex {
            client_identifier: item
                .client_identifier
                .ok_or_else(|| anyhow!("Plex fleet service missing client_identifier"))?,
            base_url: item
                .base_url
                .ok_or_else(|| anyhow!("Plex fleet service missing base_url"))?,
            token_env: item
                .token_env
                .ok_or_else(|| anyhow!("Plex fleet service missing token_env"))?,
            name,
            relay_only: item
                .relay_only
                .ok_or_else(|| anyhow!("Plex fleet service missing relay_only boolean"))?,
            access_token: String::new(),
        });
    }
    Ok(PlexDiscoveryReport {
        resources,
        drift: Vec::new(),
    })
}

#[cfg(test)]
#[path = "discovery_tests.rs"]
mod tests;
