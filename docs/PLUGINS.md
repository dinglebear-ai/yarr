# Plugin distribution

Yarr publishes one full MCP plugin and 11 service-specific skills-only plugins
for Claude Code, Codex, and Gemini CLI. Their manifests and marketplace
instructions use the canonical `dinglebear-ai/yarr` repository identity. The
classic filesystem package under `unraid-plugin/` is a separate Unraid
distribution, not an MCP plugin; its operator and release contract lives in
`unraid-plugin/README.md`.

## Full yarr plugin

The full plugin does not commit or execute a platform-specific ELF. Claude and
Codex use `plugins/yarr/.mcp.json`; Gemini carries the equivalent `mcpServers`
block in `plugins/yarr/gemini-extension.json`. The current released command is:

```json
{
  "command": "npx",
  "args": ["-y", "yarr-mcp@2.1.0", "mcp"]
}
```

The version pin is intentional supply-chain state. Release/package contract
checks update and verify it with the coupled npm/runtime version. Do not replace
it with an unpinned `npx yarr-mcp`, `@latest`, or a repository binary path.

The full plugin also includes fallback skills for Sonarr, Radarr, Prowlarr,
Overseerr, SABnzbd, qBittorrent, Plex, Jellyfin, Tautulli, Bazarr, and Tracearr.
Those skills call their configured upstream directly when the MCP surface is
not the selected path.

## Settings bridge

Claude lifecycle hooks run the repository-local safe bridge:

```text
${CLAUDE_PLUGIN_ROOT}/scripts/plugin-setup.sh
```

The bridge accepts only manifest-declared option names and writes mode-0600 JSON
under:

```text
~/.config/lab-<service>/config.json
```

Both bundled fallback skills and standalone service plugins read that same
strict per-service JSON contract. They parse an allowlist of keys; they never
`source`, `eval`, or execute stored settings. A value containing shell syntax is
data, not code. Old executable `config.env` files are not part of the contract.

Codex does not run Claude lifecycle hooks. Gemini injects manifest settings via
its `envVar` model; it uses `${extensionPath}` for extension-relative paths and
does not support Claude's `${user_config.*}` interpolation.

## Standalone plugins

The bare-named `sonarr`, `radarr`, `prowlarr`, `overseerr`, `sabnzbd`,
`qbittorrent`, `plex`, `jellyfin`, `tautulli`, `bazarr`, and `tracearr` packages
are skills-only. They must not declare an MCP server. Their local setup scripts
write the same strict config JSON described above and their skill scripts call
only the corresponding upstream service.

## Manifests

- Claude: `.claude-plugin/plugin.json` plus host-specific hooks.
- Codex: `.codex-plugin/plugin.json` plus shared skills.
- Gemini: `gemini-extension.json` plus shared skills and, for full yarr only,
  the pinned stdio MCP command.
- Marketplace catalogs: `.claude-plugin/marketplace.json` and
  `.agents/plugins/marketplace.json`.

Plugin manifests intentionally have no `version` field. Release identity comes
from the pinned launcher/package and repository artifact metadata, not a stale
manifest version copied by hand.

## Validation

Run all distribution gates after any manifest, hook, skill, npm, target, or
installer change:

```bash
just validate-plugin
cargo test --test plugin_contract
cargo test --test template_invariants
python3 scripts/check-plugin-hook-contract.py
node scripts/check-dist-contract.js
npm test --prefix packages/yarr-mcp
npm run check --prefix packages/yarr-mcp
npm pack --dry-run --json ./packages/yarr-mcp
```

The executable manifests and contract checks are authoritative if a generated
marketplace README drifts from this overview.
