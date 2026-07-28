#!/usr/bin/env bash

# Shared teardown for tests that launch the real rc.yarr service wrapper.
# Fallback signals are scoped to this test's temporary root, so production
# Yarr processes cannot match.

yarr_test_pid_running() {
    local pid=$1 remainder state
    [[ -r "/proc/${pid}/stat" ]] || return 1
    remainder=$(<"/proc/${pid}/stat")
    remainder=${remainder##*) }
    state=${remainder%% *}
    [[ "$state" != Z ]]
}

yarr_test_proc_uses_root() {
    local proc=$1 root=$2 entry exe env_fd owner
    owner=$(stat -c '%u' "$proc" 2>/dev/null || true)
    [[ "$owner" == "$EUID" ]] || return 1
    exe=$(readlink "${proc}/exe" 2>/dev/null || true)
    exe=${exe%' (deleted)'}
    [[ "$exe" == "$root"/* ]] && return 0
    exec {env_fd}<"${proc}/environ" 2>/dev/null || return 1
    while IFS= read -r -d '' entry <&"$env_fd"; do
        case "$entry" in
            YARR_PLUGIN_ROOT="$root"|YARR_PLUGIN_ROOT="$root"/*|\
            YARR_APPDATA_ROOT="$root"|YARR_APPDATA_ROOT="$root"/*|\
            YARR_APPDATA="$root"|YARR_APPDATA="$root"/*|\
            YARR_RUN_ROOT="$root"|YARR_RUN_ROOT="$root"/*)
                exec {env_fd}<&-
                return 0
                ;;
        esac
    done
    exec {env_fd}<&-
    return 1
}

yarr_test_proc_is_owned() {
    local proc=$1 root=$2 rc_path=$3 arg previous='' candidate=false
    [[ -r "${proc}/cmdline" ]] || return 1
    while IFS= read -r -d '' arg; do
        if [[ "$previous" == serve && "$arg" == mcp ]]; then
            candidate=true
            break
        fi
        if [[ "$arg" == "$rc_path" || "$arg" == */yarr-update.sh ]]; then
            candidate=true
            break
        fi
        previous=$arg
    done < "${proc}/cmdline"
    [[ "$candidate" == true ]] || return 1
    yarr_test_proc_uses_root "$proc" "$root"
}

yarr_test_owned_pids() {
    local root=$1 rc_path=$2 proc pid
    for proc in /proc/[0-9]*; do
        pid=${proc##*/}
        [[ "$pid" == "$$" || "$pid" == "${BASHPID:-$$}" ]] && continue
        yarr_test_pid_running "$pid" || continue
        yarr_test_proc_is_owned "$proc" "$root" "$rc_path" && printf '%s\n' "$pid"
    done
}

yarr_test_normal_stop() {
    local root=$1 rc_path=$2
    [[ -x "$rc_path" ]] || return 0
    [[ ${YARR_PLUGIN_ROOT:-} == "$root"/* && ${YARR_RUN_ROOT:-} == "$root"/* ]] || return 0
    YARR_LOCK_WAIT_SECONDS=0 \
    YARR_STOP_ATTEMPTS=2 \
    YARR_STOP_INTERVAL=0.02 \
        "$rc_path" stop >/dev/null 2>&1 || true
}

yarr_test_terminate_owned_processes() {
    local root=$1 rc_path=$2 attempt pid
    local -a pids=() remaining=()
    mapfile -t pids < <(yarr_test_owned_pids "$root" "$rc_path")
    ((${#pids[@]} == 0)) && return 0

    for pid in "${pids[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
    for ((attempt = 0; attempt < 100; attempt++)); do
        remaining=()
        for pid in "${pids[@]}"; do
            yarr_test_pid_running "$pid" && remaining+=("$pid")
        done
        ((${#remaining[@]} == 0)) && break
        sleep 0.02
    done
    for pid in "${remaining[@]}"; do kill -KILL "$pid" 2>/dev/null || true; done
    for pid in "${pids[@]}"; do wait "$pid" 2>/dev/null || true; done
}

yarr_test_assert_no_owned_processes() {
    local root=$1 rc_path=$2
    local -a pids=()
    mapfile -t pids < <(yarr_test_owned_pids "$root" "$rc_path")
    if ((${#pids[@]} > 0)); then
        printf 'test cleanup leaked Yarr process(es): %s\n' "${pids[*]}" >&2
        return 1
    fi
}

yarr_test_cleanup_exit() {
    local status=$?
    trap - EXIT HUP INT TERM
    set +e
    yarr_test_normal_stop "$YARR_TEST_CLEANUP_ROOT" "$YARR_TEST_CLEANUP_RC"
    yarr_test_terminate_owned_processes "$YARR_TEST_CLEANUP_ROOT" "$YARR_TEST_CLEANUP_RC"
    if ! yarr_test_assert_no_owned_processes "$YARR_TEST_CLEANUP_ROOT" "$YARR_TEST_CLEANUP_RC"; then
        [[ "$status" == 0 ]] && status=1
    fi
    rm -rf -- "$YARR_TEST_CLEANUP_TMP_DIR"
    exit "$status"
}

yarr_test_install_cleanup() {
    YARR_TEST_CLEANUP_TMP_DIR=$1
    YARR_TEST_CLEANUP_ROOT=$2
    YARR_TEST_CLEANUP_RC=$3
    trap 'yarr_test_cleanup_exit' EXIT
    trap 'exit 129' HUP
    trap 'exit 130' INT
    trap 'exit 143' TERM
}
