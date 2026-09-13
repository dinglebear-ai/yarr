//! Per-run metrics and channel request envelopes for Code Mode.

use anyhow::Result;
use tokio::sync::oneshot;

use crate::yarr::RequestDeadline;

pub(super) struct ActiveRunMetric {
    completed: bool,
}

impl ActiveRunMetric {
    pub(super) fn begin() -> Self {
        axum_prometheus::metrics::gauge!("yarr_codemode_active").increment(1.0);
        Self { completed: false }
    }

    pub(super) fn complete(&mut self) {
        self.completed = true;
        axum_prometheus::metrics::counter!("yarr_codemode_runs_total", "outcome" => "completed")
            .increment(1);
    }
}

impl Drop for ActiveRunMetric {
    fn drop(&mut self) {
        axum_prometheus::metrics::gauge!("yarr_codemode_active").decrement(1.0);
        if !self.completed {
            axum_prometheus::metrics::counter!("yarr_codemode_runs_total", "outcome" => "failed")
                .increment(1);
        }
    }
}

pub(super) struct ToolRequest {
    pub(super) id: String,
    pub(super) params_json: String,
    pub(super) deadline: RequestDeadline,
    pub(super) reply: oneshot::Sender<Result<String, String>>,
}

pub(super) struct ArtifactRequest {
    pub(super) path: String,
    pub(super) content: String,
    pub(super) options_json: String,
    pub(super) reply: oneshot::Sender<Result<String, String>>,
}

pub(super) struct EmbedRequest {
    pub(super) query: String,
    pub(super) reply: oneshot::Sender<Result<String, String>>,
}
