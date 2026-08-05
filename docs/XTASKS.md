---
title: "xtasks"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "xtasks"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "template"
source_of_truth: false
last_reviewed: "2026-07-17"
---

# xtasks

The `xtask/` crate contains typed repo automation invoked as `cargo xtask <command>`. Shell scripts are good for glue; xtasks are better when the check needs structured parsing, walking the repo, or cross-platform behavior.

## Repository layout

```
xtask/
  Cargo.toml       # name = "xtask", path dep on main crate
  src/
    main.rs        # top-level cargo xtask command router
    <command>.rs   # one focused module per substantial command
    <command>_tests.rs
    live/          # focused modules supporting the live/backuphost harness
```

## Commands

| Command | Purpose |
|---|---|
| `cargo xtask dist` | Build release binary and copy it to `bin/yarr`. |
| `cargo xtask ci` | Run local CI sequence: fmt, clippy, tests, taplo, patterns, audit when tools exist. |
| `cargo xtask symlink-docs` | Create `AGENTS.md` and `GEMINI.md` symlinks next to each `CLAUDE.md`. |
| `cargo xtask check-env` | Validate required environment before server start. |
| `cargo xtask patterns` | Check static contracts derived from `docs/PATTERNS.md`. |
| `cargo xtask live --suite all` | Run the guarded backuphost-only live CLI, REST, MCP, and upstream service suite. |
| `cargo xtask backuphost <start\|stop\|status\|seed>` | Manage only the dedicated backuphost test-stack containers. |
| `cargo xtask tool-docs` | Generate `docs/TOOLS_ACTIONS_ENDPOINTS.md` from the action registry and endpoint mapping table. |

## Justfile delegates to xtask

```just
dist:
    cargo xtask dist
symlink-docs:
    cargo xtask symlink-docs
```

## Pattern checks

`cargo xtask patterns` verifies important architecture contracts:

- required template files exist
- no `mod.rs` files
- file size warnings and hard limits
- MCP/CLI shims remain thin (no business logic)
- action surfaces stay represented in schemas, help text, tests, and CLI
- routes, plugin manifests, auth config, and tooling hooks exist

`cargo xtask patterns --strict` treats warnings as failures.

## Tool Reference Generation

`cargo xtask tool-docs` regenerates `docs/TOOLS_ACTIONS_ENDPOINTS.md`.
The generator reads action names, params, scopes, and mutability from the Rust
action registry and renders endpoint mappings from the structured table in
`xtask/src/tool_docs.rs`.

```bash
cargo xtask tool-docs
cargo xtask tool-docs --check
```

### What the pattern checker catches

```
WARN  src/mcp/tools.rs  line 42: potential business logic in MCP shim
WARN  src/cli.rs  line 87: potential business logic in CLI shim
ERROR src/app/mod.rs: mod.rs files are banned
ERROR src/mcp/tools.rs: action "new_action" in ACTION_SPECS missing from dispatch
ERROR tests/tool_dispatch.rs: action "new_action" has no test
```

## symlink-docs

`cargo xtask symlink-docs` keeps `AGENTS.md` and `GEMINI.md` in sync with `CLAUDE.md` across every directory that has a `CLAUDE.md`:

```bash
find . -name "CLAUDE.md" -not -path "./.git/*" -not -path "./target/*" | while read f; do
    dir=$(dirname "$f")
    ln -sf "CLAUDE.md" "${dir}/AGENTS.md"
    ln -sf "CLAUDE.md" "${dir}/GEMINI.md"
done
```

Run `just symlink-docs` after adding any new `CLAUDE.md` file.

## check-env

`cargo xtask check-env` reports missing or misconfigured environment before startup:

```
✓ YARR_SERVICES:  sonarr,radarr (set)
✗ YARR_SONARR_URL: not set
  → Set YARR_SONARR_URL in ~/.yarr/.env or your environment
```

See `docs/PATTERNS.md` §24 and §48 for the xtask and doctor patterns.

## live

`cargo xtask live` is the canonical full live integration harness. It refuses to
run unless the effective Yarr configuration is the dedicated backuphost test
environment at `/home/jmagar/.yarr-backuphost` and every configured service URL
points at backuphost.

```bash
cargo xtask live --suite guard
cargo xtask live --suite cli
cargo xtask live --suite rest
cargo xtask live --suite mcp
cargo xtask live --suite mcporter
cargo xtask live --suite services
cargo xtask live --suite all
```

The full suite covers the live guard, CLI business commands, CLI infrastructure
commands, REST health/status/auth/OAuth metadata routes, MCP initialize/tools/
resources/prompts/tool calls, every generated OpenAPI callable through
mcporter/yarr, and every configured service matrix action. It writes
`target/live-full/report.json` with one semantic check record per executed
assertion.

Unless `YARR_BIN` is set, the live xtask builds and runs
`target/debug/yarr` from the current checkout. Use `YARR_BIN` only when
intentionally testing a specific prebuilt binary.

The required high-level surface markers live in `xtask/src/live/surface.rs`.
`cargo xtask live --suite all` verifies that every marker is actually recorded
in the report, so future changes cannot accidentally drop a CLI/API/MCP surface
without failing the live run.

Use the Just aliases `just live-full-guard`, `just live-full-cli`,
`just live-full-rest`, `just live-full-mcp`, `just live-full-mcporter`,
`just live-full-services`, and `just live-full-test` for the same commands.

## backuphost stack management

`start` and `seed` load and validate the canonical
`/home/jmagar/.yarr-backuphost/.env` guard before touching remote containers.
Recovery-oriented `status` and `stop` use the fixed deployment manifest and do
not require a healthy local application configuration:

```bash
cargo xtask backuphost start
cargo xtask backuphost stop
cargo xtask backuphost status --json
cargo xtask backuphost seed --dry-run
cargo xtask backuphost seed
```

`start` and `stop` act only on the 11 explicitly mapped container names.
`status` prints each container's Docker state and health and exits non-zero when
any container is missing, not running, or reports unhealthy; `--json` emits the same result plus
structured remote error details. `seed --dry-run` prints the resolved host,
environment, containers, restored datasets, and retained services without
making remote changes. A real `seed` preflights the complete fleet, then
sequentially restores every available
`backup/lab/live/golden/<service>@configured-v1` snapshot using the existing
reset machinery while the fleet is stopped. If a restore fails, the fleet stays
stopped for correction and rerun; otherwise it starts all containers and waits
under one fleet-wide deadline.
Bazarr and Tracearr currently have no golden and are explicitly reported as
retained rather than silently described as restored.

These commands intentionally do not start or stop the backuphost Unraid array. If
Docker or the backing datasets are unavailable, they fail with the remote error
instead of expanding their scope to host-level storage management. Equivalent
Just aliases are `just backuphost-start`, `just backuphost-stop`, `just backuphost-status`, and
`just backuphost-seed`.
