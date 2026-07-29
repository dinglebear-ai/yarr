# qBittorrent (skills-only plugin)

List, add, pause, resume, and remove torrents and check transfer stats in qBittorrent via its WebUI API. Skills-only, no MCP server required.

This is a **skills-only** plugin (no MCP server). The skill drives the qBittorrent REST API
directly with `curl`. Install it on its own if all you want is qBittorrent — no
yarr MCP server required. (For the full media fleet behind one MCP tool, with
these skills bundled as an offline fallback, install the `yarr` plugin instead.)

## Configure

Set these in the plugin settings (`userConfig`), then run `scripts/setup.sh`
to write them to `~/.config/lab-qbittorrent/config.json`, which the skill scripts load
automatically — do not hand-edit or commit credentials.

| Setting | Sensitive | Description |
|---|---|---|
| `qbittorrent_url` | no | qBittorrent URL |
| `qbittorrent_username` | no | qBittorrent username |
| `qbittorrent_password` | yes | qBittorrent password |

## What's inside

- `skills/qbittorrent/` — the qBittorrent skill (SKILL.md + helper scripts + references)
- `scripts/setup.sh` — bridges plugin settings to the skill config file (run it
  yourself; this plugin ships no lifecycle hooks)
- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json` — per-platform manifests
