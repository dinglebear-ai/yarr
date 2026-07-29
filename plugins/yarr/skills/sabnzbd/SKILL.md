---
name: sabnzbd
description: This skill should be used when the user wants to manage Usenet downloads with SABnzbd. Triggers include: "what's downloading", "SABnzbd status", "NZB queue", "add NZB", "pause downloads", "resume downloads", "slow down downloads", "retry failed downloads", "SAB history", "download queue", "is SABnzbd running", or any mention of Usenet download management. Only use this if the yarr MCP server is unavailable — prefer the consolidated `yarr` skill when it's configured and reachable.
---

# SABnzbd API

Manage Usenet downloads via SABnzbd's REST API.

## Purpose

This skill provides **read and write** access to your SABnzbd Usenet downloader:
- Monitor download queue and history
- Add NZB files by URL or upload
- Control downloads (pause, resume, delete)
- Adjust download speed limits
- Manage categories and post-processing scripts
- Retry failed downloads
- View server statistics and warnings

Operations include both read and write actions. **Always confirm before deleting downloads with file deletion.**

## Setup

Credentials are configured in the **plugin settings** (userConfig). The plugin setup script writes them to `~/.config/lab-sabnzbd/config.json`, which the scripts parse automatically — no manual file editing. Variables used:

```bash
SABNZBD_URL="http://localhost:8080"
SABNZBD_API_KEY="your-api-key-from-config-general"
```

Get your API key from SABnzbd Config → General → Security.


## Quick Reference

### Queue Status

```bash
# Full queue
./scripts/sab-api.sh queue

# With filters
./scripts/sab-api.sh queue --limit 10 --category tv

# Specific job
./scripts/sab-api.sh queue --nzo-id SABnzbd_nzo_xxxxx
```

### Add NZB

```bash
# By URL (indexer link)
./scripts/sab-api.sh add "https://indexer.com/get.php?guid=..."

# With options
./scripts/sab-api.sh add "URL" --name "My Download" --category movies --priority high

# By local file
./scripts/sab-api.sh add-file /path/to/file.nzb --category tv
```

Priority: `force`, `high`, `normal`, `low`, `paused`, `duplicate`

### Control Queue

```bash
./scripts/sab-api.sh pause              # Pause all
./scripts/sab-api.sh resume             # Resume all
./scripts/sab-api.sh pause-job <nzo_id>
./scripts/sab-api.sh resume-job <nzo_id>
./scripts/sab-api.sh delete <nzo_id>    # Keep files
./scripts/sab-api.sh delete <nzo_id> --files  # Delete files too
./scripts/sab-api.sh purge              # Clear queue
```

### Speed Control

```bash
./scripts/sab-api.sh speedlimit 5120    # 5 MB/s, in KB/s
./scripts/sab-api.sh speedlimit 5M      # Helper also accepts M/K suffixes
./scripts/sab-api.sh speedlimit 0       # Unlimited
```

### History

```bash
./scripts/sab-api.sh history
./scripts/sab-api.sh history --limit 20 --failed
./scripts/sab-api.sh retry <nzo_id>     # Retry failed
./scripts/sab-api.sh retry-all          # Retry all failed
./scripts/sab-api.sh delete-history <nzo_id>
./scripts/sab-api.sh delete-history all --files   # clear entire history, deleting files too
```

### Categories & Scripts

```bash
./scripts/sab-api.sh categories
./scripts/sab-api.sh scripts
./scripts/sab-api.sh change-category <nzo_id> movies
./scripts/sab-api.sh change-script <nzo_id> notify.py
./scripts/sab-api.sh change-priority <nzo_id> high
./scripts/sab-api.sh rename <nzo_id> "New Name" [password]
./scripts/sab-api.sh warnings-clear
```

> SABnzbd's API takes the key as a query parameter (`?apikey=…`). That is inherent
> to its API; keep the server on loopback or behind a trusted proxy so the key
> isn't logged by intermediaries.

### Status & Info

```bash
./scripts/sab-api.sh status             # Full status
./scripts/sab-api.sh version
./scripts/sab-api.sh warnings
./scripts/sab-api.sh server-stats       # Download stats
```

## Response Format

Queue slot includes:
- `nzo_id`, `filename`, `status`
- `mb`, `mbleft`, `percentage`
- `timeleft`, `priority`, `cat`
- `script`, `labels`

Status values: `Downloading`, `Queued`, `Paused`, `Propagating`, `Fetching`

History status: `Completed`, `Failed`, `Queued`, `Verifying`, `Repairing`, `Extracting`

## Workflow

When the user asks about Usenet downloads:

1. **"What's downloading?"** → Run `queue` to show active downloads
2. **"Add this NZB"** → Run `add "<url>"` with appropriate category and priority
3. **"Pause all downloads"** → Run `pause`
4. **"Resume downloads"** → Run `resume`
5. **"Show download history"** → Run `history`
6. **"Retry failed downloads"** → Run `retry-all` or `retry <nzo_id>`
7. **"Slow down downloads"** → Run `speedlimit <KB/s>` or use the helper's `M`/`K` suffix

## Notes

- Requires network access to your SABnzbd server
- Uses SABnzbd API (v2+)
- All data operations return JSON
- **Delete operations with --files are permanent** - always confirm before deleting downloaded files
- Speed limits are sent to SABnzbd in KB/s; the helper converts values like `5M` to KB/s
- NZB files can be added by URL (indexer links) or local file upload
- Post-processing scripts are executed after download completion

## Local References

- `references/quick-reference.md` — common SABnzbd curl and helper examples
- `references/api-endpoints.md` — endpoint catalog and parameters
- `references/troubleshooting.md` — auth, queue, history, and connectivity diagnosis

---
