//! Code Mode orchestration (business layer).
//!
//! Bridges the synchronous JS engine ([`crate::codemode`]) to yarr's async
//! action dispatch. The engine runs on a blocking thread; each `callTool` becomes
//! a [`ToolRequest`] sent over a channel to the async loop here, which dispatches
//! it through the shared [`crate::actions::execute_service_action`] path and sends the result
//! back. MCP callers install a guard that reauthorizes every inner action and
//! requires fail-closed elicitation for destructive calls; direct trusted CLI
//! execution has no peer elicitation channel.

use std::pin::Pin;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

use anyhow::Result;
use serde_json::{Value, json};
use tokio::sync::{mpsc, oneshot};

use crate::actions::YarrAction;
use crate::app::YarrService;
use crate::codemode::{
    self, CODEMODE_ARTIFACTS_SUBDIR, CODEMODE_MAX_ARTIFACT_TOTAL_BYTES, CODEMODE_MAX_ARTIFACTS,
    CODEMODE_MAX_CODE_BYTES, CODEMODE_MEMORY_LIMIT, CODEMODE_STACK_LIMIT, EngineLimits,
    EngineOutcome,
};

/// Process-global monotonic sequence appended to each run-id. Two concurrent runs
/// in the same process could compute the same nanosecond timestamp; the sequence
/// guarantees their run-ids (and thus artifacts dirs) are always distinct.
static CODEMODE_RUN_SEQ: AtomicU64 = AtomicU64::new(0);
static ARTIFACT_WRITE_LOCK: Mutex<()> = Mutex::new(());

#[path = "codemode_artifacts.rs"]
mod artifacts;
#[path = "codemode_dispatch.rs"]
mod dispatch;
#[path = "codemode_fleet.rs"]
mod fleet;
#[path = "codemode_runtime.rs"]
mod runtime;
#[path = "codemode_snippets.rs"]
mod snippets;

use artifacts::{prune_artifact_runs, write_codemode_artifact};
use runtime::{ActiveRunMetric, ArtifactRequest, EmbedRequest, ToolRequest};

#[derive(Debug, Clone, serde::Deserialize)]
pub(crate) struct FleetMapRequest {
    pub kind: String,
    pub method: String,
    #[serde(default)]
    pub args: Value,
}

/// MCP-supplied defense-in-depth policy for every action emitted by a Code
/// Mode script. CLI runs use no guard and retain their local-trust behavior.
pub(crate) trait CodeModeCallGuard: Send + Sync {
    fn authorize<'a>(
        &'a self,
        action: &'a YarrAction,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>>;

    fn authorize_fleet<'a>(
        &'a self,
        request: &'a FleetMapRequest,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>>;
}

impl YarrService {
    /// Execute a Code Mode script: run `code` (a JS async-arrow expression) in the
    /// sandbox, dispatching its `callTool` / per-service `<service>.<verb>()` /
    /// `api.<service>` calls through the shared action path, and return
    /// `{ result, calls, logs }`.
    ///
    /// `result` is the script's return value, `calls` is the per-call audit log
    /// (`{action, ok, error}`), and `logs` is captured `console.*` output.
    pub async fn codemode(&self, code: &str) -> Result<Value> {
        self.run_script(code, None, false, None).await
    }

    pub(crate) async fn codemode_with_guard(
        &self,
        code: &str,
        guard: std::sync::Arc<dyn CodeModeCallGuard>,
    ) -> Result<Value> {
        self.run_script(code, None, false, Some(guard)).await
    }

