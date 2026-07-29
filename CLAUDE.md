# yarr — Claude Code instructions

## What this project is

Rust MCP and CLI server for a media automation fleet. It wraps **11 service kinds**: Sonarr, Radarr, Prowlarr, Overseerr, Jellyfin, Plex (spec-backed, generated) plus SABnzbd, qBittorrent, Tautulli, Bazarr, Tracearr (doc-backed, curated).

| Fact | Value |
|------|-------|
| Repo | `git@github.com:dinglebear-ai/yarr.git`, default branch `main` |
| Cargo workspace | 2 members — `.` (bin+lib `yarr`) and `xtask` |
| Edition / MSRV | 2024 / Rust 1.90 |
| MCP crate | `rmcp = "2.1.0"` (`server`, `macros`, `transport-streamable-http-server`, `transport-io`, `schemars`, `elicitation`) |
| Service port | `40070` (`YARR_MCP_PORT`) |
| npm launcher | `yarr-mcp@<Cargo version>`, pinned — never `latest` |

The MCP surface is a single `yarr` tool that runs Code Mode (the `codemode` action). The 6 spec-backed services (sonarr/radarr/prowlarr/overseerr/jellyfin/plex) are reached through **generated** per-service callables (from vendored OpenAPI specs); download/stats/subtitles/trace keep curated commands; every service also has `service_status` + the `api_get/post/put/delete` generic passthrough. Services are declared via `YARR_SERVICES` plus per-service env (see Environment variables).

## Module map

**Transport (`src/yarr*`)**

| File | Role |
|------|------|
| `src/yarr.rs` | `YarrClient` — pooled HTTP transport facade over configured service identities |
| `src/yarr/auth.rs` | Per-service auth application, driven by `AuthStyle` from the `KindDescriptor` table (header / query key / cookie session / Plex / Jellyfin tokens) |
| `src/yarr/helpers.rs` | `validate_service_path` (descriptor path allowlists, S7), `query_get` (percent-encodes user text for query APIs, S6), `slim()` field selection, error-body redaction |
| `src/yarr/openapi_transport.rs` | Lossless generated-operation request serialization and response decoding, including non-JSON/binary bodies |
| `src/yarr/response.rs` | Bounded upstream body collection and sanitized response/error handling |

**Capability model**

| File | Role |
|------|------|
| `src/capability.rs` | `Capability` enum + `KindDescriptor` table (`ServiceKind::descriptor()`): api prefix, auth style, resource noun, path allowlist, `has_metadata_profiles`. SSOT for "what each kind can do" |
| `src/config/services.rs` | The `ServiceKind` enum itself plus the `KindRow` table (canonical name, default status path, `FromStr` aliases). Adding a kind is a one-row edit + enum variant |

**Business layer (`src/app*`) — all logic lives here, never in shims**

| File | Role |
|------|------|
| `src/app.rs` | `YarrService` — business-layer facade; `execute_service_action` shared dispatch entry |
| `src/app/openapi_ops.rs` + `app/openapi_ops/` | Generated-operation executor: one `(service, op, args)` → upstream request for the 6 spec-backed kinds (sonarr/radarr/prowlarr/overseerr/jellyfin/plex). No per-op code — see `src/openapi*` |
| `src/app/download.rs` + `app/download/{sab,qbit}.rs` | DownloadClient — per-client implementations (SAB query API, qBittorrent v2 REST/cookie) |
| `src/app/stats.rs` | Stats (tautulli) activity/history/users/libraries plus maintenance writes, all run immediately (`delete_image_cache` is destructive — elicited on MCP); `{response}` envelope unwrap |
| `src/app/subtitles.rs` | Bazarr subtitle status, inventory, wanted, provider, and language reads |
| `src/app/trace.rs` | Tracearr health, analytics, streams, users, violations, history, and elicited stream termination |
| `src/app/codemode_{runtime,dispatch,artifacts,snippets}.rs` | Bounded Code Mode orchestration, independently authorized inner dispatch, quota-managed artifacts, and atomic snippet lifecycle |

The 6 spec-backed kinds have **no hand-written app modules** (the old `arr`/`indexer`/
`media_server`/`requests` capability handlers were removed) — their entire API is
generated. The four doc-backed capabilities keep curated commands: `download`
(sabnzbd/qbittorrent), `stats` (tautulli), `subtitles` (bazarr), and `trace`
(tracearr). They also retain the reviewed generic passthrough.

**Generated OpenAPI surface (`src/openapi*` + `specs/`)**

