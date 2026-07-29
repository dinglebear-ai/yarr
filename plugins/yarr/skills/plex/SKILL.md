---
name: plex
description: This skill should be used when the user wants to interact with their Plex Media Server. Triggers include: "check Plex", "search Plex", "what's on Plex", "what's playing on Plex", "who's watching", "Plex sessions", "active streams", "Plex library", "browse movies", "browse TV shows", "recently added", "on deck", "continue watching", "Plex status", or any mention of Plex Media Server. Only use this if the yarr MCP server is unavailable — prefer the consolidated `yarr` skill when it's configured and reachable.
---

# Plex Media Server Skill

Control and query Plex Media Server using the Plex API. Browse libraries, search media, and monitor active sessions.

## Purpose

This skill primarily provides **read-only** access to your Plex Media Server:
- Browse library sections (Movies, TV, Music, Photos)
- Search for specific media
- View recently added content
- Check what's currently playing (active sessions)
- View "On Deck" (continue watching)
- List available clients/players

Most operations are **GET-only** and safe for monitoring/browsing. The `refresh` helper triggers a library scan; treat it as admin-only and get explicit confirmation before running it.

## Setup

Credentials are configured in the **plugin settings** (userConfig). The plugin setup script writes them to `~/.config/lab-plex/config.json`, which the scripts parse automatically — no manual file editing. Variables used:

```bash
# Plex Media Server
PLEX_URL="http://192.168.1.100:32400"
PLEX_TOKEN="<your_plex_token>"
```

- `PLEX_URL`: Your Plex server URL with port (default: 32400)
- `PLEX_TOKEN`: Your Plex authentication token

**Getting your Plex token:**
1. Go to plex.tv → Account → Authorized Devices
2. Click on any device, then "View XML"
3. Find `X-Plex-Token` in the URL
4. Or: Open any media in Plex Web, click "Get Info" → "View XML" and find token in URL

## Commands

All commands output JSON. Use `jq` for formatting or filtering.

The `plex-api.sh` helper script simplifies API access. Located at: `scripts/plex-api.sh`

### Server Info

```bash
# Using helper script
./scripts/plex-api.sh info

# Or raw curl
curl -s "$PLEX_URL/" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### Browse Libraries

List all library sections:

```bash
# Using helper script
./scripts/plex-api.sh libraries

# Or raw curl
curl -s "$PLEX_URL/library/sections" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### List Library Contents

```bash
# Using helper script (replace 1 with your section key)
./scripts/plex-api.sh library 1
./scripts/plex-api.sh library 1 --limit 50 --offset 100

# Or raw curl
curl -s "$PLEX_URL/library/sections/1/all" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### Search Media

```bash
# Using helper script
./scripts/plex-api.sh search "Inception"
./scripts/plex-api.sh search "Avengers" --limit 10

# Or raw curl
curl -s "$PLEX_URL/search?query=SEARCH_TERM" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### Recently Added

```bash
# Using helper script (default: 20 items)
./scripts/plex-api.sh recent
./scripts/plex-api.sh recent --limit 10

# Or raw curl
curl -s "$PLEX_URL/library/recentlyAdded" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### On Deck (Continue Watching)

```bash
# Using helper script (default: 10 items)
./scripts/plex-api.sh ondeck
./scripts/plex-api.sh ondeck --limit 5

# Or raw curl
curl -s "$PLEX_URL/library/onDeck" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### Active Sessions (What's Playing)

```bash
# Using helper script
./scripts/plex-api.sh sessions

# Or raw curl
curl -s "$PLEX_URL/status/sessions" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### List Clients/Players

```bash
# Using helper script
./scripts/plex-api.sh clients

# Or raw curl
curl -s "$PLEX_URL/clients" -H "X-Plex-Token: $PLEX_TOKEN" -H "Accept: application/json"
```

### Additional Commands

```bash
# Server identity
./scripts/plex-api.sh identity

# Get metadata for specific item (by rating key)
./scripts/plex-api.sh metadata 12345

# Get children of item (e.g., seasons of a TV show)
./scripts/plex-api.sh children 12345

# List playlists
./scripts/plex-api.sh playlists

# List user accounts (admin-only; returns account info — read-only)
./scripts/plex-api.sh accounts

# Server preferences (admin-only; returns sensitive server config — read-only)
./scripts/plex-api.sh prefs

# Refresh library section (admin-only scan; confirm first)
./scripts/plex-api.sh refresh 1

# View all commands
./scripts/plex-api.sh --help
```

## Workflow

When the user asks about Plex:

1. **"What's on Plex?"** → Browse libraries and show section overview
2. **"Search for Inception"** → Run search with query
3. **"What was recently added?"** → Run recentlyAdded
4. **"Who's watching right now?"** → Run sessions
5. **"What am I watching?"** → Run onDeck
6. **"List my movies"** → List library sections, then contents of Movies section

### Library Section Types

Common section types (keys vary by server):
- **Movies** — Usually section 1
- **TV Shows** — Usually section 2
- **Music** — Music library
- **Photos** — Photo library

Always list sections first to get the correct section keys for your server.

## Output Format

- Add `-H "Accept: application/json"` for JSON output
- Default output is XML if header not specified
- Media keys look like `/library/metadata/12345`
- Use `jq` to filter and format JSON responses

## Notes

- Requires network access to your Plex server
- Most calls are **read-only GET requests**; library refresh starts a server-side scan and needs explicit confirmation.
- Library section keys (1, 2, 3...) vary by server setup — list sections first
- Playback control is possible but not implemented (safety)
- Always confirm before triggering playback on remote devices
- Token is scoped to your account — keep it secure

## Multiple Servers

To query multiple Plex servers:

```bash
# Server 1
PLEX_URL="http://server1:32400" PLEX_TOKEN="token1" curl ...

# Server 2
PLEX_URL="http://server2:32400" PLEX_TOKEN="token2" curl ...
```

**Note:** these `PLEX_URL=…/PLEX_TOKEN=…` overrides apply to **raw `curl`
only**. The `plex-api.sh` helper always reads the plugin-managed
`~/.config/lab-plex/config.json` and ignores per-invocation env overrides, so to
target a second server with the helper you must point the plugin settings at it
(or call the API with raw `curl` as shown above).

## Reference

- [Plex Media Server API](https://www.plexopedia.com/plex-media-server/api/)
- [Plex Web App](https://app.plex.tv/)

For detailed local reference, see:
- **[API Endpoints](./references/api-endpoints.md)** - Complete endpoint reference with parameters
- **[Quick Reference](./references/quick-reference.md)** - Common operations with copy-paste examples
- **[Troubleshooting](./references/troubleshooting.md)** - Authentication, connection, and error solutions

---
