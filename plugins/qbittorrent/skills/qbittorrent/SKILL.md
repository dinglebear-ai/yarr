---
name: qbittorrent
description: This skill should be used when the user asks about torrents, downloading, seeding, or the qBittorrent client. Triggers include: "what's downloading", "list torrents", "add a torrent", "pause/resume/delete torrent", "torrent speed", "download queue", "qbit", "qBittorrent stats", "check download status", or any mention of managing a torrent client.
---

# qBittorrent WebUI API

Manage torrents via qBittorrent's WebUI API (v4.1+; the helper script maps pause/resume commands to qBittorrent 5.x start/stop endpoints).

## Purpose

This skill provides **read and write** access to your qBittorrent torrent client:
- Monitor active, seeding, and completed torrents
- Add torrents by magnet link, URL, or file upload
- Control torrent state (pause, resume, delete)
- Manage categories and tags
- Adjust global and per-torrent speed limits
- View torrent files, trackers, and properties
- Recheck torrent data integrity

Operations include both read and write actions. **Always confirm before deleting torrents with file deletion.**

## Setup

Credentials are configured in the **plugin settings** (userConfig). The plugin setup script writes them to `~/.config/lab-qbittorrent/config.json`, which the scripts parse automatically — no manual file editing. Variables used:

```bash
QBITTORRENT_URL="http://localhost:8080"
QBITTORRENT_USERNAME="admin"
QBITTORRENT_PASSWORD="<configured-password>"
```

## Quick Reference

### List Torrents

```bash
# All torrents
./scripts/qbit-api.sh list

# Filter by status
./scripts/qbit-api.sh list --filter downloading
./scripts/qbit-api.sh list --filter seeding
./scripts/qbit-api.sh list --filter paused

# Filter by category
./scripts/qbit-api.sh list --category movies
```

Filters: `all`, `downloading`, `seeding`, `completed`, `paused`, `active`, `inactive`, `resumed`, `stalled`, `stalled_uploading`, `stalled_downloading`, `errored`

### Get Torrent Info

```bash
./scripts/qbit-api.sh info <hash>
./scripts/qbit-api.sh files <hash>
./scripts/qbit-api.sh trackers <hash>
```

### Add Torrent

```bash
# By magnet or URL
./scripts/qbit-api.sh add "magnet:?xt=..." --category movies

# By file
./scripts/qbit-api.sh add-file /path/to/file.torrent --paused
```

### Control Torrents

```bash
./scripts/qbit-api.sh pause <hash>         # or "all"
./scripts/qbit-api.sh resume <hash>        # or "all"
./scripts/qbit-api.sh delete <hash>        # keep files
./scripts/qbit-api.sh delete <hash> --files  # delete files too
./scripts/qbit-api.sh recheck <hash>
./scripts/qbit-api.sh reannounce <hash>    # force re-announce to trackers
```

### Categories & Tags

```bash
./scripts/qbit-api.sh categories
./scripts/qbit-api.sh tags
./scripts/qbit-api.sh set-category <hash> movies
./scripts/qbit-api.sh add-tags <hash> "important,archive"
./scripts/qbit-api.sh remove-tags <hash> "archive"
```

### Transfer Info

```bash
./scripts/qbit-api.sh transfer          # global speed/stats
./scripts/qbit-api.sh speedlimit        # current limits
./scripts/qbit-api.sh set-speedlimit --down 5M --up 1M
./scripts/qbit-api.sh toggle-alt-speed  # toggle alternative speed limits
```

### App Info

```bash
./scripts/qbit-api.sh version
./scripts/qbit-api.sh preferences
```

## Response Format

Torrent object includes:
- `hash`, `name`, `state`, `progress`
- `dlspeed`, `upspeed`, `eta`
- `size`, `downloaded`, `uploaded`
- `category`, `tags`, `save_path`

States: `downloading`, `stalledDL`, `uploading`, `stalledUP`, `pausedDL`, `pausedUP`, `queuedDL`, `queuedUP`, `checkingDL`, `checkingUP`, `error`, `missingFiles`

## Workflow

When the user asks about torrents:

1. **"What's downloading?"** → Run `list --filter downloading`
2. **"Add this magnet link"** → Run `add "<magnet>"` with appropriate category
3. **"Pause all torrents"** → Run `pause all`
4. **"Resume seeding"** → Run `resume all` or filter by hash
5. **"Show torrent details"** → Run `info <hash>` and `files <hash>`
6. **"List by category"** → Run `list --category movies`
7. **"Set speed limits"** → Run `set-speedlimit --down 5M --up 1M`

## Notes

- Requires network access to your qBittorrent server
- Uses qBittorrent WebUI API v4.1+; qBittorrent 5.x renamed pause/resume API endpoints to stop/start, and the script handles that compatibility detail.
- All data operations return JSON
- **Delete operations with --files are permanent** - always confirm before deleting downloaded files
- Speed limits support units: K (KB/s), M (MB/s), or raw bytes
- Magnet links and torrent URLs are added without local file upload
- Categories must exist before assignment (create via WebUI or API)

## Local References

- `references/quick-reference.md` — common qBittorrent curl and helper examples
- `references/api-endpoints.md` — WebUI API endpoint catalog
- `references/troubleshooting.md` — login, CSRF, endpoint, and connectivity diagnosis

---
