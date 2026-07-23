#!/usr/bin/env bash
# shellcheck disable=SC2016,SC2034
# Readiness settings below are consumed by the sourced api-readiness module;
# single-quoted jq programs are intentionally evaluated by jq, not the shell.
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
root=${YARR_API_TEST_ROOT:-${YARR_TEST_ROOT:-}}
plugin_name=unraid-api-plugin-yarr
api_home="${root}/usr/local/unraid-api"
api_nodes="$api_home/node_modules"
target="$api_nodes/$plugin_name"
store="$api_nodes/.${plugin_name}"
api_package_json="$api_home/package.json"
api_config_json="${root}/boot/config/plugins/dynamix.my.servers/configs/api.json"
api_credentials="${root}/boot/config/plugins/dynamix.my.servers/myservers.cfg"
api_log="${root}/var/log/graphql-api.log"
api_command=${YARR_API_COMMAND:-unraid-api}
curl_command=${YARR_API_CURL:-/usr/bin/curl}
probe_url=${YARR_API_GRAPHQL_URL:-http://127.0.0.1/graphql}
proc_root=${YARR_API_PROC_ROOT:-${root:+${root}/proc}}
proc_root=${proc_root:-/proc}
expected_node=${YARR_API_NODE:-/usr/local/bin/node}
move_command=${YARR_API_MV:-/bin/mv}
remove_command=${YARR_API_RM:-/bin/rm}
attempts=${YARR_API_ATTEMPTS:-30}
interval=${YARR_API_INTERVAL:-1}
restart_attempts=${YARR_API_RESTART_ATTEMPTS:-3}
# shellcheck source=/usr/local/emhttp/plugins/yarr/scripts/api-readiness.sh
# shellcheck disable=SC1091
source "$script_dir/api-readiness.sh"

recovery=''
removed_target=''
removed_store=''
target_moved=false
store_moved=false
preparation_active=false
preparation_failure_step=''
transaction_active=false
api_was_running=unknown
api_process_state=unknown
prior_probe_mode=yarr-absent
rollback_readiness_proven=false
rollback_cleanup_pending=false
recovery_owner=''
recovery_group=''

log_message() {
    if [[ -n "$root" ]]; then
        printf 'yarr-api: %s\n' "$*" >&2
    else
        logger -t yarr "$*"
    fi
}

update_json() {
    local path=$1 filter=$2 temporary
    [[ -f "$path" ]] || return 0
    temporary=$(mktemp "${path}.tmp.XXXXXX")
    if ! jq --arg name "$plugin_name" "$filter" "$path" > "$temporary"; then
        rm -f -- "$temporary"
        return 1
    fi
    chmod --reference="$path" "$temporary"
    chown --reference="$path" "$temporary"
    "$move_command" -f -- "$temporary" "$path"
}

restore_file() {
    local backup=$1 destination=$2 temporary
    temporary=$(mktemp "${destination}.restore.XXXXXX")
    cp -p -- "$backup" "$temporary"
    "$move_command" -f -- "$temporary" "$destination"
}

restore_optional_file() {
    local label=$1 destination=$2
    if [[ -f "$recovery/${label}.present" ]]; then
        restore_file "$recovery/$label" "$destination"
    else
        "$remove_command" -f -- "$destination"
    fi
}

inspect_api_process_evidence() {
    local proc_dir cwd exe expected_exe arg candidate owned=false ambiguous=false
    local -a argv=() proc_dirs=()
    api_process_state=unknown
    [[ -d "$proc_root" && ! -L "$proc_root" ]] || {
        api_process_state=ambiguous
        return 0
    }
    expected_exe=$(readlink -f -- "$expected_node" 2>/dev/null) || {
        api_process_state=ambiguous
        return 0
    }
    shopt -s nullglob
    proc_dirs=("$proc_root"/[0-9]*)
    shopt -u nullglob
    for proc_dir in "${proc_dirs[@]}"; do
        [[ -d "$proc_dir" && ! -L "$proc_dir" ]] || continue
        argv=()
        while IFS= read -r -d '' arg; do
            argv+=("$arg")
        done < "$proc_dir/cmdline" 2>/dev/null || true
        ((${#argv[@]} >= 2)) || continue
        candidate=false
        for arg in "${argv[@]:1}"; do
            if [[ "$arg" == ./dist/main.js ||
                "$arg" == "$api_home/dist/main.js" ]]; then
                candidate=true
                break
            fi
        done
        "$candidate" || continue
        cwd=$(readlink -f -- "$proc_dir/cwd" 2>/dev/null) || {
            ambiguous=true
            continue
        }
        exe=$(readlink -f -- "$proc_dir/exe" 2>/dev/null) || {
            ambiguous=true
            continue
        }
        if [[ "$cwd" == "$api_home" && "$exe" == "$expected_exe" ]]; then
            owned=true
        else
            ambiguous=true
        fi
    done
    if "$owned"; then
        api_process_state=live
    elif "$ambiguous"; then
        api_process_state=ambiguous
    else
        api_process_state=none
    fi
}

detect_api_state() {
    local output status running=false stopped=false empty=false
    if output=$("$api_command" status 2>&1); then
        status=0
    else
        status=$?
    fi
    inspect_api_process_evidence
    [[ -z "${output//[[:space:]]/}" ]] && empty=true
    grep -Eiq '(^|[^[:alpha:]])(online|running)([^[:alpha:]]|$)' <<< "$output" && running=true
    grep -Eiq '(^|[^[:alpha:]])(stopped|offline)([^[:alpha:]]|$)' <<< "$output" && stopped=true
    if ((status != 0)); then
        log_message "API uninstall failed: prior unraid-api state is ambiguous (status ${status}, process ${api_process_state})"
        return 1
    fi
    if "$running" && ! "$stopped" && [[ "$api_process_state" == live ]]; then
        api_was_running=true
        return 0
    fi
    if { "$stopped" && ! "$running" || "$empty"; } &&
        [[ "$api_process_state" == none ]]; then
        api_was_running=false
        return 0
    fi
    if { "$running" && [[ "$api_process_state" != live ]]; } ||
        { { "$stopped" || "$empty"; } && [[ "$api_process_state" == live ]]; }; then
        log_message "API uninstall failed: prior unraid-api state is contradictory (status ${status}, process ${api_process_state})"
    else
        log_message "API uninstall failed: prior unraid-api state is ambiguous (status ${status}, process ${api_process_state})"
    fi
    return 1
}

restart_prior_api() {
    local attempt rollback_inode rollback_size
    for ((attempt = 1; attempt <= restart_attempts; attempt++)); do
        rollback_inode=$(stat -c %i "$api_log" 2>/dev/null || printf missing)
        rollback_size=$(stat -c %s "$api_log" 2>/dev/null || printf 0)
        if "$api_command" start; then
            if yarr_api_wait_ready "$prior_probe_mode" "$rollback_inode" "$rollback_size"; then
                return 0
            fi
            log_message "rollback unraid-api restart was not ready: ${YARR_API_READINESS_FAILURE}"
            return 1
        fi
        log_message "failed to restart prior unraid-api (attempt ${attempt} of ${restart_attempts})"
        ((attempt == restart_attempts)) || sleep "$interval"
    done
    log_message 'rollback could not restart prior unraid-api'
    return 1
}

loader_state_is_removed() {
    [[ ! -e "$target" && ! -L "$target" && ! -e "$store" && ! -L "$store" ]] || return 1
    if [[ -f "$api_package_json" ]] &&
        ! jq -e --arg name "$plugin_name" \
            '(.peerDependencies[$name] == null) and (.peerDependenciesMeta[$name] == null)' \
            "$api_package_json" >/dev/null; then
        return 1
    fi
    if [[ -f "$api_config_json" ]] &&
        ! jq -e --arg name "$plugin_name" \
            '(.plugins // []) | map(split("@")[0]) | index($name) == null' \
            "$api_config_json" >/dev/null; then
        return 1
    fi
}

recovery_identifier_is_safe() {
    [[ -n "$recovery" &&
        "$recovery" == "$api_nodes"/.unraid-api-plugin-yarr.uninstall-recovery.* &&
        ${recovery##*/} =~ ^\.unraid-api-plugin-yarr\.uninstall-recovery\.[A-Za-z0-9]{8}$ ]]
}

recovery_is_valid() {
    recovery_identifier_is_safe &&
        [[ -d "$recovery" && ! -L "$recovery" &&
            $(stat -c %a "$recovery" 2>/dev/null) == 700 &&
            $(stat -c %u "$recovery" 2>/dev/null) == "$recovery_owner" &&
            $(stat -c %g "$recovery" 2>/dev/null) == "$recovery_group" ]]
}

remove_recovery() {
    [[ -n "$recovery" ]] || return 0
    recovery_is_valid || return 1
    "$remove_command" -rf -- "$recovery" || return 1
    [[ ! -e "$recovery" && ! -L "$recovery" ]]
}

cleanup_pre_mutation_recovery() {
    local phase=$1
    if remove_recovery; then
        recovery=''
        return 0
    fi
    if recovery_is_valid; then
        log_message "API uninstall ${phase} cleanup pending: ${recovery##*/}; operator action: remove the retained mode-0700 transaction before retry"
    else
        log_message "API uninstall ${phase} cleanup failed and retained recovery identity is invalid; operator intervention required"
    fi
    return 1
}

preparation_step() {
    local label=$1
    shift
    if [[ "${YARR_API_UNINSTALL_FAILPOINT:-}" == "$label" ]] || ! "$@"; then
        preparation_failure_step=$label
        log_message "API uninstall preparation failed at ${label}"
        return 1
    fi
}

verify_prepared_file() {
    local source=$1 snapshot=$2 marker=$3
    [[ -f "$source" && ! -L "$source" &&
        -f "$snapshot" && ! -L "$snapshot" &&
        -f "$marker" && ! -L "$marker" ]] || return 1
    cmp -s -- "$source" "$snapshot" || return 1
    [[ $(stat -c '%u:%g:%a' "$snapshot") == "$(stat -c '%u:%g:%a' "$source")" &&
        $(stat -c %a "$marker") == 600 &&
        $(stat -c %u "$marker") == "$recovery_owner" &&
        $(stat -c %g "$marker") == "$recovery_group" ]]
}

sync_prepared_file() {
    local snapshot=$1 marker=$2
    sync -f "$snapshot" && sync -f "$marker"
}

prepare_optional_file() {
    local label=$1 source=$2 step_label=${1//./-}
    local snapshot="$recovery/$label" marker="$recovery/$label.present"
    if [[ -L "$source" || ( -e "$source" && ! -f "$source" ) ]]; then
        preparation_failure_step="${step_label}-copy"
        log_message "API uninstall preparation failed at ${step_label}-copy"
        return 1
    fi
    [[ -f "$source" ]] || return 0
    preparation_step "${step_label}-copy" cp -p -- "$source" "$snapshot" || return 1
    preparation_step "${step_label}-marker" install -m 0600 /dev/null "$marker" || return 1
    preparation_step "${step_label}-verify" verify_prepared_file \
        "$source" "$snapshot" "$marker" || return 1
    preparation_step "${step_label}-sync" sync_prepared_file "$snapshot" "$marker"
}

rollback_uninstall() {
    transaction_active=false
    if [[ "$api_was_running" == true ]]; then
        if ! "$api_command" stop >/dev/null 2>&1; then
            log_message 'API uninstall recovery incomplete: could not stop unready candidate API'
            return 1
        fi
    fi
    if "$store_moved"; then
        [[ ! -e "$store" && ! -L "$store" ]] || return 1
        "$move_command" -- "$removed_store" "$store" || return 1
        store_moved=false
    fi
    if "$target_moved"; then
        [[ ! -e "$target" && ! -L "$target" ]] || return 1
        "$move_command" -- "$removed_target" "$target" || return 1
        target_moved=false
    fi
    restore_optional_file package.json "$api_package_json" || return 1
    restore_optional_file api.json "$api_config_json" || return 1
    if [[ "$api_was_running" == true ]]; then
        restart_prior_api || return 1
    fi
    rollback_readiness_proven=true
    if ! remove_recovery; then
        rollback_cleanup_pending=true
        log_message "API uninstall prior state restored, but recovery cleanup is pending: ${recovery##*/}"
        return 1
    fi
    recovery=''
    return 0
}

on_exit() {
    local status=$?
    trap - EXIT
    if "$preparation_active"; then
        preparation_active=false
        if cleanup_pre_mutation_recovery preparation; then
            log_message 'API uninstall preparation aborted before mutation; recovery removed'
        fi
        status=1
    elif "$transaction_active"; then
        log_message 'API uninstall failed; restoring prior activation'
        if rollback_uninstall; then
            log_message 'API uninstall rollback restored the exact prior state and readiness'
        elif "$rollback_readiness_proven" && "$rollback_cleanup_pending"; then
            log_message "API uninstall rollback restored the exact prior state and readiness; cleanup pending: ${recovery##*/}"
        else
            log_message "API uninstall recovery incomplete; retained recovery: ${recovery##*/}"
        fi
        status=1
    fi
    exit "$status"
}
trap on_exit EXIT

detect_api_state || exit 1
if [[ "$api_was_running" == true ]] && ! yarr_api_probe_graphql yarr-present; then
    log_message 'API uninstall failed: prior Yarr GraphQL readiness is unproven'
    exit 1
fi

mkdir -p "$api_nodes"
umask 077
recovery=$(mktemp -d "$api_nodes/.${plugin_name}.uninstall-recovery.XXXXXXXX")
preparation_active=true
recovery_owner=$(id -u)
recovery_group=$(id -g)
preparation_step recovery-chmod chmod 0700 "$recovery" || exit 1
preparation_step recovery-verify recovery_is_valid || exit 1
recovery_identifier_is_safe || {
    log_message 'API uninstall failed: recovery identifier is unsafe'
    exit 1
}
removed_target="$recovery/target"
removed_store="$recovery/store"

prepare_optional_file package.json "$api_package_json" || exit 1
prepare_optional_file api.json "$api_config_json" || exit 1
preparation_step recovery-sync sync -f "$recovery" || exit 1
preparation_step parent-sync sync -f "$api_nodes" || exit 1
if jq -e --arg name "$plugin_name" \
    '(.peerDependencies[$name] != null)' "$recovery/package.json" >/dev/null 2>&1 ||
    jq -e --arg name "$plugin_name" \
    '(.plugins // []) | map(split("@")[0]) | index($name) != null' \
    "$recovery/api.json" >/dev/null 2>&1; then
    prior_probe_mode=yarr-present
fi
preparation_active=false

if [[ "$api_was_running" == true ]] && ! "$api_command" stop; then
    log_message 'API uninstall failed: could not stop unraid-api'
    cleanup_pre_mutation_recovery pre-mutation || true
    exit 1
fi
transaction_active=true

if ! update_json "$api_package_json" \
    'del(.peerDependencies[$name], .peerDependenciesMeta[$name]) | if ((.peerDependencies // {}) | length) == 0 then del(.peerDependencies) else . end | if ((.peerDependenciesMeta // {}) | length) == 0 then del(.peerDependenciesMeta) else . end'; then
    log_message 'API uninstall failed: package loader update failed'
    exit 1
fi
if ! update_json "$api_config_json" \
    '.plugins = ((.plugins // []) | map(select((split("@")[0]) != $name)))'; then
    log_message 'API uninstall failed: API configuration update failed'
    exit 1
fi

if [[ -e "$target" || -L "$target" ]]; then
    if ! "$move_command" -- "$target" "$removed_target"; then
        log_message 'API uninstall failed: could not detach active module'
        exit 1
    fi
    target_moved=true
fi
if [[ -L "$store" ]]; then
    log_message 'API uninstall failed: immutable package store is a link'
    exit 1
fi
if [[ -e "$store" ]]; then
    if ! "$move_command" -- "$store" "$removed_store"; then
        log_message 'API uninstall failed: could not detach immutable package store'
        exit 1
    fi
    store_moved=true
fi
loader_state_is_removed || {
    log_message 'API uninstall failed: detached loader state is inconsistent'
    exit 1
}

if [[ "$api_was_running" == true ]]; then
    before_inode=$(stat -c %i "$api_log" 2>/dev/null || printf missing)
    before_size=$(stat -c %s "$api_log" 2>/dev/null || printf 0)
    if ! "$api_command" start; then
        log_message 'API uninstall failed: unraid-api launch failed without Yarr'
        exit 1
    fi
    if ! yarr_api_wait_ready yarr-absent "$before_inode" "$before_size"; then
        log_message "API uninstall failed: ${YARR_API_READINESS_FAILURE}"
        exit 1
    fi
fi
loader_state_is_removed || {
    log_message 'API uninstall failed: loader state changed before commit'
    exit 1
}

transaction_active=false
if ! remove_recovery; then
    log_message "API plugin is ready without Yarr, but detached recovery cleanup is pending: ${recovery##*/}"
    exit 1
fi
recovery=''
if [[ "$api_was_running" == true ]]; then
    log_message 'API plugin removed; authenticated host readiness and Yarr schema absence verified'
else
    log_message 'API plugin removed; prior stopped API state preserved'
fi
