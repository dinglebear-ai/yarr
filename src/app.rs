//! Business service layer.

use anyhow::{Result, anyhow};
use serde_json::Value;

use crate::{
    config::{ServiceConfig, ServiceKind, YarrConfig},
    yarr::{YarrClient, validate_safe_path},
};

pub mod codemode;
pub mod download;
pub mod openapi_ops;
pub mod stats;
pub mod subtitles;
pub mod trace;

#[cfg(test)]
#[path = "app_tests.rs"]
mod tests;

#[derive(Clone)]
pub struct YarrService {
    client: YarrClient,
    services: Vec<ServiceConfig>,
    /// Root dir for Code Mode `writeArtifact` output. `None` disables artifacts
    /// (the default; the binary sets it from the data dir). Per-run subdirs are
    /// created under this root.
    data_dir: Option<std::path::PathBuf>,
    /// Code Mode `codemode.search()` semantic-scoring cache — catalog embeddings
    /// and the failure cooldown, shared (via `Arc`) across every clone of this
    /// service for the process's lifetime, so it's computed at most once, not
    /// per script run and not per clone. See [`crate::codemode::semantic`].
    ///
    /// Fully qualified as `crate::codemode` (not the bare `codemode` module
    /// path) because this struct's own `pub mod codemode;` (this file, above)
    /// would otherwise shadow the top-level engine module of the same name.
    semantic_cache: std::sync::Arc<crate::codemode::SemanticCache>,
    codemode_preamble: std::sync::Arc<str>,
    codemode_catalog: std::sync::Arc<[crate::codemode::catalog::CatalogEntry]>,
    codemode_slots: std::sync::Arc<tokio::sync::Semaphore>,
    codemode_queue_timeout: std::time::Duration,
    codemode_execution_timeout: std::time::Duration,
}

impl YarrService {
    pub fn new(client: YarrClient, config: YarrConfig) -> Self {
        let configured = config
            .services
            .iter()
            .map(|service| (service.name.clone(), service.kind))
            .collect::<Vec<_>>();
        Self {
            client,
            services: config.services,
            data_dir: None,
            semantic_cache: std::sync::Arc::new(crate::codemode::SemanticCache::new()),
            codemode_preamble: crate::codemode::build_preamble(&configured).into(),
            codemode_catalog: crate::codemode::catalog::build_catalog(&configured).into(),
            codemode_slots: std::sync::Arc::new(tokio::sync::Semaphore::new(
                crate::codemode::CODEMODE_MAX_CONCURRENT,
            )),
            codemode_queue_timeout: crate::codemode::CODEMODE_QUEUE_TIMEOUT,
            codemode_execution_timeout: crate::codemode::CODEMODE_TIMEOUT,
        }
    }

    /// Enable Code Mode `writeArtifact` by setting the artifacts root (typically
    /// the resolved data dir). Builder so the `new(client, config)` signature and
    /// its call sites stay unchanged.
    pub fn with_data_dir(mut self, root: std::path::PathBuf) -> Self {
        self.data_dir = Some(root);
        self
    }

    /// Override Code Mode capacity and timing. Production config uses this
    /// builder and tests use it to exercise overload/deadline behavior quickly.
    pub fn with_codemode_limits(
        mut self,
        max_concurrent: usize,
        queue_timeout: std::time::Duration,
        execution_timeout: std::time::Duration,
    ) -> Self {
        self.codemode_slots =
            std::sync::Arc::new(tokio::sync::Semaphore::new(max_concurrent.max(1)));
        self.codemode_queue_timeout = queue_timeout;
        self.codemode_execution_timeout = execution_timeout;
        self
    }

    /// The configured artifacts root, if Code Mode `writeArtifact` is enabled.
    pub(crate) fn data_dir(&self) -> Option<&std::path::Path> {
        self.data_dir.as_deref()
    }

    /// The shared semantic-search cache for `codemode.search()` — see
    /// [`crate::codemode::semantic`].
    pub(crate) fn semantic_cache(&self) -> &std::sync::Arc<crate::codemode::SemanticCache> {
        &self.semantic_cache
    }

    pub(crate) fn codemode_preamble(&self) -> std::sync::Arc<str> {
        self.codemode_preamble.clone()
    }

    pub(crate) fn codemode_catalog(
        &self,
    ) -> std::sync::Arc<[crate::codemode::catalog::CatalogEntry]> {
        self.codemode_catalog.clone()
    }

    /// Configured `(name, kind)` pairs, in declaration order. Drives the Code Mode
    /// per-service callable namespaces (`<service>.<verb>()`) and the discovery
    /// catalog — the service is baked into each callable, so a script never passes
    /// a `service` param and never needs to enumerate services.
    pub(crate) fn configured_service_kinds(&self) -> Vec<(String, ServiceKind)> {
        self.services
            .iter()
            .map(|service| (service.name.clone(), service.kind))
            .collect()
    }

    pub fn configured_service_count(&self) -> usize {
        self.services
            .iter()
            .filter(|service| !service.base_url.trim().is_empty())
            .count()
    }

