#!/usr/bin/env bash
# Proves scripts/kache-gate.sh actually rejects a degraded build, and that its
# baseline-and-diff scoping works.
#
# A gate that only ever passes is worse than no gate: it converts "the cache
# broke" into "CI is green". A gate that always FAILS is just as bad -- people
# learn to ignore it. Both directions are tested here.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
gate="$here/kache-gate.sh"

fail() { echo "SELFTEST FAIL: $*" >&2; exit 1; }

[ -x "$gate" ] || fail "gate script missing or not executable: $gate"

probe="$(mktemp -d)"
trap 'rm -rf "$probe"' EXIT

baseline="$probe/baseline.json"

# Env assignments go in "$@" (before the script); script flags go in $GATE_ARGS
# (after it). Passing a flag through "$@" would make `env` consume it.
gate_run() {
  set +e
  env KACHE_CACHE_DIR="$probe/store" KACHE_GATE_ROOT="$probe/cold" \
      KACHE_GATE_BASELINE="$baseline" "$@" "$gate" ${GATE_ARGS:-}
  local rc=$?
  set -e
  return "$rc"
}

take_baseline() { GATE_ARGS=--baseline gate_run; }

cargo new --lib --quiet "$probe/cold" >/dev/null

# --- Snapshot BEFORE the build. The gate diffs against this, because
# `kache report --since` does not bound the event window in 0.12.0 and the
# summary counters are cumulative over the whole event log.
take_baseline >/dev/null || fail "--baseline failed"
[ -s "$baseline" ] || fail "--baseline wrote no snapshot"
echo "ok: baseline written"

# --- A build into an ISOLATED, EMPTY store with NO remote: every unit is a
# cold miss. 0% hit rate, 0 remote hits -- a genuine degraded profile.
# KACHE_EVENT_ROOT pins the root stamped on events so --root matches exactly.
(
  cd "$probe/cold"
  KACHE_CACHE_DIR="$probe/store" KACHE_EVENT_ROOT="$probe/cold" cargo build --quiet
)

echo "--- expect REJECT: 50% floor against an all-miss build ---"
if gate_run KACHE_GATE_MIN_HIT_RATE=50; then
  fail "gate PASSED an all-miss build against a 50% floor"
fi
echo "ok: gate rejected the sub-floor hit rate"

echo "--- expect REJECT: remote required but none configured ---"
if gate_run KACHE_GATE_MIN_HIT_RATE=0 KACHE_GATE_REQUIRE_REMOTE=1; then
  fail "gate PASSED with REQUIRE_REMOTE=1 and zero remote hits"
fi
echo "ok: gate rejected zero remote hits"

echo "--- expect ACCEPT: floor of 0, nothing required ---"
if ! gate_run KACHE_GATE_MIN_HIT_RATE=0; then
  fail "gate REJECTED a build that violates no configured rule"
fi
echo "ok: gate accepted when no rule applies"

# --- The regression that the pre-diff gate would have failed forever.
# Re-baseline at the CURRENT counters, then run the gate with no build in
# between. Whatever errors/misses the store has accumulated are now in the
# baseline, so every delta is zero and a strict gate must still pass.
echo "--- expect ACCEPT: historical errors, none added by this build ---"
take_baseline >/dev/null || fail "re-baseline failed"
if ! gate_run KACHE_GATE_MIN_HIT_RATE=90 KACHE_GATE_REQUIRE_REMOTE=1; then
  fail "gate REJECTED a no-op build over counters that were already in the baseline"
fi
echo "ok: gate scoped to this build, not the whole event log"

# --- Missing baseline must warn, not silently measure all history.
echo "--- expect WARNING: no baseline present ---"
rm -f "$baseline"
set +e
missing_out="$(gate_run KACHE_GATE_MIN_HIT_RATE=0 2>&1)"
set -e
case "$missing_out" in
  *"no baseline"*) : ;;
  *) fail "gate did not warn when the baseline was missing" ;;
esac
echo "ok: gate warned about the missing baseline"

echo "SELFTEST PASS"
