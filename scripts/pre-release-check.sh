#!/usr/bin/env bash
# Run the template release-readiness gate.
set -euo pipefail

RUN_VERIFY=true
RUN_MCPORTER=false

usage() {
  cat <<'EOF'
Usage: scripts/pre-release-check.sh [OPTIONS]

Options:
  --skip-verify        Skip `just verify`.
  --mcporter           Also run `just test-mcporter` (requires running server).
  -h, --help           Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-verify) RUN_VERIFY=false; shift ;;
    --mcporter) RUN_MCPORTER=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

PASS=0
FAIL=0
FAILED_CHECKS=()

run_check() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  if "$@"; then
    printf 'PASS %s\n' "$label"
    PASS=$((PASS + 1))
  else
    printf 'FAIL %s\n' "$label" >&2
    FAILED_CHECKS+=("$label")
    FAIL=$((FAIL + 1))
  fi
}

run_check "PATTERNS.md contracts" cargo xtask patterns
run_check "plugin layout" just validate-plugin
run_check "npm package" node packages/yarr-mcp/scripts/check-package.js
run_check "schema docs" python3 scripts/check-schema-docs.py --check
run_check "documentation links" python3 scripts/check-doc-links.py
run_check "template feature smoke" bash scripts/test-template-features.sh
run_check "version sync" bash scripts/check-version-sync.sh
run_check "blob size" python3 scripts/check-blob-size.py
run_check "ascii hygiene" just ascii-check

if [[ "$RUN_VERIFY" == true ]]; then
  run_check "quality gate" just verify
fi

if [[ "$RUN_MCPORTER" == true ]]; then
  run_check "mcporter integration" just test-mcporter
fi

printf '\n== Results ==\n'
printf 'Passed: %d\nFailed: %d\n' "$PASS" "$FAIL"
if (( FAIL > 0 )); then
  printf 'Failed checks:\n' >&2
  printf '  - %s\n' "${FAILED_CHECKS[@]}" >&2
  exit 1
fi

printf 'Release gate passed.\n'
