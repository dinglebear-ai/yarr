//! Plex account discovery and Tautulli↔Plex pairing, app layer.
//!
//! CLI-only: the running server, MCP, and Code Mode paths never reach here.
//! Discovery talks to plex.tv through the shared transport
//! ([`crate::yarr::YarrClient::fetch_text`]), reads the account token through
//! the configuration environment (overlay-aware, never a raw `std::env` scan),
//! and writes only the operator-chosen export path — never a caller config or
//! secret file.

use std::path::Path;

use anyhow::{Context, Result, anyhow, bail};
use reqwest::header;

use super::YarrService;
use crate::fleet::discovery::{
    EXPORT_MARKER, KnownPlex, PLEX_CLIENT_IDENTIFIER, PLEX_PRODUCT, PlexDiscoveryOptions,
    PlexDiscoveryReport, build_report, classify_drift_against_configured, parse_plex_resources,
    render_export, validate_token_env_name,
};
use crate::fleet::pairing::{PairingReport, PlexIdentity, TautulliIdentity, pair_tautulli_to_plex};

impl YarrService {
    /// Resolve the Plex account token from the environment (configuration
    /// overlay first), fetch plex.tv resources through the shared transport,
    /// and build the report. Writes the export only when `options.out` is set
    /// and `options.diff` is false.
    pub async fn run_plex_discovery(
        &self,
        options: &PlexDiscoveryOptions,
    ) -> Result<PlexDiscoveryReport> {
        validate_token_env_name(&options.token_env)?;
        let token = crate::config::env_value(&options.token_env)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                anyhow!(
                    "Plex token environment variable {} is not set",
                    options.token_env
                )
            })?;
        let url = match &options.resources_url {
            Some(url) => url.clone(),
            None => reqwest::Url::parse(crate::fleet::discovery::PLEX_RESOURCES_URL)
                .map_err(|error| anyhow!("invalid built-in plex.tv resources URL: {error}"))?,
        };
        ensure_approved_scheme(&url)?;
        let body = self.fetch_plex_resources(&url, &token).await?;
        let mut report = build_report(&parse_plex_resources(&body)?, options.include_shared)?;
        report.drift = classify_drift_against_configured(&self.configured_plex(), &report);
        if !options.diff
            && let Some(out) = &options.out
        {
            self.write_plex_export(out, &report)?;
        }
        Ok(report)
    }

    /// Read the identifier each configured Tautulli and Plex instance reports,
    /// then pair exact matches. Read-only: contacts only the local configured
    /// services, never persists anything, never calls plex.tv.
    pub async fn pair_configured_tautulli_to_plex(&self) -> Result<PairingReport> {
        let mut tautulli = Vec::new();
        let mut plex = Vec::new();
        for service in &self.services {
            match service.kind {
                crate::config::ServiceKind::Tautulli => {
                    let response = self
                        .client
                        .get_json(service, "/api/v2?cmd=get_server_info")
                        .await?;
                    let pms_identifier = required_string(
                        &response,
                        "/response/data/pms_identifier",
                        &service.name,
                        "Tautulli pms_identifier",
                    )?;
                    tautulli.push(TautulliIdentity {
                        service: service.name.clone(),
                        pms_identifier,
                    });
                }
                crate::config::ServiceKind::Plex => {
                    let response = self.client.get_json(service, "/identity").await?;
                    let client_identifier = plex_machine_identifier(&response, &service.name)?;
                    plex.push(PlexIdentity {
                        service: service.name.clone(),
                        client_identifier,
                    });
                }
                _ => {}
            }
        }
        Ok(pair_tautulli_to_plex(&tautulli, &plex))
    }

    fn configured_plex(&self) -> Vec<KnownPlex> {
        self.services
            .iter()
            .filter(|service| service.kind == crate::config::ServiceKind::Plex)
            .map(|service| KnownPlex {
                name: service.name.clone(),
                base_url: service.base_url.clone(),
            })
            .collect()
    }

    async fn fetch_plex_resources(&self, url: &reqwest::Url, token: &str) -> Result<String> {
        let headers = [
            ("X-Plex-Product", PLEX_PRODUCT.to_owned()),
            (
                "X-Plex-Client-Identifier",
                PLEX_CLIENT_IDENTIFIER.to_owned(),
            ),
            (header::ACCEPT.as_str(), "application/json".to_owned()),
            ("X-Plex-Token", token.to_owned()),
        ];
        let (status, body) = self.client.fetch_text(url.clone(), &headers).await?;
        if !status.is_success() {
            // Status-preserving: plex.tv rejections keep their HTTP status in
            // the error, and the token never appears in any message.
            bail!("plex.tv discovery request failed with HTTP {status}");
        }
        Ok(body)
    }

    /// Write the export atomically with mode 0600. Refuses to touch a target
    /// that does not carry the generated marker, so a mistyped `--out` can
    /// never clobber an unrelated file.
    fn write_plex_export(&self, path: &Path, report: &PlexDiscoveryReport) -> Result<()> {
        if path.exists() {
            let existing = std::fs::read_to_string(path)
                .with_context(|| format!("could not read existing export {}", path.display()))?;
            if !existing.starts_with(EXPORT_MARKER) {
                bail!(
                    "refusing to overwrite {}: it does not look like a yarr discovery export (missing marker); choose a different --out path",
                    path.display()
                );
            }
        }
        let contents = render_export(report)?;
        atomic_write_secret(path, contents.as_bytes())
    }
}

