//! Pairing report tests: exact matches, one-sided leftovers, ambiguity.

use super::*;

fn ident(service: &str, id: &str) -> TautulliIdentity {
    TautulliIdentity {
        service: service.into(),
        pms_identifier: id.into(),
    }
}

fn plex(service: &str, id: &str) -> PlexIdentity {
    PlexIdentity {
        service: service.into(),
        client_identifier: id.into(),
    }
}

#[test]
fn pairs_exact_matches_and_reports_mixed_outcomes() {
    let report = pair_tautulli_to_plex(
        &[
            ident("tautulli-main", "shared-id"),
            ident("tautulli-orphan", "only-tautulli"),
        ],
        &[
            plex("plex-den", "shared-id"),
            plex("plex-orphan", "only-plex"),
        ],
    );
    assert_eq!(
        report.pairs,
        vec![Pair {
            tautulli_service: "tautulli-main".into(),
            plex_service: "plex-den".into(),
        }]
    );
    assert_eq!(
        report.unpaired_tautulli,
        vec![ident("tautulli-orphan", "only-tautulli")]
    );
    assert_eq!(report.unpaired_plex, vec![plex("plex-orphan", "only-plex")]);
    assert!(report.ambiguous.is_empty());
}

#[test]
fn ambiguous_identity_is_never_silently_paired() {
    let report = pair_tautulli_to_plex(
        &[ident("tautulli-a", "dup"), ident("tautulli-b", "dup")],
        &[plex("plex-a", "dup"), plex("plex-b", "dup")],
    );
    assert!(report.pairs.is_empty(), "ambiguous matches must not pair");
    assert_eq!(report.ambiguous.len(), 1);
    assert_eq!(report.ambiguous[0].identifier, "dup");
    assert_eq!(report.ambiguous[0].tautulli.len(), 2);
    assert_eq!(report.ambiguous[0].plex.len(), 2);
    // Everything ambiguous is also surfaced as unpaired on both sides.
    assert_eq!(report.unpaired_tautulli.len(), 2);
    assert_eq!(report.unpaired_plex.len(), 2);
}

#[test]
fn one_to_two_is_ambiguous_even_on_one_side() {
    let report = pair_tautulli_to_plex(
        &[ident("tautulli-a", "x")],
        &[plex("plex-a", "x"), plex("plex-b", "x")],
    );
    assert!(report.pairs.is_empty());
    assert_eq!(report.ambiguous.len(), 1);
}
