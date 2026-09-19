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

#[test]
fn client_rejects_colliding_codemode_service_names() {
    let config = crate::config::YarrConfig {
        services: vec![
            crate::config::ServiceConfig {
                name: "foo-bar".into(),
                kind: ServiceKind::Sonarr,
                ..Default::default()
            },
            crate::config::ServiceConfig {
                name: "foo_bar".into(),
                kind: ServiceKind::Radarr,
                ..Default::default()
            },
        ],
    };

    let error = match YarrClient::new(&config) {
        Ok(_) => panic!("colliding Code Mode service names must be rejected"),
        Err(error) => error,
    };
    assert!(error.to_string().contains("foo-bar"), "{error:#}");
    assert!(error.to_string().contains("foo_bar"), "{error:#}");
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
async fn upstream_error_response_paths_redact_json_plaintext_and_location_secrets() {
    use axum::{
        http::{HeaderValue, StatusCode, header},
        response::IntoResponse,
        routing::get,
    };

    let app = axum::Router::new()
        .route(
            "/api/v3/json",
            get(|| async {
                (
                    StatusCode::BAD_REQUEST,
                    [(header::CONTENT_TYPE, "application/json")],
                    r#"{"apiKey":"json-secret","accessToken":"camel-access-secret","access_token":"snake-access-secret","authorization":"Bearer auth-secret","cookie":"SID=cookie-secret","token":"prefix\"escaped-token-secret"}"#,
                )
            }),
        )
        .route(
            "/api/v3/plaintext",
            get(|| async {
                (
                    StatusCode::BAD_REQUEST,
                    [(header::CONTENT_TYPE, "text/plain")],
                    "malformed response password=plain-secret&access_token=plain-access-secret&authorization=Bearer plain-auth-secret&cookie=SID=plain-cookie-secret",
                )
            }),
        )
        .route(
            "/api/v3/location",
            get(|| async {
                let mut response = (StatusCode::FOUND, "redirect").into_response();
                response.headers_mut().insert(
                    header::LOCATION,
                    HeaderValue::from_static("/retry?accessToken=location-secret"),
                );
                response
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
    let client = YarrClient::new(&crate::config::YarrConfig {
        services: vec![service.clone()],
    })
    .unwrap();

    for (path, secret) in [
        ("/api/v3/json", "json-secret"),
        ("/api/v3/json", "camel-access-secret"),
        ("/api/v3/json", "snake-access-secret"),
        ("/api/v3/json", "auth-secret"),
        ("/api/v3/json", "cookie-secret"),
        ("/api/v3/json", "escaped-token-secret"),
        ("/api/v3/plaintext", "plain-secret"),
        ("/api/v3/plaintext", "plain-access-secret"),
        ("/api/v3/plaintext", "plain-auth-secret"),
        ("/api/v3/plaintext", "plain-cookie-secret"),
        ("/api/v3/location", "location-secret"),
    ] {
        let error = client.get_json(&service, path).await.unwrap_err();
        let rendered = error.to_string();
        assert!(
            !rendered.contains(secret),
            "{path} leaked {secret}: {rendered}"
        );
        assert!(
            rendered.contains("[redacted]"),
            "{path} was not redacted: {rendered}"
        );
    }
}

#[tokio::test]
async fn upstream_metrics_have_bounded_duration_labels_and_exclude_qbit_login() {
    use axum::{body::Body, http::Request, routing::post};
    use tower::ServiceExt;

    let app = axum::Router::new()
        .route(
            "/api/v3/system/status",
            axum::routing::get(|| async { "{}" }),
        )
        .route("/api/v2/auth/login", post(|| async { "Ok." }));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    // Install the process-global Prometheus recorder before exercising the
    // transport, then scrape through its public endpoint.
    crate::server::routes::router(crate::testing::loopback_state())
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let sonarr = crate::config::ServiceConfig {
        name: "metrics-contract-sonarr".into(),
        kind: ServiceKind::Sonarr,
        base_url: format!("http://{address}"),
        ..Default::default()
    };
    let qbit = crate::config::ServiceConfig {
        name: "metrics-contract-qbit-login".into(),
        kind: ServiceKind::Qbittorrent,
        base_url: format!("http://{address}"),
        username: Some("user".into()),
        password: Some("password".into()),
        ..Default::default()
    };
    let client = YarrClient::new(&crate::config::YarrConfig {
        services: vec![sonarr.clone(), qbit.clone()],
    })
    .unwrap();
    client
        .get_json(&sonarr, "/api/v3/system/status")
        .await
        .unwrap();
    crate::yarr::auth::QbittorrentSession::new(std::time::Duration::from_secs(1))
        .unwrap()
        .ensure(&qbit)
        .await
        .unwrap();

    let response = crate::server::routes::router(crate::testing::loopback_state())
        .oneshot(
            Request::builder()
                .uri("/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let text = String::from_utf8(
        axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec(),
    )
    .unwrap();

    let counter = text
        .lines()
        .find(|line| {
            line.starts_with("yarr_upstream_requests_total{")
                && line.contains("metrics-contract-sonarr")
        })
        .expect("sonarr upstream counter must be exposed");
    assert_eq!(
        counter,
        "yarr_upstream_requests_total{service=\"metrics-contract-sonarr\",outcome=\"success\"} 1"
    );
    assert!(
        !text.contains("service=\"metrics-contract-qbit-login\""),
        "qBittorrent login must not increment generic upstream requests: {text}"
    );

    let expected_buckets = [
        "0.005", "0.01", "0.025", "0.05", "0.1", "0.25", "0.5", "1", "2.5", "5", "10", "30", "+Inf",
    ];
    let mut observed_buckets = std::collections::BTreeSet::new();
    let mut observed_sum = false;
    let mut observed_count = false;
    for line in text.lines().filter(|line| {
        line.starts_with("yarr_upstream_duration_seconds")
            && line.contains("service=\"metrics-contract-sonarr\"")
    }) {
        let (sample, labels) = line
            .split_once('{')
            .and_then(|(sample, rest)| rest.split_once('}').map(|(labels, _)| (sample, labels)))
            .expect("upstream duration sample must have Prometheus labels");
        let label_keys: std::collections::BTreeSet<_> = labels
            .split(',')
            .map(|label| label.split_once('=').expect("label must be key=value").0)
            .collect();
        match sample {
            "yarr_upstream_duration_seconds_bucket" => {
                assert_eq!(
                    label_keys,
                    std::collections::BTreeSet::from(["le", "service"]),
                    "duration bucket has unexpected labels: {line}"
                );
                let le = labels
                    .split(',')
                    .find_map(|label| {
                        label
                            .strip_prefix("le=\"")
                            .and_then(|value| value.strip_suffix('"'))
                    })
                    .expect("duration bucket must include le");
                observed_buckets.insert(le.to_owned());
            }
            "yarr_upstream_duration_seconds_sum" => {
                assert_eq!(
                    label_keys,
                    std::collections::BTreeSet::from(["service"]),
                    "duration sum has unexpected labels: {line}"
                );
                observed_sum = true;
            }
            "yarr_upstream_duration_seconds_count" => {
                assert_eq!(
                    label_keys,
                    std::collections::BTreeSet::from(["service"]),
                    "duration count has unexpected labels: {line}"
                );
                observed_count = true;
            }
            _ => panic!("unexpected upstream duration sample: {line}"),
        }
    }
    assert_eq!(
        observed_buckets,
        expected_buckets.into_iter().map(str::to_owned).collect(),
        "upstream duration buckets must exactly match the fixed contract"
    );
    assert!(observed_sum, "missing upstream duration sum sample: {text}");
    assert!(
        observed_count,
        "missing upstream duration count sample: {text}"
    );
}
