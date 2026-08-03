//! Code Mode — run a JavaScript async arrow function that calls yarr actions.
//!
//! This is a port of lab's "Code Mode" concept (gateway `codemode` tool) adapted
//! to yarr's single-binary, action-dispatched model:
//!
//!   * **Catalog.** Lab exposes upstream MCP servers; yarr exposes its *action
//!     registry*. The in-sandbox `callTool(action, params)`, the per-service
//!     `<service>.<verb>(params)` callables, and the raw `api.<service>` client all
//!     dispatch through the same shared
//!     [`crate::actions::execute_service_action`] path the CLI and MCP shims use.
//!   * **Engine.** Lab runs QuickJS-via-`javy` inside a `wasmtime` subprocess.
//!     yarr embeds QuickJS in-process via [`rquickjs`] — same engine semantics,
//!     no subprocess/wasm runtime, which fits a single binary. The engine runs on
//!     a blocking thread; `callTool` is a *synchronous* native function that blocks
//!     on a channel round-trip to the async dispatcher (see [`crate::app`]), so the
//!     JS `async`/`await` sugar is driven purely by the microtask pump — no async
//!     JS runtime is needed.
//!   * **Safety.** Memory and stack are capped, and a wall-clock deadline aborts
//!     runaway scripts via a QuickJS interrupt handler. MCP requests reauthorize
//!     every inner action and fail closed if a destructive call cannot elicit
//!     confirmation from the connected peer.
//!
//! Module layout:
//!   [`engine`] — the rquickjs execution harness (pure; takes an opaque tool
//!     caller). [`proxy`] — generates the JS preamble (`callTool`, `console`, the
//!     per-service `<service>.<verb>()` callables, and the `api.<service>` client)
//!     from the configured services.

pub mod artifact;
pub mod catalog;
pub mod dts;
pub mod engine;
pub mod proxy;
pub mod semantic;
pub mod store;
pub mod truncate;

use std::time::Duration;

pub use engine::{ArtifactWriter, EmbedCaller, EngineLimits, EngineOutcome, ToolCaller, run};
pub use proxy::build_preamble;
pub use semantic::{SemanticCache, semantic_scores, tei_url};

/// Wall-clock budget for a single Code Mode execution. Fleet fanout may wait on
/// several bounded waves of upstream requests, so this is deliberately longer
/// than the per-request HTTP timeout.
pub const CODEMODE_TIMEOUT: Duration = Duration::from_secs(120);
/// Maximum number of QuickJS runtimes admitted concurrently by one service.
pub const CODEMODE_MAX_CONCURRENT: usize = 4;
/// Maximum upstream calls concurrently dispatched by one fleet operation.
pub const FLEET_MAX_CONCURRENT: usize = 8;
/// Deadline applied independently to each upstream in a fleet operation.
pub const FLEET_INSTANCE_TIMEOUT: Duration = Duration::from_secs(8);
/// Maximum time a Code Mode request waits for an execution slot.
pub const CODEMODE_QUEUE_TIMEOUT: Duration = Duration::from_millis(500);
/// QuickJS heap cap (matches lab's 64 MiB).
pub const CODEMODE_MEMORY_LIMIT: usize = 64 * 1024 * 1024;
/// QuickJS native stack cap.
pub const CODEMODE_STACK_LIMIT: usize = 512 * 1024;
/// Maximum accepted user-code size, so an oversized payload is rejected before it
/// ever reaches the engine.
pub const CODEMODE_MAX_CODE_BYTES: usize = 64 * 1024;

/// Per-execution artifacts live under `<artifacts_root>/<CODEMODE_ARTIFACTS_SUBDIR>/<run-id>/`.
pub const CODEMODE_ARTIFACTS_SUBDIR: &str = "codemode/artifacts";
/// Maximum bytes a single `writeArtifact` may write to disk.
pub const CODEMODE_MAX_ARTIFACT_BYTES: usize = 8 * 1024 * 1024;
/// Maximum number of artifacts a single Code Mode run may write.
pub const CODEMODE_MAX_ARTIFACTS: usize = 64;
/// Aggregate artifact bytes allowed in one Code Mode run.
pub const CODEMODE_MAX_ARTIFACT_TOTAL_BYTES: usize = 16 * 1024 * 1024;
/// Aggregate retained bytes allowed below the Code Mode artifact root.
pub const CODEMODE_ARTIFACT_GLOBAL_BYTES: u64 = 1024 * 1024 * 1024;
/// Free disk space preserved when accepting a new artifact.
pub const CODEMODE_ARTIFACT_MIN_FREE_BYTES: u64 = 64 * 1024 * 1024;
/// Completed run directories older than this are removed at run admission.
pub const CODEMODE_ARTIFACT_RETENTION: Duration = Duration::from_secs(7 * 24 * 60 * 60);

/// Saved snippets live under `<data_dir>/<CODEMODE_SNIPPETS_SUBDIR>/<name>.{js,json}`.
pub const CODEMODE_SNIPPETS_SUBDIR: &str = "codemode/snippets";
/// Maximum snippet-name length (the name is the only filename component).
pub const CODEMODE_MAX_SNIPPET_NAME_LEN: usize = 64;

#[cfg(test)]
#[path = "codemode_tests.rs"]
mod tests;
