# yarr plugin

Multi-platform plugin package that connects Claude Code, Codex, and Gemini CLI to the Yarr MCP server.

## Structure

```
plugins/yarr/
├── .claude-plugin/
│   └── plugin.json         # Claude Code manifest
├── .codex-plugin/
│   ├── plugin.json         # Codex manifest
│   └── README.md           # Codex manifest field reference
├── gemini-extension.json   # Gemini CLI extension manifest — inline mcpServers.yarr, stdio
├── .mcp.json               # Claude Code / Codex stdio via pinned npm launcher
├── monitors/
│   └── monitors.json       # Background health monitor (requires Claude Code v2.1.105+)
└── skills/
    └── yarr/
        └── SKILL.md        # Tool documentation (shared by Claude and Codex)
```

## Platform manifests

All three platforms connect over **stdio** through the pinned
`@dinglebear/yarr@2.2.1` npm launcher. No Linux-only binary is committed. Claude Code
and Codex read `.mcp.json`; Gemini CLI declares the equivalent block inline in
`gemini-extension.json`. All three share the same `skills/` directory.

| File | Platform | MCP config | Variable syntax |
|---|---|---|---|
| `.claude-plugin/plugin.json` | Claude Code | `.mcp.json` | `${user_config.*}` |
| `.codex-plugin/plugin.json` | Codex | `.mcp.json` | `${user_config.*}` |
| `gemini-extension.json` | Gemini CLI | inline `mcpServers.yarr` | `${extensionPath}` / plain env vars via `envVar` |

**No `version` field in any manifest.** The marketplace assigns version from the git commit SHA. Adding an explicit version creates duplicate entries on every push.

## MCP connection

`.mcp.json` (Claude Code / Codex):

```json
{
  "mcpServers": {
    "yarr": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@dinglebear/yarr@2.2.1", "mcp"],
      "env": {
        "YARR_SERVICES": "${user_config.yarr_services}",
        "YARR_SONARR_URL": "${user_config.sonarr_url}",
        "YARR_SONARR_API_KEY": "${user_config.sonarr_api_key}"
      }
    }
  }
}
```

`${user_config.*}` is populated from Claude/Codex `userConfig` settings at runtime.

`gemini-extension.json`'s inline `mcpServers.yarr` (Gemini CLI has no `${user_config.*}`-style interpolation — each `settings` entry instead declares an `envVar` name that Gemini CLI injects as a plain process env var, referenced here with ordinary `$VAR` shell expansion; `${extensionPath}` is the Gemini equivalent of `${CLAUDE_PLUGIN_ROOT}`):

```json
{
  "mcpServers": {
    "yarr": {
      "command": "npx",
      "args": ["-y", "@dinglebear/yarr@2.2.1", "mcp"],
      "env": {
        "YARR_SONARR_URL": "$YARR_SONARR_URL"
      }
    }
  }
}
```

The full plugin is self-starting only when the exact pinned launcher exists on npm.
Verify it before installation or troubleshooting:

```bash
npm view @dinglebear/yarr@2.2.1 version
```

GitHub release `v2.1.0` is currently public while that npm version is missing;
[issue #80](https://github.com/dinglebear-ai/yarr/issues/80) tracks recovery.
Do not replace the pin with `latest` or an older launcher. Use the native Yarr
binary directly for MCP, or install a service-specific skills-only plugin, until
the exact package resolves.

A user who instead wants to run `yarr` as a persistent HTTP server (e.g. for other MCP clients, or to share one server across machines) can still do so separately — that's what the `server_url`/`api_token` `userConfig`/`settings` fields and the health monitor (below) are for. That mode is independent of this plugin's own stdio MCP connection.

## Fallback-skill credential bridge

This plugin ships **no lifecycle hooks**. `scripts/plugin-setup.sh` is the
credential bridge for the bundled fallback skills and is run on demand — either
directly, or through `yarr setup plugin-hook`. It writes only declared
fallback-service settings to mode-`0600` `~/.config/lab-<service>/config.json`
files. Helpers parse those JSON objects using fixed allowlists; no stored value
is sourced or evaluated.

The MCP connection itself needs none of this: `.mcp.json` passes every
`YARR_<NAME>_*` value straight to the stdio server from `userConfig`.

## Monitors

**Requires Claude Code v2.1.105+.**

`monitors/monitors.json` declares a background `server-health` monitor that starts automatically at session start. It runs `scripts/watch.sh`, which delegates to an installed `yarr` on PATH, and delivers each stdout line to Claude as a notification whenever the MCP server changes state.

The monitor emits only on state transitions — Claude is not notified while the server is stable. Three states:

- `UP` — `/health` returned 2xx
- `DOWN` — connection refused / timeout
- `DEGRADED(HTTP N)` — non-2xx HTTP response

The MCP connection itself (`.mcp.json`) uses the pinned npm launcher, while the
health monitor's `watch.sh` still resolves `yarr` from PATH (or `YARR_MCP_BIN`)
— it checks an independent, optionally self-hosted HTTP server at
`${user_config.server_url}`, not the stdio process `.mcp.json` spawns. Install
`yarr` separately if you want the monitor to work:

```bash
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash
yarr --version
```

Disabling the plugin mid-session does not stop an already-running monitor; it stops when the session ends.

## Skills

`skills/yarr/SKILL.md` is the three-tier structured documentation for the `yarr` MCP tool. The AI reads Tier 1 for quick lookups, Tier 2 for parameter details, Tier 3 for multi-step workflows.

## Packaging checklist

1. Keep the pinned `@dinglebear/yarr@<version>` spec equal to the coupled runtime/package release version.
2. Verify `npm view @dinglebear/yarr@<version> version`; a manifest pin is not proof of registry availability.
3. Confirm the native `yarr` binary is installed separately on PATH when testing the optional health monitor (`watch.sh`).
4. Run `node scripts/test-plugin-distribution.js`, `scripts/validate-plugin-layout.sh`, and `python3 scripts/check-doc-links.py`.
5. Verify all manifests still omit explicit `version` fields.
6. Install through the target marketplace or local plugin path and test both stdio startup and one fallback skill.
