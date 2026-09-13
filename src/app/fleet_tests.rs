use std::{
    pin::Pin,
    sync::{
        Arc, Mutex,
        atomic::{AtomicUsize, Ordering},
    },
};

use axum::{Router, routing::any};
use serde_json::json;

use crate::{
    actions::YarrAction,
    app::codemode::CodeModeCallGuard,
    config::{ServiceConfig, ServiceKind, YarrConfig},
    fleet::{FleetInvocation, FleetSelector, PlannedFleetLeaf},
    yarr::YarrClient,
};

fn fleet_service(url: String, names: &[&str]) -> super::YarrService {
    let config = YarrConfig {
        services: names
            .iter()
            .map(|name| ServiceConfig {
                name: (*name).to_owned(),
                kind: ServiceKind::Sonarr,
                base_url: url.clone(),
                api_key: Some("test".to_owned()),
                ..Default::default()
            })
            .collect(),
    };
    super::YarrService::new(YarrClient::new(&config).unwrap(), config)
}

struct RecordingGuard {
    planned: Arc<Mutex<Vec<String>>>,
    runtime: Arc<Mutex<Vec<String>>>,
    aggregate: Arc<Mutex<Vec<Vec<String>>>>,
    permitted: std::collections::BTreeSet<String>,
}

impl CodeModeCallGuard for RecordingGuard {
    fn authorize<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let runtime = Arc::clone(&self.runtime);
        let permitted = self.permitted.clone();
        Box::pin(async move {
            let service = action_service(action).to_owned();
            runtime.lock().unwrap().push(service.clone());
            if matches!(action, YarrAction::ApiDelete { .. }) && !permitted.contains(&service) {
                return Err(format!("{service} was not authorized by preflight"));
            }
            Ok(())
        })
    }
    fn authorize_planning_action<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let planned = Arc::clone(&self.planned);
        Box::pin(async move {
            planned
                .lock()
                .unwrap()
                .push(action_service(action).to_owned());
            Ok(())
        })
    }
    fn planned_destructive_target(&self, action: &YarrAction) -> Option<String> {
        matches!(action, YarrAction::ApiDelete { .. }).then(|| action_service(action).to_owned())
    }
    fn authorize_planned_targets<'a>(
        &'a self,
        targets: Vec<String>,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let aggregate = Arc::clone(&self.aggregate);
        Box::pin(async move {
            aggregate.lock().unwrap().push(targets);
            Ok(())
        })
    }
}

struct DenyingStatusGuard {
    runtime: Arc<Mutex<Vec<String>>>,
}

impl CodeModeCallGuard for DenyingStatusGuard {
    fn authorize<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        let runtime = Arc::clone(&self.runtime);
        Box::pin(async move {
            if matches!(action, YarrAction::ServiceStatus { .. }) {
                let service = action_service(action).to_owned();
                runtime.lock().unwrap().push(service.clone());
                return Err(format!("status for {service} denied"));
            }
            Ok(())
        })
    }

    fn authorize_planning_action<'a>(
        &'a self,
        _action: &'a YarrAction,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async { Ok(()) })
    }
}

fn action_service(action: &YarrAction) -> &str {
    match action {
        YarrAction::ServiceStatus { service }
        | YarrAction::ApiGet { service, .. }
        | YarrAction::ApiPost { service, .. }
        | YarrAction::ApiPut { service, .. }
        | YarrAction::ApiDelete { service, .. }
        | YarrAction::Op { service, .. } => service,
        YarrAction::Curated { params, .. } => params["service"].as_str().unwrap(),
        _ => panic!("fleet action must target a service"),
    }
}