The 6 spec-backed services are generated from the vendored OpenAPI specs under
`specs/` by `cargo xtask gen-openapi` — 1,352 supported operations + 808 component types
total. Inside Code Mode they are per-service callables (`sonarr.get_series()`,
`radarr.post_movie({body})`, …) dispatched through the `op` action; component types
are surfaced via `codemode.describe`.

| File | Role |
|------|------|
| `src/openapi.rs` | Lossless `OperationSpec`/parameter/request/response/`TypeDef` runtime shapes + supported/omitted per-kind registries |
| `src/openapi/generated.rs` + `generated/<svc>.rs` | GENERATED tables (`OPERATIONS`, `TYPES`) — do not edit; regenerate with `cargo xtask gen-openapi` |
| `xtask/src/gen_openapi.rs` | The generator: parse spec `paths`+`components` → emit operation table + TS-interface type catalog |

**Code Mode (`src/codemode*` + `src/app/codemode.rs`)**

Run a JS async arrow fn that calls yarr actions — port of lab's gateway Code Mode. The `codemode` action (the single MCP `yarr` tool) / `yarr codemode --code|--file` (CLI) take a `code` string; the script gets **per-service callables `<service>.<verb>(params)`** with the service baked in (generated OpenAPI operations for the 6 spec-backed kinds via the `op` action, curated commands for download/stats/subtitles/trace), a typed `api.<service>.get/post/put/delete(path, body)` client, `callTool(action, params)` escape hatch, `codemode.search`/`describe` discovery, `codemode.run(name, input)`/`codemode.snippets()`, and `writeArtifact(path, content, options?)`. Returns `{result, calls, logs, artifacts, artifactsRunId?}`. Engine is in-process QuickJS via `rquickjs` (no wasmtime/subprocess), with four concurrent runtimes, a 500 ms admission timeout, and a 30 s absolute deadline. It runs on a `spawn_blocking` thread; `callTool`/`writeArtifact`/the internal embed bridge are synchronous native fns that block on a channel round-trip to the async dispatcher, so JS `async`/`await` is driven by a microtask pump. Requires `yarr:write`. Every inner action is independently reauthorized; destructive inner calls require MCP elicitation and fail closed when the peer cannot elicit. Direct trusted CLI execution has no elicitation channel. `YarrService.data_dir` (set from `resolve_data_dir()` in main.rs/cli.rs) roots both quota-managed artifacts and the atomic snippet store; `None` disables both.

`codemode.search` is lexical (token/substring) by default. Setting `YARR_CODEMODE_TEI_URL` blends in a semantic-similarity score (see `src/codemode/semantic.rs`) computed via a TEI (Text Embeddings Inference) server, so a query sharing no tokens with the right catalog entry (a synonym) can still surface it. Unset by default (no network call ever attempted); fails open to today's lexical-only ranking on any TEI error/timeout/cooldown. Catalog embeddings are computed lazily on first use and cached for the process's lifetime on `YarrService.semantic_cache` (`Arc<SemanticCache>`, shared across every clone).

| File | Role |
|------|------|
| `src/codemode.rs` | Facade + limits (admission/deadline, 64 MiB heap, stack, per-run/global artifact quotas and retention, code/snippet sizes) |
| `src/codemode/engine.rs` | rquickjs harness: register `__yarrEmitToolCall` + `__yarrEmitWriteArtifact` + `__yarrEmbedQuery`, bind `input` JSON, eval preamble + wrapped user code, drain microtasks (outside `ctx.with`), read back `{result, logs}`. Opaque `ToolCaller`/`ArtifactWriter`/`EmbedCaller` (`Box<dyn Fn>`); pure of tokio/domain |
| `src/codemode/proxy.rs` | Cached preamble builder — `callTool`, `console`, `__yarrRun`, per-service generated/curated callables, `api.<service>`, and discovery/snippet helpers |
| `src/codemode/semantic.rs` | `SemanticCache` (catalog-embedding cache + failure cooldown) and `semantic_scores(cache, tei_url, catalog, query)` — the TEI HTTP client + cosine-similarity ranking behind `codemode.search`'s blend. Fails open, always |
| `src/codemode/catalog.rs` | Registry-derived discovery catalog (`catalog_json()`), one entry per action — name/kind/scope/destructive/required_params/capability/allowed_kinds |
| `src/codemode/dts.rs` | JsonSchema→TypeScript converter for the **5 doc-based** `src/models` contracts → `service.TypeName` entries; `type_catalog_json_for(services)` MERGES these with the **generated** TS for the 6 spec-backed kinds, injected as `__codemodeTypes` and surfaced ON DEMAND via `codemode.describe`/`search` (configured-service-scoped) |
| `src/codemode/artifact.rs` | Pure fail-closed artifact-path validation (`validate_artifact_path`, `resolve_under_root`) + content-type inference |
| `src/codemode/store.rs` | Snippet store: `validate_snippet_name` (allowlist), `list`/`save`/`load_source`/`delete` under `<data_dir>/codemode/snippets` |
| `src/app/codemode.rs` | `YarrService::run_script` (shared executor; `codemode` = `run_script(code,None,false)`), dual-channel drain loop (calls + artifacts), `codemode_dispatch` (boxed recursion; refuses self/`snippet_run`-in-snippet — destructive actions dispatch normally), `snippet_list/save/run/delete`, `write_codemode_artifact` |

