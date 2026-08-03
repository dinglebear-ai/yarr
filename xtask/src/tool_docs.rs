use anyhow::{Result, bail};
use std::fmt::Write as _;
use std::path::Path;
use yarr::{
    ACTION_SPECS, Capability, CommandDescriptor, ServiceKind, capability_verb_tables,
    curated_commands,
};

mod endpoints;

use endpoints::{
    DOWNLOAD_ENDPOINTS, EndpointRow, STATS_ENDPOINTS, SUBTITLES_ENDPOINTS, TRACE_ENDPOINTS,
};

const OUTPUT: &str = "docs/TOOLS_ACTIONS_ENDPOINTS.md";

pub fn run(args: &[String]) -> Result<()> {
    yarr::openapi::validate_write_inventory().map_err(anyhow::Error::msg)?;
    let check = args.iter().any(|arg| arg == "--check");
    let doc = render();
    let path = Path::new(OUTPUT);
    if check {
        let current = std::fs::read_to_string(path)?;
        if current != doc {
            bail!("{OUTPUT} is stale; run `cargo xtask tool-docs`");
        }
        println!("==> {OUTPUT} is current");
    } else {
        std::fs::write(path, doc)?;
        println!("==> generated {OUTPUT}");
    }
    Ok(())
}

fn render() -> String {
    let mut out = String::new();
    render_header(&mut out);
    render_service_kinds(&mut out);
    render_schema_metadata(&mut out);
    render_generic_actions(&mut out);
    render_generated_operations(&mut out);
    render_capabilities(&mut out);
    render_generic_passthrough_families(&mut out);
    render_cli_verbs(&mut out);
    out
}

fn render_header(out: &mut String) {
    out.push_str(
        r#"---
title: "Tools, Actions, Params, and Endpoints"
doc_type: "reference"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "runtime"
source_of_truth: false
generated_by: "cargo xtask tool-docs"
last_reviewed: "2026-07-16"
---

# Tools, Actions, Params, and Endpoints

<!-- GENERATED: do not edit by hand. Run `cargo xtask tool-docs`. -->

The MCP surface is a single tool, `yarr`, which runs a Code Mode script (the
`codemode` action). Inside a script the fleet is reached through per-service
callables (`sonarr.get_series()`, `qbittorrent.download_queue()`), the
`api.<service>` raw passthrough, and `callTool`. This reference maps the
underlying action surface to the upstream HTTP endpoints it calls. Action names,
params, scopes, and mutability are read from the Rust action registry; curated
endpoint mappings are rendered from `xtask/src/tool_docs/endpoints.rs`.

"#,
    );
}

fn render_service_kinds(out: &mut String) {
    out.push_str(
        r#"## Service Kinds

There is one published MCP tool (`yarr`). The table below lists the service
*kinds* a configured service can take — each kind's capability, upstream API
prefix, and path allowlist (from `ServiceKind::descriptor()`). The 6 spec-backed
kinds (sonarr/radarr/prowlarr/overseerr/jellyfin/plex) expose supported upstream
operations as generated operations, with explicit omissions in the matrix below;
the rest keep curated commands and/or generic passthrough.

| Kind | Curated capability | API prefix | Path allowlist |
|---|---|---|---|
"#,
    );
    for kind in ServiceKind::ALL {
        let descriptor = kind.descriptor();
        let prefix = if descriptor.api_prefix.is_empty() {
            "(none)"
        } else {
            descriptor.api_prefix
        };
        let allowlist = descriptor.path_allowlist.join(", ");
        let _ = writeln!(
            out,
            "| `{}` | {:?} | `{}` | `{}` |",
            kind.as_str(),
            kind.capability(),
            prefix,
            allowlist,
        );
    }
}

fn render_schema_metadata(out: &mut String) {
    out.push_str(
        r#"
## Action Schema Metadata

Each service kind has a registry-derived action schema (it backs the per-service
callables and the `callTool` dispatch path; it is not published as a separate MCP
tool). Clients that understand schema extensions can read these fields instead of
scraping prose:

| Extension | Source | Purpose |
|---|---|---|
| `x-yarr-action-metadata` | `ACTION_SPECS` + `curated_commands()` | Per-action scope, params, mutability, destructive flag, capability, and allowed service kinds. |
| `x-yarr-service-metadata` | `ServiceKind::descriptor()` | Per-kind capability, auth style, API prefix, resource noun, and path allowlist. |
| `x-yarr-agent-guidance` | schema generator | Preferred first-pass reads, generic passthrough guidance, the elicitation model for destructive deletes, and response-shaping hints. |
| `properties.*.x-yarr-actions` | curated command descriptors | Lists which curated actions consume a lifted top-level param. |

"#,
    );
}