    /// Shared executor for a Code Mode script. `input_json` binds `globalThis.input`
    /// (for `snippet_run`); `in_snippet` is true when running a saved snippet, which
    /// refuses a further `snippet_run` so snippets can't recurse into snippets
    /// (the only nesting bound needed — max depth is 2).
    async fn run_script(
        &self,
        code: &str,
        input_json: Option<String>,
        in_snippet: bool,
        guard: Option<std::sync::Arc<dyn CodeModeCallGuard>>,
    ) -> Result<Value> {
        if code.trim().is_empty() {
            anyhow::bail!("codemode requires a non-empty `code` string");
        }
        if code.len() > CODEMODE_MAX_CODE_BYTES {
            anyhow::bail!(
                "codemode `code` is {} bytes; the limit is {CODEMODE_MAX_CODE_BYTES}",
                code.len()
            );
        }

        let _permit = tokio::time::timeout(
            self.codemode_queue_timeout,
            self.codemode_slots.clone().acquire_owned(),
        )
        .await
        .map_err(|_| anyhow::anyhow!("codemode is busy; retry after the queue clears"))?
        .map_err(|_| anyhow::anyhow!("codemode execution pool is unavailable"))?;
        let mut active_metric = ActiveRunMetric::begin();
        axum_prometheus::metrics::counter!("yarr_codemode_runs_total", "outcome" => "started")
            .increment(1);

        let preamble = self.codemode_preamble();
        let code = code.to_owned();
        let (req_tx, mut req_rx) = mpsc::channel::<ToolRequest>(8);
        let (art_tx, mut art_rx) = mpsc::channel::<ArtifactRequest>(8);
        let (embed_tx, mut embed_rx) = mpsc::channel::<EmbedRequest>(8);
        let tokio_deadline = tokio::time::Instant::now() + self.codemode_execution_timeout;
        let limits = EngineLimits {
            memory_bytes: CODEMODE_MEMORY_LIMIT,
            stack_bytes: CODEMODE_STACK_LIMIT,
            deadline: Instant::now() + self.codemode_execution_timeout,
        };

        // Per-run artifacts dir, computed host-side (the engine never reads a clock).
        // `None` when no artifacts root is configured → `writeArtifact` errors.
        let run = self.data_dir().map(|root| {
            prune_artifact_runs(root);
            let nanos = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_nanos())
                .unwrap_or(0);
            let seq = CODEMODE_RUN_SEQ.fetch_add(1, Ordering::Relaxed);
            let run_id = format!("{nanos}-{}-{seq}", std::process::id());
            let dir = root.join(CODEMODE_ARTIFACTS_SUBDIR).join(&run_id);
            (run_id, dir)
        });

        // The engine runs on a blocking thread; `on_call`/`on_write` block it on a
        // channel round-trip to the async loop below (never the reverse, so no
        // deadlock).
        let handle = tokio::task::spawn_blocking(move || {
            let on_call: codemode::ToolCaller = Box::new(move |id: &str, params_json: &str| {
                let (reply_tx, reply_rx) = oneshot::channel();
                req_tx
                    .blocking_send(ToolRequest {
                        id: id.to_owned(),
                        params_json: params_json.to_owned(),
                        reply: reply_tx,
                    })
                    .map_err(|_| "codemode dispatcher unavailable".to_string())?;
                reply_rx
                    .blocking_recv()
                    .map_err(|_| "codemode dispatch was dropped".to_string())?
            });
            let on_write: codemode::ArtifactWriter =
                Box::new(move |path: &str, content: &str, options_json: &str| {
                    let (reply_tx, reply_rx) = oneshot::channel();
                    art_tx
                        .blocking_send(ArtifactRequest {
                            path: path.to_owned(),
                            content: content.to_owned(),
                            options_json: options_json.to_owned(),
                            reply: reply_tx,
                        })
                        .map_err(|_| "codemode artifact writer unavailable".to_string())?;
                    reply_rx
                        .blocking_recv()
                        .map_err(|_| "codemode artifact write was dropped".to_string())?
                });
            // Always Ok in practice (semantic search fails open — see EmbedCaller's
            // docs); the channel-unavailable/dropped cases below are the only ways
            // this can actually be Err, and both mean the run is already ending.
            let on_embed: codemode::EmbedCaller = Box::new(move |query: &str| {
                let (reply_tx, reply_rx) = oneshot::channel();
                embed_tx
                    .blocking_send(EmbedRequest {
                        query: query.to_owned(),
                        reply: reply_tx,
                    })
                    .map_err(|_| "codemode embed bridge unavailable".to_string())?;
                reply_rx
                    .blocking_recv()
                    .map_err(|_| "codemode embed request was dropped".to_string())?
            });
            codemode::run(
                &code,
                &preamble,
                &limits,
                on_call,
                on_write,
                on_embed,
                input_json.as_deref(),
            )
        });

