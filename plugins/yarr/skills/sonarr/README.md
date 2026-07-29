# Sonarr Skill

Search and add TV shows to your Sonarr library.

## What It Does

- **Search** — Find TV shows by name via TVDB
- **Add** — Add shows to your Sonarr library with automatic searching
- **Check** — Verify if a show already exists in your library
- **Remove** — Remove shows from your library (with optional file deletion)
- **Configure** — View root folders and quality profiles

All operations use the Sonarr API v3 and support monitor options and search-on-add.

## Setup

### 1. Get Your Sonarr API Key

1. Open your Sonarr web UI
2. Go to **Settings → General**
3. Scroll to **Security** section
4. Copy your **API Key**

### 2. Configure Credentials

Set the following values in the plugin settings. The plugin setup script
writes them to `~/.config/lab-sonarr/config.json`; do not commit or edit real
credentials into this repository.

```bash
SONARR_URL="http://localhost:8989"
SONARR_API_KEY="<your_api_key>"
SONARR_DEFAULT_QUALITY_PROFILE="1"  # Optional: defaults to 1 if not set
```

**Configuration variables:**
- `SONARR_URL`: Sonarr server URL (no trailing slash)
- `SONARR_API_KEY`: Your Sonarr API key
- `SONARR_DEFAULT_QUALITY_PROFILE`: Quality profile ID (optional, run `config` command to see available profiles)

### 3. Test It

```bash
./scripts/sonarr.sh search "Breaking Bad"
```

## Usage Examples

### Search for shows

```bash
./scripts/sonarr.sh search "Breaking Bad"
./scripts/sonarr.sh search "The Office"
```

Returns a numbered list with TVDB IDs and links.

### Check if show exists

Before adding, check if a show is already in your library:

```bash
./scripts/sonarr.sh exists 81189  # Breaking Bad TVDB ID
```

### Add a show

Add a show with automatic searching (default):

```bash
./scripts/sonarr.sh add 81189  # Searches immediately
```

Add without searching (manual search later):

```bash
./scripts/sonarr.sh add 81189 --no-search
```

### Remove a show

Remove but keep downloaded files:

```bash
./scripts/sonarr.sh remove 81189
```

Remove and delete all files:

```bash
./scripts/sonarr.sh remove 81189 --delete-files
```

**Always ask user if they want to delete files when removing!**

### View configuration

Get available root folders and quality profiles:

```bash
./scripts/sonarr.sh config
```

Use this to determine your `SONARR_DEFAULT_QUALITY_PROFILE` ID.

## API Reference

Detailed API documentation is available in the `references/` directory:

- **[API Endpoints](./references/api-endpoints.md)** - Complete endpoint reference
- **[Quick Reference](./references/quick-reference.md)** - Common operations with copy-paste ready examples
- **[Troubleshooting](./references/troubleshooting.md)** - Authentication, connection, and common error solutions

## Workflow

When a user asks to add a TV show:

1. **Search**: `./scripts/sonarr.sh search "Show Name"`
2. **Present results**: Always include TVDB IDs and links in format `[Title (Year)](https://thetvdb.com/dereferrer/series/TVDB_ID)`
3. **User picks**: User selects a number from the search results
4. **Check**: Run `exists <tvdbId>` to verify it's not already added
5. **Add**: Run `add <tvdbId>` to add the show and start searching

## Troubleshooting

**"Sonarr not configured"**
→ Check the plugin settings and confirm `~/.config/lab-sonarr/config.json` was generated with `SONARR_URL` and `SONARR_API_KEY`

**"Connection refused"**
→ Verify your Sonarr server URL is correct and Sonarr is running

**401 Unauthorized**
→ Your API key is invalid — check Settings → General → Security

**"Quality profile not found"**
→ Run `./scripts/sonarr.sh config` to see available profile IDs

## Notes

- Uses Sonarr API v3
- Credentials loaded from `~/.config/lab-sonarr/config.json` (JSON config is parsed, never sourced)
- Default quality profile can be overridden per-add if needed
- Search results include TVDB IDs for reliable identification
- Supports all Sonarr monitor options (future, all, none, etc.)
- Requires `curl` and `jq` installed

## License

MIT
