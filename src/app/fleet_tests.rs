//! Fleet bridge behavior: planning, bounds, batch authorization, exactly-once
//! execution, timeouts, truncation, and status metadata — all through the
//! public app layer with loopback mock upstreams.

use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

use serde_json::{Value, json};

use super::{FLEET_MAX_CONCURRENT, FLEET_MAX_TARGETS};
use crate::app::YarrService;
use crate::app::codemode::CodeModeCallGuard;
use crate::config::{ServiceConfig, ServiceKind, YarrConfig};
use crate::fleet::{
    FleetInvocation, FleetLeafLabel, FleetSelector, PlannedFleetInvocation, PlannedFleetLeaf,
};

// ---------------------------------------------------------------------------
// Helpers: loopback upstreams + services + guards.
// ---------------------------------------------------------------------------

/// Counting stub that always answers with `body` after `delay`, and tracks the
/// highest number of concurrent in-flight requests it ever saw.
async fn counted_upstream(
    body: &'static str,
    delay: Duration,
) -> (
    String,
    Arc<AtomicUsize>,
    Arc<AtomicUsize>,
    tokio::task::JoinHandle<()>,
) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let total = Arc::new(AtomicUsize::new(0));
    let in_flight = Arc::new(AtomicUsize::new(0));
    let max_in_flight = Arc::new(AtomicUsize::new(0));
    let handle = {
        let total = total.clone();
        let in_flight = in_flight.clone();
        let max_in_flight = max_in_flight.clone();
        tokio::spawn(async move {
            loop {
                let Ok((mut stream, _)) = listener.accept().await else {
                    break;
                };
                total.fetch_add(1, Ordering::SeqCst);
                let current = in_flight.fetch_add(1, Ordering::SeqCst) + 1;
                max_in_flight.fetch_max(current, Ordering::SeqCst);
                let in_flight = in_flight.clone();
                tokio::spawn(async move {
                    use tokio::io::{AsyncReadExt, AsyncWriteExt};
                    let mut request = [0_u8; 2048];
                    let _ = stream.read(&mut request).await;
                    if !delay.is_zero() {
                        tokio::time::sleep(delay).await;
                    }
                    let response = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                        body.len()
                    );
                    let _ = stream.write_all(response.as_bytes()).await;
                    let _ = stream.write_all(body.as_bytes()).await;
                    in_flight.fetch_sub(1, Ordering::SeqCst);
                });
            }
        })
    };
    (format!("http://{addr}"), total, max_in_flight, handle)
}

/// Stub that accepts connections but never responds (per-leaf timeout probe).
async fn hanging_upstream() -> (String, Arc<AtomicUsize>, tokio::task::JoinHandle<()>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let total = Arc::new(AtomicUsize::new(0));
    let handle = {
        let total = total.clone();
        tokio::spawn(async move {
            loop {
                let Ok((stream, _)) = listener.accept().await else {
                    break;
                };
                total.fetch_add(1, Ordering::SeqCst);
                tokio::spawn(async move {
                    let _hold = stream;
                    std::future::pending::<()>().await;
                });
            }
        })
    };
    (format!("http://{addr}"), total, handle)
}

fn fleet_service(entries: &[(&str, ServiceKind, &str)]) -> YarrService {
    let config = YarrConfig {
        services: entries
            .iter()
            .map(|(name, kind, base_url)| ServiceConfig {
                name: (*name).to_string(),
                kind: *kind,
                base_url: (*base_url).to_string(),
                api_key: Some("upstream-secret".into()),
                ..Default::default()
            })
            .collect(),
    };
    let client = crate::yarr::YarrClient::new(&config).expect("stub client builds");
    YarrService::new(client, config)
}

fn invocation(selector: FleetSelector, action: &str, params: Value) -> FleetInvocation {
    FleetInvocation {
        selector,
        action: action.to_owned(),
        params: params.as_object().cloned().unwrap_or_default(),
    }
}

fn leaf_action(json: Value) -> crate::actions::YarrAction {
    crate::actions::YarrAction::from_mcp_args(&json).expect("leaf action parses")
}

