# plugins

Plugin packages for Claude Code, Codex, and Gemini CLI. Two ways to consume the
media-automation stack:

- **`yarr`** — the full MCP server plugin: one tool surface over the whole
  fleet, **plus** every per-service skill bundled as a direct-HTTP fallback for
  when the MCP server is unavailable.
- **One plugin per service** — bare-named, **skills-only, no-MCP** plugins. Each
  drives a single service's REST API directly with `curl`. Pick only the ones you
  want (e.g. just `plex` + `sonarr` + `radarr`); no MCP server required.

```
plugins/
├── yarr/        MCP server + consolidated skill + all 11 fallback skills
├── sonarr/         skills-only ┐
├── radarr/                     │
├── prowlarr/                   │
├── overseerr/                  │
├── sabnzbd/                    │  one standalone, no-MCP
├── qbittorrent/                ├─ plugin per service
├── plex/                       │
├── jellyfin/                   │
├── tautulli/                   │
├── tracearr/                   │
└── bazarr/                     ┘
```

## Marketplaces

Both catalogs list `yarr` first, then the 11 standalone plugins:

- **Claude Code** — [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json)
  at the repo root. Add it with `/plugin marketplace add dinglebear-ai/yarr` then install
  individual plugins (`/plugin install sonarr@yarr`). Uses
  `metadata.pluginRoot: "./plugins"` with relative `source` paths.
- **Codex** — [`.agents/plugins/marketplace.json`](../.agents/plugins/marketplace.json),
  the personal-marketplace shape (`source: { source: "local", path }`).

## Per-plugin layout (standalone)

```
plugins/<service>/
├── .claude-plugin/plugin.json   # Claude manifest + per-service userConfig
├── .codex-plugin/plugin.json    # Codex manifest + interface block
├── gemini-extension.json        # Gemini manifest + settings (no mcpServers)
├── hooks/hooks.json             # SessionStart + ConfigChange → scripts/setup.sh
├── scripts/setup.sh             # bridges userConfig → mode-0600 JSON settings
├── README.md  CHANGELOG.md
└── skills/<service>/            # SKILL.md + helper scripts + references
```

### Credential bridge

Claude Code injects `userConfig` values only into plugin subprocesses (the hook),
not into the agent's Bash tool. So each plugin's `SessionStart` / `ConfigChange`
hook runs `scripts/setup.sh`, which writes only manifest-declared values to a
private mode-`0600` JSON object. Skill helpers parse an explicit allowlist;
the file is never sourced or evaluated:

- standalone `<service>` plugin → `~/.config/lab-<service>/config.json`
- `yarr` plugin → writes **all** `~/.config/lab-<service>/config.json` files
  from the same binary-owned setup hook (`yarr setup plugin-hook`) so the
  bundled fallback skills work with the credentials you already configured for
  the MCP server.

Config dirs are per-service and isolated, so installing a standalone plugin and
the `yarr` bundle side by side does not cause them to clobber each other.

## The `yarr` MCP plugin

In addition to the standalone layout above, `yarr/` ships `.mcp.json` and
`gemini-extension.json`'s inline `mcpServers.yarr` (stdio through the pinned
`yarr-mcp@2.1.0` npm launcher, no committed platform binary),
`monitors/monitors.json`, the safe local JSON setup hook, the consolidated
`skills/yarr/SKILL.md`, and
the 11 bundled fallback skills under `skills/<service>/`. See its
[`.codex-plugin/README.md`](yarr/.codex-plugin/README.md) for the Codex field
reference.

## Versioning

Plugin manifests stay **versionless** on every platform (`.claude-plugin`,
`.codex-plugin`, `gemini-extension.json`). The marketplace derives plugin version
from the git commit SHA; an explicit `version` field creates duplicate marketplace
entries on every push. Enforced by `tests/template_invariants.rs`.

## Maintenance checklist

When changing a plugin package:

1. Keep the Claude, Codex, and Gemini manifests aligned (name, description, keywords).
2. Update the service's `skills/<service>/SKILL.md` when its command surface changes.
3. If you add a service, add it to **both** marketplace files and bundle its skill
   into `plugins/yarr/skills/` plus the `yarr` credential bridge.
4. Verify all manifests still omit explicit `version` fields (`cargo test --test template_invariants`).
5. Run `cargo test --test plugin_contract` after touching the `yarr` manifests.
