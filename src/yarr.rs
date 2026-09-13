//! Transport-only HTTP client for upstream media services.
//!
//! This module is split into:
//!   * `yarr.rs` (this file) — `YarrClient` + the `request_json` core
//!   * [`auth`] — per-kind header auth + qBittorrent cookie session
//!   * [`helpers`] — URL building, query-string assembly, path validation,
//!     response slimming, log redaction
//!
//! Public path/url helpers are re-exported here so callers keep importing them
//! from `crate::yarr`.

use std::collections::HashMap;
use std::time::Duration;

use anyhow::{Context, Result};
use reqwest::{Client, Method, StatusCode};
use serde_json::Value;

use crate::config::{ServiceConfig, ServiceKind, YarrConfig};

pub(crate) const MAX_UPSTREAM_RESPONSE_BYTES: usize = 16 * 1024 * 1024;

#[path = "yarr/auth.rs"]
pub mod auth;
#[path = "yarr/helpers.rs"]
pub mod helpers;
#[path = "yarr/openapi_transport.rs"]
mod openapi_transport;
#[path = "yarr/response.rs"]
mod response;

pub use helpers::{RequestDeadline, build_url, query_get, slim, validate_safe_path};
pub(crate) use openapi_transport::{EncodedRequestBody, MultipartField, OpenApiRequest};
#[cfg(test)]
use response::allows_text_response;

#[cfg(test)]
#[path = "yarr_tests.rs"]
mod tests;

#[derive(Clone)]
pub struct YarrClient {
    /// Shared, cookie-less client for every service except qBittorrent.
    client: Client,
    /// One cookie jar + login state per configured qBittorrent identity. Cookie
    /// scope ignores ports, so sharing one jar across instances is unsafe.
    qbit_sessions: std::sync::Arc<HashMap<String, std::sync::Arc<auth::QbittorrentSession>>>,
}

#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum UpstreamError {
    #[error(
        "{service} returned HTTP {} ({body_preview}){}",
        status.as_u16(),
        location
            .as_ref()
            .map(|location| format!("; location: {location}"))
            .unwrap_or_default()
    )]
    Http {
        service: String,
        status: StatusCode,
        body_preview: String,
        location: Option<String>,
    },
    #[error(
        "{service} returned non-JSON response (content-type: {}; body: {body_preview})",
        content_type.as_deref().unwrap_or("unknown")
    )]
    InvalidJson {
        service: String,
        content_type: Option<String>,
        body_preview: String,
    },
    #[error(
        "{service} response limit exceeded ({observed} bytes; max {limit} bytes); narrow the query or paginate"
    )]
    ResponseTooLarge {
        service: String,
        observed: u64,
        limit: usize,
    },
    #[error("{service} login rejected username/password")]
    QbittorrentLoginRejected { service: String },
}

/// Per-request upstream timeout. Defaults to 30s; override with
/// `YARR_HTTP_TIMEOUT_SECS` for stacks with slow upstreams (e.g. a Prowlarr
/// that fans an `/indexer` read out to many trackers). A value of 0 or an
/// unparseable value falls back to the 30s default.
fn http_timeout() -> Duration {
    std::env::var("YARR_HTTP_TIMEOUT_SECS")
        .ok()
        .and_then(|raw| raw.trim().parse::<u64>().ok())
        .filter(|secs| *secs > 0)
        .map(Duration::from_secs)
        .unwrap_or_else(|| Duration::from_secs(30))
}

