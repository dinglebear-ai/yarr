#!/usr/bin/env bash
set -euo pipefail

YARR_PLUGIN_ROOT=${YARR_PLUGIN_ROOT:-/usr/local/emhttp/plugins/yarr}
# shellcheck source=/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh
source "${YARR_PLUGIN_ROOT}/scripts/yarr-common.sh"

YARR_RC_YARR=${YARR_RC_YARR:-/etc/rc.d/rc.yarr}
YARR_UPDATE_API_URL=${YARR_UPDATE_API_URL:-https://api.github.com/repos/jmagar/yarr/releases}
YARR_UPDATE_DOWNLOAD_ROOT=${YARR_UPDATE_DOWNLOAD_ROOT:-https://github.com/jmagar/yarr/releases/download}
YARR_UPDATE_ASSET=yarr-x86_64.tar.gz
YARR_UPDATE_CHECKSUM_ASSET=${YARR_UPDATE_ASSET}.sha256
YARR_ROLLED_BACK=false

yarr_update_error() {
    printf 'yarr-update: %s\n' "$*" >&2
}

yarr_update_version_from_binary() {
    local output
    output=$("$1" --version 2>/dev/null) || return 1
    if [[ "$output" =~ ^yarr[[:space:]]+([0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
        printf '%s\n' "${BASH_REMATCH[1]}"
        return 0
    fi
    yarr_update_error "could not parse Yarr version from $1"
    return 1
}

yarr_update_valid_version() {
    [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

yarr_update_major() {
    printf '%s\n' "${1%%.*}"
}

yarr_update_version_gt() {
    local left=$1 right=$2 lmajor lminor lpatch rmajor rminor rpatch
    IFS=. read -r lmajor lminor lpatch <<< "$left"
    IFS=. read -r rmajor rminor rpatch <<< "$right"
    ((10#$lmajor > 10#$rmajor)) && return 0
    ((10#$lmajor < 10#$rmajor)) && return 1
    ((10#$lminor > 10#$rminor)) && return 0
    ((10#$lminor < 10#$rminor)) && return 1
    ((10#$lpatch > 10#$rpatch))
}

yarr_update_fetch_releases() {
    local destination=$1
    "$YARR_CURL_BIN" --fail --location --silent --show-error --output "$destination" "$YARR_UPDATE_API_URL" || return 1
    jq -e 'type == "array"' "$destination" >/dev/null
}

yarr_update_select_available() {
    local releases=$1 installed=$2 channel=$3 installed_major tag prerelease version selected=''
    installed_major=$(yarr_update_major "$installed")
    while IFS=$'\t' read -r tag prerelease; do
        [[ "$tag" =~ ^v([0-9]+\.[0-9]+\.[0-9]+)(-.+)?$ ]] || continue
        version=${BASH_REMATCH[1]}
        [[ "$(yarr_update_major "$version")" == "$installed_major" ]] || continue
        if [[ "$channel" == stable && "$prerelease" != false ]]; then
            continue
        fi
        if [[ -n "${BASH_REMATCH[2]}" && "$channel" == stable ]]; then
            continue
        fi
        if [[ -z "$selected" ]] || yarr_update_version_gt "$version" "$selected"; then
            selected=$version
        fi
    done < <(jq -r '.[] | [(.tag_name // ""), (.prerelease // false)] | @tsv' "$releases")
    [[ -n "$selected" ]] || return 1
    printf '%s\n' "$selected"
}

yarr_update_release_assets() {
    local releases=$1 version=$2 tag="v${version}" archive_count checksum_count
    [[ "$(jq --arg tag "$tag" '[.[] | select(.tag_name == $tag)] | length' "$releases")" == 1 ]] || return 1
    archive_count=$(jq --arg tag "$tag" --arg asset "$YARR_UPDATE_ASSET" \
        '[.[] | select(.tag_name == $tag) | .assets[]? | select(.name == $asset)] | length' "$releases")
    checksum_count=$(jq --arg tag "$tag" --arg asset "$YARR_UPDATE_CHECKSUM_ASSET" \
        '[.[] | select(.tag_name == $tag) | .assets[]? | select(.name == $asset)] | length' "$releases")
    [[ "$archive_count" == 1 && "$checksum_count" == 1 ]]
}

yarr_update_download_url() {
    local version=$1 asset=$2
    printf '%s/v%s/%s\n' "${YARR_UPDATE_DOWNLOAD_ROOT%/}" "$version" "$asset"
}

yarr_update_parse_checksum() {
    local checksum_file=$1 line digest filename extra
    mapfile -t checksum_lines < "$checksum_file"
    [[ ${#checksum_lines[@]} == 1 ]] || return 1
    line=${checksum_lines[0]}
    [[ "$line" =~ ^([0-9A-Fa-f]{64})[[:space:]]+\*?([^[:space:]]+)$ ]] || return 1
    digest=${BASH_REMATCH[1],,}
    filename=${BASH_REMATCH[2]}
    [[ "$filename" == "$YARR_UPDATE_ASSET" ]] || return 1
    printf '%s\n' "$digest"
}

yarr_update_validate_archive() {
    local archive=$1 extract_dir=$2 payload entry_type actual_digest expected_digest
    mapfile -t archive_entries < <(tar -tzf "$archive")
    [[ ${#archive_entries[@]} == 1 && "${archive_entries[0]}" == yarr ]] || return 1
    entry_type=$(tar -tvzf "$archive" | awk 'NR == 1 { print substr($1, 1, 1) }')
    [[ "$entry_type" == '-' ]] || return 1
    mkdir -p "$extract_dir" || return 1
    tar -xzf "$archive" -C "$extract_dir" --no-same-owner --no-same-permissions || return 1
    payload="$extract_dir/yarr"
    [[ -f "$payload" && ! -L "$payload" && -x "$payload" ]] || return 1
    expected_digest=$(yarr_update_parse_checksum "${archive}.sha256") || return 1
    actual_digest=$(sha256sum "$archive" | awk '{print tolower($1)}')
    [[ "$actual_digest" == "$expected_digest" ]] || return 1
}

yarr_update_emit() {
    local available=$1 rolled_back=$2 message=$3 installed packaged using_overlay update_available
    yarr_select_binary || return 1
    installed=$(yarr_update_version_from_binary "$YARR_BINARY") || return 1
    packaged=$(yarr_update_version_from_binary "${YARR_PLUGIN_ROOT}/bin/yarr") || return 1
    if [[ "$YARR_BINARY" == "${YARR_APPDATA}/yarr" ]]; then
        using_overlay=true
    else
        using_overlay=false
    fi
    if [[ -n "$available" ]] && yarr_update_version_gt "$available" "$installed"; then
        update_available=true
    else
        update_available=false
    fi
    jq -cn \
        --arg installedVersion "$installed" \
        --arg packagedVersion "$packaged" \
        --arg availableVersion "$available" \
        --arg message "$message" \
        --argjson updateAvailable "$update_available" \
        --argjson usingOverlay "$using_overlay" \
        --argjson rolledBack "$rolled_back" \
        '{installedVersion: $installedVersion, packagedVersion: $packagedVersion, availableVersion: $availableVersion, updateAvailable: $updateAvailable, usingOverlay: $usingOverlay, rolledBack: $rolledBack, message: $message}'
}

yarr_update_lifecycle() {
    YARR_LOCK_HELD=1 YARR_LOCK_FD="$YARR_UPDATE_LOCK_FD" "$YARR_RC_YARR" "$1"
}

yarr_update_with_lock() {
    local status
    mkdir -p "$(dirname "$YARR_LOCK")" || return 1
    exec 9>"$YARR_LOCK"
    flock -n 9 || {
        exec 9>&-
        yarr_update_error 'another Yarr lifecycle operation is in progress'
        return 1
    }
    YARR_UPDATE_LOCK_FD=9
    "$@"
    status=$?
    unset YARR_UPDATE_LOCK_FD
    exec 9>&-
    return "$status"
}

yarr_update_apply_locked() {
    local candidate=$1 was_running=false had_overlay=false overlay previous staged
    overlay="${YARR_APPDATA}/yarr"
    previous="${YARR_APPDATA}/yarr.previous"
    staged="${YARR_APPDATA}/.yarr.new.$$"
    if yarr_pid_is_owned; then
        was_running=true
        yarr_update_lifecycle stop || return 1
    fi
    if [[ -e "$overlay" ]]; then
        had_overlay=true
        rm -f "$previous"
        mv "$overlay" "$previous" || return 1
    fi
    if ! install -m 755 "$candidate" "$staged" || ! mv -f "$staged" "$overlay"; then
        rm -f "$staged" "$overlay"
        [[ "$had_overlay" == true ]] && mv "$previous" "$overlay"
        [[ "$was_running" == true ]] && yarr_update_lifecycle start || true
        return 1
    fi
    if [[ "$was_running" == true ]] && ! yarr_update_lifecycle start; then
        rm -f "$overlay"
        [[ "$had_overlay" == true ]] && mv "$previous" "$overlay"
        YARR_ROLLED_BACK=true
        yarr_update_lifecycle start || true
        return 1
    fi
}

yarr_update_reset_locked() {
    local was_running=false overlay previous backup_overlay backup_previous
    overlay="${YARR_APPDATA}/yarr"
    previous="${YARR_APPDATA}/yarr.previous"
    backup_overlay="${YARR_APPDATA}/.yarr.reset-overlay.$$"
    backup_previous="${YARR_APPDATA}/.yarr.reset-previous.$$"
    if yarr_pid_is_owned; then
        was_running=true
        yarr_update_lifecycle stop || return 1
    fi
    [[ -e "$overlay" ]] && mv "$overlay" "$backup_overlay"
    [[ -e "$previous" ]] && mv "$previous" "$backup_previous"
    if [[ "$was_running" == true ]] && ! yarr_update_lifecycle start; then
        rm -f "$overlay" "$previous"
        [[ -e "$backup_overlay" ]] && mv "$backup_overlay" "$overlay"
        [[ -e "$backup_previous" ]] && mv "$backup_previous" "$previous"
        YARR_ROLLED_BACK=true
        yarr_update_lifecycle start || true
        return 1
    fi
    rm -f "$backup_overlay" "$backup_previous"
}

yarr_update_check() {
    local work releases installed available
    yarr_load_config && yarr_validate_config || return 1
    yarr_select_binary || return 1
    installed=$(yarr_update_version_from_binary "$YARR_BINARY") || return 1
    mkdir -p "$YARR_APPDATA" || return 1
    work=$(mktemp -d "${YARR_APPDATA}/.update.XXXXXX") || return 1
    releases="$work/releases.json"
    if ! yarr_update_fetch_releases "$releases"; then
        rm -rf "$work"
        return 1
    fi
    available=$(yarr_update_select_available "$releases" "$installed" "$UPDATE_CHANNEL" || true)
    rm -rf "$work"
    if [[ -z "$available" ]]; then
        yarr_update_emit '' false 'No compatible release is available'
    elif yarr_update_version_gt "$available" "$installed"; then
        yarr_update_emit "$available" false "Update available: ${available}"
    else
        yarr_update_emit "$available" false 'Yarr is current'
    fi
}

yarr_update_apply() {
    local version=$1 work releases archive checksum extract candidate installed
    yarr_load_config && yarr_validate_config || return 1
    yarr_select_binary || return 1
    installed=$(yarr_update_version_from_binary "$YARR_BINARY") || return 1
    yarr_update_valid_version "$version" || {
        yarr_update_error 'version must match MAJOR.MINOR.PATCH'
        return 1
    }
    [[ "$(yarr_update_major "$version")" == "$(yarr_update_major "$installed")" ]] || {
        yarr_update_error 'major-version updates are not supported'
        return 1
    }
    mkdir -p "$YARR_APPDATA" || return 1
    work=$(mktemp -d "${YARR_APPDATA}/.update.XXXXXX") || return 1
    releases="$work/releases.json"
    archive="$work/$YARR_UPDATE_ASSET"
    checksum="${archive}.sha256"
    extract="$work/extract"
    candidate="$extract/yarr"
    if ! yarr_update_fetch_releases "$releases" || ! yarr_update_release_assets "$releases" "$version" || \
        ! "$YARR_CURL_BIN" --fail --location --silent --show-error --output "$archive" "$(yarr_update_download_url "$version" "$YARR_UPDATE_ASSET")" || \
        ! "$YARR_CURL_BIN" --fail --location --silent --show-error --output "$checksum" "$(yarr_update_download_url "$version" "$YARR_UPDATE_CHECKSUM_ASSET")"; then
        rm -rf "$work"
        yarr_update_error 'release metadata or required assets are invalid'
        return 1
    fi
    if ! yarr_update_validate_archive "$archive" "$extract" || [[ "$(yarr_update_version_from_binary "$candidate")" != "$version" ]]; then
        rm -rf "$work"
        yarr_update_error 'downloaded release failed verification'
        return 1
    fi
    if ! yarr_update_with_lock yarr_update_apply_locked "$candidate"; then
        rm -rf "$work"
        yarr_update_emit "$version" "$YARR_ROLLED_BACK" 'Update failed; previous binary restored' || true
        return 1
    fi
    rm -rf "$work"
    yarr_update_emit "$version" false "Yarr updated to ${version}"
}

yarr_update_reset() {
    if ! yarr_update_with_lock yarr_update_reset_locked; then
        yarr_update_emit '' "$YARR_ROLLED_BACK" 'Reset failed; previous binary restored' || true
        return 1
    fi
    yarr_update_emit '' false 'Yarr reset to packaged binary'
}

command=${1:-}
shift || true
case "$command" in
    check)
        [[ "${1:-}" == --json && $# == 1 ]] || { yarr_update_error 'usage: yarr-update.sh check --json'; exit 2; }
        yarr_update_check
        ;;
    apply)
        [[ "${1:-}" == --version && -n "${2:-}" && "${3:-}" == --json && $# == 3 ]] || {
            yarr_update_error 'usage: yarr-update.sh apply --version MAJOR.MINOR.PATCH --json'
            exit 2
        }
        yarr_update_apply "$2"
        ;;
    reset)
        [[ "${1:-}" == --json && $# == 1 ]] || { yarr_update_error 'usage: yarr-update.sh reset --json'; exit 2; }
        yarr_update_reset
        ;;
    *)
        yarr_update_error 'usage: yarr-update.sh {check --json|apply --version MAJOR.MINOR.PATCH --json|reset --json}'
        exit 2
        ;;
esac
