---
title: "Justfile"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "project"
source_of_truth: false
last_reviewed: "2026-07-27"
---

# Justfile

`Justfile` is the operator command surface for local development, CI parity,
Docker, plugin validation, and diagnostics. Run `just --list` for the complete
current list.

## Core development recipes

| Recipe | Purpose |
|---|---|
| `just dev` | Run HTTP MCP server on loopback in no-auth dev mode (`YARR_MCP_NO_AUTH=true`). |
| `just mcp` | Run stdio MCP transport (`yarr mcp`). |
| `just doctor` | Pre-flight environment/connectivity checks (`yarr doctor`). |
| `just live-read-smoke` | Shart-only live read-only CLI and upstream API `get` checks; refuses non-shart service URLs. |
| `just live-full-guard` | Validate that the effective live-test environment is the complete shart stack. |
| `just live-full-cli` | Run guarded shart live CLI business, setup, serve, stdio MCP, parser, and watch coverage. |
| `just live-full-rest` | Run guarded shart live REST health/status, bearer auth, and OAuth metadata coverage. |
| `just live-full-mcp` | Run guarded shart live MCP protocol, resource, prompt, validation, and tool-action coverage. |
| `just live-full-services` | Run guarded shart live per-service action matrix coverage. |
| `just live-full-test` | Run the complete guarded shart live suite. |
| `just shart-start` / `just shart-stop` | Start or stop only the 11 dedicated shart test containers. |
| `just shart-status` | Show test-container state/health and fail for missing, stopped, or unhealthy containers; use the underlying `--json` flag for automation. |
| `just shart-seed` | Restore `configured-v1` golden data with a fleet-quiesced, fail-closed policy, start the stack, and wait; preview with the underlying `--dry-run` flag. |
| `just build` / `just build-release` | Debug/release Rust builds. |
| `just gen-token` | Generate a random bearer token (`openssl rand -hex 32`). |

## Quality gates

| Recipe | Purpose |
|---|---|
| `just verify` | `fmt-check` + `lint` + `check` + `test`. |
| `just template-check` | Pattern, plugin, schema, Markdown-link, and template checks. |
| `just docs-links-check` | Validate every tracked Markdown relative link and heading anchor. |
| `just pre-release` | Full release-readiness gate (`scripts/pre-release-check.sh`). |
| `just fmt` | Format Rust and TOML. |
| `just fmt-check` | Check formatting (CI). |
| `just lint` | `cargo clippy -- -D warnings`. |
| `just test` | `cargo nextest run`. |
| `just test-ci` | `cargo nextest run --profile ci`. |
| `just fmt-toml` | `taplo format`. |
| `just check-toml` | `taplo check` (CI). |

## Deployment recipes

| Recipe | Purpose |
|---|---|
| `just docker-build` | Build Docker image. |
| `just docker-up` / `just docker-down` | Start/stop compose stack. |
| `just docker-rebuild` | Rebuild image and recreate Docker service. |
| `just docker-logs` | Follow container logs. |
| `just runtime-current` | Detect stale running runtime (Docker or systemd). |
| `just auth-smoke` | Test bearer auth path against running server. |
| `just test-mcporter` | Run live MCP integration tests. |
| `just repair` | Rebuild and restart via systemd or Docker when available. |

## Unraid distribution recipes

| Recipe | Purpose |
|---|---|
| `just unraid-test` | Run lifecycle, updater, classic install/API loader, package, workflow, and negative contracts. |
| `just unraid-build VERSION BUILD` | Build and verify the deterministic classic `.txz`. |
| `just unraid-release-check` | Verify committed package, manifest, `.plg`, workflow, and release identity. |

These recipes are manual/CI release gates, not pre-commit hooks. The package
build requires the exact checksummed upstream native release assets and must
remain byte-identical across the CI umasks.

## Plugin and xtask recipes

| Recipe | Purpose |
|---|---|
| `just validate-plugin` | Validate Claude/Codex/Gemini plugin manifests and skills. |
| `just dist` | `cargo xtask dist` — build and copy release artifacts. |
| `just ci` | `cargo xtask ci` — run all checks locally. |
| `just symlink-docs` | `cargo xtask symlink-docs` — sync `AGENTS.md`/`GEMINI.md` symlinks. |
| `just check-env` | `cargo xtask check-env` — validate required environment. |
| `just patterns` | `cargo xtask patterns` — check architecture contracts. |
| `just tool-docs` | `cargo xtask tool-docs` — regenerate tool/action/endpoint docs. |
| `just tool-docs-check` | `cargo xtask tool-docs --check` — fail if generated docs are stale. |

## Reference docs

```just
refresh-docs:           bash scripts/refresh-docs.sh
refresh-docs-repomix:   bash scripts/refresh-docs.sh --skip-crawl
refresh-docs-crawl:     bash scripts/refresh-docs.sh --skip-repomix
refresh-docs-dry:       bash scripts/refresh-docs.sh --dry-run
```

## Doctor output

Use `just doctor` for human-readable diagnostics and run `yarr doctor --json`
when another tool must consume the result. The exact fields are owned by the
current CLI implementation; do not copy a frozen sample transcript into
automation. Exit code 0 means the configured environment passed its checks;
exit code 1 means at least one issue requires operator action.

See `docs/PATTERNS.md` §48 for the reusable doctor command pattern.
