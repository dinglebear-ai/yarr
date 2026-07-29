#!/bin/bash
# qBittorrent WebUI API helper script
# Usage: qbit-api.sh <command> [args...]

set -euo pipefail

# Fail on HTTP errors while preserving the response body, with bounded waits.
curl() {
  command curl --fail-with-body --silent --show-error \
    --connect-timeout "${YARR_CURL_CONNECT_TIMEOUT:-5}" \
    --max-time "${YARR_CURL_MAX_TIME:-30}" "$@"
}

# Credentials come from this plugin userConfig (written by the plugin setup script).
CONFIG_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/lab-qbittorrent/config.json"
# shellcheck source=/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/load-config.sh"
load_plugin_config "$CONFIG_FILE" QBITTORRENT_URL QBITTORRENT_USERNAME QBITTORRENT_PASSWORD

# qBittorrent uses username/password, not an API key. Validate via indirect
# expansion so no literal credential value appears in this script.
for _required in QBITTORRENT_URL QBITTORRENT_USERNAME QBITTORRENT_PASSWORD; do
    if [ -z "${!_required:-}" ]; then
        echo "ERROR: $_required is not set; configure it in the plugin settings." >&2
        exit 1
    fi
done

# Map to script's internal variable names
QBIT_URL="$QBITTORRENT_URL"
QBIT_USER="$QBITTORRENT_USERNAME"
QBIT_PASS="$QBITTORRENT_PASSWORD"

COOKIE_FILE="${QBIT_COOKIE:-/tmp/qbit_cookie_$(id -u).txt}"

# Remove trailing slash
QBIT_URL="${QBIT_URL%/}"

# Login and get session cookie
do_login() {
    local resp
    if ! resp=$(curl -sS -i -X POST \
        -H "Referer: $QBIT_URL" \
        --data-urlencode "username=$QBIT_USER" \
        --data-urlencode "password=$QBIT_PASS" \
        "$QBIT_URL/api/v2/auth/login" 2>&1); then
        printf '%s\n' "$resp" >&2
        echo "Login failed" >&2
        return 1
    fi
    
    if echo "$resp" | grep -iq "set-cookie: SID="; then
        local sid
        sid=$(echo "$resp" | grep -ioP 'SID=\K[^;]+')
        ( umask 177; echo "$sid" > "$COOKIE_FILE" )
        return 0
    else
        echo "Login failed" >&2
        return 1
    fi
}

# Ensure we have a valid session
ensure_session() {
    if [[ ! -f "$COOKIE_FILE" ]]; then
        do_login
        return
    fi
    
    # Test session validity
    local sid
    sid=$(cat "$COOKIE_FILE")
    local resp
    if ! resp=$(curl -sS -o /dev/null -w "%{http_code}" \
        --cookie "SID=$sid" \
        "$QBIT_URL/api/v2/app/version"); then
        do_login
        return
    fi
    
    if [[ "$resp" != "200" ]]; then
        do_login
    fi
}

api_call() {
    local method="$1"
    local endpoint="$2"
    shift 2
    
    ensure_session
    local sid
    sid=$(cat "$COOKIE_FILE")
    
    curl -sS -X "$method" \
        --cookie "SID=$sid" \
        -H "Referer: $QBIT_URL" \
        "$@" \
        "${QBIT_URL}${endpoint}"
}

qbit_major_version() {
    local version major
    version=$(api_call GET "/api/v2/app/version" | tr -d '\r\n')
    major="${version#v}"
    major="${major%%.*}"
    [[ "$major" =~ ^[0-9]+$ ]] && echo "$major" || echo 4
}

