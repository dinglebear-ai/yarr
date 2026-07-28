---
name: tracearr
description: This skill should be used when working with Tracearr media-server monitoring for Plex, Jellyfin, or Emby, including active streams, stream analytics, account-sharing detection, trust scores, alerts, Tautulli/Jellystat imports, Docker deployment, plugin configuration, or Tracearr's public API. Only use this if the yarr MCP server is unavailable — prefer the consolidated `yarr` skill when it's configured and reachable.
---

# Tracearr

Use this skill for Tracearr media-server monitoring workflows. Tracearr is part
of the `tracearr` plugin, so prefer the plugin settings and generated config over
ad hoc credential files.

## What Tracearr Is

Tracearr is an open-source, self-hosted monitoring platform for Plex, Jellyfin,
and Emby. It unifies multiple media servers into one dashboard and tracks active
streams, historical playback, geolocation, bandwidth, transcodes, device usage,
library metrics, trust scores, and account-sharing signals.

## Common Tasks

- Use `scripts/tracearr-api.sh` for repeatable Tracearr base/API checks. It
  loads `TRACEARR_URL` from this plugin config or `~/.lab/.env`, sends
  `TRACEARR_API_KEY` as a bearer token when present, and exposes `health`,
  `api-docs`, `get`, `streams`, `servers`, and `alerts`.
- Deploy Tracearr with Docker, TimescaleDB/PostgreSQL, and Redis.
- Connect Plex through Plex sign-in, or connect Jellyfin/Emby with server URL,
  friendly name, and API key.
- Investigate active streams, stream map location patterns, transcodes, device
  health, bandwidth, live TV, and music sessions.
- Review account-sharing detection rules: impossible travel, simultaneous
  locations, device velocity, concurrent streams, geo restrictions, and account
  inactivity.
- Configure alerts through Discord webhooks or custom notifications.
- Import history from Tautulli or Jellystat.
- Use Tracearr's read-only public REST API once an API key is generated in
  settings; Swagger UI is available at `/api-docs`.

## Plugin Configuration

Configure the Tracearr base URL through the `tracearr` plugin setting
`tracearr_url`. The plugin setup script writes configured
values to:

```bash
${XDG_CONFIG_HOME:-$HOME/.config}/lab-tracearr/config.json
```

For shell or curl checks, source that generated file and use `TRACEARR_URL`.
Do not create committed env files, paste API keys into examples, or hardcode
local service URLs in the skill.

If a Tracearr API key is needed, generate it in Tracearr settings and keep it in
a local secret store or runtime-only environment variable until the plugin adds
a dedicated sensitive setting for it. Treat API keys, webhook URLs, user IP
addresses, and account-sharing evidence as sensitive.

## Deployment Notes

- These notes are for deploying the Tracearr application itself, not configuring
  the `tracearr` plugin.
- Required runtime services: TimescaleDB/PostgreSQL and Redis.
- Common Docker tags: `supervised` for all-in-one, `latest` for app with
  external DB/Redis, plus `next` and `nightly` variants.
- Required environment variables include `DATABASE_URL` and `REDIS_URL`.
- Deployment docs generate `JWT_SECRET` and `COOKIE_SECRET` as random
  64-character hexadecimal values.
- Optional environment variables include `PORT`, `NODE_ENV`, `LOG_LEVEL`, `TZ`,
  `CORS_ORIGIN`, `CLAIM_CODE`, `BASE_PATH`, `DNS_CACHE_MAX_TTL`,
  `GZIP_ENABLED`, and `BACKUP_DIR`.

## Fallbacks

This is the bundled fallback copy of the Tracearr skill, for when the `yarr`
MCP server/CLI isn't reachable. When it is, prefer the `yarr` skill instead —
it covers Tracearr both through curated commands (`trace_health`,
`trace_stats`, `trace_streams`, `trace_users`, `trace_violations`,
`trace_history`, and the destructive `trace_terminate_stream`) and the
generic `api.tracearr.get/post` passthrough. Before saying no tool is
available, also search the current tool or gateway catalog for Docker, logs,
or other media-stack tools that can inspect the running service. Confirm
with the user before taking destructive or privacy-sensitive actions, such
as deleting imports, changing alert rules, or exposing account-sharing
details.

## Focused Validation

- Confirm this plugin hook generated `~/.config/lab-tracearr/config.json` when
  plugin settings are present.
- For live checks, source the generated config and verify the base URL or
  `/api-docs` endpoint before assuming Tracearr is reachable.
