#!/usr/bin/env bash
set -euo pipefail

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

log_message() {
    if [[ -n "$root" ]]; then
        printf 'yarr-api: %s\n' "$*"
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

read_new_log() {
    local before_inode=$1 before_size=$2 current_inode current_size offset
    current_inode=$(stat -c %i "$api_log" 2>/dev/null || printf missing)
    current_size=$(stat -c %s "$api_log" 2>/dev/null || printf 0)
    if [[ "$current_inode" == "$before_inode" && "$current_size" -ge "$before_size" ]]; then
        offset=$((before_size + 1))
        tail -c "+${offset}" "$api_log" 2>/dev/null || true
    else
        cat "$api_log" 2>/dev/null || true
    fi
}

has_new_loader_failure() {
    grep -Eiq '(FATAL|Unhandled|ERR_MODULE_NOT_FOUND|Cannot find module|unraid-api-plugin-yarr[^[:cntrl:]]*(invalid|failed|error))'
}

probe_runtime() {
    local api_key='' response
    if [[ -n "${YARR_API_PROBE_KEY:-}" ]]; then
        api_key=$YARR_API_PROBE_KEY
    elif [[ -f "$api_credentials" ]]; then
        api_key=$(sed -n 's/^apikey="\([^"]*\)".*/\1/p' "$api_credentials" | head -n 1)
    fi
    local -a args=(--fail --silent --show-error --max-time 5 \
        --header 'Content-Type: application/json' \
        --data '{"query":"query YarrActivationProbe { yarrRuntime { __typename } }"}')
    [[ -z "$api_key" ]] || args+=(--header "x-api-key: ${api_key}")
    response=$("$curl_command" "${args[@]}" "$probe_url") || return 1
    jq -e '((.errors // []) | length) == 0 and .data.yarrRuntime.__typename == "YarrRuntime"' \
        <<< "$response" >/dev/null
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
const plugin = require(path.resolve(process.argv[2]));
if (plugin.adapter !== 'nestjs' || typeof plugin.ApiModule !== 'function') {
  throw new Error('invalid NestJS plugin exports');
}
if (typeof plugin.graphqlSchemaExtension !== 'string' || !/\byarrRuntime\b/.test(plugin.graphqlSchemaExtension)) {
  throw new Error('missing yarrRuntime schema contract');
}
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
before_inode=$(stat -c %i "$api_log" 2>/dev/null || printf missing)
before_size=$(stat -c %s "$api_log" 2>/dev/null || printf 0)

cleanup() {
    rm -rf -- "$stage" "$state_backup"
    rm -f -- "$temporary_link"
}
trap cleanup EXIT

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

if ! "$api_command" stop; then
    "$created_activation" && rm -rf -- "$activation"
    log_message 'could not stop unraid-api before activation'
    exit 1
fi

if [[ -L "$target" ]]; then
    prior_kind='link'
    prior_link=$(readlink "$target")
elif [[ -e "$target" ]]; then
    prior_kind=path
    mv -- "$target" "$prior_saved"
fi

activation_started=false
if register_plugin && mv -Tf -- "$temporary_link" "$target" && "$api_command" start; then
    activation_started=true
fi

verified=false
if "$activation_started"; then
    for ((attempt = 1; attempt <= attempts; attempt++)); do
        new_log=$(read_new_log "$before_inode" "$before_size")
        if has_new_loader_failure <<< "$new_log"; then
            break
        fi
        if probe_runtime; then
            new_log=$(read_new_log "$before_inode" "$before_size")
            if ! has_new_loader_failure <<< "$new_log"; then
                verified=true
                break
            fi
        fi
        sleep "$interval"
    done
fi

if "$verified"; then
    [[ "$prior_kind" != path ]] || rm -rf -- "$prior_saved"
    log_message "API plugin ${version} activated and yarrRuntime verified"
    exit 0
fi

log_message 'API activation failed; restoring prior loader state'
"$api_command" stop >/dev/null 2>&1 || true
rm -f -- "$target"
case "$prior_kind" in
    link)
        ln -s -- "$prior_link" "$temporary_link"
        mv -Tf -- "$temporary_link" "$target"
        ;;
    path) mv -- "$prior_saved" "$target" ;;
esac
restore_file "$state_backup/package.json" "$api_package_json"
restore_file "$state_backup/api.json" "$api_config_json"
"$api_command" start >/dev/null 2>&1 || true
if "$created_activation" && [[ "$activation" != "$prior_link" ]]; then
    rm -rf -- "$activation"
fi
exit 1
