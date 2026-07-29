//! Axum router — wires HTTP endpoints to the MCP service and auth middleware.
//!
//! Endpoints:
//!   `POST /mcp`         — MCP Streamable HTTP transport (tools, resources, prompts)
//!   `GET  /health`      — Health check (unauthenticated)
//!   `GET  /ready`       — Local readiness check (unauthenticated)
//!   `GET  /status`      — Runtime status (unauthenticated, redacts secrets)
//!   `GET  /metrics`     — Prometheus metrics (unauthenticated)

use std::sync::{Arc, OnceLock};

use axum::{
    Router,
    extract::State,
    http::{HeaderValue, Method, StatusCode},
    response::Json,
    routing::get,
};
use axum_prometheus::{
    PrometheusMetricLayer, PrometheusMetricLayerBuilder,
    metrics_exporter_prometheus::PrometheusHandle,
};
use serde_json::json;
use tower_http::{cors::CorsLayer, limit::RequestBodyLimitLayer};

use crate::mcp::{allowed_origins, streamable_http_config, streamable_http_service};
use crate::server::{AppState, AuthPolicy, build_auth_layer};

const MCP_BODY_LIMIT_BYTES: usize = 65_536;

/// Process-global Prometheus layer/handle pair.
///
/// `PrometheusMetricLayerBuilder::with_prefix` writes a global prefix that can
/// only be set once per process, so the pair is constructed lazily exactly once
/// and cloned by each [`router`] call.
fn metrics_pair() -> &'static (PrometheusMetricLayer<'static>, PrometheusHandle) {
    static METRICS: OnceLock<(PrometheusMetricLayer<'static>, PrometheusHandle)> = OnceLock::new();
    METRICS.get_or_init(|| {
        PrometheusMetricLayerBuilder::new()
            .with_prefix("yarr")
            .with_default_metrics()
            .build_pair()
    })
}

pub fn router(state: AppState) -> Router {
    let rmcp_config = streamable_http_config(&state.config);

    // Prometheus request metrics (rate / latency / status). The layer records
    // every request that flows through it; the handle renders the text-format
    // exposition served at `/metrics`. `/metrics` is intentionally
    // unauthenticated, like the other probe routes.
    //
    // The builder's `.with_prefix(..)` sets a *process-global* metric prefix that
    // may only be set once, so the layer/handle pair is built a single time in a
    // `OnceLock` and cloned per router build (the binary builds one router, but
    // the test suite builds many within one process).
    let (prometheus_layer, metric_handle) = metrics_pair().clone();

    let resource_url = match &state.auth_policy {
        AuthPolicy::Mounted { .. } => state
            .config
            .auth
            .public_url
            .as_deref()
            .map(|u| Arc::<str>::from(format!("{}/mcp", u.trim_end_matches('/')))),
        AuthPolicy::LoopbackDev | AuthPolicy::TrustedGatewayUnscoped => None,
    };

    // Auth layer applied to /mcp.
    let static_token = if state.config.auth.mode == crate::config::AuthMode::OAuth
        && state.config.auth.disable_static_token_with_oauth
    {
        None
    } else {
        state.config.api_token.as_deref().map(Arc::<str>::from)
    };
    let auth_layer = build_auth_layer(
        &state.auth_policy,
        static_token,
        state.config.static_token_scopes.clone(),
        resource_url,
    );

    let api_and_mcp: Router<AppState> =
        Router::new().nest_service("/mcp", streamable_http_service(state.clone(), rmcp_config));

    let api_and_mcp_resolved: Router<()> = api_and_mcp.with_state(state.clone());

    let authenticated = if let Some(layer) = auth_layer {
        api_and_mcp_resolved.layer(layer)
    } else {
        api_and_mcp_resolved
    };

    let oauth_router: Option<Router> = if let AuthPolicy::Mounted {
        auth_state: Some(ref state_arc),
    } = state.auth_policy
    {
        let auth_state = state_arc.as_ref().clone();
        let path_based_discovery = Router::new()
            .route(
                "/mcp/.well-known/oauth-authorization-server",
                get(lab_auth::metadata::authorization_server_metadata),
            )
            .route(
                "/mcp/.well-known/openid-configuration",
                get(lab_auth::metadata::authorization_server_metadata),
            )
            .route(
                "/mcp/.well-known/oauth-protected-resource",
                get(lab_auth::metadata::protected_resource_metadata),
            )
            .with_state(auth_state.clone());
        Some(lab_auth::routes::router(auth_state).merge(path_based_discovery))
    } else {
        None
    };

    let public: Router<()> = Router::new()
        .route("/health", get(health))
        .route("/ready", get(ready))
        .route("/status", get(status))
        .with_state(state.clone());

    // `/metrics` carries the Prometheus handle as its state and is left
    // unauthenticated alongside the other probe routes.
    let metrics: Router<()> = Router::new()
        .route("/metrics", get(metrics_handler))
        .with_state(metric_handle);

    let mut base: Router<()> = Router::new()
        .merge(authenticated)
        .merge(public)
        .merge(metrics);

    if let Some(oauth) = oauth_router {
        // labby-auth applies bounded per-IP register, authorize, and token
        // limits internally; do not wrap it in a process-global bucket.
        base = base.merge(oauth);
    }

    let base =
        base.fallback(|| async { (StatusCode::NOT_FOUND, Json(json!({"error": "not_found"}))) });

    base.layer(RequestBodyLimitLayer::new(MCP_BODY_LIMIT_BYTES))
        .layer(cors_layer(&state.config))
        // Record metrics for every request that reaches the router.
        .layer(prometheus_layer)
}

/// `GET /health` — liveness probe (unauthenticated).
pub async fn health() -> Json<serde_json::Value> {
    tracing::debug!("health probe");
    Json(json!({ "status": "ok" }))
}

/// `GET /ready` — readiness probe. Reports local configuration readiness without
/// touching upstream services, so it is safe for frequent container probes.
pub async fn ready(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> (StatusCode, Json<serde_json::Value>) {
    let configured_services = state.service.configured_service_count();
    let ready = configured_services > 0;
    let status = if ready {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };
    (
        status,
        Json(json!({
            "status": if ready { "ready" } else { "not_ready" },
            "configured_services": configured_services,
        })),
    )
}

/// `GET /status` — local runtime status (unauthenticated, redacts secrets).
pub async fn status(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "server": state.config.server_name,
        "version": env!("CARGO_PKG_VERSION"),
        "transport": "http",
    }))
}

/// `GET /metrics` — Prometheus text-format exposition (unauthenticated).
///
/// Renders the metrics accumulated by the [`PrometheusMetricLayerBuilder`]
/// layer applied in [`router`].
pub async fn metrics_handler(State(handle): State<PrometheusHandle>) -> String {
    handle.render()
}

fn cors_layer(config: &crate::config::McpConfig) -> CorsLayer {
    let origins: Vec<HeaderValue> = allowed_origins(config)
        .into_iter()
        .filter_map(|o| match o.parse::<HeaderValue>() {
            Ok(hv) => Some(hv),
            Err(e) => {
                tracing::warn!(origin = %o, error = %e, "invalid CORS origin — skipping");
                None
            }
        })
        .collect();
    CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([Method::POST, Method::GET])
        .allow_headers([
            axum::http::header::AUTHORIZATION,
            axum::http::header::CONTENT_TYPE,
            axum::http::header::ACCEPT,
        ])
}

#[cfg(test)]
#[path = "routes_tests.rs"]
mod tests;
