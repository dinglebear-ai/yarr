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
YARR_MV_BIN=${YARR_MV_BIN:-/bin/mv}
YARR_INSTALL_BIN=${YARR_INSTALL_BIN:-/usr/bin/install}
YARR_SYNC_BIN=${YARR_SYNC_BIN:-/usr/bin/sync}
YARR_TAR_BIN=${YARR_TAR_BIN:-/usr/bin/tar}
YARR_RM_BIN=${YARR_RM_BIN:-/usr/bin/rm}
YARR_UPDATE_TMP=''
YARR_UPDATE_STAGED=''
YARR_UPDATE_ROLLBACK=''
YARR_ROLLED_BACK=false
YARR_RESET_CLEANUP_PENDING=false
YARR_APPLY_CLEANUP_PENDING=false

[[ -r "$YARR_RC_YARR" ]] || { printf 'yarr-update: cannot read lifecycle script\n' >&2; exit 1; }
# Source lifecycle helpers without executing their direct-command dispatcher.
# shellcheck source=/etc/rc.d/rc.yarr
source "$YARR_RC_YARR"

yarr_update_error() {
    printf 'yarr-update: %s\n' "$*" >&2
}

yarr_update_cleanup() {
    local status=$1 cleanup_failed=false
    trap - EXIT HUP INT TERM
    case "$YARR_UPDATE_STAGED" in
        "${YARR_OVERLAY_DIR}"/.yarr.update.*)
            "$YARR_RM_BIN" -f -- "$YARR_UPDATE_STAGED" || cleanup_failed=true
            ;;
    esac
    if [[ -n "$YARR_UPDATE_TMP" ]] && ! "$YARR_RM_BIN" -rf -- "$YARR_UPDATE_TMP"; then
        cleanup_failed=true
    fi
    [[ "$cleanup_failed" == true ]] && yarr_update_error 'could not remove updater temporary data'
    [[ "$status" == 0 && "$cleanup_failed" == true ]] && status=1
    exit "$status"
}

yarr_update_handle_signal() {
    local status=$1
    trap - HUP INT TERM
    if [[ -n "$YARR_UPDATE_ROLLBACK" ]]; then
        "$YARR_UPDATE_ROLLBACK" || yarr_update_error 'signal rollback did not fully restore prior state'
    fi
    yarr_update_cleanup "$status"
}

yarr_update_track_tempdir() {
    YARR_UPDATE_TMP=$1
    YARR_UPDATE_STAGED=''
    trap 'yarr_update_cleanup "$?"' EXIT
    trap 'yarr_update_handle_signal 129' HUP
    trap 'yarr_update_handle_signal 130' INT
    trap 'yarr_update_handle_signal 143' TERM
}

yarr_update_clear_tempdir() {
    if [[ -n "$YARR_UPDATE_STAGED" ]]; then
        "$YARR_RM_BIN" -f -- "$YARR_UPDATE_STAGED" || {
            yarr_update_error 'could not remove updater staged data'
            return 1
        }
        YARR_UPDATE_STAGED=''
    fi
    if [[ -n "$YARR_UPDATE_TMP" ]]; then
        "$YARR_RM_BIN" -rf -- "$YARR_UPDATE_TMP" || {
            yarr_update_error 'could not remove updater temporary data'
            return 1
        }
        YARR_UPDATE_TMP=''
    fi
}

yarr_update_version_from_binary() {
    local output
    output=$("$1" --version 2>/dev/null) || return 1
    if [[ "$output" =~ ^yarr[[:space:]]+((0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))$ ]]; then
        printf '%s\n' "${BASH_REMATCH[1]}"
        return 0
    fi
    yarr_update_error "could not parse Yarr version from $1"
    return 1
}

