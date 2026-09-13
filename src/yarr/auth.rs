//! Per-service request authentication, driven by `KindDescriptor.auth_style`,
//! plus the qBittorrent cookie-session lifecycle.
//!
//! Header auth lives here; query-string auth (apikey / X-Plex-Token) lives in
//! [`super::helpers::build_url`]. The two never both append the api key.

use std::time::{Duration, Instant};

use anyhow::{Context, Result};
use reqwest::{Client, StatusCode};
use tokio::sync::Mutex;

use super::{helpers::build_url, response::record_outcome};
use crate::capability::AuthStyle;
use crate::config::ServiceConfig;

/// How long a qBittorrent SID session is treated as fresh before we re-login.
/// qBittorrent's default WebUI session timeout is 3600s; 50 minutes keeps a
/// comfortable margin while skipping the per-request login (P1-2).
const QBIT_SESSION_TTL: Duration = Duration::from_secs(50 * 60);
const QBIT_LOGIN_BODY_LIMIT: usize = 8 * 1024;

/// Cookie jar and single-flight login state for one configured qBittorrent
/// identity. Instances never share this object, even on the same hostname.
pub struct QbittorrentSession {
    client: Client,
    last_login: Mutex<Option<Instant>>,
}

impl QbittorrentSession {
    pub fn new(timeout: Duration) -> Result<Self> {
        let client = Client::builder()
            .timeout(timeout)
            .connect_timeout(Duration::from_secs(10))
            .redirect(reqwest::redirect::Policy::none())
            .pool_max_idle_per_host(8)
            .pool_idle_timeout(Duration::from_secs(90))
            .cookie_store(true)
            .build()
            .context("failed to build qBittorrent HTTP client")?;
        Ok(Self {
            client,
            last_login: Mutex::new(None),
        })
    }

    pub fn client(&self) -> &Client {
        &self.client
    }

    /// Establish a SID once per TTL window. The per-identity async mutex is
    /// intentionally held through login so concurrent cold/expired callers
    /// collapse into one network request.
    pub async fn ensure(&self, service: &ServiceConfig) -> Result<()> {
        if let Some(deadline) = super::helpers::active_request_deadline() {
            return deadline.until(self.ensure_unbounded(service)).await;
        }
        self.ensure_unbounded(service).await
    }

    async fn ensure_unbounded(&self, service: &ServiceConfig) -> Result<()> {
        let Some(username) = service.username.as_deref() else {
            return Ok(());
        };
        let Some(password) = service.password.as_deref() else {
            return Ok(());
        };

        let mut last_login = self.last_login.lock().await;
        if last_login.is_some_and(|last| last.elapsed() < QBIT_SESSION_TTL) {
            return Ok(());
        }

        let url = build_url(service, "/api/v2/auth/login")?;
        let started = Instant::now();
        let response = match self
            .client
            .post(url)
            .form(&[("username", username), ("password", password)])
            .send()
            .await
        {
            Ok(response) => response,
            Err(error) => {
                record_outcome(service, "transport_error", started.elapsed());
                return Err(error).with_context(|| format!("{} login failed", service.name));
            }
        };
        let status = response.status();
        let text = match read_login_body_bounded(response).await {
            Ok(text) => text,
            Err(error) => {
                record_outcome(service, "body_read_error", started.elapsed());
                return Err(error)
                    .with_context(|| format!("{} login response body read failed", service.name));
            }
        };
        if !status.is_success() {
            record_outcome(service, "http_error", started.elapsed());
            anyhow::bail!("{} login returned HTTP {}", service.name, status.as_u16());
        }
        if !qbittorrent_login_accepted(status, &text) {
            record_outcome(service, "login_rejected", started.elapsed());
            return Err(super::UpstreamError::QbittorrentLoginRejected {
                service: service.name.clone(),
            }
            .into());
        }
        record_outcome(service, "success", started.elapsed());
        *last_login = Some(Instant::now());
        Ok(())
    }

    pub async fn invalidate(&self) {
        *self.last_login.lock().await = None;
    }
}

async fn read_login_body_bounded(mut response: reqwest::Response) -> Result<String> {
    if response
        .content_length()
        .is_some_and(|length| length > QBIT_LOGIN_BODY_LIMIT as u64)
    {
        anyhow::bail!("qBittorrent login response exceeds {QBIT_LOGIN_BODY_LIMIT} bytes");
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await? {
        if bytes.len().saturating_add(chunk.len()) > QBIT_LOGIN_BODY_LIMIT {
            anyhow::bail!("qBittorrent login response exceeds {QBIT_LOGIN_BODY_LIMIT} bytes");
        }
        bytes.extend_from_slice(&chunk);
    }
    String::from_utf8(bytes).context("qBittorrent login response is not UTF-8")
}

#[cfg(test)]
#[path = "auth_tests.rs"]
mod tests;

/// Jellyfin's preferred auth header. The MediaBrowser token value is quoted per
/// the Emby/Jellyfin auth scheme; `X-Emby-Token` remains as a fallback.
fn jellyfin_authorization(key: &str) -> String {
    format!("MediaBrowser Token=\"{key}\"")
}

/// Apply header-based auth for the request's service kind.
///
/// S4: `bearer_auth` is **only** applied for kinds that actually use a bearer
/// token — never for Plex (token travels in the query string) or Jellyfin (uses
/// the MediaBrowser / X-Emby-Token headers). This prevents leaking a bearer
/// `Authorization` header alongside the real credential.
pub fn apply_auth(
    mut request: reqwest::RequestBuilder,
    service: &ServiceConfig,
) -> reqwest::RequestBuilder {
    // No AuthStyle is bearer-only, so every arm returns `request` without ever
    // falling through to a trailing `bearer_auth` (S4: a bearer Authorization
    // header would leak alongside the real per-kind credential).
    match service.kind.descriptor().auth_style {
        AuthStyle::ApiKeyHeader => {
            if let Some(key) = service.api_key.as_deref() {
                request = request.header("X-Api-Key", key);
            }
            request
        }
        AuthStyle::JellyfinToken => {
            if let Some(key) = service.api_key.as_deref().or(service.token.as_deref()) {
                request = request
                    .header("Authorization", jellyfin_authorization(key))
                    .header("X-Emby-Token", key);
            }
            request
        }
        AuthStyle::BearerToken => {
            if let Some(key) = service.token.as_deref().or(service.api_key.as_deref()) {
                request = request.bearer_auth(key);
            }
            request
        }
        // Plex token is injected as the X-Plex-Token query param in build_url.
        AuthStyle::PlexToken => request,
        // apikey is injected in the query string / cookie session is established
        // separately.
        AuthStyle::QueryApiKey | AuthStyle::CookieSession => request,
    }
}

pub fn qbittorrent_login_accepted(status: StatusCode, text: &str) -> bool {
    status.is_success() && (status == StatusCode::NO_CONTENT || text.trim() == "Ok.")
}
