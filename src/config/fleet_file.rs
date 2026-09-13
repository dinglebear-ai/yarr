//! Strict public fleet-file parsing and source merging.

use std::{collections::BTreeMap, path::Path};

use serde::Deserialize;

use super::{ServiceConfig, ServiceKind};

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct FleetFile {
    services: Vec<FleetService>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct FleetService {
    name: String,
    kind: ServiceKind,
    /// Stable public Plex identity retained in discovery-generated fleet files
    /// for later drift comparison; it is never treated as a credential.
    client_identifier: Option<String>,
    base_url: String,
    /// Public Plex connection-selection state retained for drift comparison.
    relay_only: Option<bool>,
    api_key_env: Option<String>,
    username_env: Option<String>,
    password_env: Option<String>,
    token_env: Option<String>,
}

/// Load a YAML or TOML fleet file containing public metadata and environment
/// variable *names*. The returned credential fields carry those reference names;
/// `resolve_fleet_credentials` performs the later overlay-only resolution.
pub fn load_fleet_file(path: &Path) -> anyhow::Result<Vec<ServiceConfig>> {
    let contents = std::fs::read_to_string(path).map_err(|error| {
        anyhow::anyhow!("failed to read fleet file {}: {error}", path.display())
    })?;
    let parsed: FleetFile = match path.extension().and_then(|extension| extension.to_str()) {
        Some("yaml" | "yml") => serde_yaml_ng::from_str(&contents).map_err(|error| {
            anyhow::anyhow!("failed to parse fleet file {}: {error}", path.display())
        })?,
        Some("toml") => toml::from_str(&contents).map_err(|error| {
            anyhow::anyhow!("failed to parse fleet file {}: {error}", path.display())
        })?,
        _ => anyhow::bail!(
            "fleet file {} must use a .yaml, .yml, or .toml extension",
            path.display()
        ),
    };

    let mut services = Vec::with_capacity(parsed.services.len());
    for entry in parsed.services {
        // Discovery owns drift state by re-reading its public fleet file. Parse
        // these fields here so that same file remains usable runtime config;
        // they deliberately never enter credential resolution or service auth.
        let _ = (&entry.client_identifier, entry.relay_only);
        for (field, reference) in [
            ("api_key_env", entry.api_key_env.as_deref()),
            ("username_env", entry.username_env.as_deref()),
            ("password_env", entry.password_env.as_deref()),
            ("token_env", entry.token_env.as_deref()),
        ] {
            if let Some(reference) = reference {
                validate_env_reference(reference).map_err(|error| {
                    anyhow::anyhow!(
                        "fleet file {} service {:?} has invalid {field}: {error}",
                        path.display(),
                        entry.name
                    )
                })?;
            }
        }
        services.push(ServiceConfig {
            name: entry.name,
            kind: entry.kind,
            base_url: entry.base_url,
            api_key: entry.api_key_env,
            username: entry.username_env,
            password: entry.password_env,
            token: entry.token_env,
        });
    }
    validate_source("fleet file", &services)?;
    Ok(services)
}

/// Combine services declared by `config.toml` and a fleet file. Those sources
/// both express durable configuration, so same-name entries are rejected rather
/// than silently selecting one. `YARR_SERVICES` is applied afterwards and remains
/// authoritative through [`merge_service_sources`].
pub(super) fn merge_toml_and_fleet_services(
    toml: Vec<ServiceConfig>,
    file: Vec<ServiceConfig>,
) -> anyhow::Result<Vec<ServiceConfig>> {
    validate_source("config.toml", &toml)?;
    validate_source("fleet file", &file)?;

    let mut merged = BTreeMap::new();
    for service in toml {
        merged.insert(service.name.to_ascii_lowercase(), service);
    }
    for service in file {
        let key = service.name.to_ascii_lowercase();
        if let Some(existing) = merged.get(&key) {
            anyhow::bail!(
                "config.toml service {:?} conflicts with fleet file service {:?} (case-insensitive); rename one source or remove the duplicate",
                existing.name,
                service.name,
            );
        }
        merged.insert(key, service);
    }
    Ok(merged.into_values().collect())
}

/// Merge public fleet-file services with environment services. Environment entries
/// replace case-insensitive name matches; all other entries form a deterministic
/// name-sorted union.
pub fn merge_service_sources(
    file: Vec<ServiceConfig>,
    env: Vec<ServiceConfig>,
) -> anyhow::Result<Vec<ServiceConfig>> {
    validate_source("fleet file", &file)?;
    validate_source("environment", &env)?;

    let mut merged = BTreeMap::new();
    for service in file {
        merged.insert(service.name.to_ascii_lowercase(), service);
    }
    for service in env {
        merged.insert(service.name.to_ascii_lowercase(), service);
    }
    let services = merged.into_values().collect::<Vec<_>>();
    super::YarrConfig {
        services: services.clone(),
    }
    .validate()?;
    Ok(services)
}

/// Validate an environment-variable identifier used by a fleet-file credential
/// reference. Values are intentionally not accepted in fleet files.
pub fn validate_env_reference(name: &str) -> Result<(), String> {
    let mut chars = name.chars();
    match chars.next() {
        Some(first) if first.is_ascii_alphabetic() || first == '_' => {}
        _ => return Err("must start with an ASCII letter or underscore".to_owned()),
    }
    if chars.all(|character| character.is_ascii_alphanumeric() || character == '_') {
        Ok(())
    } else {
        Err("must contain only ASCII letters, digits, and underscores".to_owned())
    }
}

pub(super) fn resolve_fleet_credentials(services: &mut [ServiceConfig]) -> anyhow::Result<()> {
    for service in services {
        for (field, value) in [
            ("api_key_env", &mut service.api_key),
            ("username_env", &mut service.username),
            ("password_env", &mut service.password),
            ("token_env", &mut service.token),
        ] {
            let Some(reference) = value.as_deref() else {
                continue;
            };
            let resolved = super::overlay_value(reference).ok_or_else(|| {
                anyhow::anyhow!(
                    "fleet service {:?} references {field} {reference:?}, which is not present in the installed environment overlay",
                    service.name
                )
            })?;
            *value = Some(resolved);
        }
    }
    Ok(())
}

fn validate_source(source: &str, services: &[ServiceConfig]) -> anyhow::Result<()> {
    let mut names = BTreeMap::new();
    for service in services {
        if service.name.trim().is_empty() {
            anyhow::bail!("{source} contains a service with an empty name");
        }
        let name = service.name.to_ascii_lowercase();
        if let Some(existing) = names.insert(name, &service.name) {
            anyhow::bail!(
                "{source} contains duplicate service names {existing:?} and {:?} (case-insensitive)",
                service.name
            );
        }
    }
    Ok(())
}

#[cfg(test)]
#[path = "fleet_file_tests.rs"]
mod tests;