fn ensure_approved_scheme(url: &reqwest::Url) -> Result<()> {
    match url.scheme() {
        "https" => Ok(()),
        "http" if is_loopback_host(url.host_str()) => Ok(()),
        other => bail!(
            "discovery endpoint scheme {other:?} is not allowed (https, or http on loopback only)"
        ),
    }
}

fn is_loopback_host(host: Option<&str>) -> bool {
    match host {
        Some("localhost") => true,
        Some(host) => host
            .parse::<std::net::IpAddr>()
            .is_ok_and(|addr| addr.is_loopback()),
        None => false,
    }
}

fn atomic_write_secret(path: &Path, contents: &[u8]) -> Result<()> {
    let parent = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    std::fs::create_dir_all(parent)
        .with_context(|| format!("could not create {}", parent.display()))?;
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("export");
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|elapsed| elapsed.as_nanos())
        .unwrap_or(0);
    let temporary = parent.join(format!(".{name}.{}.{nanos}.tmp", std::process::id()));
    let result = (|| -> Result<()> {
        use std::io::Write as _;
        let mut options = std::fs::OpenOptions::new();
        options.write(true).create_new(true);
        // Set the mode at creation so the temp file never exists with
        // umask-derived permissions, even briefly.
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut file = options.open(&temporary).with_context(|| {
            format!("could not create temporary export {}", temporary.display())
        })?;
        #[cfg(unix)]
        {
            // Belt and braces for filesystems that ignore the open-time mode.
            use std::os::unix::fs::PermissionsExt;
            file.set_permissions(std::fs::Permissions::from_mode(0o600))?;
        }
        file.write_all(contents)?;
        file.sync_all()?;
        Ok(())
    })();
    if let Err(error) = result {
        let _ = std::fs::remove_file(&temporary);
        return Err(error);
    }
    std::fs::rename(&temporary, path)
        .with_context(|| format!("could not write export {}", path.display()))?;
    Ok(())
}

fn plex_machine_identifier(response: &serde_json::Value, service: &str) -> Result<String> {
    if let Some(identifier) = response
        .pointer("/MediaContainer/machineIdentifier")
        .and_then(serde_json::Value::as_str)
        .filter(|value| !value.is_empty())
    {
        return Ok(identifier.to_owned());
    }
    // Some Plex builds answer /identity as XML even under a JSON accept; the
    // executor surfaces that as a JSON string. A tiny scan keeps pairing
    // working without a full XML parser dependency.
    if let Some(xml) = response.as_str()
        && let Some(identifier) = scan_xml_attribute(xml, "machineIdentifier")
    {
        return Ok(identifier);
    }
    bail!("{service} response is missing Plex machineIdentifier")
}

fn scan_xml_attribute(xml: &str, attribute: &str) -> Option<String> {
    let needle = format!("{attribute}=\"");
    let start = xml.find(&needle)? + needle.len();
    let rest = &xml[start..];
    let end = rest.find('"')?;
    let value = &rest[..end];
    (!value.is_empty()).then(|| value.to_owned())
}

fn required_string(
    response: &serde_json::Value,
    pointer: &str,
    service: &str,
    field: &str,
) -> Result<String> {
    response
        .pointer(pointer)
        .and_then(serde_json::Value::as_str)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .ok_or_else(|| anyhow!("{service} response is missing {field}"))
}

#[cfg(test)]
#[path = "discovery_tests.rs"]
mod tests;
