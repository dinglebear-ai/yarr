# yarr

Rust MCP and CLI server for a media automation fleet: Sonarr, Radarr, Prowlarr,
Tautulli, Overseerr, Bazarr, Tracearr, SABnzbd, qBittorrent, Plex, and
Jellyfin.

If you run Claude Code, Codex, or Gemini CLI against a self-hosted media stack,
`yarr` gives an agent one consistent way to query and control all of it instead
of eleven different ad hoc integrations. It is an upstream-client MCP server:
it does not replace those applications or mirror every REST endpoint as a web
UI. Its job is to provide one consistent tool surface for agents and one
equivalent CLI surface for operators.

**Not for:** a general-purpose REST gateway to arbitrary services, or a
scheduler/automation engine in its own right. `yarr` only talks to the service
kinds it knows about, and only does what you or your agent ask it to do.

## Contents

- [Naming](#naming)
- [Capabilities And Boundaries](#capabilities-and-boundaries)
- [Install](#install)
- [Unraid Plugin](#unraid-plugin)
- [Quickstart](#quickstart)
- [Client Configuration](#client-configuration)
- [Runtime Surfaces](#runtime-surfaces)
- [MCP Tool Reference](#mcp-tool-reference)
- [CLI Reference](#cli-reference)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Safety And Trust Model](#safety-and-trust-model)
- [Architecture](#architecture)
- [Distribution Contract](#distribution-contract)
- [Development](#development)
- [Verification](#verification)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Related Servers](#related-servers)
- [Documentation](#documentation)
- [License](#license)

## Naming

This repository is published at `github.com/jmagar/yarr`.

The Rust package and installed binary are both `yarr`. The npm launcher package
is `yarr-mcp` because the shorter `yarr` name is occupied on npm; installing the
launcher still gives you a `yarr` command. The MCP registry name is
`ai.dinglebear/yarr-mcp`, and Docker images use `ghcr.io/jmagar/yarr`.
Production Compose deployments select that image by immutable manifest digest.

Plugin naming is intentionally split:

- `yarr` is the full MCP server plugin. It launches the repository-coupled
  `yarr-mcp` npm package over stdio and includes every per-service fallback
  skill; it does not commit a platform-specific binary.
- `sonarr`, `radarr`, `prowlarr`, `overseerr`, `sabnzbd`, `qbittorrent`, `plex`,
  `jellyfin`, `tautulli`, `tracearr`, and `bazarr` are skills-only plugins with
  no MCP server and no bundled binary.

## Capabilities And Boundaries

`yarr` wraps a configured media automation fleet through one action-dispatched
service layer. The same implementation backs MCP and CLI calls, so behavior
does not drift between "agent used the tool" and "operator ran the command."

Primary capabilities:

- Fleet status checks across the configured services.
- Credentialed upstream API passthrough for known service kinds.
- Table-driven OpenAPI operation metadata for Sonarr, Radarr, Prowlarr,
  Overseerr, Jellyfin, and Plex. The executor preserves the declared parameter,
  request-media, and successful-response transport contract; unsupported rows
  are excluded and listed in the generated
  [capability matrix](docs/TOOLS_ACTIONS_ENDPOINTS.md#generated-operations-spec-backed-services).
- Curated commands for SABnzbd, qBittorrent, Tautulli, Bazarr, and Tracearr,
  whose upstreams do not ship usable machine-readable specs.
- Code Mode over MCP for multi-step media automation scripts.
- Snippet storage and execution for repeatable Code Mode workflows.
- Skills-only direct-HTTP plugin fallbacks for each individual service.

Boundaries:

- `yarr` does not store or schedule media jobs on its own.
- It does not expose a local REST action API or embedded web UI.
- It does not accept arbitrary unknown service kinds.
- MCP callers never provide credentials, tokens, keys, or secrets as action
  arguments. Credentials come from environment variables, config files, or
  strict per-service plugin config JSON.

## Install

The recommended install path is the Node launcher package:

```bash
# Run the stdio MCP server without a permanent install.
npx -y yarr-mcp mcp

# Or install the launcher globally.
npm i -g yarr-mcp
yarr --version
yarr mcp
```

The npm package downloads the matching GitHub Release binary during install and
adds `yarr` to `PATH`. It does not expose legacy command aliases.

For machines without npm, use the release installer:

```bash
curl -fsSL https://raw.githubusercontent.com/jmagar/yarr/main/install.sh | bash
```

That script installs `yarr` into `~/.local/bin`.

## Unraid Plugin

The coordinated Unraid distribution lives under
[`unraid-plugin/`](unraid-plugin/README.md). It combines the classic `.plg`
installer and privileged service lifecycle, an external NestJS GraphQL
extension, and Vue settings/dashboard custom elements.

Install the plugin URL from Unraid's **Plugins > Install Plugin** page:

```text
https://raw.githubusercontent.com/dinglebear-ai/yarr/main/unraid-plugin/yarr.plg
```

Fresh installs bind Yarr to loopback. LAN or custom-address binding is rejected
until authentication is configured; Tailscale Serve is the supported
tailnet-only option. Service credentials stay in server-side boot
configuration and are never returned to the browser. See the
[Unraid operator and release guide](unraid-plugin/README.md) for persistence,
discovery, updates, rollback, uninstall retention, troubleshooting, and
release gates.

## Quickstart

The first-screen 30-second path is:

```bash
export YARR_SERVICES=sonarr
export YARR_SONARR_URL=http://127.0.0.1:8989
export YARR_SONARR_API_KEY=...

npx -y yarr-mcp sonarr status
npx -y yarr-mcp mcp
```

Then point an MCP client at the stdio command:

```json
{
  "mcpServers": {
    "yarr": {
      "command": "npx",
      "args": ["-y", "yarr-mcp", "mcp"],
      "env": {
        "YARR_SERVICES": "sonarr",
        "YARR_SONARR_URL": "http://127.0.0.1:8989",
        "YARR_SONARR_API_KEY": "${YARR_SONARR_API_KEY}"
      }
    }
  }
}
```

For Claude Code plugin installs, use the marketplace commands inside a Claude
Code chat session, not in a shell:

```text
/plugin marketplace add jmagar/yarr
/plugin install yarr@yarr
```

Install one skills-only plugin when you want direct service scripts without the
MCP server:

```text
/plugin install sonarr@yarr
/plugin install plex@yarr
```

## Client Configuration

### stdio

stdio is the preferred local MCP transport. It starts `yarr mcp` on demand and
does not require binding a local HTTP port.

```json
{
  "mcpServers": {
    "yarr": {
      "command": "yarr",
      "args": ["mcp"],
      "env": {
        "RUST_LOG": "info,yarr=debug"
      }
    }
  }
}
```

### Streamable HTTP

Run a persistent server when several clients or machines should share one MCP
endpoint:

```bash
YARR_MCP_TOKEN=change-me yarr serve
```

```json
{
  "mcpServers": {
    "yarr": {
      "url": "http://127.0.0.1:40070/mcp",
      "headers": {
        "Authorization": "Bearer ${YARR_MCP_TOKEN}"
      }
    }
  }
}
```

HTTP MCP smoke call:

```bash
curl -s http://127.0.0.1:40070/mcp \
  -H "Authorization: Bearer $YARR_MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"yarr","arguments":{"code":"async () => await sonarr.get_system_status()"}}}'
```

## Runtime Surfaces

| Surface | Status | Purpose |
|---|---:|---|
| MCP | Required | One default `yarr` Code Mode tool over the whole fleet |
| CLI | Required | Scriptable parity surface for debugging and automation |
| REST | Not shipped | Upstream-client servers do not expose a local REST action API |
| Web | Not shipped | Upstream-client servers do not serve an embedded web UI |

Set `YARR_MCP_TOOL_MODE=flat` to advertise one action-dispatched MCP tool per
configured service instead of the single Code Mode tool. That mode is useful
behind a gateway such as Labby that already provides its own discovery and
sandbox layer. `codemode` is the default and the right choice for standalone
MCP clients.

## MCP Tool Reference

By default, MCP exposes one tool named `yarr`.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `code` | string | yes | JavaScript async arrow function executed in the in-process Code Mode sandbox |

Inside Code Mode, scripts can use:

- Per-service callables such as `sonarr.get_series()`,
  `radarr.post_movie({ body })`, `prowlarr.get_indexer()`, and
  `plex.get_sessions()`.
- Curated commands such as `qbittorrent.download_queue()` and
  `tautulli.stats_activity()`.
- Raw passthrough helpers at `api.<service>.get/post/put/delete(path, body)`.
- `callTool(action, params)` for the underlying action-dispatch escape hatch.
- `codemode.search(query)` and `codemode.describe(path)` for discovery.
- `codemode.run(name, input)`, `codemode.snippets()`, and `writeArtifact(...)`
  for reusable scripts and artifacts.

Generated callables come from metadata tables. They preserve method/path,
required path arguments, known query names, JSON-body presence, and a bounded
single-file multipart escape hatch. They do not enforce every required query,
header/cookie parameter, style/explode rule, form schema, media type, or
response schema. See `docs/API.md` before relying on a generated operation for
a non-JSON or serialization-sensitive endpoint.

Example:

```js
async () => {
  const queue = await radarr.get_queue();
  await radarr.post_command({
    body: { name: "MoviesSearch", movieIds: [456] }
  });
  return { queued: queue.records?.length };
}
```

### Generic Actions

These actions work for every configured service kind:

| Action | Scope | CLI | Description |
|---|---|---|---|
| `service_status` | `yarr:read` | `yarr <service> status` | Fetch an upstream service status endpoint |
| `api_get` | `yarr:write` | `yarr <service> get --path <path>` | Proxy a credentialed GET request |
| `api_post` | `yarr:write` | `yarr <service> post --path <path> --body <json>` | Proxy a POST request |
| `api_put` | `yarr:write` | `yarr <service> put --path <path> --body <json>` | Proxy a PUT request |
| `api_delete` | `yarr:write` | `yarr <service> delete --path <path>` | Proxy a DELETE request |
| `help` | public | `yarr help` | Return action reference |

### Code Mode Actions

| Action | Scope | Surface | Description |
|---|---|---|---|
| `codemode` | `yarr:write` | `yarr` tool / `yarr codemode --code <JS>` | Run a JS arrow function over the fleet |
| `op` | `yarr:write` | `<service>.<operation>()` / `yarr <service> op <name>` | Dispatch a generated OpenAPI operation |
| `snippet_list` | `yarr:read` | `yarr snippet list` / `codemode.snippets()` | List saved snippets |
| `snippet_save` | `yarr:write` | `yarr snippet save` | Save a reusable snippet |
| `snippet_run` | `yarr:write` | `yarr snippet run` / `codemode.run(name, input)` | Run a saved snippet |
| `snippet_delete` | `yarr:write` | `yarr snippet delete` | Delete a saved snippet |

There is no `confirm` argument. CLI destructive commands dispatch immediately.
MCP direct and nested Code Mode destructive calls require elicitation and fail
closed if the peer cannot elicit or approval is not granted.

## CLI Reference

The CLI is service-grouped:

```bash
yarr help
yarr radarr status
yarr sonarr get --path /api/v3/system/status
yarr radarr post --path /api/v3/command --body '{"name":"RefreshMovie"}'
yarr sonarr put --path /api/v3/series/editor --body '{"seriesIds":[1],"qualityProfileId":4}'
yarr radarr delete --path /api/v3/movie/12

# Generated operations for spec-backed services.
yarr sonarr op get_series
yarr radarr op post_command --args '{"body":{"name":"MoviesSearch","movieIds":[456]}}'

# Curated commands for doc-only services.
yarr qbittorrent queue
yarr tautulli activity

# Code Mode and snippets.
yarr codemode --code 'async () => sonarr.get_system_status()'
yarr snippet list
```

There is no `--service` flag. Infra commands such as `help`, `codemode`, and
`snippet` are service-less.

## Configuration

Copy `.env.example` or use `config.example.toml` as a starting point. Common
environment variables:

```bash
YARR_MCP_HOST=127.0.0.1
YARR_MCP_PORT=40070
YARR_MCP_TOKEN=change-me

YARR_SERVICES=sonarr,radarr,prowlarr,tautulli,overseerr,bazarr,tracearr,sabnzbd,qbittorrent,plex,jellyfin
YARR_SONARR_URL=http://sonarr:8989
YARR_SONARR_API_KEY=...
YARR_RADARR_URL=http://radarr:7878
YARR_RADARR_API_KEY=...
YARR_QBITTORRENT_URL=http://qbittorrent:8080
YARR_QBITTORRENT_USERNAME=...
YARR_QBITTORRENT_PASSWORD=...
YARR_PLEX_URL=http://plex:32400
YARR_PLEX_TOKEN=...
```

Supported service kinds are `sonarr`, `radarr`, `prowlarr`, `tautulli`,
`overseerr`, `bazarr`, `tracearr`, `sabnzbd`, `qbittorrent`, `plex`, and
`jellyfin`.

`*_API_KEY` covers most Arr-style services. qBittorrent uses username/password
login. Plex and Jellyfin token headers are handled separately.

`YARR_MCP_TOOL_MODE=codemode` is the default. Use
`YARR_MCP_TOOL_MODE=flat` only when a gateway should see separate per-service
tools.

## Authentication

`YARR_MCP_TOKEN` authenticates `/mcp` and receives read-only `yarr:read` scope.
On `127.0.0.1` or `localhost` with no explicit token, auth is bypassed for
local development. Set a real token, or set `YARR_MCP_AUTH_MODE=oauth` for
Google OAuth, before exposing this on a network.

Auth states:

| State | Condition | Behavior |
|---|---|---|
| `LoopbackDev` | loopback bind or explicit loopback no-auth | no auth, no scopes |
| `TrustedGatewayUnscoped` | `YARR_NOAUTH=true` behind a trusted gateway | no local auth or scopes |
| `Mounted` bearer | non-loopback with `YARR_MCP_TOKEN` | bearer auth with read-only scope checks |
| `Mounted` OAuth | `YARR_MCP_AUTH_MODE=oauth` | OAuth/JWT auth and scope checks |

Unauthenticated health endpoints are `/health`, `/ready`, `/status`, and
`/metrics`. `/status` redacts secrets; `/metrics` exposes HTTP and bounded
domain metrics and should be network-restricted when needed.

## Safety And Trust Model

Secrets stay server-side. MCP clients provide action parameters, never upstream
tokens. Query-string secrets such as `apikey=`, `token=`, and `X-Plex-Token`
are rejected by path validation.

`help` is public at the action layer, but mounted HTTP transports still require
bearer or OAuth transport auth. `service_status` requires `yarr:read`.
Credentialed passthrough, generated operations, curated write operations, and
Code Mode require `yarr:write`; write satisfies read.

Generated DELETE operations, `api_delete`, `download_remove`,
`stats_delete_image_cache`, and `trace_terminate_stream` are destructive. CLI
commands dispatch them immediately. MCP callers get an interactive elicitation
prompt at the actual dispatch point, including inside Code Mode, with no call
argument or nested `callTool` path that can skip it.

Responses are capped by the shared token-limit layer before they are returned to
MCP clients.

## Architecture

```text
MCP shim (src/mcp/tools.rs)   CLI shim (src/cli.rs)
  JSON args -> dispatch          argv -> dispatch
        \                          /
         execute_service_action (src/actions/dispatch.rs)
             shared validation + curated-command dispatch
                          |
         YarrService (src/app.rs + src/app/*.rs)
           validation, service lookup, response shaping
                          |
         YarrClient (src/yarr.rs)
           network calls and auth headers
```

`src/mcp.rs` and `src/cli.rs` are thin facades re-exporting their own
submodules. `execute_service_action` makes CLI-to-MCP parity structural rather
than something kept in sync by hand.

The service layer owns:

- supported service catalog and config lookup
- safe path validation
- credential redaction
- qBittorrent login flow
- response normalization

## Distribution Contract

The source of truth for release identity is the version shared by `Cargo.toml`,
`Cargo.lock`, `xtask/Cargo.toml`, `.release-please-manifest.json`,
`packages/yarr-mcp/package.json`, and `server.json`.

Generated code and docs must be regenerated from the committed source inputs,
not patched by hand:

- Generated OpenAPI operations live under `src/openapi/generated/` and come
  from vendored specs in `specs/`.
- Curated actions live in the handwritten action registries and docs.
- Plugin manifests stay versionless; marketplaces derive plugin version from
  the git commit SHA.
- The npm package version and the GitHub Release tag must match.
- `server.json` must name the exact `yarr-mcp` npm version and stdio launch
  contract under the `ai.dinglebear/yarr-mcp` registry identity.
- The Docker image path is `ghcr.io/jmagar/yarr`; production deployment uses a
  promoted immutable `@sha256:` digest.

## Development

```bash
cargo run -- help
cargo fmt --check
cargo test
cargo clippy -- -D warnings
cargo build --release
```

When changing generated operations:

```bash
cargo xtask gen-openapi
cargo xtask tool-docs
cargo test --test parity
```

When changing plugin packaging:

```bash
cargo test --test plugin_contract
cargo test --test template_invariants
```

## Verification

Use the README guide checker before landing documentation changes:

```bash
python3 /home/jmagar/workspace/soma/scripts/check-readme-guide.py README.md
```

Use the package and Rust checks for distribution-sensitive work:

```bash
npm --prefix packages/yarr-mcp run check
cargo fmt --check
cargo check
cargo test
git diff --check
```

For live install verification, use the three public install paths:

```bash
curl -fsSL https://raw.githubusercontent.com/jmagar/yarr/main/install.sh | bash
npm i -g yarr-mcp
npx -y yarr-mcp mcp
```

## Deployment

Run as a persistent HTTP MCP server:

```bash
YARR_MCP_HOST=0.0.0.0 \
YARR_MCP_PORT=40070 \
YARR_MCP_TOKEN=change-me \
yarr serve
```

Docker Compose deployments are covered by `docker-compose.yml`,
`docker-compose.prod.yml`, `docs/DOCKER.md`, and `docs/DEPLOYMENT.md`.
Production deployments should put `yarr` behind a trusted reverse proxy or MCP
gateway when exposed outside loopback.

## Troubleshooting

- `401` or `403` from HTTP MCP: confirm `YARR_MCP_TOKEN`, OAuth mode, and
  gateway headers.
- `unknown service`: confirm the service is listed in `YARR_SERVICES` and has a
  matching `YARR_<SERVICE>_URL`.
- upstream `401`: confirm the service-specific API key or token in the server
  environment, not in tool arguments.
- `query-string secret rejected`: remove tokens from `--path` and put them in
  config.
- plugin skill cannot reach a service: rerun the plugin setup hook or reinstall
  the plugin so its strict per-service config JSON is refreshed under
  `~/.config/lab-<service>/config.json`.
- Code Mode cannot find a callable: use `codemode.search(...)` and
  `codemode.describe(...)`; generated names follow upstream OpenAPI operation
  IDs after normalization.

## Related Servers

- [soma](https://github.com/jmagar/soma) - RMCP runtime for provider-backed MCP servers.
- [unifi-rmcp](https://github.com/jmagar/runifi) - UniFi controller REST API bridge.
- [tailscale-rmcp](https://github.com/jmagar/rtailscale) - Tailscale API bridge for devices, users, and tailnet operations.
- [unraid-rmcp](https://github.com/jmagar/runraid) - Unraid GraphQL bridge for NAS and server management.
- [apprise-rmcp](https://github.com/jmagar/rapprise) - Apprise notification fan-out bridge for many delivery backends.
- [gotify-rmcp](https://github.com/jmagar/rgotify) - Gotify push notification bridge for sends, messages, apps, and clients.
- [arcane-rmcp](https://github.com/jmagar/rarcane) - Arcane Docker management bridge for containers and related resources.
- [ytdl-rmcp](https://github.com/jmagar/rytdl) - Media download and metadata workflow server.
- [synapse-rmcp](https://github.com/jmagar/synapse) - Local Synapse workflow server for scout and flux actions.
- [cortex](https://github.com/jmagar/cortex) - Syslog and homelab log aggregation MCP server.
- [axon](https://github.com/jmagar/axon) - RAG, crawl, scrape, extract, and semantic search project.
- [labby](https://github.com/jmagar/labby) - Homelab control plane and MCP gateway project.
- [lumen](https://github.com/jmagar/lumen) - Local semantic code search MCP server.

## Documentation

The source of truth docs split is:

- `docs/API.md` for action contracts and Code Mode call shape.
- `docs/CONFIG.md` for environment variables, auth states, and tool modes.
- `docs/QUICKSTART.md` for local smoke tests.
- `docs/MCP_SCHEMA.md` for schema drift rules.
- `docs/AUTH.md` for bearer and OAuth auth.
- `docs/DEPLOYMENT.md` and `docs/DOCKER.md` for production runtime.
- `docs/PATTERNS.md` for conventions shared across the RMCP server family.
- `docs/PLUGINS.md` for marketplace plugin packaging.
- `plugins/README.md` for the `yarr` bundle versus per-service plugin layout.
- `plugins/yarr/README.md` and `plugins/yarr/skills/yarr/SKILL.md` for the
  full plugin package.
- `CLAUDE.md` for repo-local agent memory and the "How to add an action"
  checklist.

## License

[MIT](LICENSE)
