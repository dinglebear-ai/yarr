---
title: "Tools, Actions, Params, and Endpoints"
created: 2026-06-18
updated: 2026-07-30
---

---
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

## Service Kinds

There is one published MCP tool (`yarr`). The table below lists the service
*kinds* a configured service can take — each kind's capability, upstream API
prefix, and path allowlist (from `ServiceKind::descriptor()`). The 6 spec-backed
kinds (sonarr/radarr/prowlarr/overseerr/jellyfin/plex) expose supported upstream
operations as generated operations, with explicit omissions in the matrix below;
the rest keep curated commands and/or generic passthrough.

| Kind | Curated capability | API prefix | Path allowlist |
|---|---|---|---|
| `sonarr` | ArrManager | `/api/v3` | `/api/v3` |
| `radarr` | ArrManager | `/api/v3` | `/api/v3` |
| `prowlarr` | Indexer | `/api/v1` | `/api/v1` |
| `tautulli` | Stats | `/api/v2` | `/api, /api/v2` |
| `overseerr` | Requests | `/api/v1` | `/api/v1` |
| `bazarr` | Subtitles | `/api` | `/api, /api/v2` |
| `tracearr` | Trace | `/api/v1` | `/health, /api/v1` |
| `sabnzbd` | DownloadClient | `/api` | `/api, /api/v2` |
| `qbittorrent` | DownloadClient | `/api/v2` | `/api/v2` |
| `plex` | MediaServer | `(none)` | `/identity, /library, /status, /servers` |
| `jellyfin` | MediaServer | `(none)` | `/System, /Items, /Users, /Library, /Sessions` |

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


## Generic Actions

| Action | Params | Scope | Mutates | Upstream call |
|---|---|---|---:|---|
| `service_status` | none | yarr:read | no | GET the kind default status path, e.g. Sonarr/Radarr `/api/v3/system/status`, Prowlarr `/api/v1/system/status`, Overseerr `/api/v1/status`, Tautulli `/api/v2?cmd=get_server_info`, Bazarr `/api/system/status`, Tracearr `/health`, SABnzbd `/api?mode=version&output=json`, qBittorrent `/api/v2/app/version`, Plex `/identity`, Jellyfin `/System/Info/Public`. |
| `api_get` | `path` | yarr:write | no | `GET {path}`. |
| `api_post` | `path`, optional `body` | yarr:write | yes | `POST {path}` with JSON body. Runs immediately. |
| `api_put` | `path`, optional `body` | yarr:write | yes | `PUT {path}` with JSON body. Runs immediately. |
| `api_delete` | `path`, optional `body` | yarr:write | yes | `DELETE {path}` with optional JSON body. Runs immediately; destructive, so MCP elicits the connected client for confirmation before dispatch. |
| `help` | none | public | no | No upstream call; returns registry-derived action help. |
| `codemode` | `code` | yarr:write | yes | No direct upstream call; runs a Code Mode script that dispatches other actions. |
| `op` | `op`, optional `args` | yarr:write | yes | Dispatches a generated OpenAPI operation for a spec-backed service. |
| `snippet_list` | none | yarr:read | no | No upstream call; manages the Code Mode snippet store under the data dir. |
| `snippet_save` | `name`, `code`, optional `description` | yarr:write | yes | No upstream call; manages the Code Mode snippet store under the data dir. |
| `snippet_run` | `name`, optional `input` | yarr:write | yes | No upstream call; manages the Code Mode snippet store under the data dir. |
| `snippet_delete` | `name` | yarr:write | yes | No upstream call; manages the Code Mode snippet store under the data dir. |

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

| Kind | Supported callables | Explicitly omitted operations |
|---|---:|---|
| `sonarr` | 233 | `get_by_path` (`GET /`): path parameter `path` has no matching placeholder |
| `radarr` | 236 | `get_by_path` (`GET /`): path parameter `path` has no matching placeholder |
| `prowlarr` | 127 | `get_by_path` (`GET /`): path parameter `path` has no matching placeholder |
| `overseerr` | 169 | `get_settings_plex_library` (`GET /api/v1/settings/plex/library`): parameter `enable` requires allowReserved serialization |
| `plex` | 241 | none |
| `jellyfin` | 346 | none |

The generator omits an operation only when its OpenAPI serialization cannot be represented losslessly. Omitted rows are not callable through `op`; use a reviewed generic passthrough only when the service path allowlist permits it.


## Tautulli Actions

Tools: tautulli.

| Action | Params | Scope | Mutates | Upstream call | Notes |
|---|---|---|---:|---|---|
| `stats_activity` | none | yarr:read | no | tautulli: `GET /api/v2?cmd=get_activity` |  |
| `stats_history` | optional `start`, optional `length`, optional `user` | yarr:read | no | tautulli: `GET /api/v2?cmd=get_history[&start=&length=&user=]` |  |
| `stats_users` | none | yarr:read | no | tautulli: `GET /api/v2?cmd=get_users` |  |
| `stats_libraries` | none | yarr:read | no | tautulli: `GET /api/v2?cmd=get_library_names` |  |
| `stats_refresh_libraries` | none | yarr:write | yes | tautulli: `GET /api/v2?cmd=refresh_libraries_list` | Runs immediately (not destructive). |
| `stats_refresh_users` | none | yarr:write | yes | tautulli: `GET /api/v2?cmd=refresh_users_list` | Runs immediately (not destructive). |
| `stats_delete_image_cache` | none | yarr:write | yes | tautulli: `GET /api/v2?cmd=delete_image_cache` | Runs immediately; destructive, so MCP elicits the connected client for confirmation before dispatch. |