yarr_update_valid_version() {
    [[ "$1" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]
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

yarr_update_release_eligible() {
    local releases=$1 version=$2 installed=$3 tag="v${version}"
    yarr_update_valid_version "$version" || return 1
    [[ "$(yarr_update_major "$version")" == "$(yarr_update_major "$installed")" ]] || return 1
    yarr_update_version_gt "$installed" "$version" && return 1
    jq -e --arg tag "$tag" --arg archive "$YARR_UPDATE_ASSET" --arg checksum "$YARR_UPDATE_CHECKSUM_ASSET" '
        [.[] | select(.tag_name == $tag)] as $matches |
        ($matches | length == 1) and
        ($matches[0].draft == false) and
        ($matches[0].prerelease == false) and
        ($matches[0].assets | type == "array") and
        ([ $matches[0].assets[] | select(.name == $archive) ] | length == 1) and
        ([ $matches[0].assets[] | select(.name == $checksum) ] | length == 1)
    ' "$releases" >/dev/null
}

yarr_update_select_available() {
    local releases=$1 installed=$2 channel=$3 tag draft prerelease version suffix selected=''
    while IFS=$'\t' read -r tag draft prerelease; do
        [[ "$tag" =~ ^v((0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))(-.+)?$ ]] || continue
        version=${BASH_REMATCH[1]}
        suffix=${BASH_REMATCH[5]}
        [[ "$draft" == false ]] || continue
        [[ "$channel" == stable && "$prerelease" == false && -z "$suffix" ]] || continue
        yarr_update_release_eligible "$releases" "$version" "$installed" || continue
        if [[ -z "$selected" ]] || yarr_update_version_gt "$version" "$selected"; then
            selected=$version
        fi
    done < <(jq -r '.[] | [(.tag_name // ""), (.draft // false), (.prerelease // false)] | @tsv' "$releases")
    [[ -n "$selected" ]] || return 1
    printf '%s\n' "$selected"
}

yarr_update_download_url() {
    local version=$1 asset=$2
    printf '%s/v%s/%s\n' "${YARR_UPDATE_DOWNLOAD_ROOT%/}" "$version" "$asset"
}

yarr_update_parse_checksum() {
    local checksum_file=$1 line digest filename
    mapfile -t checksum_lines < "$checksum_file"
    [[ ${#checksum_lines[@]} == 1 ]] || return 1
    line=${checksum_lines[0]}
    [[ "$line" =~ ^([0-9A-Fa-f]{64})[[:space:]]+\*?([^[:space:]]+)$ ]] || return 1
    digest=${BASH_REMATCH[1],,}
    filename=${BASH_REMATCH[2]}
    [[ "$filename" == "$YARR_UPDATE_ASSET" ]] || return 1
    printf '%s\n' "$digest"
}

yarr_update_verify_checksum() {
    local archive=$1 checksum=$2 expected actual
    expected=$(yarr_update_parse_checksum "$checksum") || return 1
    actual=$(sha256sum "$archive" | awk '{print tolower($1)}')
    [[ "$actual" == "$expected" ]]
}

yarr_update_validate_archive() {
    local archive=$1 extract_dir=$2 payload entry_type
    mapfile -t archive_entries < <("$YARR_TAR_BIN" -tzf "$archive")
    [[ ${#archive_entries[@]} == 1 && "${archive_entries[0]}" == yarr ]] || return 1
    entry_type=$("$YARR_TAR_BIN" -tvzf "$archive" | awk 'NR == 1 { print substr($1, 1, 1) }')
    [[ "$entry_type" == '-' ]] || return 1
    mkdir -p "$extract_dir" || return 1
    "$YARR_TAR_BIN" -xzf "$archive" -C "$extract_dir" --no-same-owner --no-same-permissions || return 1
    payload="$extract_dir/yarr"
    [[ -f "$payload" && ! -L "$payload" && -x "$payload" ]]
}

yarr_update_emit() {
    local available=$1 rolled_back=$2 message=$3 installed packaged using_overlay update_available
    yarr_select_binary || return 1
    installed=$(yarr_update_version_from_binary "$YARR_BINARY") || return 1
    packaged=$(yarr_update_version_from_binary "${YARR_PLUGIN_ROOT}/bin/yarr") || return 1
    [[ "$YARR_BINARY" == "${YARR_OVERLAY_DIR}/yarr" ]] && using_overlay=true || using_overlay=false
    if [[ -n "$available" ]] && yarr_update_version_gt "$available" "$installed"; then
        update_available=true
    else
        update_available=false
    fi
    jq -cn --arg installedVersion "$installed" --arg packagedVersion "$packaged" \
        --arg availableVersion "$available" --arg message "$message" \
        --argjson updateAvailable "$update_available" --argjson usingOverlay "$using_overlay" \
        --argjson rolledBack "$rolled_back" \
        '{installedVersion: $installedVersion, packagedVersion: $packagedVersion, availableVersion: $availableVersion, updateAvailable: $updateAvailable, usingOverlay: $usingOverlay, rolledBack: $rolledBack, message: $message}'
}

yarr_update_lifecycle() {
    case "$1" in
        start) yarr_start_locked ;;
        stop) yarr_stop_locked ;;
        *) yarr_update_error 'invalid internal lifecycle action'; return 2 ;;
    esac
}

yarr_update_with_lock() {
    local status
    mkdir -p "$(dirname "$YARR_LOCK")" || return 1
    exec 9>"$YARR_LOCK"
    flock -n 9 || { exec 9>&-; yarr_update_error 'another Yarr lifecycle operation is in progress'; return 1; }
    YARR_UPDATE_LOCK_FD=9
    "$@"
    status=$?
    unset YARR_UPDATE_LOCK_FD
    exec 9>&-
    return "$status"
}

yarr_update_restore_apply() {
    local was_running=$1 active=$2 previous=$3 active_backup=$4 previous_backup=$5 active_location=$6 previous_location=$7 new_active=$8 result=0
    if [[ "$was_running" == true ]] && ! yarr_update_lifecycle stop; then result=1; fi
    if [[ "$new_active" == true ]] && ! "$YARR_RM_BIN" -f -- "$active"; then result=1; fi
    if [[ "$active_location" == previous ]]; then
        if [[ -e "$previous" ]]; then
            "$YARR_MV_BIN" "$previous" "$active" || result=1
        elif [[ -e "$active_backup" ]]; then
            "$YARR_MV_BIN" "$active_backup" "$active" || result=1
        fi
    elif [[ "$active_location" == backup && -e "$active_backup" ]]; then
        "$YARR_MV_BIN" "$active_backup" "$active" || result=1
    fi
    if [[ "$previous_location" == backup && -e "$previous_backup" ]]; then
        "$YARR_MV_BIN" "$previous_backup" "$previous" || result=1
    fi
    "$YARR_SYNC_BIN" -f "$YARR_OVERLAY_DIR" || result=1
    if [[ "$was_running" == true ]]; then
        yarr_update_lifecycle start || result=1
    fi
    YARR_ROLLED_BACK=true
    return "$result"
}

yarr_update_rollback_apply_current() {
    yarr_update_restore_apply "$YARR_TXN_WAS_RUNNING" "$YARR_TXN_ACTIVE" "$YARR_TXN_PREVIOUS" \
        "$YARR_TXN_ACTIVE_BACKUP" "$YARR_TXN_PREVIOUS_BACKUP" "$YARR_TXN_ACTIVE_LOCATION" \
        "$YARR_TXN_PREVIOUS_LOCATION" "$YARR_TXN_NEW_ACTIVE"
}

yarr_update_apply_locked() {
    local candidate=$1
    YARR_TXN_WAS_RUNNING=false
    YARR_TXN_HAD_ACTIVE=false
    YARR_TXN_HAD_PREVIOUS=false
    YARR_TXN_ACTIVE="${YARR_OVERLAY_DIR}/yarr"
    YARR_TXN_PREVIOUS="${YARR_OVERLAY_DIR}/yarr.previous"
    YARR_TXN_ACTIVE_BACKUP="${YARR_OVERLAY_DIR}/.yarr.update.active.$$"
    YARR_TXN_PREVIOUS_BACKUP="${YARR_OVERLAY_DIR}/.yarr.update.previous.$$"
    YARR_TXN_STAGED="${YARR_OVERLAY_DIR}/.yarr.update.new.$$"
    YARR_TXN_ACTIVE_LOCATION=none
    YARR_TXN_PREVIOUS_LOCATION=none
    YARR_TXN_NEW_ACTIVE=false
    YARR_UPDATE_ROLLBACK=yarr_update_rollback_apply_current
    mkdir -p "$YARR_OVERLAY_DIR" || return 1
    [[ -e "$YARR_TXN_ACTIVE" ]] && { YARR_TXN_HAD_ACTIVE=true; YARR_TXN_ACTIVE_LOCATION=active; }
    [[ -e "$YARR_TXN_PREVIOUS" ]] && { YARR_TXN_HAD_PREVIOUS=true; YARR_TXN_PREVIOUS_LOCATION=previous; }
    if yarr_pid_is_owned; then
        YARR_TXN_WAS_RUNNING=true
        yarr_update_lifecycle stop || return 1
    fi
    if [[ "$YARR_TXN_HAD_PREVIOUS" == true ]]; then
        YARR_TXN_PREVIOUS_LOCATION=backup
    fi
    if [[ "$YARR_TXN_HAD_PREVIOUS" == true ]] && ! "$YARR_MV_BIN" "$YARR_TXN_PREVIOUS" "$YARR_TXN_PREVIOUS_BACKUP"; then
        yarr_update_rollback_apply_current || true
        return 1
    fi
    if [[ "$YARR_TXN_HAD_ACTIVE" == true ]]; then
        YARR_TXN_ACTIVE_LOCATION=backup
    fi
    if [[ "$YARR_TXN_HAD_ACTIVE" == true ]] && ! "$YARR_MV_BIN" "$YARR_TXN_ACTIVE" "$YARR_TXN_ACTIVE_BACKUP"; then
        yarr_update_rollback_apply_current || true
        return 1
    fi
    YARR_UPDATE_STAGED=$YARR_TXN_STAGED
    if ! "$YARR_INSTALL_BIN" -m 755 "$candidate" "$YARR_TXN_STAGED" || ! "$YARR_SYNC_BIN" -f "$YARR_TXN_STAGED"; then
        yarr_update_rollback_apply_current || true
        return 1
    fi
    if [[ "$YARR_TXN_HAD_ACTIVE" == true ]]; then
        YARR_TXN_ACTIVE_LOCATION=previous
    fi
    if [[ "$YARR_TXN_HAD_ACTIVE" == true ]] && ! "$YARR_MV_BIN" "$YARR_TXN_ACTIVE_BACKUP" "$YARR_TXN_PREVIOUS"; then
        yarr_update_rollback_apply_current || true
        return 1
    fi
    YARR_TXN_NEW_ACTIVE=true
    if ! "$YARR_MV_BIN" "$YARR_TXN_STAGED" "$YARR_TXN_ACTIVE" || ! "$YARR_SYNC_BIN" -f "$YARR_OVERLAY_DIR"; then
        yarr_update_rollback_apply_current || true
        return 1
    fi
    YARR_UPDATE_STAGED=''
    if [[ "$YARR_TXN_WAS_RUNNING" == true ]] && ! yarr_update_lifecycle start; then
        yarr_update_rollback_apply_current || true
        return 1
    fi
    # The new active and its predecessor are now durable and ready. Obsolete
    # backup removal is post-commit cleanup, never a rollback trigger.
    YARR_UPDATE_ROLLBACK=''
    if [[ "$YARR_TXN_HAD_PREVIOUS" == true ]] && ! "$YARR_RM_BIN" -f -- "$YARR_TXN_PREVIOUS_BACKUP"; then
        YARR_APPLY_CLEANUP_PENDING=true
        yarr_update_error 'updated binary is ready; obsolete backup cleanup is pending'
        return 1
    fi
}

yarr_update_restore_reset() {
    local was_running=$1 active=$2 previous=$3 active_backup=$4 previous_backup=$5 result=0
    if [[ "$was_running" == true ]] && ! yarr_update_lifecycle stop; then result=1; fi
    if [[ -e "$active_backup" ]] && ! "$YARR_MV_BIN" "$active_backup" "$active"; then result=1; fi
    if [[ -e "$previous_backup" ]] && ! "$YARR_MV_BIN" "$previous_backup" "$previous"; then result=1; fi
    "$YARR_SYNC_BIN" -f "$YARR_OVERLAY_DIR" || result=1
    if [[ "$was_running" == true ]]; then
        yarr_update_lifecycle start || result=1
    fi
    YARR_ROLLED_BACK=true
    return "$result"
}

yarr_update_rollback_reset_current() {
    yarr_update_restore_reset "$YARR_TXN_WAS_RUNNING" "$YARR_TXN_ACTIVE" "$YARR_TXN_PREVIOUS" \
        "$YARR_TXN_ACTIVE_BACKUP" "$YARR_TXN_PREVIOUS_BACKUP"
}

yarr_update_reset_locked() {
    local transaction
    transaction=$(mktemp -d "${YARR_OVERLAY_DIR}/.yarr.reset.XXXXXX") || return 1
    yarr_update_track_tempdir "$transaction"
    YARR_TXN_WAS_RUNNING=false
    YARR_TXN_ACTIVE="${YARR_OVERLAY_DIR}/yarr"
    YARR_TXN_PREVIOUS="${YARR_OVERLAY_DIR}/yarr.previous"
    YARR_TXN_ACTIVE_BACKUP="${transaction}/active"
    YARR_TXN_PREVIOUS_BACKUP="${transaction}/previous"
    YARR_UPDATE_ROLLBACK=yarr_update_rollback_reset_current
    if yarr_pid_is_owned; then
        YARR_TXN_WAS_RUNNING=true
        yarr_update_lifecycle stop || return 1
    fi
    if [[ -e "$YARR_TXN_ACTIVE" ]] && ! "$YARR_MV_BIN" "$YARR_TXN_ACTIVE" "$YARR_TXN_ACTIVE_BACKUP"; then
        yarr_update_rollback_reset_current || true
        return 1
    fi
    if [[ -e "$YARR_TXN_PREVIOUS" ]] && ! "$YARR_MV_BIN" "$YARR_TXN_PREVIOUS" "$YARR_TXN_PREVIOUS_BACKUP"; then
        yarr_update_rollback_reset_current || true
        return 1
    fi
    if ! "$YARR_SYNC_BIN" -f "$YARR_OVERLAY_DIR"; then
        yarr_update_rollback_reset_current || true
        return 1
    fi
    if [[ "$YARR_TXN_WAS_RUNNING" == true ]] && ! yarr_update_lifecycle start; then
        yarr_update_rollback_reset_current || true
        return 1
    fi
    YARR_UPDATE_ROLLBACK=''
    if ! yarr_update_clear_tempdir; then
        YARR_RESET_CLEANUP_PENDING=true
        yarr_update_emit '' false 'Yarr reset; updater backup cleanup pending'
        return 1
    fi
}

yarr_update_check() {
    local work releases installed available
    yarr_load_config && yarr_validate_config || return 1
    yarr_select_binary || return 1
    installed=$(yarr_update_version_from_binary "$YARR_BINARY") || return 1
    mkdir -p "$YARR_APPDATA" || return 1
    work=$(mktemp -d "${YARR_APPDATA}/.update.XXXXXX") || return 1
    yarr_update_track_tempdir "$work"
    releases="$work/releases.json"
    yarr_update_fetch_releases "$releases" || return 1
    available=$(yarr_update_select_available "$releases" "$installed" "$UPDATE_CHANNEL" || true)
    yarr_update_clear_tempdir
    if [[ -z "$available" ]]; then yarr_update_emit '' false 'No compatible release is available'
    elif yarr_update_version_gt "$available" "$installed"; then yarr_update_emit "$available" false "Update available: ${available}"
    else yarr_update_emit "$available" false 'Yarr is current'; fi
}

yarr_update_apply() {
    local version=$1 work releases archive checksum extract candidate installed
    yarr_load_config && yarr_validate_config || return 1
    yarr_select_binary || return 1
    installed=$(yarr_update_version_from_binary "$YARR_BINARY") || return 1
    yarr_update_valid_version "$version" || { yarr_update_error 'version must match MAJOR.MINOR.PATCH'; return 1; }
    [[ "$(yarr_update_major "$version")" == "$(yarr_update_major "$installed")" ]] || { yarr_update_error 'major-version updates are not supported'; return 1; }
    yarr_update_version_gt "$installed" "$version" && { yarr_update_error 'downgrades are not supported'; return 1; }
    mkdir -p "$YARR_APPDATA" "$YARR_OVERLAY_DIR" || return 1
    work=$(mktemp -d "${YARR_APPDATA}/.update.XXXXXX") || return 1
    yarr_update_track_tempdir "$work"
    releases="$work/releases.json"; archive="$work/$YARR_UPDATE_ASSET"; checksum="${archive}.sha256"; extract="$work/extract"; candidate="$extract/yarr"
    if ! yarr_update_fetch_releases "$releases" || ! yarr_update_release_eligible "$releases" "$version" "$installed"; then
        yarr_update_error 'requested release is not an eligible stable release'
        return 1
    fi
    if [[ "$version" == "$installed" ]]; then
        yarr_update_clear_tempdir
        yarr_update_emit "$version" false 'Yarr is current'
        return 0
    fi
    if ! "$YARR_CURL_BIN" --fail --location --silent --show-error --output "$archive" "$(yarr_update_download_url "$version" "$YARR_UPDATE_ASSET")" || \
        ! "$YARR_CURL_BIN" --fail --location --silent --show-error --output "$checksum" "$(yarr_update_download_url "$version" "$YARR_UPDATE_CHECKSUM_ASSET")" || \
        ! yarr_update_verify_checksum "$archive" "$checksum" || \
        ! yarr_update_validate_archive "$archive" "$extract" || \
        [[ "$(yarr_update_version_from_binary "$candidate")" != "$version" ]]; then
        yarr_update_error 'downloaded release failed verification'
        return 1
    fi
    if ! yarr_update_with_lock yarr_update_apply_locked "$candidate"; then
        if [[ "$YARR_APPLY_CLEANUP_PENDING" == true ]]; then
            yarr_update_emit "$version" false 'Yarr updated; obsolete backup cleanup pending'
            return 1
        fi
        yarr_update_emit "$version" "$YARR_ROLLED_BACK" 'Update failed; previous binary restored' || true
        return 1
    fi
    yarr_update_clear_tempdir
    yarr_update_emit "$version" false "Yarr updated to ${version}"
}

yarr_update_reset() {
    if ! yarr_update_with_lock yarr_update_reset_locked; then
        [[ "$YARR_RESET_CLEANUP_PENDING" == true ]] && return 1
        yarr_update_emit '' "$YARR_ROLLED_BACK" 'Reset failed; previous binary restored' || true
        return 1
    fi
    yarr_update_emit '' false 'Yarr reset to packaged binary'
}

command=${1:-}; shift || true
case "$command" in
    check) [[ "${1:-}" == --json && $# == 1 ]] || { yarr_update_error 'usage: yarr-update.sh check --json'; exit 2; }; yarr_update_check ;;
    apply) [[ "${1:-}" == --version && -n "${2:-}" && "${3:-}" == --json && $# == 3 ]] || { yarr_update_error 'usage: yarr-update.sh apply --version MAJOR.MINOR.PATCH --json'; exit 2; }; yarr_update_apply "$2" ;;
    reset) [[ "${1:-}" == --json && $# == 1 ]] || { yarr_update_error 'usage: yarr-update.sh reset --json'; exit 2; }; yarr_update_reset ;;
    *) yarr_update_error 'usage: yarr-update.sh {check --json|apply --version MAJOR.MINOR.PATCH --json|reset --json}'; exit 2 ;;
esac
