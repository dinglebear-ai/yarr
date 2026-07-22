#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
updater="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-update.sh"
common="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh"
rc="$repo_root/unraid-plugin/source/etc/rc.d/rc.yarr"
fixture="$repo_root/unraid-plugin/tests/fixtures/releases.json"
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

fail() {
    printf 'update contract: %s\n' "$1" >&2
    exit 1
}

expect_failure() {
    local label=$1
    shift
    if "$@" >"$tmp_dir/command.out" 2>"$tmp_dir/command.err"; then
        fail "$label unexpectedly succeeded"
    fi
}

expect_eq() {
    local expected=$1 actual=$2 label=$3
    [[ "$actual" == "$expected" ]] || fail "$label: expected $expected, got $actual"
}

[[ -x "$updater" ]] || fail "missing executable yarr-update.sh"

test_root="$tmp_dir/root"
export YARR_PLUGIN_ROOT="$test_root/plugin"
export YARR_BOOT_ROOT="$test_root/boot"
export YARR_APPDATA_ROOT="$test_root/appdata"
export YARR_RUN_ROOT="$test_root/run"
export YARR_LOCK_ROOT="$test_root/lock"
export YARR_LOG_ROOT="$test_root/log"
export YARR_APPDATA="$YARR_APPDATA_ROOT/yarr"
export YARR_OVERLAY_DIR="$YARR_APPDATA/bin"
export YARR_PID="$YARR_RUN_ROOT/yarr.pid"
export YARR_LOCK="$YARR_LOCK_ROOT/yarr-plugin.lock"
export YARR_CURL_BIN="$test_root/bin/curl"
export YARR_RC_YARR="$rc"
export YARR_UPDATE_API_URL='https://fixture.invalid/api/releases'
export YARR_UPDATE_DOWNLOAD_ROOT='https://fixture.invalid/releases/download'
export YARR_READY_ATTEMPTS=1
export YARR_READY_INTERVAL=0

mkdir -p "$YARR_PLUGIN_ROOT/bin" "$YARR_PLUGIN_ROOT/scripts" \
    "$YARR_BOOT_ROOT/config/plugins/yarr" "$YARR_OVERLAY_DIR" \
    "$YARR_RUN_ROOT" "$YARR_LOCK_ROOT" "$YARR_LOG_ROOT" "$test_root/bin" \
    "$test_root/releases"
cp "$common" "$YARR_PLUGIN_ROOT/scripts/yarr-common.sh"

make_fake_boundary() {
    local name=$1 real=$2
    cat > "$test_root/bin/$name" <<EOF
#!/usr/bin/env bash
set -euo pipefail
name=$name
count_file="\${YARR_TEST_FAKE_COUNTS}/\${name}"
count=0
[[ -f "\$count_file" ]] && count=\$(<"\$count_file")
count=\$((count + 1))
printf '%s\\n' "\$count" > "\$count_file"
printf '%s %s\\n' "\$name" "\$*" >> "\${YARR_TEST_OPERATION_LOG}"
if [[ "\${YARR_TEST_FAIL_COMMAND:-}" == "\$name" && "\${YARR_TEST_FAIL_AT:-0}" == "\$count" ]]; then
    exit 1
fi
$real "\$@"
status=\$?
if [[ "\$status" == 0 && "\${YARR_TEST_SIGNAL_COMMAND:-}" == "\$name" && "\${YARR_TEST_SIGNAL_AT:-0}" == "\$count" ]]; then
    kill -TERM "\$PPID"
fi
exit "\$status"
EOF
    chmod 755 "$test_root/bin/$name"
}

export YARR_TEST_FAKE_COUNTS="$test_root/fake-counts"
export YARR_TEST_OPERATION_LOG="$test_root/operations.log"
mkdir -p "$YARR_TEST_FAKE_COUNTS"
make_fake_boundary mv /bin/mv
make_fake_boundary install /usr/bin/install
make_fake_boundary sync /usr/bin/sync
make_fake_boundary tar /usr/bin/tar
make_fake_boundary rm /usr/bin/rm
export YARR_MV_BIN="$test_root/bin/mv"
export YARR_INSTALL_BIN="$test_root/bin/install"
export YARR_SYNC_BIN="$test_root/bin/sync"
export YARR_TAR_BIN="$test_root/bin/tar"
export YARR_RM_BIN="$test_root/bin/rm"

