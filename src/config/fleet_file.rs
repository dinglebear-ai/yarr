//! Additive fleet-file parsing and environment-secret resolution.

use std::collections::BTreeMap;
use std::path::Path;

use anyhow::{Context, Result};
use serde::Deserialize;

use super::services::{ServiceConfig, ServiceKind, validate_service_identities};

#[derive(Debug, Clone, Copy)]
pub(crate) enum FleetFormat {
    Yaml,
    Toml,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct FleetDocument {
    services: Vec<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct FleetServiceEntry {
    name: String,
    kind: ServiceKind,
    url: String,
    token_env: Option<String>,
    api_key_env: Option<String>,
    username_env: Option<String>,
    password_env: Option<String>,
    client_identifier: Option<String>,
    plex: Option<String>,
    #[serde(default)]
    relay_only: bool,
}

pub(crate) fn load_fleet_file(path: &Path) -> Result<Vec<ServiceConfig>> {
    let contents = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read fleet file {}", path.display()))?;
    let format = match path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(str::to_ascii_lowercase)
        .as_deref()
    {
        Some("yaml" | "yml") => FleetFormat::Yaml,
        Some("toml") => FleetFormat::Toml,
        _ => anyhow::bail!(
            "fleet file {} must have a .yaml, .yml, or .toml extension",
            path.display()
        ),
    };
    parse_and_resolve(&contents, format, path)
}

pub(crate) fn parse_and_resolve(
    contents: &str,
    format: FleetFormat,
    source: &Path,
) -> Result<Vec<ServiceConfig>> {
    let document = parse_document(contents, format)
        .with_context(|| format!("failed to parse fleet file {}", source.display()))?;
    let mut services = Vec::with_capacity(document.services.len());
    for (index, raw_entry) in document.services.into_iter().enumerate() {
        let name = raw_entry
            .get("name")
            .and_then(serde_json::Value::as_str)
            .unwrap_or("<unnamed>")
            .to_owned();
        let line = entry_line(contents, &name, index);
        let entry: FleetServiceEntry = serde_json::from_value(raw_entry).map_err(|error| {
            anyhow::anyhow!(
                "{}:{line}: invalid fleet service {name:?}: {error}; credentials must use token_env, api_key_env, username_env, or password_env (inline secrets are forbidden)",
                source.display()
            )
        })?;
        services.push(entry.resolve(source, line)?);
    }
    services.sort_by(|left, right| left.name.cmp(&right.name));
    validate_service_identities(&services)
        .with_context(|| format!("invalid fleet file {}", source.display()))?;
    Ok(services)
}

fn parse_document(contents: &str, format: FleetFormat) -> Result<FleetDocument> {
    match format {
        FleetFormat::Yaml => serde_yaml::from_str(contents).map_err(Into::into),
        FleetFormat::Toml => {
            let value: toml::Value = toml::from_str(contents)?;
            serde_json::from_value(serde_json::to_value(value)?).map_err(Into::into)
        }
    }
}

impl FleetServiceEntry {
    fn resolve(self, source: &Path, line: usize) -> Result<ServiceConfig> {
        let name = self.name.trim().to_ascii_lowercase();
        if name.is_empty() {
            anyhow::bail!(
                "{}:{line}: fleet service name must not be empty",
                source.display()
            );
        }
        let base_url = self.url.trim().to_owned();
        if base_url.is_empty() {
            anyhow::bail!(
                "{}:{line}: fleet service {name:?} url must not be empty",
                source.display()
            );
        }
        Ok(ServiceConfig {
            name,
            kind: self.kind,
            base_url,
            api_key: resolve_env(&self.api_key_env, "api_key_env", source, line)?,
            username: resolve_env(&self.username_env, "username_env", source, line)?,
            password: resolve_env(&self.password_env, "password_env", source, line)?,
            token: resolve_env(&self.token_env, "token_env", source, line)?,
            read_only: false,
            client_identifier: nonempty(self.client_identifier),
            plex: nonempty(self.plex),
            relay_only: self.relay_only,
        })
    }
}

fn resolve_env(
    reference: &Option<String>,
    field: &str,
    source: &Path,
    line: usize,
) -> Result<Option<String>> {
    let Some(variable) = reference.as_deref().map(str::trim) else {
        return Ok(None);
    };
    if !valid_env_name(variable) {
        anyhow::bail!(
            "{}:{line}: {field} value {variable:?} is not a valid environment variable name",
            source.display()
        );
    }
    let value = super::env_value(variable)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            anyhow::anyhow!(
                "{}:{line}: {field} references unset or empty environment variable {variable}",
                source.display()
            )
        })?;
    Ok(Some(value))
}

fn valid_env_name(name: &str) -> bool {
    let mut chars = name.chars();
    chars
        .next()
        .is_some_and(|first| first == '_' || first.is_ascii_alphabetic())
        && chars.all(|ch| ch == '_' || ch.is_ascii_alphanumeric())
}

fn nonempty(value: Option<String>) -> Option<String> {
    value
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
}

fn entry_line(contents: &str, name: &str, _index: usize) -> usize {
    contents
        .lines()
        .enumerate()
        .find(|(_, line)| line.contains("name") && line.contains(name))
        .map_or(1, |(line, _)| line + 1)
}

pub(crate) fn merge_service_sources(
    lower_precedence: Vec<ServiceConfig>,
    higher_precedence: Vec<ServiceConfig>,
) -> Result<Vec<ServiceConfig>> {
    validate_service_identities(&lower_precedence)?;
    validate_service_identities(&higher_precedence)?;
    let mut merged = BTreeMap::<String, ServiceConfig>::new();
    for service in lower_precedence.into_iter().chain(higher_precedence) {
        merged.insert(service.name.to_ascii_lowercase(), service);
    }
    let services = merged.into_values().collect::<Vec<_>>();
    validate_service_identities(&services)?;
    Ok(services)
}
