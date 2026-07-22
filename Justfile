# =============================================================================
# Justfile — Development and deployment commands for the Yarr MCP server
#
# Yarr uses MCP HTTP port 40070 by default.
#
# Usage: just <recipe>
# =============================================================================

# List all available recipes
default:
    @just --list

# ── Development ───────────────────────────────────────────────────────────────

# Run the MCP server in development mode (HTTP transport 40070, no auth)
# WARNING: YARR_MCP_NO_AUTH=true is safe only because HOST is 127.0.0.1 (loopback)
dev:
    YARR_MCP_HOST=127.0.0.1 YARR_MCP_PORT=40070 YARR_MCP_NO_AUTH=true cargo run -- serve mcp

# Run in stdio MCP transport mode (for Claude Desktop or direct pipe)
mcp:
    cargo run -- mcp

# Run a quick CLI inventory check (smoke test without a running server)
integrations:
    cargo run -- integrations

# Run the doctor pre-flight check
doctor:
    cargo run -- doctor

# Run live read-only checks against the configured environment
live-read-smoke:
    bash scripts/live-read-smoke.sh

# Run only the shart live guard.
live-full-guard:
    cargo xtask live --suite guard

# Run the complete shart live CLI surface.
live-full-cli:
    cargo xtask live --suite cli

# Run the complete shart live REST surface.
live-full-rest:
    cargo xtask live --suite rest

# Run the complete shart live MCP surface.
live-full-mcp:
    cargo xtask live --suite mcp

# Run every generated OpenAPI callable through mcporter/yarr against shart.
live-full-mcporter:
    cargo xtask live --suite mcporter

# Run the complete shart live service action matrix.
live-full-services:
    cargo xtask live --suite services

# Run the full shart-only live suite.
live-full-test:
    cargo xtask live --suite all

# Start the dedicated shart test stack and wait for every service.
shart-start:
    cargo xtask shart start

# Stop only the dedicated shart test-stack containers.
shart-stop:
    cargo xtask shart stop

# Show shart test-stack container state and health (`cargo xtask shart status --json` for JSON).
shart-status:
    cargo xtask shart status

# Restore shart's configured-v1 golden data (`cargo xtask shart seed --dry-run` to preview).
shart-seed:
    cargo xtask shart seed

# ── Building ──────────────────────────────────────────────────────────────────

# Compile debug build (fast, includes debug symbols)
build:
    cargo build

# Compile optimized release build (slower compile, much faster runtime)
build-release:
    cargo build --release

# Compile optimized release build (short alias used across the Rust server repos)
release: build-release

# Build the release binary and sync it to local runtime targets.
release-sync: build-release
    just link-bin
    just sync-container

# ── Code quality ──────────────────────────────────────────────────────────────

# Run cargo check (fast syntax/type check, no binary output)
check:
    cargo check

# Check Rust formatting without modifying files (used in CI + lefthook)
fmt-check:
    cargo fmt -- --check

# Run the full test suite using cargo-nextest (faster, better output than cargo test)
test:
    cargo nextest run

# Run tests with the CI profile (fail-fast, 2 retries — mirrors CI)
test-ci:
    cargo nextest run --profile ci

# Run clippy with warnings as errors (matches CI)
lint:
    cargo clippy --all-targets -- -D warnings

# Format all Rust source files
fmt:
    cargo fmt

# Auto-fix clippy warnings and format in one pass
fix:
    cargo fmt
    cargo clippy --fix --all-targets --allow-dirty --allow-staged

# Format all TOML files (requires taplo from mise)
fmt-toml:
    taplo format

# Check TOML format without modifying files (used in CI + lefthook)
check-toml:
    taplo check

# Run license, vulnerability, and source checks (requires cargo-deny from mise)
deny:
    bash scripts/check-security-exceptions.sh
    cargo deny check

# Watch Rust checks interactively (requires bacon from mise)
watch:
    bacon

# Generate Rust coverage report (requires cargo-llvm-cov)
test-cov:
    cargo llvm-cov --html --workspace --all-features

# Report dependency updates without modifying Cargo.lock
deps-check:
    bash scripts/check-dependency-updates.sh

# Fail if changed blobs exceed the repo size budget
blob-size-check:
    python3 scripts/check-blob-size.py

# Check coupled files such as Justfile/lefthook and scripts/docs
coupled-files-check:
    bash scripts/check-coupled-files.sh

