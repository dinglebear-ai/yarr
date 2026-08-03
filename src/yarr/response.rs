//! Bounded response collection, retry, metrics, and representation decoding.

use anyhow::{Context, Result};
use base64::Engine as _;
use reqwest::StatusCode;
use serde_json::Value;
use std::time::Instant;

use super::{MAX_UPSTREAM_RESPONSE_BYTES, UpstreamError, YarrClient, helpers};
use crate::config::{ServiceConfig, ServiceKind};

#[derive(Clone)]
pub(super) enum ResponseMode {
    JsonCompatible,
    OpenApi {
        expected_encoding: crate::openapi::BodyEncoding,
        expected_media_type: String,
    },
}

impl YarrClient {
    /// Send a request, retrying once for qBittorrent if the cached SID was
    /// rejected upstream.
    ///
    /// A session cached within `auth::QBIT_SESSION_TTL` can still be invalid if
    /// qBittorrent expired it server-side (WebUI restart, session timeout, ban).
    /// Without this, every subsequent call would fast-path into the same 401/403
    /// until the TTL lapsed. On an auth failure we evict the cached session,
    /// force a fresh login, and retry the request exactly once.
    pub(super) async fn finish_with_retry(
        &self,
        service: &ServiceConfig,
        request: reqwest::RequestBuilder,
    ) -> Result<Value> {
        self.finish_with_retry_mode(service, request, ResponseMode::JsonCompatible)
            .await
    }

    pub(super) async fn finish_with_retry_mode(
        &self,
        service: &ServiceConfig,
        request: reqwest::RequestBuilder,
        mode: ResponseMode,
    ) -> Result<Value> {
        if service.kind == ServiceKind::Qbittorrent {
            match request.try_clone() {
                Some(retry) => match self.finish(service, request, mode.clone()).await {
                    Err(err) if is_auth_failure(&err) => {
                        let session = self.qbit_session(service)?;
                        session.invalidate().await;
                        let relogin = session.ensure(service).await;
                        axum_prometheus::metrics::counter!(
                            "yarr_qbittorrent_relogins_total",
                            "service" => service.name.clone(),
                            "outcome" => if relogin.is_ok() { "success" } else { "failed" }
                        )
                        .increment(1);
                        relogin?;
                        return self.finish(service, retry, mode).await;
                    }
                    result => return result,
                },
                // `try_clone` is `None` only for non-cloneable streaming bodies.
                None => tracing::warn!(
                    service = %service.name,
                    "qBittorrent request body is not cloneable; the 401/403 re-login retry is disabled for this call"
                ),
            }
        }
        self.finish(service, request, mode).await
    }