    pub async fn service_status(&self, service: &str) -> Result<Value> {
        let service = self.service(service)?;
        self.client
            .get_json(service, service.kind.default_status_path())
            .await
    }

    pub async fn api_get(&self, service: &str, path: &str) -> Result<Value> {
        validate_safe_path(path)?;
        self.client.get_json(self.service(service)?, path).await
    }

    /// POST passthrough. Mutating but NOT destructive, so it runs immediately —
    /// no confirm gate (the write-confirm gate is reserved for destructive
    /// deletes; see [`api_delete`](Self::api_delete)).
    pub async fn api_post(&self, service: &str, path: &str, body: Value) -> Result<Value> {
        validate_safe_path(path)?;
        self.client
            .post_json(self.service(service)?, path, body)
            .await
    }

    /// PUT passthrough. Mutating but not destructive — runs immediately (see
    /// [`api_post`](Self::api_post)).
    pub async fn api_put(&self, service: &str, path: &str, body: Value) -> Result<Value> {
        validate_safe_path(path)?;
        self.client
            .put_json(self.service(service)?, path, body)
            .await
    }

    /// DELETE passthrough — the one destructive generic verb. On the MCP
    /// surface, `rmcp_server.rs` elicits the connected client for confirmation
    /// before dispatch reaches here; the CLI and Code Mode run it immediately.
    pub async fn api_delete(
        &self,
        service: &str,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value> {
        validate_safe_path(path)?;
        self.client
            .delete_json(self.service(service)?, path, body)
            .await
    }

    /// Resolve a configured service by name/kind and verify its capability
    /// matches `cap`. Curated command handlers use this so a command targeting one
    /// capability cannot run against an unrelated kind.
    pub(crate) fn service_of_capability(
        &self,
        name: &str,
        cap: crate::capability::Capability,
    ) -> Result<&ServiceConfig> {
        let service = self.service(name)?;
        if service.kind.capability() != cap {
            anyhow::bail!(
                "service {} (kind={}) does not provide the {:?} capability",
                service.name,
                service.kind.as_str(),
                cap
            );
        }
        Ok(service)
    }

    /// Resolve a configured service name/kind to its [`ServiceKind`], if known.
    ///
    /// Used by the shared action×kind validation guard so both the CLI and MCP
    /// dispatch paths reject curated commands run against an incompatible kind.
    /// Returns `None` when the name does not match any configured service (the
    /// downstream service lookup then produces the canonical "unknown service"
    /// error).
    pub(crate) fn kind_of(&self, name: &str) -> Result<Option<ServiceKind>> {
        self.find_service(name)
            .map(|service| service.map(|s| s.kind))
    }

    pub(crate) fn is_read_only(&self, name: &str) -> Result<bool> {
        Ok(self
            .find_service(name)?
            .is_some_and(|service| service.read_only))
    }

    /// Single source of truth for name/kind → service resolution. Trims and
    /// lowercases `name`, then matches a configured service by its name or kind.
    /// Returns `None` for an empty name or no match. Callers that additionally
    /// require a configured `base_url` layer that check on top (see `service`).
    fn find_service(&self, name: &str) -> Result<Option<&ServiceConfig>> {
        let needle = name.trim().to_ascii_lowercase();
        if needle.is_empty() {
            return Ok(None);
        }
        // Configured identity is authoritative. A service named `movies` must
        // resolve to that exact instance even when another instance has a kind
        // whose canonical name also appears elsewhere.
        let exact = self
            .services
            .iter()
            .filter(|service| service.name.eq_ignore_ascii_case(&needle))
            .collect::<Vec<_>>();
        match exact.as_slice() {
            [service] => return Ok(Some(*service)),
            [] => {}
            _ => anyhow::bail!("configured service name `{needle}` is duplicated"),
        }

        let mut kind_matches = self
            .services
            .iter()
            .filter(|service| service.kind.as_str() == needle);
        let first = kind_matches.next();
        if first.is_some() && kind_matches.next().is_some() {
            anyhow::bail!(
                "service kind `{needle}` is ambiguous; use one of the configured service names: {}",
                self.services
                    .iter()
                    .filter(|service| service.kind.as_str() == needle)
                    .map(|service| service.name.as_str())
                    .collect::<Vec<_>>()
                    .join(", ")
            );
        }
        Ok(first)
    }

    /// Transport-client accessor for capability submodules (e.g. `app::arr`).
    /// Keeps `client` private to `YarrService` while letting curated command
    /// logic in sibling modules issue requests through the shared transport.
    pub(crate) fn client_ref(&self) -> &YarrClient {
        &self.client
    }

    fn service(&self, name: &str) -> Result<&ServiceConfig> {
        if name.trim().is_empty() {
            anyhow::bail!("service is required");
        }
        // Shared resolution (`find_service`), then layer the empty-`base_url`
        // rejection that callers of `service()` require but `kind_of()` does not.
        let service = self
            .find_service(name)?
            .ok_or_else(|| anyhow!("unknown yarr service: {name}"))?;
        if service.base_url.trim().is_empty() {
            anyhow::bail!("{} base_url is not configured", service.name);
        }
        Ok(service)
    }
}