impl YarrClient {
    pub fn new(cfg: &YarrConfig) -> Result<Self> {
        cfg.validate()?;
        let timeout = http_timeout();
        let client = Client::builder()
            .timeout(timeout)
            // L1-lang: bound the TCP connect phase and disable redirect-following
            // so a malicious/compromised upstream cannot redirect a credentialed
            // request to an attacker-controlled host.
            .connect_timeout(Duration::from_secs(10))
            .redirect(reqwest::redirect::Policy::none())
            .pool_max_idle_per_host(8)
            .pool_idle_timeout(Duration::from_secs(90))
            // S1: the shared client carries no cookie jar, so no service can
            // inherit another's session cookie.
            .cookie_store(false)
            .build()
            .context("failed to build HTTP client")?;
        let mut qbit_sessions = HashMap::new();
        for service in cfg
            .services
            .iter()
            .filter(|service| service.kind == ServiceKind::Qbittorrent)
        {
            let identity = service.name.trim().to_ascii_lowercase();
            if identity.is_empty() {
                anyhow::bail!("qBittorrent service name must not be empty");
            }
            if qbit_sessions.contains_key(&identity) {
                anyhow::bail!("duplicate qBittorrent service identity: {}", service.name);
            }
            qbit_sessions.insert(
                identity,
                std::sync::Arc::new(auth::QbittorrentSession::new(timeout)?),
            );
        }
        Ok(Self {
            client,
            qbit_sessions: std::sync::Arc::new(qbit_sessions),
        })
    }

