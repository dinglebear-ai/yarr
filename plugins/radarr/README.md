# Radarr (skills-only plugin)

Search, add, and monitor movies (and collections) in Radarr via its REST API. Check the download queue, quality profiles, and root folders. Skills-only, no MCP server required.

This is a **skills-only** plugin (no MCP server). The skill drives the Radarr REST API
directly with `curl`. Install it on its own if all you want is Radarr — no
yarr MCP server required. (For the full media fleet behind one MCP tool, with
these skills bundled as an offline fallback, install the `yarr` plugin instead.)

## Configure

Set these in the plugin settings (`userConfig`), then run `scripts/setup.sh`
to write them to `~/.config/lab-radarr/config.json`, which the skill scripts load
automatically — do not hand-edit or commit credentials.

| Setting | Sensitive | Description |
|---|---|---|
| `radarr_url` | no | Radarr URL |
| `radarr_api_key` | yes | Radarr API key |
| `radarr_default_quality_profile` | no | Radarr default quality profile |

## What's inside

- `skills/radarr/` — the Radarr skill (SKILL.md + helper scripts + references)
- `scripts/setup.sh` — bridges plugin settings to the skill config file (run it
  yourself; this plugin ships no lifecycle hooks)
- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json` — per-platform manifests
