#!/usr/bin/env bash
# Fail when common coupled files are changed without their companion updates.
set -euo pipefail

BASE="${1:-origin/main}"
HEAD="${2:-HEAD}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! git rev-parse --verify "$BASE" >/dev/null 2>&1; then
  BASE="HEAD~1"
fi

if [[ "$HEAD" == "WORKTREE" ]]; then
  mapfile -t CHANGED < <(git diff --name-only "$BASE")
else
  mapfile -t CHANGED < <(git diff --name-only "$BASE" "$HEAD")
fi

changed() {
  local pattern="$1"
  local file
  for file in "${CHANGED[@]}"; do
    # shellcheck disable=SC2053 # Intentional glob contract from COUPLED_PATTERNS.
    [[ "$file" == $pattern ]] && return 0
  done
  return 1
}

issues=()

legacy_owner="jmagar"
legacy_repo="yarr"
legacy_identity="${legacy_owner}/${legacy_repo}"
legacy_identity_matches="$(git grep -n "$legacy_identity" -- \
  ':!CHANGELOG.md' ':!docs/sessions/**' ':!openwiki/**' || true)"
if [[ -n "$legacy_identity_matches" ]]; then
  issues+=("Legacy publication identity remains outside historical migration records:\n$legacy_identity_matches")
fi

if changed "Justfile" && ! changed "lefthook.yml"; then
  issues+=("Justfile changed but lefthook.yml did not; confirm hook/recipe parity.")
fi

if changed "lefthook.yml" && ! changed "Justfile"; then
  issues+=("lefthook.yml changed but Justfile did not; confirm matching manual recipe exists.")
fi

if changed "scripts/*" && ! changed "scripts/README.md"; then
  issues+=("scripts changed but scripts/README.md did not; document new or changed script behavior.")
fi

if changed "src/mcp/schemas.rs" && ! changed "docs/MCP_SCHEMA.md"; then
  # docs/MCP_SCHEMA.md is generated from the action specs, so a formatting-only
  # change to schemas.rs (e.g. import reordering) leaves it byte-identical. Defer
  # to the authoritative generator check and only flag a genuine drift, so this
  # coupling does not false-positive on cosmetic edits.
  if ! python3 "$SCRIPT_DIR/check-schema-docs.py" --check >/dev/null 2>&1; then
    issues+=("src/mcp/schemas.rs changed and docs/MCP_SCHEMA.md is stale; run scripts/check-schema-docs.py --write.")
  fi
fi

if changed "plugins/yarr/*" && ! changed "docs/PLUGINS.md"; then
  issues+=("plugin package changed but docs/PLUGINS.md did not; confirm plugin docs are still current.")
fi

if (( ${#issues[@]} > 0 )); then
  printf 'Coupled-file check failed:\n' >&2
  printf '  - %s\n' "${issues[@]}" >&2
  exit 1
fi

printf 'Coupled-file check passed (%s..%s).\n' "$BASE" "$HEAD"
