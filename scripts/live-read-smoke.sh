#!/usr/bin/env bash
# Live read-only smoke checks for the shart test yarr environment.
set -euo pipefail

BIN="${YARR_BIN:-yarr}"
SHART_YARR_HOME="${SHART_YARR_HOME:-/home/jmagar/.yarr-shart}"
REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"

if [[ -z "${YARR_HOME:-}" ]]; then
  export YARR_HOME="$SHART_YARR_HOME"
elif [[ "$YARR_HOME" != "$SHART_YARR_HOME" ]]; then
  printf 'FATAL  live-read-smoke may only use YARR_HOME=%s (got %s)\n' \
    "$SHART_YARR_HOME" "$YARR_HOME" >&2
  exit 2
fi

(cd "$REPO_ROOT" && cargo xtask live --suite guard --allow-partial >/dev/null)

PASS=0
FAIL=0

pass() {
  printf 'PASS  %s\n' "$1"
  PASS=$((PASS + 1))
}

fail() {
  printf 'FAIL  %s\n' "$1" >&2
  FAIL=$((FAIL + 1))
}

assert_shart_services() {
  python3 - <<'PY'
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

allowed_hosts = {
    "100.118.209.1",
    "shart",
    "shart.manatee-triceratops.ts.net",
}

def parse_dotenv_value(raw: str) -> str:
    raw = raw.strip()
    if len(raw) >= 2 and raw[0] == '"' and raw[-1] == '"':
        out = []
        chars = iter(range(1, len(raw) - 1))
        i = 1
        while i < len(raw) - 1:
            ch = raw[i]
            if ch == "\\" and i + 1 < len(raw) - 1:
                nxt = raw[i + 1]
                out.append("\n" if nxt == "n" else nxt)
                i += 2
            else:
                out.append(ch)
                i += 1
        return "".join(out)
    return raw

effective = {}
home = Path(os.environ["YARR_HOME"])
env_path = home / ".env"
if not env_path.is_file():
    print(f"FATAL  shart smoke env file is missing: {env_path}", file=sys.stderr)
    sys.exit(2)

for line_no, raw_line in enumerate(env_path.read_text().splitlines(), start=1):
    line = raw_line.strip()
    if not line or line.startswith("#"):
        continue
    if "=" not in line:
        print(f"FATAL  {env_path}:{line_no}: expected KEY=VALUE", file=sys.stderr)
        sys.exit(2)
    key, raw_value = line.split("=", 1)
    key = key.strip()
    if key and key not in os.environ:
        effective[key] = parse_dotenv_value(raw_value)

for key, value in os.environ.items():
    if key.startswith("YARR_"):
        effective[key] = value

services = [item.strip() for item in effective.get("YARR_SERVICES", "").split(",") if item.strip()]
if not services:
    print("FATAL  YARR_SERVICES is empty in the shart smoke environment", file=sys.stderr)
    sys.exit(2)

bad = []
missing = []
for service in services:
    env_name = "".join(ch.upper() if ch.isalnum() else "_" for ch in service)
    key = f"YARR_{env_name}_URL"
    raw_url = effective.get(key, "")
    if not raw_url:
        missing.append(key)
        continue
    parsed = urlparse(raw_url)
    host = (parsed.hostname or "").lower()
    if host not in allowed_hosts:
        bad.append(f"{key}={raw_url}")

if missing or bad:
    if missing:
        print("FATAL  missing service URLs: " + ", ".join(missing), file=sys.stderr)
    if bad:
        print("FATAL  refusing to run live-read-smoke against non-shart services:", file=sys.stderr)
        for item in bad:
            print(f"  {item}", file=sys.stderr)
    sys.exit(2)
PY
  pass "shart service guard"
}

run_json_check() {
  local label="$1"
  shift
  local output
  if ! output="$("$@" 2>&1)"; then
    fail "$label ($(printf '%s' "$output" | tr -d '\n' | cut -c1-200))"
    return
  fi
  if ! printf '%s' "$output" | python3 -m json.tool >/dev/null 2>&1; then
    fail "$label (output was not JSON)"
    return
  fi
  pass "$label"
}

run_status_check() {
  local service="$1"
  local output
  # CLI is service-grouped: `yarr <service> status` (the old `--service` flag is gone).
  if ! output="$("$BIN" "$service" status 2>&1)"; then
    fail "status $service ($(printf '%s' "$output" | tr -d '\n' | cut -c1-200))"
    return
  fi
  if [[ -z "$output" ]]; then
    fail "status $service (empty output)"
    return
  fi
  pass "status $service"
}

run_get_check() {
  local service="$1"
  local path="$2"
  run_json_check "get $service $path" "$BIN" "$service" get --path "$path"
}

