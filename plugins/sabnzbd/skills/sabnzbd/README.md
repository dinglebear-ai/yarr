# SABnzbd Skill

Manage Usenet downloads via SABnzbd.

## What It Does

- **Queue management** — view, pause, resume, delete downloads
- **Add NZBs** — by URL or local file
- **Speed control** — limit download speeds
- **History** — view completed/failed downloads, retry failed
- **Categories & scripts** — organize and automate

## Setup

### 1. Get Your API Key

1. Open SABnzbd web UI
2. Go to **Config → General → Security**
3. Copy your **API Key**

### 2. Configure Plugin Settings

Set these values in the plugin settings. The plugin setup script
writes `~/.config/lab-sabnzbd/config.json`; do not commit or hand-edit credentials
in this repo.

```bash
SABNZBD_URL="http://localhost:8080"
SABNZBD_API_KEY="<your_api_key>"
```

### 3. Test It

```bash
./scripts/sab-api.sh status
```

## Usage Examples

### Queue management

```bash
# View queue
./scripts/sab-api.sh queue

# Pause/resume all
./scripts/sab-api.sh pause
./scripts/sab-api.sh resume

# Pause specific job
./scripts/sab-api.sh pause-job SABnzbd_nzo_xxxxx
```

### Add downloads

```bash
# Add by URL
./scripts/sab-api.sh add "https://indexer.com/get.php?guid=..."

# Add with options
./scripts/sab-api.sh add "URL" --name "My Download" --category movies --priority high

# Add local NZB file
./scripts/sab-api.sh add-file /path/to/file.nzb --category tv
```

### Speed control

```bash
./scripts/sab-api.sh speedlimit 5120  # 5 MB/s, in KB/s
./scripts/sab-api.sh speedlimit 5M    # Helper converts M/K suffixes
./scripts/sab-api.sh speedlimit 0     # Unlimited
```

### History

```bash
./scripts/sab-api.sh history
./scripts/sab-api.sh history --limit 20 --failed
./scripts/sab-api.sh retry <nzo_id>       # Retry failed
./scripts/sab-api.sh retry-all            # Retry all failed
```

## Environment Variables

The scripts load credentials from `~/.config/lab-sabnzbd/config.json`:

```bash
SABNZBD_URL="http://localhost:8080"
SABNZBD_API_KEY="your-api-key"
```

To change credentials, update the plugin settings and rerun the plugin
setup script so it writes the correct local config file.

## API Reference

Detailed API documentation is available in the `references/` directory:

- **[API Endpoints](./references/api-endpoints.md)** - Complete endpoint reference
- **[Quick Reference](./references/quick-reference.md)** - Common command examples
- **[Troubleshooting](./references/troubleshooting.md)** - Common issues and solutions

## Troubleshooting

**"Missing URL or API key"**
→ Check that `SABNZBD_URL` and `SABNZBD_API_KEY` are set in `~/.config/lab-sabnzbd/config.json`

**Connection refused**
→ Verify your SABnzbd URL is correct and accessible

**401 Unauthorized**
→ Your API key is invalid — check SABnzbd Config → General

**More troubleshooting**
→ See [references/troubleshooting.md](./references/troubleshooting.md) for detailed solutions

## License

MIT
