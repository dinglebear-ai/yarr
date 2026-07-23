#!/usr/bin/env bash
# shellcheck disable=SC2034,SC2154
# This sourced module consumes caller-provided readiness settings and exports
# YARR_API_READINESS_FAILURE to the caller.

yarr_api_read_new_log() {
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

yarr_api_has_new_loader_failure() {
    grep -Eiq '(FATAL|Unhandled|ERR_MODULE_NOT_FOUND|Cannot find module|unraid-api-plugin-yarr[^[:cntrl:]]*(invalid|failed|error))'
}

yarr_api_probe_graphql() {
    local mode=$1 api_key='' response header_file='' curl_status body filter
    if [[ -n "${YARR_API_PROBE_KEY:-}" ]]; then
        api_key=$YARR_API_PROBE_KEY
    elif [[ -f "$api_credentials" ]]; then
        api_key=$(sed -n 's/^apikey="\([^"]*\)".*/\1/p' "$api_credentials" | head -n 1)
    fi
    case "$mode" in
        yarr-present)
            body='{"query":"query YarrActivationProbe { yarrRuntime { __typename } }"}'
            filter='((.errors // []) | length) == 0 and .data.yarrRuntime.__typename == "YarrRuntime"'
            ;;
        yarr-absent)
            body='{"query":"query YarrUninstallProbe { queryType: __type(name: \"Query\") { fields { name } } mutationType: __type(name: \"Mutation\") { fields { name } } }"}'
            filter='
              ((.errors // []) | length) == 0 and
              (.data.queryType.fields | type) == "array" and
              (.data.mutationType.fields | type) == "array" and
              ([.data.queryType.fields[].name, .data.mutationType.fields[].name] |
                all(test("^yarr"; "i") | not))
            '
            ;;
        *) return 2 ;;
    esac
    local -a args=(--fail --silent --show-error --max-time 5
        --header 'Content-Type: application/json' --data "$body")
    if [[ -n "$api_key" ]]; then
        umask 077
        header_file=$(mktemp "${TMPDIR:-/tmp}/yarr-api-probe.XXXXXX")
        chmod 0600 "$header_file"
        printf 'x-api-key: %s\n' "$api_key" > "$header_file"
        args+=(--header "@${header_file}")
    fi
    if response=$("$curl_command" "${args[@]}" "$probe_url"); then
        curl_status=0
    else
        curl_status=$?
    fi
    [[ -z "$header_file" ]] || rm -f -- "$header_file"
    (( curl_status == 0 )) || return "$curl_status"
    jq -e "$filter" <<< "$response" >/dev/null
}

yarr_api_wait_ready() {
    local mode=$1 before_inode=$2 before_size=$3 attempt new_log
    YARR_API_READINESS_FAILURE=''
    for ((attempt = 1; attempt <= attempts; attempt++)); do
        new_log=$(yarr_api_read_new_log "$before_inode" "$before_size")
        if yarr_api_has_new_loader_failure <<< "$new_log"; then
            YARR_API_READINESS_FAILURE='new fatal/module-load error in graphql-api.log'
            return 1
        fi
        if yarr_api_probe_graphql "$mode"; then
            new_log=$(yarr_api_read_new_log "$before_inode" "$before_size")
            if yarr_api_has_new_loader_failure <<< "$new_log"; then
                YARR_API_READINESS_FAILURE='new fatal/module-load error in graphql-api.log'
                return 1
            fi
            return 0
        fi
        ((attempt == attempts)) || sleep "$interval"
    done
    if [[ "$mode" == yarr-present ]]; then
        YARR_API_READINESS_FAILURE='yarrRuntime probe failed'
    else
        YARR_API_READINESS_FAILURE='host GraphQL readiness or Yarr schema-removal probe failed'
    fi
    return 1
}
