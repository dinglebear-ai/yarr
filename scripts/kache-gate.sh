#!/usr/bin/env bash
# kache-gate.sh -- fail the build when the compiler cache silently degrades.
#
# WHY THIS EXISTS
# kache never fails a build on a cache problem (0.12.0 PR #600, "never fail a
# build on remote config"). A dead daemon, an unreachable remote, or a
# mis-normalized cache key all present as a green, slow build. soldr degraded
# exactly this way for a full day before anyone noticed. This gate converts
# those into a red job.
#
# WHY BASELINE-AND-DIFF INSTEAD OF `--since`
# `kache report --since` does NOT bound the event window in 0.12.0. Measured
# 2026-07-29 on soma: `--since 1m` and `--since 24h` returned counts differing
# by 2 out of 6,656, and a `--since 1m` query reported a timeline spanning 32
# minutes. The summary counters are cumulative over the whole event log.
#
# Consequences if a gate trusted `--since`:
#   * `errors > 0` goes permanently red after ONE historical store failure
#   * `remote_hits > 0` passes forever after ONE historical remote hit
#   * the hit-rate floor measures all history, not this build
#
# So the gate snapshots the cumulative counters BEFORE the build and diffs
# against them after. That is exact rather than time-windowed, and stays
# correct if upstream later fixes `--since`.
#
# USAGE
#   kache-gate.sh --baseline     # before the build: snapshot the counters
#   kache-gate.sh                # after the build: diff and enforce
#
# Environment:
#   KACHE_GATE_BASELINE       snapshot path  (default $RUNNER_TEMP|/tmp /kache-gate-baseline.json)
#   KACHE_GATE_MIN_HIT_RATE   integer percent floor, on THIS build's delta  (default 0)
#   KACHE_GATE_REQUIRE_REMOTE 1 => require new remote hits this build       (default 0)
#   KACHE_GATE_REQUIRE_DAEMON 1 => require a reachable daemon               (default 0)
#   KACHE_GATE_ROOT           build tree to scope to  (default $PWD; --root DOES work)
#
# Exit: 0 pass / 1 gate violation / 2 report unusable
set -uo pipefail

BASELINE="${KACHE_GATE_BASELINE:-${RUNNER_TEMP:-/tmp}/kache-gate-baseline.json}"
MIN_HIT_RATE="${KACHE_GATE_MIN_HIT_RATE:-0}"
REQUIRE_REMOTE="${KACHE_GATE_REQUIRE_REMOTE:-0}"
REQUIRE_DAEMON="${KACHE_GATE_REQUIRE_DAEMON:-0}"
ROOT="${KACHE_GATE_ROOT:-$PWD}"

command -v kache >/dev/null 2>&1 || { echo "kache-gate: kache not on PATH" >&2; exit 2; }
command -v jq    >/dev/null 2>&1 || { echo "kache-gate: jq not on PATH" >&2; exit 2; }