/// Trusted local (guard-less) dispatch through the same plan → frozen-set path
/// the CLI/bridge uses; `None` guard keeps documented local-trust behavior.
async fn dispatch_fleet(
    service: &crate::app::YarrService,
    invocation: crate::fleet::FleetInvocation,
) -> anyhow::Result<Vec<crate::fleet::FleetResult>> {
    let plan = service.plan_fleet(invocation)?;
    service.dispatch_fleet_plan(plan, None).await
}

/// Recordable guard: counts scope checks, records every destructive batch it is
/// asked to authorize, and can be configured to deny either phase.
#[derive(Default)]
struct RecordingGuard {
    scope_calls: AtomicUsize,
    batches: std::sync::Mutex<Vec<Vec<FleetLeafLabel>>>,
    scope_deny: Option<String>,
    batch_deny: Option<String>,
}

impl RecordingGuard {
    fn denying_scope(reason: &str) -> Self {
        Self {
            scope_deny: Some(reason.to_owned()),
            ..Default::default()
        }
    }

    fn denying_batch(reason: &str) -> Self {
        Self {
            batch_deny: Some(reason.to_owned()),
            ..Default::default()
        }
    }

    fn batches(&self) -> Vec<Vec<FleetLeafLabel>> {
        self.batches.lock().unwrap().clone()
    }

    fn scope_calls(&self) -> usize {
        self.scope_calls.load(Ordering::SeqCst)
    }
}

impl CodeModeCallGuard for RecordingGuard {
    fn authorize<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move { Ok(()) })
    }

    fn authorize_leaf_scope<'a>(
        &'a self,
        _action: &'a crate::actions::YarrAction,
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            self.scope_calls.fetch_add(1, Ordering::SeqCst);
            match &self.scope_deny {
                Some(reason) => Err(reason.clone()),
                None => Ok(()),
            }
        })
    }

    fn authorize_destructive_leaves<'a>(
        &'a self,
        leaves: &'a [FleetLeafLabel],
    ) -> std::pin::Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>> {
        Box::pin(async move {
            self.batches.lock().unwrap().push(leaves.to_vec());
            match &self.batch_deny {
                Some(reason) => Err(reason.clone()),
                None => Ok(()),
            }
        })
    }
}

// ---------------------------------------------------------------------------
// Planning: exact identities, kind filters, bounds.
// ---------------------------------------------------------------------------