fn render_generic_actions(out: &mut String) {
    out.push_str("\n## Generic Actions\n\n");
    out.push_str("| Action | Params | Scope | Mutates | Upstream call |\n");
    out.push_str("|---|---|---|---:|---|\n");
    for spec in ACTION_SPECS {
        let params = generic_params(spec);
        let endpoint = generic_endpoint(spec.name);
        let _ = writeln!(
            out,
            "| `{}` | {} | {} | {} | {} |",
            spec.name,
            params,
            scope(spec.required_scope),
            yes_no(spec.mutates),
            endpoint,
        );
    }
}

fn render_generated_operations(out: &mut String) {
    out.push_str(
        r#"
## Generated Operations (spec-backed services)

`sonarr`, `radarr`, `prowlarr`, `overseerr`, `jellyfin`, and `plex` are generated
from their vendored OpenAPI specs (`cargo xtask gen-openapi` →
`src/openapi/generated/`). Every supported spec operation becomes a per-service callable
(`sonarr.get_series()`, `radarr.post_movie({ body })`) dispatched via the `op`
action; unsupported rows are explicitly omitted below. There are no hand-written
curated commands for these kinds. Discover them
with `codemode.search(query)` and inspect signatures / response types with
`codemode.describe(path)`. Direct local CLI scripts use the operator's local
trust boundary. MCP Code Mode re-authorizes every inner operation and requires
client elicitation for DELETEs; clients without elicitation support fail closed.

"#,
    );
    out.push_str("| Kind | Supported callables | Explicitly omitted operations |\n");
    out.push_str("|---|---:|---|\n");
    for kind in ServiceKind::ALL
        .iter()
        .copied()
        .filter(|kind| yarr::openapi::is_generated(*kind))
    {
        let supported = yarr::openapi::operations_for_kind(kind).len();
        let omissions = yarr::openapi::omitted_operations_for_kind(kind);
        let omitted = if omissions.is_empty() {
            "none".to_owned()
        } else {
            omissions
                .iter()
                .map(|row| {
                    format!(
                        "`{}` (`{} {}`): {}",
                        row.name,
                        row.method.as_str(),
                        row.path,
                        row.reason.replace('|', "\\|")
                    )
                })
                .collect::<Vec<_>>()
                .join("<br>")
        };
        let _ = writeln!(out, "| `{}` | {} | {} |", kind.as_str(), supported, omitted);
    }
    out.push_str(
        "\nThe generator omits an operation only when its OpenAPI serialization cannot be represented losslessly. Omitted rows are not callable through `op`; use a reviewed generic passthrough only when the service path allowlist permits it.\n\n",
    );
    out.push_str(
        "### Generated-operation safety coverage\n\nEvery generated operation is classified below. `destructive (elicited)` includes every DELETE plus explicitly audited high-impact non-DELETE operations. `cargo xtask tool-docs --check` fails when the reviewed write inventory changes.\n\n| Operation | Method | Safety |\n|---|---|---|\n",
    );
    for kind in ServiceKind::ALL
        .iter()
        .copied()
        .filter(|kind| yarr::openapi::is_generated(*kind))
    {
        for operation in yarr::openapi::operations_for_kind(kind) {
            let safety = match yarr::openapi::operation_safety(kind, operation) {
                yarr::openapi::OperationSafety::Read => "read",
                yarr::openapi::OperationSafety::Mutating => "mutating",
                yarr::openapi::OperationSafety::Destructive => "destructive (elicited)",
            };
            let _ = writeln!(
                out,
                "| `{}.{}` | `{}` | {} |",
                kind.as_str(),
                operation.name,
                operation.method.as_str(),
                safety
            );
        }
    }
    out.push('\n');
}

