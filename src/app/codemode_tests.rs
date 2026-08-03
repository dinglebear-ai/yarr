//! Code Mode app-bridge tests — exercise the full async dispatch bridge through a
//! stub `YarrService` (no real upstreams). `help` is a local, non-networked
//! action, so it round-trips end to end; the destructive-action tests below
//! confirm scripts can reach a destructive action's dispatch (it fails only at
//! the network layer, the stub's `localhost:1` being unreachable) rather than
//! being blocked mid-script.

use crate::testing::loopback_state;

#[path = "codemode_artifacts_tests.rs"]
mod artifacts;
#[path = "codemode_runtime_tests.rs"]
mod runtime;
#[path = "codemode_snippets_tests.rs"]
mod snippets;

/// Build a stub `YarrService` configured with the given kinds (no real
/// upstreams) so a test can exercise multi-service discovery (e.g. ambiguous bare
/// type names across two configured services).
fn multi_service(kinds: &[(&str, crate::config::ServiceKind)]) -> crate::app::YarrService {
    let config = crate::config::YarrConfig {
        services: kinds
            .iter()
            .map(|(name, kind)| crate::config::ServiceConfig {
                name: (*name).to_string(),
                kind: *kind,
                base_url: "http://localhost:1".into(),
                api_key: Some("test".into()),
                ..Default::default()
            })
            .collect(),
    };
    let client = crate::yarr::YarrClient::new(&config).expect("stub client builds");
    crate::app::YarrService::new(client, config)
}

