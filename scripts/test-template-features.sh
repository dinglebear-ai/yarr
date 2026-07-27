#!/usr/bin/env bash
# Smoke-test template invariants that are awkward to express as unit tests.
set -euo pipefail

PASS=0
FAIL=0
TMPDIR_ROOT=""
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  [[ -n "$TMPDIR_ROOT" ]] && rm -rf "$TMPDIR_ROOT"
}
trap cleanup EXIT

pass() {
  printf 'PASS  %s\n' "$1"
  PASS=$((PASS + 1))
}

fail() {
  printf 'FAIL  %s\n' "$1" >&2
  FAIL=$((FAIL + 1))
}

expect_ok() {
  local label="$1"
  shift
  local output
  if output="$("$@" 2>&1)"; then
    pass "$label"
  else
    fail "$label ($(printf '%s' "$output" | tr -d '\n' | cut -c1-200))"
  fi
}

expect_fail() {
  local label="$1"
  shift
  local output
  if output="$("$@" 2>&1)"; then
    fail "$label (unexpected success)"
  else
    pass "$label"
  fi
}

TMPDIR_ROOT="$(mktemp -d)"
git init -q "$TMPDIR_ROOT/repo"

(
  cd "$TMPDIR_ROOT/repo"
  git config user.email test@yarr.invalid
  git config user.name "Template Test"
  cp "$REPO_ROOT/scripts/block-env-commits.sh" .
  printf 'safe=true\n' > .env.example
  printf 'secret=true\n' > .env.yarr
  printf 'secret=true\n' > .env
  git add -f .env.example .env.yarr .env
)
if (cd "$TMPDIR_ROOT/repo" && bash ./block-env-commits.sh >/dev/null 2>&1); then
  fail "env guard blocks staged .env (unexpected success)"
else
  pass "env guard blocks staged .env"
fi
(
  cd "$TMPDIR_ROOT/repo"
  git reset -q .env .env.yarr
)
if (cd "$TMPDIR_ROOT/repo" && bash ./block-env-commits.sh >/dev/null 2>&1); then
  pass "env guard allows .env.example"
else
  fail "env guard allows .env.example"
fi

mkdir -p "$TMPDIR_ROOT/docs/nested"
printf '# Root\n' > "$TMPDIR_ROOT/CLAUDE.md"
printf '# Nested\n' > "$TMPDIR_ROOT/docs/nested/CLAUDE.md"
if (
  cd "$TMPDIR_ROOT"
  find . -name "CLAUDE.md" -not -path "./.git/*" -not -path "./target/*" \
    -exec sh -c 'dir=$(dirname "$1"); ln -sf CLAUDE.md "${dir}/AGENTS.md"; ln -sf CLAUDE.md "${dir}/GEMINI.md"' _ {} \;
  [[ -L AGENTS.md && -L GEMINI.md && -L docs/nested/AGENTS.md && -L docs/nested/GEMINI.md ]]
); then
  pass "symlink-docs inline pattern creates AGENTS/GEMINI links"
else
  fail "symlink-docs inline pattern creates AGENTS/GEMINI links"
fi

expect_ok "plugin layout validator passes" bash scripts/validate-plugin-layout.sh
expect_ok "schema docs checker passes" python3 scripts/check-schema-docs.py --check
expect_ok "documentation link checker passes" python3 scripts/check-doc-links.py

mkdir -p "$TMPDIR_ROOT/link-repo/scripts"
(
  cd "$TMPDIR_ROOT/link-repo"
  git init -q
  git config user.email test@yarr.invalid
  git config user.name "Template Test"
  printf "# Broken\n\n[missing](missing.md)\n" > README.md
  git add README.md
)
expect_fail "documentation link checker rejects missing targets" \
  python3 scripts/check-doc-links.py --root "$TMPDIR_ROOT/link-repo"

expect_ok "Trivy SARIF keeps the HIGH/CRITICAL gate" bash -c '
  grep -Eq "^[[:space:]]+severity: CRITICAL,HIGH$" .github/workflows/docker-publish.yml
  grep -Eq "^[[:space:]]+limit-severities-for-sarif: true$" .github/workflows/docker-publish.yml
'
# shellcheck disable=SC2016 # The child shell expands its own positional args.
expect_ok "ascii checker catches allowed repo glyphs cleanly" bash -c '
  set -euo pipefail
  mapfile -t files < <(
    git ls-files "*.md" "*.rs" "*.toml" "*.json" "*.yml" "*.yaml" "*.sh" "*.py" ":!:docs/references/**" ":!:docs/sessions/**" ":!:specs/**" \
      | while IFS= read -r file; do [[ -f "$file" ]] && printf "%s\n" "$file"; done
  )
  python3 scripts/asciicheck.py "${files[@]}"
'

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
