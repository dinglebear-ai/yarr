#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
root=${YARR_API_TEST_ROOT:-}
plugin_name=unraid-api-plugin-yarr
payload="${root}/usr/local/emhttp/plugins/yarr/api"
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
node_command=${YARR_API_NODE:-/usr/bin/node}
probe_url=${YARR_API_GRAPHQL_URL:-http://127.0.0.1/graphql}
attempts=${YARR_API_ATTEMPTS:-30}
interval=${YARR_API_INTERVAL:-1}
restart_attempts=${YARR_API_RESTART_ATTEMPTS:-3}
# shellcheck source=/usr/local/emhttp/plugins/yarr/scripts/api-readiness.sh
source "$script_dir/api-readiness.sh"

log_message() {
    if [[ -n "$root" ]]; then
        printf 'yarr-api: %s\n' "$*" >&2
    else
        logger -t yarr "$*"
    fi
}

payload_hash() {
    local directory=$1
    (
        cd "$directory"
        find . -type f -print0 | sort -z | xargs -0 sha256sum
    ) | sha256sum | cut -d' ' -f1
}

update_json() {
    local path=$1 filter=$2 temporary
    [[ -f "$path" ]] || { printf 'missing loader state: %s\n' "$path" >&2; return 1; }
    temporary=$(mktemp "${path}.tmp.XXXXXX")
    if ! jq --arg name "$plugin_name" "$filter" "$path" > "$temporary"; then
        rm -f -- "$temporary"
        return 1
    fi
    chmod --reference="$path" "$temporary"
    chown --reference="$path" "$temporary"
    mv -f -- "$temporary" "$path"
}

register_plugin() {
    update_json "$api_package_json" \
        '.peerDependencies = ((.peerDependencies // {}) + {($name): "*"}) | .peerDependenciesMeta = ((.peerDependenciesMeta // {}) + {($name): {"optional": true}})'
    update_json "$api_config_json" \
        '.plugins = ((.plugins // []) | if map(split("@")[0]) | index($name) then . else . + [$name] end)'
}

restore_file() {
    local backup=$1 destination=$2 temporary
    temporary=$(mktemp "${destination}.restore.XXXXXX")
    cp -p -- "$backup" "$temporary"
    mv -f -- "$temporary" "$destination"
}

[[ -f "$payload/package.json" && -f "$payload/package-lock.json" && -f "$payload/dist/index.js" ]] || {
    log_message 'complete API payload is missing'
    exit 1
}
if find "$payload" -type l -print -quit | grep -q .; then
    log_message 'API payload contains a link'
    exit 1
fi
version=$(jq -er --arg name "$plugin_name" 'select(.name == $name) | .version | select(test("^[0-9]+\\.[0-9]+\\.[0-9]+$"))' "$payload/package.json")
lock_version=$(jq -er '.packages[""].version // .version' "$payload/package-lock.json")
[[ "$lock_version" == "$version" ]] || { log_message 'API package metadata versions differ'; exit 1; }

NODE_PATH="$api_nodes" "$node_command" - "$payload" <<'NODE'
const path = require('node:path');
const { parse } = require('graphql');

(async () => {
  const payload = path.resolve(process.argv[2]);
  const metadata = require(path.join(payload, 'package.json'));
  const loaderEntry = path.resolve(payload, metadata.main);
  const plugin = require(payload);
  if (loaderEntry !== require.resolve(payload)) {
    throw new Error('package main does not resolve to the loader entry');
  }
  if (plugin.adapter !== 'nestjs' || typeof plugin.ApiModule !== 'function') {
    throw new Error('invalid NestJS plugin exports');
  }
  if (typeof plugin.graphqlSchemaExtension !== 'function') {
    throw new Error('graphqlSchemaExtension must export the packaged async function');
  }
  const schema = await plugin.graphqlSchemaExtension();
  if (typeof schema !== 'string' || !/\byarrRuntime\b/.test(schema) || !/\byarrConfig\b/.test(schema)) {
    throw new Error('resolved GraphQL SDL is missing the Yarr schema contract');
  }
  parse(schema);
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
NODE

hash=$(payload_hash "$payload")
activation="$store/${version}-${hash:0:16}"
stage="$store/.new.$$"
temporary_link="$api_nodes/${plugin_name}.new.$$"
state_backup=$(mktemp -d)
created_activation=false
prior_kind=missing
prior_link=''
prior_saved="$store/.prior-target.$$"
prior_detached=false
target_swapped=false
transaction_active=false
before_inode=$(stat -c %i "$api_log" 2>/dev/null || printf missing)
before_size=$(stat -c %s "$api_log" 2>/dev/null || printf 0)

cleanup() {
    rm -rf -- "$stage" "$state_backup"
    rm -f -- "$temporary_link"
}

restart_prior_api() {
    local mode=$1 attempt rollback_inode rollback_size
    for ((attempt = 1; attempt <= restart_attempts; attempt++)); do
        rollback_inode=$(stat -c %i "$api_log" 2>/dev/null || printf missing)
        rollback_size=$(stat -c %s "$api_log" 2>/dev/null || printf 0)
        if "$api_command" start; then
            if yarr_api_wait_ready "$mode" "$rollback_inode" "$rollback_size"; then
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

rollback_activation() {
    local failed=false
    transaction_active=false
    "$api_command" stop >/dev/null 2>&1 || failed=true
    if "$target_swapped"; then
        rm -f -- "$target" || failed=true
    fi
    case "$prior_kind" in
        link)
            if "$target_swapped"; then
                ln -s -- "$prior_link" "$temporary_link" || failed=true
                if [[ -L "$temporary_link" ]]; then
                    mv -Tf -- "$temporary_link" "$target" || failed=true
                fi
            fi
            ;;
        path)
            if "$prior_detached"; then
                mv -- "$prior_saved" "$target" || failed=true
            fi
            ;;
    esac
    restore_file "$state_backup/package.json" "$api_package_json" || failed=true
    restore_file "$state_backup/api.json" "$api_config_json" || failed=true
    restart_prior_api "$prior_probe_mode" || failed=true
    if "$created_activation" && [[ "$activation" != "$prior_link" ]]; then
        rm -rf -- "$activation" || failed=true
    fi
    "$failed" && return 1
    return 0
}

on_exit() {
    local status=$?
    trap - EXIT
    if "$transaction_active"; then
        rollback_activation || status=1
    fi
    cleanup || status=1
    exit "$status"
}
trap on_exit EXIT

mkdir -p "$store"
if [[ ! -d "$activation" ]]; then
    mkdir -p "$stage"
    cp -a -- "$payload/." "$stage/"
    [[ $(payload_hash "$stage") == "$hash" ]] || { log_message 'API activation copy differs from payload'; exit 1; }
    mv -- "$stage" "$activation"
    created_activation=true
fi
ln -s -- "$activation" "$temporary_link"

cp -p -- "$api_package_json" "$state_backup/package.json"
cp -p -- "$api_config_json" "$state_backup/api.json"
prior_probe_mode=yarr-absent
if jq -e --arg name "$plugin_name" \
    '(.peerDependencies[$name] != null)' "$state_backup/package.json" >/dev/null 2>&1 ||
    jq -e --arg name "$plugin_name" \
    '(.plugins // []) | map(split("@")[0]) | index($name) != null' \
    "$state_backup/api.json" >/dev/null 2>&1; then
    prior_probe_mode=yarr-present
fi

if ! "$api_command" stop; then
    "$created_activation" && rm -rf -- "$activation"
    log_message 'could not stop unraid-api before activation'
    restart_prior_api "$prior_probe_mode" || log_message 'unraid-api state could not be recovered after stop failure'
    exit 1
fi
transaction_active=true

if [[ -L "$target" ]]; then
    prior_kind='link'
    prior_link=$(readlink "$target")
elif [[ -e "$target" ]]; then
    prior_kind=path
    mv -- "$target" "$prior_saved"
    prior_detached=true
fi

activation_started=false
failure_reason=''
if ! register_plugin; then
    failure_reason='loader state update failed'
elif ! mv -Tf -- "$temporary_link" "$target"; then
    failure_reason='atomic module switch failed'
else
    target_swapped=true
    if "$api_command" start; then
        activation_started=true
    else
        failure_reason='candidate unraid-api start failed'
    fi
fi

verified=false
if "$activation_started"; then
    if yarr_api_wait_ready yarr-present "$before_inode" "$before_size"; then
        verified=true
    elif [[ -z "$failure_reason" ]]; then
        failure_reason=$YARR_API_READINESS_FAILURE
    fi
fi

if "$verified"; then
    transaction_active=false
    if [[ "$prior_kind" == path ]] && ! rm -rf -- "$prior_saved"; then
        log_message "could not remove detached prior API target: ${prior_saved}"
    fi
    log_message "API plugin ${version} activated and yarrRuntime verified"
    exit 0
fi

[[ -n "$failure_reason" ]] || failure_reason='unknown activation failure'
log_message "API activation failed: ${failure_reason}; restoring prior loader state"
exit 1
