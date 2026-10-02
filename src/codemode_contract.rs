//! Neutral Code Mode contract shared by configuration and the Code Mode facade.
//!
//! Configured service names become Code Mode JavaScript namespaces, so the
//! configuration loader must reject names that collide with globals yarr owns —
//! and the public Code Mode runtime-budget defaults are configuration surface
//! too. Keeping all three here means configuration never imports the Code Mode
//! facade (enforced by the `naming` pattern check in `cargo xtask patterns`),
//! while Code Mode consumes the same single source of truth.

use std::time::Duration;

/// Global names owned by the Code Mode runtime or engine bridges.
///
/// A configured service is exposed as a Code Mode JavaScript namespace, so
/// configuration validation and preamble rendering must both consult this list.
pub(crate) const RESERVED_GLOBALS: &[&str] = &[
    "api",
    "callTool",
    "codemode",
    "console",
    "fleet",
    "globalThis",
    "input",
    "writeArtifact",
    "__yarrFmt",
    "__yarrRun",
    "__yarrLogs",
    "__yarrDone",
    "__yarrError",
    "__yarrResult",
    "__yarrEmitToolCall",
    "__yarrEmitWriteArtifact",
    "__yarrEmbedQuery",
    "__yarrInputJson",
    "__codemodeCatalog",
    "__codemodeTypes",
];

/// Render a configured service name as its stable Code Mode JavaScript namespace.
pub(crate) fn javascript_namespace(service_name: &str) -> String {
    service_name.replace('-', "_")
}

pub(crate) fn is_reserved_global(namespace: &str) -> bool {
    RESERVED_GLOBALS.contains(&namespace)
}

/// Wall-clock budget for a single Code Mode execution (matches lab's default).
pub const CODEMODE_TIMEOUT: Duration = Duration::from_secs(30);
/// Maximum number of QuickJS runtimes admitted concurrently by one service.
pub const CODEMODE_MAX_CONCURRENT: usize = 4;
/// Maximum time a Code Mode request waits for an execution slot.
pub const CODEMODE_QUEUE_TIMEOUT: Duration = Duration::from_millis(500);

#[cfg(test)]
#[path = "codemode_contract_tests.rs"]
mod tests;
