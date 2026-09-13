use super::*;
use crate::{
    config::{ServiceConfig, ServiceKind, YarrConfig},
    yarr::YarrClient,
};

fn tautulli(service: &str, id: &str) -> TautulliIdentity {
    TautulliIdentity {
        service: service.into(),
        pms_identifier: id.into(),
    }
}
fn plex(service: &str, id: &str) -> PlexIdentity {
    PlexIdentity {
        service: service.into(),
        client_identifier: id.into(),
    }
}

#[test]
fn pairs_exact_identifiers_and_reports_unmatched_sides() {
    let report = pair_tautulli_to_plex(
        &[
            tautulli("tautulli_a", "match"),
            tautulli("tautulli_b", "tautulli-only"),
        ],
        &[plex("plex_a", "match"), plex("plex_b", "plex-only")],
    );
    assert_eq!(report.pairs.len(), 1);
    assert_eq!(report.pairs[0].tautulli_service, "tautulli_a");
    assert_eq!(report.pairs[0].plex_service, "plex_a");
    assert_eq!(
        report.unpaired_tautulli,
        vec![tautulli("tautulli_b", "tautulli-only")]
    );
    assert_eq!(report.unpaired_plex, vec![plex("plex_b", "plex-only")]);
    assert!(report.ambiguous.is_empty());
}

#[test]
fn duplicate_identifier_is_ambiguous_and_not_paired() {
    let report = pair_tautulli_to_plex(
        &[
            tautulli("tautulli_a", "duplicate"),
            tautulli("tautulli_b", "duplicate"),
        ],
        &[plex("plex_a", "duplicate")],
    );
    assert!(report.pairs.is_empty());
    assert_eq!(report.ambiguous.len(), 1);
    assert_eq!(report.ambiguous[0].identifier, "duplicate");
    assert_eq!(report.unpaired_tautulli.len(), 2);
    assert_eq!(report.unpaired_plex.len(), 1);
}

