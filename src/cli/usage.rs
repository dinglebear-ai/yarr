//! USAGE text, generated from the action registry + capability map.
//!
//! Rather than hand-maintaining a giant static string, the per-command lines are
//! derived from [`crate::actions::ACTION_SPECS`], [`crate::actions::curated_commands`],
//! and [`crate::config::ServiceKind`] so the help can never drift from the
//! grammar the router accepts. The result is cached with `OnceLock`.

use std::collections::BTreeSet;
use std::fmt::Write as _;
use std::sync::OnceLock;

use super::router::INFRA_VERBS;
use crate::actions::curated_commands;
use crate::capability::Capability;
use crate::config::ServiceKind;

/// Render (and cache) the full USAGE string.
pub fn usage() -> &'static str {
    static USAGE: OnceLock<String> = OnceLock::new();
    USAGE.get_or_init(build_usage)
}

fn build_usage() -> String {
    let mut out = String::new();
    out.push_str("Usage:\n");

    // Run modes (handled in main.rs, not the router).
    out.push_str("  yarr [serve]          Start MCP HTTP server (default)\n");
    out.push_str("  yarr mcp              Start MCP stdio transport\n\n");

    // Infra, service-less commands.
    out.push_str("Infra commands (service-less):\n");
    out.push_str("  yarr help                      Show JSON action reference\n");
    out.push_str("  yarr codemode --code JS|--file P  Run a JS script that calls yarr actions\n");
    out.push_str("  yarr snippet list|save|run|delete  Manage saved Code Mode snippets\n");
    out.push_str("  yarr discover plex [--owned-only|--include-shared] [--diff]  Scaffold or audit a Plex fleet\n");
    out.push_str(
        "  yarr fleet status              Show reachability, version, and latency per instance\n",
    );
    out.push_str("  yarr doctor [--json]           Run environment pre-flight checks\n");
    out.push_str(
        "  yarr watch [--url URL] [--interval N] [--once]  Poll server health; --once exits non-zero unless healthy\n",
    );
    out.push_str("  yarr setup check               Check plugin setup without mutating appdata\n");
    out.push_str("  yarr setup repair              Create missing appdata/env setup files\n");
    out.push_str("  yarr setup plugin-hook [--no-repair]  Plugin hook JSON contract\n\n");

    // Service-grouped commands. Generic verbs apply to every service.
    out.push_str("Service commands (yarr <service> <command>):\n");
    out.push_str("  yarr <service> status                       Show upstream service status\n");
    out.push_str("  yarr <service> get --path PATH              Passthrough GET\n");
    out.push_str("  yarr <service> post --path PATH [--body JSON]             Passthrough POST\n");
    out.push_str("  yarr <service> put --path PATH [--body JSON]              Passthrough PUT\n");
    out.push_str(
        "  yarr <service> delete --path PATH [--body JSON]            Passthrough DELETE (destructive, runs immediately)\n",
    );

    append_curated_commands(&mut out);

    // Services + infra verb inventory.
    let services = ServiceKind::ALL
        .iter()
        .map(|k| k.as_str())
        .collect::<Vec<_>>()
        .join(", ");
    let _ = write!(out, "\nServices:\n  {services}\n");
    let _ = write!(out, "\nInfra verbs:\n  {}\n", INFRA_VERBS.join(", "));

    out.push_str("\n  yarr --help                    Show this help\n");
    out.push_str("  yarr --version                 Show version\n");

    out.push_str(
        "\nEnvironment:\n\
         \x20 YARR_SERVICES         Comma-separated configured service names\n\
         \x20 YARR_<NAME>_URL       Upstream service URL\n\
         \x20 YARR_<NAME>_API_KEY   Upstream service API key\n\
         \x20 YARR_MCP_HOST         Bind host (default 127.0.0.1)\n\
         \x20 YARR_MCP_PORT         Bind port (default 40070)\n\
         \x20 YARR_MCP_NO_AUTH      Disable auth (loopback only)\n\
         \x20 YARR_MCP_TOKEN        Static bearer token\n\
         \x20 RUST_LOG                 Log filter (e.g. info,rmcp=warn)",
    );

    out
}

/// Append a per-capability section listing curated commands (empty until later
/// beads populate [`curated_commands`]).
fn append_curated_commands(out: &mut String) {
    if curated_commands().is_empty() {
        return;
    }
    out.push_str("\n\nCurated commands by capability:\n");
    // Stable ordering: iterate capabilities, then commands within each.
    let caps: BTreeSet<&'static str> = curated_commands()
        .iter()
        .map(|c| capability_label(c.capability))
        .collect();
    for cap in caps {
        let _ = writeln!(out, "  [{cap}]");
        for cmd in curated_commands()
            .iter()
            .filter(|c| capability_label(c.capability) == cap)
        {
            let services = services_for_capability(cmd.capability);
            // Registry names use MCP underscore form; the CLI verb is the
            // hyphenated spelling (the router maps hyphens → underscores).
            let verb = cli_verb(cmd.name);
            let _ = writeln!(
                out,
                "    yarr <{services}> {:<20} {}",
                verb, cmd.description
            );
        }
    }
}

/// The friendly CLI verb for a curated command's registry name.
///
/// The MCP action name is `snake_case` and globally unique (e.g. `stats_activity`,
/// `download_queue`, `request_create`), but the CLI is service-grouped so the verb
/// the user actually types is the short, capability-local form (`activity`,
/// `queue`, `request`). That mapping is owned by each `cli/commands/<cap>.rs`
/// module's `VERBS` table; consult it first so USAGE shows the real verb, and only
/// fall back to the kebab spelling of the action name if no table declares it.
pub(super) fn cli_verb(action_name: &str) -> String {
    super::commands::cli_verb_for_action(action_name)
        .map(str::to_owned)
        .unwrap_or_else(|| action_name.replace('_', "-"))
}

fn capability_label(cap: Capability) -> &'static str {
    match cap {
        Capability::ArrManager => "arr",
        Capability::Indexer => "indexer",
        Capability::DownloadClient => "download",
        Capability::MediaServer => "media",
        Capability::Requests => "requests",
        Capability::Stats => "stats",
        Capability::Subtitles => "subtitles",
        Capability::Trace => "trace",
        Capability::GenericOnly => "generic",
    }
}

/// Slash-joined list of service names sharing a capability — used as the
/// `<service>` placeholder in curated-command usage lines.
fn services_for_capability(cap: Capability) -> String {
    ServiceKind::ALL
        .iter()
        .filter(|k| k.capability() == cap)
        .map(|k| k.as_str())
        .collect::<Vec<_>>()
        .join("|")
}

#[cfg(test)]
#[path = "usage_tests.rs"]
mod tests;