#[tokio::test]
async fn fleet_map_runs_through_the_host_dispatch_bridge() {
    let output = loopback_state()
        .service
        .with_fleet_limits(8, std::time::Duration::from_millis(100))
        .codemode(r#"async () => fleet.map("sonarr", s => s.service_status())"#)
        .await
        .unwrap();
    assert_eq!(output["result"][0]["name"], "sonarr");
    assert_eq!(output["result"][0]["ok"], false);
    assert_eq!(output["result"][0]["truncated"], false);
}

#[tokio::test]
async fn codemode_roundtrips_a_local_action() {
    let service = loopback_state().service;
    let code = r#"
        async () => {
            const h = await callTool("help", {});
            return { hasHelp: typeof h.help === "string" };
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    assert_eq!(out["result"]["hasHelp"], true);
    // One recorded call, succeeded.
    assert_eq!(out["calls"].as_array().unwrap().len(), 1);
    assert_eq!(out["calls"][0]["action"], "help");
    assert_eq!(out["calls"][0]["ok"], true);
}

#[tokio::test]
async fn per_service_callable_bakes_in_the_service() {
    // The loopback stub configures a `sonarr` (spec-backed) service, so its
    // generated callables exist. `sonarr.delete_series_by_id({id})` is a generated
    // DELETE op: it dispatches through the `op` action with the service baked
    // in, all the way to the network (the stub points at unreachable
    // `localhost:1`) — a clean assertion of the generated per-service callable
    // path, and that a destructive op is not blocked mid-script.
    let service = loopback_state().service;
    let code = r#"
        async () => {
            try { await sonarr.delete_series_by_id({ id: 1 }); return "ran"; }
            catch (e) { return "err:" + e.message; }
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    let result = out["result"].as_str().unwrap();
    // Never blocked for being a DELETE — the destructive-refusal message must
    // be absent; the call either "ran" or hit a network error.
    assert!(!result.contains("destructive"), "got: {result}");
    assert!(!result.contains("cannot run"), "got: {result}");
    assert_eq!(out["calls"][0]["action"], "op");
}

#[tokio::test]
async fn codemode_allows_destructive_actions_to_dispatch() {
    // api_delete is destructive, but Code Mode has no confirmation channel
    // mid-script, so it just dispatches immediately like any other action —
    // failing only at the network layer (unreachable stub).
    let service = loopback_state().service;
    let code = r#"
        async () => {
            try {
                await callTool("api_delete", { service: "sonarr", path: "/api/v3/series/1" });
                return "ran";
            } catch (e) {
                return "err:" + e.message;
            }
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    let result = out["result"].as_str().unwrap();
    assert!(!result.contains("destructive"), "got: {result}");
    assert!(!result.contains("cannot run"), "got: {result}");
    assert_eq!(out["calls"][0]["action"], "api_delete");
}

#[tokio::test]
async fn codemode_discovery_search_and_describe_run() {
    // Exercise the injected discovery JS end-to-end (a .contains() string check
    // would not catch a syntax error in the preamble — this actually runs it).
    let service = loopback_state().service;
    let code = r#"
        async () => {
            const hits = codemode.search("api");
            const desc = codemode.describe("api.<service>.delete");
            return {
                found: hits.results.some(e => e.path === "api.<service>.get"),
                total: hits.total,
                describedDestructive: desc.destructive,
                signature: desc.signature,
                missing: codemode.describe("nope_not_real"),
            };
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    assert_eq!(out["result"]["found"], true);
    assert!(out["result"]["total"].as_i64().unwrap() >= 4);
    assert_eq!(out["result"]["describedDestructive"], true);
    assert_eq!(out["result"]["signature"], "api.<service>.delete(path)");
    assert!(out["result"]["missing"].is_null());
}

#[tokio::test]
async fn codemode_describe_surfaces_response_types_on_demand() {
    // The whole point: an agent discovers a response TYPE's TS interface ON DEMAND
    // via codemode.describe — only the type it asks for comes back (not a context
    // dump). End-to-end through the engine.
    // Only `sonarr` is configured, so its generated types are the surface.
    let service = loopback_state().service;
    let code = r#"
        async () => {
            const byQualified = codemode.describe("sonarr.SeriesResource");
            const byBare = codemode.describe("SeriesResource");
            const found = codemode.search("series").results.some(r => r.kind === "type");
            return {
                kind: byQualified.kind,
                hasInterface: byQualified.dts.indexOf("export interface SeriesResource") !== -1,
                hasOptionalField: byQualified.dts.indexOf("?:") !== -1,
                bareResolved: byBare && byBare.name,
                searchFindsType: found,
            };
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    assert_eq!(out["result"]["kind"], "type");
    assert_eq!(out["result"]["hasInterface"], true);
    assert_eq!(out["result"]["hasOptionalField"], true);
    // Bare name is unambiguous (only sonarr configured) → resolves to the qualified.
    assert_eq!(out["result"]["bareResolved"], "sonarr.SeriesResource");
    assert_eq!(out["result"]["searchFindsType"], true);
}

#[tokio::test]
async fn codemode_describe_ambiguous_bare_type_is_null() {
    // QualityProfileResource exists under both sonarr and radarr; a bare name must
    // NOT silently resolve to the first match — only an unambiguous name resolves.
    let service = multi_service(&[
        ("sonarr", crate::config::ServiceKind::Sonarr),
        ("radarr", crate::config::ServiceKind::Radarr),
    ]);
    let code = r#"async () => ({
        ambiguous: codemode.describe("QualityProfileResource"),
        qualified: codemode.describe("sonarr.QualityProfileResource") ? "ok" : "missing",
        unique: codemode.describe("SeriesResource") ? "ok" : "missing",
    })"#;
    let out = service.codemode(code).await.unwrap();
    assert!(out["result"]["ambiguous"].is_null());
    assert_eq!(out["result"]["qualified"], "ok");
    assert_eq!(out["result"]["unique"], "ok");
}

#[tokio::test]
async fn codemode_api_client_delete_dispatches() {
    // The loopback stub configures a `sonarr` service, so `api.sonarr` exists in
    // the preamble. `.delete` resolves to `api_delete` and dispatches like any
    // other action — failing only at the network layer (unreachable stub).
    let service = loopback_state().service;
    let code = r#"
        async () => {
            try {
                await api.sonarr.delete("/api/v3/series/1");
                return "ran";
            } catch (e) {
                return "err:" + e.message;
            }
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    let result = out["result"].as_str().unwrap();
    assert!(!result.contains("destructive"), "got: {result}");
    assert_eq!(out["calls"][0]["action"], "api_delete");
}
