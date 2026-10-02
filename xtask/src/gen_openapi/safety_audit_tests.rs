//! Snapshot-level coverage for the reviewed `OpenAPI` safety inventory.

use super::safety::{SafetyIdentity, manifest_identities};
use super::*;

#[test]
fn audited_safety_candidates_cover_the_snapshot_sources() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap();
    let manifest = std::fs::read_to_string(root.join("specs/safety-overrides.toml")).unwrap();
    let known_services = SPECS
        .iter()
        .map(|(service, _)| *service)
        .collect::<Vec<_>>();
    let mut candidates = Vec::new();
    let mut actual_identities = std::collections::BTreeSet::new();
    for (service, path) in SPECS {
        let operations =
            extract_operations(&load_spec(root.join(path).to_str().unwrap()).unwrap()).unwrap();
        let service_candidates = safety_candidates(&operations);
        validate_safety_manifest_for_services(
            service,
            &known_services,
            &operations,
            &manifest,
            &service_candidates,
        )
        .unwrap();
        actual_identities.extend(
            service_candidates
                .iter()
                .map(|candidate| candidate.identity(service)),
        );
        candidates.extend(service_candidates);
    }

    let mut expected_identities = manifest_identities(&manifest).unwrap();
    assert!(expected_identities.remove(&SafetyIdentity::new(
        "plex",
        Some("terminateSession"),
        "POST",
        "/status/sessions/terminate",
    )));
    assert_eq!(actual_identities, expected_identities);

    assert_eq!(candidates.len(), 144);
    assert_eq!(
        candidates
            .iter()
            .filter(|candidate| candidate.is_operation_id_keyed())
            .count(),
        44
    );
    assert_eq!(
        candidates
            .iter()
            .filter(|candidate| !candidate.is_operation_id_keyed())
            .count(),
        100
    );
}
