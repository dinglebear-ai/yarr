# Configuration

## Loading order

Yarr loads the first existing TOML file from:

1. `YARR_CONFIG`
2. `$YARR_HOME/config.toml`
3. `~/.yarr/config.toml`
4. legacy `~/.rustarr/config.toml` during migration

It then loads `$YARR_HOME/.env`, `/data/.env` in a container, or
`~/.yarr/.env` as defaults and applies the process `YARR_*` environment last.
The current working directory's `config.toml` is not loaded implicitly.

Use the tracked examples:

```bash
cp config.example.toml "$HOME/.yarr/config.toml"
cp .env.example "$HOME/.yarr/.env"
chmod 600 "$HOME/.yarr/.env"
```

## Safe defaults

| Setting | Default |
|---|---|
| `YARR_MCP_HOST` | `127.0.0.1` |
| `YARR_MCP_PORT` | `40070` |
| `YARR_MCP_SERVER_NAME` | `yarr` |
| `YARR_MCP_AUTH_MODE` | `bearer` |
| `YARR_MCP_TOOL_MODE` | `codemode` |
| `YARR_MCP_CODEMODE_MAX_CONCURRENT` | `4` |
| `YARR_MCP_CODEMODE_QUEUE_TIMEOUT_MS` | `500` |
| `YARR_MCP_CODEMODE_TIMEOUT_SECS` | `30` |
| `YARR_HTTP_TIMEOUT_SECS` | `30` |
| data root | `YARR_HOME`, else `/data` in a container, else `~/.yarr` |

There is no `YARR_DATA_DIR` variable.

The three Code Mode limits must be non-zero. Queue saturation returns busy
instead of creating an unbounded number of runtimes; execution is bounded by
the configured deadline.

## Service inventory

`YARR_SERVICES` is a comma-separated list of configured instance names. Every
name requires `YARR_<NAME>_URL`; its kind defaults to the name and can be
overridden with `YARR_<NAME>_KIND`.

Credential variables are selected by service auth style:

| Style | Services | Variables |
|---|---|---|
| `X-Api-Key` | Sonarr, Radarr, Prowlarr, Overseerr, Bazarr | `API_KEY` |
| query API key | SABnzbd, Tautulli | `API_KEY` |
| cookie session | qBittorrent | `USERNAME`, `PASSWORD` |
| Plex token | Plex | `TOKEN` |
| Jellyfin token | Jellyfin | `TOKEN` |
| bearer token | Tracearr | `TOKEN` |

Example:

```bash
YARR_SERVICES=sonarr,qbittorrent
YARR_SONARR_URL=http://sonarr:8989
YARR_SONARR_API_KEY=replace-me
YARR_QBITTORRENT_URL=http://qbittorrent:8080
YARR_QBITTORRENT_USERNAME=admin
YARR_QBITTORRENT_PASSWORD=replace-me
```

## HTTP authentication

Non-loopback HTTP requires mounted bearer/OAuth auth or explicit
`YARR_NOAUTH=true` behind a trusted gateway. Static bearer tokens receive only
`yarr:read`. OAuth and static bearer coexist by default; set
`disable_static_token_with_oauth = true` under `[mcp.auth]` to retire the static
token while OAuth is active.

OAuth `public_url` must be HTTPS outside loopback and cannot contain
credentials, query, or fragment. Unknown `[mcp.auth]` keys reject the config.
OAuth token issuance is capped process-wide at 30 attempts per rolling minute;
production proxies must add a per-client `POST /token` limit.
The local OAuth SQLite backend is single-replica: Yarr exclusively holds
`${sqlite_path}.instance.lock`, and a second process fails startup. NFS/shared
SQLite is unsupported until a shared auth backend exists.
See `docs/AUTH.md` and `config.example.toml` for all fields.

## Production Compose

`docker-compose.prod.yml` requires both `.env` and `YARR_MCP_IMAGE` set to an
immutable `ghcr.io/dinglebear-ai/yarr@sha256:...` reference. It uses `/ready` for the
container health check. Validate with:

```bash
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml run --rm --no-deps yarr-mcp doctor --json
```
