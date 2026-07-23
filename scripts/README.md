# scripts

Maintenance and automation scripts for the template. Shell scripts are written for Bash and generally use `set -euo pipefail`; Python scripts are executable with `python3`.

## Quick map

| Script | Purpose |
|---|---|
| `asciicheck.py` | Check/fix unexpected non-ASCII characters. |
| `block-env-commits.sh` | Prevent `.env*` secrets from being committed. |
| `build-web.sh` | Build the Next.js web UI static export (`apps/web/out/`). |
| `bump-version.sh` | Update version-bearing files from the `Cargo.toml` version. |
| `check-blob-size.py` | Block unexpectedly large changed blobs. |
| `check-coupled-files.sh` | Warn when files that normally change together drift. The `schemas.rs` ↔ `docs/MCP_SCHEMA.md` pair defers to `check-schema-docs.py --check`, so formatting-only edits do not false-positive. |
| `check-dependency-updates.sh` | Report lockfile-compatible and latest dependency updates. |
| `check-file-size.sh` | Pre-commit source file size budget. |
| `check-plugin-hook-contract.py` | Audit plugin setup hook contract across Rust MCP servers. |
| `check-runtime-current.sh` | Detect stale Docker/systemd runtimes. |
| `check-schema-docs.py` | Generate/check `docs/MCP_SCHEMA.md` and action docs. |
| `check-version-sync.sh` | Check version consistency. |
| `generate-cli.sh` | Generate a standalone CLI for this server via mcporter (requires running server). |
| `install.sh` | Install the latest GitHub Release binary and create a `yarr` symlink. |
| `live-read-smoke.sh` | Run legacy guarded shart read-only CLI and upstream `get` checks. |
| `pre-release-check.sh` | Full release-readiness gate, including schema and runtime contract drift checks. |
| `refresh-docs.sh` | Refresh ignored reference docs with Axon/Repomix. |
| `repair.sh` | Stop, rebuild, and restart the service via systemd or Docker Compose. |
| `run-ascii-check.sh` | Collect tracked files and run `asciicheck.py`; pass `--fix` to rewrite in place. |
| `sync-cargo.sh` | Sync `Cargo.lock` into plugin data directories. |
| `sync-plugin-manifests.js` | Couple every `yarr-mcp@<version>` launcher pin to `packages/yarr-mcp/package.json`; `--check` fails on drift. |
| `test-mcp-auth.sh` | Smoke-test HTTP MCP bearer auth. |
| `test-template-features.sh` | Fast template invariant smoke tests. |
| `validate-plugin-layout.sh` | Validate Claude/Codex/Gemini plugin package layout. |
| `web-watch.sh` | Watch `apps/web` for changes and rebuild on save (requires watchexec). |

`blob-size-allowlist.txt` is data for `check-blob-size.py`, not an executable script.

---

## Script reference

### `asciicheck.py`

```bash
python3 scripts/asciicheck.py README.md Justfile
python3 scripts/asciicheck.py --fix README.md
just ascii-check
just ascii-fix
```

Checks files for unexpected non-ASCII characters. A small allowlist covers intentional documentation glyphs such as section signs, arrows, and box-drawing characters. The vendored upstream OpenAPI specs under `specs/**` are excluded (they are authoritative third-party documents that legitimately contain curly quotes and accented characters); `specs/*` is likewise allowlisted in `blob-size-allowlist.txt` because the Jellyfin/Plex specs exceed the default per-file blob limit.

### `block-env-commits.sh`

```bash
bash scripts/block-env-commits.sh
```

Pre-commit guard that rejects staged `.env`, `.env.local`, `.env.prod`, etc. `.env.yarr` is allowed.

### `bump-version.sh`

```bash
scripts/bump-version.sh 1.3.5
scripts/bump-version.sh patch
scripts/bump-version.sh minor
scripts/bump-version.sh major
```

Updates `Cargo.toml`, `Cargo.lock`, and `server.json` when present. Plugin manifests intentionally remain versionless.

### `check-blob-size.py`

```bash
python3 scripts/check-blob-size.py
python3 scripts/check-blob-size.py --base origin/main --head HEAD --max-bytes 512000
just blob-size-check
```

Checks changed git blobs against a size budget. Use `scripts/blob-size-allowlist.txt` only for intentional, reproducible large artifacts such as the vendored OpenAPI specifications and their generated Jellyfin/Plex registries.

### `check-coupled-files.sh`

```bash
scripts/check-coupled-files.sh origin/main HEAD
just coupled-files-check
```

CI-oriented guard for files that usually change together, such as script changes with `scripts/README.md`, schema changes with `docs/MCP_SCHEMA.md`, and automation changes with docs.

### `check-dependency-updates.sh`

```bash
scripts/check-dependency-updates.sh
scripts/check-dependency-updates.sh --skip-search
scripts/check-dependency-updates.sh --fail-on-updates
just deps-check
```

Read-only dependency drift report. It runs `cargo update --dry-run`, then checks direct root dependencies against crates.io unless `--skip-search` is used.

### `check-file-size.sh`