**Typed upstream contracts (`src/models*`)** — the **5 doc-based** services only

The 6 spec-backed services (sonarr/radarr/prowlarr/overseerr/jellyfin/plex) no longer
have hand-written models — their types are **generated** from `specs/` into
`src/openapi/generated/` (see Generated OpenAPI surface above). The 5 doc-based
services (no machine-readable spec) keep hand-modeled `Debug/Clone/PartialEq/Serialize/
Deserialize/JsonSchema` structs here. Every field is optional/defaulted, unknown fields
ignored, so partial/version-drifting payloads never hard-fail. Casing mirrors the wire
via `rename_all` + per-field renames (SABnzbd string-encoded numerics, etc.). Each
`<svc>.rs` has a colocated `<svc>_tests.rs`.

| File | Service / source | Notable types |
|------|------|------|
| `src/models.rs` | facade + design rules | — |
| `src/models/tautulli.rs` | Tautulli (docs) | generic `TautulliEnvelope<T>`, `GetActivityData`, `GetHistoryData`, users/libraries/server-info |
| `src/models/sabnzbd.rs` | SABnzbd (docs) | `QueueResponse`/`Queue`/`QueueSlot`, `HistoryResponse`/`HistorySlot`, `VersionResponse` (string-encoded numerics) |
| `src/models/qbittorrent.rs` | qBittorrent (docs) | `TorrentInfo`, `TorrentProperties`, `TransferInfo`, `Category`, `BuildInfo` |
| `src/models/bazarr.rs` | Bazarr (docs) | `SystemStatus`, subtitle/wanted rows, providers, languages |
| `src/models/tracearr.rs` + `models/tracearr_{core,activity,history}.rs` | Tracearr (docs) | public-API resources + `Health` |

**Action registry + dispatch (`src/actions*`)**

| File | Role |
|------|------|
| `src/actions.rs` | Re-export facade over the `actions/` submodules |
| `src/actions/registry.rs` + `actions/registry_queries.rs` | `ACTION_SPECS`, typed param metadata, `CommandDescriptor` table, and registry-derived query/help/schema surfaces |
| `src/actions/model.rs` | `ActionSpec`, `ActionTransport`, scopes, `YarrAction` enum, `ValidationError` |
| `src/actions/parse.rs` | REST↔MCP arg parsing helpers (`string_arg`, `i64_arg`, `string_array_arg`, …) |
| `src/actions/dispatch.rs` | `validate_action_for_service` (action×kind guard) + curated-command dispatch shared by CLI and MCP |
| `src/actions/help.rs` | Registry-derived `help` action text |
| `src/actions/commands.rs` | Aggregates the download/stats/subtitles/trace descriptor slices |
| `src/actions/commands/{download,stats,subtitles,trace}.rs` | Per-capability `CommandDescriptor` const slices for the doc-backed services |

**MCP protocol layer (`src/mcp*`)**

| File | Role |
|------|------|
| `src/mcp.rs` | MCP protocol layer — re-exports from `mcp/` submodules |
| `src/mcp/tools.rs` | MCP shim: parse JSON args → call service → return `Value` |
| `src/mcp/schemas.rs` | Tool JSON schema facade; enum derived from `all_action_names()` |
| `src/mcp/schemas/properties.rs` | Property set: generic + curated params + `verbose`/`fields` |
| `src/mcp/schemas/conditionals.rs` | Generated action→required-params and action→allowed-kind `allOf` fragments |
| `src/mcp/rmcp_server.rs` + `mcp/rmcp_server_{definitions,errors}.rs` | `ServerHandler`, advertised definitions, sanitized tool errors, scope checks, and fail-closed destructive gating |
| `src/mcp/prompts.rs` | MCP prompts (`quick_start`) |
| `src/mcp/transport.rs` | Streamable HTTP transport wiring and session lifecycle |

