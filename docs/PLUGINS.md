---
title: "Plugin Distribution"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["plugin users", "plugin maintainers", "contributors", "agents"]
scope: "project"
source_of_truth: false
upstream_refs:
  - "plugins/"
  - "packages/yarr-mcp/package.json"
  - "scripts/check-dist-contract.js"
last_reviewed: "2026-07-27"
---

# Plugin distribution

Yarr publishes one full MCP plugin and 11 service-specific skills-only plugins
for Claude Code, Codex, and Gemini CLI. The classic filesystem package under
`unraid-plugin/` is a separate Unraid distribution, not an MCP plugin.

## Choose a plugin

| Package | Includes | Runtime dependency | Best for |
|---|---|---|---|
| `yarr` | Full MCP connection plus all fallback skills | Exact pinned `yarr-mcp@VERSION` | One agent surface for the fleet |
| `sonarr`, `radarr`, etc. | One direct-service skill | No Yarr MCP launcher | Narrow direct upstream workflows |

The full plugin and skills-only packages can coexist. The skills call strict
per-service helpers when MCP is not the selected path.

## Full Yarr plugin

Claude and Codex use `plugins/yarr/.mcp.json`; Gemini carries the equivalent
`mcpServers` block in `plugins/yarr/gemini-extension.json`. All three start
stdio through the same exact launcher specification:

```json
{
  "command": "npx",
  "args": ["-y", "yarr-mcp@2.2.0", "mcp"]
}
```

The version pin is intentional supply-chain state. Release/package contracts
couple it to the Rust runtime, npm package, `server.json`, and release tag. Do
not replace it with unpinned `npx yarr-mcp`, `@latest`, or a repository binary.

### Launcher availability

A manifest pin proves intent, not registry availability. Verify the exact
package before installing or debugging the full plugin:

```bash
npm view yarr-mcp@2.2.0 version
```

At this documentation revision, GitHub release `v2.1.0` is public but
`yarr-mcp@2.2.0` returns `E404`; recovery is tracked in
[issue #80](https://github.com/dinglebear-ai/yarr/issues/80). The full plugin
cannot start from npm until that exact version resolves. Do not loosen the pin
or silently use npm `latest` (currently an older launcher). Install the native
Yarr binary directly for MCP use, or use a skills-only plugin meanwhile.

## Installation

Inside Claude Code:

```text
/plugin marketplace add dinglebear-ai/yarr
/plugin install yarr@yarr
```

For a single service:

```text
/plugin install sonarr@yarr
/plugin install plex@yarr
```

Codex and Gemini should use their corresponding marketplace or local extension
install flow after validating the manifest and exact launcher availability.

## Platform manifests

| File | Platform | MCP config | Settings model |
|---|---|---|---|
| `.claude-plugin/plugin.json` | Claude Code | `.mcp.json` | `userConfig`; no lifecycle hooks |
| `.codex-plugin/plugin.json` | Codex | `.mcp.json` | Shared skills; no lifecycle hooks |
| `gemini-extension.json` | Gemini CLI | Inline `mcpServers.yarr` | `envVar` plus `${extensionPath}` |

Manifests intentionally omit a `version` field. Marketplace identity comes
from repository artifacts and commit state; a copied manifest version creates
duplicate or stale identities.

## Settings bridge and secret handling

No plugin in this repository declares lifecycle hooks. The credential bridge for
the skills is a script you run on demand:

```text
plugins/yarr/scripts/plugin-setup.sh      # full plugin (wraps `yarr setup plugin-hook`)
plugins/<service>/scripts/setup.sh        # skills-only plugin
```

The bridge accepts only declared option names (read from the environment as
`CLAUDE_PLUGIN_OPTION_<KEY>`) and writes mode-`0600` JSON to
`~/.config/lab-<service>/config.json`. Fallback helpers parse a fixed allowlist
of JSON keys. They never `source`, `eval`, or execute stored values. Shell
syntax inside a value remains data.

Gemini injects manifest settings via its `envVar` model and uses
`${extensionPath}` for extension-relative files. The full `yarr` plugin's MCP
connection does not depend on the bridge at all — `.mcp.json` passes each
`YARR_<NAME>_*` value to the stdio server straight from `userConfig`.

## Optional health monitor

The full Claude plugin includes a transition-only server-health monitor. It
checks an independently running HTTP server through an installed `yarr` binary
on `PATH` or `YARR_MCP_BIN`; it does not monitor the stdio child process. The
native installer is the recommended way to provide that binary while npm
publication is incomplete.

The plugin's MCP connection itself remains stdio and needs no HTTP token. The
`server_url` and `api_token` settings configure only an optional persistent HTTP
server used by monitoring or other clients. That HTTP path defaults to
`static_token_scopes=yarr:read` with `tool_mode=flat`; selecting `codemode`
requires explicitly granting `yarr:write`.

## Standalone plugins

The bare-named `sonarr`, `radarr`, `prowlarr`, `overseerr`, `sabnzbd`,
`qbittorrent`, `plex`, `jellyfin`, `tautulli`, `bazarr`, and `tracearr` packages
are skills-only and must not declare an MCP server. Their setup scripts write
the same strict per-service JSON contract and call only the matching upstream.

## Maintainer checklist

1. Keep every `yarr-mcp@<version>` pin equal to `packages/yarr-mcp/package.json`.
2. Verify `npm view yarr-mcp@<version> version` before describing the pin as available.
3. Keep full-plugin and skills-only boundaries explicit in every marketplace description.
4. Keep manifests versionless and free of committed platform binaries.
5. Update plugin docs whenever settings, setup-script, monitor behavior, or fallback config changes.
6. Run the complete distribution checks below.

```bash
just validate-plugin
cargo test --test plugin_contract
cargo test --test template_invariants
python3 scripts/check-plugin-hook-contract.py
node scripts/check-dist-contract.js
npm test --prefix packages/yarr-mcp
npm run check --prefix packages/yarr-mcp
npm pack --dry-run --json ./packages/yarr-mcp
python3 scripts/check-doc-links.py
```

The executable manifests and contract checks are authoritative if a marketplace
overview drifts. See [plugins/README.md](../plugins/README.md) and the
[full plugin guide](../plugins/yarr/README.md) for package-level details.