reset_boundaries() {
    rm -rf "$YARR_TEST_FAKE_COUNTS"
    mkdir -p "$YARR_TEST_FAKE_COUNTS"
    : > "$YARR_TEST_OPERATION_LOG"
    unset YARR_TEST_FAIL_COMMAND YARR_TEST_FAIL_AT YARR_TEST_SIGNAL_COMMAND YARR_TEST_SIGNAL_AT
}

write_yarr() {
    local path=$1 version=$2
    cat > "${path}.c" <<'EOF'
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--version") == 0) {
        printf("yarr %s\n", VERSION);
        return 0;
    }
    if (argc >= 2 && strcmp(argv[1], "serve") == 0) {
        sleep(30);
        return 0;
    }
    return 2;
}
EOF
    cc -O2 -DVERSION=\"$version\" -o "$path" "${path}.c"
    rm -f "${path}.c"
}

write_config() {
    cat > "$YARR_BOOT_ROOT/config/plugins/yarr/yarr.cfg" <<'EOF'
ENABLED=yes
BIND_MODE=loopback
CUSTOM_HOST=
PORT=40070
AUTH_MODE=bearer
TAILSCALE_SERVE=no
TAILSCALE_HOSTNAME=
LOG_LEVEL=info
UPDATE_CHANNEL=stable
EOF
    printf 'YARR_MCP_TOKEN=contract-token\n' > "$YARR_BOOT_ROOT/config/plugins/yarr/.env"
}

make_archive() {
    local version=$1 kind=${2:-regular} stage
    stage="$tmp_dir/archive-$version-$kind"
    rm -rf "$stage"
    mkdir -p "$stage"
    case "$kind" in
        regular) write_yarr "$stage/yarr" "$version" ;;
        extra)
            write_yarr "$stage/yarr" "$version"
            printf 'unexpected\n' > "$stage/extra"
            ;;
        symlink)
            ln -s /bin/true "$stage/yarr"
            ;;
        path)
            mkdir -p "$stage/nested"
            write_yarr "$stage/nested/yarr" "$version"
            ;;
        *) fail "unknown archive kind $kind" ;;
    esac
    (
        cd "$stage"
        tar -czf "$test_root/releases/yarr-x86_64.tar.gz" -- *
    )
    (
        cd "$test_root/releases"
        sha256sum yarr-x86_64.tar.gz > yarr-x86_64.tar.gz.sha256
    )
}

cat > "$YARR_CURL_BIN" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
url=${!#}
output=''
while (($#)); do
    case "$1" in
        -o|--output) output=$2; shift 2 ;;
        *) shift ;;
    esac
done
if [[ "$url" == *'/ready' ]]; then
    if [[ -n "${YARR_TEST_READY_FAIL_ONCE:-}" && ! -e "$YARR_TEST_READY_FAIL_ONCE" ]]; then
        : > "$YARR_TEST_READY_FAIL_ONCE"
        exit 1
    fi
    exit "${YARR_TEST_READY_STATUS:-0}"
fi
case "$url" in
    "$YARR_UPDATE_API_URL") cp "$YARR_TEST_RELEASES" "$output" ;;
    */yarr-x86_64.tar.gz) cp "$YARR_TEST_ARCHIVE" "$output" ;;
    */yarr-x86_64.tar.gz.sha256) cp "$YARR_TEST_CHECKSUM" "$output" ;;
    *) printf 'unexpected curl URL: %s\n' "$url" >&2; exit 1 ;;
esac
EOF
chmod 755 "$YARR_CURL_BIN"