**CLI layer (`src/cli*`)**

| File | Role |
|------|------|
| `src/cli.rs` | CLI shim: `parse_args_from`, `run`; dispatches `Command` through the service |
| `src/cli/command.rs` | `Command` enum (incl. `Curated { action, params }`) — pure data |
| `src/cli/router.rs` + `cli/router_infra.rs` | Resolves infra verbs, exact configured service identities, and capability commands without a second dispatch implementation |
| `src/cli/parse.rs` | Shared flag parsing (`parse_passthrough_flags`, `reject_args`, …) |
| `src/cli/usage.rs` | USAGE generated from the registry + capability map; `cli_verb` renders friendly verbs |
| `src/cli/commands.rs` | Per-capability parse modules + `VERBS` verb→action tables (`capability_verb_tables`, `cli_verb_for_action`) |
| `src/cli/commands/{download,stats,subtitles,trace}.rs` | Per-capability CLI parsers + `VERBS` SSOT tables; generated services use `op` / Code Mode |
| `src/cli/doctor.rs` + `cli/doctor/checks.rs` | Pre-flight checks: env, connectivity, config validation |
| `src/cli/setup.rs` | Interactive first-run / plugin setup wizard |
| `src/cli/watch.rs` | Polls `/health` and emits state-change lines for plugin monitor |

**Server, config, infra**

| File | Role |
|------|------|
| `src/server.rs` | `AppState`, `AuthPolicy`, `build_auth_layer` — HTTP server state and auth policy |
| `src/server/routes.rs` + `server/token_rate_limit.rs` | Axum routes, readiness, metrics, OAuth discovery/token admission, and MCP transport |
| `src/config.rs` + `config/{environment,services,mcp,auth}.rs` | Typed config plus overlay-based env loading that leaves process-global environment unchanged |
| `src/logging.rs` + `logging/{aurora,formatter}.rs` | Bounded nonblocking rotating log subscriber + human/Aurora output |
| `src/token_limit.rs` | Token budget enforcement for MCP response payloads |
| `src/main.rs` | Mode dispatch: HTTP server / stdio / CLI |
| `src/lib.rs` | Public API + `testing` helpers (`loopback_state`, `bearer_state`) for integration tests |
| `src/*_tests.rs` | Colocated unit tests — one per module, wired via `#[path = "<mod>_tests.rs"] mod tests;` (see Testing) |

**Integration tests (`tests/`)**

| File | Role |
|------|------|
| `tests/cli_parse.rs` | CLI argument parsing |
| `tests/tool_dispatch.rs` | MCP tool dispatch (service-layer, no real credentials) |
| `tests/parity.rs` | Mechanical CLI ↔ MCP parity guard (see CLI ↔ MCP action parity) |
| `tests/plugin_contract.rs` + `tests/plugin_contract/` | Plugin manifest, setup-script, and OAuth contract. Split into `common.rs` / `manifests.rs` / `oauth.rs` / `setup.rs`, included via `#[path]` |
| `tests/template_invariants.rs` | Template-adaptation invariants + `schema_contract` doc test |

`tests/live/service_matrix.json` and `tests/mcporter/test-mcp.sh` are data/harness
files for the guarded live-read smoke checks, not `cargo test` targets.

## The thin-shim rule — enforce this hard

`src/mcp/tools.rs` and `src/cli.rs` contain **zero business logic**. They only:
1. Parse their input format (JSON args or CLI flags)
2. Call the corresponding `YarrService` method
3. Return the result

If you find yourself computing, filtering, transforming, or validating data in `tools.rs` or `cli.rs`, stop and move it to `app.rs`.

## How to add an action (checklist)

New surface for the 6 spec-backed services is added by **regenerating** from the
specs (`cargo xtask gen-openapi`), not hand-written. Curated commands remain only for
the doc-based download/stats/subtitles/trace capabilities (descriptor-table driven). The generic
`ACTION_SPECS` set (`service_status`, `api_get/post/put/delete`, `help`, `codemode`,
`op`, `snippet_*`) is closed — only extend it for new infra verbs.

**Adding a curated command:**

1. **`src/app/<cap>.rs`** — add `pub async fn your_command(&self, ...) -> Result<Value>` with the business logic and the actual HTTP call (via `YarrClient`). All logic lives here.

