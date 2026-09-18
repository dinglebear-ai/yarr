//! Pure Tautulli-to-Plex identifier pairing.
//!
//! Pairing consumes already-read identity values and performs no network I/O,
//! persistence, or service mutation. The async reader that talks to configured
//! services lives in the app layer (`crate::app::discovery`).

use std::collections::{BTreeMap, BTreeSet};

use serde::Serialize;

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

/// Pair exact identifier matches. One-to-one matches become pairs; an
/// identifier reported by multiple instances on either side is surfaced as
/// ambiguous (and never silently paired).
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
        .collect::<BTreeSet<_>>();
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

#[cfg(test)]
#[path = "pairing_tests.rs"]
mod tests;