write_config
write_yarr "$YARR_PLUGIN_ROOT/bin/yarr" 2.0.0
make_archive 2.1.0
export YARR_TEST_RELEASES="$fixture"
export YARR_TEST_ARCHIVE="$test_root/releases/yarr-x86_64.tar.gz"
export YARR_TEST_CHECKSUM="$test_root/releases/yarr-x86_64.tar.gz.sha256"

signal_rc="$test_root/bin/rc-signal-after-stop"
cat > "$signal_rc" <<'EOF'
#!/usr/bin/env bash
source "$YARR_REAL_RC"
eval "$(declare -f yarr_stop_locked | sed '1s/yarr_stop_locked/yarr_stop_locked_original/')"
yarr_stop_locked() {
    yarr_stop_locked_original "$@"
    if [[ ! -e "$YARR_TEST_SIGNAL_MARKER" ]]; then
        : > "$YARR_TEST_SIGNAL_MARKER"
        kill -TERM "$$"
    fi
}
EOF
chmod 755 "$signal_rc"
export YARR_REAL_RC="$rc"

reset_boundaries
"$updater" apply --version 2.0.0 --json > "$tmp_dir/equal.json"
[[ ! -e "$YARR_OVERLAY_DIR/yarr" ]] || fail 'equal version created an overlay'
if grep -Eq '^(install|mv|sync) ' "$YARR_TEST_OPERATION_LOG"; then
    fail 'equal version performed a filesystem swap'
fi

for eligibility in draft prerelease malformed; do
    eligibility_fixture="$tmp_dir/releases-$eligibility.json"
    case "$eligibility" in
        draft) jq 'map(if .tag_name == "v2.1.0" then .draft = true else . end)' "$fixture" > "$eligibility_fixture" ;;
        prerelease) jq 'map(if .tag_name == "v2.1.0" then .prerelease = true else . end)' "$fixture" > "$eligibility_fixture" ;;
        malformed) jq 'map(if .tag_name == "v2.1.0" then .tag_name = "v2.1" else . end)' "$fixture" > "$eligibility_fixture" ;;
    esac
    export YARR_TEST_RELEASES="$eligibility_fixture"
    expect_failure "$eligibility release" "$updater" apply --version 2.1.0 --json
done
export YARR_TEST_RELEASES="$fixture"

check_json=$("$updater" check --json)
expect_eq '2.1.0' "$(jq -r '.availableVersion' <<< "$check_json")" 'stable update selection'
expect_eq 'true' "$(jq -r '.updateAvailable' <<< "$check_json")" 'update availability'
if grep -Fq 'contract-token' <<< "$check_json"; then
    fail 'status output exposed environment value'
fi

expect_failure 'major version update' "$updater" apply --version 3.0.0 --json
expect_failure 'leading-zero version' "$updater" apply --version 2.01.0 --json

missing_assets="$tmp_dir/releases-missing-assets.json"
jq 'map(if .tag_name == "v2.1.0" then .assets = [.assets[0]] else . end)' "$fixture" > "$missing_assets"
export YARR_TEST_RELEASES="$missing_assets"
expect_failure 'release missing checksum asset' "$updater" apply --version 2.1.0 --json
export YARR_TEST_RELEASES="$fixture"

cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_OVERLAY_DIR/yarr"
overlay_before=$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')
printf '000000000000000000000000000000000000000000000000000000000000 yarr-x86_64.tar.gz\n' > "$tmp_dir/bad.sha256"
export YARR_TEST_CHECKSUM="$tmp_dir/bad.sha256"
expect_failure 'checksum mismatch' "$updater" apply --version 2.1.0 --json
expect_eq "$overlay_before" "$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')" 'checksum failure overlay preservation'
if grep -Fq 'tar ' "$YARR_TEST_OPERATION_LOG"; then
    fail 'checksum mismatch invoked tar'
fi
export YARR_TEST_CHECKSUM="$test_root/releases/yarr-x86_64.tar.gz.sha256"

