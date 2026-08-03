//! Discovery catalog tests.

use super::*;
use crate::config::ServiceKind;

fn services() -> Vec<(String, ServiceKind)> {
    vec![
        ("sonarr".to_string(), ServiceKind::Sonarr),
        ("radarr".to_string(), ServiceKind::Radarr),
        ("plex".to_string(), ServiceKind::Plex),
    ]
}

#[test]
fn catalog_paths_are_fully_qualified_per_service() {
    let cat = build_catalog(&services());
    let paths: Vec<&str> = cat.iter().map(CatalogEntry::path).collect();
    // Spec-backed services expose their generated operations (+ service_status),
    // each prefixed with the service name. The service is baked into the path.
    assert!(paths.contains(&"sonarr.service_status"));
    assert!(paths.contains(&"radarr.service_status"));
    assert!(paths.contains(&"sonarr.get_series"));
    assert!(paths.contains(&"radarr.get_movie"));
    assert!(paths.contains(&"sonarr.delete_series_by_id"));
    // No bare action names leak in — discovery only offers callable paths.
    assert!(!paths.contains(&"get_series"));
    assert!(!paths.contains(&"integrations"));
    assert!(!paths.contains(&"codemode"));
}

#[test]
fn each_entry_carries_its_service() {
    let cat = build_catalog(&services());
    let series = cat
        .iter()
        .find(|e| e.path() == "sonarr.get_series")
        .unwrap();
    assert_eq!(series.service(), Some("sonarr"));
    assert_eq!(series.method(), "get_series");
    assert_eq!(series.kind(), "operation");
    // Capability carries the OpenAPI tag, not "infra".
    assert_ne!(series.capability_label(), "infra");
    assert!(!series.description().is_empty());
    // `service` is baked in, never a param the script passes.
    assert!(!series.required_params().contains(&"service"));
    // A DELETE op is flagged destructive (metadata only — Code Mode dispatches
    // it immediately, same as any other action).
    let del = cat
        .iter()
        .find(|e| e.path() == "sonarr.delete_series_by_id")
        .unwrap();
    assert!(del.destructive());
    let terminate = cat
        .iter()
        .find(|e| e.path() == "plex.terminate_session")
        .unwrap();
    assert!(
        terminate.destructive(),
        "non-DELETE high-impact operations must advertise elicitation"
    );
}

#[test]
fn catalog_paths_are_unique() {
    let cat = build_catalog(&services());
    let mut paths: Vec<&str> = cat.iter().map(CatalogEntry::path).collect();
    paths.sort_unstable();
    let mut deduped = paths.clone();
    deduped.dedup();
    assert_eq!(paths, deduped, "catalog callable paths must be unique");
}

#[test]
fn raw_api_client_is_documented_service_agnostically() {
    let cat = build_catalog(&services());
    let get = cat
        .iter()
        .find(|e| e.path() == "api.<service>.get")
        .unwrap();
    assert_eq!(get.scope().as_str(), "write"); // api_get requires write scope
    assert!(!get.destructive());
    assert!(get.service().is_none(), "raw-api docs are service-agnostic");

    let del = cat
        .iter()
        .find(|e| e.path() == "api.<service>.delete")
        .unwrap();
    assert!(del.destructive(), "api_delete is destructive");
}

#[test]
fn catalog_json_is_valid_json_array() {
    let json = catalog_json(&services());
    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
    assert!(parsed.is_array());
    assert!(
        parsed
            .as_array()
            .unwrap()
            .iter()
            .any(|entry| entry.get("kind").and_then(|k| k.as_str()) == Some("operation"))
    );
    assert_eq!(
        parsed.as_array().unwrap().len(),
        build_catalog(&services()).len()
    );
}

#[test]
fn empty_services_yields_only_raw_api_docs() {
    let cat = build_catalog(&[]);
    // No services configured → only the four service-agnostic raw-API entries.
    assert_eq!(cat.len(), 4);
    assert!(cat.iter().all(|e| e.service().is_none()));
}
