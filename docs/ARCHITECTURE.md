---
title: "Architecture"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "Architecture"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["contributors", "agents"]
scope: "project"
source_of_truth: false
upstream_refs: ["CLAUDE.md", "docs/PATTERNS.md"]
last_reviewed: "2026-07-16"
---

# Architecture

`yarr` is one Rust binary with a service-grouped CLI, stdio MCP transport, and
Streamable HTTP MCP transport. It does not expose a local REST action API or an
embedded web UI.

## Request flow

```text
CLI parser or MCP handler
        -> action registry and dispatcher
        -> YarrService business layer
        -> YarrClient transport and per-service authentication
        -> configured upstream service
```

Transport shims parse and format. Validation, orchestration, path allowlists,
and upstream-specific behavior belong in `src/app*`, `src/actions*`, and
`src/yarr*`.

## Current module map

| Surface | Files | Responsibility |
|---|---|---|
| Configuration | `src/config.rs`, `src/config/{auth,mcp,services}.rs` | TOML/env loading, defaults, service inventory, auth settings |
| Service topology | `src/capability.rs` | 11 `ServiceKind` descriptors, auth styles, prefixes, allowlists, capabilities |
| Action contract | `src/actions.rs`, `src/actions/{registry,model,parse,dispatch,help}.rs` | Generic and curated action metadata, parsing, dispatch |
| Business logic | `src/app.rs`, `src/app/{openapi_ops,download,stats,subtitles,trace,codemode}.rs` | Operation execution and curated behavior |
| Upstream transport | `src/yarr.rs`, `src/yarr/{auth,helpers}.rs` | HTTP, credentials, qBittorrent sessions, URL/response handling |
| CLI | `src/cli.rs`, `src/cli/` | Service-grouped commands plus doctor, setup, watch, snippets, Code Mode |
| MCP | `src/mcp.rs`, `src/mcp/` | Tool schemas, scopes, elicitation, prompts/resources, transports |
| HTTP host | `src/server.rs`, `src/server/routes.rs` | Auth policy, routing, probes, metrics, CORS/body limits |
| Code Mode | `src/codemode.rs`, `src/codemode/` | QuickJS sandbox, catalog, proxies, snippets, artifacts, truncation |
| OpenAPI metadata | `src/openapi.rs`, `src/openapi/generated/` | Generated operation/type tables and lookup |
| Models/logging | `src/models.rs`, `src/models/`, `src/logging.rs`, `src/logging/` | Curated typed responses and dual-output logging |

Every hand-written source module has a sibling `_tests.rs` file. Generated
OpenAPI tables are exempt and are checked by generator drift tests.

## Services and capabilities

The supported kinds are Sonarr, Radarr, Prowlarr, Overseerr, SABnzbd,
qBittorrent, Plex, Jellyfin, Tautulli, Bazarr, and Tracearr. Capability classes
are `ArrManager`, `Indexer`, `DownloadClient`, `MediaServer`, `Requests`,
`Stats`, `Subtitles`, `Trace`, and `GenericOnly`.

Six kinds use vendored OpenAPI metadata tables: Sonarr, Radarr, Prowlarr,
Overseerr, Plex, and Jellyfin. The tables contain operation metadata and
TypeScript discovery types; execution remains one generic function in
`src/app/openapi_ops.rs`. See `docs/API.md` for the fidelity boundary.

SABnzbd/qBittorrent, Tautulli, Bazarr, and Tracearr have curated command groups
in addition to the generic passthrough surface. `src/actions/registry.rs` and
`src/actions/commands/*.rs` are the executable action source of truth.

## Server surfaces

```text
40070/tcp
  POST /mcp       authenticated Streamable HTTP MCP
  GET  /health    public liveness
  GET  /ready     public local configuration readiness
  GET  /status    public redacted runtime identity
  GET  /metrics   public Prometheus exposition
  /mcp/.well-known/* and OAuth routes when OAuth is mounted
```

The auth layer wraps `/mcp`; public probes are deliberately separate. Protect
probe/metrics reachability at the network or proxy boundary where required.

## Auth and destructive actions

`AuthPolicy` distinguishes loopback development, an explicitly trusted gateway,
and mounted bearer/OAuth auth. Static HTTP bearer tokens receive the configured
`YARR_MCP_STATIC_TOKEN_SCOPES` and default to read-only; bearer-only Code Mode
requires an explicit `yarr:write` grant. OAuth tokens carry issued scopes. Stdio
is a local trusted transport.

MCP destructive actions require elicitation immediately before dispatch,
including calls nested inside Code Mode. A peer without elicitation support is
denied. CLI destructive commands have no interactive confirmation layer and run
immediately.

## Invariants

- Keep business behavior out of CLI/MCP formatting shims.
- Update action metadata and parsers together; run `cargo xtask tool-docs --check`.
- Keep service topology in `src/capability.rs`.
- Never hand-edit generated OpenAPI modules.
- Preserve the sibling-test convention and run `cargo xtask check-test-siblings`.
- Treat historical session/plan documents as evidence, not current authority.