# qBittorrent torrent hashes are 40-char (v1) or 40-char SHA-256-truncated
# (v2) hex strings; qBittorrent also accepts '|'-separated lists and the
# literal "all". Reject anything else before it reaches a query string or
# form body — an unvalidated hash could otherwise smuggle extra params
# (e.g. `abc&filter=downloading`) into the request.
require_hash() {
    local value="${1:-}"
    if [[ "$value" == "all" ]]; then
        return 0
    fi
    if [[ ! "$value" =~ ^[0-9a-fA-F]{40}(\|[0-9a-fA-F]{40})*$ ]]; then
        echo "ERROR: expected a torrent hash (40 hex chars), '|'-separated hashes, or 'all', got '$value'" >&2
        exit 2
    fi
}

torrent_control_endpoint() {
    local action="$1"
    local major
    major=$(qbit_major_version)

    if (( major >= 5 )); then
        case "$action" in
            pause) echo "/api/v2/torrents/stop" ;;
            resume) echo "/api/v2/torrents/start" ;;
            *) echo "ERROR: unknown control action: $action" >&2; return 1 ;;
        esac
    else
        case "$action" in
            pause) echo "/api/v2/torrents/pause" ;;
            resume) echo "/api/v2/torrents/resume" ;;
            *) echo "ERROR: unknown control action: $action" >&2; return 1 ;;
        esac
    fi
}

usage() {
    cat <<EOF
qBittorrent WebUI API CLI

Usage: $(basename "$0") <command> [options]

Commands:
  list [--filter F] [--category C] [--tag T] [--sort S] [--limit N]
  info <hash>                    Get torrent properties
  files <hash>                   Get torrent files
  trackers <hash>                Get torrent trackers
  
  add <url|magnet> [--category C] [--tags T] [--paused] [--skip-check]
  add-file <path> [--category C] [--tags T] [--paused] [--skip-check]
  
  pause <hash|all>               Pause/stop torrent(s)
  resume <hash|all>              Resume/start torrent(s)
  delete <hash> [--files]        Delete torrent (optionally with files)
  recheck <hash>                 Recheck torrent
  reannounce <hash>              Reannounce to trackers
  
  set-category <hash> <category>
  add-tags <hash> <tags>
  remove-tags <hash> <tags>
  
  categories                     List categories
  tags                           List tags
  
  transfer                       Global transfer info
  speedlimit                     Get speed limits
  set-speedlimit [--down D] [--up U]   Set limits (e.g., 5M, 1024K)
  toggle-alt-speed               Toggle alternative speed limits
  
  version                        App version
  preferences                    App preferences

Filters: all, downloading, seeding, completed, paused, active, inactive, resumed, stalled, stalled_uploading, stalled_downloading, errored

Examples:
  $(basename "$0") list --filter downloading
  $(basename "$0") add "magnet:?xt=..." --category movies
  $(basename "$0") pause all
  $(basename "$0") set-speedlimit --down 10M
EOF
}

