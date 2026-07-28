---
name: overseerr
description: This skill should be used when the user wants to request movies or TV shows via Overseerr, monitor or manage media requests, or check request status. Triggers include: "request a movie", "request a TV show", "add to Overseerr", "check request status", "pending requests", "is my request done", "Overseerr status", "approve a request", "decline a request", "delete a request", or any mention of Overseerr media requesting. Only use this if the yarr MCP server is unavailable — prefer the consolidated `yarr` skill when it's configured and reachable.
---

# Overseerr Media Request Skill

Request movies and TV shows via the Overseerr API. Search, request, and monitor media request status.

## Purpose

This skill enables media request management through Overseerr:
- Search for movies and TV shows
- Request new media (movies, TV series, specific seasons)
- Check request status (pending, processing, available)
- Monitor request progress
- Support for 4K requests

**Note:** This skill targets **Overseerr** (the stable project), not the newer "Seerr" rewrite that is in beta.

## Setup

Credentials are configured in the **plugin settings** (userConfig). The plugin setup script writes them to `~/.config/lab-overseerr/config.json`, which the scripts parse automatically — no manual file editing. Variables used:

```bash
OVERSEERR_URL="http://localhost:5055"
OVERSEERR_API_KEY="your-api-key"
```

- `OVERSEERR_URL`: Your Overseerr server URL (no trailing slash)
- `OVERSEERR_API_KEY`: API key from Overseerr (Settings → General → API Key)

**Get your API key:**
1. Open Overseerr web UI
2. Go to Settings → General
3. Scroll to "API Key" section
4. Copy your API key

## Commands

All commands use Node.js scripts and return JSON output.

### Search

Find movies or TV shows:

```bash
node scripts/search.mjs "the matrix"
node scripts/search.mjs "bluey" --type tv
node scripts/search.mjs "dune" --limit 5
```

**Parameters:**
- `--type movie|tv`: Filter by media type
- `--limit N`: Maximum results to return

### Request Media

Request movies or TV shows:

```bash
# Request a movie
node scripts/search.mjs "Dune" --type movie
node scripts/request.mjs "Dune" --type movie --mediaId 438631

# Request TV show (all seasons by default)
node scripts/search.mjs "Bluey" --type tv
node scripts/request.mjs "Bluey" --type tv --mediaId 82728 --seasons all

# Request specific seasons
node scripts/request.mjs "Severance" --type tv --mediaId 95396 --seasons 1,2

# Request in 4K
node scripts/request.mjs "Oppenheimer" --type movie --mediaId 872585 --is4k
```

**Parameters:**
- `--type movie|tv`: Media type (required)
- `--mediaId N`: Confirmed TMDB media id from search results (required unless `--yes` is used)
- `--yes`: Explicitly accept the first search result after user confirmation
- `--seasons all|1,2,3`: Season selection for TV (default: all)
- `--is4k`: Request 4K version
- `--serverId N` / `--profileId N` / `--rootFolder PATH` / `--languageProfileId N`: override the Sonarr/Radarr server, quality profile, root folder, or language profile
- `--userId N`: request on behalf of another Overseerr user
- `--tvdbId N`: pin the TVDB id for a TV request

### Check Request Status

View pending and processing requests:

```bash
node scripts/requests.mjs --filter pending
node scripts/requests.mjs --filter processing --limit 20
node scripts/request-by-id.mjs 123
```

**Parameters:**
- `--filter all|approved|available|pending|processing|unavailable|failed|deleted|completed`: Filter by status (default: all)
- `--limit N`: Maximum results
- `--skip N`: Offset for pagination
- `--sort added|modified`: Sort order
- `--requestedBy USER_ID`: Only requests made by a given user

### Manage Requests (approve / decline / delete)

```bash
node scripts/approve-request.mjs <requestId>   # approve a pending request
node scripts/decline-request.mjs <requestId>   # decline a pending request
node scripts/delete-request.mjs <requestId>    # DESTRUCTIVE: delete the request record
```

**Parameters:**
- `<requestId>`: numeric request id (from `requests.mjs` / `request-by-id.mjs`)

**`delete-request.mjs` is destructive** — it removes the request record entirely.
Always confirm with the user (and which request id) before running it. `approve`
and `decline` are reversible state changes but still mutate; confirm intent first.

### Get Enriched Request Details

View detailed request information with media metadata:

```bash
node scripts/requests-enriched.mjs --filter pending
```

### Monitor Requests (Polling)

`monitor.mjs` runs an infinite loop — it never exits on its own. Running it
directly in a foreground tool call will hang that turn indefinitely waiting
for output that never naturally completes. Background it with a timeout, or
prefer a single `requests.mjs` call polled manually instead:

```bash
timeout 120 node scripts/monitor.mjs --interval 30 --filter pending
# or, backgrounded:
node scripts/monitor.mjs --interval 30 --filter pending &
```

**Parameters:**
- `--interval N`: Polling interval in seconds (default: 30)
- `--filter`: Status filter

## Workflow

When the user asks about media requests:

1. **"Request Dune"** → Search for "Dune", confirm with user, then request
2. **"Add Bluey to my library"** → Search, request as TV with all seasons
3. **"What's pending?"** → Run `requests.mjs --filter pending`
4. **"Is my Oppenheimer request done?"** → Search requests or use request ID
5. **"Request seasons 1-3 of Severance"** → Request with `--seasons 1,2,3`

### Request Flow

1. Search for the media
2. Present results with TMDB/TVDB links
3. User confirms selection
4. Submit request with the confirmed `--mediaId` (optionally with 4K flag)
5. Check status periodically or wait for notification

### Request Statuses

- **pending**: Awaiting approval
- **processing**: Approved, being fetched by Sonarr/Radarr
- **available**: Downloaded and ready in Plex

## Notes

- Requires network access to your Overseerr server
- Uses `X-Api-Key` header authentication
- Overseerr coordinates with Sonarr/Radarr for actual downloads
- 4K requests require 4K quality profiles configured in Overseerr
- Webhooks can push status updates; polling is the baseline approach

## Multiple Servers

To use multiple Overseerr instances, override environment variables:

```bash
# Use default server (from plugin settings)
node scripts/search.mjs "query"

# Use alternative server (override with environment variables)
OVERSEERR_URL="http://server2:5055" OVERSEERR_API_KEY="key2" node scripts/search.mjs "query"
```

## Reference

- [Overseerr API Documentation](https://api-docs.overseerr.dev/)
- [Overseerr GitHub](https://github.com/sct/overseerr)

## Local References

- `references/quick-reference.md` — curl examples for all common operations
- `references/troubleshooting.md` — error diagnosis and common failure modes
- `references/api-endpoints.md` — full API endpoint catalog
- `references/overseerr-api.yml` — raw OpenAPI source snapshot

---