# Pull the cumulative counters. `--since 24h` is passed for forward
# compatibility only; it is currently ignored by kache (see header).
snapshot() {
  kache report --format json --since 24h --root "$ROOT" 2>/dev/null \
    | jq -c '{
        local_hits:    (.summary.local_hits    // 0),
        prefetch_hits: (.summary.prefetch_hits // 0),
        remote_hits:   (.summary.remote_hits   // 0),
        misses:        (.summary.misses        // 0),
        errors:        (.summary.errors        // 0),
        fallbacks:     (.summary.fallbacks     // 0),
        total_crates:  (.summary.total_crates  // 0),
        time_saved_ms: (.summary.time_saved_ms // 0)
      }'
}

if [ "${1:-}" = "--baseline" ]; then
  snap="$(snapshot)"
  if [ -z "$snap" ]; then
    echo "kache-gate: could not read a baseline report" >&2
    exit 2
  fi
  mkdir -p "$(dirname "$BASELINE")"
  printf '%s\n' "$snap" > "$BASELINE"
  echo "kache-gate: baseline written to $BASELINE"
  printf '%s\n' "$snap" | jq -r '"  cumulative before: hits=\(.local_hits + .prefetch_hits + .remote_hits) misses=\(.misses) errors=\(.errors)"'
  exit 0
fi

after="$(snapshot)"
if [ -z "$after" ]; then
  echo "kache-gate: could not read a usable JSON report" >&2
  exit 2
fi

if [ -r "$BASELINE" ]; then
  before="$(cat "$BASELINE")"
  scope="this build"
else
  # No baseline: fall back to absolute counters and say so loudly, because
  # cumulative counters make every threshold measure all history.
  before='{"local_hits":0,"prefetch_hits":0,"remote_hits":0,"misses":0,"errors":0,"fallbacks":0,"total_crates":0,"time_saved_ms":0}'
  scope="ALL HISTORY (no baseline at $BASELINE)"
  echo "kache-gate: WARNING: no baseline found -- thresholds will measure the whole event log," >&2
  echo "kache-gate: WARNING: not this build. Run 'kache-gate.sh --baseline' before the build." >&2
fi

read -r d_local d_prefetch d_remote d_miss d_err d_fall d_total d_saved <<EOJ
$(jq -rn --argjson a "$after" --argjson b "$before" '
  [ ($a.local_hits    - $b.local_hits),
    ($a.prefetch_hits - $b.prefetch_hits),
    ($a.remote_hits   - $b.remote_hits),
    ($a.misses        - $b.misses),
    ($a.errors        - $b.errors),
    ($a.fallbacks     - $b.fallbacks),
    ($a.total_crates  - $b.total_crates),
    ($a.time_saved_ms - $b.time_saved_ms) ] | @tsv')
EOJ

hits=$(( d_local + d_prefetch + d_remote ))
cacheable=$(( hits + d_miss ))
if [ "$cacheable" -gt 0 ]; then
  hit_rate="$(awk -v h="$hits" -v c="$cacheable" 'BEGIN { printf "%.1f", (h * 100.0) / c }')"
else
  hit_rate="0.0"
fi

# Daemon and remote status are not in the JSON report; read the stats text.
stats="$(kache stats 2>/dev/null || true)"
daemon_line="$(printf '%s' "$stats" | grep -E '^Daemon:' || true)"
remote_line="$(printf '%s' "$stats" | grep -E '^Remote:' || true)"

echo "--- kache gate ($scope) -------------------------------------"
printf '  hit rate      %s%%  (%s hits / %s cacheable)\n' "$hit_rate" "$hits" "$cacheable"
printf '  hits          local=%s prefetch=%s remote=%s\n' "$d_local" "$d_prefetch" "$d_remote"
printf '  misses        %s\n' "$d_miss"
printf '  errors        %s   fallbacks %s\n' "$d_err" "$d_fall"
printf '  time saved    %s ms\n' "$d_saved"
printf '  %s\n' "${daemon_line:-Daemon:     <unknown>}"
printf '  %s\n' "${remote_line:-Remote:     <unknown>}"
echo "  thresholds    min_hit_rate=${MIN_HIT_RATE} require_remote=${REQUIRE_REMOTE} require_daemon=${REQUIRE_DAEMON}"
echo "------------------------------------------------------------"

violations=0
violation() { echo "kache-gate: VIOLATION: $*" >&2; violations=$((violations + 1)); }

# Store-level failures introduced BY THIS BUILD. Non-zero means artifacts were
# produced and lost.
[ "$d_err"  -gt 0 ] && violation "$d_err compile(s) failed to store"
[ "$d_fall" -gt 0 ] && violation "$d_fall compile(s) fell back to another wrapper"

# A build that compiled nothing cacheable cannot be judged on hit rate.
if [ "$cacheable" -eq 0 ]; then
  echo "kache-gate: no cacheable compiles in this build -- skipping hit-rate and remote checks"
else
  floor_ok="$(awk -v r="$hit_rate" -v m="$MIN_HIT_RATE" 'BEGIN { print (int(r) >= int(m)) ? 1 : 0 }')"
  [ "$floor_ok" = "1" ] || violation "hit rate ${hit_rate}% is below the ${MIN_HIT_RATE}% floor"

  # A configured remote that serves no NEW hit is the silent-degradation case.
  if [ "$REQUIRE_REMOTE" = "1" ] && [ "$d_remote" -eq 0 ]; then
    violation "remote hits required but none occurred this build (${remote_line:-no Remote line})"
  fi
fi

# The daemon is the only path that uploads dependency artifacts and the only
# path that performs remote lookups. Down => this runner neither reads nor
# contributes, and says nothing about it.
if [ "$REQUIRE_DAEMON" = "1" ]; then
  case "$daemon_line" in
    *"not reachable"*|"") violation "daemon is not reachable (${daemon_line:-no Daemon line})" ;;
  esac
fi

if [ "$violations" -gt 0 ]; then
  echo "kache-gate: FAILED with $violations violation(s)" >&2
  exit 1
fi
echo "kache-gate: OK"
exit 0
