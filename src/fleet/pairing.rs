//! Pure Tautulli-to-Plex identifier pairing.
//!
//! Pairing consumes already-read identity values and performs no network I/O,
//! persistence, or service mutation.

use std::collections::BTreeMap;

use anyhow::{Result, anyhow};
use serde::Serialize;

use crate::{
    config::{ServiceConfig, ServiceKind},
    yarr::YarrClient,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TautulliIdentity {
    pub service: String,
    pub pms_identifier: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PlexIdentity {
    pub service: String,
    pub client_identifier: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Pair {
    pub tautulli_service: String,
    pub plex_service: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AmbiguousIdentity {
    pub identifier: String,
    pub tautulli: Vec<TautulliIdentity>,
    pub plex: Vec<PlexIdentity>,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Default)]
pub struct PairingReport {
    pub pairs: Vec<Pair>,
    pub unpaired_tautulli: Vec<TautulliIdentity>,
    pub unpaired_plex: Vec<PlexIdentity>,
    pub ambiguous: Vec<AmbiguousIdentity>,
}

pub fn pair_tautulli_to_plex(
    tautulli: &[TautulliIdentity],
    plex: &[PlexIdentity],
) -> PairingReport {
    let mut tautulli_by_id = BTreeMap::<&str, Vec<TautulliIdentity>>::new();
    let mut plex_by_id = BTreeMap::<&str, Vec<PlexIdentity>>::new();
    for identity in tautulli {
        tautulli_by_id
            .entry(&identity.pms_identifier)
            .or_default()
            .push(identity.clone());
    }
    for identity in plex {
        plex_by_id
            .entry(&identity.client_identifier)
            .or_default()
            .push(identity.clone());
    }
    let identifiers = tautulli_by_id
        .keys()
        .chain(plex_by_id.keys())
        .copied()
        .collect::<std::collections::BTreeSet<_>>();
    let mut report = PairingReport::default();
    for identifier in identifiers {
        let tautulli_matches = tautulli_by_id.remove(identifier).unwrap_or_default();
        let plex_matches = plex_by_id.remove(identifier).unwrap_or_default();
        if tautulli_matches.len() == 1 && plex_matches.len() == 1 {
            report.pairs.push(Pair {
                tautulli_service: tautulli_matches[0].service.clone(),
                plex_service: plex_matches[0].service.clone(),
            });
        } else if tautulli_matches.is_empty() {
            report.unpaired_plex.extend(plex_matches);
        } else if plex_matches.is_empty() {
            report.unpaired_tautulli.extend(tautulli_matches);
        } else {
            report.ambiguous.push(AmbiguousIdentity {
                identifier: identifier.into(),
                tautulli: tautulli_matches.clone(),
                plex: plex_matches.clone(),
            });
            report.unpaired_tautulli.extend(tautulli_matches);
            report.unpaired_plex.extend(plex_matches);
        }
    }
    report
}

/// Read the identifier each configured Tautulli and Plex instance reports, then
/// pair exact matches. This is read-only: it contacts only the local configured
/// services, never persists data, and never calls plex.tv.
pub async fn pair_configured_tautulli_to_plex(
    client: &YarrClient,
    services: &[ServiceConfig],
) -> Result<PairingReport> {
    let mut tautulli = Vec::new();
    let mut plex = Vec::new();

    for service in services {
        match service.kind {
            ServiceKind::Tautulli => {
                let response = client
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
            ServiceKind::Plex => {
                let response = client.get_json(service, "/identity").await?;
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

fn plex_machine_identifier(response: &serde_json::Value, service: &str) -> Result<String> {
    if let Some(identifier) = response
        .pointer("/MediaContainer/machineIdentifier")
        .and_then(serde_json::Value::as_str)
        .filter(|value| !value.is_empty())
    {
        return Ok(identifier.to_owned());
    }

    response
        .as_str()
        .and_then(|xml| roxmltree::Document::parse(xml).ok())
        .and_then(|document| {
            document
                .root_element()
                .attribute("machineIdentifier")
                .filter(|value| !value.is_empty())
                .map(str::to_owned)
        })
        .ok_or_else(|| anyhow!("{service} response is missing Plex machineIdentifier"))
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
#[path = "pairing_tests.rs"]
mod tests;
