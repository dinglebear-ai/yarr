---
title: "Pre-commit"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "Pre-commit Hooks"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "template"
source_of_truth: false
last_reviewed: "2026-05-15"
---

# Pre-commit

The repo uses `lefthook` for lightweight pre-commit checks. Install hooks with:

```bash
just install-hooks
```

Remove them with:

```bash
just uninstall-hooks
```

## Philosophy

Pre-commit checks must be FAST and NON-BLOCKING for developer flow. Heavy checks live in CI, not pre-commit. **Commit early, commit often** — a pre-commit that takes 30 seconds kills momentum.

Only block on things that catch secrets or obviously broken syntax:

```
NOT in pre-commit (too slow / too blocking):
  - cargo clippy  → CI only
  - cargo test    → CI only
  - cargo nextest → CI only
  - cargo fmt check → CI only
```

## lefthook.yml

```yaml
pre-commit:
  parallel: true
  commands:
    # Fast: just check for obvious problems
    diff_check:
      run: git --no-pager diff --check --cached
    toml_fmt:
      glob: "*.toml"
      run: taplo check {staged_files}
    env_guard:
      run: bash scripts/block-env-commits.sh  # prevents committing .env with secrets
```

## Hook scripts

| Script | Purpose |
|---|---|
| `scripts/block-env-commits.sh` | Blocks staged secret-bearing `.env*` files; `.env.example` is the tracked placeholder template. |
| `scripts/check-version-sync.sh` | Ensures version-bearing files agree. |
| `scripts/check-file-size.sh` | Warns/fails on staged files above size budgets. |
| `taplo check` | Checks TOML formatting (runs on every `.toml` in the commit). |

## taplo configuration

```toml
# taplo.toml
[formatting]
align_entries = false
array_trailing_comma = true
array_auto_expand = true
array_auto_collapse = true
compact_arrays = true
compact_inline_tables = false
column_width = 100
indent_string = "  "
trailing_newline = true
allowed_blank_lines = 1
```

Install: `cargo install taplo-cli` or `mise use taplo`.

## No mod.rs enforcement

A pre-commit hook also blocks `mod.rs` files:

```sh
mod_rs_files=$(git diff --cached --name-only | grep '/mod\.rs$\|^mod\.rs$')
if [ -n "$mod_rs_files" ]; then
  echo "error: mod.rs is banned. Use foo.rs + foo/ instead of foo/mod.rs." >&2
  exit 1
fi
```

## Manual equivalents

```bash
bash scripts/block-env-commits.sh
bash scripts/check-version-sync.sh
bash scripts/check-file-size.sh
taplo check
```

Full release confidence comes from `scripts/pre-release-check.sh`, not from blocking every commit with long builds.

## .gitignore rules

Use the canonical `.gitignore` from syslog-mcp as the base:

- `.env` and secret-bearing `.env.*` ignored; `.env.example` committed
- `target/` ignored
- `*.db`, `*.db-shm`, `*.db-wal` ignored
- AI tooling dirs ignored (`.claude/`, `.omc/`, `.lavra/`, etc.)
- `bin/` **NOT** ignored — LFS-tracked plugin binaries are committed

## .dockerignore rules

- `target/` excluded (built inside the container)
- `tests/`, `docs/`, `scripts/`, `*.md` excluded (not needed at runtime)
- `.env`, `.env.*` excluded (injected at runtime via `env_file`)
- `Justfile`, `lefthook.yml` excluded
- Never exclude: `src/`, `Cargo.toml`, `Cargo.lock`, `config/`

See `docs/PATTERNS.md` §29, §30, §33 for the taplo, lefthook, and ignore file patterns.
