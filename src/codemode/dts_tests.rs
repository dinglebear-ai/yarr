//! Tests for the per-type TypeScript catalog (surfaced via codemode.describe).

use super::*;

#[test]
fn type_entries_are_service_qualified_and_cover_services() {
    // `type_entries` now covers only the 5 doc-based services (the 6 spec-backed
    // services' types are generated from OpenAPI and merged by `type_catalog_json_for`).
    let entries = type_entries();
    let names: Vec<&str> = entries.iter().map(|e| e.name.as_str()).collect();
    assert!(names.contains(&"qbittorrent.TorrentInfo"));
    assert!(names.contains(&"tautulli.GetHistoryData"));
    assert!(names.iter().any(|n| n.starts_with("sabnzbd.")));
    // No spec-backed service leaks in here.
    assert!(!names.iter().any(|n| n.starts_with("sonarr.")));
}

#[test]
fn each_entry_carries_a_ts_declaration() {
    for e in type_entries() {
        assert_eq!(e.name, format!("{}.{}", e.service, e.type_name));
        assert!(
            e.dts.starts_with("export interface ") || e.dts.starts_with("export type "),
            "{} dts: {}",
            e.name,
            e.dts
        );
    }
}

#[test]
fn converter_handles_optionals_enums_and_arrays() {
    // The JSON-Schema→TS converter is exercised directly (model-independent) so it
    // doesn't depend on any one service's hand-written models.
    let object = serde_json::json!({
        "type": "object",
        "properties": {
            "id": { "type": "integer" },
            "tags": { "type": "array", "items": { "type": "string" } },
            "name": { "type": "string" }
        },
        "required": ["id"]
    });
    let decl = super::declaration("Sample", &object);
    assert!(decl.starts_with("export interface Sample {"));
    assert!(decl.contains("id: number;")); // required → no `?`
    assert!(decl.contains("name?: string;")); // optional → `?`
    assert!(decl.contains("tags?: string[];")); // array

    let enum_schema = serde_json::json!({ "enum": ["television", "web"] });
    let enum_decl = super::declaration("Source", &enum_schema);
    assert!(enum_decl.starts_with("export type Source ="));
    assert!(enum_decl.contains("\"television\""));
}

#[test]
fn type_catalog_json_for_merges_generated_and_doc_based() {
    use crate::config::ServiceKind;
    let services = vec![
        ("sonarr".to_string(), ServiceKind::Sonarr), // spec-backed → generated TS
        ("tautulli".to_string(), ServiceKind::Tautulli), // doc-based → schemars TS
    ];
    let json = type_catalog_json_for(&services);
    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
    let arr = parsed.as_array().unwrap();
    assert!(!arr.is_empty());
    let names: Vec<&str> = arr.iter().filter_map(|e| e["name"].as_str()).collect();
    // A generated sonarr type and a doc-based tautulli type both appear, qualified
    // by the configured service name.
    assert!(names.contains(&"sonarr.SeriesResource"));
    assert!(names.iter().any(|n| n.starts_with("tautulli.")));
}

#[test]
fn type_catalog_uses_the_callable_namespace_for_hyphenated_service_names() {
    use crate::config::ServiceKind;
    let json = type_catalog_json_for(&[("home-media".to_string(), ServiceKind::Sonarr)]);
    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
    let names: Vec<&str> = parsed
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|entry| entry["name"].as_str())
        .collect();

    assert!(names.contains(&"home_media.SeriesResource"));
    assert!(!names.contains(&"home-media.SeriesResource"));
}
