# Sonarr (skills-only plugin)

Search, add, and monitor TV series in Sonarr via its REST API. Check the download queue, history, and quality profiles. Skills-only, no MCP server required.

This is a **skills-only** plugin (no MCP server). The skill drives the Sonarr REST API
directly with `curl`. Install it on its own if all you want is Sonarr — no
yarr MCP server required. (For the full media fleet behind one MCP tool, with
these skills bundled as an offline fallback, install the `yarr` plugin instead.)

## Configure

Set these in the plugin settings (`userConfig`), then run `scripts/setup.sh`
to write them to `~/.config/lab-sonarr/config.json`, which the skill scripts load
automatically — do not hand-edit or commit credentials.

| Setting | Sensitive | Description |
|---|---|---|
| `sonarr_url` | no | Sonarr URL |
| `sonarr_api_key` | yes | Sonarr API key |
| `sonarr_default_quality_profile` | no | Sonarr default quality profile |

## What's inside

- `skills/sonarr/` — the Sonarr skill (SKILL.md + helper scripts + references)
- `scripts/setup.sh` — bridges plugin settings to the skill config file (run it
  yourself; this plugin ships no lifecycle hooks)
- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json` — per-platform manifests
