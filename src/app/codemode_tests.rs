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
async fn codemode_discovery_paths_execute_for_hyphenated_service_names() {
    let service = multi_service(&[("home-media", crate::config::ServiceKind::Sonarr)]);
    let code = r#"
        async () => {
            const hit = codemode.search("service status").results
                .find((entry) => entry.path === "home_media.service_status");
            const responseType = codemode.describe("home_media.SeriesResource");
            if (!hit || !responseType) return { found: false };
            try {
                await home_media.service_status();
            } catch (_) {
                // The loopback endpoint is deliberately unreachable. Reaching it
                // proves discovery returned a callable public API path.
            }
            return { found: true };
        }
    "#;

    let out = service.codemode(code).await.unwrap();
    assert_eq!(out["result"]["found"], true);
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

struct PreflightRecordingGuard {
    calls: std::sync::Arc<std::sync::Mutex<usize>>,
}

impl super::CodeModeCallGuard for PreflightRecordingGuard {
    fn authorize<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async { Ok(()) })
    }

    fn authorize_planned_targets<'a>(
        &'a self,
        _targets: Vec<String>,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let calls = std::sync::Arc::clone(&self.calls);
        Box::pin(async move {
            *calls.lock().expect("preflight call counter is available") += 1;
            Ok(())
        })
    }
}

#[tokio::test]
async fn guarded_codemode_rejects_oversize_code_before_preflight() {
    let calls = std::sync::Arc::new(std::sync::Mutex::new(0));
    let guard = std::sync::Arc::new(PreflightRecordingGuard {
        calls: std::sync::Arc::clone(&calls),
    });
    let code = format!(
        "async () => 1 // {}",
        "x".repeat(crate::codemode::CODEMODE_MAX_CODE_BYTES)
    );

    let error = loopback_state()
        .service
        .codemode_with_guard(&code, guard)
        .await
        .expect_err("oversized Code Mode input must not reach preflight");

    assert!(error.to_string().contains("limit is"), "{error}");
    assert_eq!(*calls.lock().unwrap(), 0, "preflight must not run");
}

struct BlockingPreflightGuard {
    entered: tokio::sync::mpsc::UnboundedSender<()>,
    release: std::sync::Mutex<Option<tokio::sync::oneshot::Receiver<()>>>,
}

impl super::CodeModeCallGuard for BlockingPreflightGuard {
    fn authorize<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async { Ok(()) })
    }

    fn authorize_planned_targets<'a>(
        &'a self,
        _targets: Vec<String>,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let _ = self.entered.send(());
        let release = self
            .release
            .lock()
            .expect("release state is available")
            .take()
            .expect("preflight runs once");
        Box::pin(async move {
            let _ = release.await;
            Ok(())
        })
    }
}

#[tokio::test]
async fn guarded_preflight_holds_the_codemode_admission_slot() {
    let service = loopback_state().service.with_codemode_limits(
        1,
        std::time::Duration::from_millis(10),
        std::time::Duration::from_secs(1),
    );
    let (entered_tx, mut entered_rx) = tokio::sync::mpsc::unbounded_channel();
    let (release_tx, release_rx) = tokio::sync::oneshot::channel();
    let first = tokio::spawn({
        let service = service.clone();
        async move {
            service
                .codemode_with_guard(
                    "async () => 1",
                    std::sync::Arc::new(BlockingPreflightGuard {
                        entered: entered_tx,
                        release: std::sync::Mutex::new(Some(release_rx)),
                    }),
                )
                .await
        }
    });
    entered_rx.recv().await.expect("first preflight entered");

    let error = service
        .codemode_with_guard(
            "async () => 1",
            std::sync::Arc::new(PreflightRecordingGuard {
                calls: std::sync::Arc::new(std::sync::Mutex::new(0)),
            }),
        )
        .await
        .expect_err("a preflight in the only slot must enforce queue timeout");
    assert!(error.to_string().contains("codemode is busy"), "{error}");

    release_tx.send(()).expect("first preflight is waiting");
    first.await.unwrap().unwrap();
}

struct DataDependentPlanningGuard {
    planned: std::sync::Arc<std::sync::Mutex<Vec<String>>>,
}

impl super::CodeModeCallGuard for DataDependentPlanningGuard {
    fn authorize<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async { Ok(()) })
    }

    fn planned_destructive_target(&self, action: &crate::actions::YarrAction) -> Option<String> {
        match action {
            crate::actions::YarrAction::ApiDelete { service, .. } => Some(service.to_owned()),
            _ => None,
        }
    }

    fn authorize_planned_targets<'a>(
        &'a self,
        targets: Vec<String>,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let planned = std::sync::Arc::clone(&self.planned);
        Box::pin(async move {
            *planned.lock().expect("planned targets are available") = targets;
            Ok(())
        })
    }
}