#[tokio::test]
async fn configured_plex_pairing_http_error_redacts_whitespace_before_delimiter_credential() {
    const ACCESS_TOKEN: &str = "PAIRING_ERROR_ACCESS_TOKEN_SECRET";
    const AUTH_TOKEN: &str = "PAIRING_ERROR_AUTH_TOKEN_SECRET";
    const PLAINTEXT_COLON_TOKEN: &str = "PAIRING_PLAINTEXT_COLON_UNIQUE_SECRET";
    const PLAINTEXT_SPACE_TOKEN: &str = "PAIRING_PLAINTEXT_SPACE_UNIQUE_SECRET";
    let app = axum::Router::new().route(
        "/plex/identity",
        axum::routing::get(|| async {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                [("content-type", "text/plain")],
                format!(
                    "Plex identity failed: accessToken : {PLAINTEXT_COLON_TOKEN}, authToken {PLAINTEXT_SPACE_TOKEN}; json accessToken={ACCESS_TOKEN}&authToken={AUTH_TOKEN}"
                ),
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex-main".into(),
            kind: ServiceKind::Plex,
            base_url: format!("http://{address}/plex"),
            ..Default::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();

    let error = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect_err("configured Plex HTTP errors must reach the pairing caller");
    let rendered = error.to_string();
    for secret in [
        ACCESS_TOKEN,
        AUTH_TOKEN,
        PLAINTEXT_COLON_TOKEN,
        PLAINTEXT_SPACE_TOKEN,
    ] {
        assert!(!rendered.contains(secret), "credential leaked: {rendered}");
    }
    assert!(
        rendered.contains("Plex identity failed"),
        "lost diagnosis: {rendered}"
    );
    assert!(
        rendered.contains("plex-main returned HTTP 500"),
        "configured Plex HTTP error did not reach pairing: {rendered}"
    );
    assert!(
        rendered.contains("[redacted]"),
        "missing redaction: {rendered}"
    );
}

#[tokio::test]
async fn configured_plex_pairing_http_error_redacts_quoted_plaintext_credentials() {
    const QUOTED_COLON_SECRET: &str = "P_Q_COLON";
    const QUOTED_EQUALS_SECRET: &str = "P_Q_EQUALS";
    const ESCAPED_QUOTE_SECRET: &str = "P_Q_ESCAPED";
    const TRUNCATED_QUOTED_SECRET: &str = "P_Q_UNCLOSED";
    let app = axum::Router::new().route(
        "/plex/identity",
        axum::routing::get(|| async {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                [("content-type", "text/plain")],
                format!(
                    r#"Plex failure: accessToken: "{QUOTED_COLON_SECRET}"; auth-token = "{QUOTED_EQUALS_SECRET}"; token: "prefix\"{ESCAPED_QUOTE_SECRET}"; auth-token = "{TRUNCATED_QUOTED_SECRET}"#
                ),
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex-main".into(),
            kind: ServiceKind::Plex,
            base_url: format!("http://{address}/plex"),
            ..Default::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();

    let error = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect_err("configured Plex HTTP errors must reach the pairing caller");
    let rendered = error.to_string();
    for secret in [
        QUOTED_COLON_SECRET,
        QUOTED_EQUALS_SECRET,
        ESCAPED_QUOTE_SECRET,
        TRUNCATED_QUOTED_SECRET,
    ] {
        assert!(
            !rendered.contains(secret),
            "quoted plaintext credential leaked"
        );
    }
    assert!(rendered.contains("Plex failure:"));
    assert!(rendered.contains("plex-main returned HTTP 500"));
    assert_eq!(rendered.matches("[redacted]").count(), 4);
}

#[tokio::test]
async fn configured_plex_pairing_http_error_redacts_single_quoted_plaintext_credentials() {
    const COLON_SECRET: &str = "P_SQ_C";
    const EQUALS_SECRET: &str = "P_SQ_E";
    const WHITESPACE_SECRET: &str = "P_SQ_W";
    const ESCAPED_QUOTE_SECRET: &str = "P_SQ_Q";
    const EVEN_BACKSLASH_SECRET: &str = "P_SQ_B";
    const UNCLOSED_SECRET: &str = "P_SQ_U";
    let app = axum::Router::new().route(
        "/plex/identity",
        axum::routing::get(|| async {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                [("content-type", "text/plain")],
                format!(
                    r#"Plex failure: accessToken: '{COLON_SECRET}'; auth-token = '{EQUALS_SECRET}'; token '{WHITESPACE_SECRET}'; access_token: 'prefix\'{ESCAPED_QUOTE_SECRET}'; authToken = '{EVEN_BACKSLASH_SECRET}\\'; auth-token = '{UNCLOSED_SECRET}"#
                ),
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex-main".into(),
            kind: ServiceKind::Plex,
            base_url: format!("http://{address}/plex"),
            ..Default::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();

    let error = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect_err("configured Plex HTTP errors must reach the pairing caller");
    let rendered = error.to_string();
    for secret in [
        COLON_SECRET,
        EQUALS_SECRET,
        WHITESPACE_SECRET,
        ESCAPED_QUOTE_SECRET,
        EVEN_BACKSLASH_SECRET,
        UNCLOSED_SECRET,
    ] {
        assert!(
            !rendered.contains(secret),
            "single-quoted plaintext credential leaked"
        );
    }
    assert!(rendered.contains("Plex failure:"));
    assert!(rendered.contains("plex-main returned HTTP 500"));
    assert_eq!(rendered.matches("[redacted]").count(), 6);
}

#[tokio::test]
async fn configured_plex_pairing_http_error_redacts_newline_separated_json_credential() {
    const NEWLINE_ACCESS_TOKEN: &str = "PAIRING_JSON_NEWLINE_ACCESS_TOKEN_SECRET";
    let app = axum::Router::new().route(
        "/plex/identity",
        axum::routing::get(|| async {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                [("content-type", "application/json")],
                format!(
                    "{{\"accessToken\"\n:\n\"{NEWLINE_ACCESS_TOKEN}\",\"message\":\"identity failed\"}}"
                ),
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex-main".into(),
            kind: ServiceKind::Plex,
            base_url: format!("http://{address}/plex"),
            ..Default::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();

    let error = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect_err("configured Plex HTTP errors must reach the pairing caller");
    let rendered = error.to_string();
    assert!(
        !rendered.contains(NEWLINE_ACCESS_TOKEN),
        "newline-separated JSON credential leaked: {rendered}"
    );
    assert!(
        rendered.contains("identity failed"),
        "lost diagnosis: {rendered}"
    );
    assert!(
        rendered.contains("plex-main returned HTTP 500"),
        "configured Plex HTTP error did not reach pairing: {rendered}"
    );
    assert!(
        rendered.contains("[redacted]"),
        "missing redaction: {rendered}"
    );
}

#[tokio::test]
async fn configured_plex_pairing_http_error_redacts_truncated_multiline_json_credential() {
    const TRUNCATED_MULTILINE_ACCESS_TOKEN: &str =
        "PAIRING_TRUNCATED_MULTILINE_JSON_ACCESS_TOKEN_SECRET";
    let app = axum::Router::new().route(
        "/plex/identity",
        axum::routing::get(|| async {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                [("content-type", "application/json")],
                format!("{{\n\"accessToken\"\n:\n\"{TRUNCATED_MULTILINE_ACCESS_TOKEN}"),
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex-main".into(),
            kind: ServiceKind::Plex,
            base_url: format!("http://{address}/plex"),
            ..Default::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();

    let error = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect_err("configured Plex HTTP errors must reach the pairing caller");
    let rendered = error.to_string();
    assert!(
        !rendered.contains(TRUNCATED_MULTILINE_ACCESS_TOKEN),
        "truncated multiline JSON credential leaked: {rendered}"
    );
    assert!(
        rendered.contains("plex-main returned HTTP 500"),
        "configured Plex HTTP error did not reach pairing: {rendered}"
    );
    assert!(
        rendered.contains("[redacted]"),
        "missing redaction: {rendered}"
    );
}

#[tokio::test]
async fn configured_plex_pairing_http_error_redacts_truncated_json_escaped_key_credential() {
    const ESCAPED_KEY_SECRET: &str = "PAIRING_TRUNCATED_ESCAPED_KEY_UNIQUE_SECRET";
    let app = axum::Router::new().route(
        "/plex/identity",
        axum::routing::get(|| async {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                [("content-type", "application/json")],
                format!(r#"{{"access\u0054oken":"{ESCAPED_KEY_SECRET}"#),
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex-main".into(),
            kind: ServiceKind::Plex,
            base_url: format!("http://{address}/plex"),
            ..Default::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();

    let error = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect_err("configured Plex HTTP errors must reach the pairing caller");
    let rendered = error.to_string();
    assert!(
        !rendered.contains(ESCAPED_KEY_SECRET),
        "escaped-key truncated JSON credential leaked: {rendered}"
    );
    assert!(
        rendered.contains("plex-main returned HTTP 500"),
        "configured Plex HTTP error did not reach pairing: {rendered}"
    );
    assert!(
        rendered.contains("[redacted]"),
        "missing redaction: {rendered}"
    );
}

#[tokio::test]
async fn configured_plex_pairing_http_error_redacts_json_escaped_quote_credential() {
    const ESCAPED_QUOTE_SUFFIX: &str = "PAIRING_JSON_ESCAPED_SUFFIX_SECRET";
    let app = axum::Router::new().route(
        "/plex/identity",
        axum::routing::get(|| async {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                [("content-type", "application/json")],
                format!(
                    r#"{{"accessToken":"prefix\"{ESCAPED_QUOTE_SUFFIX}","message":"identity failed"}}"#
                ),
            )
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "plex-main".into(),
            kind: ServiceKind::Plex,
            base_url: format!("http://{address}/plex"),
            ..Default::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();

    let error = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect_err("configured Plex HTTP errors must reach the pairing caller");
    let rendered = error.to_string();
    assert!(
        !rendered.contains(ESCAPED_QUOTE_SUFFIX),
        "escaped-quote credential leaked: {rendered}"
    );
    assert!(
        rendered.contains("identity failed"),
        "lost diagnosis: {rendered}"
    );
    assert!(
        rendered.contains("plex-main returned HTTP 500"),
        "configured Plex HTTP error did not reach pairing: {rendered}"
    );
    assert!(
        rendered.contains("[redacted]"),
        "missing redaction: {rendered}"
    );
}

#[tokio::test]
async fn pairs_identifiers_read_from_configured_tautulli_and_plex_services() {
    let app = axum::Router::new()
        .route(
            "/tautulli/api/v2",
            axum::routing::get(|| async {
                axum::Json(serde_json::json!({
                    "response": {
                        "result": "success",
                        "data": { "pms_identifier": "server-identifier" }
                    }
                }))
            }),
        )
        .route(
            "/plex/identity",
            axum::routing::get(|| async {
                (
                    [("content-type", "application/xml")],
                    r#"<?xml version="1.0" encoding="UTF-8"?><MediaContainer machineIdentifier="server-identifier" size="0"/>"#,
                )
            }),
        );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let config = YarrConfig {
        services: vec![
            ServiceConfig {
                name: "tautulli-main".into(),
                kind: ServiceKind::Tautulli,
                base_url: format!("http://{address}/tautulli"),
                ..Default::default()
            },
            ServiceConfig {
                name: "plex-main".into(),
                kind: ServiceKind::Plex,
                base_url: format!("http://{address}/plex"),
                ..Default::default()
            },
        ],
    };
    let client = YarrClient::new(&config).unwrap();

    let report = pair_configured_tautulli_to_plex(&client, &config.services)
        .await
        .expect("configured identity reads must pair exactly");
    assert_eq!(
        report.pairs,
        vec![Pair {
            tautulli_service: "tautulli-main".into(),
            plex_service: "plex-main".into(),
        }]
    );
    assert!(report.unpaired_tautulli.is_empty());
    assert!(report.unpaired_plex.is_empty());
    assert!(report.ambiguous.is_empty());
}