cmd_list() {
    local filter="" category="" tag="" sort="" limit="" offset=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --filter|-f) filter="$2"; shift 2 ;;
            --category|-c) category="$2"; shift 2 ;;
            --tag|-t) tag="$2"; shift 2 ;;
            --sort|-s) sort="$2"; shift 2 ;;
            --limit|-l) limit="$2"; shift 2 ;;
            --offset|-o) offset="$2"; shift 2 ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    # Build the query with curl -G --data-urlencode so category/tag/sort values
    # with spaces or '&' are percent-encoded rather than injected as extra params.
    local args=()
    [[ -n "$filter" ]] && args+=(--data-urlencode "filter=$filter")
    [[ -n "$category" ]] && args+=(--data-urlencode "category=$category")
    [[ -n "$tag" ]] && args+=(--data-urlencode "tag=$tag")
    [[ -n "$sort" ]] && args+=(--data-urlencode "sort=$sort")
    [[ -n "$limit" ]] && args+=(--data-urlencode "limit=$limit")
    [[ -n "$offset" ]] && args+=(--data-urlencode "offset=$offset")

    if [[ ${#args[@]} -gt 0 ]]; then
        api_call GET "/api/v2/torrents/info" -G "${args[@]}"
    else
        api_call GET "/api/v2/torrents/info"
    fi
}

cmd_info() {
    local hash="$1"
    require_hash "$hash"
    api_call GET "/api/v2/torrents/properties" -G --data-urlencode "hash=$hash"
}

cmd_files() {
    local hash="$1"
    require_hash "$hash"
    api_call GET "/api/v2/torrents/files" -G --data-urlencode "hash=$hash"
}

cmd_trackers() {
    local hash="$1"
    require_hash "$hash"
    api_call GET "/api/v2/torrents/trackers" -G --data-urlencode "hash=$hash"
}

cmd_add() {
    local url="$1"; shift
    local category="" tags="" paused="false" skip_check="false"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --category|-c) category="$2"; shift 2 ;;
            --tags|-t) tags="$2"; shift 2 ;;
            --paused|-p) paused="true"; shift ;;
            --skip-check) skip_check="true"; shift ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    local args=(--data-urlencode "urls=$url" -d "paused=$paused" -d "skip_checking=$skip_check")
    [[ -n "$category" ]] && args+=(--data-urlencode "category=$category")
    [[ -n "$tags" ]] && args+=(--data-urlencode "tags=$tags")

    api_call POST "/api/v2/torrents/add" "${args[@]}"
    echo '{"status": "ok"}'
}

cmd_add_file() {
    local filepath="$1"; shift
    local category="" tags="" paused="false" skip_check="false"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --category|-c) category="$2"; shift 2 ;;
            --tags|-t) tags="$2"; shift 2 ;;
            --paused|-p) paused="true"; shift ;;
            --skip-check) skip_check="true"; shift ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done

    ensure_session
    local sid
    sid=$(cat "$COOKIE_FILE")

    local args=(-F "torrents=@$filepath" -F "paused=$paused" -F "skip_checking=$skip_check")
    [[ -n "$category" ]] && args+=(-F "category=$category")
    [[ -n "$tags" ]] && args+=(-F "tags=$tags")
    
    curl -sS --cookie "SID=$sid" -H "Referer: $QBIT_URL" "${args[@]}" "$QBIT_URL/api/v2/torrents/add"
    echo '{"status": "ok"}'
}

cmd_pause() {
    local hashes="$1"
    require_hash "$hashes"
    api_call POST "$(torrent_control_endpoint pause)" --data-urlencode "hashes=$hashes"
    echo '{"status": "ok"}'
}

cmd_resume() {
    local hashes="$1"
    require_hash "$hashes"
    api_call POST "$(torrent_control_endpoint resume)" --data-urlencode "hashes=$hashes"
    echo '{"status": "ok"}'
}

cmd_delete() {
    local hash="$1"; shift
    local delete_files="false"
    require_hash "$hash"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --files|-f) delete_files="true"; shift ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done

    api_call POST "/api/v2/torrents/delete" --data-urlencode "hashes=$hash" -d "deleteFiles=$delete_files"
    echo '{"status": "ok"}'
}

cmd_recheck() {
    local hash="$1"
    require_hash "$hash"
    api_call POST "/api/v2/torrents/recheck" --data-urlencode "hashes=$hash"
    echo '{"status": "ok"}'
}

cmd_reannounce() {
    local hash="$1"
    require_hash "$hash"
    api_call POST "/api/v2/torrents/reannounce" --data-urlencode "hashes=$hash"
    echo '{"status": "ok"}'
}

cmd_set_category() {
    local hash="$1"
    local category="$2"
    require_hash "$hash"
    api_call POST "/api/v2/torrents/setCategory" --data-urlencode "hashes=$hash" --data-urlencode "category=$category"
    echo '{"status": "ok"}'
}

cmd_add_tags() {
    local hash="$1"
    local tags="$2"
    require_hash "$hash"
    api_call POST "/api/v2/torrents/addTags" --data-urlencode "hashes=$hash" --data-urlencode "tags=$tags"
    echo '{"status": "ok"}'
}

