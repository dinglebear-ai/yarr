# plugins/yarr — Claude Code instructions

## What this directory is

Multi-platform plugin package for the Yarr MCP server. Contains manifests for Claude Code, Codex, and Gemini CLI, all sharing the same `skills/` tree. All three get a working MCP connection over **stdio** — Claude/Codex via `.mcp.json`, Gemini via an inline `mcpServers.yarr` block in `gemini-extension.json`.

## File map

| File | Role |
|---|---|
| `.claude-plugin/plugin.json` | Claude Code manifest — identity, skills, monitors, `userConfig`. Declares no `hooks` key — Claude/Codex auto-discover `hooks/hooks.json` from its default location. |
| `.codex-plugin/plugin.json` | Codex manifest — same data + Codex UI fields (`interface`) |
| `gemini-extension.json` | Gemini CLI manifest — `settings` array instead of `userConfig`, plus an inline `mcpServers.yarr` stdio block (see below) |
| `.mcp.json` | Claude Code / Codex MCP connection — **stdio by default** through `npx -y yarr-mcp@2.2.2 mcp`, one `YARR_<NAME>_*` env var per `userConfig` field. No committed platform binary or separately-run server is required. |
| `scripts/plugin-setup.sh` | Credential bridge for the bundled fallback skills, run by the SessionStart/ConfigChange hook (also safe to run manually). Persists only allowlisted settings as mode-`0600` JSON; stored values are parsed, never sourced/evaluated. |
| `monitors/monitors.json` | Background health monitor config (requires Claude Code v2.1.105+) |
| `skills/yarr/SKILL.md` | Three-tier tool documentation shared by Claude and Codex |

## Versioning rule

**Do not add a `version` field to any manifest.** The marketplace derives version from the git commit SHA. An explicit `version` field causes every push to register as a new version and creates duplicate marketplace entries.

## Updating a manifest

`.mcp.json` is read by Claude Code and Codex only. `gemini-extension.json`
carries its own equivalent `mcpServers.yarr` block inline — the two aren't the
same file, but both spawn the pinned npm launcher over stdio and must stay in sync when the
env-var set changes. `yarr`-package-scoped: the 11 standalone skills-only
plugins correctly have neither.

`.mcp.json` uses **stdio**, not HTTP: `command` is
`npx`, `args` starts with `["-y", "yarr-mcp@2.2.2", "mcp"]`, and `env` maps every
`YARR_<NAME>_*` variable to `${user_config.<field>}`. There is no `url`/`headers`
block and no separate server process to stand up — installing the plugin is
enough. `tests/plugin_contract/manifests.rs::mcp_json_uses_the_pinned_npm_stdio_launcher`
enforces this shape and cross-checks every `env` value against `userConfig`.

`gemini-extension.json`'s `mcpServers.yarr` is the Gemini analog, but its
interpolation model is different — there is **no `${settings.*}` syntax** in
the Gemini CLI extension schema. Instead each `settings` entry declares an
`envVar` name; Gemini CLI injects that as a plain process env var, and
`mcpServers.yarr.env` passes it through with ordinary `$VAR` shell expansion
(e.g. `"YARR_SONARR_URL": "$YARR_SONARR_URL"`, paired with a `settings` entry
declaring `"envVar": "YARR_SONARR_URL"`). `command` is `npx` and uses the
same pinned launcher args as `.mcp.json`. Verified
against upstream `google-gemini/gemini-cli` docs — don't invent alternate
syntax without re-checking those docs first.

When changing user-configurable settings, update `userConfig` in the Claude
and Codex `plugin.json` files, `settings` (including its `envVar` field) in
`gemini-extension.json`, and (if the field maps to an env var consumed at
startup) both `.mcp.json`'s `env` block and `gemini-extension.json`'s
`mcpServers.yarr.env` block. Keep field names and descriptions consistent
across all three.

## Monitors (Claude Code v2.1.105+)

`monitors/monitors.json` runs `scripts/watch.sh`, which delegates to an installed
`yarr` on PATH. Plugin monitors must not assume a bundled binary in the
plugin directory.

The monitor command must **not** reference `${user_config.*}`. Claude Code v2.1.207+ rejects it in monitor commands (the command runs through a shell) and the monitor never starts — silently, since a monitor that fails to launch looks identical to one reporting healthy. Monitor processes also receive no `CLAUDE_PLUGIN_OPTION_*`.

`watch.sh` therefore passes no URL; `yarr watch` resolves its own default from config (`http://localhost:{mcp.port}`). Do not hardcode URLs in `monitors.json` either — if a monitor ever needs a non-default URL, read it from a config file inside the script, which is the documented alternative.

When adding a new monitor: add an entry to `monitors.json` and reference only
scripts under `${CLAUDE_PLUGIN_ROOT}/scripts/`; those scripts should resolve the
runtime binary from PATH and exit non-blocking when it is unavailable.

## Updating the skill

`skills/yarr/SKILL.md` is shared by Claude Code and Codex. Gemini reads it via the `skills` path in `gemini-extension.json`. Edit it once — all platforms see the change.

The three-tier structure must be preserved:
- **Tier 1** (above fold): tool name, quick action table, critical gotchas
- **Tier 2** (middle): full action reference with parameters and response shapes
- **Tier 3** (bottom): workflows, HTTP fallback, error handling

## Updating plugin setup

`hooks/hooks.json` runs `${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh`. It
writes per-service `config.json` files atomically at mode `0600` using a fixed
allowlist. When adding or renaming a service `userConfig` field, update that
mapping and the matching fallback helper allowlist.

Sensitive fields declared `"sensitive": true` in `plugin.json` are available as env vars in hooks but are **never** substituted into skill content.

## Yarr-specific package

This directory is the concrete yarr plugin package. Keep identifiers aligned
with the `yarr` binary, `YARR_*` environment variables, and the
`skills/yarr/` skill path. Keep the no-version rule: do not add `"version"`
to any manifest.
