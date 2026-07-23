#!/usr/bin/env bash
set -euo pipefail

root=${YARR_API_TEST_ROOT:-${YARR_TEST_ROOT:-}}
plugin_name=unraid-api-plugin-yarr
api_home="${root}/usr/local/unraid-api"
api_nodes="$api_home/node_modules"
target="$api_nodes/$plugin_name"
store="$api_nodes/.${plugin_name}"
api_package_json="$api_home/package.json"
api_config_json="${root}/boot/config/plugins/dynamix.my.servers/configs/api.json"
api_command=${YARR_API_COMMAND:-unraid-api}
move_command=${YARR_API_MV:-/bin/mv}
remove_command=${YARR_API_RM:-/bin/rm}
interval=${YARR_API_INTERVAL:-1}
restart_attempts=${YARR_API_RESTART_ATTEMPTS:-3}
state_backup=$(mktemp -d)
removed_target="$api_nodes/.${plugin_name}.removing.$$"
removed_store="$api_nodes/.${plugin_name}.store-removing.$$"
target_moved=false
store_moved=false
transaction_active=false

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
    [[ -f "$backup" ]] || return 0
    temporary=$(mktemp "${destination}.restore.XXXXXX")
    cp -p -- "$backup" "$temporary"
    "$move_command" -f -- "$temporary" "$destination"
}

restart_prior_api() {
    local attempt
    for ((attempt = 1; attempt <= restart_attempts; attempt++)); do
        if "$api_command" start; then
            return 0
        fi
        log_message "failed to restart prior unraid-api (attempt ${attempt} of ${restart_attempts})"
        ((attempt == restart_attempts)) || sleep "$interval"
    done
    log_message 'rollback could not restart prior unraid-api'
    return 1
}

rollback_uninstall() {
    local failed=false
    transaction_active=false
    "$api_command" stop >/dev/null 2>&1 || failed=true
    if "$store_moved"; then
        "$move_command" -- "$removed_store" "$store" || failed=true
    fi
    if "$target_moved"; then
        "$move_command" -- "$removed_target" "$target" || failed=true
    fi
    restore_file "$state_backup/package.json" "$api_package_json" || failed=true
    restore_file "$state_backup/api.json" "$api_config_json" || failed=true
    restart_prior_api || failed=true
    "$failed" && return 1
    return 0
}

cleanup() {
    rm -rf -- "$state_backup"
}

on_exit() {
    local status=$?
    trap - EXIT
    if "$transaction_active"; then
        log_message 'API uninstall failed; restoring prior activation'
        rollback_uninstall || status=1
    fi
    cleanup || status=1
    exit "$status"
}
trap on_exit EXIT

[[ ! -f "$api_package_json" ]] || cp -p -- "$api_package_json" "$state_backup/package.json"
[[ ! -f "$api_config_json" ]] || cp -p -- "$api_config_json" "$state_backup/api.json"

if ! "$api_command" stop; then
    log_message 'API uninstall failed: could not stop unraid-api'
    restart_prior_api || log_message 'unraid-api state could not be recovered after stop failure'
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
if [[ -e "$store" ]]; then
    if ! "$move_command" -- "$store" "$removed_store"; then
        log_message 'API uninstall failed: could not detach immutable package store'
        exit 1
    fi
    store_moved=true
fi

if ! "$api_command" start; then
    log_message 'API uninstall failed: unraid-api did not restart without Yarr'
    exit 1
fi
transaction_active=false

if ! "$remove_command" -rf -- "$removed_target" "$removed_store"; then
    log_message 'API plugin was deactivated, but detached artifacts could not be removed'
    exit 1
fi
log_message 'API plugin removed'