    async fn finish(
        &self,
        service: &ServiceConfig,
        request: reqwest::RequestBuilder,
        mode: ResponseMode,
    ) -> Result<Value> {
        let request_summary = request
            .try_clone()
            .and_then(|request| request.build().ok())
            .map(|request| {
                (
                    request.method().as_str().to_owned(),
                    request.url().path().to_owned(),
                )
            });
        let mut metric = UpstreamCallMetric::new(service, request_summary);
        let mut response = match request.send().await {
            Ok(response) => response,
            Err(error) => {
                metric.complete("transport_error");
                return Err(error).with_context(|| format!("{} request failed", service.name));
            }
        };
        let status = response.status();
        let content_type = header(&response, reqwest::header::CONTENT_TYPE);
        let location = header(&response, reqwest::header::LOCATION)
            .as_deref()
            .map(helpers::body_preview);
        let content_disposition = header(&response, reqwest::header::CONTENT_DISPOSITION);
        if let Some(content_length) = response.content_length()
            && content_length > MAX_UPSTREAM_RESPONSE_BYTES as u64
        {
            metric.complete("oversized");
            return Err(too_large(service, content_length));
        }
        let mut bytes = Vec::with_capacity(
            response
                .content_length()
                .unwrap_or(0)
                .min(MAX_UPSTREAM_RESPONSE_BYTES as u64) as usize,
        );
        while let Some(chunk) = match response.chunk().await {
            Ok(chunk) => chunk,
            Err(error) => {
                metric.complete("body_error");
                return Err(error)
                    .with_context(|| format!("{} response body read failed", service.name));
            }
        } {
            if bytes.len().saturating_add(chunk.len()) > MAX_UPSTREAM_RESPONSE_BYTES {
                metric.complete("oversized");
                return Err(too_large(
                    service,
                    bytes.len().saturating_add(chunk.len()) as u64,
                ));
            }
            bytes.extend_from_slice(&chunk);
        }
        if !status.is_success() {
            metric.complete("http_error");
            let text = std::str::from_utf8(&bytes).unwrap_or("<non-utf8 body>");
            return Err(UpstreamError::Http {
                service: service.name.clone(),
                status,
                body_preview: helpers::body_preview(text),
                location,
            }
            .into());
        }
        let decoded = decode_success(
            service,
            status,
            content_type,
            content_disposition,
            bytes,
            mode,
        );
        metric.complete(if decoded.is_ok() {
            "success"
        } else {
            "decode_error"
        });
        decoded
    }
}

fn header(response: &reqwest::Response, name: reqwest::header::HeaderName) -> Option<String> {
    response
        .headers()
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(str::to_owned)
}

struct UpstreamCallMetric {
    service: String,
    kind: &'static str,
    method: String,
    path: String,
    started: Instant,
    outcome: &'static str,
    completed: bool,
}

impl UpstreamCallMetric {
    fn new(service: &ServiceConfig, request: Option<(String, String)>) -> Self {
        let (method, path) = request.unwrap_or_else(|| ("<streaming>".into(), "<unknown>".into()));
        Self {
            service: service.name.clone(),
            kind: service.kind.as_str(),
            method,
            path,
            started: Instant::now(),
            outcome: "internal_error",
            completed: false,
        }
    }

    fn complete(&mut self, outcome: &'static str) {
        self.outcome = outcome;
        self.completed = true;
    }
}

impl Drop for UpstreamCallMetric {
    fn drop(&mut self) {
        let elapsed = self.started.elapsed();
        let outcome = if self.completed {
            self.outcome
        } else {
            "internal_error"
        };
        axum_prometheus::metrics::counter!(
            "yarr_upstream_requests_total",
            "service" => self.service.clone(),
            "kind" => self.kind,
            "outcome" => outcome
        )
        .increment(1);
        axum_prometheus::metrics::histogram!(
            "yarr_upstream_request_duration_seconds",
            "service" => self.service.clone(),
            "kind" => self.kind,
            "outcome" => outcome
        )
        .record(elapsed.as_secs_f64());
        tracing::info!(
            service = %self.service,
            kind = self.kind,
            method = %self.method,
            path = %self.path,
            outcome,
            latency_ms = elapsed.as_millis(),
            "upstream request completed"
        );
    }
}

fn too_large(service: &ServiceConfig, observed: u64) -> anyhow::Error {
    UpstreamError::ResponseTooLarge {
        service: service.name.clone(),
        observed,
        limit: MAX_UPSTREAM_RESPONSE_BYTES,
    }
    .into()
}

fn decode_success(
    service: &ServiceConfig,
    status: StatusCode,
    content_type: Option<String>,
    content_disposition: Option<String>,
    bytes: Vec<u8>,
    mode: ResponseMode,
) -> Result<Value> {
    if bytes.is_empty() {
        return Ok(serde_json::json!({ "ok": true, "status": status.as_u16() }));
    }
    let text = std::str::from_utf8(&bytes).ok();
    match mode {
        ResponseMode::JsonCompatible => decode_compatible(
            service,
            status,
            content_type,
            content_disposition,
            &bytes,
            text,
        ),
        ResponseMode::OpenApi {
            expected_encoding,
            expected_media_type,
        } => decode_openapi(
            service,
            status,
            content_type,
            content_disposition,
            &bytes,
            text,
            expected_encoding,
            &expected_media_type,
        ),
    }
}

