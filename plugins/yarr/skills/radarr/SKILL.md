---
name: radarr
description: This skill should be used when the user wants to manage movies in Radarr. Triggers include: "add a movie", "search Radarr", "find a film", "download a movie", "remove a movie", "add movie collection", "check if movie exists", "is [film] in my library", "monitor a film", "check download queue", "Radarr library", or any mention of movie management or TMDB integration. Only use this if the yarr MCP server is unavailable — prefer the consolidated `yarr` skill when it's configured and reachable.
---

# Radarr Movie Management Skill

Search and add movies to your Radarr library with support for collections, quality profiles, and search-on-add.

## Purpose

This skill enables management of your Radarr movie library:
- Search for movies by name
- Add individual movies or entire collections
- Check if movies already exist
- Remove movies (with optional file deletion)
- View quality profiles and root folders

Operations include both read and write actions.

## Safety

`remove <tmdbId> --delete-files` permanently deletes the movie's downloaded
files from disk with no undo. Always confirm the exact movie and whether the
user wants files deleted before running it — the script has no confirmation
prompt of its own.

## Setup

Credentials are configured in the **plugin settings** (userConfig). The plugin setup script writes them to `~/.config/lab-radarr/config.json`, which the scripts parse automatically — no manual file editing. Variables used:

```bash
RADARR_URL="http://localhost:7878"
RADARR_API_KEY="your-api-key"
RADARR_DEFAULT_QUALITY_PROFILE="1"  # Optional (defaults to 1)
```

- `RADARR_URL`: Your Radarr server URL (no trailing slash)
- `RADARR_API_KEY`: API key from Radarr (Settings → General → API Key)
- `RADARR_DEFAULT_QUALITY_PROFILE`: Quality profile ID (optional, run `config` command to see options)

## Commands

Run commands from this skill directory. The helper prints human-readable output for
interactive commands and offers `search-json` when raw lookup JSON is needed.

### Search for Movies

```bash
bash scripts/radarr.sh search "Inception"
bash scripts/radarr.sh search "The Matrix"
```

**Output:** Numbered list with TMDB IDs, titles, years, and overview.

### Search for Movies (raw JSON)

```bash
bash scripts/radarr.sh search-json "Inception"
```

**Output:** Raw Radarr lookup JSON (for scripting / exact field access).

### Check if Movie Exists

```bash
bash scripts/radarr.sh exists <tmdbId>
```

**Output:** Boolean indicating if movie is in library.

### Add a Movie

```bash
bash scripts/radarr.sh add <tmdbId>              # Searches immediately (default)
bash scripts/radarr.sh add <tmdbId> <profileId>  # Use a specific quality profile
bash scripts/radarr.sh add <tmdbId> --no-search  # Add without searching
```

### Add Full Collection

```bash
bash scripts/radarr.sh add-collection <collectionTmdbId> "<search term>"
bash scripts/radarr.sh add-collection <collectionTmdbId> --no-search
```

Adds all movies in a collection (e.g., all Lord of the Rings movies). Provide a
search term when Radarr has not already indexed the collection name.

**Limitation:** without an explicit search term, the script derives one by
stripping a literal trailing `" Collection"` from Radarr's stored collection
title — this works for common names like "The Matrix Collection" but can fail
silently (zero results) for oddly-named collections. If `add-collection`
comes back empty, retry with an explicit search term.

### Remove a Movie

```bash
bash scripts/radarr.sh remove <tmdbId>                # Keep files
bash scripts/radarr.sh remove <tmdbId> --delete-files # Delete files too
```

See ## Safety above — confirm file deletion with the user before running this
with `--delete-files`.

### Get Configuration

```bash
bash scripts/radarr.sh config
```

**Output:** Available root folders and quality profiles with their IDs.

### Check Download Queue

```bash
bash scripts/radarr.sh queue
```

**Output:** Currently downloading/queued movies with status and size remaining.

### Collection Info

```bash
bash scripts/radarr.sh collection-info <collectionTmdbId>
```

**Output:** Radarr's stored details for a TMDB collection (members, monitoring).

## Workflow

When the user asks about movies:

1. **"Add Inception to Radarr"** → Run `search "Inception"`, present results with TMDB links, then `add <tmdbId>`
2. **"Is Dune in my library?"** → Run `exists <tmdbId>`
3. **"Add all Star Wars movies"** → Search for collection, then `add-collection <collectionId>`
4. **"Remove The Matrix"** → Ask about file deletion, then run `remove <tmdbId>` with appropriate flag
5. **"What quality profiles do I have?"** → Run `config`

### Presenting Search Results

Always include TMDB links when presenting search results:
- Format: `[Title (Year)](https://themoviedb.org/movie/ID)`
- Show numbered list for user selection
- Include year and brief overview

### Adding Movies

1. Search for the movie
2. Present results with TMDB links
3. User picks a number
4. **Collection check:** If movie is part of a collection, ask if they want the whole collection
5. Add movie or collection (searches immediately by default)

## Parameters

### add command
- `<tmdbId>`: TMDB ID of the movie (required)
- `<profileId>`: optional Radarr quality profile ID
- `--no-search`: Don't search for movie after adding

### add-collection command
- `<collectionTmdbId>`: TMDB ID of the collection (required)
- `<search term>`: optional movie search term used to discover collection members
- `--no-search`: Don't search for movies after adding

### remove command
- `<tmdbId>`: TMDB ID of the movie (required)
- `--delete-files`: Also delete media files (default: keep files)

## Notes

- Requires network access to your Radarr server
- Uses Radarr API v3
- Use `search-json` or direct API calls from `references/` when JSON output is required
- Quality profile IDs vary by installation — use `config` to discover yours
- The `RADARR_DEFAULT_QUALITY_PROFILE` from config is used when adding movies
- Collections are TMDB-specific and include related movies (sequels, franchises)

## Reference

- [Radarr API Documentation](https://radarr.video/docs/api/)
- [TMDB](https://themoviedb.org/) — The Movie Database

For detailed local reference, see:
- **[API Endpoints](./references/api-endpoints.md)** - Complete endpoint reference with parameters
- **[Quick Reference](./references/quick-reference.md)** - Common operations with copy-paste examples
- **[Troubleshooting](./references/troubleshooting.md)** - Authentication, connection, and error solutions

---
