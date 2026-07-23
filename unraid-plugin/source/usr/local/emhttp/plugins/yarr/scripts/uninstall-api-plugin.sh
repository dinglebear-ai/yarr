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
state_backup=$(mktemp -d)
removed_target="$api_nodes/.${plugin_name}.removing.$$"

cleanup() {
    rm -rf -- "$state_backup"
}
trap cleanup EXIT

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
    mv -f -- "$temporary" "$path"
}

restore_file() {
    local backup=$1 destination=$2 temporary
    [[ -f "$backup" ]] || return 0
    temporary=$(mktemp "${destination}.restore.XXXXXX")
    cp -p -- "$backup" "$temporary"
    mv -f -- "$temporary" "$destination"
}

[[ ! -f "$api_package_json" ]] || cp -p -- "$api_package_json" "$state_backup/package.json"
[[ ! -f "$api_config_json" ]] || cp -p -- "$api_config_json" "$state_backup/api.json"

"$api_command" stop
update_json "$api_package_json" \
    'del(.peerDependencies[$name], .peerDependenciesMeta[$name]) | if ((.peerDependencies // {}) | length) == 0 then del(.peerDependencies) else . end | if ((.peerDependenciesMeta // {}) | length) == 0 then del(.peerDependenciesMeta) else . end'
update_json "$api_config_json" \
    '.plugins = ((.plugins // []) | map(select((split("@")[0]) != $name)))'

had_target=false
if [[ -e "$target" || -L "$target" ]]; then
    mv -- "$target" "$removed_target"
    had_target=true
fi

if "$api_command" start; then
    rm -rf -- "$removed_target" "$store"
    if [[ -n "$root" ]]; then
        printf '%s\n' 'yarr-api: API plugin removed'
    else
        logger -t yarr 'API plugin removed'
    fi
    exit 0
fi

"$api_command" stop >/dev/null 2>&1 || true
restore_file "$state_backup/package.json" "$api_package_json"
restore_file "$state_backup/api.json" "$api_config_json"
if "$had_target"; then
    mv -- "$removed_target" "$target"
fi
"$api_command" start >/dev/null 2>&1 || true
exit 1