        // Drive ALL THREE channels until each is drained to `None`. The engine drops
        // all three senders together when it finishes, but buffered messages must
        // still be received — so we keep selecting (with per-branch `done` guards,
        // never breaking on the first `None`) until all are exhausted. Guarding the
        // branches also avoids busy-spinning on a closed receiver.
        let mut calls: Vec<Value> = Vec::new();
        let mut artifacts: Vec<Value> = Vec::new();
        let mut written = 0usize;
        let mut written_bytes = 0usize;
        let mut req_done = false;
        let mut art_done = false;
        let mut embed_done = false;
        loop {
            tokio::select! {
                maybe = req_rx.recv(), if !req_done => match maybe {
                    Some(req) => {
                        let started = Instant::now();
                        let outcome = tokio::time::timeout_at(
                            tokio_deadline,
                            self.codemode_dispatch(
                                &req.id,
                                &req.params_json,
                                in_snippet,
                                guard.clone(),
                            ),
                        )
                        .await
                        .unwrap_or_else(|_| Err("codemode absolute deadline exceeded".to_string()));
                        let elapsed_ms = started.elapsed().as_millis();
                        let ok = outcome.is_ok();
                        let error = outcome.as_ref().err().cloned();
                        // Record whether the script actually received the result: a
                        // failed send means the engine already abandoned this call
                        // (deadline fired mid-flight), so `ok` describes the action
                        // but the script never saw it — surface that, never hide it.
                        let delivered = req.reply.send(outcome).is_ok();
                        calls.push(json!({
                            "action": req.id, "ok": ok, "error": error,
                            "delivered": delivered, "elapsed_ms": elapsed_ms,
                        }));
                    }
                    None => req_done = true,
                },
                maybe = art_rx.recv(), if !art_done => match maybe {
                    Some(art) => {
                        let next_total = written_bytes.saturating_add(art.content.len());
                        let outcome = if written >= CODEMODE_MAX_ARTIFACTS {
                            Err(format!(
                                "writeArtifact limit reached ({CODEMODE_MAX_ARTIFACTS} artifacts per run)"
                            ))
                        } else if next_total > CODEMODE_MAX_ARTIFACT_TOTAL_BYTES {
                            Err(format!(
                                "writeArtifact aggregate limit exceeded ({CODEMODE_MAX_ARTIFACT_TOTAL_BYTES} bytes per run)"
                            ))
                        } else {
                            let run = run.clone();
                            let path = art.path.clone();
                            let content = art.content.clone();
                            let options = art.options_json.clone();
                            match tokio::time::timeout_at(
                                tokio_deadline,
                                tokio::task::spawn_blocking(move || {
                                    write_codemode_artifact(
                                        run.as_ref(), &path, &content, &options,
                                    )
                                }),
                            )
                            .await
                            {
                                Ok(Ok(result)) => result,
                                Ok(Err(error)) => Err(format!("artifact writer failed: {error}")),
                                Err(_) => Err("codemode absolute deadline exceeded".to_string()),
                            }
                        };
                        if outcome.is_ok() {
                            written += 1;
                            written_bytes = next_total;
                            axum_prometheus::metrics::counter!(
                                "yarr_artifact_bytes_total",
                                "outcome" => "written"
                            )
                            .increment(art.content.len() as u64);
                        } else {
                            axum_prometheus::metrics::counter!(
                                "yarr_artifact_bytes_total",
                                "outcome" => "error"
                            )
                            .increment(art.content.len() as u64);
                        }
                        let ok = outcome.is_ok();
                        let error = outcome.as_ref().err().cloned();
                        // The file is already written + counted; if the receipt can't
                        // be delivered (receiver dropped), record `delivered:false` so
                        // the response doesn't claim a write the script never saw.
                        let delivered = art.reply.send(outcome).is_ok();
                        artifacts.push(json!({
                            "path": art.path, "ok": ok, "error": error, "delivered": delivered,
                        }));
                    }
                    None => art_done = true,
                },
                // Deliberately NOT pushed onto `calls`: this is host-internal
                // plumbing for codemode.search()'s own implementation, not a
                // script-visible tool call — see EmbedRequest's docs.
                maybe = embed_rx.recv(), if !embed_done => match maybe {
                    Some(req) => {
                        let scores = tokio::time::timeout_at(
                            tokio_deadline,
                            self.codemode_semantic_search(&req.query),
                        )
                        .await
                        .unwrap_or_else(|_| "{}".to_string());
                        let _ = req.reply.send(Ok(scores));
                    }
                    None => embed_done = true,
                },
                else => break,
            }
        }

        let outcome: EngineOutcome = handle
            .await
            .map_err(|e| anyhow::anyhow!("codemode task panicked: {e}"))?
            .map_err(|e| anyhow::anyhow!("{e}"))?;
        active_metric.complete();

        let mut response = json!({
            "result": outcome.result,
            "calls": calls,
            "logs": outcome.logs,
            "artifacts": artifacts,
        });
        if let Some((run_id, _)) = run {
            response["artifactsRunId"] = Value::String(run_id);
        }
        // Shape the envelope to a Code-Mode budget BELOW the transport cap: trim
        // logs oldest-first to preserve `result`, marker-ize an oversized `result`
        // only if dropping all logs still doesn't fit. Keeps the envelope parseable
        // instead of letting the blunt transport cap slice it mid-JSON.
        crate::codemode::truncate::fit_response(&mut response);
        Ok(response)
    }
}

#[cfg(test)]
#[path = "codemode_tests.rs"]
mod tests;

#[cfg(test)]
#[path = "codemode_fleet_tests.rs"]
mod fleet_tests;
