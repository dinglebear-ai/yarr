//! The parsed-CLI `Command` enum — pure data, no logic.
//!
//! This is the output of [`crate::cli::parse_args`] and the input to
//! [`crate::cli::run`]. Variants fall into two groups:
//!
//!   - **Service-grouped** (`Status`/`Get`/`Post`/`Put`/`Delete`) — produced by
//!     the per-capability parse hook in [`crate::cli::router`]. These cover the
//!     generic passthrough verbs; curated `<service> <verb>` commands are parsed
//!     by the live `src/cli/commands/<cap>.rs` modules and dispatched through the
//!     same shared service layer.
//!   - **Infra, service-less** (`Help`/`Doctor`/`Watch`/`Setup`)
//!     — produced directly by the router's infra branch.
//!
//! `Doctor`, `Watch`, and `Setup` are dispatched specially in
//! `main.rs::run_cli` because they need the full `Config` (MCP fields), not just
//! `YarrConfig`. `serve`/`mcp` never reach this enum — `main.rs` intercepts
//! them as run modes before `parse_args` is called.

use super::setup::SetupCommand;
use std::path::PathBuf;

// `Eq` is intentionally not derived: the `Curated` variant carries a
// `serde_json::Value` (which is `PartialEq` but not `Eq`). `PartialEq` is all the
// tests need (`assert_eq!`).
#[derive(Debug, PartialEq)]
pub enum Command {
    /// `yarr <service> status` — upstream status for one service.
    Status {
        service: String,
    },
    /// `yarr <service> get --path P` — passthrough GET.
    Get {
        service: String,
        path: String,
    },
    /// `yarr <service> post --path P [--body JSON]` — passthrough POST
    /// (non-destructive; runs immediately).
    Post {
        service: String,
        path: String,
        body: serde_json::Value,
    },
    /// `yarr <service> put --path P [--body JSON]` — passthrough PUT
    /// (non-destructive; runs immediately).
    Put {
        service: String,
        path: String,
        body: serde_json::Value,
    },
    /// `yarr <service> delete --path P [--body JSON]` — passthrough DELETE
    /// (destructive; runs immediately).
    Delete {
        service: String,
        path: String,
        body: Option<serde_json::Value>,
    },
    /// `yarr <service> op <name> [--args JSON]` — invoke a generated OpenAPI
    /// operation directly (the spec-backed kinds' surface). Mirrors the
    /// in-Code-Mode `<service>.<op>(args)` callable but reachable from the CLI —
    /// runs immediately, including destructive DELETE ops.
    Op {
        service: String,
        op: String,
        args: serde_json::Value,
    },
    /// `yarr help` — structured JSON action reference.
    Help,
    /// `yarr discover plex` — scaffold a reviewable Plex fleet from plex.tv.
    DiscoverPlex {
        owned_only: bool,
        token_env: String,
        output: PathBuf,
        env_output: PathBuf,
        diff: bool,
    },
    /// `yarr fleet status` — reachability, version, and latency for every instance.
    FleetStatus,
    /// `yarr codemode --code JS` / `--file PATH` — run a JS script that calls
    /// yarr actions. Infra, service-less; dispatched through the same
    /// `execute_service_action` path as the MCP `codemode` action.
    CodeMode {
        code: String,
    },
    /// `yarr snippet list|save|run|delete ...` — manage saved Code Mode
    /// snippets. Infra, service-less; same shared dispatch as the MCP `snippet_*`
    /// actions.
    SnippetList,
    SnippetSave {
        name: String,
        code: String,
        description: Option<String>,
    },
    SnippetRun {
        name: String,
        input: serde_json::Value,
    },
    SnippetDelete {
        name: String,
    },
    /// `yarr doctor [--json]` — pre-flight environment validation (§48).
    ///
    /// Dispatched in `main.rs::run_cli` (needs full `Config`).
    Doctor {
        /// Output JSON instead of human-readable text.
        json: bool,
    },
    /// `yarr watch [--url URL] [--interval N] [--once]` — poll a health endpoint.
    ///
    /// Dispatched in `main.rs::run_cli` (needs the MCP port for the default URL).
    Watch {
        /// Base URL or /health URL of the MCP server (default: http://localhost:{YARR_MCP_PORT}).
        url: Option<String>,
        /// Poll interval in seconds (default: 10).
        interval: u64,
        /// Probe once and exit non-zero unless the endpoint returns 2xx.
        once: bool,
    },
    /// `yarr setup ...` — plugin setup wizard. Dispatched in `main.rs::run_cli`.
    Setup(SetupCommand),
    /// `yarr <service> <curated-verb> [flags]` — a curated, capability-scoped
    /// command resolved from the registry. `action` is the MCP (snake_case) name;
    /// `params` is the JSON args object the router assembled from the positional
    /// service + flags. Dispatched through the SAME `execute_service_action` path
    /// as MCP, so CLI↔MCP parity is automatic.
    Curated {
        action: &'static str,
        params: serde_json::Value,
    },
}

#[cfg(test)]
#[path = "command_tests.rs"]
mod tests;