fn render_capabilities(out: &mut String) {
    render_capability(
        out,
        "Tautulli Actions",
        Capability::Stats,
        &["tautulli"],
        STATS_ENDPOINTS,
    );
    render_capability(
        out,
        "SABnzbd And qBittorrent Actions",
        Capability::DownloadClient,
        &["sabnzbd", "qbittorrent"],
        DOWNLOAD_ENDPOINTS,
    );
    render_capability(
        out,
        "Bazarr Subtitle Actions",
        Capability::Subtitles,
        &["bazarr"],
        SUBTITLES_ENDPOINTS,
    );
    render_capability(
        out,
        "Tracearr Actions",
        Capability::Trace,
        &["tracearr"],
        TRACE_ENDPOINTS,
    );
}

fn render_generic_passthrough_families(out: &mut String) {
    out.push_str(
        r#"
## Additional Generic Passthrough Families

In addition to their curated actions above, `bazarr` and `tracearr` support
`api_get`, `api_post`, `api_put`, and `api_delete` for reviewed endpoints within
the path allowlists from `ServiceKind::descriptor()`.

| Service | Useful endpoint families |
|---|---|
| `bazarr` | `/api/system/status`, `/api/system/health`, `/api/system/jobs`, `/api/system/tasks`, `/api/movies`, `/api/series`, `/api/movies/subtitles`, `/api/episodes/subtitles`, `/api/subtitles`, `/api/movies/wanted`, `/api/episodes/wanted`, `/api/movies/history`, `/api/episodes/history`, `/api/movies/blacklist`, `/api/episodes/blacklist`, `/api/providers`, `/api/plex/oauth/pin`, `/api/plex/oauth/logout`, `/api/plex/webhook/list` |
| `tracearr` | `/health`, `/api/v1/public/health`, `/api/v1/public/stats`, `/api/v1/public/stats/today`, `/api/v1/public/activity`, `/api/v1/public/streams`, `/api/v1/public/streams/{id}/terminate`, `/api/v1/public/users`, `/api/v1/public/violations`, `/api/v1/public/history`, `/api/v1/debug/sessions`, `/api/v1/debug/violations`, `/api/v1/debug/rules`, `/api/v1/debug/library`, `/api/v1/debug/users`, `/api/v1/debug/servers`, `/api/v1/debug/reset` |

These are exercised through the generic passthrough (`yarr <service> get|post|put|delete`)
and the live `cli` suite; the spec-backed services are covered exhaustively by the
`contract` suite (`cargo xtask live --suite contract`).
"#,
    );
}

fn render_cli_verbs(out: &mut String) {
    out.push_str(
        r#"
## CLI Verb Mapping

The CLI is service-grouped (`yarr <service> <verb>`). Only the curated
capabilities below have friendly verbs; the spec-backed services use
`yarr <service> op <operation>` (generated operations) or the generic
`get/post/put/delete` passthrough. Verb tables are read from the CLI registry.

| Capability | CLI verbs |
|---|---|
"#,
    );
    for (capability, verbs) in capability_verb_tables() {
        let list = verbs
            .iter()
            .map(|(verb, _action)| format!("`{verb}`"))
            .collect::<Vec<_>>()
            .join(", ");
        let _ = writeln!(out, "| {capability:?} | {list} |");
    }
}

fn render_capability(
    out: &mut String,
    title: &str,
    capability: Capability,
    tools: &[&str],
    endpoints: &[EndpointRow],
) {
    let _ = writeln!(out, "\n## {title}\n");
    let _ = writeln!(out, "Tools: {}.\n", tools.join(", "));
    out.push_str("| Action | Params | Scope | Mutates | Upstream call | Notes |\n");
    out.push_str("|---|---|---|---:|---|---|\n");
    for command in curated_commands()
        .iter()
        .filter(|command| command.capability == capability)
    {
        let endpoint = endpoints
            .iter()
            .find(|row| row.action == command.name)
            .copied()
            .unwrap_or(EndpointRow {
                action: command.name,
                tools: "",
                endpoint: "MISSING ENDPOINT MAPPING",
                notes: "",
            });
        let _ = writeln!(
            out,
            "| `{}` | {} | {} | {} | {} | {} |",
            command.name,
            params(command),
            command.required_scope,
            yes_no(command.mutates),
            endpoint_for_tools(endpoint),
            endpoint.notes,
        );
    }
}

#[path = "tool_docs/render.rs"]
mod render;
use render::*;

#[cfg(test)]
#[path = "tool_docs_tests.rs"]
mod tests;