2. **`src/actions/commands/<cap>.rs`** — append a `CommandDescriptor` to the capability's const slice: `name` (globally-unique snake_case action), `capability`, `description`, `required_scope`, `required_params`/`optional_params`, `destructive`, `mutates`, and the `handler`. **`destructive` marks a delete that loses hard-to-recreate data** — it is the SSOT for `action_is_destructive`. Direct trusted CLI calls run without a confirm flag. On MCP, both outer calls and inner Code Mode calls are reauthorized; destructive calls require real interactive elicitation and fail closed when the client cannot elicit. Set `destructive: true` only for destructive deletes; every other write keeps `mutates: true, destructive: false`. The invariant is **`destructive => mutates`**, and `destructive` agrees with `action_is_destructive` — enforced by `tests/parity.rs`. The slice is concatenated at the single extension point in `src/actions/registry.rs::build_curated_commands` — no enum/match edits.

3. **`src/cli/commands/<cap>.rs`** — add a `(friendly-verb, action)` entry to that module's `VERBS` table (SSOT for USAGE + parity), and a parse arm that marshals flags → JSON `params` into `Command::Curated { action, params }`. No business logic.

4. **Schema/help/usage are automatic** — the enum, properties, conditionals, capability digest, help, and USAGE all derive from the descriptor. Only add a NEW param *type* to `src/mcp/schemas/properties.rs` if the param isn't already declared.

5. **Tests** — add a colocated unit test in the capability's `*_tests.rs`, a dispatch test in `tests/tool_dispatch.rs`, and (for parity) nothing extra: `tests/parity.rs` mechanically asserts the new command is reachable on both surfaces from the registry + `VERBS` table.

6. **`CHANGELOG.md`** — add an entry under `[Unreleased]`.

**Security (S6) — applies to every action that puts user-controlled text into an
upstream request:** route user text through typed params and the percent-encoding
`query_get` / `append_pair` helpers (`src/yarr/helpers.rs`). **Never `format!`
user text directly into a path or query string** — that allows query/path
injection (e.g. `cmd=delete` smuggled into a Tautulli `cmd`, a second `query`
param, or a `/api/v3/...` escape on a v1-only kind). The shared auth path injects
the API key exactly once; the app layer must not add it.

For actions with parameters, extract them with `string_arg`/`i64_arg`/`string_array_arg`
(in `src/actions/parse.rs`) from the `params` object in the shim.

## Destructive actions

