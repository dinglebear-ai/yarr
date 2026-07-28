---
name: tautulli
description: This skill should be used when the user asks about Plex watch statistics, historical playback data, most-watched content, user activity trends, library stats, stream analytics, or anything related to Tautulli monitoring and analytics — favor this over the `plex` skill for historical/aggregate analysis; use `plex` for live server state (libraries, search, current session details). Triggers include current streams, who is watching Plex, and active sessions too, since Tautulli also tracks those. Only use this if the yarr MCP server is unavailable — prefer the consolidated `yarr` skill when it's configured and reachable.
---

# Tautulli Analytics Skill

Monitor and analyze Plex Media Server usage through Tautulli's comprehensive analytics API. Track current streams, historical playback data, user activity, and library statistics.

## Purpose

This skill provides **read-only** access to Tautulli analytics:
- Monitor current activity and active streams
- View playback history with detailed filtering
- Track user statistics and viewing patterns
- Analyze library statistics and popular content
- View recently added media with metadata
- Monitor concurrent stream limits and bandwidth
- Analyze usage by time, platform, and stream type
- Track server and library performance metrics

All operations are **GET-only** and safe for monitoring and analytics.

**Note:** This skill complements the `plex` skill by adding analytics and historical data that Plex Media Server doesn't expose directly.

## Setup

Credentials are configured in the **plugin settings** (userConfig). The plugin setup script writes them to `~/.config/lab-tautulli/config.json`, which the scripts parse automatically — no manual file editing. Variables used:

```bash
# Tautulli Analytics
TAUTULLI_URL="http://localhost:8181"
TAUTULLI_API_KEY="<your_tautulli_api_key>"
```

- `TAUTULLI_URL`: Your Tautulli server URL with port (default: 8181)
- `TAUTULLI_API_KEY`: Your Tautulli API key

**Getting your API key:**
1. Open Tautulli web UI
2. Go to Settings → Web Interface → API
3. Enable "API enabled"
4. Copy the API key
5. Optionally set API HTTP Basic Authentication if desired

## Commands

All commands use `scripts/tautulli-api.sh` and return JSON. Run any command
with no args (or check `scripts/tautulli-api.sh --help`) for the full flag
list — full copy-paste examples for every command below live in
**[Quick Reference](./references/quick-reference.md)**.

| Command | Returns |
|---|---|
| `server-info` | Server identity and version |
| `activity` | Current streams: user, media, player, bandwidth, transcode info |
| `history [--user] [--section-id] [--media-type] [--days] [--limit] [--search]` | Historical playback data |
| `user-stats [--user] [--sort-by] [--limit] [--days]` | Per-user viewing patterns |
| `libraries` | All library sections |
| `library-stats --section-id <id>` | Stats for one library section |
| `popular [--section-id] [--media-type] [--days] [--limit]` | Most-watched content |
| `recent [--section-id] [--media-type] [--days] [--limit]` | Recently added media |
| `home-stats [--days]` | Homepage dashboard overview |
| `plays-by-stream\|platform\|date\|hour\|day [--days]` | Usage broken down by dimension |
| `concurrent-streams [--days] [--peak]` | Concurrent stream history |
| `metadata --rating-key <key>` or `--guid <guid>` | Detailed media metadata |

`--sort-by` on `user-stats` is passed straight through as Tautulli's
`order_column` — accepted values depend on your Tautulli version (commonly
`plays`, `duration`, `last_seen`).

## Workflow

When the user asks about Plex analytics:

1. **"Who's watching right now?"** → Run `activity`; if a stream shows issues
   (buffering, transcoding), review that user's history for patterns
2. **"What are the most watched movies?"** → Run `popular --media-type movie --days 30`
3. **"Show me recent watch history"** → Run `history --limit 25`
4. **"How much has [user] watched this week?"** → Run `user-stats --user "username" --days 7`
5. **"What's new in my library?"** → Run `recent --limit 10`
6. **"When do people watch most?"** → Run `plays-by-hour --days 30` (or `--days`/`--date`/`--platform` for other dimensions)
7. **"Are we hitting stream limits?"** → Run `concurrent-streams --days 7 --peak`
8. **"Give me an overview"** → Start with `home-stats`, then drill into `library-stats`/`popular`/`user-stats` as needed

## Output Format

All commands return JSON with standard Tautulli response structure:

```json
{
  "response": {
    "result": "success",
    "message": null,
    "data": { ... }
  }
}
```

Use `jq` to extract and format data:

```bash
# Get just the data
./scripts/tautulli-api.sh activity | jq '.response.data'

# Extract specific fields
./scripts/tautulli-api.sh history | jq '.response.data.data[] | {user: .friendly_name, title: .full_title, date: .date}'
```

## Notes

- Requires network access to your Tautulli server
- All operations are **read-only GET requests**
- Tautulli must be connected to your Plex Media Server
- Library section IDs match Plex library section keys
- Historical data depends on Tautulli's configured retention period
- Some statistics require sufficient historical data to be meaningful
- Response times may vary based on database size and query complexity
- Rating keys are Plex's unique identifiers for media items
- User-friendly names are shown by default (can show usernames with flags)

## Integration with Plex Skill

This skill complements the `plex` skill:

- **Plex skill**: Real-time server state (libraries, search, sessions)
- **Tautulli skill**: Historical analytics (trends, statistics, watch history)

Use both together:
1. Find content with `plex` skill search
2. Check popularity with `tautulli` skill analytics
3. Monitor current playback with either skill
4. Analyze viewing patterns with `tautulli` skill

## Multiple Servers

The plugin supports one Tautulli instance configured via plugin settings. To monitor a different Tautulli server, update the URL and API key in the plugin settings.

## Reference

- [Tautulli API Documentation](https://github.com/Tautulli/Tautulli/wiki/Tautulli-API-Reference)
- [Tautulli GitHub](https://github.com/Tautulli/Tautulli)
- [Tautulli Homepage](https://tautulli.com)

For detailed API reference, see:
- **[API Endpoints](./references/api-endpoints.md)** - Complete endpoint reference with parameters
- **[Quick Reference](./references/quick-reference.md)** - Common operations with copy-paste examples
- **[Troubleshooting](./references/troubleshooting.md)** - Authentication, connection, and error solutions

---
