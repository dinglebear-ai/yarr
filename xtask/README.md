# xtask

Repo automation commands, invoked via `cargo xtask <command>`. Replaces ad-hoc shell scripts with cross-platform Rust.

## Commands

### `cargo xtask ci`

Run all CI checks locally in the same order as `.github/workflows/ci.yml`. Stops on first failure.

| Step | Tool | Skipped if absent |
|---|---|---|
| 1/6 | `cargo fmt --check` | — |
| 2/6 | `cargo clippy -- -D warnings` | — |
| 3/6 | `cargo nextest run --profile ci` | falls back to `cargo test` |
| 4/6 | `taplo check` | yes |
| 5/6 | `cargo xtask patterns` | — |
| 6/6 | `cargo audit` | yes |

```bash
cargo xtask ci
# or via Justfile:
just ci
```

---

### `cargo xtask dist`

Build the release binary and copy it to `bin/` for Git LFS-tracked distribution.

1. Runs `cargo build --release --locked`
2. Copies the binary to `bin/<binary-name>` (creating `bin/` if needed)
3. Sets executable permissions on Unix
4. Prints the `git add` / `git commit` / `git push` instructions

```bash
cargo xtask dist
# or:
just dist
```

Respects `CARGO_TARGET_DIR` if set. After running, commit the updated `bin/` pointer and push to update LFS.

`BINARY_NAME` in `xtask/src/main.rs` must match the `[[bin]] name` in the root `Cargo.toml`.

---

### `cargo xtask symlink-docs`

Create `AGENTS.md` and `GEMINI.md` symlinks next to every `CLAUDE.md` in the repo (Pattern §32: single source of truth for AI documentation).

- Walks the entire repo, skipping `.git/` and `target/`
- For each `CLAUDE.md` found, creates two relative symlinks in the same directory:
  - `AGENTS.md → CLAUDE.md` (Codex / OpenAI agents)
  - `GEMINI.md → CLAUDE.md` (Google Gemini)
- Skips entries that already exist or are dangling symlinks
- Prints a created/skipped summary

```bash
cargo xtask symlink-docs
# or:
just symlink-docs
```

Symlinks use relative targets so they remain valid after `git clone`. Run this after adding any new `CLAUDE.md` file to the repo.

---

### `cargo xtask patterns`

Check high-signal static contracts from `docs/PATTERNS.md`.

```bash
cargo xtask patterns
cargo xtask patterns --strict
cargo xtask patterns --json
# or:
just patterns-check
just patterns-strict
just patterns-json
```

The checker enforces required files, modern Rust module layout (`no mod.rs`), thin MCP/CLI shims, CLI/API/MCP/web surface-thinness heuristics, action schema/help/test/CLI surface drift, plugin manifest version rules, binary-owned plugin hook constraints, auth/config basics, route presence, and tooling hooks.

File-size target overages are warnings until they exceed a hard limit, so existing borderline modules do not block unrelated work. Use `--strict` to fail on warnings for newly adapted servers or cleanup branches. Use `--json` for machine-readable output in dashboards or CI annotations.

---

### `cargo xtask check-env`

Validate environment variables before starting the server. Prints the status of every required and optional variable, then exits non-zero if any required variable is missing.

```bash
cargo xtask check-env
# or:
just check-env
```

Yarr output:

```
[OK]      YARR_MCP_TOKEN   — Static bearer token for MCP auth
[WARN]    YARR_SERVICES    — No media services configured

Copy .env.example to .env and fill in YARR_SERVICES plus per-service URL/key variables.
```

---

### `cargo xtask shart`

Manage only the dedicated shart test-stack containers:

```bash
cargo xtask shart start
cargo xtask shart stop
cargo xtask shart status --json
cargo xtask shart seed --dry-run
cargo xtask shart seed
```

`start` and `seed` validate `/home/jmagar/.yarr-shart/.env`; recovery-oriented
`status` and `stop` use the fixed deployment manifest without requiring healthy
app configuration. `seed --dry-run` shows the resolved destructive plan. A real
seed preflights and restores the established `configured-v1` ZFS snapshots with
a fleet-quiesced, fail-closed recovery policy. The restore is sequential and can
leave some datasets restored if a later step fails; the fleet stays stopped so
the operator can correct the failure and rerun it. It explicitly reports
retained non-golden services, starts the fleet after a successful restore, and
waits under one deadline. These commands never start or stop the broader Unraid
array.

---

## Design notes

- **Minimal dependencies**: keep automation dependencies focused and reuse workspace/transitive libraries only through explicit declarations.
- **Workspace root awareness**: all commands `cd` to the workspace root via `CARGO_MANIFEST_DIR` before running, so they work from any subdirectory.
- **Delegation pattern**: shells out to external tools when useful (`cargo`, `taplo`, etc.) and implements repo-specific contract checks directly in Rust.
- **Optional tools**: `ci` gracefully skips `nextest`, `taplo`, and `cargo-audit` if they are not installed, so the command is always runnable on a fresh checkout.

## Adding a new command

1. Add a focused `xtask/src/your_command.rs` module with `run(&[String]) -> anyhow::Result<()>` and a sibling `your_command_tests.rs`.
2. Declare the module and add a match arm in `main()`:
   ```rust
   Some("your-command") => your_command(),
   ```
3. Add it to the `print_help()` output.
4. Optionally add a `just` recipe in the root `Justfile`.
