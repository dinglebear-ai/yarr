use super::*;
use yarr::{ServiceConfig, ServiceKind, YarrConfig, fleet::discovery::PlexDiscoveryReport};

#[tokio::test]
async fn cli_discovery_output_includes_configured_local_pairing_without_secrets() {
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
                axum::Json(serde_json::json!({
                    "MediaContainer": { "machineIdentifier": "server-identifier" }
                }))
            }),
        );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });

    let yarr = YarrConfig {
        services: vec![
            ServiceConfig {
                name: "tautulli-main".into(),
                kind: ServiceKind::Tautulli,
                base_url: format!("http://{address}/tautulli"),
                api_key: Some("tautulli-secret".into()),
                ..Default::default()
            },
            ServiceConfig {
                name: "plex-main".into(),
                kind: ServiceKind::Plex,
                base_url: format!("http://{address}/plex"),
                token: Some("plex-secret".into()),
                ..Default::default()
            },
        ],
    };

    let output = discovery_output_with_pairing(PlexDiscoveryReport::empty(), &yarr)
        .await
        .expect("CLI discovery output should pair configured local services");
    let value = serde_json::to_value(output).unwrap();

    assert_eq!(
        value.pointer("/pairing/pairs/0"),
        Some(&serde_json::json!({
            "tautulli_service": "tautulli-main",
            "plex_service": "plex-main",
        }))
    );
    let rendered = value.to_string();
    assert!(!rendered.contains("tautulli-secret"));
    assert!(!rendered.contains("plex-secret"));
    assert!(!rendered.contains(&address.to_string()));
}