cmd_remove_tags() {
    local hash="$1"
    local tags="$2"
    require_hash "$hash"
    api_call POST "/api/v2/torrents/removeTags" --data-urlencode "hashes=$hash" --data-urlencode "tags=$tags"
    echo '{"status": "ok"}'
}

cmd_categories() {
    api_call GET "/api/v2/torrents/categories"
}

cmd_tags() {
    api_call GET "/api/v2/torrents/tags"
}

cmd_transfer() {
    api_call GET "/api/v2/transfer/info"
}

cmd_speedlimit() {
    local download upload
    download=$(api_call GET '/api/v2/transfer/downloadLimit')
    upload=$(api_call GET '/api/v2/transfer/uploadLimit')
    [[ "$download" =~ ^[0-9]+$ ]] || { echo "ERROR: unexpected downloadLimit response: $download" >&2; exit 1; }
    [[ "$upload" =~ ^[0-9]+$ ]] || { echo "ERROR: unexpected uploadLimit response: $upload" >&2; exit 1; }
    jq -n --argjson download "$download" --argjson upload "$upload" \
        '{download: $download, upload: $upload}'
}

parse_speed() {
    local val="$1"
    local num="${val%[KMG]}"
    local suffix="${val: -1}"
    
    case "$suffix" in
        K|k) echo $((num * 1024)) ;;
        M|m) echo $((num * 1024 * 1024)) ;;
        G|g) echo $((num * 1024 * 1024 * 1024)) ;;
        *) echo "$val" ;;
    esac
}

cmd_set_speedlimit() {
    local down="" up=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --down|-d) down=$(parse_speed "$2"); shift 2 ;;
            --up|-u) up=$(parse_speed "$2"); shift 2 ;;
            *) echo "Unknown option: $1" >&2; exit 1 ;;
        esac
    done
    
    [[ -n "$down" ]] && api_call POST "/api/v2/transfer/setDownloadLimit" -d "limit=$down"
    [[ -n "$up" ]] && api_call POST "/api/v2/transfer/setUploadLimit" -d "limit=$up"
    echo '{"status": "ok"}'
}

cmd_toggle_alt_speed() {
    api_call POST "/api/v2/transfer/toggleSpeedLimitsMode"
    echo '{"status": "ok"}'
}

cmd_version() {
    api_call GET "/api/v2/app/version"
}

cmd_preferences() {
    api_call GET "/api/v2/app/preferences"
}

# Main dispatch
case "${1:-}" in
    list) shift; cmd_list "$@" ;;
    info) shift; cmd_info "$@" ;;
    files) shift; cmd_files "$@" ;;
    trackers) shift; cmd_trackers "$@" ;;
    add) shift; cmd_add "$@" ;;
    add-file) shift; cmd_add_file "$@" ;;
    pause) shift; cmd_pause "$@" ;;
    resume) shift; cmd_resume "$@" ;;
    delete) shift; cmd_delete "$@" ;;
    recheck) shift; cmd_recheck "$@" ;;
    reannounce) shift; cmd_reannounce "$@" ;;
    set-category) shift; cmd_set_category "$@" ;;
    add-tags) shift; cmd_add_tags "$@" ;;
    remove-tags) shift; cmd_remove_tags "$@" ;;
    categories) shift; cmd_categories "$@" ;;
    tags) shift; cmd_tags "$@" ;;
    transfer) shift; cmd_transfer "$@" ;;
    speedlimit) shift; cmd_speedlimit "$@" ;;
    set-speedlimit) shift; cmd_set_speedlimit "$@" ;;
    toggle-alt-speed) shift; cmd_toggle_alt_speed "$@" ;;
    version) shift; cmd_version "$@" ;;
    preferences) shift; cmd_preferences "$@" ;;
    -h|--help|help|"") usage ;;
    *) echo "Unknown command: $1" >&2; usage; exit 1 ;;
esac
