use super::super::*;
#[tokio::test]
async fn health_is_served_without_auth() {
    let response = router(super::metrics_state())
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .expect("request should build"),
        )
        .await
        .expect("router should respond");

    assert_eq!(response.status(), axum::http::StatusCode::OK);
}

#[tokio::test]
async fn metrics_is_served_without_auth() {
    let response = router(super::metrics_state())
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .expect("request should build"),
        )
        .await
        .expect("router should respond");

    assert_eq!(response.status(), axum::http::StatusCode::OK);
}

#[tokio::test]
async fn metrics_exposition_carries_yarr_prefix() {
    // Record a request first so the prometheus recorder has an observed sample
    // (the metric handle is a process-global `OnceLock`, so this populates the
    // same registry the `/metrics` handler renders from).
    router(super::metrics_state())
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .expect("request should build"),
        )
        .await
        .expect("warmup request should respond");

    let response = router(super::metrics_state())
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .expect("request should build"),
        )
        .await
        .expect("router should respond");
    assert_eq!(response.status(), axum::http::StatusCode::OK);

    // The body must be Prometheus exposition carrying the `yarr` prefix —
    // guards against the handler rendering empty or the OnceLock prefix wiring
    // silently dropping out (both would still return 200).
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("metrics body should read");
    let text = String::from_utf8(body.to_vec()).expect("metrics body should be UTF-8");
    assert!(
        text.contains("yarr"),
        "metrics exposition should carry the yarr prefix, got: {text:?}"
    );
}
#[tokio::test]
async fn domain_metrics_are_not_double_prefixed() {
    // Constructing the router installs the process-global recorder. Registering
    // a metric before this point would intentionally hit metrics' no-op recorder.
    let app = router(super::metrics_state());
    axum_prometheus::metrics::counter!(
        "yarr_snippet_operations_total",
        "operation" => "test",
        "outcome" => "success"
    )
    .increment(1);
    let response = app
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let text = String::from_utf8(body.to_vec()).unwrap();
    assert!(text.contains("yarr_snippet_operations_total"), "{text}");
    assert!(
        !text.contains("yarr_yarr_snippet_operations_total"),
        "{text}"
    );
}

#[tokio::test]
async fn upstream_metrics_include_bounded_instance_labels_and_latency() {
    let state = super::metrics_state();
    let app = router(state.clone());
    let _ = state.service.service_status("sonarr").await;
    let response = app
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let text = String::from_utf8(body.to_vec()).unwrap();
    assert!(
        text.contains("yarr_upstream_request_duration_seconds"),
        "{text}"
    );
    assert!(text.contains("service=\"sonarr\""), "{text}");
    assert!(text.contains("kind=\"sonarr\""), "{text}");
}
