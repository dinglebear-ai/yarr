//! Reviewable Plex account discovery and fleet-file scaffolding.

use std::collections::{BTreeMap, BTreeSet};
use std::io::Write as _;
use std::path::Path;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::app::YarrService;
use crate::config::{ServiceKind, YarrConfig};
use crate::yarr::YarrClient;

const PLEX_RESOURCES_URL: &str = "https://plex.tv/api/v2/resources?includeHttps=1&includeRelay=1";
const MAX_DISCOVERY_RESPONSE_BYTES: usize = 4 * 1024 * 1024;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PlexResource {
    pub name: String,
    pub client_identifier: String,
    #[serde(default)]
    pub owned: bool,
    #[serde(default)]
    pub provides: String,
    pub access_token: Option<String>,
    #[serde(default)]
    pub connections: Vec<PlexConnection>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub(crate) struct PlexConnection {
    pub uri: String,
    #[serde(default)]
    pub local: bool,
    #[serde(default)]
    pub relay: bool,
    pub protocol: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub(crate) struct DiscoveredPlex {
    pub name: String,
    pub server_name: String,
    pub client_identifier: String,
    pub url: String,
    pub token_env: String,
    #[serde(skip)]
    pub access_token: String,
    pub relay_only: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TautulliIdentity {
    pub name: String,
    pub url: String,
    pub pms_identifier: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub(crate) struct FleetPairing {
    pub tautulli: String,
    pub plex: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
pub(crate) struct PairingReport {
    pub paired: Vec<FleetPairing>,
    pub unpaired_plex: Vec<String>,
    pub unpaired_tautulli: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
pub(crate) struct DriftReport {
    pub added: Vec<String>,
    pub removed: Vec<String>,
    pub renamed: Vec<String>,
    pub url_changed: Vec<String>,
}

impl DriftReport {
    pub fn has_drift(&self) -> bool {
        !self.added.is_empty()
            || !self.removed.is_empty()
            || !self.renamed.is_empty()
            || !self.url_changed.is_empty()
    }
}

/// Fetch the Plex account resource inventory, reconcile it by machine
/// identifier, and either write new scaffolding or report drift without writes.
pub async fn run_plex_discovery(
    config: &YarrConfig,
    owned_only: bool,
    token_env: &str,
    output: &Path,
    env_output: &Path,
    diff: bool,
) -> Result<(serde_json::Value, bool)> {
    let account_token = std::env::var(token_env)
        .map_err(|_| anyhow::anyhow!("discover plex: account token env {token_env} is not set"))?;
    if account_token.trim().is_empty() {
        anyhow::bail!("discover plex: account token env {token_env} is empty");
    }
    validate_env_name(token_env)?;
    let resources = fetch_resources(PLEX_RESOURCES_URL, &account_token).await?;
    let discovered = discover_resources(resources, owned_only)?;
    let tautulli = inspect_tautulli(config).await;
    let pairing = pair_tautulli(&discovered, &tautulli)?;

    if diff {
        let previous = read_discovered_fleet(output)?;
        let drift = diff_fleet(&discovered, &previous);
        let has_drift = drift.has_drift();
        return Ok((
            serde_json::json!({
                "drift": drift,
                "pairing": pairing,
                "relay_only": discovered.iter().filter(|server| server.relay_only).map(|server| &server.name).collect::<Vec<_>>(),
            }),
            has_drift,
        ));
    }

    if output.exists() || env_output.exists() {
        anyhow::bail!(
            "discover plex refuses to overwrite reviewable fleet files; {} or {} already exists (use --diff)",
            output.display(),
            env_output.display()
        );
    }
    write_discovery_files(output, env_output, &discovered, &tautulli, &pairing)?;
    Ok((
        serde_json::json!({
            "fleet_file": output,
            "env_file": env_output,
            "servers": discovered.len(),
            "pairing": pairing,
            "relay_only": discovered.iter().filter(|server| server.relay_only).map(|server| &server.name).collect::<Vec<_>>(),
            "review_required": true,
        }),
        false,
    ))
}

pub(crate) fn parse_resources(payload: &[u8]) -> Result<Vec<PlexResource>> {
    serde_json::from_slice(payload).map_err(Into::into)
}

async fn fetch_resources(endpoint: &str, token: &str) -> Result<Vec<PlexResource>> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .connect_timeout(std::time::Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::none())
        .build()?;
    let response = client
        .get(endpoint)
        .header(reqwest::header::ACCEPT, "application/json")
        .header("X-Plex-Token", token)
        .header("X-Plex-Client-Identifier", "yarr-plex-discovery-v1")
        .header("X-Plex-Product", "yarr")
        .send()
        .await
        .context("discover plex: plex.tv resource request failed")?;
    let status = response.status();
    if !status.is_success() {
        anyhow::bail!("discover plex: plex.tv returned HTTP {}", status.as_u16());
    }
    if response
        .content_length()
        .is_some_and(|length| length > MAX_DISCOVERY_RESPONSE_BYTES as u64)
    {
        anyhow::bail!("discover plex: plex.tv resource response exceeds 4 MiB");
    }
    let bytes = response.bytes().await?;
    if bytes.len() > MAX_DISCOVERY_RESPONSE_BYTES {
        anyhow::bail!("discover plex: plex.tv resource response exceeds 4 MiB");
    }
    parse_resources(&bytes).context("discover plex: unexpected plex.tv resource response shape")
}

pub(crate) fn discover_resources(
    resources: Vec<PlexResource>,
    owned_only: bool,
) -> Result<Vec<DiscoveredPlex>> {
    let mut candidates = resources
        .into_iter()
        .filter(|resource| {
            resource
                .provides
                .split(',')
                .any(|provided| provided.trim() == "server")
        })
        .filter(|resource| !owned_only || resource.owned)
        .collect::<Vec<_>>();
    candidates.sort_by(|left, right| left.client_identifier.cmp(&right.client_identifier));

    let mut slug_counts = BTreeMap::<String, usize>::new();
    for resource in &candidates {
        *slug_counts.entry(slug(&resource.name)).or_default() += 1;
    }

    let mut discovered = Vec::with_capacity(candidates.len());
    for resource in candidates {
        let base = slug(&resource.name);
        let name = if slug_counts[&base] > 1 {
            format!("plex_{base}_{}", short_hash(&resource.client_identifier))
        } else {
            format!("plex_{base}")
        };
        let (url, relay_only) = select_connection(&resource).ok_or_else(|| {
            anyhow::anyhow!(
                "Plex server {:?} ({}) has no local, direct HTTPS, or relay connection",
                resource.name,
                resource.client_identifier
            )
        })?;
        let access_token = resource.access_token.ok_or_else(|| {
            anyhow::anyhow!(
                "Plex server {:?} ({}) did not provide a per-resource accessToken",
                resource.name,
                resource.client_identifier
            )
        })?;
        discovered.push(DiscoveredPlex {
            token_env: format!("{}_TOKEN", name.to_ascii_uppercase()),
            name,
            server_name: resource.name,
            client_identifier: resource.client_identifier,
            url,
            access_token,
            relay_only,
        });
    }
    discovered.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(discovered)
}

pub(crate) fn pair_tautulli(
    plex: &[DiscoveredPlex],
    tautulli: &[TautulliIdentity],
) -> Result<PairingReport> {
    let by_identifier = plex
        .iter()
        .map(|server| (server.client_identifier.as_str(), server.name.as_str()))
        .collect::<BTreeMap<_, _>>();
    let mut paired_plex = BTreeSet::new();
    let mut paired = Vec::new();
    let mut unpaired_tautulli = Vec::new();
    for instance in tautulli {
        let Some(identifier) = instance.pms_identifier.as_deref() else {
            unpaired_tautulli.push(instance.name.clone());
            continue;
        };
        let Some(plex_name) = by_identifier.get(identifier) else {
            unpaired_tautulli.push(instance.name.clone());
            continue;
        };
        if !paired_plex.insert((*plex_name).to_owned()) {
            anyhow::bail!(
                "multiple Tautulli instances report Plex identifier {identifier}; pairing must be one-to-one"
            );
        }
        paired.push(FleetPairing {
            tautulli: instance.name.clone(),
            plex: (*plex_name).to_owned(),
        });
    }
    paired.sort_by(|left, right| left.tautulli.cmp(&right.tautulli));
    unpaired_tautulli.sort();
    let unpaired_plex = plex
        .iter()
        .filter(|server| !paired_plex.contains(&server.name))
        .map(|server| server.name.clone())
        .collect();
    Ok(PairingReport {
        paired,
        unpaired_plex,
        unpaired_tautulli,
    })
}

pub(crate) fn diff_fleet(current: &[DiscoveredPlex], previous: &[DiscoveredPlex]) -> DriftReport {
    let current_by_id = current
        .iter()
        .map(|item| (item.client_identifier.as_str(), item))
        .collect::<BTreeMap<_, _>>();
    let previous_by_id = previous
        .iter()
        .map(|item| (item.client_identifier.as_str(), item))
        .collect::<BTreeMap<_, _>>();
    let mut report = DriftReport::default();
    for (identifier, item) in &current_by_id {
        match previous_by_id.get(identifier) {
            None => report.added.push(item.name.clone()),
            Some(old) => {
                if old.name != item.name {
                    report
                        .renamed
                        .push(format!("{} -> {}", old.name, item.name));
                }
                if old.url != item.url {
                    report
                        .url_changed
                        .push(format!("{}: {} -> {}", item.name, old.url, item.url));
                }
            }
        }
    }
    for (identifier, item) in previous_by_id {
        if !current_by_id.contains_key(identifier) {
            report.removed.push(item.name.clone());
        }
    }
    report.added.sort();
    report.removed.sort();
    report.renamed.sort();
    report.url_changed.sort();
    report
}

fn slug(name: &str) -> String {
    let mut out = String::new();
    let mut separator = false;
    for character in name.chars().flat_map(char::to_lowercase) {
        if character.is_ascii_alphanumeric() {
            out.push(character);
            separator = false;
        } else if !out.is_empty() && !separator {
            out.push('_');
            separator = true;
        }
    }
    while out.ends_with('_') {
        out.pop();
    }
    if out.is_empty() { "server".into() } else { out }
}

fn short_hash(identifier: &str) -> String {
    let digest = Sha256::digest(identifier.as_bytes());
    digest[..4]
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn select_connection(resource: &PlexResource) -> Option<(String, bool)> {
    let mut connections = resource.connections.iter().collect::<Vec<_>>();
    connections.sort_by(|left, right| left.uri.cmp(&right.uri));
    if let Some(connection) = connections.iter().find(|connection| connection.local) {
        return Some((connection.uri.clone(), false));
    }
    if let Some(connection) = connections.iter().find(|connection| {
        !is_relay(connection)
            && (connection.protocol.as_deref() == Some("https")
                || connection.uri.starts_with("https://"))
    }) {
        return Some((connection.uri.clone(), false));
    }
    connections
        .iter()
        .find(|connection| is_relay(connection))
        .map(|connection| (connection.uri.clone(), true))
}

fn is_relay(connection: &PlexConnection) -> bool {
    connection.relay || connection.uri.contains("relay.plex.direct")
}

async fn inspect_tautulli(config: &YarrConfig) -> Vec<TautulliIdentity> {
    let client = match YarrClient::new(config) {
        Ok(client) => client,
        Err(_) => return Vec::new(),
    };
    let service = YarrService::new(client, config.clone());
    let mut identities = Vec::new();
    for instance in config
        .services
        .iter()
        .filter(|instance| instance.kind == ServiceKind::Tautulli)
    {
        let pms_identifier = match service.service_status(&instance.name).await {
            Ok(value) => find_string_field(&value, "pms_identifier"),
            Err(_) => None,
        };
        identities.push(TautulliIdentity {
            name: instance.name.clone(),
            url: instance.base_url.clone(),
            pms_identifier,
        });
    }
    identities.sort_by(|left, right| left.name.cmp(&right.name));
    identities
}

fn find_string_field(value: &serde_json::Value, field: &str) -> Option<String> {
    match value {
        serde_json::Value::Object(object) => object
            .get(field)
            .and_then(serde_json::Value::as_str)
            .map(str::to_owned)
            .or_else(|| {
                object
                    .values()
                    .find_map(|child| find_string_field(child, field))
            }),
        serde_json::Value::Array(items) => items
            .iter()
            .find_map(|child| find_string_field(child, field)),
        _ => None,
    }
}

#[derive(Serialize)]
struct FleetDocumentOut {
    services: Vec<FleetEntryOut>,
}

#[derive(Serialize)]
struct FleetEntryOut {
    name: String,
    kind: ServiceKind,
    url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    token_env: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    client_identifier: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    plex: Option<String>,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    relay_only: bool,
}

fn write_discovery_files(
    output: &Path,
    env_output: &Path,
    plex: &[DiscoveredPlex],
    tautulli: &[TautulliIdentity],
    pairing: &PairingReport,
) -> Result<()> {
    match output.extension().and_then(|extension| extension.to_str()) {
        Some("yaml" | "yml") => {}
        _ => anyhow::bail!("discover plex --output must use a .yaml or .yml extension"),
    }
    for path in [output, env_output] {
        if let Some(parent) = path.parent()
            && !parent.as_os_str().is_empty()
        {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("could not create {}", parent.display()))?;
        }
    }

    let paired_by_tautulli = pairing
        .paired
        .iter()
        .map(|pair| (pair.tautulli.as_str(), pair.plex.as_str()))
        .collect::<BTreeMap<_, _>>();
    let mut services = plex
        .iter()
        .map(|server| FleetEntryOut {
            name: server.name.clone(),
            kind: ServiceKind::Plex,
            url: server.url.clone(),
            token_env: Some(server.token_env.clone()),
            client_identifier: Some(server.client_identifier.clone()),
            plex: None,
            relay_only: server.relay_only,
        })
        .collect::<Vec<_>>();
    services.extend(tautulli.iter().filter_map(|instance| {
        paired_by_tautulli
            .get(instance.name.as_str())
            .map(|plex_name| FleetEntryOut {
                name: instance.name.clone(),
                kind: ServiceKind::Tautulli,
                url: instance.url.clone(),
                token_env: None,
                client_identifier: None,
                plex: Some((*plex_name).to_owned()),
                relay_only: false,
            })
    }));
    services.sort_by(|left, right| left.name.cmp(&right.name));
    let yaml = serde_yaml::to_string(&FleetDocumentOut { services })?;
    create_new_file(output, yaml.as_bytes(), false)?;

    let mut env =
        String::from("# Generated by yarr discover plex; contains per-server credentials.\n");
    for server in plex {
        if server.access_token.contains(['\r', '\n']) {
            anyhow::bail!("Plex returned an invalid token for {}", server.name);
        }
        env.push_str(&server.token_env);
        env.push('=');
        env.push_str(&server.access_token);
        env.push('\n');
    }
    if let Err(error) = create_new_file(env_output, env.as_bytes(), true) {
        let _ = std::fs::remove_file(output);
        return Err(error);
    }
    Ok(())
}

fn create_new_file(path: &Path, contents: &[u8], private: bool) -> Result<()> {
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    if private {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(path)
        .with_context(|| format!("refusing to overwrite {}", path.display()))?;
    file.write_all(contents)?;
    file.sync_all()?;
    Ok(())
}

fn read_discovered_fleet(path: &Path) -> Result<Vec<DiscoveredPlex>> {
    let contents = std::fs::read_to_string(path)
        .with_context(|| format!("discover plex --diff could not read {}", path.display()))?;
    let document: serde_json::Value = serde_yaml::from_str(&contents)
        .with_context(|| format!("discover plex --diff could not parse {}", path.display()))?;
    let services = document
        .get("services")
        .and_then(serde_json::Value::as_array)
        .ok_or_else(|| anyhow::anyhow!("{} has no services array", path.display()))?;
    let mut result = Vec::new();
    for entry in services {
        if entry.get("kind").and_then(serde_json::Value::as_str) != Some("plex") {
            continue;
        }
        let field = |name: &str| {
            entry
                .get(name)
                .and_then(serde_json::Value::as_str)
                .map(str::to_owned)
                .ok_or_else(|| anyhow::anyhow!("{} Plex entry is missing {name}", path.display()))
        };
        let name = field("name")?;
        result.push(DiscoveredPlex {
            server_name: name.clone(),
            name,
            client_identifier: field("client_identifier")?,
            url: field("url")?,
            token_env: field("token_env")?,
            access_token: String::new(),
            relay_only: entry
                .get("relay_only")
                .and_then(serde_json::Value::as_bool)
                .unwrap_or(false),
        });
    }
    result.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(result)
}

fn validate_env_name(name: &str) -> Result<()> {
    let mut chars = name.chars();
    if !chars
        .next()
        .is_some_and(|first| first == '_' || first.is_ascii_alphabetic())
        || !chars.all(|character| character == '_' || character.is_ascii_alphanumeric())
    {
        anyhow::bail!("discover plex --token-env must be a valid environment variable name");
    }
    Ok(())
}

#[cfg(test)]
#[path = "discovery_tests.rs"]
mod tests;