#[tokio::test]
async fn guarded_codemode_plans_data_dependent_delete_after_real_read() {
    let requests = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
    let observed = std::sync::Arc::clone(&requests);
    let app = axum::Router::new().fallback(axum::routing::any(
        move |request: axum::extract::Request| {
            let observed = std::sync::Arc::clone(&observed);
            async move {
                observed.lock().unwrap().push(request.method().to_string());
                axum::Json(serde_json::json!({ "items": [1] }))
            }
        },
    ));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = crate::config::YarrConfig {
        services: vec![crate::config::ServiceConfig {
            name: "sonarr".to_owned(),
            kind: crate::config::ServiceKind::Sonarr,
            base_url: format!("http://{address}").parse().unwrap(),
            api_key: Some("test".to_owned()),
            ..Default::default()
        }],
    };
    let client = crate::yarr::YarrClient::new(&config).unwrap();
    let service = crate::app::YarrService::new(client, config);
    let planned = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
    let guard = std::sync::Arc::new(DataDependentPlanningGuard {
        planned: std::sync::Arc::clone(&planned),
    });

    let result = service
        .codemode_with_guard(
            r#"async () => {
                const x = await api.sonarr.get("/api/v3/series");
                if (x.items.length) await api.sonarr.delete("/api/v3/series/1");
                return x.items.length;
            }"#,
            guard,
        )
        .await;

    assert_eq!(result.unwrap()["result"], 1);
    assert_eq!(*planned.lock().unwrap(), vec!["sonarr"]);
    assert_eq!(
        *requests.lock().unwrap(),
        vec!["GET", "GET", "DELETE"],
        "planning dispatches the read but never a destructive request before confirmation"
    );
}

#[tokio::test]
async fn guarded_planning_never_dispatches_a_generic_non_destructive_mutation() {
    let requests = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
    let observed = std::sync::Arc::clone(&requests);
    let app = axum::Router::new().fallback(axum::routing::any(
        move |request: axum::extract::Request| {
            let observed = std::sync::Arc::clone(&observed);
            async move {
                observed.lock().unwrap().push(request.method().to_string());
                axum::Json(serde_json::json!({ "ok": true }))
            }
        },
    ));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let config = crate::config::YarrConfig {
        services: vec![crate::config::ServiceConfig {
            name: "sonarr".to_owned(),
            kind: crate::config::ServiceKind::Sonarr,
            base_url: format!("http://{address}").parse().unwrap(),
            api_key: Some("test".to_owned()),
            ..Default::default()
        }],
    };
    let service =
        crate::app::YarrService::new(crate::yarr::YarrClient::new(&config).unwrap(), config);

    service
        .codemode_with_guard(
            r#"async () => api.sonarr.post("/api/v3/command", { name: "RefreshSeries" })"#,
            std::sync::Arc::new(PreflightRecordingGuard {
                calls: std::sync::Arc::new(std::sync::Mutex::new(0)),
            }),
        )
        .await
        .unwrap();

    assert_eq!(
        *requests.lock().unwrap(),
        vec!["POST"],
        "the planning sandbox must not send a non-destructive mutation"
    );
}

#[tokio::test]
async fn guarded_parent_snippet_planning_expands_destructive_source_without_dispatching_it() {
    let tmp = tempfile::tempdir().unwrap();
    let requests = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
    let observed = std::sync::Arc::clone(&requests);
    let app = axum::Router::new().fallback(axum::routing::any(
        move |request: axum::extract::Request| {
            let observed = std::sync::Arc::clone(&observed);
            async move {
                observed.lock().unwrap().push(request.method().to_string());
                axum::Json(serde_json::json!({ "ok": true }))
            }
        },
    ));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let config = crate::config::YarrConfig {
        services: vec![crate::config::ServiceConfig {
            name: "sonarr".to_owned(),
            kind: crate::config::ServiceKind::Sonarr,
            base_url: format!("http://{address}").parse().unwrap(),
            api_key: Some("test".to_owned()),
            ..Default::default()
        }],
    };
    let service =
        crate::app::YarrService::new(crate::yarr::YarrClient::new(&config).unwrap(), config)
            .with_data_dir(tmp.path().to_path_buf());
    service
        .snippet_save(
            "delete-series",
            r#"async () => api.sonarr.delete("/api/v3/series/1")"#,
            None,
        )
        .await
        .unwrap();
    let planned = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));

    service
        .codemode_with_guard(
            r#"async () => codemode.run("delete-series", {})"#,
            std::sync::Arc::new(DataDependentPlanningGuard {
                planned: std::sync::Arc::clone(&planned),
            }),
        )
        .await
        .unwrap();

    assert_eq!(*planned.lock().unwrap(), vec!["sonarr"]);
    assert_eq!(
        *requests.lock().unwrap(),
        vec!["DELETE"],
        "outer planning must expand saved source without executing it"
    );
}

#[tokio::test(flavor = "multi_thread", worker_threads = 1)]
async fn guarded_planning_does_not_block_the_tokio_worker() {
    let service = loopback_state().service.with_codemode_limits(
        1,
        std::time::Duration::from_millis(10),
        std::time::Duration::from_millis(80),
    );
    let run = tokio::spawn(async move {
        service
            .codemode_with_guard(
                "async () => { for (;;) {} }",
                std::sync::Arc::new(PreflightRecordingGuard {
                    calls: std::sync::Arc::new(std::sync::Mutex::new(0)),
                }),
            )
            .await
    });

    tokio::task::yield_now().await;
    tokio::time::timeout(std::time::Duration::from_millis(20), async {
        tokio::task::yield_now().await;
        tokio::time::sleep(std::time::Duration::from_millis(1)).await;
    })
    .await
    .expect("QuickJS planning must yield the sole Tokio worker");
    assert!(
        run.await.unwrap().is_err(),
        "the bounded planning run times out"
    );
}
