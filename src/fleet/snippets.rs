//! Canonical read-only Code Mode snippets for fleet-wide observability.

/// A built-in snippet that is shipped with yarr rather than persisted by a user.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BuiltinSnippet {
    pub name: &'static str,
    pub description: &'static str,
    pub source: &'static str,
}

const BUILTINS: [BuiltinSnippet; 4] = [
    BuiltinSnippet {
        name: "fleet_activity",
        description: "Current activity across configured Tautulli services.",
        source: "async () => fleet.map(fleet.all('tautulli'), 'stats_activity')",
    },
    BuiltinSnippet {
        name: "fleet_health",
        description: "Reachability, version, and latency for every configured service.",
        source: "async () => fleet.status()",
    },
    BuiltinSnippet {
        name: "fleet_library_sizes",
        description: "Library counts across configured Tautulli services.",
        source: "async () => fleet.map(fleet.all('tautulli'), 'stats_libraries')",
    },
    BuiltinSnippet {
        name: "fleet_transcode_load",
        description: "Active stream load across configured Tracearr services.",
        source: "async () => fleet.map(fleet.all('tracearr'), 'trace_streams', { summary: true })",
    },
];

pub fn builtins() -> &'static [BuiltinSnippet] {
    &BUILTINS
}

pub fn get(name: &str) -> Option<&'static BuiltinSnippet> {
    BUILTINS.iter().find(|snippet| snippet.name == name)
}
