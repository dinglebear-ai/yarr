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
transaction_active=false
api_was_running=unknown
prior_probe_mode=yarr-absent
rollback_readiness_proven=false
rollback_cleanup_pending=false

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

detect_api_state() {
    local output status running=false stopped=false
    if output=$("$api_command" status 2>&1); then
        status=0
    else
        status=$?
    fi
    grep -Eiq '(^|[^[:alpha:]])(online|running)([^[:alpha:]]|$)' <<< "$output" && running=true
    grep -Eiq '(^|[^[:alpha:]])(stopped|offline)([^[:alpha:]]|$)' <<< "$output" && stopped=true
    if "$running" && ! "$stopped"; then
        api_was_running=true
        return 0
    fi
    if "$stopped" && ! "$running"; then
        api_was_running=false
        return 0
    fi
    if (( status == 3 )) && [[ -z "$output" ]]; then
        api_was_running=false
        return 0
    fi
    log_message "API uninstall failed: prior unraid-api state is ambiguous (status ${status})"
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

remove_recovery() {
    [[ -n "$recovery" ]] || return 0
    "$remove_command" -rf -- "$recovery"
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
    if "$transaction_active"; then
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
chmod 0700 "$recovery"
[[ ${recovery##*/} =~ ^\.unraid-api-plugin-yarr\.uninstall-recovery\.[A-Za-z0-9]{8}$ ]] || {
    log_message 'API uninstall failed: recovery identifier is unsafe'
    exit 1
}
removed_target="$recovery/target"
removed_store="$recovery/store"

if [[ -f "$api_package_json" ]]; then
    cp -p -- "$api_package_json" "$recovery/package.json"
    : > "$recovery/package.json.present"
fi
if [[ -f "$api_config_json" ]]; then
    cp -p -- "$api_config_json" "$recovery/api.json"
    : > "$recovery/api.json.present"
fi
if jq -e --arg name "$plugin_name" \
    '(.peerDependencies[$name] != null)' "$recovery/package.json" >/dev/null 2>&1 ||
    jq -e --arg name "$plugin_name" \
    '(.plugins // []) | map(split("@")[0]) | index($name) != null' \
    "$recovery/api.json" >/dev/null 2>&1; then
    prior_probe_mode=yarr-present
fi

if [[ "$api_was_running" == true ]] && ! "$api_command" stop; then
    log_message 'API uninstall failed: could not stop unraid-api'
    if remove_recovery; then
        recovery=''
    else
        log_message "API uninstall pre-mutation cleanup pending: ${recovery##*/}"
    fi
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
