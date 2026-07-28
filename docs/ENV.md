---
title: "Environment Variables"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "template"
source_of_truth: false
upstream_refs:
  - "src/config.rs"
last_reviewed: "2026-05-15"
---

# Environment variables

The template uses `YARR_*` variables. Rename the prefix when adapting the template.

## Upstream services

| Variable | Purpose |
|---|---|
| `YARR_SERVICES` | Comma-separated configured service names, for example `sonarr,radarr,plex`. |
| `YARR_<SERVICE>_KIND` | Optional service kind override. Defaults to the service name. |
| `YARR_<SERVICE>_URL` | Upstream service base URL. Required for each configured service. |
| `YARR_<SERVICE>_API_KEY` | API key for services that use `X-Api-Key`, query API keys, or token-compatible auth. |
| `YARR_<SERVICE>_USERNAME` | Username for services such as qBittorrent. |
| `YARR_<SERVICE>_PASSWORD` | Password for services such as qBittorrent. |
| `YARR_<SERVICE>_TOKEN` | Bearer/token auth for services such as Plex or Jellyfin. |
| `YARR_HTTP_TIMEOUT_SECS` | Per-request upstream timeout in seconds (default `30`). Raise for stacks with slow upstreams (e.g. a Prowlarr `/indexer` read that fans out to many trackers). `0`/unparseable falls back to `30`. |
| `YARR_HOME` | Runtime data root. Defaults to `/data` in a container and `~/.yarr` otherwise. |

## MCP HTTP server

| Variable | Default | Purpose |
|---|---:|---|
| `YARR_MCP_HOST` | `127.0.0.1` | Bind host for HTTP transport. Set `0.0.0.0` only with bearer, OAuth, or trusted-gateway auth configured. |
| `YARR_MCP_PORT` | `40070` | Bind port for HTTP transport. |
| `YARR_MCP_NO_AUTH` | `false` | Disable local auth for loopback development only. |
| `YARR_NOAUTH` | `false` | Trusted-gateway no-auth mode for non-loopback deployments. Requires explicit `YARR_MCP_ALLOWED_HOSTS` or `YARR_MCP_ALLOWED_ORIGINS` provenance. |
| `YARR_MCP_TOKEN` | unset | Static bearer token. Required for bearer-only mounted HTTP. |
| `YARR_MCP_ALLOWED_HOSTS` | unset | Extra accepted Host header values (comma-separated). |
| `YARR_MCP_ALLOWED_ORIGINS` | unset | Extra CORS origins (comma-separated). |
| `YARR_MCP_PUBLIC_URL` | unset | Public URL used for OAuth metadata endpoints. |
| `YARR_MCP_AUTH_MODE` | `bearer` | `bearer` or `oauth`. |
| `YARR_MCP_TOOL_MODE` | `codemode` | `codemode` or `flat`. See [CONFIG.md](CONFIG.md) for the tradeoff. |
| `YARR_MCP_CODEMODE_MAX_CONCURRENT` | `4` | Maximum active Code Mode runtimes. |
| `YARR_MCP_CODEMODE_QUEUE_TIMEOUT_MS` | `500` | Admission wait in milliseconds before returning busy. |
| `YARR_MCP_CODEMODE_TIMEOUT_SECS` | `30` | Per-run Code Mode execution deadline. |

## OAuth mode

Only required when `YARR_MCP_AUTH_MODE=oauth`:

| Variable | Purpose |
|---|---|
| `YARR_MCP_GOOGLE_CLIENT_ID` | Google OAuth client ID. |
| `YARR_MCP_GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |
| `YARR_MCP_AUTH_ADMIN_EMAIL` | Initial/admin email allowed by the OAuth flow. |
| `YARR_MCP_AUTH_SQLITE_PATH` | Local OAuth SQLite path. Exactly one replica may own `${path}.instance.lock`; NFS/shared SQLite is unsupported. |

## Docker runtime

| Variable | Purpose |
|---|---|
| `DOCKER_NETWORK` | Docker network name (default: `mcp`). |
| `YARR_MCP_IMAGE` | Required production image reference. Set an immutable `ghcr.io/dinglebear-ai/yarr@sha256:...` digest. |
| `YARR_MCP_HOST_PORT` | Host port mapped to container port 40070 (default `40070`). |

## Code Mode

| Variable | Default | Purpose |
|---|---|---|
| `YARR_CODEMODE_TEI_URL` | unset | Base URL of a TEI (Text Embeddings Inference) server (e.g. `http://localhost:52000`) used to blend semantic similarity into `codemode.search()`'s lexical ranking. Unset (the default) disables it entirely — no network call is ever attempted, and `codemode.search()` behaves exactly as it does today. A TEI outage/timeout always fails open to lexical-only results; it never surfaces as a script error. |

## Logging

| Variable | Yarr | Purpose |
|---|---|---|
| `RUST_LOG` | `info,rmcp=warn` | Tracing filter. |
| `NO_COLOR` | `1` | Disable ANSI color in console logs. |
| `FORCE_COLOR` | `1` | Force ANSI color even when stderr is not a TTY. |

## `.env` file structure

```bash
# .env — secrets and URLs ONLY
YARR_SERVICES=sonarr,radarr,plex
YARR_SONARR_URL=https://sonarr.internal
YARR_SONARR_API_KEY=your_sonarr_key_here
YARR_RADARR_URL=https://radarr.internal
YARR_RADARR_API_KEY=your_radarr_key_here
YARR_PLEX_URL=https://plex.internal
YARR_PLEX_TOKEN=your_plex_token_here

# MCP auth
YARR_MCP_TOKEN=your_bearer_token_here

# OAuth (only when auth_mode=oauth in config.toml)
# YARR_MCP_GOOGLE_CLIENT_ID=...
# YARR_MCP_GOOGLE_CLIENT_SECRET=...

# Docker runtime
DOCKER_NETWORK=mcp
YARR_MCP_IMAGE=ghcr.io/dinglebear-ai/yarr@sha256:<verified-digest>
RUST_LOG=info
```

## Safety

`.env` and secret-bearing `.env.*` files must never be committed. The tracked
placeholder template is `.env.example`; copy it to `.env` and keep the copy
untracked. The pre-commit environment guard must remain aligned with that rule.

Non-secret settings (host, port, auth mode, TTLs) go in `config.toml`, not `.env`. See `docs/CONFIG.md` for the full split.

Generate a bearer token:

```bash
just gen-token
# or: openssl rand -hex 32
```

See `docs/CONFIG.md` for the config loading pattern and auth policy details.