    fn qbit_session(&self, service: &ServiceConfig) -> Result<&auth::QbittorrentSession> {
        self.qbit_sessions
            .get(&service.name.trim().to_ascii_lowercase())
            .map(std::sync::Arc::as_ref)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "qBittorrent service identity `{}` was not configured when the client was built",
                    service.name
                )
            })
    }

    #[cfg(test)]
    async fn expire_qbit_session_for_test(&self, service: &ServiceConfig) {
        self.qbit_session(service)
            .expect("test qBittorrent service must be configured")
            .invalidate()
            .await;
    }

    pub async fn get_json(&self, service: &ServiceConfig, path: &str) -> Result<Value> {
        if let Some(deadline) = helpers::active_request_deadline() {
            return self.get_json_until(service, path, deadline).await;
        }
        self.request_json(Method::GET, service, path, None, None)
            .await
    }

    pub async fn get_json_until(
        &self,
        service: &ServiceConfig,
        path: &str,
        deadline: RequestDeadline,
    ) -> Result<Value> {
        deadline
            .until(self.request_json(Method::GET, service, path, None, None))
            .await
    }

    pub async fn post_json(
        &self,
        service: &ServiceConfig,
        path: &str,
        body: Value,
    ) -> Result<Value> {
        if let Some(deadline) = helpers::active_request_deadline() {
            return self.post_json_until(service, path, body, deadline).await;
        }
        self.request_json(Method::POST, service, path, Some(body), None)
            .await
    }

    pub async fn post_json_until(
        &self,
        service: &ServiceConfig,
        path: &str,
        body: Value,
        deadline: RequestDeadline,
    ) -> Result<Value> {
        deadline
            .until(self.request_json(Method::POST, service, path, Some(body), None))
            .await
    }

    pub async fn put_json(
        &self,
        service: &ServiceConfig,
        path: &str,
        body: Value,
    ) -> Result<Value> {
        if let Some(deadline) = helpers::active_request_deadline() {
            return self.put_json_until(service, path, body, deadline).await;
        }
        self.request_json(Method::PUT, service, path, Some(body), None)
            .await
    }

    pub async fn put_json_until(
        &self,
        service: &ServiceConfig,
        path: &str,
        body: Value,
        deadline: RequestDeadline,
    ) -> Result<Value> {
        deadline
            .until(self.request_json(Method::PUT, service, path, Some(body), None))
            .await
    }

    pub async fn delete_json(
        &self,
        service: &ServiceConfig,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value> {
        if let Some(deadline) = helpers::active_request_deadline() {
            return self.delete_json_until(service, path, body, deadline).await;
        }
        self.request_json(Method::DELETE, service, path, body, None)
            .await
    }

    pub async fn delete_json_until(
        &self,
        service: &ServiceConfig,
        path: &str,
        body: Option<Value>,
        deadline: RequestDeadline,
    ) -> Result<Value> {
        deadline
            .until(self.request_json(Method::DELETE, service, path, body, None))
            .await
    }

    /// Core request path. `accept_mime` lets callers (e.g. Plex) negotiate a
    /// JSON response via the `Accept` header without the transport learning
    /// anything Plex-specific.
    pub async fn request_json(
        &self,
        method: Method,
        service: &ServiceConfig,
        path: &str,
        body: Option<Value>,
        accept_mime: Option<&str>,
    ) -> Result<Value> {
        let http = if service.kind == ServiceKind::Qbittorrent {
            let session = self.qbit_session(service)?;
            session.ensure(service).await?;
            session.client()
        } else {
            &self.client
        };
        let url = build_url(service, path)?;
        let mut request = http.request(method, url);
        request = auth::apply_auth(request, service);
        if let Some(accept) = accept_mime {
            request = request.header(reqwest::header::ACCEPT, accept);
        }
        if let Some(body) = body {
            request = request.json(&body);
        }
        self.finish_with_retry(service, request).await
    }

    /// Send a request to a **pre-built URL** with any method + optional body.
    ///
    /// The generated-operation executor builds the URL itself (substituting and
    /// encoding path/query params via `helpers::build_operation_url`), so unlike
    /// [`request_json`](Self::request_json) this takes a finished `Url` and does
    /// not re-derive the path or enforce the per-kind allowlist. Auth headers,
    /// qBittorrent session handling, and the JSON/error parsing are shared.
    pub async fn request_url(
        &self,
        method: Method,
        service: &ServiceConfig,
        url: reqwest::Url,
        body: Option<Value>,
        accept_mime: Option<&str>,
    ) -> Result<Value> {
        let http = if service.kind == ServiceKind::Qbittorrent {
            let session = self.qbit_session(service)?;
            session.ensure(service).await?;
            session.client()
        } else {
            &self.client
        };
        let mut request = http.request(method, url);
        request = auth::apply_auth(request, service);
        if let Some(accept) = accept_mime {
            request = request.header(reqwest::header::ACCEPT, accept);
        }
        if let Some(body) = body {
            request = request.json(&body);
        }
        self.finish_with_retry(service, request).await
    }

    pub async fn request_url_multipart_file(
        &self,
        method: Method,
        service: &ServiceConfig,
        url: reqwest::Url,
        field_name: &str,
        file_name: &str,
        bytes: Vec<u8>,
    ) -> Result<Value> {
        let http = if service.kind == ServiceKind::Qbittorrent {
            let session = self.qbit_session(service)?;
            session.ensure(service).await?;
            session.client()
        } else {
            &self.client
        };
        let part = reqwest::multipart::Part::bytes(bytes)
            .file_name(file_name.to_string())
            .mime_str("application/zip")?;
        let form = reqwest::multipart::Form::new().part(field_name.to_string(), part);

        let mut request = http.request(method, url);
        request = auth::apply_auth(request, service).multipart(form);
        self.finish_with_retry(service, request).await
    }

    /// Send a pre-built request (used by query-style helpers) and parse it.
    pub async fn send_get(
        &self,
        service: &ServiceConfig,
        url: reqwest::Url,
        accept_mime: Option<&str>,
    ) -> Result<Value> {
        let http = if service.kind == ServiceKind::Qbittorrent {
            let session = self.qbit_session(service)?;
            session.ensure(service).await?;
            session.client()
        } else {
            &self.client
        };
        let mut request = http.get(url);
        request = auth::apply_auth(request, service);
        if let Some(accept) = accept_mime {
            request = request.header(reqwest::header::ACCEPT, accept);
        }
        self.finish_with_retry(service, request).await
    }

    /// Send a `application/x-www-form-urlencoded` POST to a pre-built URL.
    ///
    /// qBittorrent's WebUI API (`/api/v2/torrents/{add,start,stop,delete}`)
    /// consumes form fields, never JSON. This routes through the dedicated
    /// cookie-store client and establishes/refreshes the SID session first, so it
    /// is the qBittorrent counterpart to [`post_json`](Self::post_json). The
    /// `form` pairs are percent-encoded by reqwest, so callers never `format!`
    /// untrusted values into the body.
    pub async fn send_form_post(
        &self,
        service: &ServiceConfig,
        url: reqwest::Url,
        form: &[(&str, &str)],
    ) -> Result<Value> {
        let http = if service.kind == ServiceKind::Qbittorrent {
            let session = self.qbit_session(service)?;
            session.ensure(service).await?;
            session.client()
        } else {
            &self.client
        };
        let mut request = http.post(url).form(form);
        request = auth::apply_auth(request, service);
        self.finish_with_retry(service, request).await
    }
}