```bash
scripts/check-file-size.sh
MAX_RS=450 MAX_TS=350 scripts/check-file-size.sh
just file-size-check
```

Checks staged `.rs`, `.ts`, and `.tsx` files for effective production lines. Test files and Rust inline `#[cfg(test)]` modules are exempted.

### `check-plugin-hook-contract.py`

```bash
python3 scripts/check-plugin-hook-contract.py
python3 scripts/check-plugin-hook-contract.py --execute
```

Audits plugin setup hooks across known Rust MCP servers. Without `--execute`, it is a static contract check. With `--execute`, it runs each binary setup command via Cargo.

### `check-runtime-current.sh`

```bash
scripts/check-runtime-current.sh
scripts/check-runtime-current.sh --mode systemd --expected-binary target/release/yarr
scripts/check-runtime-current.sh --mode docker --pull --compose-dir .
just runtime-current
```

Systemd mode compares the running process hash to the unit `ExecStart` binary and optional expected binary. Docker mode compares the running container image ID with the local Compose image ID.

### `check-schema-docs.py`

```bash
python3 scripts/check-schema-docs.py --write
python3 scripts/check-schema-docs.py --check
just schema-docs
just schema-docs-check
```

Treats the action registry as canonical and verifies schema docs, help text, README, and plugin skill mentions. Generated output lives in `docs/MCP_SCHEMA.md`. Since the descriptor-table refactor, `ACTION_SPECS` lives in `src/actions/registry.rs` (with `src/actions.rs` a thin facade), so the checker scans the `src/actions/` tree recursively rather than the single `src/actions.rs` file. The required-params contract is `service`/`path` for the generic passthroughs: there is no `confirm` param anywhere, and the destructive `api_delete` runs immediately on the CLI/Code Mode — on MCP it's instead gated out-of-band via elicitation (not via a required schema param).

### `build-web.sh`

```bash
bash scripts/build-web.sh
just build-web
```

Builds the Next.js web UI static export from `apps/web/`. Installs `node_modules` if absent, then runs `pnpm build`. Output lands in `apps/web/out/` and is embedded into the binary via the `web` feature. No-ops silently when `apps/web/` does not exist.

### `check-version-sync.sh`

```bash
scripts/check-version-sync.sh
scripts/check-version-sync.sh /path/to/project
```

Validates that version-bearing files agree. Missing `CHANGELOG.md` entries are warnings; mismatched versions are failures.

### `generate-cli.sh`

```bash
YARR_MCP_TOKEN=... bash scripts/generate-cli.sh
just generate-cli
```

Generates a standalone CLI binary for this server via `mcporter generate-cli`. Requires a running server on port 40070 and `mcporter` in PATH. Caches a schema hash under `dist/.cache/` and skips regeneration when the tool schema is unchanged. The generated binary embeds the token — do not commit or share it.

The script targets Yarr's default port 40070 and `YARR_MCP_TOKEN`.

### `install.sh`

```bash
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/scripts/install.sh | bash
YARR_VERSION=v0.4.0 INSTALL_DIR=~/.local/bin bash scripts/install.sh
```

Downloads the matching GitHub Release tarball and installs `yarr` in the target
directory. Supports Linux x64 and Windows x64 release
assets, matching the current release workflow.

### `live-read-smoke.sh`

```bash
scripts/live-read-smoke.sh
YARR_BIN=target/release/yarr scripts/live-read-smoke.sh
just live-read-smoke
```

Runs live read-only checks against the shart test yarr environment only.
The script defaults `YARR_HOME` to `/home/jmagar/.yarr-shart` and refuses
to run when `YARR_HOME` points anywhere else. Before any upstream status/get
probe, it also inspects the effective `YARR_*_URL` values from that env file
plus process overrides and aborts unless every configured service URL targets
shart (`100.118.209.1` or the shart Tailscale hostname). This guard prevents the
smoke suite from ever exercising the live tootie media services by accident.

The complete canonical live suite is implemented in `cargo xtask live`:

```bash
cargo xtask live --suite all
just live-full-test
```

Use `live-read-smoke.sh` only for the older quick read smoke path.

It covers `help`, `doctor --json`, `status --service` for every
configured service, and a broad catalog of non-mutating parameterless
`get --service ... --path ...` probes for real upstream APIs: Sonarr/Radarr
system, queue, history, calendar, config, health, logs, and update endpoints;
Prowlarr indexer/application/client endpoints; Tautulli activity/library/user
stats; Overseerr discovery/request/search metadata; Bazarr system/media
stats; Overseerr public status/settings metadata; Bazarr system/media metadata;
SABnzbd queue/history/config; qBittorrent app/torrent/transfer/sync state; Plex
identity; and Jellyfin public server info. The script intentionally
skips endpoints that require object IDs, search terms beyond a fixed benign
query, initialized admin sessions, or return UI/route graph payloads instead of API JSON. It prints only
labels and pass/fail summaries and exits nonzero if any live read fails.

### `pre-release-check.sh`

```bash
scripts/pre-release-check.sh
scripts/pre-release-check.sh --skip-verify --skip-build-plugin
scripts/pre-release-check.sh --mcporter
just pre-release
```