printf 'not-a-checksum\n' > "$tmp_dir/malformed.sha256"
export YARR_TEST_CHECKSUM="$tmp_dir/malformed.sha256"
expect_failure 'malformed checksum' "$updater" apply --version 2.1.0 --json
printf '%s\n%s\n' \
    '0123456789012345678901234567890123456789012345678901234567890123 yarr-x86_64.tar.gz' \
    '0123456789012345678901234567890123456789012345678901234567890123 yarr-x86_64.tar.gz' > "$tmp_dir/multi.sha256"
export YARR_TEST_CHECKSUM="$tmp_dir/multi.sha256"
expect_failure 'multiple checksum entries' "$updater" apply --version 2.1.0 --json
export YARR_TEST_CHECKSUM="$test_root/releases/yarr-x86_64.tar.gz.sha256"

make_archive 2.1.0 extra
expect_failure 'archive extra entry' "$updater" apply --version 2.1.0 --json
expect_eq "$overlay_before" "$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')" 'extra entry overlay preservation'
make_archive 2.1.0 symlink
expect_failure 'archive symlink payload' "$updater" apply --version 2.1.0 --json
expect_eq "$overlay_before" "$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')" 'symlink overlay preservation'
make_archive 2.1.0 path
expect_failure 'archive path entry' "$updater" apply --version 2.1.0 --json
expect_eq "$overlay_before" "$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')" 'path entry overlay preservation'
make_archive 2.1.0 regular

bash -c 'exec 9>"$YARR_LOCK"; YARR_LOCK_HELD=1 YARR_LOCK_FD=9 "$1" start' _ "$rc"
"$rc" status >/dev/null || fail 'caller-controlled lock environment altered direct lifecycle start'
"$rc" stop
bash -c 'exec 9>"$YARR_LOCK"; flock 9; sleep 30' &
lock_holder=$!
sleep 0.1
expect_failure 'separately held inherited lock' \
    bash -c 'exec 8>"$YARR_LOCK"; YARR_LOCK_HELD=1 YARR_LOCK_FD=8 "$1" start' _ "$rc"
kill "$lock_holder"
wait "$lock_holder" 2>/dev/null || true

"$rc" start
[[ -f "$YARR_PID" ]] || fail 'pre-update service did not start'
reset_boundaries
"$updater" apply --version 2.1.0 --json > "$tmp_dir/apply.json"
expect_eq '2.1.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" 'installed overlay version'
expect_eq '2.0.0' "$("$YARR_OVERLAY_DIR/yarr.previous" --version | awk '{print $2}')" 'predecessor overlay version'
install_line=$(grep -n '^install ' "$YARR_TEST_OPERATION_LOG" | head -n1 | cut -d: -f1)
data_sync_line=$(grep -n '^sync -f .*\.yarr\.update\.new\.' "$YARR_TEST_OPERATION_LOG" | head -n1 | cut -d: -f1)
directory_sync_line=$(grep -n "^sync -f $YARR_OVERLAY_DIR$" "$YARR_TEST_OPERATION_LOG" | head -n1 | cut -d: -f1)
[[ -n "$install_line" && -n "$data_sync_line" && -n "$directory_sync_line" ]] || fail 'durability commands were not issued'
((install_line < data_sync_line && data_sync_line < directory_sync_line)) || fail 'durability command ordering is unsafe'
if ! "$rc" status > "$tmp_dir/updated-status.out" 2>&1; then
    cat "$tmp_dir/updated-status.out" >&2
    fail 'updated service is not ready'
fi
expect_failure 'downgrade update' "$updater" apply --version 2.0.0 --json

cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_OVERLAY_DIR/.yarr.test"
mv -f "$YARR_OVERLAY_DIR/.yarr.test" "$YARR_OVERLAY_DIR/yarr"
rm -f "$YARR_OVERLAY_DIR/yarr.previous"
"$rc" restart
export YARR_TEST_READY_FAIL_ONCE="$tmp_dir/fail-readiness-once"
expect_failure 'readiness failure update' "$updater" apply --version 2.1.0 --json
unset YARR_TEST_READY_FAIL_ONCE
expect_eq '2.0.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" 'rollback overlay restoration'
"$rc" status >/dev/null || fail 'rollback service is not ready'