`destructive` (`CommandDescriptor.destructive`, SSOT'd through `action_is_destructive`)
is metadata only — nothing in the app layer refuses to run a destructive action, and
there is no `confirm` parameter anywhere in the codebase. The only place `destructive`
changes behavior is `src/mcp/rmcp_server.rs`, which elicits the connected MCP client
(`src/mcp/elicit.rs::gate_destructive`) for a real interactive confirmation before a
destructive action dispatches. There is no way to pre-authorize or skip that prompt
from the call arguments. A client that cannot elicit fails closed. The CLI is a direct
trusted operator surface and runs without elicitation. Code Mode scripts reauthorize
every inner call, and destructive inner calls use the same fail-closed elicitation gate.

## Auth model

`AuthPolicy` is an enum with three states:

| Variant | When | Effect |
|---------|------|--------|
| `AuthPolicy::LoopbackDev` | `no_auth=true` or host is loopback (`localhost`, `127.*`, `::1`) via `McpConfig::is_loopback()` | No auth middleware; scope checks bypassed |
| `AuthPolicy::TrustedGatewayUnscoped` | `YARR_NOAUTH=true` on non-loopback behind an authz-enforcing gateway | No auth middleware; scope checks bypassed |
| `AuthPolicy::Mounted { auth_state: None }` | Default non-loopback | Static bearer token required |
| `AuthPolicy::Mounted { auth_state: Some(_) }` | `auth_mode = "oauth"` | Full Google OAuth + short-lived RS256 JWT issuance; `/token` is rate-limited while the time-bounded Ed25519 migration is open |

Auth is selected in `build_auth_policy()` in `main.rs`. Scopes are `yarr:read` and `yarr:write` (write satisfies read). `help` requires no scope; `service_status` and `snippet_list` need `yarr:read`; `api_get/post/put/delete`, `codemode`, `op`, and `snippet_save/run/delete` need `yarr:write`. Unknown actions get `DENY_SCOPE`.

**Code Mode is write-only.** The single `yarr` MCP tool dispatches the `codemode` action, which requires `yarr:write` — so a read-only token cannot run Code Mode at all, even for a script that only reads. The script body is opaque and may call any op (including writes/deletes), so it cannot be scoped to read; the whole surface is gated at write. A read-scoped token is limited to `service_status`, `snippet_list`, and `help`.

## Environment variables

Upstream services are configured as a set, not a single endpoint. `YARR_SERVICES` lists the service names; each name expands to a `YARR_<NAME>_*` env group (name uppercased, non-alphanumerics → `_`). Loaded by `load_services_from_env()` in `config.rs`.

| Variable | Default | Description |
|----------|---------|-------------|
| `YARR_SERVICES` | — | Comma-separated service names, e.g. `sonarr,radarr,overseerr` |
| `YARR_<NAME>_URL` | — | Per-service base URL |
| `YARR_<NAME>_API_KEY` | — | Per-service API key |
| `YARR_<NAME>_KIND` | _(name)_ | Service kind (`ServiceKind`); defaults to the name. Determines status path |
| `YARR_<NAME>_USERNAME` | — | Per-service basic-auth username (where applicable) |
| `YARR_<NAME>_PASSWORD` | — | Per-service basic-auth password |
| `YARR_<NAME>_TOKEN` | — | Per-service token (where applicable) |
| `YARR_SERVER_NAME` / `YARR_MCP_SERVER_NAME` | `yarr` | MCP server name advertised to clients |
| `YARR_CONFIG` | — | Path to a config file (overrides default lookup) |
| `YARR_HOME` | — | Base dir for appdata/config resolution |
| `YARR_MCP_HOST` | `127.0.0.1` | Bind host |
| `YARR_MCP_PORT` | `40070` | Bind port |
| `YARR_MCP_NO_AUTH` | `false` | Disable auth (loopback only) |
| `YARR_NOAUTH` | `false` | Trusted-gateway bypass on non-loopback (see Auth model) |
| `YARR_MCP_TOKEN` | — | Static bearer token |
| `YARR_MCP_ALLOWED_HOSTS` | — | Extra comma-separated Host header values |
| `YARR_MCP_ALLOWED_ORIGINS` | — | Extra comma-separated CORS origins |
| `YARR_MCP_PUBLIC_URL` | — | Public URL for OAuth metadata endpoints |
| `YARR_MCP_AUTH_MODE` | `bearer` | `bearer` or `oauth` |
| `YARR_MCP_GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `YARR_MCP_GOOGLE_CLIENT_SECRET` | — | Google OAuth client secret |
| `YARR_MCP_AUTH_ADMIN_EMAIL` | — | OAuth admin email |
| `YARR_HTTP_TIMEOUT_SECS` | `30` | Per-request upstream HTTP timeout (seconds). Raise for slow upstreams; the live test harness sets it to 90 (below its 120s per-command kill) so a slow read resolves gracefully instead of being killed mid-flight. `0`/unparseable → 30 |
| `RUST_LOG` | `info` | Log filter |

`ServiceKind` (11 known kinds): `sonarr`, `radarr`, `prowlarr`, `tautulli`, `overseerr`, `bazarr`, `tracearr`, `sabnzbd`, `qbittorrent`, `plex`, `jellyfin`. Additional OAuth tuning vars (`YARR_MCP_AUTH_*` TTLs, RPM limits, key/sqlite paths, allowed emails/redirect URIs) are defined in `config.rs`.

## Build commands

```bash
cargo build --release           # produces target/release/yarr
cargo test                      # all tests
cargo clippy --all-targets -- -D warnings   # lint (must pass)
cargo fmt                       # format
cargo xtask gen-openapi         # regenerate src/openapi/generated/ from specs/
```

The Justfile is the operator surface; its recipes are what CI mirrors, so prefer
them over remembering flags:

```bash
just dev            # YARR_MCP_HOST=127.0.0.1 YARR_MCP_NO_AUTH=true cargo run -- serve mcp (loopback, no auth)
just check          # cargo check
just test           # cargo nextest run          (NOT plain cargo test)
just test-ci        # cargo nextest run --profile ci — mirrors CI's fail-fast + retries
just lint           # cargo clippy --all-targets -- -D warnings
just fmt            # cargo fmt
just fmt-check      # cargo fmt -- --check
just verify         # fmt-check → lint → check → test (run before pushing)
just ci             # cargo xtask ci — full suite incl. taplo + audit
just patterns-check # cargo xtask patterns — repo-convention checks
just deny           # cargo deny
just validate-plugin        # scripts/validate-plugin-layout.sh
just schema-docs-check      # docs/MCP_SCHEMA.md drift guard
just docs-links-check       # every tracked Markdown link + anchor
just coupled-files-check    # e.g. scripts/* requires a scripts/README.md update
just gen-token      # openssl rand -hex 32
just health         # curl http://localhost:40070/health | jq .
```

## Testing

**Unit tests are colocated, not inline.** Each module `foo.rs` keeps its tests in a sibling `foo_tests.rs`, wired at the bottom of the module with:

```rust
#[cfg(test)]
#[path = "foo_tests.rs"]
mod tests;
```

This matches the family-wide `foo.rs`-beside-`foo/` module style (no `foo/mod.rs`) while avoiding giant inline `#[cfg(test)]` blocks. It is a **convention here, not a lint** — this workspace declares only `[lints.clippy] all = "warn"`, so nothing mechanically rejects `mod.rs` or an inline `mod tests`. Follow it anyway: when adding a module, add its `*_tests.rs` sibling and the `#[path]` include.

**Integration tests** live in `tests/`: `cli_parse.rs`, `tool_dispatch.rs`, `parity.rs`, `plugin_contract.rs` (+ `plugin_contract/`), `template_invariants.rs`. Keep `tool_dispatch.rs` from growing past ~500 LOC — add new dispatch coverage thoughtfully and put cross-surface parity assertions in `parity.rs`.

`src/lib.rs` exports `testing::loopback_state()` and `testing::bearer_state(token)` (behind `features = ["test-support"]` or `cfg(test)`). Use these in integration tests — they build `AppState` without real credentials.

## CLI ↔ MCP action parity

Every action in the MCP tool must also be reachable from the CLI, and vice versa.
Both shims marshal their input into the SHARED `execute_service_action` dispatch
path, so parity is structural — not something to verify by hand.

**Parity is mechanically enforced by `tests/parity.rs`** (the table below is a
representative summary that can drift; the test is the guard). For every curated
command in `registry::curated_commands()` it asserts: (a) the name is in the MCP
action enum (`all_action_names()`), (b) `yarr <service> <friendly-verb>` parses
into a matching `Command::Curated`, (c) the `VERBS` tables and the registry cover
exactly the same actions in both directions, (d) each verb's capability matches its
descriptor, and (e) the destructive-flag contract is internally consistent
(`destructive => mutates`, and each command's `destructive` flag agrees with
`action_is_destructive`). MCP resources and prompts are protocol concepts with no
CLI analogue.

Grammar: the CLI is **service-grouped** (`yarr <service> <command> [flags]`).
By default (`YARR_MCP_TOOL_MODE=codemode`) **the MCP surface is a single tool,
`yarr`** (`schemas::yarr_tool()`), taking one `code` param — it dispatches the
`codemode` action, and the whole fleet is reached inside the script via per-service
callables `<service>.<verb>()` (generated ops for the 6 spec-backed kinds; curated
for download/stats/subtitles/trace) plus `api.<service>`/`callTool` + `codemode.search`/`describe`.
So the agent carries one tool schema, not one per service. Every action is still
reachable (from inside `yarr`, and from the CLI); the per-service action dispatch
(`dispatch_service_tool`) is what a `yarr` script's `callTool` mirrors internally.
The MCP action name is globally unique snake_case; the CLI verb is the short,
friendly, capability-local form mapped in each `src/cli/commands/<cap>.rs` `VERBS`
table.

Setting `YARR_MCP_TOOL_MODE=flat` switches `list_tools` to advertise one
action-dispatched MCP tool **per configured service** instead (`dispatch_service_tool`
becomes the live surface rather than an internal-only path) — no Code Mode sandbox
layer at all. This exists for deployments proxied through a gateway that already
provides its own dynamic-discovery/Code Mode layer (e.g. Labby): in `codemode` mode
the gateway ends up wrapping yarr's single opaque `{code: string}` tool inside
its *own* sandbox, so an agent writes JS that itself writes JS to reach yarr, and
the gateway's own search/describe catalog can only ever see one tool with no real
per-operation parameter schema. `flat` mode gives the gateway real, individually
typed tools to index instead. For a standalone client with no discovery layer of
its own, `codemode` stays the better default. See `docs/CONFIG.md`.

Representative summary (full set lives in the registry + `VERBS` tables):

| Surface area | MCP action(s) | CLI |
|---|---|---|
| Infra | `service_status`, `help`, `codemode` (the single `yarr` tool; `yarr:write`; runs JS), `op` (generated-op dispatch; MCP/Code-Mode-only), `snippet_*` | `yarr <service> status`, `yarr help`, `yarr codemode --code\|--file`, `yarr snippet …` |
| Generic passthrough | `api_get`/`api_post`/`api_put`/`api_delete` (all run immediately; `api_delete` is destructive — elicited on MCP) — all `yarr:write` | `yarr <service> get\|post\|put\|delete --path P [--body JSON]` |
| Sonarr/Radarr/Prowlarr/Overseerr/Jellyfin/Plex (generated) | Generated OpenAPI operations via `op`, reached in Code Mode as `<service>.<op>()` (e.g. `sonarr.get_series`, `radarr.post_movie`), including DELETE ops | Code Mode only (no per-op CLI verbs); raw passthrough via `yarr <service> get/post/...` |
| DownloadClient (sabnzbd/qbittorrent) | `download_queue`, `download_add`, … `download_remove` (destructive — elicited on MCP) | `yarr qbittorrent queue \| add --url X \| remove --hash H` |
| Stats (tautulli) | `stats_activity`, `stats_history`, `stats_refresh_libraries`, … `stats_delete_image_cache` (destructive — elicited on MCP) | `yarr tautulli activity \| history [--start N --length N --user U] \| refresh-libraries`; `delete-image-cache` |

Both `api_get` and `api_post` require `yarr:write` (read scope is insufficient) — they are arbitrary upstream passthroughs.

## Plugins

`plugins/` ships 12 packages: the full `yarr` MCP plugin (stdio through the pinned
`yarr-mcp` npm launcher, plus all 11 fallback skills) and 11 bare-named
skills-only plugins (`sonarr`, `radarr`, `prowlarr`, `overseerr`, `sabnzbd`,
`qbittorrent`, `plex`, `jellyfin`, `tautulli`, `tracearr`, `bazarr`) that drive
one upstream REST API each with `curl`.

**No versions.** Plugin manifests (`.claude-plugin/plugin.json`,
`.codex-plugin/plugin.json`, `gemini-extension.json`) do **not** contain a
`version` field. The marketplace derives the version from the git commit SHA on
every push — adding an explicit version causes every push to be treated as a new
version and creates duplicate entries. Do not add `version` to any plugin
manifest and do not run `scripts/bump-version.sh` targets against plugin
manifests.

**No lifecycle hooks.** No plugin declares a `hooks` key and none ships a
`hooks/` directory. The credential bridge (`plugins/yarr/scripts/plugin-setup.sh`,
`plugins/<service>/scripts/setup.sh`) is run on demand, or through the
binary-owned `yarr setup plugin-hook`. The absence is enforced by
`scripts/validate-plugin-layout.sh`, `scripts/test-plugin-distribution.js`,
`tests/plugin_contract/manifests.rs::plugins_ship_no_lifecycle_hooks`, and
`cargo xtask patterns` — do not reintroduce hooks.

**Standalone/bundled skills must stay byte-identical.** Every
`plugins/<service>/skills/<service>/scripts/*` file is compared byte-for-byte
against its `plugins/yarr/skills/<service>/scripts/*` copy by
`scripts/test-plugin-distribution.js`. Edit both, or the check fails.

Validate plugin changes with:

```bash
just validate-plugin                       # scripts/validate-plugin-layout.sh
node scripts/test-plugin-distribution.js
node scripts/sync-plugin-manifests.js --check
cargo test --test plugin_contract
cargo test --test template_invariants
python3 scripts/check-doc-links.py
```

## Common gotchas

- **Stdio mode suppresses logs** — `main.rs` sets log level to `warn` in stdio mode so JSON-RPC is not corrupted by log lines on stdout.
- **Scope checks run in `rmcp_server.rs`**, not in `tools.rs`. `tools.rs` only dispatches.
- **`help` action is public** — `required_scope_for_action("help")` (in `actions.rs`) returns `None`. `service_status` needs `yarr:read`; `api_get`/`api_post`/`op`/`codemode` need `yarr:write`. Unknown actions get `DENY_SCOPE`.
- **Default port is 40070** — set in `default_mcp_port()` in `config.rs`. Override with `YARR_MCP_PORT`.
- **`watch`, `serve`, and `doctor` are CLI infrastructure** — they are not MCP actions and have no parity requirement. `watch` polls `/health` and emits state-change lines to stdout (used by the plugin monitor). `serve` starts the HTTP server. `doctor` runs pre-flight checks. None belong in the MCP parity table.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
