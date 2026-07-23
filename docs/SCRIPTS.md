---
title: "Scripts"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "project"
source_of_truth: false
upstream_refs:
  - "scripts/README.md"
last_reviewed: "2026-07-16"
---

# Scripts

Maintenance scripts live in `scripts/`. The authoritative per-script usage reference is `scripts/README.md`.

## Categories

| Category | Scripts |
|---|---|
| Release gates | `pre-release-check.sh`, `check-version-sync.sh`, `check-blob-size.py`, `check-coupled-files.sh` |
| Hygiene | `asciicheck.py`, `check-file-size.sh`, `block-env-commits.sh` |
| MCP/plugin validation | `check-schema-docs.py`, `validate-plugin-layout.sh`, `check-plugin-hook-contract.py`, `test-mcp-auth.sh` |
| Runtime/deploy | `check-runtime-current.sh`, `sync-cargo.sh`, `bump-version.sh` |
| Install | `install.sh` |
| Reference docs | `refresh-docs.sh` |
| Live tests | `live-read-smoke.sh` for legacy quick smoke; `cargo xtask live --suite all` for full guarded shart coverage |

## Important commands

```bash
scripts/pre-release-check.sh
scripts/pre-release-check.sh --mcporter   # include live MCP tests
cargo xtask live --suite all              # guarded shart live suite
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/scripts/install.sh | bash
scripts/refresh-docs.sh --dry-run
scripts/test-mcp-auth.sh --url http://localhost:40070/mcp --token <token>
```

## pre-release-check.sh

The full release gate. Runs:
1. `cargo xtask patterns`
2. plugin layout validation
3. schema docs validation
4. template feature smoke tests
5. version sync
6. blob-size check
7. ASCII hygiene
8. `just verify`

## refresh-docs.sh

Fetches fresh reference material into `docs/references/`:

- **Axon crawls** — `axon crawl <url> --wait --yes` → markdown into `docs/references/<target>/`
- **Repomix packs** — `repomix --remote <repo> --style xml` → XML snapshot
- **Change tracking** — sha256 checksums before/after; appends diff summary to `docs/references/CHANGES.md`

```bash
just refresh-docs              # full refresh
just refresh-docs-repomix      # skip crawl
just refresh-docs-crawl        # skip repomix
just refresh-docs-dry          # dry run (no mutations)
```

`docs/references/` is gitignored — content is large, auto-generated, and should be fetched fresh. Run when starting development on a new feature, when the service releases a new API version, or monthly.

## install.sh pattern

The install script validates the environment before installing:

```bash
preflight() {
    local errors=0

    # 1. OS / arch
    os="$(uname -s | tr '[:upper:]' '[:lower:]')"
    arch="$(uname -m)"
    [[ "${os}" == "linux" ]] || { echo "✗ Only Linux is supported"; (( errors++ )); }

    # 2. Required tools
    for cmd in curl tar grep; do
        command -v "${cmd}" >/dev/null || { echo "✗ ${cmd}: not found"; (( errors++ )); }
    done

    # 3. Disk space (need at least 50MB)
    free_mb="$(df -k "${HOME}" | awk 'NR==2{printf "%d", $4/1024}')"
    (( free_mb >= 50 )) || { echo "✗ Only ${free_mb}MB free (need 50MB)"; (( errors++ )); }

    return "${errors}"
}
```

One-line install:
```bash
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash
```

After install: `yarr doctor` to validate the environment.

## block-env-commits.sh

Prevents accidentally committing secret-bearing `.env` files. `.env.example`
is the tracked placeholder template; real `.env` variants remain untracked.

## Contract

- Scripts should be portable Bash or Python.
- Mutating scripts must be explicit about what they write.
- Release checks must be repeatable; plugin binaries are not generated or
  committed because manifests launch the pinned npm package.
- Keep `scripts/README.md` current when adding, renaming, or changing scripts.

See `docs/PATTERNS.md` §38 and §49 for the refresh-docs and install.sh patterns.
