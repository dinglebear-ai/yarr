use base64::Engine as _;
use serde_json::json;

use crate::config::{ServiceConfig, ServiceKind, YarrConfig};
use crate::openapi::{
    BodyEncoding, HttpMethod, OperationSafety, OperationSpec, ParameterLocation, ParameterSpec,
    ParameterStyle, RepresentationSpec, RequestBodySpec,
};
use crate::yarr::YarrClient;

#[derive(Debug)]
struct RecordedRequest {
    uri: String,
    headers: reqwest::header::HeaderMap,
    body: Vec<u8>,
}

async fn recording_service() -> (
    crate::app::YarrService,
    tokio::sync::mpsc::UnboundedReceiver<RecordedRequest>,
) {
    use axum::body::{Body, to_bytes};
    use axum::extract::State;
    use axum::http::{Request, Response};

    async fn record(
        State(sender): State<tokio::sync::mpsc::UnboundedSender<RecordedRequest>>,
        request: Request<Body>,
    ) -> Response<Body> {
        let uri = request.uri().to_string();
        let headers = request.headers().clone();
        let body = to_bytes(request.into_body(), 1024 * 1024)
            .await
            .unwrap()
            .to_vec();
        sender
            .send(RecordedRequest {
                uri: uri.clone(),
                headers,
                body,
            })
            .unwrap();
        match uri.split('?').next().unwrap_or_default() {
            "/text" => Response::builder()
                .header("content-type", "text/plain")
                .body(Body::from("plain response"))
                .unwrap(),
            "/binary" => Response::builder()
                .header("content-type", "application/octet-stream")
                .body(Body::from(vec![0, 159, 146, 150]))
                .unwrap(),
            _ => Response::builder()
                .header("content-type", "application/json")
                .body(Body::from(r#"{"ok":true}"#))
                .unwrap(),
        }
    }

    let (sender, receiver) = tokio::sync::mpsc::unbounded_channel();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let app = axum::Router::new()
        .fallback(axum::routing::any(record))
        .with_state(sender);
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    let config = YarrConfig {
        services: vec![ServiceConfig {
            name: "sonarr".into(),
            kind: ServiceKind::Sonarr,
            base_url: format!("http://{address}"),
            api_key: Some("secret".into()),
            ..ServiceConfig::default()
        }],
    };
    let client = YarrClient::new(&config).unwrap();
    (crate::app::YarrService::new(client, config), receiver)
}

fn operation(
    method: HttpMethod,
    path: &'static str,
    parameters: &'static [ParameterSpec],
    request_body: Option<RequestBodySpec>,
    responses: &'static [RepresentationSpec],
) -> OperationSpec {
    OperationSpec {
        name: "recording_test",
        method,
        path,
        safety: OperationSafety::ReadOnly,
        path_params: &[],
        query_params: &[],
        has_body: request_body.is_some(),
        parameters,
        request_body,
        responses,
        request_type: None,
        response_type: None,
        tag: "test",
        summary: "test",
    }
}

const JSON_RESPONSE: &[RepresentationSpec] = &[RepresentationSpec {
    status: Some("200"),
    media_type: "application/json",
    encoding: BodyEncoding::Json,
    schema: "null",
    encoding_metadata: "null",
}];

#[cfg(test)]
#[path = "recording_tests.rs"]
mod tests;