# Check tracked source/config/docs for non-ASCII characters
ascii-check:
    bash scripts/run-ascii-check.sh

# Replace common smart punctuation with ASCII in tracked source/config/docs
ascii-fix:
    bash scripts/run-ascii-check.sh --fix

# Check staged source files against line-count budgets
file-size-check:
    bash scripts/check-file-size.sh

# Regenerate MCP schema contract docs from src/mcp/schemas.rs
schema-docs:
    python3 scripts/check-schema-docs.py --write

# Verify MCP schema contract docs and action surfaces are in sync
schema-docs-check:
    python3 scripts/check-schema-docs.py --check

# Check static contracts from docs/PATTERNS.md
patterns-check:
    cargo xtask patterns

# Check PATTERNS.md contracts and fail on warnings
patterns-strict:
    cargo xtask patterns --strict

# Emit PATTERNS.md contract findings as JSON
patterns-json:
    cargo xtask patterns --json

# Run shell/Rust-adjacent template invariant smoke tests
template-features:
    bash scripts/test-template-features.sh

# Run fast template-specific checks
template-check:
    just patterns-check
    just validate-plugin
    just schema-docs-check
    just template-features

# Run all local quality checks in sequence: fmt-check → lint → check → test
verify:
    just fmt-check
    just lint
    just check
    just test

# Run all quality checks in sequence (mirrors CI pipeline)
# Delegates to cargo xtask ci for the full suite (fmt, clippy, nextest, taplo, audit)
ci:
    cargo xtask ci

# Remove build artifacts and generated files
clean:
    cargo clean
    rm -rf .cache/ dist/

# ── xtask automation ─────────────────────────────────────────────────────────

# Local operator convenience: build the release binary and copy it to dist/.
# GitHub releases publish binaries as artifacts; this recipe does not update main.
dist:
    cargo xtask dist

# Create AGENTS.md and GEMINI.md symlinks next to every CLAUDE.md in the repo.
# Pattern §32: CLAUDE.md is the single source of truth for project instructions.
# Run after adding any new CLAUDE.md file.
symlink-docs:
    cargo xtask symlink-docs

# Inline version of symlink-docs — no xtask required.
# TEMPLATE: Use this if xtask is unavailable (e.g. before first cargo build).
symlink-docs-inline:
    find . -name "CLAUDE.md" -not -path "./.git/*" -not -path "./target/*" \
        -exec sh -c 'dir=$(dirname "$1"); ln -sf CLAUDE.md "${dir}/AGENTS.md"; ln -sf CLAUDE.md "${dir}/GEMINI.md"; echo "  link ${dir}/AGENTS.md + ${dir}/GEMINI.md"' _ {} \;

# Validate required environment variables are set before starting the server.
check-env:
    cargo xtask check-env

# Generate the tool/action/endpoint reference doc.
tool-docs:
    cargo xtask tool-docs

# Check that the generated tool/action/endpoint reference is current.
tool-docs-check:
    cargo xtask tool-docs --check

# Install lefthook git hooks
install-hooks:
    lefthook install

# Uninstall lefthook git hooks
uninstall-hooks:
    lefthook uninstall

# ── Utilities ─────────────────────────────────────────────────────────────────

# Generate a cryptographically random bearer token for YARR_MCP_TOKEN
# Copy the output into your .env file
gen-token:
    openssl rand -hex 32

# Copy .env.example to .env (safe — won't overwrite an existing .env)
setup:
    cp -n .env.example .env || echo ".env already exists — skipping"
    @echo "Edit .env and fill in your credentials"

# ── Docker ────────────────────────────────────────────────────────────────────

# Build the Docker image from source (does not start the container)
docker-build:
    docker build -f config/Dockerfile -t yarr-mcp .

# Start the Docker Compose stack in detached mode
# TEMPLATE: The compose file references the "jakenet" external network.
#           Create it first if it doesn't exist: docker network create jakenet
docker-up:
    docker compose up -d

# Stop and remove the Docker Compose stack (data volume persists)
docker-down:
    docker compose down

# Short alias for docker-up
up: docker-up

# Short alias for docker-down
down: docker-down

# Restart the running container (faster than down+up; no image rebuild)
restart:
    docker compose restart