Runs the release gate: pattern checks, plugin validation, schema docs, template feature smoke tests, version sync, blob size, ASCII hygiene, `just verify`, and `just build-plugin`. `--mcporter` also runs `just test-mcporter` and requires a running server.

### `refresh-docs.sh`

```bash
scripts/refresh-docs.sh
scripts/refresh-docs.sh --dry-run
scripts/refresh-docs.sh --skip-crawl
scripts/refresh-docs.sh --skip-repomix
```

Refreshes ignored reference docs under `docs/references/`:

```text
docs/references/
├── mcp/docs/          # crawled modelcontextprotocol.io
├── mcp/repos/         # Repomix packs: rust-sdk, spec, registry
├── claude-code/       # crawled code.claude.com
├── mcporter/docs/     # sparse-cloned mcporter docs
├── mcporter/repos/    # Repomix pack of mcporter source
├── INDEX.md
└── CHANGES.md
```

Environment:

| Variable | Default | Description |
|---|---|---|
| `AXON_OUTPUT_DIR` | `~/.axon/output` | Axon host output directory. |
| `REPOMIX_BIN` | auto-detected | Repomix executable, otherwise `npx --yes repomix`. |

The MCP spec and registry packs ignore huge SVG/Excalidraw diagrams to keep text reference packs usable.

### `repair.sh`

```bash
bash scripts/repair.sh
just repair
```

Stops, rebuilds, and restarts the `yarr-mcp` service while installing the `yarr` binary. Detects the active service manager automatically: prefers a systemd user unit (`yarr-mcp.service`), falls back to Docker Compose. Useful after an in-place binary update without a full `docker compose build`.

### `run-ascii-check.sh`

```bash
bash scripts/run-ascii-check.sh          # check mode
bash scripts/run-ascii-check.sh --fix    # rewrite smart punctuation to ASCII
just ascii-check
just ascii-fix
```

Collects all tracked `*.md`, `*.rs`, `*.toml`, `*.json`, `*.yml`, `*.yaml`, `*.sh`, and `*.py` files (excluding `docs/references/` and `docs/sessions/`) and passes them to `scripts/asciicheck.py`. Used in CI via `bash scripts/run-ascii-check.sh` and locally via the Justfile aliases.

### `sync-cargo.sh`

```bash
bash scripts/sync-cargo.sh
```

Copies `Cargo.lock` from `CLAUDE_PLUGIN_ROOT` to `CLAUDE_PLUGIN_DATA` when needed. Falls back to `cargo fetch` if the copy cannot be completed.

### `sync-plugin-manifests.js`

```bash
node scripts/sync-plugin-manifests.js          # rewrite pins in place
node scripts/sync-plugin-manifests.js --check   # fail (non-zero) on drift
```

Rewrites every hard-coded `yarr-mcp@<version>` npm launcher pin (in `plugins/yarr/.mcp.json`, `plugins/yarr/gemini-extension.json`, `server.json`, and the plugin docs) plus `server.json`'s `_meta.buildInfo.version` and its `YARR_VERSION` example placeholder (`v<version>`) to match `packages/yarr-mcp/package.json` — the single version release-please bumps. release-please cannot template a version embedded inside a launcher-arg string, so the release workflow runs this on the release PR and CI runs `--check` to block drift on `main`. `validate-plugin-layout.sh` derives the expected pin from `package.json` directly, so it is intentionally not rewritten here.

### `test-mcp-auth.sh`

```bash
YARR_MCP_TOKEN=... scripts/test-mcp-auth.sh
scripts/test-mcp-auth.sh --url http://localhost:40070/mcp --token ...
scripts/test-mcp-auth.sh --check-x-api-key
```

Checks that `/health` is public, `/mcp` rejects missing/bad bearer tokens with `401`, and `/mcp` accepts a valid bearer token. `x-api-key` is optional because the template auth layer uses bearer tokens.

### `test-template-features.sh`

```bash
bash scripts/test-template-features.sh
just template-features
```

Fast shell smoke tests for invariants that are awkward as Rust tests: `.env` blocking, agent docs symlinks, plugin layout, schema docs, the Trivy SARIF severity gate, and ASCII hygiene.

### `web-watch.sh`

```bash
bash scripts/web-watch.sh
just web-watch
```

Watches `apps/web/` for changes and rebuilds on save using `watchexec`. Ignores `.next/`, `out/`, and `node_modules/`. Requires `watchexec`: `cargo install watchexec-cli`.

### `validate-plugin-layout.sh`

```bash
scripts/validate-plugin-layout.sh
PLUGIN_ROOT=plugins/yarr scripts/validate-plugin-layout.sh
just validate-plugin
```

Validates Claude, Codex, and Gemini plugin manifests, shared MCP config, hook config, skills, sensitive fields, and the rule that plugin manifests do not contain `version`.

---

## Hook integration

`block-env-commits.sh`, `check-version-sync.sh`, and `check-file-size.sh` are designed for `lefthook` pre-commit integration. Install hooks with:

```bash
just install-hooks
```

## Maintenance rule

When adding, renaming, or changing a script, update this README and any Justfile recipe that calls it.
