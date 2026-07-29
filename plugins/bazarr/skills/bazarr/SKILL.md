---
name: bazarr
description: This skill should be used when the user wants to manage subtitles in Bazarr. Triggers include: "missing subtitles", "wanted subtitles", "search subtitles", "download subtitles", "subtitle providers", "Bazarr status", "is Bazarr running", "what subtitles are missing", "find subtitles for", or any mention of subtitle management for movies or TV series.
---

# Bazarr Subtitle Management Skill

Inspect and trigger subtitle downloads in Bazarr for your Radarr movies and
Sonarr series via the Bazarr REST API.

## Purpose

- List movies/series with wanted (missing) subtitles
- Trigger a subtitle search for a specific movie or episode
- List configured subtitle providers and their health
- Check Bazarr system status and badges (counts of wanted items)

All operations are read or search/refresh actions. Bazarr itself decides which
subtitle file to download; this skill triggers the search and reports results.

## Setup

Credentials are configured in the **bazarr plugin settings** (userConfig). The
plugin setup script writes them to `~/.config/lab-bazarr/config.json`, which the
script loads automatically — no manual file editing. Variables used:

```bash
BAZARR_URL="http://localhost:6767"
BAZARR_API_KEY="your-api-key"
```

- `BAZARR_URL`: Bazarr base URL (no trailing slash)
- `BAZARR_API_KEY`: API key from Bazarr (Settings -> General -> Security -> API Key), sent as the `X-API-KEY` header

## Commands

Run commands from this skill directory.

### System status / badges

```bash
bash scripts/bazarr-api.sh status      # Bazarr + provider status
bash scripts/bazarr-api.sh badges      # counts of wanted movies/episodes
```

### Wanted (missing) subtitles

```bash
bash scripts/bazarr-api.sh wanted-movies      # movies missing subtitles
bash scripts/bazarr-api.sh wanted-series      # episodes missing subtitles
```

### Providers

```bash
bash scripts/bazarr-api.sh providers          # configured subtitle providers
```

### Trigger a subtitle search

```bash
bash scripts/bazarr-api.sh search-movie <radarrId>      # search subs for a movie
bash scripts/bazarr-api.sh search-episode <sonarrEpisodeId>  # search subs for an episode
```

### Raw GET (escape hatch)

```bash
bash scripts/bazarr-api.sh get "/api/system/status"
```

## Workflow

1. **"What subtitles are missing?"** -> `wanted-movies` and `wanted-series`
2. **"Find subtitles for <movie>"** -> resolve the title to a Radarr id using
   the `radarr` skill (or the `sonarr` skill for episodes), then
   `search-movie <id>` / `search-episode <id>`
3. **"Which providers are configured?"** -> `providers`
4. **"Is Bazarr healthy?" / "is Bazarr running?"** -> `status`

If a documented command 404s, fall back to `get <path>` with a corrected path
from your instance's in-app API browser — see the endpoint-drift caveat in
Notes below.

## Notes

- Requires network access to your Bazarr server.
- Auth header is `X-API-KEY` (not a query string). Never put the key in a URL.
- Bazarr ties items to their Radarr/Sonarr ids; use the radarr/sonarr skills to resolve titles to ids.
- **Endpoint paths and parameters were authored from general knowledge and vary
  across Bazarr versions.** Before relying on the search/write commands, confirm
  the exact paths against your instance's in-app API browser (Settings shows the
  API; some builds expose `/api/swagger`). If a call returns 404, adjust the path
  to match your version. The `search-movie` / `search-episode` ids must be numeric.

## Reference

- **[API Endpoints](./references/api-endpoints.md)** - endpoints used by this skill
- **[Troubleshooting](./references/troubleshooting.md)** - auth and connection issues
