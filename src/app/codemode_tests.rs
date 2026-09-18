//! Code Mode app-bridge tests — exercise the full async dispatch bridge through a
//! stub `YarrService` (no real upstreams). `help` is a local, non-networked
//! action, so it round-trips end to end; the destructive-action tests below
//! confirm scripts can reach a destructive action's dispatch (it fails only at
//! the network layer, the stub's `localhost:1` being unreachable) rather than
//! being blocked mid-script.

use crate::testing::loopback_state;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

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
    // generated callables exist. `sonarr.delete_queue_by_id({id})` is a generated
    // DELETE op: it dispatches through the `op` action with the service baked
    // in, all the way to the network (the stub points at unreachable
    // `localhost:1`) — a clean assertion of the generated per-service callable
    // path for a reviewed Mutation route.
    let service = loopback_state().service;
    let code = r#"
        async () => {
            try { await sonarr.delete_queue_by_id({ id: 1 }); return "ran"; }
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
async fn codemode_allows_reviewed_mutation_delete_to_dispatch() {
    // Sonarr's queue-item delete route is a reviewed Mutation. Code Mode has no
    // MCP peer on this direct path, so it dispatches like any other mutation
    // and fails only at the unreachable stub upstream.
    let service = loopback_state().service;
    let code = r#"
        async () => {
            try {
                await callTool("api_delete", { service: "sonarr", path: "/api/v3/queue/5" });
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
                scope: desc.scope,
                signature: desc.signature,
                missing: codemode.describe("nope_not_real"),
            };
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    assert_eq!(out["result"]["found"], true);
    assert!(out["result"]["total"].as_i64().unwrap() >= 4);
    assert_eq!(out["result"]["describedDestructive"], false);
    assert_eq!(out["result"]["scope"], "route_dependent");
    assert_eq!(out["result"]["signature"], "api.<service>.delete(path)");
    assert!(out["result"]["missing"].is_null());
}

#[tokio::test]
async fn hyphenated_service_name_uses_normalized_namespace_everywhere() {
    let service = multi_service(&[("home-media", crate::config::ServiceKind::Sonarr)]);
    let code = r#"
        async () => {
            const catalog = codemode.search("service status").results;
            const callable = codemode.describe("home_media.service_status");
            const responseType = codemode.describe("home_media.SeriesResource");
            try {
                await home_media.service_status();
            } catch (_) {
                // The stub upstream is unreachable. A recorded call proves the
                // normalized namespace resolved and reached the dispatch bridge.
            }
            return {
                callableFound: callable !== null,
                catalogFound: catalog.some((entry) => entry.path === "home_media.service_status"),
                responseTypeFound: responseType !== null,
                rawApiFound: typeof api.home_media === "object" && typeof api.home_media.get === "function",
                legacyCallableAbsent: codemode.describe("home-media.service_status") === null,
                legacyTypeAbsent: codemode.describe("home-media.SeriesResource") === null,
                legacyRawApiAbsent: typeof api["home-media"] === "undefined",
            };
        }
    "#;

    let out = service.codemode(code).await.unwrap();
    assert_eq!(out["result"]["callableFound"], true);
    assert_eq!(out["result"]["catalogFound"], true);
    assert_eq!(out["result"]["responseTypeFound"], true);
    assert_eq!(out["result"]["rawApiFound"], true);
    assert_eq!(out["result"]["legacyCallableAbsent"], true);
    assert_eq!(out["result"]["legacyTypeAbsent"], true);
    assert_eq!(out["result"]["legacyRawApiAbsent"], true);
    assert_eq!(out["calls"].as_array().map(Vec::len), Some(1));
    assert_eq!(out["calls"][0]["action"], "service_status");
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
                await api.sonarr.delete("/api/v3/queue/5");
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

#[tokio::test]
async fn codemode_raw_api_unknown_route_fails_before_transport() {
    let service = loopback_state().service;
    let code = r#"
        async () => {
            try {
                await api.sonarr.get("/api/v3/not-a-generated-route");
                return "unexpected";
            } catch (e) {
                return e.message;
            }
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    assert!(
        out["result"]
            .as_str()
            .is_some_and(|message| message.contains("no unique generated operation match")),
        "result: {out}"
    );
    assert_eq!(out["calls"][0]["action"], "api_get");
    assert_eq!(out["calls"][0]["ok"], false);
}

// ---------------------------------------------------------------------------
// Runtime-boundary verification: admission, deadline, exactly-once execution.
// ---------------------------------------------------------------------------

/// Minimal counting upstream for exactly-once assertions: accepts TCP
/// connections, counts each one, and replies with a fixed JSON body. Same shape
/// as the MCP route tests' counting stub, kept local because these tests drive
/// the app bridge directly (no `AppState`).
async fn counting_upstream() -> (String, Arc<AtomicUsize>, tokio::task::JoinHandle<()>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let calls = Arc::new(AtomicUsize::new(0));
    let server_calls = calls.clone();
    let handle = tokio::spawn(async move {
        loop {
            let Ok((mut stream, _)) = listener.accept().await else {
                break;
            };
            server_calls.fetch_add(1, Ordering::SeqCst);
            tokio::spawn(async move {
                use tokio::io::{AsyncReadExt, AsyncWriteExt};
                let mut request = [0_u8; 2048];
                let _ = stream.read(&mut request).await;
                let body = br#"{"ok":true}"#;
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                    body.len()
                );
                let _ = stream.write_all(response.as_bytes()).await;
                let _ = stream.write_all(body).await;
            });
        }
    });
    (format!("http://{addr}"), calls, handle)
}

fn counting_service(kind: crate::config::ServiceKind, base_url: &str) -> crate::app::YarrService {
    let config = crate::config::YarrConfig {
        services: vec![crate::config::ServiceConfig {
            name: kind.as_str().into(),
            kind,
            base_url: base_url.to_string(),
            api_key: Some("upstream-secret".into()),
            ..Default::default()
        }],
    };
    let client = crate::yarr::YarrClient::new(&config).expect("stub client builds");
    crate::app::YarrService::new(client, config)
}

#[test]
fn default_runtime_limits_are_pinned() {
    // 30-second execution deadline, 4-slot execution pool, 500 ms admission
    // wait — the documented public limits (docs/CONFIG.md, docs/ENV.md).
    // Changing any of these is a deliberate decision that must update this pin
    // and the docs together.
    assert_eq!(
        crate::codemode_contract::CODEMODE_TIMEOUT,
        Duration::from_secs(30)
    );
    assert_eq!(crate::codemode_contract::CODEMODE_MAX_CONCURRENT, 4);
    assert_eq!(
        crate::codemode_contract::CODEMODE_QUEUE_TIMEOUT,
        Duration::from_millis(500)
    );
}

#[tokio::test]
async fn busy_admission_rejects_without_executing() {
    let (base_url, calls, _upstream) = counting_upstream().await;
    let service = counting_service(crate::config::ServiceKind::Jellyfin, &base_url)
        .with_codemode_limits(1, Duration::from_millis(50), Duration::from_secs(5));
    // Occupy the only execution slot, then attempt admission: the request must
    // fail closed as busy without executing the script or touching upstream.
    let held = service
        .codemode_slots
        .clone()
        .try_acquire_owned()
        .expect("slot is free at test start");
    let error = service
        .codemode(r#"async () => await api.jellyfin.get("/Items/abc/MetadataEditor")"#)
        .await
        .unwrap_err();
    assert!(
        error.to_string().contains("codemode is busy"),
        "error: {error:#}"
    );
    assert_eq!(
        calls.load(Ordering::SeqCst),
        0,
        "a rejected admission must not execute the script or touch upstream"
    );
    // Releasing the slot restores admission; the same script then runs once.
    drop(held);
    let out = service
        .codemode(
            r#"async () => { await api.jellyfin.get("/Items/abc/MetadataEditor"); return "ran"; }"#,
        )
        .await
        .unwrap();
    assert_eq!(out["result"], "ran");
    assert_eq!(calls.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn runaway_script_is_bounded_by_the_execution_deadline() {
    let (base_url, calls, _upstream) = counting_upstream().await;
    let service = counting_service(crate::config::ServiceKind::Jellyfin, &base_url)
        .with_codemode_limits(1, Duration::from_millis(500), Duration::from_millis(300));
    let started = std::time::Instant::now();
    let error = service
        .codemode("async () => { while (true) {} }")
        .await
        .unwrap_err();
    assert!(error.to_string().contains("timed out"), "error: {error:#}");
    assert!(
        started.elapsed() < Duration::from_secs(3),
        "the deadline must end a runaway run promptly"
    );
    assert_eq!(calls.load(Ordering::SeqCst), 0);
    // The slot was released: an ordinary script still executes afterwards.
    let out = service.codemode("async () => 6 * 7").await.unwrap();
    assert_eq!(out["result"], 42);
}

#[tokio::test]
async fn generic_read_hits_upstream_exactly_once_per_run() {
    let (base_url, calls, _upstream) = counting_upstream().await;
    let service = counting_service(crate::config::ServiceKind::Jellyfin, &base_url);
    let code =
        r#"async () => { await api.jellyfin.get("/Items/abc/MetadataEditor"); return "ran"; }"#;
    let first = service.codemode(code).await.unwrap();
    assert_eq!(first["result"], "ran");
    assert_eq!(first["calls"].as_array().unwrap().len(), 1);
    assert_eq!(first["calls"][0]["action"], "api_get");
    assert_eq!(first["calls"][0]["delivered"], true);
    assert_eq!(
        calls.load(Ordering::SeqCst),
        1,
        "one script call hits upstream exactly once"
    );
    // A second identical run performs exactly one more execution: the runtime
    // never retries or replays a completed call.
    let second = service.codemode(code).await.unwrap();
    assert_eq!(second["result"], "ran");
    assert_eq!(calls.load(Ordering::SeqCst), 2);
}

#[tokio::test]
async fn side_effecting_get_executes_exactly_once() {
    // Plex's `add_subtitles` is a GET that mutates (the upstream models a write
    // as GET), exactly the kind of call a retry/replay bug would duplicate.
    // Dispatch it through the public Code Mode path and count upstream hits.
    let (base_url, calls, _upstream) = counting_upstream().await;
    let service = counting_service(crate::config::ServiceKind::Plex, &base_url);
    let code = r#"
        async () => {
            try {
                await api.plex.get("/library/metadata/1/subtitles");
                return "ran";
            } catch (e) {
                return "err:" + e.message;
            }
        }
    "#;
    let out = service.codemode(code).await.unwrap();
    assert_eq!(out["calls"].as_array().unwrap().len(), 1);
    assert_eq!(out["calls"][0]["action"], "api_get");
    assert_eq!(out["calls"][0]["delivered"], true);
    assert_eq!(
        calls.load(Ordering::SeqCst),
        1,
        "a side-effecting GET must execute exactly once"
    );
}

/// Stalling guard standing in for an interactive confirmation round-trip: the
/// runtime must bound the wait by the absolute deadline and release the slot,
/// never letting confirmation latency hold execution capacity unboundedly.
struct SlowGuard(Duration);

impl super::CodeModeCallGuard for SlowGuard {
    fn authorize<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + 'a>> {
        let delay = self.0;
        Box::pin(async move {
            tokio::time::sleep(delay).await;
            Ok(())
        })
    }

    fn authorize_leaf_scope<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move { Ok(()) })
    }

    fn authorize_destructive_leaves<'a>(
        &'a self,
        _leaves: &'a [crate::fleet::FleetLeafLabel],
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move { Ok(()) })
    }
}

#[tokio::test]
async fn slow_guard_cannot_hold_a_slot_past_the_deadline() {
    // A stalling guard (standing in for an interactive confirmation round-trip)
    // must not extend a run past the absolute deadline: the run fails closed as
    // a timeout, and the slot is released for the next request.
    let (base_url, _calls, _upstream) = counting_upstream().await;
    let service = counting_service(crate::config::ServiceKind::Jellyfin, &base_url)
        .with_codemode_limits(1, Duration::from_millis(500), Duration::from_millis(200));
    let code = r#"
        async () => {
            try { await callTool("help", {}); return "ran"; }
            catch (e) { return "err:" + e.message; }
        }
    "#;
    let started = std::time::Instant::now();
    let error = service
        .codemode_with_guard(code, Arc::new(SlowGuard(Duration::from_secs(2))))
        .await
        .unwrap_err();
    assert!(error.to_string().contains("timed out"), "error: {error:#}");
    assert!(
        started.elapsed() < Duration::from_secs(1),
        "a guard stall must be cut off by the absolute deadline"
    );
    // The single slot was released: an ordinary script runs afterwards.
    let out = service.codemode("async () => 6 * 7").await.unwrap();
    assert_eq!(out["result"], 42);
}

// ---------------------------------------------------------------------------
// Fleet bridge: bounded frozen fan-out through the Code Mode engine.
// ---------------------------------------------------------------------------

#[tokio::test]
async fn fleet_status_script_runs_each_leaf_once_with_leaf_audit_rows() {
    let (url, calls, handle) = counting_upstream().await;
    let service = counting_service(crate::config::ServiceKind::Sonarr, &url);
    let out = service
        .codemode("async () => fleet.status()")
        .await
        .unwrap();
    let results = out["result"].as_array().expect("fleet status array");
    assert_eq!(results.len(), 1);
    assert_eq!(results[0]["service"], "sonarr");
    assert_eq!(results[0]["ok"], true, "result: {out}");
    assert_eq!(
        calls.load(Ordering::SeqCst),
        1,
        "one leaf, one upstream call"
    );
    // Leaf-level audit: the real action is recorded, not the internal bridge id.
    let audits = out["calls"].as_array().unwrap();
    assert_eq!(audits.len(), 1, "calls: {out}");
    assert_eq!(audits[0]["action"], "service_status");
    assert_eq!(audits[0]["service"], "sonarr");
    assert_eq!(audits[0]["ok"], true);
    assert_eq!(audits[0]["delivered"], true);
    drop(handle);
}

#[tokio::test]
async fn fleet_map_script_fans_out_exactly_once_per_selected_service() {
    let (url, calls, handle) = counting_upstream().await;
    let config = crate::config::YarrConfig {
        services: vec![
            crate::config::ServiceConfig {
                name: "sonarr".into(),
                kind: crate::config::ServiceKind::Sonarr,
                base_url: url.clone(),
                api_key: Some("upstream-secret".into()),
                ..Default::default()
            },
            crate::config::ServiceConfig {
                name: "radarr".into(),
                kind: crate::config::ServiceKind::Radarr,
                base_url: url.clone(),
                api_key: Some("upstream-secret".into()),
                ..Default::default()
            },
        ],
    };
    let client = crate::yarr::YarrClient::new(&config).expect("stub client builds");
    let service = crate::app::YarrService::new(client, config);
    let out = service
        .codemode(r#"async () => fleet.map(fleet.all(), "service_status")"#)
        .await
        .unwrap();
    let results = out["result"].as_array().expect("fleet map array");
    assert_eq!(results.len(), 2, "result: {out}");
    assert_eq!(calls.load(Ordering::SeqCst), 2, "exactly once per leaf");
    let audits = out["calls"].as_array().unwrap();
    assert_eq!(audits.len(), 2, "one audit row per leaf: {out}");
    let audited: Vec<&str> = audits
        .iter()
        .map(|row| row["service"].as_str().unwrap())
        .collect();
    assert_eq!(audited, vec!["radarr", "sonarr"], "deterministic order");
    drop(handle);
}

#[tokio::test]
async fn fleet_map_script_fails_closed_on_unknown_bridge_params() {
    let (url, calls, handle) = counting_upstream().await;
    let service = counting_service(crate::config::ServiceKind::Sonarr, &url);
    let out = service
        .codemode(
            r#"
        async () => {
            try {
                await callTool("__yarrFleetMap", {
                    selector: { type: "all" },
                    action: "service_status",
                    surprise: 1,
                });
                return "ran";
            } catch (e) {
                return "blocked:" + e.message;
            }
        }
    "#,
        )
        .await
        .unwrap();
    assert!(
        out["result"]
            .as_str()
            .is_some_and(|message| message.contains("unknown field")),
        "result: {out}"
    );
    assert_eq!(calls.load(Ordering::SeqCst), 0, "nothing executed");
    drop(handle);
}
