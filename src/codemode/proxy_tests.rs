//! Preamble generation tests.

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
fn preamble_defines_calltool_and_runner() {
    let pre = build_preamble(&[]);
    assert!(pre.contains("globalThis.callTool ="));
    assert!(pre.contains("__yarrEmitToolCall"));
    assert!(pre.contains("globalThis.__yarrRun ="));
    assert!(pre.contains("globalThis.console ="));
}

#[test]
fn per_service_namespaces_bake_in_the_service() {
    let pre = build_preamble(&services());
    // One object per configured service, keyed by service name.
    assert!(pre.contains(r#"globalThis["sonarr"] = {"#));
    assert!(pre.contains(r#"globalThis["radarr"] = {"#));
    assert!(pre.contains(r#"globalThis["plex"] = {"#));
    // Spec-backed kinds dispatch each generated operation through the `op` action,
    // with the service + op baked in (never passed by the script).
    assert!(pre.contains(r#"["service_status"]: (params) => callTool("service_status""#));
    assert!(pre.contains(r#"["get_series"]: (params) => callTool("op""#));
    assert!(pre.contains(r#"op: "get_series""#));
    assert!(pre.contains(r#"service: "sonarr""#));
    assert!(pre.contains(r#"service: "radarr""#));
}

#[test]
fn no_flat_tools_namespace() {
    // The old flat `tools.<action>({service})` surface (the service-param leak) is
    // gone — everything is reached through a per-service callable.
    let pre = build_preamble(&services());
    assert!(!pre.contains("globalThis.tools"));
    assert!(!pre.contains(r#"tools["list"]"#));
}

#[test]
#[should_panic(expected = "collides with a reserved Code Mode global")]
fn reserved_global_cannot_reach_preamble_generation() {
    // Startup validation is authoritative. This assertion protects direct
    // programmatic construction from silently hiding the configured service.
    let _ = build_preamble(&[("api".to_string(), ServiceKind::Sonarr)]);
}

#[test]
fn api_namespace_generated_per_configured_service() {
    let pre = build_preamble(&services());
    assert!(pre.contains("globalThis.api = {};"));
    assert!(pre.contains(r#"globalThis.api["sonarr"]"#));
    assert!(pre.contains(r#"globalThis.api["radarr"]"#));
    // get/post/put/delete sugar over the api_* passthrough actions.
    assert!(pre.contains(r#"callTool("api_get", { service: "sonarr""#));
    assert!(pre.contains(r#"callTool("api_delete", { service: "radarr""#));
}

#[test]
fn api_namespace_empty_when_no_services() {
    let pre = build_preamble(&[]);
    assert!(pre.contains("globalThis.api = {};"));
    assert!(!pre.contains("globalThis.api[\""));
}

#[test]
fn preamble_injects_discovery_catalog_and_helpers() {
    let pre = build_preamble(&services());
    assert!(pre.contains("globalThis.__codemodeCatalog = ["));
    assert!(pre.contains("globalThis.codemode.search ="));
    assert!(pre.contains("globalThis.codemode.describe ="));
    // The catalog embeds fully-qualified generated callable paths + a destructive
    // flag (DELETE ops).
    assert!(pre.contains(r#""path":"sonarr.get_series""#));
    assert!(pre.contains("\"destructive\":true"));
    // The type catalog is injected so describe/search can surface response types.
    assert!(pre.contains("globalThis.__codemodeTypes = ["));
    assert!(pre.contains("sonarr.SeriesResource"));
}

#[test]
fn snippet_verbs_are_not_callable_namespaces() {
    let pre = build_preamble(&services());
    // Snippet store verbs are reachable only via codemode.run/snippets — never as
    // per-service callables (no incidental file writes/deletes).
    assert!(!pre.contains(r#"["snippet_save"]:"#));
    assert!(!pre.contains(r#"["snippet_run"]:"#));
    // But the explicit discovery/run helpers ARE present.
    assert!(pre.contains("globalThis.codemode.run ="));
    assert!(pre.contains("globalThis.codemode.snippets ="));
    // And `input` is wired (defaults to null for non-snippet runs).
    assert!(pre.contains("globalThis.input ="));
}

#[test]
fn fleet_global_contains_stable_inventory_and_host_backed_map() {
    let pre = build_preamble(&services());
    assert!(pre.contains("globalThis.fleet ="));
    assert!(pre.contains("__yarr_fleet_services"));
    assert!(pre.contains(r#"callTool("__fleet_map""#));
}