#[tokio::test]
async fn plan_requires_exact_configured_identity_or_matching_kind() {
    let (url, _total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let service = fleet_service(&[
        ("sonarr-a", ServiceKind::Sonarr, &url),
        ("sonarr-b", ServiceKind::Sonarr, &url),
        ("jellyfin", ServiceKind::Jellyfin, &url),
    ]);

    let error = service
        .plan_fleet(invocation(
            FleetSelector::Of {
                name: "sonarr".to_owned(),
            },
            "service_status",
            json!({}),
        ))
        .expect_err("non-exact identity must fail");
    assert!(
        error
            .to_string()
            .contains("exact configured service identity"),
        "{error:#}"
    );

    let plan = service
        .plan_fleet(invocation(
            FleetSelector::All {
                kind: Some(ServiceKind::Sonarr),
            },
            "service_status",
            json!({}),
        ))
        .expect("kind selector resolves");
    let names: Vec<&str> = plan
        .leaves()
        .iter()
        .map(|leaf| leaf.service.as_str())
        .collect();
    assert_eq!(names, vec!["sonarr-a", "sonarr-b"], "sorted by identity");
    for leaf in plan.leaves() {
        assert_eq!(leaf.action_service(), leaf.service);
    }

    let none = service
        .plan_fleet(invocation(
            FleetSelector::All {
                kind: Some(ServiceKind::Tautulli),
            },
            "service_status",
            json!({}),
        ))
        .expect_err("empty selector must fail");
    assert!(none.to_string().contains("matched no configured services"));
}

#[tokio::test]
async fn plan_bound_is_pinned_and_enforced() {
    assert_eq!(FLEET_MAX_TARGETS, 32);
    let (url, _total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let entries: Vec<(String, ServiceKind, String)> = (0..=FLEET_MAX_TARGETS)
        .map(|index| (format!("svc-{index:02}"), ServiceKind::Sonarr, url.clone()))
        .collect();
    let services: Vec<(&str, ServiceKind, &str)> = entries
        .iter()
        .map(|(name, kind, url)| (name.as_str(), *kind, url.as_str()))
        .collect();
    let service = fleet_service(&services);
    let error = service
        .plan_fleet(invocation(
            FleetSelector::All { kind: None },
            "service_status",
            json!({}),
        ))
        .expect_err("over-bound selector must fail");
    assert!(error.to_string().contains("the bound is 32"), "{error:#}");
}

#[tokio::test]
async fn map_rejects_an_inadmissible_leaf_before_any_execution() {
    let (url, total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let service = fleet_service(&[
        ("sonarr", ServiceKind::Sonarr, &url),
        ("radarr", ServiceKind::Radarr, &url),
    ]);
    let error = dispatch_fleet(
        &service,
        invocation(
            FleetSelector::All { kind: None },
            "api_get",
            json!({"path": "/api/v3/not-a-generated-route"}),
        ),
    )
    .await
    .expect_err("inadmissible leaf rejects the map");
    let message = error.to_string();
    assert!(message.contains("rejected before execution"), "{message}");
    assert!(
        message.contains("no unique generated operation match"),
        "policy denial must be distinguishable: {message}"
    );
    assert_eq!(total.load(Ordering::SeqCst), 0, "nothing may execute");
}

// ---------------------------------------------------------------------------
// Execution: exactly-once, ordering, metadata, truncation, bounds.
// ---------------------------------------------------------------------------

#[tokio::test]
async fn map_runs_every_leaf_exactly_once_with_status_metadata() {
    let (url, total, _max, _handle) =
        counted_upstream(r#"{"version":"4.0.0"}"#, Duration::ZERO).await;
    let service = fleet_service(&[
        ("sonarr", ServiceKind::Sonarr, &url),
        ("radarr", ServiceKind::Radarr, &url),
        ("prowlarr", ServiceKind::Prowlarr, &url),
    ]);
    let results = dispatch_fleet(
        &service,
        invocation(
            FleetSelector::All { kind: None },
            "service_status",
            json!({}),
        ),
    )
    .await
    .expect("map dispatches");
    assert_eq!(results.len(), 3);
    assert_eq!(total.load(Ordering::SeqCst), 3, "exactly once per leaf");
    let names: Vec<&str> = results.iter().map(|r| r.service.as_str()).collect();
    assert_eq!(names, vec!["prowlarr", "radarr", "sonarr"], "ordered");
    for result in &results {
        assert!(result.ok, "{result:?}");
        assert!(result.reachable == Some(true));
        assert!(result.latency_ms.is_some());
        assert!(!result.truncated);
    }
}

#[test]
fn status_version_reads_both_known_shapes() {
    assert_eq!(
        super::status_version(&json!({"version": "1.2.3"})),
        Some(json!("1.2.3"))
    );
    assert_eq!(
        super::status_version(&json!({"response": {"data": {"version": "9.9"}}})),
        Some(json!("9.9"))
    );
    assert_eq!(super::status_version(&json!({"other": true})), None);
}

#[tokio::test]
async fn oversized_leaf_values_truncate_with_usable_metadata() {
    // ~12 KiB array: above the 8 KiB per-leaf limit.
    let big = format!(
        "[{}]",
        (0..3000)
            .map(|index| index.to_string())
            .collect::<Vec<_>>()
            .join(",")
    );
    let big: &'static str = Box::leak(big.into_boxed_str());
    let (url, _total, _max, _handle) = counted_upstream(big, Duration::ZERO).await;
    let service = fleet_service(&[("sonarr", ServiceKind::Sonarr, &url)]);
    let results = dispatch_fleet(
        &service,
        invocation(
            FleetSelector::Of {
                name: "sonarr".to_owned(),
            },
            "api_get",
            json!({"path": "/api/v3/system/status"}),
        ),
    )
    .await
    .expect("map dispatches");
    let result = &results[0];
    assert!(result.ok, "{result:?}");
    assert!(result.truncated);
    assert!(
        result.value.is_null(),
        "truncated payload is not silently cut"
    );
    let summary = result.summary.as_ref().expect("summary metadata");
    assert_eq!(summary.value_type, "array");
    assert_eq!(summary.item_count, 3000);
    assert!(summary.observed_bytes > super::FLEET_VALUE_LIMIT_BYTES);
}

#[tokio::test]
async fn map_concurrency_stays_within_the_bound() {
    let (url, total, max_in_flight, _handle) =
        counted_upstream(r#"{"ok":true}"#, Duration::from_millis(250)).await;
    let entries: Vec<(String, ServiceKind, String)> = (0..8)
        .map(|index| (format!("svc-{index}"), ServiceKind::Sonarr, url.clone()))
        .collect();
    let services: Vec<(&str, ServiceKind, &str)> = entries
        .iter()
        .map(|(name, kind, url)| (name.as_str(), *kind, url.as_str()))
        .collect();
    let service = fleet_service(&services);
    let results = dispatch_fleet(
        &service,
        invocation(
            FleetSelector::All { kind: None },
            "service_status",
            json!({}),
        ),
    )
    .await
    .expect("map dispatches");
    assert_eq!(results.len(), 8);
    assert_eq!(total.load(Ordering::SeqCst), 8);
    let observed_max = max_in_flight.load(Ordering::SeqCst);
    assert!(
        observed_max <= FLEET_MAX_CONCURRENT,
        "bound violated: {observed_max} in flight"
    );
    assert!(
        observed_max >= 2,
        "expected real parallelism, saw {observed_max}"
    );
}

#[tokio::test]
async fn per_leaf_timeout_preserves_partial_results() {
    let (good, _good_total, _max, _good_handle) =
        counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let (hang, _hang_total, _hang_handle) = hanging_upstream().await;
    let service = fleet_service(&[
        ("alpha", ServiceKind::Sonarr, &good),
        ("beta", ServiceKind::Radarr, &hang),
    ])
    .with_fleet_timeout(Duration::from_millis(300));
    let started = std::time::Instant::now();
    let results = dispatch_fleet(
        &service,
        invocation(
            FleetSelector::All { kind: None },
            "service_status",
            json!({}),
        ),
    )
    .await
    .expect("map dispatches");
    assert!(started.elapsed() < Duration::from_secs(10));
    assert_eq!(results.len(), 2, "partial results preserved");
    let alpha = results.iter().find(|r| r.service == "alpha").unwrap();
    let beta = results.iter().find(|r| r.service == "beta").unwrap();
    assert!(alpha.ok, "{alpha:?}");
    assert!(!beta.ok);
    assert_eq!(
        beta.error.as_deref(),
        Some("fleet instance timed out"),
        "reachability failure distinguishable from policy denial"
    );
}

// ---------------------------------------------------------------------------
// Authorization: exact frozen destructive set, one batch, fail closed.
// ---------------------------------------------------------------------------

fn mixed_plan() -> PlannedFleetInvocation {
    // One destructive leaf (Sonarr backup restore) and one read leaf, frozen
    // into a single invocation exactly like `fleet.map` would.
    PlannedFleetInvocation {
        leaves: vec![
            PlannedFleetLeaf {
                service: "sonarr".to_owned(),
                kind: ServiceKind::Sonarr,
                action: leaf_action(json!({
                    "action": "api_post",
                    "service": "sonarr",
                    "path": "/api/v3/system/backup/restore/7",
                    "body": {}
                })),
            },
            PlannedFleetLeaf {
                service: "sonarr".to_owned(),
                kind: ServiceKind::Sonarr,
                action: leaf_action(json!({"action": "service_status", "service": "sonarr"})),
            },
        ],
    }
}

#[tokio::test]
async fn batch_denial_denies_only_the_destructive_leaves() {
    let (url, total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let service = fleet_service(&[("sonarr", ServiceKind::Sonarr, &url)]);
    let guard = Arc::new(RecordingGuard::denying_batch("user declined the batch"));
    let results = service
        .dispatch_fleet_plan(mixed_plan(), Some(guard.clone()))
        .await
        .expect("denial is a per-leaf result, not a whole-map rejection");
    let denied = &results[0];
    assert!(!denied.ok);
    assert!(
        denied.error.as_deref().is_some_and(
            |error| error.contains("destructive authorization denied at the fleet boundary")
        ),
        "{denied:?}"
    );
    assert!(results[1].ok, "the read leaf still runs: {results:?}");
    assert_eq!(
        total.load(Ordering::SeqCst),
        1,
        "the denied leaf never executed"
    );

    let batches = guard.batches();
    assert_eq!(batches.len(), 1, "exactly one batch prompt");
    assert_eq!(
        batches[0],
        vec![FleetLeafLabel {
            service: "sonarr".to_owned(),
            action: "api_post".to_owned()
        }],
        "the batch is exactly the frozen destructive set"
    );
    // Authority is exact: only the destructive leaf was ever offered.
    assert_eq!(guard.scope_calls(), 2, "scope is enforced per leaf");
}

#[tokio::test]
async fn batch_accept_runs_the_exact_destructive_set_once() {
    let (url, total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let service = fleet_service(&[("sonarr", ServiceKind::Sonarr, &url)]);
    let guard = Arc::new(RecordingGuard::default());
    let results = service
        .dispatch_fleet_plan(mixed_plan(), Some(guard.clone()))
        .await
        .expect("accepted batch dispatches");
    assert!(results.iter().all(|result| result.ok), "{results:?}");
    assert_eq!(total.load(Ordering::SeqCst), 2, "each leaf exactly once");
    assert_eq!(guard.batches().len(), 1);
}

#[tokio::test]
async fn scope_denial_rejects_the_whole_map_before_execution() {
    let (url, total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let service = fleet_service(&[("sonarr", ServiceKind::Sonarr, &url)]);
    let guard = Arc::new(RecordingGuard::denying_scope("requires scope yarr:write"));
    let error = service
        .dispatch_fleet_plan(mixed_plan(), Some(guard.clone()))
        .await
        .expect_err("scope denial rejects the map");
    assert!(
        error.to_string().contains("rejected before execution")
            && error.to_string().contains("requires scope yarr:write"),
        "{error:#}"
    );
    assert_eq!(total.load(Ordering::SeqCst), 0, "nothing may execute");
    assert!(
        guard.batches().is_empty(),
        "no destructive prompt when the map cannot even start"
    );
}

#[tokio::test]
async fn non_destructive_maps_never_request_a_batch_prompt() {
    let (url, _total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let service = fleet_service(&[
        ("sonarr", ServiceKind::Sonarr, &url),
        ("radarr", ServiceKind::Radarr, &url),
    ]);
    let guard = Arc::new(RecordingGuard::default());
    let results = service
        .dispatch_fleet_plan(
            {
                let mut plan = PlannedFleetInvocation { leaves: Vec::new() };
                for name in ["sonarr", "radarr"] {
                    plan.leaves.push(PlannedFleetLeaf {
                        service: name.to_owned(),
                        kind: if name == "sonarr" {
                            ServiceKind::Sonarr
                        } else {
                            ServiceKind::Radarr
                        },
                        action: leaf_action(json!({"action": "service_status", "service": name})),
                    });
                }
                plan
            },
            Some(guard.clone()),
        )
        .await
        .expect("read-only map dispatches");
    assert_eq!(results.len(), 2);
    assert!(results.iter().all(|result| result.ok));
    assert!(
        guard.batches().is_empty(),
        "no destructive leaves → no prompt"
    );
    assert_eq!(guard.scope_calls(), 2);
}

#[tokio::test]
async fn local_cli_dispatch_runs_without_a_guard() {
    // CLI keeps its documented local-trust behavior: no guard, no prompt.
    let (url, total, _max, _handle) = counted_upstream(r#"{"ok":true}"#, Duration::ZERO).await;
    let service = fleet_service(&[("sonarr", ServiceKind::Sonarr, &url)]);
    let results = dispatch_fleet(
        &service,
        invocation(
            FleetSelector::Of {
                name: "sonarr".to_owned(),
            },
            "api_post",
            json!({"path": "/api/v3/system/backup/restore/7", "body": {}}),
        ),
    )
    .await
    .expect("local dispatch");
    assert_eq!(results.len(), 1);
    assert!(results[0].ok, "{results:?}");
    assert_eq!(total.load(Ordering::SeqCst), 1);
}
