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

## Generated Write Safety

Generated GET operations are read-only. Generated DELETE operations are destructive and require MCP elicitation. Every generated POST, PUT, and PATCH is explicitly audited by `openapi::safety`; `cargo xtask tool-docs --check` fails closed when that table does not cover the current generated registry.

| Kind | Callable | Method | Mutates | Destructive | Elicitation required |
|---|---|---|---:|---:|---:|
| `sonarr` | `delete_autotagging_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_blocklist_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_blocklist_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_command_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_customfilter_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_customformat_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_customformat_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_delayprofile_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_downloadclient_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_downloadclient_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_episodefile_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_episodefile_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_importlist_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_importlist_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_importlistexclusion_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_importlistexclusion_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_indexer_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_indexer_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_languageprofile_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_metadata_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_notification_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_qualityprofile_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_queue_bulk` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_queue_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_releaseprofile_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_remotepathmapping_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_rootfolder_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_series_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_series_editor` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_system_backup_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `delete_tag_by_id` | `DELETE` | yes | yes | yes |
| `sonarr` | `post_autotagging` | `POST` | yes | no | no |
| `sonarr` | `post_command` | `POST` | yes | no | no |
| `sonarr` | `post_customfilter` | `POST` | yes | no | no |
| `sonarr` | `post_customformat` | `POST` | yes | no | no |
| `sonarr` | `post_delayprofile` | `POST` | yes | no | no |
| `sonarr` | `post_downloadclient` | `POST` | yes | no | no |
| `sonarr` | `post_downloadclient_action_by_name` | `POST` | yes | no | no |
| `sonarr` | `post_downloadclient_test` | `POST` | yes | no | no |
| `sonarr` | `post_downloadclient_testall` | `POST` | yes | no | no |
| `sonarr` | `post_history_failed_by_id` | `POST` | yes | no | no |
| `sonarr` | `post_importlist` | `POST` | yes | no | no |
| `sonarr` | `post_importlist_action_by_name` | `POST` | yes | no | no |
| `sonarr` | `post_importlist_test` | `POST` | yes | no | no |
| `sonarr` | `post_importlist_testall` | `POST` | yes | no | no |
| `sonarr` | `post_importlistexclusion` | `POST` | yes | no | no |
| `sonarr` | `post_indexer` | `POST` | yes | no | no |
| `sonarr` | `post_indexer_action_by_name` | `POST` | yes | no | no |
| `sonarr` | `post_indexer_test` | `POST` | yes | no | no |
| `sonarr` | `post_indexer_testall` | `POST` | yes | no | no |
| `sonarr` | `post_languageprofile` | `POST` | yes | no | no |
| `sonarr` | `post_login` | `POST` | yes | no | no |
| `sonarr` | `post_manualimport` | `POST` | yes | no | no |
| `sonarr` | `post_metadata` | `POST` | yes | no | no |
| `sonarr` | `post_metadata_action_by_name` | `POST` | yes | no | no |
| `sonarr` | `post_metadata_test` | `POST` | yes | no | no |
| `sonarr` | `post_metadata_testall` | `POST` | yes | no | no |
| `sonarr` | `post_notification` | `POST` | yes | no | no |
| `sonarr` | `post_notification_action_by_name` | `POST` | yes | no | no |
| `sonarr` | `post_notification_test` | `POST` | yes | no | no |
| `sonarr` | `post_notification_testall` | `POST` | yes | no | no |
| `sonarr` | `post_qualityprofile` | `POST` | yes | no | no |
| `sonarr` | `post_queue_grab_bulk` | `POST` | yes | no | no |
| `sonarr` | `post_queue_grab_by_id` | `POST` | yes | no | no |
| `sonarr` | `post_release` | `POST` | yes | no | no |
| `sonarr` | `post_release_push` | `POST` | yes | no | no |
| `sonarr` | `post_releaseprofile` | `POST` | yes | no | no |
| `sonarr` | `post_remotepathmapping` | `POST` | yes | no | no |
| `sonarr` | `post_rootfolder` | `POST` | yes | no | no |
| `sonarr` | `post_seasonpass` | `POST` | yes | no | no |
| `sonarr` | `post_series` | `POST` | yes | no | no |
| `sonarr` | `post_series_import` | `POST` | yes | no | no |
| `sonarr` | `post_system_backup_restore_by_id` | `POST` | yes | no | no |
| `sonarr` | `post_system_backup_restore_upload` | `POST` | yes | no | no |
| `sonarr` | `post_system_restart` | `POST` | yes | no | no |
| `sonarr` | `post_system_shutdown` | `POST` | yes | no | no |
| `sonarr` | `post_tag` | `POST` | yes | no | no |
| `sonarr` | `put_autotagging_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_config_downloadclient_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_config_host_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_config_importlist_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_config_indexer_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_config_mediamanagement_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_config_naming_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_config_ui_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_customfilter_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_customformat_bulk` | `PUT` | yes | no | no |
| `sonarr` | `put_customformat_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_delayprofile_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_delayprofile_reorder_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_downloadclient_bulk` | `PUT` | yes | no | no |
| `sonarr` | `put_downloadclient_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_episode_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_episode_monitor` | `PUT` | yes | no | no |
| `sonarr` | `put_episodefile_bulk` | `PUT` | yes | no | no |
| `sonarr` | `put_episodefile_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_episodefile_editor` | `PUT` | yes | no | no |
| `sonarr` | `put_importlist_bulk` | `PUT` | yes | no | no |
| `sonarr` | `put_importlist_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_importlistexclusion_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_indexer_bulk` | `PUT` | yes | no | no |
| `sonarr` | `put_indexer_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_languageprofile_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_metadata_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_notification_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_qualitydefinition_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_qualitydefinition_update` | `PUT` | yes | no | no |
| `sonarr` | `put_qualityprofile_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_releaseprofile_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_remotepathmapping_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_series_by_id` | `PUT` | yes | no | no |
| `sonarr` | `put_series_editor` | `PUT` | yes | no | no |
| `sonarr` | `put_tag_by_id` | `PUT` | yes | no | no |
| `radarr` | `delete_autotagging_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_blocklist_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_blocklist_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_command_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_customfilter_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_customformat_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_customformat_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_delayprofile_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_downloadclient_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_downloadclient_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_exclusions_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_exclusions_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_importlist_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_importlist_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_indexer_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_indexer_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_metadata_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_movie_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_movie_editor` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_moviefile_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_moviefile_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_notification_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_qualityprofile_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_queue_bulk` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_queue_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_releaseprofile_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_remotepathmapping_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_rootfolder_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_system_backup_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `delete_tag_by_id` | `DELETE` | yes | yes | yes |
| `radarr` | `post_autotagging` | `POST` | yes | no | no |
| `radarr` | `post_command` | `POST` | yes | no | no |
| `radarr` | `post_customfilter` | `POST` | yes | no | no |
| `radarr` | `post_customformat` | `POST` | yes | no | no |
| `radarr` | `post_delayprofile` | `POST` | yes | no | no |
| `radarr` | `post_downloadclient` | `POST` | yes | no | no |
| `radarr` | `post_downloadclient_action_by_name` | `POST` | yes | no | no |
| `radarr` | `post_downloadclient_test` | `POST` | yes | no | no |
| `radarr` | `post_downloadclient_testall` | `POST` | yes | no | no |
| `radarr` | `post_exclusions` | `POST` | yes | no | no |
| `radarr` | `post_exclusions_bulk` | `POST` | yes | no | no |
| `radarr` | `post_history_failed_by_id` | `POST` | yes | no | no |
| `radarr` | `post_importlist` | `POST` | yes | no | no |
| `radarr` | `post_importlist_action_by_name` | `POST` | yes | no | no |
| `radarr` | `post_importlist_movie` | `POST` | yes | no | no |
| `radarr` | `post_importlist_test` | `POST` | yes | no | no |
| `radarr` | `post_importlist_testall` | `POST` | yes | no | no |
| `radarr` | `post_indexer` | `POST` | yes | no | no |
| `radarr` | `post_indexer_action_by_name` | `POST` | yes | no | no |
| `radarr` | `post_indexer_test` | `POST` | yes | no | no |
| `radarr` | `post_indexer_testall` | `POST` | yes | no | no |
| `radarr` | `post_login` | `POST` | yes | no | no |
| `radarr` | `post_manualimport` | `POST` | yes | no | no |
| `radarr` | `post_metadata` | `POST` | yes | no | no |
| `radarr` | `post_metadata_action_by_name` | `POST` | yes | no | no |
| `radarr` | `post_metadata_test` | `POST` | yes | no | no |
| `radarr` | `post_metadata_testall` | `POST` | yes | no | no |
| `radarr` | `post_movie` | `POST` | yes | no | no |
| `radarr` | `post_movie_import` | `POST` | yes | no | no |
| `radarr` | `post_notification` | `POST` | yes | no | no |
| `radarr` | `post_notification_action_by_name` | `POST` | yes | no | no |
| `radarr` | `post_notification_test` | `POST` | yes | no | no |
| `radarr` | `post_notification_testall` | `POST` | yes | no | no |
| `radarr` | `post_qualityprofile` | `POST` | yes | no | no |
| `radarr` | `post_queue_grab_bulk` | `POST` | yes | no | no |
| `radarr` | `post_queue_grab_by_id` | `POST` | yes | no | no |
| `radarr` | `post_release` | `POST` | yes | no | no |
| `radarr` | `post_release_push` | `POST` | yes | no | no |
| `radarr` | `post_releaseprofile` | `POST` | yes | no | no |
| `radarr` | `post_remotepathmapping` | `POST` | yes | no | no |
| `radarr` | `post_rootfolder` | `POST` | yes | no | no |
| `radarr` | `post_system_backup_restore_by_id` | `POST` | yes | no | no |
| `radarr` | `post_system_backup_restore_upload` | `POST` | yes | no | no |
| `radarr` | `post_system_restart` | `POST` | yes | no | no |
| `radarr` | `post_system_shutdown` | `POST` | yes | no | no |
| `radarr` | `post_tag` | `POST` | yes | no | no |
| `radarr` | `put_autotagging_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_collection` | `PUT` | yes | no | no |
| `radarr` | `put_collection_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_downloadclient_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_host_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_importlist_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_indexer_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_mediamanagement_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_metadata_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_naming_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_config_ui_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_customfilter_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_customformat_bulk` | `PUT` | yes | no | no |
| `radarr` | `put_customformat_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_delayprofile_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_delayprofile_reorder_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_downloadclient_bulk` | `PUT` | yes | no | no |
| `radarr` | `put_downloadclient_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_exclusions_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_importlist_bulk` | `PUT` | yes | no | no |
| `radarr` | `put_importlist_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_indexer_bulk` | `PUT` | yes | no | no |
| `radarr` | `put_indexer_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_metadata_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_movie_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_movie_editor` | `PUT` | yes | no | no |
| `radarr` | `put_moviefile_bulk` | `PUT` | yes | no | no |
| `radarr` | `put_moviefile_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_moviefile_editor` | `PUT` | yes | no | no |
| `radarr` | `put_notification_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_qualitydefinition_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_qualitydefinition_update` | `PUT` | yes | no | no |
| `radarr` | `put_qualityprofile_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_releaseprofile_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_remotepathmapping_by_id` | `PUT` | yes | no | no |
| `radarr` | `put_tag_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `delete_applications_bulk` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_applications_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_appprofile_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_command_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_customfilter_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_downloadclient_bulk` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_downloadclient_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_indexer_bulk` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_indexer_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_indexerproxy_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_notification_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_system_backup_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `delete_tag_by_id` | `DELETE` | yes | yes | yes |
| `prowlarr` | `post_applications` | `POST` | yes | no | no |
| `prowlarr` | `post_applications_action_by_name` | `POST` | yes | no | no |
| `prowlarr` | `post_applications_test` | `POST` | yes | no | no |
| `prowlarr` | `post_applications_testall` | `POST` | yes | no | no |
| `prowlarr` | `post_appprofile` | `POST` | yes | no | no |
| `prowlarr` | `post_command` | `POST` | yes | no | no |
| `prowlarr` | `post_customfilter` | `POST` | yes | no | no |
| `prowlarr` | `post_downloadclient` | `POST` | yes | no | no |
| `prowlarr` | `post_downloadclient_action_by_name` | `POST` | yes | no | no |
| `prowlarr` | `post_downloadclient_test` | `POST` | yes | no | no |
| `prowlarr` | `post_downloadclient_testall` | `POST` | yes | no | no |
| `prowlarr` | `post_indexer` | `POST` | yes | no | no |
| `prowlarr` | `post_indexer_action_by_name` | `POST` | yes | no | no |
| `prowlarr` | `post_indexer_test` | `POST` | yes | no | no |
| `prowlarr` | `post_indexer_testall` | `POST` | yes | no | no |
| `prowlarr` | `post_indexerproxy` | `POST` | yes | no | no |
| `prowlarr` | `post_indexerproxy_action_by_name` | `POST` | yes | no | no |
| `prowlarr` | `post_indexerproxy_test` | `POST` | yes | no | no |
| `prowlarr` | `post_indexerproxy_testall` | `POST` | yes | no | no |
| `prowlarr` | `post_login` | `POST` | yes | no | no |
| `prowlarr` | `post_notification` | `POST` | yes | no | no |
| `prowlarr` | `post_notification_action_by_name` | `POST` | yes | no | no |
| `prowlarr` | `post_notification_test` | `POST` | yes | no | no |
| `prowlarr` | `post_notification_testall` | `POST` | yes | no | no |
| `prowlarr` | `post_search` | `POST` | yes | no | no |
| `prowlarr` | `post_search_bulk` | `POST` | yes | no | no |
| `prowlarr` | `post_system_backup_restore_by_id` | `POST` | yes | no | no |
| `prowlarr` | `post_system_backup_restore_upload` | `POST` | yes | no | no |
| `prowlarr` | `post_system_restart` | `POST` | yes | no | no |
| `prowlarr` | `post_system_shutdown` | `POST` | yes | no | no |
| `prowlarr` | `post_tag` | `POST` | yes | no | no |
| `prowlarr` | `put_applications_bulk` | `PUT` | yes | no | no |
| `prowlarr` | `put_applications_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_appprofile_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_config_development_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_config_downloadclient_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_config_host_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_config_ui_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_customfilter_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_downloadclient_bulk` | `PUT` | yes | no | no |
| `prowlarr` | `put_downloadclient_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_indexer_bulk` | `PUT` | yes | no | no |
| `prowlarr` | `put_indexer_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_indexerproxy_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_notification_by_id` | `PUT` | yes | no | no |
| `prowlarr` | `put_tag_by_id` | `PUT` | yes | no | no |
| `overseerr` | `delete_issue_by_issue_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_issue_comment_by_comment_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_media_by_media_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_request_by_request_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_settings_discover_by_slider_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_settings_radarr_by_radarr_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_settings_sonarr_by_sonarr_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_user_by_user_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `delete_user_push_subscription_by_endpoint_user_id` | `DELETE` | yes | yes | yes |
| `overseerr` | `post_auth_local` | `POST` | yes | no | no |
| `overseerr` | `post_auth_logout` | `POST` | yes | no | no |
| `overseerr` | `post_auth_plex` | `POST` | yes | no | no |
| `overseerr` | `post_auth_reset_password` | `POST` | yes | no | no |
| `overseerr` | `post_auth_reset_password_by_guid` | `POST` | yes | no | no |
| `overseerr` | `post_issue` | `POST` | yes | no | no |
| `overseerr` | `post_issue_by_issue_id_status` | `POST` | yes | no | no |
| `overseerr` | `post_issue_comment_by_issue_id` | `POST` | yes | no | no |
| `overseerr` | `post_media_by_media_id_status` | `POST` | yes | no | no |
| `overseerr` | `post_request` | `POST` | yes | no | no |
| `overseerr` | `post_request_by_request_id_status` | `POST` | yes | no | no |
| `overseerr` | `post_request_retry_by_request_id` | `POST` | yes | no | no |
| `overseerr` | `post_settings_cache_flush_by_cache_id` | `POST` | yes | no | no |
| `overseerr` | `post_settings_discover` | `POST` | yes | no | no |
| `overseerr` | `post_settings_discover_add` | `POST` | yes | no | no |
| `overseerr` | `post_settings_initialize` | `POST` | yes | no | no |
| `overseerr` | `post_settings_jobs_cancel_by_job_id` | `POST` | yes | no | no |
| `overseerr` | `post_settings_jobs_run_by_job_id` | `POST` | yes | no | no |
| `overseerr` | `post_settings_jobs_schedule_by_job_id` | `POST` | yes | no | no |
| `overseerr` | `post_settings_main` | `POST` | yes | no | no |
| `overseerr` | `post_settings_main_regenerate` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_discord` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_discord_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_email` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_email_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_gotify` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_gotify_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_lunasea` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_lunasea_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_pushbullet` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_pushbullet_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_pushover` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_pushover_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_slack` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_slack_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_telegram` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_telegram_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_webhook` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_webhook_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_webpush` | `POST` | yes | no | no |
| `overseerr` | `post_settings_notifications_webpush_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_plex` | `POST` | yes | no | no |
| `overseerr` | `post_settings_plex_sync` | `POST` | yes | no | no |
| `overseerr` | `post_settings_radarr` | `POST` | yes | no | no |
| `overseerr` | `post_settings_radarr_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_sonarr` | `POST` | yes | no | no |
| `overseerr` | `post_settings_sonarr_test` | `POST` | yes | no | no |
| `overseerr` | `post_settings_tautulli` | `POST` | yes | no | no |
| `overseerr` | `post_user` | `POST` | yes | no | no |
| `overseerr` | `post_user_import_from_plex` | `POST` | yes | no | no |
| `overseerr` | `post_user_register_push_subscription` | `POST` | yes | no | no |
| `overseerr` | `post_user_settings_main_by_user_id` | `POST` | yes | no | no |
| `overseerr` | `post_user_settings_notifications_by_user_id` | `POST` | yes | no | no |
| `overseerr` | `post_user_settings_password_by_user_id` | `POST` | yes | no | no |
| `overseerr` | `post_user_settings_permissions_by_user_id` | `POST` | yes | no | no |
| `overseerr` | `put_issue_comment_by_comment_id` | `PUT` | yes | no | no |
| `overseerr` | `put_request_by_request_id` | `PUT` | yes | no | no |
| `overseerr` | `put_settings_discover_by_slider_id` | `PUT` | yes | no | no |
| `overseerr` | `put_settings_radarr_by_radarr_id` | `PUT` | yes | no | no |
| `overseerr` | `put_settings_sonarr_by_sonarr_id` | `PUT` | yes | no | no |
| `overseerr` | `put_user` | `PUT` | yes | no | no |
| `overseerr` | `put_user_by_user_id` | `PUT` | yes | no | no |
| `plex` | `add_collection_items` | `PUT` | yes | no | no |
| `plex` | `add_device` | `POST` | yes | no | no |
| `plex` | `add_device_to_dvr` | `PUT` | yes | no | no |
| `plex` | `add_download_queue_items` | `POST` | yes | no | no |
| `plex` | `add_extras` | `POST` | yes | no | no |
| `plex` | `add_lineup` | `PUT` | yes | no | no |
| `plex` | `add_playlist_items` | `PUT` | yes | no | no |
| `plex` | `add_provider` | `POST` | yes | no | no |
| `plex` | `add_section` | `POST` | yes | no | no |
| `plex` | `add_to_play_queue` | `PUT` | yes | no | no |
| `plex` | `analyze_metadata` | `PUT` | yes | no | no |
| `plex` | `apply_updates` | `PUT` | yes | no | no |
| `plex` | `cancel_activity` | `DELETE` | yes | yes | yes |
| `plex` | `cancel_grab` | `DELETE` | yes | yes | yes |
| `plex` | `cancel_refresh` | `DELETE` | yes | yes | yes |
| `plex` | `check_updates` | `PUT` | yes | no | no |
| `plex` | `clean_bundles` | `PUT` | yes | no | no |
| `plex` | `clear_play_queue` | `DELETE` | yes | yes | yes |
| `plex` | `clear_playlist_items` | `DELETE` | yes | yes | yes |
| `plex` | `create_collection` | `POST` | yes | no | no |
| `plex` | `create_custom_hub` | `POST` | yes | no | no |
| `plex` | `create_download_queue` | `POST` | yes | no | no |
| `plex` | `create_dvr` | `POST` | yes | no | no |
| `plex` | `create_marker` | `POST` | yes | no | no |
| `plex` | `create_play_queue` | `POST` | yes | no | no |
| `plex` | `create_playlist` | `POST` | yes | no | no |
| `plex` | `create_subscription` | `POST` | yes | no | no |
| `plex` | `delete_caches` | `DELETE` | yes | yes | yes |
| `plex` | `delete_collection` | `DELETE` | yes | yes | yes |
| `plex` | `delete_collection_item` | `PUT` | yes | no | no |
| `plex` | `delete_custom_hub` | `DELETE` | yes | yes | yes |
| `plex` | `delete_dvr` | `DELETE` | yes | yes | yes |
| `plex` | `delete_history` | `DELETE` | yes | yes | yes |
| `plex` | `delete_indexes` | `DELETE` | yes | yes | yes |
| `plex` | `delete_intros` | `DELETE` | yes | yes | yes |
| `plex` | `delete_library_section` | `DELETE` | yes | yes | yes |
| `plex` | `delete_lineup` | `DELETE` | yes | yes | yes |
| `plex` | `delete_marker` | `DELETE` | yes | yes | yes |
| `plex` | `delete_media_item` | `DELETE` | yes | yes | yes |
| `plex` | `delete_media_provider` | `DELETE` | yes | yes | yes |
| `plex` | `delete_metadata_item` | `DELETE` | yes | yes | yes |
| `plex` | `delete_play_queue_item` | `DELETE` | yes | yes | yes |
| `plex` | `delete_playlist` | `DELETE` | yes | yes | yes |
| `plex` | `delete_playlist_item` | `DELETE` | yes | yes | yes |
| `plex` | `delete_stream` | `DELETE` | yes | yes | yes |
| `plex` | `delete_subscription` | `DELETE` | yes | yes | yes |
| `plex` | `detect_ads` | `PUT` | yes | no | no |
| `plex` | `detect_credits` | `PUT` | yes | no | no |
| `plex` | `detect_intros` | `PUT` | yes | no | no |
| `plex` | `detect_voice_activity` | `PUT` | yes | no | no |
| `plex` | `discover_devices` | `POST` | yes | no | no |
| `plex` | `edit_marker` | `PUT` | yes | no | no |
| `plex` | `edit_metadata_item` | `PUT` | yes | no | no |
| `plex` | `edit_section` | `PUT` | yes | no | no |
| `plex` | `edit_subscription_preferences` | `PUT` | yes | no | no |
| `plex` | `empty_trash` | `PUT` | yes | no | no |
| `plex` | `enable_papertrail` | `POST` | yes | no | no |
| `plex` | `generate_thumbs` | `PUT` | yes | no | no |
| `plex` | `get_transient_token` | `POST` | yes | no | no |
| `plex` | `ingest_transient_item` | `POST` | yes | no | no |
| `plex` | `list_matches` | `PUT` | yes | no | no |
| `plex` | `mark_played` | `PUT` | yes | no | no |
| `plex` | `match_item` | `PUT` | yes | no | no |
| `plex` | `merge_items` | `PUT` | yes | no | no |
| `plex` | `modify_device` | `PUT` | yes | no | no |
| `plex` | `modify_playlist_generator` | `PUT` | yes | no | no |
| `plex` | `move_collection_item` | `PUT` | yes | no | no |
| `plex` | `move_hub` | `PUT` | yes | no | no |
| `plex` | `move_play_queue_item` | `PUT` | yes | no | no |
| `plex` | `move_playlist_item` | `PUT` | yes | no | no |
| `plex` | `optimize_database` | `PUT` | yes | no | no |
| `plex` | `post_users_sign_in_data` | `POST` | yes | no | no |
| `plex` | `process_subscriptions` | `POST` | yes | no | no |
| `plex` | `refresh_items_metadata` | `PUT` | yes | no | no |
| `plex` | `refresh_playlist` | `PUT` | yes | no | no |
| `plex` | `refresh_providers` | `POST` | yes | no | no |
| `plex` | `refresh_section` | `POST` | yes | no | no |
| `plex` | `refresh_sections_metadata` | `POST` | yes | no | no |
| `plex` | `reload_guide` | `POST` | yes | no | no |
| `plex` | `remove_device` | `DELETE` | yes | yes | yes |
| `plex` | `remove_device_from_dvr` | `DELETE` | yes | yes | yes |
| `plex` | `remove_download_queue_items` | `DELETE` | yes | yes | yes |
| `plex` | `reorder_subscription` | `PUT` | yes | no | no |
| `plex` | `report` | `POST` | yes | no | no |
| `plex` | `reset_play_queue` | `PUT` | yes | no | no |
| `plex` | `reset_section_defaults` | `DELETE` | yes | yes | yes |
| `plex` | `restart_processing_download_queue_items` | `POST` | yes | no | no |
| `plex` | `scan` | `POST` | yes | no | no |
| `plex` | `set_channelmap` | `PUT` | yes | no | no |
| `plex` | `set_device_preferences` | `PUT` | yes | no | no |
| `plex` | `set_dvr_preferences` | `PUT` | yes | no | no |
| `plex` | `set_item_artwork` | `POST` | yes | no | no |
| `plex` | `set_item_preferences` | `PUT` | yes | no | no |
| `plex` | `set_preferences` | `PUT` | yes | no | no |
| `plex` | `set_rating` | `PUT` | yes | no | no |
| `plex` | `set_section_preferences` | `PUT` | yes | no | no |
| `plex` | `set_stream_offset` | `PUT` | yes | no | no |
| `plex` | `set_stream_selection` | `PUT` | yes | no | no |
| `plex` | `shuffle` | `PUT` | yes | no | no |
| `plex` | `split_item` | `PUT` | yes | no | no |
| `plex` | `start_analysis` | `PUT` | yes | no | no |
| `plex` | `start_bif_generation` | `PUT` | yes | no | no |
| `plex` | `start_task` | `POST` | yes | no | no |
| `plex` | `start_tasks` | `POST` | yes | no | no |
| `plex` | `stop_all_refreshes` | `DELETE` | yes | yes | yes |
| `plex` | `stop_dvr_reload` | `DELETE` | yes | yes | yes |
| `plex` | `stop_scan` | `DELETE` | yes | yes | yes |
| `plex` | `stop_task` | `DELETE` | yes | yes | yes |
| `plex` | `stop_tasks` | `DELETE` | yes | yes | yes |
| `plex` | `terminate_session` | `POST` | yes | yes | yes |
| `plex` | `trigger_fallback` | `POST` | yes | no | no |
| `plex` | `tune_channel` | `POST` | yes | no | no |
| `plex` | `unmatch` | `PUT` | yes | no | no |
| `plex` | `unscrobble` | `PUT` | yes | no | no |
| `plex` | `unshuffle` | `PUT` | yes | no | no |
| `plex` | `update_hub_visibility` | `PUT` | yes | no | no |
| `plex` | `update_item_artwork` | `PUT` | yes | no | no |
| `plex` | `update_items` | `PUT` | yes | no | no |
| `plex` | `update_playlist` | `PUT` | yes | no | no |
| `plex` | `upload_playlist` | `POST` | yes | no | no |
| `plex` | `write_log` | `POST` | yes | no | no |
| `plex` | `write_message` | `PUT` | yes | no | no |
| `jellyfin` | `add_item_to_playlist` | `POST` | yes | no | no |
| `jellyfin` | `add_listing_provider` | `POST` | yes | no | no |
| `jellyfin` | `add_media_path` | `POST` | yes | no | no |
| `jellyfin` | `add_to_collection` | `POST` | yes | no | no |
| `jellyfin` | `add_tuner_host` | `POST` | yes | no | no |
| `jellyfin` | `add_user_to_session` | `POST` | yes | no | no |
| `jellyfin` | `add_virtual_folder` | `POST` | yes | no | no |
| `jellyfin` | `apply_search_criteria` | `POST` | yes | no | no |
| `jellyfin` | `authenticate_user_by_name` | `POST` | yes | no | no |
| `jellyfin` | `authenticate_with_quick_connect` | `POST` | yes | no | no |
| `jellyfin` | `authorize_quick_connect` | `POST` | yes | no | no |
| `jellyfin` | `cancel_package_installation` | `DELETE` | yes | yes | yes |
| `jellyfin` | `cancel_series_timer` | `DELETE` | yes | yes | yes |
| `jellyfin` | `cancel_timer` | `DELETE` | yes | yes | yes |
| `jellyfin` | `close_live_stream` | `POST` | yes | no | no |
| `jellyfin` | `complete_wizard` | `POST` | yes | no | no |
| `jellyfin` | `create_backup` | `POST` | yes | no | no |
| `jellyfin` | `create_collection` | `POST` | yes | no | no |
| `jellyfin` | `create_key` | `POST` | yes | no | no |
| `jellyfin` | `create_playlist` | `POST` | yes | no | no |
| `jellyfin` | `create_series_timer` | `POST` | yes | no | no |
| `jellyfin` | `create_timer` | `POST` | yes | no | no |
| `jellyfin` | `create_user_by_name` | `POST` | yes | no | no |
| `jellyfin` | `delete_alternate_sources` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_custom_splashscreen` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_device` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_item` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_item_image` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_item_image_by_index` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_items` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_listing_provider` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_lyrics` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_recording` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_subtitle` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_tuner_host` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_user` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_user_image` | `DELETE` | yes | yes | yes |
| `jellyfin` | `delete_user_item_rating` | `DELETE` | yes | yes | yes |
| `jellyfin` | `disable_plugin` | `POST` | yes | no | no |
| `jellyfin` | `display_content` | `POST` | yes | no | no |
| `jellyfin` | `download_remote_image` | `POST` | yes | no | no |
| `jellyfin` | `download_remote_lyrics` | `POST` | yes | no | no |
| `jellyfin` | `download_remote_subtitles` | `POST` | yes | no | no |
| `jellyfin` | `enable_plugin` | `POST` | yes | no | no |
| `jellyfin` | `forgot_password` | `POST` | yes | no | no |
| `jellyfin` | `forgot_password_pin` | `POST` | yes | no | no |
| `jellyfin` | `get_book_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_box_set_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_movie_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_music_album_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_music_artist_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_music_video_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_person_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_plugin_manifest` | `POST` | yes | no | no |
| `jellyfin` | `get_posted_playback_info` | `POST` | yes | no | no |
| `jellyfin` | `get_programs` | `POST` | yes | no | no |
| `jellyfin` | `get_series_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `get_trailer_remote_search_results` | `POST` | yes | no | no |
| `jellyfin` | `initiate_quick_connect` | `POST` | yes | no | no |
| `jellyfin` | `install_package` | `POST` | yes | no | no |
| `jellyfin` | `log_file` | `POST` | yes | no | no |
| `jellyfin` | `mark_favorite_item` | `POST` | yes | no | no |
| `jellyfin` | `mark_played_item` | `POST` | yes | no | no |
| `jellyfin` | `mark_unplayed_item` | `DELETE` | yes | yes | yes |
| `jellyfin` | `merge_versions` | `POST` | yes | no | no |
| `jellyfin` | `move_item` | `POST` | yes | no | no |
| `jellyfin` | `open_live_stream` | `POST` | yes | no | no |
| `jellyfin` | `ping_playback_session` | `POST` | yes | no | no |
| `jellyfin` | `play` | `POST` | yes | no | no |
| `jellyfin` | `post_added_movies` | `POST` | yes | no | no |
| `jellyfin` | `post_added_series` | `POST` | yes | no | no |
| `jellyfin` | `post_capabilities` | `POST` | yes | no | no |
| `jellyfin` | `post_full_capabilities` | `POST` | yes | no | no |
| `jellyfin` | `post_ping_system` | `POST` | yes | no | no |
| `jellyfin` | `post_updated_media` | `POST` | yes | no | no |
| `jellyfin` | `post_updated_movies` | `POST` | yes | no | no |
| `jellyfin` | `post_updated_series` | `POST` | yes | no | no |
| `jellyfin` | `post_user_image` | `POST` | yes | no | no |
| `jellyfin` | `refresh_item` | `POST` | yes | no | no |
| `jellyfin` | `refresh_library` | `POST` | yes | no | no |
| `jellyfin` | `remove_from_collection` | `DELETE` | yes | yes | yes |
| `jellyfin` | `remove_item_from_playlist` | `DELETE` | yes | yes | yes |
| `jellyfin` | `remove_media_path` | `DELETE` | yes | yes | yes |
| `jellyfin` | `remove_user_from_playlist` | `DELETE` | yes | yes | yes |
| `jellyfin` | `remove_user_from_session` | `DELETE` | yes | yes | yes |
| `jellyfin` | `remove_virtual_folder` | `DELETE` | yes | yes | yes |
| `jellyfin` | `rename_virtual_folder` | `POST` | yes | no | no |
| `jellyfin` | `report_playback_progress` | `POST` | yes | no | no |
| `jellyfin` | `report_playback_start` | `POST` | yes | no | no |
| `jellyfin` | `report_playback_stopped` | `POST` | yes | no | no |
| `jellyfin` | `report_session_ended` | `POST` | yes | no | no |
| `jellyfin` | `report_viewing` | `POST` | yes | no | no |
| `jellyfin` | `reset_tuner` | `POST` | yes | no | no |
| `jellyfin` | `restart_application` | `POST` | yes | no | no |
| `jellyfin` | `revoke_key` | `DELETE` | yes | yes | yes |
| `jellyfin` | `send_full_general_command` | `POST` | yes | no | no |
| `jellyfin` | `send_general_command` | `POST` | yes | no | no |
| `jellyfin` | `send_message_command` | `POST` | yes | no | no |
| `jellyfin` | `send_playstate_command` | `POST` | yes | no | no |
| `jellyfin` | `send_system_command` | `POST` | yes | no | no |
| `jellyfin` | `set_channel_mapping` | `POST` | yes | no | no |
| `jellyfin` | `set_item_image` | `POST` | yes | no | no |
| `jellyfin` | `set_item_image_by_index` | `POST` | yes | no | no |
| `jellyfin` | `set_remote_access` | `POST` | yes | no | no |
| `jellyfin` | `set_repositories` | `POST` | yes | no | no |
| `jellyfin` | `shutdown_application` | `POST` | yes | no | no |
| `jellyfin` | `start_restore_backup` | `POST` | yes | no | no |
| `jellyfin` | `start_task` | `POST` | yes | no | no |
| `jellyfin` | `stop_task` | `DELETE` | yes | yes | yes |
| `jellyfin` | `sync_play_buffering` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_create_group` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_join_group` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_leave_group` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_move_playlist_item` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_next_item` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_pause` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_ping` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_previous_item` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_queue` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_ready` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_remove_from_playlist` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_seek` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_set_ignore_wait` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_set_new_queue` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_set_playlist_item` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_set_repeat_mode` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_set_shuffle_mode` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_stop` | `POST` | yes | no | no |
| `jellyfin` | `sync_play_unpause` | `POST` | yes | no | no |
| `jellyfin` | `uninstall_plugin` | `DELETE` | yes | yes | yes |
| `jellyfin` | `uninstall_plugin_by_version` | `DELETE` | yes | yes | yes |
| `jellyfin` | `unmark_favorite_item` | `DELETE` | yes | yes | yes |
| `jellyfin` | `update_branding_configuration` | `POST` | yes | no | no |
| `jellyfin` | `update_configuration` | `POST` | yes | no | no |
| `jellyfin` | `update_device_options` | `POST` | yes | no | no |
| `jellyfin` | `update_display_preferences` | `POST` | yes | no | no |
| `jellyfin` | `update_initial_configuration` | `POST` | yes | no | no |
| `jellyfin` | `update_item` | `POST` | yes | no | no |
| `jellyfin` | `update_item_content_type` | `POST` | yes | no | no |
| `jellyfin` | `update_item_image_index` | `POST` | yes | no | no |
| `jellyfin` | `update_item_user_data` | `POST` | yes | no | no |
| `jellyfin` | `update_library_options` | `POST` | yes | no | no |
| `jellyfin` | `update_media_path` | `POST` | yes | no | no |
| `jellyfin` | `update_named_configuration` | `POST` | yes | no | no |
| `jellyfin` | `update_playlist` | `POST` | yes | no | no |
| `jellyfin` | `update_playlist_user` | `POST` | yes | no | no |
| `jellyfin` | `update_plugin_configuration` | `POST` | yes | no | no |
| `jellyfin` | `update_series_timer` | `POST` | yes | no | no |
| `jellyfin` | `update_startup_user` | `POST` | yes | no | no |
| `jellyfin` | `update_task` | `POST` | yes | no | no |
| `jellyfin` | `update_timer` | `POST` | yes | no | no |
| `jellyfin` | `update_user` | `POST` | yes | no | no |
| `jellyfin` | `update_user_configuration` | `POST` | yes | no | no |
| `jellyfin` | `update_user_item_rating` | `POST` | yes | no | no |
| `jellyfin` | `update_user_password` | `POST` | yes | no | no |
| `jellyfin` | `update_user_policy` | `POST` | yes | no | no |
| `jellyfin` | `upload_custom_splashscreen` | `POST` | yes | no | no |
| `jellyfin` | `upload_lyrics` | `POST` | yes | no | no |
| `jellyfin` | `upload_subtitle` | `POST` | yes | no | no |
| `jellyfin` | `validate_path` | `POST` | yes | no | no |


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
