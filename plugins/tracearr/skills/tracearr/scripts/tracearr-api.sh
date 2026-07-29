#!/usr/bin/env bash
# Tracearr API helper.
# Usage: tracearr-api.sh <command> [args...]

set -euo pipefail

# Fail on HTTP errors while preserving the response body, with bounded waits.
curl() {
  command curl --fail-with-body --silent --show-error \
    --connect-timeout "${YARR_CURL_CONNECT_TIMEOUT:-5}" \
    --max-time "${YARR_CURL_MAX_TIME:-30}" "$@"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/load-config.sh"

load_config() {
  local config="${TRACEARR_CONFIG_FILE:-${XDG_CONFIG_HOME:-$HOME/.config}/lab-tracearr/config.json}"
  if [[ -f "$config" ]]; then
    load_plugin_config "$config" TRACEARR_URL TRACEARR_API_KEY
  elif [[ -f "$HOME/.lab/.env" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$HOME/.lab/.env"
    set +a
  fi

  : "${TRACEARR_URL:?set TRACEARR_URL in plugin settings or ~/.lab/.env}"
  TRACEARR_URL="${TRACEARR_URL%/}"
}

api() {
  local method="$1"
  local endpoint="$2"
  shift 2
  local args=()
  if [[ -n "${TRACEARR_API_KEY:-}" ]]; then
    args+=(-H "Authorization: Bearer ${TRACEARR_API_KEY}")
  fi
  curl -sS -X "$method" -H "Accept: application/json" "${args[@]}" "$@" "${TRACEARR_URL}${endpoint}"
}

usage() {
  cat <<'EOF'
Usage: tracearr-api.sh <command> [args...]

Commands:
  health                       Probe Tracearr base URL
  api-docs                     Fetch Swagger UI/API docs page
  get <path>                   GET an arbitrary API path
  streams                      GET /api/streams
  servers                      GET /api/servers
  alerts                       GET /api/alerts

Environment:
  TRACEARR_URL from lab-tracearr config or ~/.lab/.env.
  TRACEARR_API_KEY is optional and sent as a bearer token when present.
EOF
}

cmd="${1:-help}"
shift || true
case "$cmd" in
  help|-h|--help) usage; exit 0 ;;
esac
load_config

case "$cmd" in
  health) curl -sS -o /dev/null -w 'HTTP %{http_code}\n' "${TRACEARR_URL}/" ;;
  api-docs) curl -sS "${TRACEARR_URL}/api-docs" ;;
  get)
    path="${1:?API path required}"
    [[ "$path" == /* ]] || path="/$path"
    api GET "$path"
    ;;
  streams) api GET "/api/streams" ;;
  servers) api GET "/api/servers" ;;
  alerts) api GET "/api/alerts" ;;
  *) usage >&2; exit 2 ;;
esac
