#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
helper="$repo_root/unraid-plugin/tests/test-service-cleanup.sh"
tmp_dir=$(mktemp -d)
test_root="$tmp_dir/root"
fake_rc="$tmp_dir/rc.yarr"
pids_file=$(mktemp)
declare -a child_pids=()

parent_cleanup() {
    local pid
    for pid in "${child_pids[@]:-}"; do
        kill -KILL "$pid" 2>/dev/null || true
    done
    rm -rf -- "$tmp_dir"
    rm -f -- "$pids_file"
}
trap parent_cleanup EXIT

cat > "$fake_rc" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod 755 "$fake_rc"
mkdir -p "$test_root/bin" "$test_root/run" "$test_root/plugin"

set +e
(
    export YARR_PLUGIN_ROOT="$test_root/plugin"
    export YARR_RUN_ROOT="$test_root/run"
    # shellcheck source-path=SCRIPTDIR
    # shellcheck source=test-service-cleanup.sh
    source "$helper"
    yarr_test_install_cleanup "$tmp_dir" "$test_root" "$fake_rc"

    python_bin=/usr/bin/python3
    # $1 and $2 intentionally expand inside the child shell.
    # shellcheck disable=SC2016
    bash -c 'exec -a "$1" "$2" -c "import time; time.sleep(300)" serve mcp' \
        _ "$test_root/bin/yarr" "$python_bin" &
    service_pid=$!
    # $1 intentionally expands inside the child shell.
    # shellcheck disable=SC2016
    env YARR_RUN_ROOT="$YARR_RUN_ROOT" \
        bash -c 'exec -a "$1" /usr/bin/sleep 300' _ "$fake_rc" &
    controller_pid=$!
    # This process is deliberately Yarr-shaped but carries no test-root path
    # or YARR_* root. Teardown must leave it alone.
    # shellcheck disable=SC2016
    env -u YARR_PLUGIN_ROOT -u YARR_RUN_ROOT \
        bash -c 'exec -a yarr "$1" -c "import time; time.sleep(300)" serve mcp' \
        _ "$python_bin" &
    unrelated_pid=$!
    printf '%s\n%s\n%s\n' "$service_pid" "$controller_pid" "$unrelated_pid" > "$pids_file"
    sleep 0.1
    kill -0 "$service_pid" "$controller_pid" "$unrelated_pid"
    mapfile -t discovered < <(yarr_test_owned_pids "$test_root" "$fake_rc")
    ((${#discovered[@]} == 2)) || {
        printf 'test cleanup contract: expected 2 owned processes, found %s\n' \
            "${#discovered[@]}" >&2
        exit 1
    }
    kill -TERM "$BASHPID"
)
status=$?
set -e

[[ "$status" == 143 ]] || {
    printf 'test cleanup contract: expected signal exit 143, got %s\n' "$status" >&2
    exit 1
}
mapfile -t child_pids < "$pids_file"
for pid in "${child_pids[@]:0:2}"; do
    if kill -0 "$pid" 2>/dev/null; then
        printf 'test cleanup contract: leaked test-owned PID %s\n' "$pid" >&2
        exit 1
    fi
done
unrelated_pid=${child_pids[2]}
kill -0 "$unrelated_pid" 2>/dev/null || {
    printf 'test cleanup contract: teardown killed unrelated PID %s\n' \
        "$unrelated_pid" >&2
    exit 1
}
kill -TERM "$unrelated_pid" 2>/dev/null || true
wait "$unrelated_pid" 2>/dev/null || true
child_pids=()

printf 'test cleanup contract: PASS\n'