# Rebuild the Docker image from source and restart the stack
docker-rebuild:
    docker compose build --no-cache
    docker compose up -d --force-recreate

# Fast release binary + Compose container sync.
sync-container:
    #!/usr/bin/env bash
    set -euo pipefail
    if command -v mold >/dev/null 2>&1; then
      export RUSTFLAGS="${RUSTFLAGS:-} -C link-arg=-fuse-ld=mold"
    fi

    repo="$(pwd)"
    profile="release"
    YARR_TARGET_DIR="${CARGO_TARGET_DIR:-target}"
    case "$YARR_TARGET_DIR" in
      /*) YARR_BIN="$YARR_TARGET_DIR/$profile/yarr" ;;
      *)  YARR_BIN="$repo/$YARR_TARGET_DIR/$profile/yarr" ;;
    esac

    release_stale=0
    if [ ! -x "$YARR_BIN" ]; then
      release_stale=1
    else
      while IFS= read -r -d '' input; do
        if [ "$input" -nt "$YARR_BIN" ]; then
          release_stale=1
          break
        fi
      done < <(git ls-files -z -- Cargo.toml Cargo.lock .cargo src)
    fi
    if [ "$release_stale" -eq 1 ]; then
      cargo build --release --locked -p yarr
    else
      echo "release binary is current: $YARR_BIN"
    fi

    just link-bin "$profile"

    compose=(docker compose)
    container_sentinel="$YARR_TARGET_DIR/.yarr-container-built"
    image_stale=0
    if ! docker image inspect yarr:dev >/dev/null 2>&1; then
      image_stale=1
    elif [ ! -f "$container_sentinel" ]; then
      image_stale=1
    else
      while IFS= read -r -d '' input; do
        if [ "$input" -nt "$container_sentinel" ]; then
          image_stale=1
          break
        fi
      done < <(git ls-files -z -- config/Dockerfile docker-compose.yml docker-compose.prod.yml entrypoint.sh Cargo.toml Cargo.lock src xtask/Cargo.toml)
    fi
    if [ "$image_stale" -eq 1 ]; then
      DOCKER_BUILDKIT=1 "${compose[@]}" build yarr-mcp
      mkdir -p "$(dirname "$container_sentinel")"
      touch "$container_sentinel"
      "${compose[@]}" up -d yarr-mcp --no-deps --no-build
    else
      echo "dev runtime image is current"
      "${compose[@]}" up -d yarr-mcp --no-deps --no-build
    fi
    "${compose[@]}" restart yarr-mcp
    "${compose[@]}" ps yarr-mcp
    echo "container synced"

# Backward-compatible alias used across sibling repos.
container-sync: sync-container

# Follow Docker container logs
docker-logs:
    docker compose logs -f

# Short alias for docker-logs
logs:
    docker compose logs -f

# ── Health & diagnostics ──────────────────────────────────────────────────────

# Check the MCP server health endpoint (no auth required)
# TEMPLATE: Change port 40070 if you use a different port
health:
    #!/usr/bin/env bash
    set -euo pipefail
    if command -v jq >/dev/null 2>&1; then
        curl -sf http://localhost:40070/health | jq .
    else
        curl -sf http://localhost:40070/health | python3 -m json.tool
    fi

# Verify that the running Docker/systemd service matches the current artifact
runtime-current:
    bash scripts/check-runtime-current.sh --expected-binary target/release/yarr

# Smoke-test the protected MCP HTTP auth path (requires running bearer-auth server)
auth-smoke:
    bash scripts/test-mcp-auth.sh

# Call the status action via the REST API (requires YARR_MCP_TOKEN in env)
status:
    #!/usr/bin/env bash
    set -euo pipefail
    TOKEN="${YARR_MCP_TOKEN:-}"
    if [[ -z "${TOKEN}" ]]; then
        echo "Set YARR_MCP_TOKEN or use 'just dev' (no-auth mode)"
        exit 1
    fi
    curl -sf http://localhost:40070/mcp \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"yarr","arguments":{"action":"status"}}}' \
        | { if command -v jq >/dev/null 2>&1; then jq .; else python3 -m json.tool; fi; }

# ── Plugin ────────────────────────────────────────────────────────────────────

# Repair: stop, rebuild, and restart via systemd user unit or Docker Compose
repair:
    bash scripts/repair.sh

# Install the release binary on the local PATH. Plugin manifests use the pinned
# yarr-mcp npm launcher and never copy or commit this host-specific artifact.
install: install-local

# Symlink the compiled release binary into PATH for local runtime smoke tests.
# Safe to call manually after `cargo build --release`.
link-bin profile="release":
    #!/usr/bin/env bash
    set -euo pipefail
    profile="{{profile}}"
    YARR_TARGET_DIR="${CARGO_TARGET_DIR:-target}"
    case "$YARR_TARGET_DIR" in
      /*) YARR_BIN="$YARR_TARGET_DIR/$profile/yarr" ;;
      *)  YARR_BIN="$(pwd)/$YARR_TARGET_DIR/$profile/yarr" ;;
    esac
    if [ ! -x "$YARR_BIN" ]; then
      echo "$profile binary not found at $YARR_BIN — run the matching build first" >&2
      exit 1
    fi
    mkdir -p ~/.local/bin
    ln -sf "$YARR_BIN" ~/.local/bin/yarr
    echo "yarr -> $YARR_BIN"

# Install the release binary on the local PATH for runtime smoke testing
install-local: build-release
    just link-bin

# Build and install the release binary on the local PATH.
install-release: build-release
    just link-bin

# Validate all plugin manifests, MCP config, hooks, and skills
validate-plugin:
    bash scripts/validate-plugin-layout.sh

# Validate the independent Unraid plugin filesystem and release contracts.
unraid-test:
    bash unraid-plugin/tests/run.sh

# Validate all plugin skills have required SKILL.md fields
validate-skills: validate-plugin

# ── mcporter ─────────────────────────────────────────────────────────────────

# Run live MCP transport tests against the shart live stack. The legacy per-service
# mcporter suite was retired (single yarr tool now); this runs the in-process `mcp` suite.
test-mcporter: build-release
    cargo xtask live --suite mcp

# Run the release-readiness gate
pre-release:
    bash scripts/pre-release-check.sh

# Generate a standalone CLI for this server via mcporter (requires running server)
# TEMPLATE: Update port and token env var name in scripts/generate-cli.sh
generate-cli:
    bash scripts/generate-cli.sh

# ── Publishing ────────────────────────────────────────────────────────────────

# Bump the crate version using cargo-edit and regenerate Cargo.lock.
# Requires cargo-edit from mise
bump-version version:
    cargo set-version {{version}}
    cargo generate-lockfile

# Bump version, tag, and push (triggers CI publish workflow)
# Updates Cargo.toml + Cargo.lock only — plugin manifests have no version field
# (GitHub SHA is the version for plugins; every push is a new release automatically)
# TEMPLATE: Requires main branch + clean working tree
publish bump="patch":
    #!/usr/bin/env bash
    set -euo pipefail
    [ "$(git branch --show-current)" = "main" ] || { echo "Switch to main first"; exit 1; }
    [ -z "$(git status --porcelain)" ] || { echo "Commit or stash changes first"; exit 1; }
    git pull origin main
    CURRENT=$(grep -m1 "^version" Cargo.toml | sed 's/.*"\(.*\)".*/\1/')
    IFS="." read -r major minor patch <<< "${CURRENT}"
    case "{{bump}}" in
      major) major=$((major+1)); minor=0; patch=0 ;;
      minor) minor=$((minor+1)); patch=0 ;;
      patch) patch=$((patch+1)) ;;
      *) echo "Usage: just publish [major|minor|patch]"; exit 1 ;;
    esac
    NEW="${major}.${minor}.${patch}"
    echo "Version: ${CURRENT} → ${NEW}"
    just bump-version "${NEW}"
    git add -A && git commit -m "release: v${NEW}" && git tag "v${NEW}" && git push origin main --tags
    echo "Tagged v${NEW} — publish workflow will run automatically"

# ── Reference docs ────────────────────────────────────────────────────────────

# Refresh local reference documentation (crawls + repomix)
refresh-docs:
    bash scripts/refresh-docs.sh

# Refresh docs — repomix packs only (no crawl)
refresh-docs-repomix:
    bash scripts/refresh-docs.sh --skip-crawl

# Refresh docs — crawl only (no repomix)
refresh-docs-crawl:
    bash scripts/refresh-docs.sh --skip-repomix

# Dry-run: print what would be refreshed
refresh-docs-dry:
    bash scripts/refresh-docs.sh --dry-run