"$updater" reset --json > "$tmp_dir/reset.json"
[[ ! -e "$YARR_OVERLAY_DIR/yarr" && ! -e "$YARR_OVERLAY_DIR/yarr.previous" ]] || fail 'reset retained an overlay'
expect_eq '2.0.0' "$("$YARR_PLUGIN_ROOT/bin/yarr" --version | awk '{print $2}')" 'packaged binary after reset'
"$rc" status >/dev/null || fail 'reset did not restart the packaged binary'

"$rc" stop
"$updater" apply --version 2.1.0 --json > "$tmp_dir/stopped-apply.json"
[[ ! -e "$YARR_PID" ]] || fail 'stopped service was started by apply'
"$updater" reset --json > "$tmp_dir/stopped-reset.json"
[[ ! -e "$YARR_PID" ]] || fail 'stopped service was started by reset'

prepare_running_overlay() {
    "$rc" stop || true
    cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_OVERLAY_DIR/.yarr.test"
    mv -f "$YARR_OVERLAY_DIR/.yarr.test" "$YARR_OVERLAY_DIR/yarr"
    write_yarr "$YARR_OVERLAY_DIR/yarr.previous" 1.9.0
    "$rc" start
    "$rc" status >/dev/null || fail 'fault injection setup did not start'
}

assert_running_overlay_restored() {
    expect_eq '2.0.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" "$1 active binary restoration"
    expect_eq '1.9.0' "$("$YARR_OVERLAY_DIR/yarr.previous" --version | awk '{print $2}')" "$1 predecessor restoration"
    "$rc" status >/dev/null || fail "$1 did not restore service readiness"
}

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=mv YARR_TEST_FAIL_AT=3
expect_failure 'predecessor rotation fault' "$updater" apply --version 2.1.0 --json
assert_running_overlay_restored 'predecessor rotation fault'

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=install YARR_TEST_FAIL_AT=1
expect_failure 'candidate install fault' "$updater" apply --version 2.1.0 --json
assert_running_overlay_restored 'candidate install fault'

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=sync YARR_TEST_FAIL_AT=2
expect_failure 'durable sync fault' "$updater" apply --version 2.1.0 --json
assert_running_overlay_restored 'durable sync fault'

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=mv YARR_TEST_FAIL_AT=1
expect_failure 'reset active backup move fault' "$updater" reset --json
assert_running_overlay_restored 'reset active backup move fault'

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=mv YARR_TEST_FAIL_AT=2
expect_failure 'reset predecessor backup move fault' "$updater" reset --json
assert_running_overlay_restored 'reset predecessor backup move fault'

prepare_running_overlay
reset_boundaries
export YARR_RC_YARR="$signal_rc"
export YARR_TEST_SIGNAL_MARKER="$tmp_dir/signal-after-stop"
expect_failure 'signal after service stop' "$updater" apply --version 2.1.0 --json
export YARR_RC_YARR="$rc"
assert_running_overlay_restored 'signal after service stop'

prepare_running_overlay
reset_boundaries
export YARR_TEST_SIGNAL_COMMAND=mv YARR_TEST_SIGNAL_AT=1
expect_failure 'signal after first binary move' "$updater" apply --version 2.1.0 --json
assert_running_overlay_restored 'signal after first binary move'

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=rm YARR_TEST_FAIL_AT=1
expect_failure 'reset backup cleanup fault' "$updater" reset --json
[[ ! -e "$YARR_OVERLAY_DIR/yarr" && ! -e "$YARR_OVERLAY_DIR/yarr.previous" ]] || fail 'reset cleanup fault rolled back the effective reset'
"$rc" status >/dev/null || fail 'reset cleanup fault did not keep packaged service ready'

unset YARR_TEST_FAIL_COMMAND YARR_TEST_FAIL_AT YARR_TEST_SIGNAL_COMMAND YARR_TEST_SIGNAL_AT
"$rc" stop

printf 'update contract: PASS\n'
