#!/bin/bash
set -euo pipefail

# Fail on HTTP errors while preserving the response body, with bounded waits.
curl() {
  command curl --fail-with-body --silent --show-error \
    --connect-timeout "${YARR_CURL_CONNECT_TIMEOUT:-5}" \
    --max-time "${YARR_CURL_MAX_TIME:-30}" "$@"
}

# Bazarr API wrapper.
# Credentials come from the bazarr plugin userConfig (written by the plugin setup script).
CONFIG_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/lab-bazarr/config.json"
# shellcheck source=/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/load-config.sh"
load_plugin_config "$CONFIG_FILE" BAZARR_URL BAZARR_API_KEY

: "${BAZARR_URL:?set it in the bazarr plugin settings}"
: "${BAZARR_API_KEY:?set it in the bazarr plugin settings}"

API="${BAZARR_URL%/}"
AUTH="X-API-KEY: $BAZARR_API_KEY"

# Print the response body on success. On HTTP >= 400 surface the method, URL,
# status, and body — Bazarr paths/params vary by version, so a 404 here usually
# means the endpoint differs on your build (see references/api-endpoints.md).
_req() {
  local method="$1" path="$2" resp http body
  resp=$(curl -sS -X "$method" -w $'\n%{http_code}' -H "$AUTH" "$API$path") || {
    echo "ERROR: $method $API$path failed (network/connection)." >&2; return 1; }
  http="${resp##*$'\n'}"; body="${resp%$'\n'*}"
  if [[ "${http:-0}" -ge 400 ]]; then
    echo "ERROR: $method $API$path -> HTTP $http. Bazarr paths/params vary by version; confirm the route against the in-app API browser (/api, some builds expose /api/swagger)." >&2
    [[ -n "$body" ]] && echo "$body" >&2
    return 1
  fi
  printf '%s' "$body"
}
_get() { _req GET "$1"; }
_post() { _req POST "$1"; }

cmd="${1:-}"
[ "$#" -gt 0 ] && shift || true

case "$cmd" in
  status)         _get "/api/system/status" | jq . ;;
  badges)         _get "/api/badges" | jq . ;;
  providers)      _get "/api/providers" | jq . ;;
  wanted-movies)  _get "/api/movies/wanted" | jq . ;;
  wanted-series)  _get "/api/episodes/wanted" | jq . ;;
  search-movie)
    id="${1:?usage: search-movie <radarrId>}"
    [[ "$id" =~ ^[0-9]+$ ]] || { echo "ERROR: radarrId must be numeric, got '$id'." >&2; exit 2; }
    _post "/api/providers/movies?radarrid=${id}" && echo "Triggered subtitle search for movie ${id}." ;;
  search-episode)
    id="${1:?usage: search-episode <sonarrEpisodeId>}"
    [[ "$id" =~ ^[0-9]+$ ]] || { echo "ERROR: episodeId must be numeric, got '$id'." >&2; exit 2; }
    _post "/api/providers/episodes?episodeid=${id}" && echo "Triggered subtitle search for episode ${id}." ;;
  get)            _get "${1:?usage: get <path>}" ;;
  *)
    echo "Usage: bazarr-api.sh {status|badges|providers|wanted-movies|wanted-series|search-movie <id>|search-episode <id>|get <path>}" >&2
    exit 1 ;;
esac