fn decode_compatible(
    service: &ServiceConfig,
    status: StatusCode,
    content_type: Option<String>,
    content_disposition: Option<String>,
    bytes: &[u8],
    text: Option<&str>,
) -> Result<Value> {
    let Some(text) = text else {
        return Ok(binary_response(
            status,
            content_type
                .as_deref()
                .unwrap_or("application/octet-stream"),
            content_disposition.as_deref(),
            bytes,
        ));
    };
    match serde_json::from_str(text) {
        Ok(value) => Ok(value),
        Err(_) if allows_text_response(service.kind) => Ok(Value::String(text.to_string())),
        Err(_) => Err(UpstreamError::InvalidJson {
            service: service.name.clone(),
            content_type,
            body_preview: helpers::body_preview(text),
        }
        .into()),
    }
}

#[allow(clippy::too_many_arguments)]
fn decode_openapi(
    service: &ServiceConfig,
    status: StatusCode,
    content_type: Option<String>,
    content_disposition: Option<String>,
    bytes: &[u8],
    text: Option<&str>,
    expected_encoding: crate::openapi::BodyEncoding,
    expected_media_type: &str,
) -> Result<Value> {
    let actual_media_type = content_type
        .as_deref()
        .and_then(|value| value.split(';').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(expected_media_type);
    let actual_lower = actual_media_type.to_ascii_lowercase();
    let encoding = if expected_encoding == crate::openapi::BodyEncoding::Binary {
        // `format: binary` is authoritative even when the declared HTTP media
        // type is `text/plain` (Jellyfin uses exactly that shape for uploads and
        // downloads). Preserve bytes rather than forcing UTF-8 string output.
        crate::openapi::BodyEncoding::Binary
    } else if actual_lower.contains("json") {
        crate::openapi::BodyEncoding::Json
    } else if actual_lower.starts_with("text/") || actual_lower.contains("xml") {
        crate::openapi::BodyEncoding::Text
    } else {
        expected_encoding
    };
    match (encoding, text) {
        (crate::openapi::BodyEncoding::Json, Some(text)) => {
            serde_json::from_str(text).map_err(|_| {
                UpstreamError::InvalidJson {
                    service: service.name.clone(),
                    content_type,
                    body_preview: helpers::body_preview(text),
                }
                .into()
            })
        }
        (
            crate::openapi::BodyEncoding::Text | crate::openapi::BodyEncoding::FormUrlEncoded,
            Some(text),
        ) => Ok(Value::String(text.to_string())),
        _ => Ok(binary_response(
            status,
            actual_media_type,
            content_disposition.as_deref(),
            bytes,
        )),
    }
}

fn binary_response(
    status: StatusCode,
    media_type: &str,
    content_disposition: Option<&str>,
    bytes: &[u8],
) -> Value {
    serde_json::json!({
        "status": status.as_u16(),
        "mediaType": media_type,
        "contentDisposition": content_disposition,
        "base64": base64::engine::general_purpose::STANDARD.encode(bytes),
    })
}

fn is_auth_failure(err: &anyhow::Error) -> bool {
    matches!(
        err.downcast_ref::<UpstreamError>(),
        Some(UpstreamError::Http { status, .. })
            if *status == StatusCode::UNAUTHORIZED || *status == StatusCode::FORBIDDEN
    )
}

pub(super) fn allows_text_response(kind: ServiceKind) -> bool {
    crate::openapi::is_generated(kind)
        || matches!(kind, ServiceKind::Plex | ServiceKind::Qbittorrent)
}

#[cfg(test)]
#[path = "response_tests.rs"]
mod tests;
