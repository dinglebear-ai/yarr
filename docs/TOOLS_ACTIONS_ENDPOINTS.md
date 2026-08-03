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

### Generated-operation safety coverage

Every generated operation is classified below. `destructive (elicited)` includes every DELETE plus explicitly audited high-impact non-DELETE operations. `cargo xtask tool-docs --check` fails when the reviewed write inventory changes.

| Operation | Method | Safety |
|---|---|---|
| `sonarr.delete_autotagging_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_blocklist_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_blocklist_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_command_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_customfilter_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_customformat_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_customformat_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_delayprofile_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_downloadclient_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_downloadclient_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_episodefile_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_episodefile_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_importlist_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_importlist_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_importlistexclusion_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_importlistexclusion_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_indexer_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_indexer_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_languageprofile_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_metadata_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_notification_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_qualityprofile_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_queue_bulk` | `DELETE` | destructive (elicited) |
| `sonarr.delete_queue_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_releaseprofile_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_remotepathmapping_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_rootfolder_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_series_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_series_editor` | `DELETE` | destructive (elicited) |
| `sonarr.delete_system_backup_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.delete_tag_by_id` | `DELETE` | destructive (elicited) |
| `sonarr.get` | `GET` | read |
| `sonarr.get_autotagging` | `GET` | read |
| `sonarr.get_autotagging_by_id` | `GET` | read |
| `sonarr.get_autotagging_schema` | `GET` | read |
| `sonarr.get_blocklist` | `GET` | read |
| `sonarr.get_by_path_2` | `GET` | read |
| `sonarr.get_calendar` | `GET` | read |
| `sonarr.get_calendar_by_id` | `GET` | read |
| `sonarr.get_command` | `GET` | read |
| `sonarr.get_command_by_id` | `GET` | read |
| `sonarr.get_config_downloadclient` | `GET` | read |
| `sonarr.get_config_downloadclient_by_id` | `GET` | read |
| `sonarr.get_config_host` | `GET` | read |
| `sonarr.get_config_host_by_id` | `GET` | read |
| `sonarr.get_config_importlist` | `GET` | read |
| `sonarr.get_config_importlist_by_id` | `GET` | read |
| `sonarr.get_config_indexer` | `GET` | read |
| `sonarr.get_config_indexer_by_id` | `GET` | read |
| `sonarr.get_config_mediamanagement` | `GET` | read |
| `sonarr.get_config_mediamanagement_by_id` | `GET` | read |
| `sonarr.get_config_naming` | `GET` | read |
| `sonarr.get_config_naming_by_id` | `GET` | read |
| `sonarr.get_config_naming_examples` | `GET` | read |
| `sonarr.get_config_ui` | `GET` | read |
| `sonarr.get_config_ui_by_id` | `GET` | read |
| `sonarr.get_content_by_path` | `GET` | read |
| `sonarr.get_customfilter` | `GET` | read |
| `sonarr.get_customfilter_by_id` | `GET` | read |
| `sonarr.get_customformat` | `GET` | read |
| `sonarr.get_customformat_by_id` | `GET` | read |
| `sonarr.get_customformat_schema` | `GET` | read |
| `sonarr.get_delayprofile` | `GET` | read |
| `sonarr.get_delayprofile_by_id` | `GET` | read |
| `sonarr.get_diskspace` | `GET` | read |
| `sonarr.get_downloadclient` | `GET` | read |
| `sonarr.get_downloadclient_by_id` | `GET` | read |
| `sonarr.get_downloadclient_schema` | `GET` | read |
| `sonarr.get_episode` | `GET` | read |
| `sonarr.get_episode_by_id` | `GET` | read |
| `sonarr.get_episodefile` | `GET` | read |
| `sonarr.get_episodefile_by_id` | `GET` | read |
| `sonarr.get_feed_calendar_sonarr_ics` | `GET` | read |
| `sonarr.get_filesystem` | `GET` | read |
| `sonarr.get_filesystem_mediafiles` | `GET` | read |
| `sonarr.get_filesystem_type` | `GET` | read |
| `sonarr.get_health` | `GET` | read |
| `sonarr.get_history` | `GET` | read |
| `sonarr.get_history_series` | `GET` | read |
| `sonarr.get_history_since` | `GET` | read |
| `sonarr.get_importlist` | `GET` | read |
| `sonarr.get_importlist_by_id` | `GET` | read |
| `sonarr.get_importlist_schema` | `GET` | read |
| `sonarr.get_importlistexclusion` | `GET` | read |
| `sonarr.get_importlistexclusion_by_id` | `GET` | read |
| `sonarr.get_importlistexclusion_paged` | `GET` | read |
| `sonarr.get_indexer` | `GET` | read |
| `sonarr.get_indexer_by_id` | `GET` | read |
| `sonarr.get_indexer_schema` | `GET` | read |
| `sonarr.get_indexerflag` | `GET` | read |
| `sonarr.get_language` | `GET` | read |
| `sonarr.get_language_by_id` | `GET` | read |
| `sonarr.get_languageprofile` | `GET` | read |
| `sonarr.get_languageprofile_by_id` | `GET` | read |
| `sonarr.get_languageprofile_schema` | `GET` | read |
| `sonarr.get_localization` | `GET` | read |
| `sonarr.get_localization_by_id` | `GET` | read |
| `sonarr.get_localization_language` | `GET` | read |
| `sonarr.get_log` | `GET` | read |
| `sonarr.get_log_file` | `GET` | read |
| `sonarr.get_log_file_by_filename` | `GET` | read |
| `sonarr.get_log_file_update` | `GET` | read |
| `sonarr.get_log_file_update_by_filename` | `GET` | read |
| `sonarr.get_login` | `GET` | read |
| `sonarr.get_logout` | `GET` | read |
| `sonarr.get_manualimport` | `GET` | read |
| `sonarr.get_mediacover_by_filename_series_id` | `GET` | read |
| `sonarr.get_metadata` | `GET` | read |
| `sonarr.get_metadata_by_id` | `GET` | read |
| `sonarr.get_metadata_schema` | `GET` | read |
| `sonarr.get_notification` | `GET` | read |
| `sonarr.get_notification_by_id` | `GET` | read |
| `sonarr.get_notification_schema` | `GET` | read |
| `sonarr.get_parse` | `GET` | read |
| `sonarr.get_ping` | `GET` | read |
| `sonarr.get_qualitydefinition` | `GET` | read |
| `sonarr.get_qualitydefinition_by_id` | `GET` | read |
| `sonarr.get_qualitydefinition_limits` | `GET` | read |
| `sonarr.get_qualityprofile` | `GET` | read |
| `sonarr.get_qualityprofile_by_id` | `GET` | read |
| `sonarr.get_qualityprofile_schema` | `GET` | read |
| `sonarr.get_queue` | `GET` | read |
| `sonarr.get_queue_details` | `GET` | read |
| `sonarr.get_queue_status` | `GET` | read |
| `sonarr.get_release` | `GET` | read |
| `sonarr.get_releaseprofile` | `GET` | read |
| `sonarr.get_releaseprofile_by_id` | `GET` | read |
| `sonarr.get_remotepathmapping` | `GET` | read |
| `sonarr.get_remotepathmapping_by_id` | `GET` | read |
| `sonarr.get_rename` | `GET` | read |
| `sonarr.get_rootfolder` | `GET` | read |
| `sonarr.get_rootfolder_by_id` | `GET` | read |
| `sonarr.get_series` | `GET` | read |
| `sonarr.get_series_by_id` | `GET` | read |
| `sonarr.get_series_folder_by_id` | `GET` | read |
| `sonarr.get_series_lookup` | `GET` | read |
| `sonarr.get_system_backup` | `GET` | read |
| `sonarr.get_system_routes` | `GET` | read |
| `sonarr.get_system_routes_duplicate` | `GET` | read |
| `sonarr.get_system_status` | `GET` | read |
| `sonarr.get_system_task` | `GET` | read |
| `sonarr.get_system_task_by_id` | `GET` | read |
| `sonarr.get_tag` | `GET` | read |
| `sonarr.get_tag_by_id` | `GET` | read |
| `sonarr.get_tag_detail` | `GET` | read |
| `sonarr.get_tag_detail_by_id` | `GET` | read |
| `sonarr.get_update` | `GET` | read |
| `sonarr.get_wanted_cutoff` | `GET` | read |
| `sonarr.get_wanted_cutoff_by_id` | `GET` | read |
| `sonarr.get_wanted_missing` | `GET` | read |
| `sonarr.get_wanted_missing_by_id` | `GET` | read |
| `sonarr.post_autotagging` | `POST` | mutating |
| `sonarr.post_command` | `POST` | destructive (elicited) |
| `sonarr.post_customfilter` | `POST` | mutating |
| `sonarr.post_customformat` | `POST` | mutating |
| `sonarr.post_delayprofile` | `POST` | mutating |
| `sonarr.post_downloadclient` | `POST` | mutating |
| `sonarr.post_downloadclient_action_by_name` | `POST` | mutating |
| `sonarr.post_downloadclient_test` | `POST` | mutating |
| `sonarr.post_downloadclient_testall` | `POST` | mutating |
| `sonarr.post_history_failed_by_id` | `POST` | mutating |
| `sonarr.post_importlist` | `POST` | mutating |
| `sonarr.post_importlist_action_by_name` | `POST` | mutating |
| `sonarr.post_importlist_test` | `POST` | mutating |
| `sonarr.post_importlist_testall` | `POST` | mutating |
| `sonarr.post_importlistexclusion` | `POST` | mutating |
| `sonarr.post_indexer` | `POST` | mutating |
| `sonarr.post_indexer_action_by_name` | `POST` | mutating |
| `sonarr.post_indexer_test` | `POST` | mutating |
| `sonarr.post_indexer_testall` | `POST` | mutating |
| `sonarr.post_languageprofile` | `POST` | mutating |
| `sonarr.post_login` | `POST` | mutating |
| `sonarr.post_manualimport` | `POST` | mutating |
| `sonarr.post_metadata` | `POST` | mutating |
| `sonarr.post_metadata_action_by_name` | `POST` | mutating |
| `sonarr.post_metadata_test` | `POST` | mutating |
| `sonarr.post_metadata_testall` | `POST` | mutating |
| `sonarr.post_notification` | `POST` | mutating |
| `sonarr.post_notification_action_by_name` | `POST` | mutating |
| `sonarr.post_notification_test` | `POST` | mutating |
| `sonarr.post_notification_testall` | `POST` | mutating |
| `sonarr.post_qualityprofile` | `POST` | mutating |
| `sonarr.post_queue_grab_bulk` | `POST` | mutating |
| `sonarr.post_queue_grab_by_id` | `POST` | mutating |
| `sonarr.post_release` | `POST` | mutating |
| `sonarr.post_release_push` | `POST` | mutating |
| `sonarr.post_releaseprofile` | `POST` | mutating |
| `sonarr.post_remotepathmapping` | `POST` | mutating |
| `sonarr.post_rootfolder` | `POST` | mutating |
| `sonarr.post_seasonpass` | `POST` | mutating |
| `sonarr.post_series` | `POST` | mutating |
| `sonarr.post_series_import` | `POST` | mutating |
| `sonarr.post_system_backup_restore_by_id` | `POST` | destructive (elicited) |
| `sonarr.post_system_backup_restore_upload` | `POST` | destructive (elicited) |
| `sonarr.post_system_restart` | `POST` | destructive (elicited) |
| `sonarr.post_system_shutdown` | `POST` | destructive (elicited) |
| `sonarr.post_tag` | `POST` | mutating |
| `sonarr.put_autotagging_by_id` | `PUT` | mutating |
| `sonarr.put_config_downloadclient_by_id` | `PUT` | mutating |
| `sonarr.put_config_host_by_id` | `PUT` | mutating |
| `sonarr.put_config_importlist_by_id` | `PUT` | mutating |
| `sonarr.put_config_indexer_by_id` | `PUT` | mutating |
| `sonarr.put_config_mediamanagement_by_id` | `PUT` | mutating |
| `sonarr.put_config_naming_by_id` | `PUT` | mutating |
| `sonarr.put_config_ui_by_id` | `PUT` | mutating |
| `sonarr.put_customfilter_by_id` | `PUT` | mutating |
| `sonarr.put_customformat_bulk` | `PUT` | mutating |
| `sonarr.put_customformat_by_id` | `PUT` | mutating |
| `sonarr.put_delayprofile_by_id` | `PUT` | mutating |
| `sonarr.put_delayprofile_reorder_by_id` | `PUT` | mutating |
| `sonarr.put_downloadclient_bulk` | `PUT` | mutating |
| `sonarr.put_downloadclient_by_id` | `PUT` | mutating |
| `sonarr.put_episode_by_id` | `PUT` | mutating |
| `sonarr.put_episode_monitor` | `PUT` | mutating |
| `sonarr.put_episodefile_bulk` | `PUT` | mutating |
| `sonarr.put_episodefile_by_id` | `PUT` | mutating |
| `sonarr.put_episodefile_editor` | `PUT` | mutating |
| `sonarr.put_importlist_bulk` | `PUT` | mutating |
| `sonarr.put_importlist_by_id` | `PUT` | mutating |
| `sonarr.put_importlistexclusion_by_id` | `PUT` | mutating |
| `sonarr.put_indexer_bulk` | `PUT` | mutating |
| `sonarr.put_indexer_by_id` | `PUT` | mutating |
| `sonarr.put_languageprofile_by_id` | `PUT` | mutating |
| `sonarr.put_metadata_by_id` | `PUT` | mutating |
| `sonarr.put_notification_by_id` | `PUT` | mutating |
| `sonarr.put_qualitydefinition_by_id` | `PUT` | mutating |
| `sonarr.put_qualitydefinition_update` | `PUT` | mutating |
| `sonarr.put_qualityprofile_by_id` | `PUT` | mutating |
| `sonarr.put_releaseprofile_by_id` | `PUT` | mutating |
| `sonarr.put_remotepathmapping_by_id` | `PUT` | mutating |
| `sonarr.put_series_by_id` | `PUT` | mutating |
| `sonarr.put_series_editor` | `PUT` | destructive (elicited) |
| `sonarr.put_tag_by_id` | `PUT` | mutating |
| `radarr.delete_autotagging_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_blocklist_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_blocklist_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_command_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_customfilter_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_customformat_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_customformat_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_delayprofile_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_downloadclient_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_downloadclient_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_exclusions_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_exclusions_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_importlist_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_importlist_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_indexer_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_indexer_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_metadata_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_movie_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_movie_editor` | `DELETE` | destructive (elicited) |
| `radarr.delete_moviefile_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_moviefile_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_notification_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_qualityprofile_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_queue_bulk` | `DELETE` | destructive (elicited) |
| `radarr.delete_queue_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_releaseprofile_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_remotepathmapping_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_rootfolder_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_system_backup_by_id` | `DELETE` | destructive (elicited) |
| `radarr.delete_tag_by_id` | `DELETE` | destructive (elicited) |
| `radarr.get` | `GET` | read |
| `radarr.get_alttitle` | `GET` | read |
| `radarr.get_alttitle_by_id` | `GET` | read |
| `radarr.get_autotagging` | `GET` | read |
| `radarr.get_autotagging_by_id` | `GET` | read |
| `radarr.get_autotagging_schema` | `GET` | read |
| `radarr.get_blocklist` | `GET` | read |
| `radarr.get_blocklist_movie` | `GET` | read |
| `radarr.get_by_path_2` | `GET` | read |
| `radarr.get_calendar` | `GET` | read |
| `radarr.get_collection` | `GET` | read |
| `radarr.get_collection_by_id` | `GET` | read |
| `radarr.get_command` | `GET` | read |
| `radarr.get_command_by_id` | `GET` | read |
| `radarr.get_config_downloadclient` | `GET` | read |
| `radarr.get_config_downloadclient_by_id` | `GET` | read |
| `radarr.get_config_host` | `GET` | read |
| `radarr.get_config_host_by_id` | `GET` | read |
| `radarr.get_config_importlist` | `GET` | read |
| `radarr.get_config_importlist_by_id` | `GET` | read |
| `radarr.get_config_indexer` | `GET` | read |
| `radarr.get_config_indexer_by_id` | `GET` | read |
| `radarr.get_config_mediamanagement` | `GET` | read |
| `radarr.get_config_mediamanagement_by_id` | `GET` | read |
| `radarr.get_config_metadata` | `GET` | read |
| `radarr.get_config_metadata_by_id` | `GET` | read |
| `radarr.get_config_naming` | `GET` | read |
| `radarr.get_config_naming_by_id` | `GET` | read |
| `radarr.get_config_naming_examples` | `GET` | read |
| `radarr.get_config_ui` | `GET` | read |
| `radarr.get_config_ui_by_id` | `GET` | read |
| `radarr.get_content_by_path` | `GET` | read |
| `radarr.get_credit` | `GET` | read |
| `radarr.get_credit_by_id` | `GET` | read |
| `radarr.get_customfilter` | `GET` | read |
| `radarr.get_customfilter_by_id` | `GET` | read |
| `radarr.get_customformat` | `GET` | read |
| `radarr.get_customformat_by_id` | `GET` | read |
| `radarr.get_customformat_schema` | `GET` | read |
| `radarr.get_delayprofile` | `GET` | read |
| `radarr.get_delayprofile_by_id` | `GET` | read |
| `radarr.get_diskspace` | `GET` | read |
| `radarr.get_downloadclient` | `GET` | read |
| `radarr.get_downloadclient_by_id` | `GET` | read |
| `radarr.get_downloadclient_schema` | `GET` | read |
| `radarr.get_exclusions` | `GET` | read |
| `radarr.get_exclusions_by_id` | `GET` | read |
| `radarr.get_exclusions_paged` | `GET` | read |
| `radarr.get_extrafile` | `GET` | read |
| `radarr.get_feed_calendar_radarr_ics` | `GET` | read |
| `radarr.get_filesystem` | `GET` | read |
| `radarr.get_filesystem_mediafiles` | `GET` | read |
| `radarr.get_filesystem_type` | `GET` | read |
| `radarr.get_health` | `GET` | read |
| `radarr.get_history` | `GET` | read |
| `radarr.get_history_movie` | `GET` | read |
| `radarr.get_history_since` | `GET` | read |
| `radarr.get_importlist` | `GET` | read |
| `radarr.get_importlist_by_id` | `GET` | read |
| `radarr.get_importlist_movie` | `GET` | read |
| `radarr.get_importlist_schema` | `GET` | read |
| `radarr.get_indexer` | `GET` | read |
| `radarr.get_indexer_by_id` | `GET` | read |
| `radarr.get_indexer_schema` | `GET` | read |
| `radarr.get_indexerflag` | `GET` | read |
| `radarr.get_language` | `GET` | read |
| `radarr.get_language_by_id` | `GET` | read |
| `radarr.get_localization` | `GET` | read |
| `radarr.get_localization_language` | `GET` | read |
| `radarr.get_log` | `GET` | read |
| `radarr.get_log_file` | `GET` | read |
| `radarr.get_log_file_by_filename` | `GET` | read |
| `radarr.get_log_file_update` | `GET` | read |
| `radarr.get_log_file_update_by_filename` | `GET` | read |
| `radarr.get_login` | `GET` | read |
| `radarr.get_logout` | `GET` | read |
| `radarr.get_manualimport` | `GET` | read |
| `radarr.get_mediacover_by_filename_movie_id` | `GET` | read |
| `radarr.get_metadata` | `GET` | read |
| `radarr.get_metadata_by_id` | `GET` | read |
| `radarr.get_metadata_schema` | `GET` | read |
| `radarr.get_movie` | `GET` | read |
| `radarr.get_movie_by_id` | `GET` | read |
| `radarr.get_movie_folder_by_id` | `GET` | read |
| `radarr.get_movie_lookup` | `GET` | read |
| `radarr.get_movie_lookup_imdb` | `GET` | read |
| `radarr.get_movie_lookup_tmdb` | `GET` | read |
| `radarr.get_moviefile` | `GET` | read |
| `radarr.get_moviefile_by_id` | `GET` | read |
| `radarr.get_notification` | `GET` | read |
| `radarr.get_notification_by_id` | `GET` | read |
| `radarr.get_notification_schema` | `GET` | read |
| `radarr.get_parse` | `GET` | read |
| `radarr.get_ping` | `GET` | read |
| `radarr.get_qualitydefinition` | `GET` | read |
| `radarr.get_qualitydefinition_by_id` | `GET` | read |
| `radarr.get_qualitydefinition_limits` | `GET` | read |
| `radarr.get_qualityprofile` | `GET` | read |
| `radarr.get_qualityprofile_by_id` | `GET` | read |
| `radarr.get_qualityprofile_schema` | `GET` | read |
| `radarr.get_queue` | `GET` | read |
| `radarr.get_queue_details` | `GET` | read |
| `radarr.get_queue_status` | `GET` | read |
| `radarr.get_release` | `GET` | read |
| `radarr.get_releaseprofile` | `GET` | read |
| `radarr.get_releaseprofile_by_id` | `GET` | read |
| `radarr.get_remotepathmapping` | `GET` | read |
| `radarr.get_remotepathmapping_by_id` | `GET` | read |
| `radarr.get_rename` | `GET` | read |
| `radarr.get_rootfolder` | `GET` | read |
| `radarr.get_rootfolder_by_id` | `GET` | read |
| `radarr.get_system_backup` | `GET` | read |
| `radarr.get_system_routes` | `GET` | read |
| `radarr.get_system_routes_duplicate` | `GET` | read |
| `radarr.get_system_status` | `GET` | read |
| `radarr.get_system_task` | `GET` | read |
| `radarr.get_system_task_by_id` | `GET` | read |
| `radarr.get_tag` | `GET` | read |
| `radarr.get_tag_by_id` | `GET` | read |
| `radarr.get_tag_detail` | `GET` | read |
| `radarr.get_tag_detail_by_id` | `GET` | read |
| `radarr.get_update` | `GET` | read |
| `radarr.get_wanted_cutoff` | `GET` | read |
| `radarr.get_wanted_missing` | `GET` | read |
| `radarr.post_autotagging` | `POST` | mutating |
| `radarr.post_command` | `POST` | destructive (elicited) |
| `radarr.post_customfilter` | `POST` | mutating |
| `radarr.post_customformat` | `POST` | mutating |
| `radarr.post_delayprofile` | `POST` | mutating |
| `radarr.post_downloadclient` | `POST` | mutating |
| `radarr.post_downloadclient_action_by_name` | `POST` | mutating |
| `radarr.post_downloadclient_test` | `POST` | mutating |
| `radarr.post_downloadclient_testall` | `POST` | mutating |
| `radarr.post_exclusions` | `POST` | mutating |
| `radarr.post_exclusions_bulk` | `POST` | mutating |
| `radarr.post_history_failed_by_id` | `POST` | mutating |
| `radarr.post_importlist` | `POST` | mutating |
| `radarr.post_importlist_action_by_name` | `POST` | mutating |
| `radarr.post_importlist_movie` | `POST` | mutating |
| `radarr.post_importlist_test` | `POST` | mutating |
| `radarr.post_importlist_testall` | `POST` | mutating |
| `radarr.post_indexer` | `POST` | mutating |
| `radarr.post_indexer_action_by_name` | `POST` | mutating |
| `radarr.post_indexer_test` | `POST` | mutating |
| `radarr.post_indexer_testall` | `POST` | mutating |
| `radarr.post_login` | `POST` | mutating |
| `radarr.post_manualimport` | `POST` | mutating |
| `radarr.post_metadata` | `POST` | mutating |
| `radarr.post_metadata_action_by_name` | `POST` | mutating |
| `radarr.post_metadata_test` | `POST` | mutating |
| `radarr.post_metadata_testall` | `POST` | mutating |
| `radarr.post_movie` | `POST` | mutating |
| `radarr.post_movie_import` | `POST` | mutating |
| `radarr.post_notification` | `POST` | mutating |
| `radarr.post_notification_action_by_name` | `POST` | mutating |
| `radarr.post_notification_test` | `POST` | mutating |
| `radarr.post_notification_testall` | `POST` | mutating |
| `radarr.post_qualityprofile` | `POST` | mutating |
| `radarr.post_queue_grab_bulk` | `POST` | mutating |
| `radarr.post_queue_grab_by_id` | `POST` | mutating |
| `radarr.post_release` | `POST` | mutating |
| `radarr.post_release_push` | `POST` | mutating |
| `radarr.post_releaseprofile` | `POST` | mutating |
| `radarr.post_remotepathmapping` | `POST` | mutating |
| `radarr.post_rootfolder` | `POST` | mutating |
| `radarr.post_system_backup_restore_by_id` | `POST` | destructive (elicited) |
| `radarr.post_system_backup_restore_upload` | `POST` | destructive (elicited) |
| `radarr.post_system_restart` | `POST` | destructive (elicited) |
| `radarr.post_system_shutdown` | `POST` | destructive (elicited) |
| `radarr.post_tag` | `POST` | mutating |
| `radarr.put_autotagging_by_id` | `PUT` | mutating |
| `radarr.put_collection` | `PUT` | mutating |
| `radarr.put_collection_by_id` | `PUT` | mutating |
| `radarr.put_config_downloadclient_by_id` | `PUT` | mutating |
| `radarr.put_config_host_by_id` | `PUT` | mutating |
| `radarr.put_config_importlist_by_id` | `PUT` | mutating |
| `radarr.put_config_indexer_by_id` | `PUT` | mutating |
| `radarr.put_config_mediamanagement_by_id` | `PUT` | mutating |
| `radarr.put_config_metadata_by_id` | `PUT` | mutating |
| `radarr.put_config_naming_by_id` | `PUT` | mutating |
| `radarr.put_config_ui_by_id` | `PUT` | mutating |
| `radarr.put_customfilter_by_id` | `PUT` | mutating |
| `radarr.put_customformat_bulk` | `PUT` | mutating |
| `radarr.put_customformat_by_id` | `PUT` | mutating |
| `radarr.put_delayprofile_by_id` | `PUT` | mutating |
| `radarr.put_delayprofile_reorder_by_id` | `PUT` | mutating |
| `radarr.put_downloadclient_bulk` | `PUT` | mutating |
| `radarr.put_downloadclient_by_id` | `PUT` | mutating |
| `radarr.put_exclusions_by_id` | `PUT` | mutating |
| `radarr.put_importlist_bulk` | `PUT` | mutating |
| `radarr.put_importlist_by_id` | `PUT` | mutating |
| `radarr.put_indexer_bulk` | `PUT` | mutating |
| `radarr.put_indexer_by_id` | `PUT` | mutating |
| `radarr.put_metadata_by_id` | `PUT` | mutating |
| `radarr.put_movie_by_id` | `PUT` | mutating |
| `radarr.put_movie_editor` | `PUT` | destructive (elicited) |
| `radarr.put_moviefile_bulk` | `PUT` | mutating |
| `radarr.put_moviefile_by_id` | `PUT` | mutating |
| `radarr.put_moviefile_editor` | `PUT` | mutating |
| `radarr.put_notification_by_id` | `PUT` | mutating |
| `radarr.put_qualitydefinition_by_id` | `PUT` | mutating |
| `radarr.put_qualitydefinition_update` | `PUT` | mutating |
| `radarr.put_qualityprofile_by_id` | `PUT` | mutating |
| `radarr.put_releaseprofile_by_id` | `PUT` | mutating |
| `radarr.put_remotepathmapping_by_id` | `PUT` | mutating |
| `radarr.put_tag_by_id` | `PUT` | mutating |
| `prowlarr.delete_applications_bulk` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_applications_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_appprofile_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_command_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_customfilter_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_downloadclient_bulk` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_downloadclient_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_indexer_bulk` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_indexer_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_indexerproxy_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_notification_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_system_backup_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.delete_tag_by_id` | `DELETE` | destructive (elicited) |
| `prowlarr.get` | `GET` | read |
| `prowlarr.get_applications` | `GET` | read |
| `prowlarr.get_applications_by_id` | `GET` | read |
| `prowlarr.get_applications_schema` | `GET` | read |
| `prowlarr.get_appprofile` | `GET` | read |
| `prowlarr.get_appprofile_by_id` | `GET` | read |
| `prowlarr.get_appprofile_schema` | `GET` | read |
| `prowlarr.get_by_id` | `GET` | read |
| `prowlarr.get_by_path_2` | `GET` | read |
| `prowlarr.get_command` | `GET` | read |
| `prowlarr.get_command_by_id` | `GET` | read |
| `prowlarr.get_config_development` | `GET` | read |
| `prowlarr.get_config_development_by_id` | `GET` | read |
| `prowlarr.get_config_downloadclient` | `GET` | read |
| `prowlarr.get_config_downloadclient_by_id` | `GET` | read |
| `prowlarr.get_config_host` | `GET` | read |
| `prowlarr.get_config_host_by_id` | `GET` | read |
| `prowlarr.get_config_ui` | `GET` | read |
| `prowlarr.get_config_ui_by_id` | `GET` | read |
| `prowlarr.get_content_by_path` | `GET` | read |
| `prowlarr.get_customfilter` | `GET` | read |
| `prowlarr.get_customfilter_by_id` | `GET` | read |
| `prowlarr.get_download_by_id` | `GET` | read |
| `prowlarr.get_downloadclient` | `GET` | read |
| `prowlarr.get_downloadclient_by_id` | `GET` | read |
| `prowlarr.get_downloadclient_schema` | `GET` | read |
| `prowlarr.get_filesystem` | `GET` | read |
| `prowlarr.get_filesystem_type` | `GET` | read |
| `prowlarr.get_health` | `GET` | read |
| `prowlarr.get_history` | `GET` | read |
| `prowlarr.get_history_indexer` | `GET` | read |
| `prowlarr.get_history_since` | `GET` | read |
| `prowlarr.get_indexer` | `GET` | read |
| `prowlarr.get_indexer_by_id` | `GET` | read |
| `prowlarr.get_indexer_categories` | `GET` | read |
| `prowlarr.get_indexer_download_by_id` | `GET` | read |
| `prowlarr.get_indexer_newznab_by_id` | `GET` | read |
| `prowlarr.get_indexer_schema` | `GET` | read |
| `prowlarr.get_indexerproxy` | `GET` | read |
| `prowlarr.get_indexerproxy_by_id` | `GET` | read |
| `prowlarr.get_indexerproxy_schema` | `GET` | read |
| `prowlarr.get_indexerstats` | `GET` | read |
| `prowlarr.get_indexerstatus` | `GET` | read |
| `prowlarr.get_localization` | `GET` | read |
| `prowlarr.get_localization_options` | `GET` | read |
| `prowlarr.get_log` | `GET` | read |
| `prowlarr.get_log_file` | `GET` | read |
| `prowlarr.get_log_file_by_filename` | `GET` | read |
| `prowlarr.get_log_file_update` | `GET` | read |
| `prowlarr.get_log_file_update_by_filename` | `GET` | read |
| `prowlarr.get_login` | `GET` | read |
| `prowlarr.get_logout` | `GET` | read |
| `prowlarr.get_notification` | `GET` | read |
| `prowlarr.get_notification_by_id` | `GET` | read |
| `prowlarr.get_notification_schema` | `GET` | read |
| `prowlarr.get_ping` | `GET` | read |
| `prowlarr.get_search` | `GET` | read |
| `prowlarr.get_system_backup` | `GET` | read |
| `prowlarr.get_system_routes` | `GET` | read |
| `prowlarr.get_system_routes_duplicate` | `GET` | read |
| `prowlarr.get_system_status` | `GET` | read |
| `prowlarr.get_system_task` | `GET` | read |
| `prowlarr.get_system_task_by_id` | `GET` | read |
| `prowlarr.get_tag` | `GET` | read |
| `prowlarr.get_tag_by_id` | `GET` | read |
| `prowlarr.get_tag_detail` | `GET` | read |
| `prowlarr.get_tag_detail_by_id` | `GET` | read |
| `prowlarr.get_update` | `GET` | read |
| `prowlarr.post_applications` | `POST` | mutating |
| `prowlarr.post_applications_action_by_name` | `POST` | mutating |
| `prowlarr.post_applications_test` | `POST` | mutating |
| `prowlarr.post_applications_testall` | `POST` | mutating |
| `prowlarr.post_appprofile` | `POST` | mutating |
| `prowlarr.post_command` | `POST` | mutating |
| `prowlarr.post_customfilter` | `POST` | mutating |
| `prowlarr.post_downloadclient` | `POST` | mutating |
| `prowlarr.post_downloadclient_action_by_name` | `POST` | mutating |
| `prowlarr.post_downloadclient_test` | `POST` | mutating |
| `prowlarr.post_downloadclient_testall` | `POST` | mutating |
| `prowlarr.post_indexer` | `POST` | mutating |
| `prowlarr.post_indexer_action_by_name` | `POST` | mutating |
| `prowlarr.post_indexer_test` | `POST` | mutating |
| `prowlarr.post_indexer_testall` | `POST` | mutating |
| `prowlarr.post_indexerproxy` | `POST` | mutating |
| `prowlarr.post_indexerproxy_action_by_name` | `POST` | mutating |
| `prowlarr.post_indexerproxy_test` | `POST` | mutating |
| `prowlarr.post_indexerproxy_testall` | `POST` | mutating |
| `prowlarr.post_login` | `POST` | mutating |
| `prowlarr.post_notification` | `POST` | mutating |
| `prowlarr.post_notification_action_by_name` | `POST` | mutating |
| `prowlarr.post_notification_test` | `POST` | mutating |
| `prowlarr.post_notification_testall` | `POST` | mutating |
| `prowlarr.post_search` | `POST` | mutating |
| `prowlarr.post_search_bulk` | `POST` | mutating |
| `prowlarr.post_system_backup_restore_by_id` | `POST` | mutating |
| `prowlarr.post_system_backup_restore_upload` | `POST` | mutating |
| `prowlarr.post_system_restart` | `POST` | mutating |
| `prowlarr.post_system_shutdown` | `POST` | mutating |
| `prowlarr.post_tag` | `POST` | mutating |
| `prowlarr.put_applications_bulk` | `PUT` | mutating |
| `prowlarr.put_applications_by_id` | `PUT` | mutating |
| `prowlarr.put_appprofile_by_id` | `PUT` | mutating |
| `prowlarr.put_config_development_by_id` | `PUT` | mutating |
| `prowlarr.put_config_downloadclient_by_id` | `PUT` | mutating |
| `prowlarr.put_config_host_by_id` | `PUT` | mutating |
| `prowlarr.put_config_ui_by_id` | `PUT` | mutating |
| `prowlarr.put_customfilter_by_id` | `PUT` | mutating |
| `prowlarr.put_downloadclient_bulk` | `PUT` | mutating |
| `prowlarr.put_downloadclient_by_id` | `PUT` | mutating |
| `prowlarr.put_indexer_bulk` | `PUT` | mutating |
| `prowlarr.put_indexer_by_id` | `PUT` | mutating |
| `prowlarr.put_indexerproxy_by_id` | `PUT` | mutating |
| `prowlarr.put_notification_by_id` | `PUT` | mutating |
| `prowlarr.put_tag_by_id` | `PUT` | mutating |
| `overseerr.delete_issue_by_issue_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_issue_comment_by_comment_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_media_by_media_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_request_by_request_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_settings_discover_by_slider_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_settings_radarr_by_radarr_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_settings_sonarr_by_sonarr_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_user_by_user_id` | `DELETE` | destructive (elicited) |
| `overseerr.delete_user_push_subscription_by_endpoint_user_id` | `DELETE` | destructive (elicited) |
| `overseerr.get_auth_me` | `GET` | read |
| `overseerr.get_backdrops` | `GET` | read |
| `overseerr.get_collection_by_collection_id` | `GET` | read |
| `overseerr.get_discover_genreslider_movie` | `GET` | read |
| `overseerr.get_discover_genreslider_tv` | `GET` | read |
| `overseerr.get_discover_keyword_movies_by_keyword_id` | `GET` | read |
| `overseerr.get_discover_movies` | `GET` | read |
| `overseerr.get_discover_movies_genre_by_genre_id` | `GET` | read |
| `overseerr.get_discover_movies_language_by_language` | `GET` | read |
| `overseerr.get_discover_movies_studio_by_studio_id` | `GET` | read |
| `overseerr.get_discover_movies_upcoming` | `GET` | read |
| `overseerr.get_discover_trending` | `GET` | read |
| `overseerr.get_discover_tv` | `GET` | read |
| `overseerr.get_discover_tv_genre_by_genre_id` | `GET` | read |
| `overseerr.get_discover_tv_language_by_language` | `GET` | read |
| `overseerr.get_discover_tv_network_by_network_id` | `GET` | read |
| `overseerr.get_discover_tv_upcoming` | `GET` | read |
| `overseerr.get_discover_watchlist` | `GET` | read |
| `overseerr.get_genres_movie` | `GET` | read |
| `overseerr.get_genres_tv` | `GET` | read |
| `overseerr.get_issue` | `GET` | read |
| `overseerr.get_issue_by_issue_id` | `GET` | read |
| `overseerr.get_issue_comment_by_comment_id` | `GET` | read |
| `overseerr.get_issue_count` | `GET` | read |
| `overseerr.get_keyword_by_keyword_id` | `GET` | read |
| `overseerr.get_languages` | `GET` | read |
| `overseerr.get_media` | `GET` | read |
| `overseerr.get_media_watch_data_by_media_id` | `GET` | read |
| `overseerr.get_movie_by_movie_id` | `GET` | read |
| `overseerr.get_movie_ratings_by_movie_id` | `GET` | read |
| `overseerr.get_movie_ratingscombined_by_movie_id` | `GET` | read |
| `overseerr.get_movie_recommendations_by_movie_id` | `GET` | read |
| `overseerr.get_movie_similar_by_movie_id` | `GET` | read |
| `overseerr.get_network_by_network_id` | `GET` | read |
| `overseerr.get_person_by_person_id` | `GET` | read |
| `overseerr.get_person_combined_credits_by_person_id` | `GET` | read |
| `overseerr.get_regions` | `GET` | read |
| `overseerr.get_request` | `GET` | read |
| `overseerr.get_request_by_request_id` | `GET` | read |
| `overseerr.get_request_count` | `GET` | read |
| `overseerr.get_search` | `GET` | read |
| `overseerr.get_search_company` | `GET` | read |
| `overseerr.get_search_keyword` | `GET` | read |
| `overseerr.get_service_radarr` | `GET` | read |
| `overseerr.get_service_radarr_by_radarr_id` | `GET` | read |
| `overseerr.get_service_sonarr` | `GET` | read |
| `overseerr.get_service_sonarr_by_sonarr_id` | `GET` | read |
| `overseerr.get_service_sonarr_lookup_by_tmdb_id` | `GET` | read |
| `overseerr.get_settings_about` | `GET` | read |
| `overseerr.get_settings_cache` | `GET` | read |
| `overseerr.get_settings_discover` | `GET` | read |
| `overseerr.get_settings_discover_reset` | `GET` | read |
| `overseerr.get_settings_jobs` | `GET` | read |
| `overseerr.get_settings_logs` | `GET` | read |
| `overseerr.get_settings_main` | `GET` | read |
| `overseerr.get_settings_notifications_discord` | `GET` | read |
| `overseerr.get_settings_notifications_email` | `GET` | read |
| `overseerr.get_settings_notifications_gotify` | `GET` | read |
| `overseerr.get_settings_notifications_lunasea` | `GET` | read |
| `overseerr.get_settings_notifications_pushbullet` | `GET` | read |
| `overseerr.get_settings_notifications_pushover` | `GET` | read |
| `overseerr.get_settings_notifications_pushover_sounds` | `GET` | read |
| `overseerr.get_settings_notifications_slack` | `GET` | read |
| `overseerr.get_settings_notifications_telegram` | `GET` | read |
| `overseerr.get_settings_notifications_webhook` | `GET` | read |
| `overseerr.get_settings_notifications_webpush` | `GET` | read |
| `overseerr.get_settings_plex` | `GET` | read |
| `overseerr.get_settings_plex_devices_servers` | `GET` | read |
| `overseerr.get_settings_plex_sync` | `GET` | read |
| `overseerr.get_settings_plex_users` | `GET` | read |
| `overseerr.get_settings_public` | `GET` | read |
| `overseerr.get_settings_radarr` | `GET` | read |
| `overseerr.get_settings_radarr_profiles_by_radarr_id` | `GET` | read |
| `overseerr.get_settings_sonarr` | `GET` | read |
| `overseerr.get_settings_tautulli` | `GET` | read |
| `overseerr.get_status` | `GET` | read |
| `overseerr.get_status_appdata` | `GET` | read |
| `overseerr.get_studio_by_studio_id` | `GET` | read |
| `overseerr.get_tv_by_tv_id` | `GET` | read |
| `overseerr.get_tv_ratings_by_tv_id` | `GET` | read |
| `overseerr.get_tv_recommendations_by_tv_id` | `GET` | read |
| `overseerr.get_tv_season_by_season_id_tv_id` | `GET` | read |
| `overseerr.get_tv_similar_by_tv_id` | `GET` | read |
| `overseerr.get_user` | `GET` | read |
| `overseerr.get_user_by_user_id` | `GET` | read |
| `overseerr.get_user_push_subscription_by_endpoint_user_id` | `GET` | read |
| `overseerr.get_user_push_subscriptions_by_user_id` | `GET` | read |
| `overseerr.get_user_quota_by_user_id` | `GET` | read |
| `overseerr.get_user_requests_by_user_id` | `GET` | read |
| `overseerr.get_user_settings_main_by_user_id` | `GET` | read |
| `overseerr.get_user_settings_notifications_by_user_id` | `GET` | read |
| `overseerr.get_user_settings_password_by_user_id` | `GET` | read |
| `overseerr.get_user_settings_permissions_by_user_id` | `GET` | read |
| `overseerr.get_user_watch_data_by_user_id` | `GET` | read |
| `overseerr.get_user_watchlist_by_user_id` | `GET` | read |
| `overseerr.get_watchproviders_movies` | `GET` | read |
| `overseerr.get_watchproviders_regions` | `GET` | read |
| `overseerr.get_watchproviders_tv` | `GET` | read |
| `overseerr.post_auth_local` | `POST` | mutating |
| `overseerr.post_auth_logout` | `POST` | mutating |
| `overseerr.post_auth_plex` | `POST` | mutating |
| `overseerr.post_auth_reset_password` | `POST` | mutating |
| `overseerr.post_auth_reset_password_by_guid` | `POST` | mutating |
| `overseerr.post_issue` | `POST` | mutating |
| `overseerr.post_issue_by_issue_id_status` | `POST` | mutating |
| `overseerr.post_issue_comment_by_issue_id` | `POST` | mutating |
| `overseerr.post_media_by_media_id_status` | `POST` | mutating |
| `overseerr.post_request` | `POST` | mutating |
| `overseerr.post_request_by_request_id_status` | `POST` | mutating |
| `overseerr.post_request_retry_by_request_id` | `POST` | mutating |
| `overseerr.post_settings_cache_flush_by_cache_id` | `POST` | mutating |
| `overseerr.post_settings_discover` | `POST` | mutating |
| `overseerr.post_settings_discover_add` | `POST` | mutating |
| `overseerr.post_settings_initialize` | `POST` | mutating |
| `overseerr.post_settings_jobs_cancel_by_job_id` | `POST` | destructive (elicited) |
| `overseerr.post_settings_jobs_run_by_job_id` | `POST` | destructive (elicited) |
| `overseerr.post_settings_jobs_schedule_by_job_id` | `POST` | destructive (elicited) |
| `overseerr.post_settings_main` | `POST` | mutating |
| `overseerr.post_settings_main_regenerate` | `POST` | mutating |
| `overseerr.post_settings_notifications_discord` | `POST` | mutating |
| `overseerr.post_settings_notifications_discord_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_email` | `POST` | mutating |
| `overseerr.post_settings_notifications_email_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_gotify` | `POST` | mutating |
| `overseerr.post_settings_notifications_gotify_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_lunasea` | `POST` | mutating |
| `overseerr.post_settings_notifications_lunasea_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_pushbullet` | `POST` | mutating |
| `overseerr.post_settings_notifications_pushbullet_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_pushover` | `POST` | mutating |
| `overseerr.post_settings_notifications_pushover_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_slack` | `POST` | mutating |
| `overseerr.post_settings_notifications_slack_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_telegram` | `POST` | mutating |
| `overseerr.post_settings_notifications_telegram_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_webhook` | `POST` | mutating |
| `overseerr.post_settings_notifications_webhook_test` | `POST` | mutating |
| `overseerr.post_settings_notifications_webpush` | `POST` | mutating |
| `overseerr.post_settings_notifications_webpush_test` | `POST` | mutating |
| `overseerr.post_settings_plex` | `POST` | mutating |
| `overseerr.post_settings_plex_sync` | `POST` | destructive (elicited) |
| `overseerr.post_settings_radarr` | `POST` | mutating |
| `overseerr.post_settings_radarr_test` | `POST` | mutating |
| `overseerr.post_settings_sonarr` | `POST` | mutating |
| `overseerr.post_settings_sonarr_test` | `POST` | mutating |
| `overseerr.post_settings_tautulli` | `POST` | mutating |
| `overseerr.post_user` | `POST` | mutating |
| `overseerr.post_user_import_from_plex` | `POST` | mutating |
| `overseerr.post_user_register_push_subscription` | `POST` | mutating |
| `overseerr.post_user_settings_main_by_user_id` | `POST` | mutating |
| `overseerr.post_user_settings_notifications_by_user_id` | `POST` | mutating |
| `overseerr.post_user_settings_password_by_user_id` | `POST` | mutating |
| `overseerr.post_user_settings_permissions_by_user_id` | `POST` | mutating |
| `overseerr.put_issue_comment_by_comment_id` | `PUT` | mutating |
| `overseerr.put_request_by_request_id` | `PUT` | mutating |
| `overseerr.put_settings_discover_by_slider_id` | `PUT` | mutating |
| `overseerr.put_settings_radarr_by_radarr_id` | `PUT` | mutating |
| `overseerr.put_settings_sonarr_by_sonarr_id` | `PUT` | mutating |
| `overseerr.put_user` | `PUT` | mutating |
| `overseerr.put_user_by_user_id` | `PUT` | mutating |
| `plex.add_collection_items` | `PUT` | mutating |
| `plex.add_device` | `POST` | mutating |
| `plex.add_device_to_dvr` | `PUT` | mutating |
| `plex.add_download_queue_items` | `POST` | mutating |
| `plex.add_extras` | `POST` | mutating |
| `plex.add_lineup` | `PUT` | mutating |
| `plex.add_playlist_items` | `PUT` | mutating |
| `plex.add_provider` | `POST` | mutating |
| `plex.add_section` | `POST` | destructive (elicited) |
| `plex.add_subtitles` | `GET` | mutating |
| `plex.add_to_play_queue` | `PUT` | mutating |
| `plex.analyze_metadata` | `PUT` | mutating |
| `plex.apply_updates` | `PUT` | mutating |
| `plex.autocomplete` | `GET` | read |
| `plex.cancel_activity` | `DELETE` | destructive (elicited) |
| `plex.cancel_grab` | `DELETE` | destructive (elicited) |
| `plex.cancel_refresh` | `DELETE` | destructive (elicited) |
| `plex.check_updates` | `PUT` | mutating |
| `plex.clean_bundles` | `PUT` | destructive (elicited) |
| `plex.clear_play_queue` | `DELETE` | destructive (elicited) |
| `plex.clear_playlist_items` | `DELETE` | destructive (elicited) |
| `plex.compute_channel_map` | `GET` | read |
| `plex.connect_web_socket` | `GET` | read |
| `plex.create_collection` | `POST` | mutating |
| `plex.create_custom_hub` | `POST` | mutating |
| `plex.create_download_queue` | `POST` | mutating |
| `plex.create_dvr` | `POST` | mutating |
| `plex.create_marker` | `POST` | mutating |
| `plex.create_play_queue` | `POST` | mutating |
| `plex.create_playlist` | `POST` | mutating |
| `plex.create_subscription` | `POST` | mutating |
| `plex.delete_caches` | `DELETE` | destructive (elicited) |
| `plex.delete_collection` | `DELETE` | destructive (elicited) |
| `plex.delete_collection_item` | `PUT` | mutating |
| `plex.delete_custom_hub` | `DELETE` | destructive (elicited) |
| `plex.delete_dvr` | `DELETE` | destructive (elicited) |
| `plex.delete_history` | `DELETE` | destructive (elicited) |
| `plex.delete_indexes` | `DELETE` | destructive (elicited) |
| `plex.delete_intros` | `DELETE` | destructive (elicited) |
| `plex.delete_library_section` | `DELETE` | destructive (elicited) |
| `plex.delete_lineup` | `DELETE` | destructive (elicited) |
| `plex.delete_marker` | `DELETE` | destructive (elicited) |
| `plex.delete_media_item` | `DELETE` | destructive (elicited) |
| `plex.delete_media_provider` | `DELETE` | destructive (elicited) |
| `plex.delete_metadata_item` | `DELETE` | destructive (elicited) |
| `plex.delete_play_queue_item` | `DELETE` | destructive (elicited) |
| `plex.delete_playlist` | `DELETE` | destructive (elicited) |
| `plex.delete_playlist_item` | `DELETE` | destructive (elicited) |
| `plex.delete_stream` | `DELETE` | destructive (elicited) |
| `plex.delete_subscription` | `DELETE` | destructive (elicited) |
| `plex.detect_ads` | `PUT` | mutating |
| `plex.detect_credits` | `PUT` | mutating |
| `plex.detect_intros` | `PUT` | mutating |
| `plex.detect_voice_activity` | `PUT` | mutating |
| `plex.discover_devices` | `POST` | mutating |
| `plex.edit_marker` | `PUT` | mutating |
| `plex.edit_metadata_item` | `PUT` | destructive (elicited) |
| `plex.edit_section` | `PUT` | destructive (elicited) |
| `plex.edit_subscription_preferences` | `PUT` | mutating |
| `plex.empty_trash` | `PUT` | destructive (elicited) |
| `plex.enable_papertrail` | `POST` | mutating |
| `plex.generate_thumbs` | `PUT` | mutating |
| `plex.get_albums` | `GET` | read |
| `plex.get_all_hubs` | `GET` | read |
| `plex.get_all_item_leaves` | `GET` | read |
| `plex.get_all_languages` | `GET` | read |
| `plex.get_all_leaves` | `GET` | read |
| `plex.get_all_preferences` | `GET` | read |
| `plex.get_all_subscriptions` | `GET` | read |
| `plex.get_arts` | `GET` | read |
| `plex.get_augmentation_status` | `GET` | read |
| `plex.get_available_grabbers` | `GET` | read |
| `plex.get_available_sorts` | `GET` | read |
| `plex.get_background_tasks` | `GET` | read |
| `plex.get_categories` | `GET` | read |
| `plex.get_channels` | `GET` | read |
| `plex.get_chapter_image` | `GET` | read |
| `plex.get_cluster` | `GET` | read |
| `plex.get_collection_image` | `GET` | read |
| `plex.get_collection_items` | `GET` | read |
| `plex.get_collections` | `GET` | read |
| `plex.get_colors` | `GET` | read |
| `plex.get_common` | `GET` | read |
| `plex.get_continue_watching` | `GET` | read |
| `plex.get_countries` | `GET` | read |
| `plex.get_countries_lineups` | `GET` | read |
| `plex.get_country_regions` | `GET` | read |
| `plex.get_device_details` | `GET` | read |
| `plex.get_devices_channels` | `GET` | read |
| `plex.get_download_queue` | `GET` | read |
| `plex.get_download_queue_items` | `GET` | read |
| `plex.get_download_queue_media` | `GET` | read |
| `plex.get_dvr` | `GET` | read |
| `plex.get_extras` | `GET` | read |
| `plex.get_file` | `GET` | read |
| `plex.get_first_characters` | `GET` | read |
| `plex.get_folders` | `GET` | read |
| `plex.get_history_item` | `GET` | read |
| `plex.get_hub_items` | `GET` | read |
| `plex.get_identity` | `GET` | read |
| `plex.get_image` | `GET` | read |
| `plex.get_image_from_bif` | `GET` | read |
| `plex.get_item_artwork` | `GET` | read |
| `plex.get_item_decision` | `GET` | read |
| `plex.get_item_tree` | `GET` | read |
| `plex.get_library_details` | `GET` | read |
| `plex.get_library_items` | `GET` | read |
| `plex.get_library_matches` | `GET` | read |
| `plex.get_lineup` | `GET` | read |
| `plex.get_lineup_channels` | `GET` | read |
| `plex.get_live_tv_session` | `GET` | read |
| `plex.get_media_part` | `GET` | read |
| `plex.get_metadata_hubs` | `GET` | read |
| `plex.get_metadata_item` | `GET` | read |
| `plex.get_notifications` | `GET` | read |
| `plex.get_part_index` | `GET` | read |
| `plex.get_person` | `GET` | read |
| `plex.get_play_queue` | `GET` | read |
| `plex.get_playlist` | `GET` | read |
| `plex.get_playlist_generator` | `GET` | read |
| `plex.get_playlist_generator_items` | `GET` | read |
| `plex.get_playlist_generators` | `GET` | read |
| `plex.get_playlist_items` | `GET` | read |
| `plex.get_postplay_hubs` | `GET` | read |
| `plex.get_preference` | `GET` | read |
| `plex.get_promoted_hubs` | `GET` | read |
| `plex.get_random_artwork` | `GET` | read |
| `plex.get_related_hubs` | `GET` | read |
| `plex.get_related_items` | `GET` | read |
| `plex.get_scheduled_recordings` | `GET` | read |
| `plex.get_section_filters` | `GET` | read |
| `plex.get_section_hubs` | `GET` | read |
| `plex.get_section_image` | `GET` | read |
| `plex.get_section_preferences` | `GET` | read |
| `plex.get_sections` | `GET` | read |
| `plex.get_sections_prefs` | `GET` | read |
| `plex.get_server_info` | `GET` | read |
| `plex.get_server_resources` | `GET` | read |
| `plex.get_session_playlist_index` | `GET` | read |
| `plex.get_session_segment` | `GET` | read |
| `plex.get_sessions` | `GET` | read |
| `plex.get_sonic_path` | `GET` | read |
| `plex.get_sonically_similar` | `GET` | read |
| `plex.get_source_connection_information` | `GET` | read |
| `plex.get_stream` | `GET` | read |
| `plex.get_stream_levels` | `GET` | read |
| `plex.get_stream_loudness` | `GET` | read |
| `plex.get_subscription` | `GET` | read |
| `plex.get_tags` | `GET` | read |
| `plex.get_tasks` | `GET` | read |
| `plex.get_template` | `GET` | read |
| `plex.get_thumb` | `GET` | read |
| `plex.get_token_details` | `GET` | read |
| `plex.get_transient_token` | `POST` | mutating |
| `plex.get_updates_status` | `GET` | read |
| `plex.get_users` | `GET` | read |
| `plex.ingest_transient_item` | `POST` | mutating |
| `plex.list_activities` | `GET` | read |
| `plex.list_content` | `GET` | read |
| `plex.list_devices` | `GET` | read |
| `plex.list_download_queue_items` | `GET` | read |
| `plex.list_dv_rs` | `GET` | read |
| `plex.list_hubs` | `GET` | read |
| `plex.list_lineups` | `GET` | read |
| `plex.list_matches` | `PUT` | mutating |
| `plex.list_moments` | `GET` | read |
| `plex.list_person_media` | `GET` | read |
| `plex.list_playback_history` | `GET` | read |
| `plex.list_playlists` | `GET` | read |
| `plex.list_providers` | `GET` | read |
| `plex.list_sessions` | `GET` | read |
| `plex.list_similar` | `GET` | read |
| `plex.list_sonically_similar` | `GET` | read |
| `plex.list_top_users` | `GET` | read |
| `plex.make_decision` | `GET` | read |
| `plex.mark_played` | `PUT` | mutating |
| `plex.match_item` | `PUT` | mutating |
| `plex.merge_items` | `PUT` | mutating |
| `plex.modify_device` | `PUT` | mutating |
| `plex.modify_playlist_generator` | `PUT` | mutating |
| `plex.move_collection_item` | `PUT` | mutating |
| `plex.move_hub` | `PUT` | mutating |
| `plex.move_play_queue_item` | `PUT` | mutating |
| `plex.move_playlist_item` | `PUT` | mutating |
| `plex.optimize_database` | `PUT` | destructive (elicited) |
| `plex.post_users_sign_in_data` | `POST` | mutating |
| `plex.process_subscriptions` | `POST` | mutating |
| `plex.refresh_items_metadata` | `PUT` | mutating |
| `plex.refresh_playlist` | `PUT` | mutating |
| `plex.refresh_providers` | `POST` | mutating |
| `plex.refresh_section` | `POST` | destructive (elicited) |
| `plex.refresh_sections_metadata` | `POST` | destructive (elicited) |
| `plex.reload_guide` | `POST` | mutating |
| `plex.remove_device` | `DELETE` | destructive (elicited) |
| `plex.remove_device_from_dvr` | `DELETE` | destructive (elicited) |
| `plex.remove_download_queue_items` | `DELETE` | destructive (elicited) |
| `plex.reorder_subscription` | `PUT` | mutating |
| `plex.report` | `POST` | mutating |
| `plex.reset_play_queue` | `PUT` | mutating |
| `plex.reset_section_defaults` | `DELETE` | destructive (elicited) |
| `plex.restart_processing_download_queue_items` | `POST` | mutating |
| `plex.scan` | `POST` | destructive (elicited) |
| `plex.search_hubs` | `GET` | read |
| `plex.set_channelmap` | `PUT` | mutating |
| `plex.set_device_preferences` | `PUT` | mutating |
| `plex.set_dvr_preferences` | `PUT` | mutating |
| `plex.set_item_artwork` | `POST` | mutating |
| `plex.set_item_preferences` | `PUT` | mutating |
| `plex.set_preferences` | `PUT` | mutating |
| `plex.set_rating` | `PUT` | mutating |
| `plex.set_section_preferences` | `PUT` | mutating |
| `plex.set_stream_offset` | `PUT` | mutating |
| `plex.set_stream_selection` | `PUT` | mutating |
| `plex.shuffle` | `PUT` | mutating |
| `plex.split_item` | `PUT` | mutating |
| `plex.start_analysis` | `PUT` | mutating |
| `plex.start_bif_generation` | `PUT` | mutating |
| `plex.start_task` | `POST` | mutating |
| `plex.start_tasks` | `POST` | mutating |
| `plex.start_transcode_session` | `GET` | mutating |
| `plex.stop_all_refreshes` | `DELETE` | destructive (elicited) |
| `plex.stop_dvr_reload` | `DELETE` | destructive (elicited) |
| `plex.stop_scan` | `DELETE` | destructive (elicited) |
| `plex.stop_task` | `DELETE` | destructive (elicited) |
| `plex.stop_tasks` | `DELETE` | destructive (elicited) |
| `plex.terminate_session` | `POST` | destructive (elicited) |
| `plex.transcode_image` | `GET` | read |
| `plex.transcode_subtitles` | `GET` | read |
| `plex.trigger_fallback` | `POST` | mutating |
| `plex.tune_channel` | `POST` | mutating |
| `plex.unmatch` | `PUT` | mutating |
| `plex.unscrobble` | `PUT` | mutating |
| `plex.unshuffle` | `PUT` | mutating |
| `plex.update_hub_visibility` | `PUT` | mutating |
| `plex.update_item_artwork` | `PUT` | mutating |
| `plex.update_items` | `PUT` | mutating |
| `plex.update_playlist` | `PUT` | mutating |
| `plex.upload_playlist` | `POST` | mutating |
| `plex.voice_search_hubs` | `GET` | read |
| `plex.write_log` | `POST` | mutating |
| `plex.write_message` | `PUT` | mutating |
| `jellyfin.add_item_to_playlist` | `POST` | mutating |
| `jellyfin.add_listing_provider` | `POST` | mutating |
| `jellyfin.add_media_path` | `POST` | mutating |
| `jellyfin.add_to_collection` | `POST` | mutating |
| `jellyfin.add_tuner_host` | `POST` | mutating |
| `jellyfin.add_user_to_session` | `POST` | mutating |
| `jellyfin.add_virtual_folder` | `POST` | mutating |
| `jellyfin.apply_search_criteria` | `POST` | mutating |
| `jellyfin.authenticate_user_by_name` | `POST` | mutating |
| `jellyfin.authenticate_with_quick_connect` | `POST` | mutating |
| `jellyfin.authorize_quick_connect` | `POST` | mutating |
| `jellyfin.cancel_package_installation` | `DELETE` | destructive (elicited) |
| `jellyfin.cancel_series_timer` | `DELETE` | destructive (elicited) |
| `jellyfin.cancel_timer` | `DELETE` | destructive (elicited) |
| `jellyfin.close_live_stream` | `POST` | mutating |
| `jellyfin.complete_wizard` | `POST` | mutating |
| `jellyfin.create_backup` | `POST` | mutating |
| `jellyfin.create_collection` | `POST` | mutating |
| `jellyfin.create_key` | `POST` | mutating |
| `jellyfin.create_playlist` | `POST` | mutating |
| `jellyfin.create_series_timer` | `POST` | mutating |
| `jellyfin.create_timer` | `POST` | mutating |
| `jellyfin.create_user_by_name` | `POST` | mutating |
| `jellyfin.delete_alternate_sources` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_custom_splashscreen` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_device` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_item` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_item_image` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_item_image_by_index` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_items` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_listing_provider` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_lyrics` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_recording` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_subtitle` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_tuner_host` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_user` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_user_image` | `DELETE` | destructive (elicited) |
| `jellyfin.delete_user_item_rating` | `DELETE` | destructive (elicited) |
| `jellyfin.disable_plugin` | `POST` | mutating |
| `jellyfin.discover_tuners` | `GET` | read |
| `jellyfin.discvover_tuners` | `GET` | read |
| `jellyfin.display_content` | `POST` | mutating |
| `jellyfin.download_remote_image` | `POST` | mutating |
| `jellyfin.download_remote_lyrics` | `POST` | mutating |
| `jellyfin.download_remote_subtitles` | `POST` | mutating |
| `jellyfin.enable_plugin` | `POST` | mutating |
| `jellyfin.forgot_password` | `POST` | mutating |
| `jellyfin.forgot_password_pin` | `POST` | mutating |
| `jellyfin.get_additional_part` | `GET` | read |
| `jellyfin.get_album_artists` | `GET` | read |
| `jellyfin.get_all_channel_features` | `GET` | read |
| `jellyfin.get_ancestors` | `GET` | read |
| `jellyfin.get_artist_by_name` | `GET` | read |
| `jellyfin.get_artist_image` | `GET` | read |
| `jellyfin.get_artists` | `GET` | read |
| `jellyfin.get_attachment` | `GET` | read |
| `jellyfin.get_audio_stream` | `GET` | read |
| `jellyfin.get_audio_stream_by_container` | `GET` | read |
| `jellyfin.get_auth_providers` | `GET` | read |
| `jellyfin.get_backup` | `GET` | read |
| `jellyfin.get_bitrate_test_bytes` | `GET` | read |
| `jellyfin.get_book_remote_search_results` | `POST` | mutating |
| `jellyfin.get_box_set_remote_search_results` | `POST` | mutating |
| `jellyfin.get_branding_css` | `GET` | read |
| `jellyfin.get_branding_css_2` | `GET` | read |
| `jellyfin.get_branding_options` | `GET` | read |
| `jellyfin.get_channel` | `GET` | read |
| `jellyfin.get_channel_features` | `GET` | read |
| `jellyfin.get_channel_items` | `GET` | read |
| `jellyfin.get_channel_mapping_options` | `GET` | read |
| `jellyfin.get_channels` | `GET` | read |
| `jellyfin.get_configuration` | `GET` | read |
| `jellyfin.get_configuration_pages` | `GET` | read |
| `jellyfin.get_countries` | `GET` | read |
| `jellyfin.get_cultures` | `GET` | read |
| `jellyfin.get_current_user` | `GET` | read |
| `jellyfin.get_dashboard_configuration_page` | `GET` | read |
| `jellyfin.get_default_directory_browser` | `GET` | read |
| `jellyfin.get_default_listing_provider` | `GET` | read |
| `jellyfin.get_default_metadata_options` | `GET` | read |
| `jellyfin.get_default_timer` | `GET` | read |
| `jellyfin.get_device_info` | `GET` | read |
| `jellyfin.get_device_options` | `GET` | read |
| `jellyfin.get_devices` | `GET` | read |
| `jellyfin.get_directory_contents` | `GET` | read |
| `jellyfin.get_display_preferences` | `GET` | read |
| `jellyfin.get_download` | `GET` | read |
| `jellyfin.get_drives` | `GET` | read |
| `jellyfin.get_endpoint_info` | `GET` | read |
| `jellyfin.get_episodes` | `GET` | read |
| `jellyfin.get_external_id_infos` | `GET` | read |
| `jellyfin.get_fallback_font` | `GET` | read |
| `jellyfin.get_fallback_font_list` | `GET` | read |
| `jellyfin.get_file` | `GET` | read |
| `jellyfin.get_first_user` | `GET` | read |
| `jellyfin.get_first_user_2` | `GET` | read |
| `jellyfin.get_genre` | `GET` | read |
| `jellyfin.get_genre_image` | `GET` | read |
| `jellyfin.get_genre_image_by_index` | `GET` | read |
| `jellyfin.get_genres` | `GET` | read |
| `jellyfin.get_grouping_options` | `GET` | read |
| `jellyfin.get_guide_info` | `GET` | read |
| `jellyfin.get_instant_mix_from_album` | `GET` | read |
| `jellyfin.get_instant_mix_from_artists` | `GET` | read |
| `jellyfin.get_instant_mix_from_item` | `GET` | read |
| `jellyfin.get_instant_mix_from_music_genre_by_id` | `GET` | read |
| `jellyfin.get_instant_mix_from_music_genre_by_name` | `GET` | read |
| `jellyfin.get_instant_mix_from_playlist` | `GET` | read |
| `jellyfin.get_instant_mix_from_song` | `GET` | read |
| `jellyfin.get_intros` | `GET` | read |
| `jellyfin.get_item` | `GET` | read |
| `jellyfin.get_item_collections` | `GET` | read |
| `jellyfin.get_item_counts` | `GET` | read |
| `jellyfin.get_item_image` | `GET` | read |
| `jellyfin.get_item_image2` | `GET` | read |
| `jellyfin.get_item_image_by_index` | `GET` | read |
| `jellyfin.get_item_image_infos` | `GET` | read |
| `jellyfin.get_item_segments` | `GET` | read |
| `jellyfin.get_item_user_data` | `GET` | read |
| `jellyfin.get_items` | `GET` | read |
| `jellyfin.get_keys` | `GET` | read |
| `jellyfin.get_latest_channel_items` | `GET` | read |
| `jellyfin.get_latest_media` | `GET` | read |
| `jellyfin.get_library_options_info` | `GET` | read |
| `jellyfin.get_lineups` | `GET` | read |
| `jellyfin.get_live_recording_file` | `GET` | read |
| `jellyfin.get_live_stream_file` | `GET` | read |
| `jellyfin.get_live_tv_channels` | `GET` | read |
| `jellyfin.get_live_tv_info` | `GET` | read |
| `jellyfin.get_live_tv_programs` | `GET` | read |
| `jellyfin.get_local_trailers` | `GET` | read |
| `jellyfin.get_localization_options` | `GET` | read |
| `jellyfin.get_log_entries` | `GET` | read |
| `jellyfin.get_log_file` | `GET` | read |
| `jellyfin.get_lyrics` | `GET` | read |
| `jellyfin.get_media_folders` | `GET` | read |
| `jellyfin.get_metadata_editor_info` | `GET` | read |
| `jellyfin.get_movie_recommendations` | `GET` | read |
| `jellyfin.get_movie_remote_search_results` | `POST` | mutating |
| `jellyfin.get_music_album_remote_search_results` | `POST` | mutating |
| `jellyfin.get_music_artist_remote_search_results` | `POST` | mutating |
| `jellyfin.get_music_genre` | `GET` | read |
| `jellyfin.get_music_genre_image` | `GET` | read |
| `jellyfin.get_music_genre_image_by_index` | `GET` | read |
| `jellyfin.get_music_video_remote_search_results` | `POST` | mutating |
| `jellyfin.get_named_configuration` | `GET` | read |
| `jellyfin.get_next_up` | `GET` | read |
| `jellyfin.get_package_info` | `GET` | read |
| `jellyfin.get_packages` | `GET` | read |
| `jellyfin.get_parent_path` | `GET` | read |
| `jellyfin.get_parental_ratings` | `GET` | read |
| `jellyfin.get_password_reset_providers` | `GET` | read |
| `jellyfin.get_person` | `GET` | read |
| `jellyfin.get_person_image` | `GET` | read |
| `jellyfin.get_person_image_by_index` | `GET` | read |
| `jellyfin.get_person_remote_search_results` | `POST` | mutating |
| `jellyfin.get_persons` | `GET` | read |
| `jellyfin.get_physical_paths` | `GET` | read |
| `jellyfin.get_ping_system` | `GET` | read |
| `jellyfin.get_playback_info` | `GET` | read |
| `jellyfin.get_playlist` | `GET` | read |
| `jellyfin.get_playlist_items` | `GET` | read |
| `jellyfin.get_playlist_user` | `GET` | read |
| `jellyfin.get_playlist_users` | `GET` | read |
| `jellyfin.get_plugin_configuration` | `GET` | read |
| `jellyfin.get_plugin_image` | `GET` | read |
| `jellyfin.get_plugin_manifest` | `POST` | mutating |
| `jellyfin.get_plugins` | `GET` | read |
| `jellyfin.get_posted_playback_info` | `POST` | mutating |
| `jellyfin.get_program` | `GET` | read |
| `jellyfin.get_programs` | `POST` | mutating |
| `jellyfin.get_public_system_info` | `GET` | read |
| `jellyfin.get_public_users` | `GET` | read |
| `jellyfin.get_query_filters` | `GET` | read |
| `jellyfin.get_query_filters_legacy` | `GET` | read |
| `jellyfin.get_quick_connect_enabled` | `GET` | read |
| `jellyfin.get_quick_connect_state` | `GET` | read |
| `jellyfin.get_recommended_programs` | `GET` | read |
| `jellyfin.get_recording` | `GET` | read |
| `jellyfin.get_recording_folders` | `GET` | read |
| `jellyfin.get_recordings` | `GET` | read |
| `jellyfin.get_remote_image_providers` | `GET` | read |
| `jellyfin.get_remote_images` | `GET` | read |
| `jellyfin.get_remote_lyrics` | `GET` | read |
| `jellyfin.get_remote_subtitles` | `GET` | read |
| `jellyfin.get_repositories` | `GET` | read |
| `jellyfin.get_resume_items` | `GET` | read |
| `jellyfin.get_root_folder` | `GET` | read |
| `jellyfin.get_schedules_direct_countries` | `GET` | read |
| `jellyfin.get_search_hints` | `GET` | read |
| `jellyfin.get_seasons` | `GET` | read |
| `jellyfin.get_series_remote_search_results` | `POST` | mutating |
| `jellyfin.get_series_timer` | `GET` | read |
| `jellyfin.get_series_timers` | `GET` | read |
| `jellyfin.get_server_logs` | `GET` | read |
| `jellyfin.get_sessions` | `GET` | read |
| `jellyfin.get_similar_albums` | `GET` | read |
| `jellyfin.get_similar_artists` | `GET` | read |
| `jellyfin.get_similar_items` | `GET` | read |
| `jellyfin.get_similar_movies` | `GET` | read |
| `jellyfin.get_similar_shows` | `GET` | read |
| `jellyfin.get_similar_trailers` | `GET` | read |
| `jellyfin.get_special_features` | `GET` | read |
| `jellyfin.get_splashscreen` | `GET` | read |
| `jellyfin.get_startup_configuration` | `GET` | read |
| `jellyfin.get_studio` | `GET` | read |
| `jellyfin.get_studio_image` | `GET` | read |
| `jellyfin.get_studio_image_by_index` | `GET` | read |
| `jellyfin.get_studios` | `GET` | read |
| `jellyfin.get_subtitle` | `GET` | read |
| `jellyfin.get_subtitle_playlist` | `GET` | read |
| `jellyfin.get_subtitle_with_ticks` | `GET` | read |
| `jellyfin.get_suggestions` | `GET` | read |
| `jellyfin.get_system_info` | `GET` | read |
| `jellyfin.get_system_storage` | `GET` | read |
| `jellyfin.get_task` | `GET` | read |
| `jellyfin.get_tasks` | `GET` | read |
| `jellyfin.get_theme_media` | `GET` | read |
| `jellyfin.get_theme_songs` | `GET` | read |
| `jellyfin.get_theme_videos` | `GET` | read |
| `jellyfin.get_timer` | `GET` | read |
| `jellyfin.get_timers` | `GET` | read |
| `jellyfin.get_trailer_remote_search_results` | `POST` | mutating |
| `jellyfin.get_trailers` | `GET` | read |
| `jellyfin.get_trickplay_hls_playlist` | `GET` | read |
| `jellyfin.get_trickplay_tile_image` | `GET` | read |
| `jellyfin.get_tuner_host_types` | `GET` | read |
| `jellyfin.get_universal_audio_stream` | `GET` | read |
| `jellyfin.get_upcoming_episodes` | `GET` | read |
| `jellyfin.get_user_by_id` | `GET` | read |
| `jellyfin.get_user_image` | `GET` | read |
| `jellyfin.get_user_views` | `GET` | read |
| `jellyfin.get_users` | `GET` | read |
| `jellyfin.get_utc_time` | `GET` | read |
| `jellyfin.get_video_stream` | `GET` | read |
| `jellyfin.get_video_stream_by_container` | `GET` | read |
| `jellyfin.get_virtual_folders` | `GET` | read |
| `jellyfin.get_year` | `GET` | read |
| `jellyfin.get_years` | `GET` | read |
| `jellyfin.initiate_quick_connect` | `POST` | mutating |
| `jellyfin.install_package` | `POST` | mutating |
| `jellyfin.list_backups` | `GET` | read |
| `jellyfin.log_file` | `POST` | mutating |
| `jellyfin.mark_favorite_item` | `POST` | mutating |
| `jellyfin.mark_played_item` | `POST` | mutating |
| `jellyfin.mark_unplayed_item` | `DELETE` | destructive (elicited) |
| `jellyfin.merge_versions` | `POST` | mutating |
| `jellyfin.move_item` | `POST` | mutating |
| `jellyfin.open_live_stream` | `POST` | mutating |
| `jellyfin.ping_playback_session` | `POST` | mutating |
| `jellyfin.play` | `POST` | mutating |
| `jellyfin.post_added_movies` | `POST` | mutating |
| `jellyfin.post_added_series` | `POST` | mutating |
| `jellyfin.post_capabilities` | `POST` | mutating |
| `jellyfin.post_full_capabilities` | `POST` | mutating |
| `jellyfin.post_ping_system` | `POST` | mutating |
| `jellyfin.post_updated_media` | `POST` | mutating |
| `jellyfin.post_updated_movies` | `POST` | mutating |
| `jellyfin.post_updated_series` | `POST` | mutating |
| `jellyfin.post_user_image` | `POST` | mutating |
| `jellyfin.refresh_item` | `POST` | mutating |
| `jellyfin.refresh_library` | `POST` | destructive (elicited) |
| `jellyfin.remove_from_collection` | `DELETE` | destructive (elicited) |
| `jellyfin.remove_item_from_playlist` | `DELETE` | destructive (elicited) |
| `jellyfin.remove_media_path` | `DELETE` | destructive (elicited) |
| `jellyfin.remove_user_from_playlist` | `DELETE` | destructive (elicited) |
| `jellyfin.remove_user_from_session` | `DELETE` | destructive (elicited) |
| `jellyfin.remove_virtual_folder` | `DELETE` | destructive (elicited) |
| `jellyfin.rename_virtual_folder` | `POST` | mutating |
| `jellyfin.report_playback_progress` | `POST` | mutating |
| `jellyfin.report_playback_start` | `POST` | mutating |
| `jellyfin.report_playback_stopped` | `POST` | mutating |
| `jellyfin.report_session_ended` | `POST` | mutating |
| `jellyfin.report_viewing` | `POST` | mutating |
| `jellyfin.reset_tuner` | `POST` | mutating |
| `jellyfin.restart_application` | `POST` | destructive (elicited) |
| `jellyfin.revoke_key` | `DELETE` | destructive (elicited) |
| `jellyfin.search_remote_lyrics` | `GET` | read |
| `jellyfin.search_remote_subtitles` | `GET` | read |
| `jellyfin.send_full_general_command` | `POST` | destructive (elicited) |
| `jellyfin.send_general_command` | `POST` | destructive (elicited) |
| `jellyfin.send_message_command` | `POST` | mutating |
| `jellyfin.send_playstate_command` | `POST` | destructive (elicited) |
| `jellyfin.send_system_command` | `POST` | destructive (elicited) |
| `jellyfin.set_channel_mapping` | `POST` | mutating |
| `jellyfin.set_item_image` | `POST` | mutating |
| `jellyfin.set_item_image_by_index` | `POST` | mutating |
| `jellyfin.set_remote_access` | `POST` | mutating |
| `jellyfin.set_repositories` | `POST` | mutating |
| `jellyfin.shutdown_application` | `POST` | destructive (elicited) |
| `jellyfin.start_restore_backup` | `POST` | destructive (elicited) |
| `jellyfin.start_task` | `POST` | destructive (elicited) |
| `jellyfin.stop_task` | `DELETE` | destructive (elicited) |
| `jellyfin.sync_play_buffering` | `POST` | mutating |
| `jellyfin.sync_play_create_group` | `POST` | mutating |
| `jellyfin.sync_play_get_group` | `GET` | read |
| `jellyfin.sync_play_get_groups` | `GET` | read |
| `jellyfin.sync_play_join_group` | `POST` | mutating |
| `jellyfin.sync_play_leave_group` | `POST` | mutating |
| `jellyfin.sync_play_move_playlist_item` | `POST` | mutating |
| `jellyfin.sync_play_next_item` | `POST` | mutating |
| `jellyfin.sync_play_pause` | `POST` | mutating |
| `jellyfin.sync_play_ping` | `POST` | mutating |
| `jellyfin.sync_play_previous_item` | `POST` | mutating |
| `jellyfin.sync_play_queue` | `POST` | mutating |
| `jellyfin.sync_play_ready` | `POST` | mutating |
| `jellyfin.sync_play_remove_from_playlist` | `POST` | mutating |
| `jellyfin.sync_play_seek` | `POST` | mutating |
| `jellyfin.sync_play_set_ignore_wait` | `POST` | mutating |
| `jellyfin.sync_play_set_new_queue` | `POST` | mutating |
| `jellyfin.sync_play_set_playlist_item` | `POST` | mutating |
| `jellyfin.sync_play_set_repeat_mode` | `POST` | mutating |
| `jellyfin.sync_play_set_shuffle_mode` | `POST` | mutating |
| `jellyfin.sync_play_stop` | `POST` | destructive (elicited) |
| `jellyfin.sync_play_unpause` | `POST` | mutating |
| `jellyfin.uninstall_plugin` | `DELETE` | destructive (elicited) |
| `jellyfin.uninstall_plugin_by_version` | `DELETE` | destructive (elicited) |
| `jellyfin.unmark_favorite_item` | `DELETE` | destructive (elicited) |
| `jellyfin.update_branding_configuration` | `POST` | mutating |
| `jellyfin.update_configuration` | `POST` | mutating |
| `jellyfin.update_device_options` | `POST` | mutating |
| `jellyfin.update_display_preferences` | `POST` | mutating |
| `jellyfin.update_initial_configuration` | `POST` | mutating |
| `jellyfin.update_item` | `POST` | mutating |
| `jellyfin.update_item_content_type` | `POST` | mutating |
| `jellyfin.update_item_image_index` | `POST` | mutating |
| `jellyfin.update_item_user_data` | `POST` | mutating |
| `jellyfin.update_library_options` | `POST` | mutating |
| `jellyfin.update_media_path` | `POST` | mutating |
| `jellyfin.update_named_configuration` | `POST` | mutating |
| `jellyfin.update_playlist` | `POST` | mutating |
| `jellyfin.update_playlist_user` | `POST` | mutating |
| `jellyfin.update_plugin_configuration` | `POST` | mutating |
| `jellyfin.update_series_timer` | `POST` | mutating |
| `jellyfin.update_startup_user` | `POST` | mutating |
| `jellyfin.update_task` | `POST` | mutating |
| `jellyfin.update_timer` | `POST` | mutating |
| `jellyfin.update_user` | `POST` | mutating |
| `jellyfin.update_user_configuration` | `POST` | mutating |
| `jellyfin.update_user_item_rating` | `POST` | mutating |
| `jellyfin.update_user_password` | `POST` | mutating |
| `jellyfin.update_user_policy` | `POST` | mutating |
| `jellyfin.upload_custom_splashscreen` | `POST` | mutating |
| `jellyfin.upload_lyrics` | `POST` | mutating |
| `jellyfin.upload_subtitle` | `POST` | mutating |
| `jellyfin.validate_path` | `POST` | mutating |


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
