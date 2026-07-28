# Plex (skills-only plugin)

Check server status, active sessions (who's watching), libraries, and recently added items in Plex via its API. Skills-only, no MCP server required.

This is a **skills-only** plugin (no MCP server). The skill drives the Plex REST API
directly with `curl`. Install it on its own if all you want is Plex — no
yarr MCP server required. (For the full media fleet behind one MCP tool, with
these skills bundled as an offline fallback, install the `yarr` plugin instead.)

## Configure

Set these in the plugin settings (`userConfig`), then run `scripts/setup.sh`
to write them to `~/.config/lab-plex/config.json`, which the skill scripts load
automatically — do not hand-edit or commit credentials.

| Setting | Sensitive | Description |
|---|---|---|
| `plex_url` | no | Plex URL |
| `plex_token` | yes | Plex token |

## What's inside

- `skills/plex/` — the Plex skill (SKILL.md + helper scripts + references)
- `scripts/setup.sh` — bridges plugin settings to the skill config file (run it
  yourself; this plugin ships no lifecycle hooks)
- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json` — per-platform manifests