read_probe_paths() {
  local kind="$1"
  case "$kind" in
    sonarr)
      printf '%s\n' \
        "/api/v3/system/status" \
        "/api/v3/system/backup" \
        "/api/v3/system/task" \
        "/api/v3/series" \
        "/api/v3/queue" \
        "/api/v3/history" \
        "/api/v3/calendar" \
        "/api/v3/tag" \
        "/api/v3/rootfolder" \
        "/api/v3/qualityprofile" \
        "/api/v3/languageprofile" \
        "/api/v3/metadata" \
        "/api/v3/indexer" \
        "/api/v3/downloadclient" \
        "/api/v3/notification" \
        "/api/v3/health" \
        "/api/v3/log/file" \
        "/api/v3/update"
      ;;
    radarr)
      printf '%s\n' \
        "/api/v3/system/status" \
        "/api/v3/system/backup" \
        "/api/v3/system/task" \
        "/api/v3/movie" \
        "/api/v3/queue" \
        "/api/v3/history" \
        "/api/v3/calendar" \
        "/api/v3/tag" \
        "/api/v3/rootfolder" \
        "/api/v3/qualityprofile" \
        "/api/v3/metadata" \
        "/api/v3/indexer" \
        "/api/v3/downloadclient" \
        "/api/v3/notification" \
        "/api/v3/health" \
        "/api/v3/log/file" \
        "/api/v3/update"
      ;;
    prowlarr)
      printf '%s\n' \
        "/api/v1/system/status" \
        "/api/v1/system/backup" \
        "/api/v1/system/task" \
        "/api/v1/indexer" \
        "/api/v1/indexerstats" \
        "/api/v1/applications" \
        "/api/v1/downloadclient" \
        "/api/v1/notification" \
        "/api/v1/tag" \
        "/api/v1/health" \
        "/api/v1/log/file" \
        "/api/v1/update"
      ;;
    tautulli)
      printf '%s\n' \
        "/api/v2?cmd=get_server_info" \
        "/api/v2?cmd=get_activity" \
        "/api/v2?cmd=get_libraries" \
        "/api/v2?cmd=get_library_names" \
        "/api/v2?cmd=get_home_stats" \
        "/api/v2?cmd=get_recently_added" \
        "/api/v2?cmd=get_users" \
        "/api/v2?cmd=get_history" \
        "/api/v2?cmd=get_plays_by_date"
      ;;
    overseerr)
      printf '%s\n' \
        "/api/v1/status" \
        "/api/v1/settings/public"
      ;;
    bazarr)
      printf '%s\n' \
        "/api/system/status" \
        "/api/system/health" \
        "/api/series" \
        "/api/movies" \
        "/api/badges" \
        "/api/providers"
      ;;
    tracearr)
      printf '%s\n' "/health"
      ;;
    sabnzbd)
      printf '%s\n' \
        "/api?mode=version" \
        "/api?mode=queue" \
        "/api?mode=history" \
        "/api?mode=server_stats" \
        "/api?mode=get_config"
      ;;
    qbittorrent)
      printf '%s\n' \
        "/api/v2/app/version" \
        "/api/v2/app/webapiVersion" \
        "/api/v2/app/buildInfo" \
        "/api/v2/app/preferences" \
        "/api/v2/torrents/info" \
        "/api/v2/torrents/categories" \
        "/api/v2/torrents/tags" \
        "/api/v2/transfer/info" \
        "/api/v2/sync/maindata"
      ;;
    plex)
      printf '%s\n' "/identity"
      ;;
    jellyfin)
      printf '%s\n' "/System/Info/Public"
      ;;
  esac
}

# Enumerate configured services as `name<TAB>kind` from the shart env file +
# process env. The removed `integrations` action used to return this; we now read
# YARR_SERVICES and each YARR_<NAME>_KIND directly (kind defaults to name),
# mirroring the parsing in `assert_shart_services`.
services_from_env() {
  python3 - <<'PY'
import os
from pathlib import Path

def parse_dotenv_value(raw: str) -> str:
    raw = raw.strip()
    if len(raw) >= 2 and raw[0] == '"' and raw[-1] == '"':
        return raw[1:-1].replace('\\n', '\n').replace('\\"', '"')
    return raw

effective = {}
home = Path(os.environ["YARR_HOME"])
env_path = home / ".env"
if env_path.is_file():
    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, raw_value = line.split("=", 1)
        key = key.strip()
        if key and key not in os.environ:
            effective[key] = parse_dotenv_value(raw_value)
for key, value in os.environ.items():
    if key.startswith("YARR_"):
        effective[key] = value

services = [s.strip() for s in effective.get("YARR_SERVICES", "").split(",") if s.strip()]
for service in services:
    env_name = "".join(ch.upper() if ch.isalnum() else "_" for ch in service)
    kind = effective.get(f"YARR_{env_name}_KIND", service)
    print(f"{service}\t{kind}")
PY
}

assert_shart_services

run_json_check "help" "$BIN" help
run_json_check "doctor" "$BIN" doctor --json

mapfile -t services < <(services_from_env)
if (( ${#services[@]} == 0 )); then
  fail "configured services (none in YARR_SERVICES)"
else
  pass "configured services (${#services[@]})"
fi

for entry in "${services[@]}"; do
  service="${entry%%$'\t'*}"
  kind="${entry#*$'\t'}"
  run_status_check "$service"
  mapfile -t paths < <(read_probe_paths "$kind")
  if (( ${#paths[@]} == 0 )); then
    fail "read probes $service (no read-only probe paths for kind=$kind)"
    continue
  fi
  for path in "${paths[@]}"; do
    run_get_check "$service" "$path"
  done
done

printf '\n%d passed, %d failed\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]]
