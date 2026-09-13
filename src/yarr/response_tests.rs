use base64::Engine as _;
use reqwest::StatusCode;

use super::{ResponseMode, binary_response, decode_success};
use crate::config::{ServiceConfig, ServiceKind};

#[test]
fn binary_response_preserves_bytes_and_metadata() {
    let bytes = [0, 255, 42];
    let value = binary_response(
        StatusCode::OK,
        "application/octet-stream",
        Some("attachment; filename=data.bin"),
        &bytes,
    );

    assert_eq!(value["status"], 200);
    assert_eq!(value["mediaType"], "application/octet-stream");
    assert_eq!(
        value["base64"],
        base64::engine::general_purpose::STANDARD.encode(bytes)
    );
}

#[test]
fn binary_schema_preserves_text_plain_response_as_base64() {
    let service = ServiceConfig {
        name: "jellyfin".into(),
        kind: ServiceKind::Jellyfin,
        base_url: "http://localhost".into(),
        ..ServiceConfig::default()
    };
    let value = decode_success(
        &service,
        StatusCode::OK,
        Some("text/plain".into()),
        None,
        vec![0xff, 0x00],
        ResponseMode::OpenApi {
            expected_encoding: crate::openapi::BodyEncoding::Binary,
            expected_media_type: "text/plain".into(),
        },
    )
    .unwrap();

    assert_eq!(value["mediaType"], "text/plain");
    assert_eq!(value["base64"], "/wA=");
}

#[tokio::test]
async fn body_read_error_records_bounded_upstream_metrics() {
    use std::io::{BufRead, BufReader, Write};
    use std::net::TcpListener;
    use tower::ServiceExt as _;

    let listener = TcpListener::bind("127.0.0.1:0").expect("bind test server");
    let addr = listener.local_addr().unwrap();
    let handle = std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().expect("accept request");
        let mut reader = BufReader::new(stream.try_clone().unwrap());
        loop {
            let mut line = String::new();
            if reader.read_line(&mut line).unwrap_or(0) == 0 || line == "\r\n" {
                break;
            }
        }
        write!(
            stream,
            "HTTP/1.1 200 OK\r\nContent-Length: 10\r\nConnection: close\r\n\r\nx"
        )
        .unwrap();
        stream.flush().unwrap();
    });

    let metrics = crate::router(crate::testing::loopback_state());
    let service = ServiceConfig {
        name: "body-read-regression".into(),
        kind: ServiceKind::Sonarr,
        base_url: format!("http://{addr}"),
        api_key: Some("body-read-secret".into()),
        ..ServiceConfig::default()
    };
    let client = crate::yarr::YarrClient::new(&crate::config::YarrConfig {
        services: vec![service.clone()],
    })
    .unwrap();
    let error = client
        .get_json(&service, "/api/v3/system/status")
        .await
        .unwrap_err()
        .to_string();
    assert!(error.contains("response body read failed"), "{error}");
    handle.join().unwrap();

    let response = metrics
        .oneshot(
            axum::http::Request::builder()
                .uri("/metrics")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let text = String::from_utf8(body.to_vec()).unwrap();
    assert!(
        text.contains(
            "yarr_upstream_requests_total{service=\"body-read-regression\",kind=\"sonarr\",outcome=\"body_read_error\"} 1"
        ),
        "{text}"
    );
    assert!(!text.contains("body-read-secret"), "{text}");
    assert!(!text.contains(&addr.to_string()), "{text}");
}
