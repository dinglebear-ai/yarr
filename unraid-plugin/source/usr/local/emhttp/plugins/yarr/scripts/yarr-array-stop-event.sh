#!/bin/bash
set -u

yarr_array_stop_event() {
    local rc=${YARR_RC:-/etc/rc.d/rc.yarr}
    local attempts=${YARR_EVENT_ATTEMPTS:-3}
    local lock_wait=${YARR_EVENT_LOCK_WAIT_SECONDS:-20}
    local retry_seconds=${YARR_EVENT_RETRY_SECONDS:-2}
    local hook_name=${YARR_HOOK_NAME:-$(basename "$0")}
    local attempt=1 status

    report_failure() {
        local message=$1
        printf 'yarr %s hook: %s\n' "$hook_name" "$message" >&2
        logger -t yarr-plugin -- "$hook_name hook: $message" 2>/dev/null || true
    }

    while (( attempt <= attempts )); do
        if YARR_ARRAY_STOPPING_REQUEST=yes YARR_LOCK_WAIT_SECONDS=$lock_wait "$rc" stop; then
            if YARR_LOCK_WAIT_SECONDS=$lock_wait "$rc" status >/dev/null 2>&1; then
                report_failure "stop returned success but the daemon is still running"
            else
                status=$?
                [[ $status -eq 3 ]] && return 0
                report_failure "daemon quiescence could not be proven (status $status)"
            fi
        fi
        (( attempt < attempts )) && sleep "$retry_seconds"
        ((attempt += 1))
    done

    report_failure "refusing to continue before unmount after ${attempts} bounded attempts"
    return 1
}