## SABnzbd And qBittorrent Actions

Tools: sabnzbd, qbittorrent.

| Action | Params | Scope | Mutates | Upstream call | Notes |
|---|---|---|---:|---|---|
| `download_queue` | none | yarr:read | no | sabnzbd: `GET /api?mode=queue&output=json` | qBittorrent uses `GET /api/v2/torrents/info`. |
| `download_add` | `url` | yarr:write | yes | sabnzbd: `GET /api?mode=addurl&name=<url>&output=json` | qBittorrent uses form `POST /api/v2/torrents/add` with `urls=<url>`. Runs immediately. |
| `download_pause` | optional `id`, optional `hash` | yarr:write | yes | sabnzbd: one: `GET /api?mode=queue&name=pause&value=<id>&output=json`; all: `GET /api?mode=pause&output=json` | qBittorrent uses form `POST /api/v2/torrents/stop` with `hashes=<hash-or-all>`. Runs immediately. |
| `download_resume` | optional `id`, optional `hash` | yarr:write | yes | sabnzbd: one: `GET /api?mode=queue&name=resume&value=<id>&output=json`; all: `GET /api?mode=resume&output=json` | qBittorrent uses form `POST /api/v2/torrents/start` with `hashes=<hash-or-all>`. Runs immediately. |
| `download_remove` | optional `id`, optional `hash`, optional `delete_files` | yarr:write | yes | sabnzbd: `GET /api?mode=queue&name=delete&value=<id>[&del_files=1]&output=json` | qBittorrent uses form `POST /api/v2/torrents/delete` with `hashes=<hash>` and `deleteFiles={true|false}`. Runs immediately; destructive, so MCP elicits the connected client for confirmation before dispatch. |

## Bazarr Subtitle Actions

Tools: bazarr.

| Action | Params | Scope | Mutates | Upstream call | Notes |
|---|---|---|---:|---|---|
| `subtitles_status` | none | yarr:read | no | bazarr: `GET /api/system/status` |  |
| `subtitles_movies` | optional `start`, optional `length` | yarr:read | no | bazarr: `GET /api/movies[?start=&length=]` |  |
| `subtitles_episodes` | optional `start`, optional `length` | yarr:read | no | bazarr: `GET /api/episodes[?start=&length=]` |  |
| `subtitles_wanted_episodes` | optional `start`, optional `length` | yarr:read | no | bazarr: `GET /api/episodes/wanted[?start=&length=]` |  |
| `subtitles_wanted_movies` | optional `start`, optional `length` | yarr:read | no | bazarr: `GET /api/movies/wanted[?start=&length=]` |  |
| `subtitles_providers` | none | yarr:read | no | bazarr: `GET /api/providers` |  |
| `subtitles_languages` | none | yarr:read | no | bazarr: `GET /api/system/languages` |  |

## Tracearr Actions

Tools: tracearr.

| Action | Params | Scope | Mutates | Upstream call | Notes |
|---|---|---|---:|---|---|
| `trace_health` | none | yarr:read | no | tracearr: `GET /api/v1/public/health` |  |
| `trace_stats` | none | yarr:read | no | tracearr: `GET /api/v1/public/stats` |  |
| `trace_today` | optional `timezone` | yarr:read | no | tracearr: `GET /api/v1/public/stats/today[?timezone=]` |  |
| `trace_activity` | optional `period` | yarr:read | no | tracearr: `GET /api/v1/public/activity[?period=]` |  |
| `trace_streams` | optional `summary` | yarr:read | no | tracearr: `GET /api/v1/public/streams[?summary=true]` |  |
| `trace_users` | optional `page`, optional `page_size` | yarr:read | no | tracearr: `GET /api/v1/public/users[?page=&pageSize=]` |  |
| `trace_violations` | optional `page`, optional `page_size` | yarr:read | no | tracearr: `GET /api/v1/public/violations[?page=&pageSize=]` |  |
| `trace_history` | optional `page`, optional `page_size` | yarr:read | no | tracearr: `GET /api/v1/public/history[?page=&pageSize=]` |  |
| `trace_terminate_stream` | `id`, optional `reason` | yarr:write | yes | tracearr: `POST /api/v1/public/streams/{id}/terminate` | Optional JSON `reason`; destructive, so MCP elicits the connected client for confirmation before dispatch. |

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

## CLI Verb Mapping

The CLI is service-grouped (`yarr <service> <verb>`). Only the curated
capabilities below have friendly verbs; the spec-backed services use
`yarr <service> op <operation>` (generated operations) or the generic
`get/post/put/delete` passthrough. Verb tables are read from the CLI registry.

| Capability | CLI verbs |
|---|---|
| DownloadClient | `queue`, `add`, `pause`, `resume`, `remove` |
| Stats | `activity`, `history`, `users`, `libraries`, `refresh-libraries`, `refresh-users`, `delete-image-cache` |
| Subtitles | `status-info`, `movies`, `episodes`, `wanted-episodes`, `wanted-movies`, `providers`, `languages` |
| Trace | `health`, `stats`, `today`, `activity`, `streams`, `users`, `violations`, `history`, `terminate-stream` |
