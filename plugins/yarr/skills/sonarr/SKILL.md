---
name: sonarr
description: This skill should be used when the user wants to manage TV shows in Sonarr. Triggers include: "add a TV show", "add to Sonarr", "search Sonarr", "find a series", "remove a show", "delete show", "check if show exists", "is [show] in my library", "what's airing this week", "upcoming episodes", "Sonarr library", or any general mention of Sonarr or TV show library management. Only use this if the yarr MCP server is unavailable — prefer the consolidated `yarr` skill when it's configured and reachable.
---

# Sonarr TV Show Management Skill

Search and add TV shows to your Sonarr library with support for monitor options, quality profiles, and search-on-add.

## Purpose

This skill enables management of your Sonarr TV show library:
- Search for TV shows by name
- Add shows to your library with configurable options
- Check if shows already exist
- Remove shows (with optional file deletion)
- View quality profiles and root folders

Operations include both read and write actions.

## Safety

`remove <tvdbId> --delete-files` permanently deletes the show's downloaded
files from disk with no undo. Always confirm the exact show and whether the
user wants files deleted before running it — the script has no confirmation
prompt of its own.

## Setup

Credentials are configured in the **plugin settings** (userConfig). The plugin setup script writes them to `~/.config/lab-sonarr/config.json`, which the scripts parse automatically — no manual file editing. Variables used:

```bash
SONARR_URL="http://localhost:8989"
SONARR_API_KEY="<your_api_key>"
SONARR_DEFAULT_QUALITY_PROFILE="1"  # Optional: defaults to 1 if not set
```

**Configuration variables:**
- `SONARR_URL`: Your Sonarr server URL (no trailing slash)
- `SONARR_API_KEY`: API key from Sonarr (Settings → General → API Key)
- `SONARR_DEFAULT_QUALITY_PROFILE`: Quality profile ID (optional, defaults to 1)

## Commands

The `search-json` command returns raw JSON; all other commands return formatted text.

### Search for Shows

```bash
./scripts/sonarr.sh search "Breaking Bad"
./scripts/sonarr.sh search "The Office"
```

**Output:** Numbered list with TVDB IDs, titles, years, and TVDB links.

### Search for Shows (raw JSON)

```bash
./scripts/sonarr.sh search-json "Breaking Bad"
./scripts/sonarr.sh search-json "The Office"
```

**Output:** Raw JSON search results (includes overview and additional metadata).

### Check if Show Exists

```bash
./scripts/sonarr.sh exists <tvdbId>
```

**Output:** Boolean indicating if show is in library.

### Add a Show

```bash
./scripts/sonarr.sh add <tvdbId>                          # Searches immediately (default)
./scripts/sonarr.sh add <tvdbId> [profileId]              # Use a specific quality profile
./scripts/sonarr.sh add <tvdbId> [profileId] --no-search  # Add without searching
```

**Limitation:** `add` always uses the *first* root folder returned by
Sonarr's API, with no override — on a multi-root-folder instance (e.g.
separate anime/TV folders) this can silently place a show in the wrong
location. If root folder placement matters, verify with `config` first and
warn the user this can't be overridden via the script.

### Remove a Show

```bash
./scripts/sonarr.sh remove <tvdbId>                # Keep files
./scripts/sonarr.sh remove <tvdbId> --delete-files # Delete files too
```

See ## Safety above — confirm file deletion with the user before running this
with `--delete-files`.

### Get Configuration

```bash
./scripts/sonarr.sh config
```

**Output:** Available root folders and quality profiles with their IDs.

### Upcoming Episodes / Calendar

```bash
./scripts/sonarr.sh calendar        # Next 7 days
./scripts/sonarr.sh calendar 14     # Next 14 days
```

**Output:** Air date, show, season/episode, and episode title for each
upcoming episode in the window, sorted chronologically.

## Workflow

When the user asks about TV shows:

1. **"Add Breaking Bad to Sonarr"** → Run `search "Breaking Bad"`, present results with TVDB IDs and links, run `exists <tvdbId>`, then `add <tvdbId>` if absent
2. **"Is The Office in my library?"** → Run `search "The Office"` to identify the TVDB ID, then `exists <tvdbId>`
3. **"Remove Game of Thrones"** → Ask about file deletion, then run `remove <tvdbId>` with appropriate flag
4. **"What quality profiles do I have?"** → Run `config`

### Presenting Search Results

Always include TVDB links when presenting search results:
- Format: `[Title (Year)](https://thetvdb.com/dereferrer/series/TVDB_ID)`
- Show numbered list for user selection
- Include year, TVDB ID, and a brief overview when using `search-json`

### Adding Shows

1. Search for the show
2. Present results with TVDB links
3. User picks a number
4. Add show (searches for episodes by default)

## Parameters

### add command
- `<tvdbId>`: TVDB ID of the show (required)
- `profileId`: Optional quality profile ID (defaults to first available profile)
- `--no-search`: Don't search for episodes after adding

### remove command
- `<tvdbId>`: TVDB ID of the show (required)
- `--delete-files`: Also delete media files (default: keep files)

## Notes

- Requires network access to your Sonarr server
- Uses Sonarr API v3
- Quality profile IDs vary by installation — use `config` to discover yours
- The `SONARR_DEFAULT_QUALITY_PROFILE` from plugin settings (`config.json`) is used when adding shows (defaults to 1)
- `scripts/sonarr.sh` implements the commands above and nothing more. The
  `references/` docs below additionally cover a much larger raw-API surface
  (queue, episode monitoring, manual release search/download, RSS sync,
  history) via direct `curl` calls — those aren't wired into the script and
  should be treated as advanced/unverified starting points, not a guaranteed
  extension of the wrapper's behavior.

## Reference

- [Sonarr API Documentation](https://sonarr.tv/docs/api/)
- [TVDB](https://thetvdb.com/) — TV show database

For detailed local reference, see:
- **[API Endpoints](./references/api-endpoints.md)** - Complete endpoint reference with parameters
- **[Quick Reference](./references/quick-reference.md)** - Common operations with copy-paste examples
- **[Troubleshooting](./references/troubleshooting.md)** - Authentication, connection, and error solutions

---
