use super::*;
use crate::config::ServiceKind;

#[test]
fn allows_text_response_for_generated_and_text_native_services() {
    assert!(allows_text_response(ServiceKind::Plex));
    assert!(allows_text_response(ServiceKind::Qbittorrent));
    assert!(allows_text_response(ServiceKind::Sonarr));
    assert!(allows_text_response(ServiceKind::Jellyfin));
    assert!(!allows_text_response(ServiceKind::Tautulli));
}

#[test]
fn all_required_service_kinds_are_unique() {
    let mut names = ServiceKind::ALL.map(ServiceKind::as_str).to_vec();
    names.sort_unstable();
    names.dedup();
    assert_eq!(names.len(), 11);
    assert!(names.contains(&"tautulli"));
}

#[test]
fn client_builds_with_separate_qbit_cookie_store() {
    // Both clients must construct successfully; the qbit client is dedicated.
    let config = crate::config::YarrConfig::default();
    assert!(YarrClient::new(&config).is_ok());
}

#[tokio::test]
async fn oversized_upstream_response_is_rejected_before_json_materialization() {
    let body = format!("\"{}\"", "x".repeat(MAX_UPSTREAM_RESPONSE_BYTES + 1));
    let app = axum::Router::new().route(
        "/api/v3/large",
        axum::routing::get(move || {
            let body = body.clone();
            async move { ([(reqwest::header::CONTENT_TYPE, "application/json")], body) }
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let service = crate::config::ServiceConfig {
        name: "sonarr".into(),
        kind: ServiceKind::Sonarr,
        base_url: format!("http://{address}"),
        ..Default::default()
    };
    let config = crate::config::YarrConfig {
        services: vec![service.clone()],
    };

    let error = YarrClient::new(&config)
        .unwrap()
        .get_json(&service, "/api/v3/large")
        .await
        .unwrap_err();
    assert!(error.to_string().contains("response limit"), "{error:#}");
}

#[tokio::test]
async fn get_json_until_stops_a_stalled_upstream_request_at_the_execution_deadline() {
    let app = axum::Router::new().route(
        "/api/v3/stalled",
        axum::routing::get(|| async {
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
            axum::Json(serde_json::json!({ "ok": true }))
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let service = crate::config::ServiceConfig {
        name: "sonarr".into(),
        kind: ServiceKind::Sonarr,
        base_url: format!("http://{address}"),
        ..Default::default()
    };
    let config = crate::config::YarrConfig {
        services: vec![service.clone()],
    };
    let deadline =
        crate::yarr::helpers::RequestDeadline::after(std::time::Duration::from_millis(30));

    let error = YarrClient::new(&config)
        .unwrap()
        .get_json_until(&service, "/api/v3/stalled", deadline)
        .await
        .expect_err("the deadline must bound upstream completion");
    assert!(
        error
            .to_string()
            .contains("codemode absolute deadline exceeded"),
        "{error:#}"
    );
}