#[tokio::test]
async fn private_fleet_bridge_plans_every_host_leaf_and_is_not_a_public_action() {
    let requests = Arc::new(AtomicUsize::new(0));
    let observed = Arc::clone(&requests);
    let app = Router::new().fallback(any(move || {
        let observed = Arc::clone(&observed);
        async move {
            observed.fetch_add(1, Ordering::SeqCst);
            axum::Json(json!({"version":"ok"}))
        }
    }));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let service = fleet_service(url, &["charlie", "alpha", "bravo"]);

    let result = service
        .codemode(r#"async () => fleet.map(fleet.all(), "service_status")"#)
        .await
        .unwrap();
    let leaves = result["result"].as_array().unwrap();
    assert_eq!(
        leaves
            .iter()
            .map(|v| v["service"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["alpha", "bravo", "charlie"]
    );
    assert_eq!(requests.load(Ordering::SeqCst), 3);
    assert!(!crate::actions::all_action_names().contains(&"fleet.map"));
    assert!(crate::YarrAction::from_mcp_args(&json!({"action":"fleet.map"})).is_err());
}

#[tokio::test]
async fn dispatcher_is_bounded_concurrent_and_returns_plan_order_after_inverted_completion() {
    let active = Arc::new(AtomicUsize::new(0));
    let peak = Arc::new(AtomicUsize::new(0));
    let mut services = Vec::new();
    for (name, delay_ms) in [
        ("delta", 10),
        ("alpha", 80),
        ("echo", 5),
        ("bravo", 60),
        ("charlie", 40),
    ] {
        let active_for_server = Arc::clone(&active);
        let peak_for_server = Arc::clone(&peak);
        let app = Router::new().fallback(any(move || {
            let active = Arc::clone(&active_for_server);
            let peak = Arc::clone(&peak_for_server);
            async move {
                let now = active.fetch_add(1, Ordering::SeqCst) + 1;
                peak.fetch_max(now, Ordering::SeqCst);
                tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                active.fetch_sub(1, Ordering::SeqCst);
                axum::Json(json!({"service": name}))
            }
        }));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
        services.push(ServiceConfig {
            name: name.to_owned(),
            kind: ServiceKind::Sonarr,
            base_url: url,
            api_key: Some("test".to_owned()),
            ..Default::default()
        });
    }
    let config = YarrConfig { services };
    let service = super::YarrService::new(YarrClient::new(&config).unwrap(), config);
    let results = service
        .dispatch_fleet(FleetInvocation {
            selector: FleetSelector::All { kind: None },
            action: "service_status".to_owned(),
            params: Default::default(),
        })
        .await
        .unwrap();
    assert!(
        peak.load(Ordering::SeqCst) > 1,
        "dispatcher must actually overlap leaf work"
    );
    assert!(peak.load(Ordering::SeqCst) <= super::FLEET_MAX_CONCURRENT);
    assert_eq!(
        results
            .iter()
            .map(|r| r.service.as_str())
            .collect::<Vec<_>>(),
        ["alpha", "bravo", "charlie", "delta", "echo"]
    );
    assert!(results.iter().all(|r| r.ok && !r.truncated));
}

#[test]
fn oversized_fleet_result_serializes_a_top_level_truncation_envelope() {
    let original =
        json!(["credential-that-must-not-appear".repeat(super::FLEET_VALUE_LIMIT_BYTES + 1,)]);
    let observed_bytes = serde_json::to_vec(&original).unwrap().len();
    let result = super::fleet_result(
        PlannedFleetLeaf {
            service: "alpha".to_owned(),
            kind: ServiceKind::Sonarr,
            action: YarrAction::ServiceStatus {
                service: "alpha".to_owned(),
            },
        },
        std::time::Duration::ZERO,
        Ok(Ok(original)),
    );

    let serialized = serde_json::to_value(result).unwrap();
    assert_eq!(serialized["truncated"], true);
    assert_eq!(
        serialized["summary"],
        json!({"type":"array","item_count":1,"observed_bytes":observed_bytes})
    );
    assert_eq!(serialized["value"], serde_json::Value::Null);
    assert!(
        !serialized
            .to_string()
            .contains("credential-that-must-not-appear")
    );
}

#[tokio::test]
async fn guarded_fleet_preflight_and_runtime_authorize_every_leaf() {
    let app = Router::new().fallback(any(|| async { axum::Json(json!({"version":"ok"})) }));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let service = fleet_service(url, &["charlie", "alpha", "bravo"]);
    let guard = Arc::new(RecordingGuard {
        planned: Arc::new(Mutex::new(vec![])),
        runtime: Arc::new(Mutex::new(vec![])),
        aggregate: Arc::new(Mutex::new(vec![])),
        permitted: Default::default(),
    });

    service
        .codemode_with_guard(
            r#"async () => fleet.map(fleet.all(), "service_status")"#,
            guard.clone(),
        )
        .await
        .unwrap();
    assert_eq!(
        *guard.planned.lock().unwrap(),
        ["alpha", "bravo", "charlie"]
    );
    // Read leaves execute once in preflight to preserve branch semantics and once at runtime.
    assert_eq!(
        *guard.runtime.lock().unwrap(),
        ["alpha", "bravo", "charlie", "alpha", "bravo", "charlie"]
    );
    assert_eq!(*guard.aggregate.lock().unwrap(), vec![Vec::<String>::new()]);
}

#[tokio::test]
async fn guarded_fleet_status_denies_every_runtime_leaf_before_transport() {
    let requests = Arc::new(AtomicUsize::new(0));
    let observed = Arc::clone(&requests);
    let app = Router::new().fallback(any(move || {
        let observed = Arc::clone(&observed);
        async move {
            observed.fetch_add(1, Ordering::SeqCst);
            axum::Json(json!({"version":"must-not-reach-transport"}))
        }
    }));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let service = fleet_service(url, &["charlie", "alpha", "bravo"]);
    let runtime = Arc::new(Mutex::new(vec![]));
    let guard: Arc<dyn CodeModeCallGuard> = Arc::new(DenyingStatusGuard {
        runtime: Arc::clone(&runtime),
    });

    let result = service
        .codemode_with_guard(r#"async () => fleet.status()"#, Arc::clone(&guard))
        .await
        .unwrap();

    assert!(
        result["result"]
            .as_array()
            .unwrap()
            .iter()
            .all(|leaf| !leaf["ok"].as_bool().unwrap())
    );
    let mut guarded = runtime.lock().unwrap().clone();
    guarded.sort();
    assert_eq!(
        guarded,
        ["alpha", "alpha", "bravo", "bravo", "charlie", "charlie"]
    );
    assert_eq!(requests.load(Ordering::SeqCst), 0);
}

#[tokio::test]
async fn fleet_status_returns_one_canonical_record_per_configured_service() {
    let app = Router::new().fallback(any(|| async { axum::Json(json!({"version":"2026.9.11"})) }));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let service = fleet_service(url, &["charlie", "alpha", "bravo"]);

    let statuses = service.fleet_status().await.unwrap();
    assert_eq!(statuses.len(), 3);
    let serialized = serde_json::to_value(statuses).unwrap();
    assert_eq!(
        serialized
            .as_array()
            .unwrap()
            .iter()
            .map(|status| status["service"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["alpha", "bravo", "charlie"]
    );
    for status in serialized.as_array().unwrap() {
        assert_eq!(status["kind"], "sonarr");
        assert_eq!(status["reachable"], true);
        assert_eq!(status["version"], "2026.9.11");
        assert!(status["latency_ms"].is_number(), "{status}");
    }
}

#[tokio::test]
async fn destructive_fleet_preflight_aggregates_sorted_targets_once_before_runtime() {
    let requests = Arc::new(AtomicUsize::new(0));
    let observed = Arc::clone(&requests);
    let app = Router::new().fallback(any(move || {
        let observed = Arc::clone(&observed);
        async move {
            observed.fetch_add(1, Ordering::SeqCst);
            axum::Json(json!({"deleted": true}))
        }
    }));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let service = fleet_service(url, &["charlie", "alpha", "bravo"]);
    let guard = Arc::new(RecordingGuard {
        planned: Arc::new(Mutex::new(vec![])),
        runtime: Arc::new(Mutex::new(vec![])),
        aggregate: Arc::new(Mutex::new(vec![])),
        permitted: ["alpha".to_owned(), "bravo".to_owned(), "charlie".to_owned()]
            .into_iter()
            .collect(),
    });
    service
        .codemode_with_guard(
            r#"async () => fleet.map(fleet.all(), "api_delete", {path: "/api/v3/series/1"})"#,
            guard.clone(),
        )
        .await
        .unwrap();
    assert_eq!(
        *guard.planned.lock().unwrap(),
        ["alpha", "bravo", "charlie"]
    );
    assert_eq!(
        *guard.aggregate.lock().unwrap(),
        vec![vec![
            "alpha".to_owned(),
            "bravo".to_owned(),
            "charlie".to_owned()
        ]]
    );
    assert_eq!(
        *guard.runtime.lock().unwrap(),
        ["alpha", "bravo", "charlie"]
    );
    assert_eq!(
        requests.load(Ordering::SeqCst),
        3,
        "no mutation occurs during planning"
    );
}

#[tokio::test]
async fn leaf_failures_and_timeouts_have_distinct_envelopes() {
    let leaf = || PlannedFleetLeaf {
        service: "alpha".to_owned(),
        kind: ServiceKind::Sonarr,
        action: YarrAction::ServiceStatus {
            service: "alpha".to_owned(),
        },
    };
    let failed = super::fleet_result(
        leaf(),
        std::time::Duration::ZERO,
        Ok(Err(anyhow::anyhow!("upstream broke"))),
    );
    let timed_out = super::fleet_result(
        leaf(),
        std::time::Duration::ZERO,
        tokio::time::timeout(
            std::time::Duration::ZERO,
            std::future::pending::<anyhow::Result<serde_json::Value>>(),
        )
        .await,
    );
    assert!(!failed.ok && !timed_out.ok);
    assert_eq!(failed.value, serde_json::Value::Null);
    assert_eq!(timed_out.value, serde_json::Value::Null);
    assert!(!failed.truncated);
    assert!(!timed_out.truncated);
    let failed_serialized = serde_json::to_value(failed).unwrap();
    let timed_out_serialized = serde_json::to_value(timed_out).unwrap();
    for serialized in [&failed_serialized, &timed_out_serialized] {
        assert!(serialized.get("summary").is_none());
        assert_eq!(serialized["truncated"], false);
        assert_eq!(serialized["value"], serde_json::Value::Null);
    }
    assert_eq!(failed_serialized["error"], "upstream broke");
    assert_eq!(timed_out_serialized["error"], "fleet instance timed out");
}

#[tokio::test]
async fn destructive_leaf_not_preflight_authorized_fails_before_transport() {
    let requests = Arc::new(AtomicUsize::new(0));
    let observed = Arc::clone(&requests);
    let app = Router::new().fallback(any(move || {
        let observed = Arc::clone(&observed);
        async move {
            observed.fetch_add(1, Ordering::SeqCst);
            axum::Json(json!({}))
        }
    }));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let service = fleet_service(
        format!("http://{}", listener.local_addr().unwrap()),
        &["alpha"],
    );
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let plan = service
        .plan_fleet(FleetInvocation {
            selector: FleetSelector::All { kind: None },
            action: "api_delete".to_owned(),
            params: serde_json::from_value(json!({"path":"/api/v3/series/1"})).unwrap(),
        })
        .unwrap();
    let guard = Arc::new(RecordingGuard {
        planned: Arc::new(Mutex::new(vec![])),
        runtime: Arc::new(Mutex::new(vec![])),
        aggregate: Arc::new(Mutex::new(vec![])),
        permitted: Default::default(),
    });
    let results = service.dispatch_planned_fleet(plan, Some(guard)).await;
    assert!(!results[0].ok);
    assert!(
        results[0]
            .error
            .as_deref()
            .unwrap()
            .contains("not authorized by preflight")
    );
    assert_eq!(requests.load(Ordering::SeqCst), 0);
}
