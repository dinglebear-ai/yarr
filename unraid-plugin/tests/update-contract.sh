#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
updater="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-update.sh"
common="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh"
rc="$repo_root/unraid-plugin/source/etc/rc.d/rc.yarr"
fixture="$repo_root/unraid-plugin/tests/fixtures/releases.json"
started="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/started"
stopping="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/stopping_svcs"
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
YARR_TEST_PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')
export YARR_TEST_PORT
export YARR_PLUGIN_ROOT="$test_root/plugin"
export YARR_BOOT_ROOT="$test_root/boot"
export YARR_APPDATA_ROOT="$test_root/appdata"
export YARR_RUN_ROOT="$test_root/run"
export YARR_LOCK_ROOT="$test_root/lock"
export YARR_LOG_ROOT="$test_root/log"
export YARR_APPDATA="$YARR_APPDATA_ROOT/yarr"
export YARR_OVERLAY_DIR="$YARR_APPDATA/bin"
export YARR_PID="$YARR_RUN_ROOT/yarr.pid"
export YARR_ARRAY_STOPPING="$YARR_RUN_ROOT/yarr-array-stopping"
export YARR_LOCK="$YARR_LOCK_ROOT/yarr-plugin.lock"
export YARR_CURL_BIN="$test_root/bin/curl"
export YARR_RC_YARR="$rc"
export YARR_UPDATE_API_URL='https://fixture.invalid/api/releases'
export YARR_UPDATE_DOWNLOAD_ROOT='https://fixture.invalid/releases/download'
export YARR_UPDATE_TMP_ROOT="$tmp_dir/update-tmp"
export YARR_READY_ATTEMPTS=1
export YARR_READY_INTERVAL=0

mkdir -p "$YARR_PLUGIN_ROOT/bin" "$YARR_PLUGIN_ROOT/scripts" \
    "$YARR_BOOT_ROOT/config/plugins/yarr" "$YARR_OVERLAY_DIR" \
    "$YARR_RUN_ROOT" "$YARR_LOCK_ROOT" "$YARR_LOG_ROOT" "$test_root/bin" \
    "$test_root/releases"
mkdir -p "$YARR_UPDATE_TMP_ROOT"
cp "$common" "$YARR_PLUGIN_ROOT/scripts/yarr-common.sh"

installed_common="$test_root/installed/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh"
mkdir -p "$(dirname "$installed_common")"
cp "$common" "$installed_common"
env \
    YARR_PLUGIN_ROOT="$test_root/attacker/plugin" \
    YARR_BOOT_ROOT="$test_root/attacker/boot" \
    YARR_APPDATA_ROOT="$test_root/attacker/appdata" \
    YARR_RUN_ROOT="$test_root/attacker/run" \
    YARR_LOCK_ROOT="$test_root/attacker/lock" \
    YARR_LOCK="$test_root/attacker/lock/alternate.lock" \
    bash -c 'source "$1"; [[ "$YARR_PLUGIN_ROOT" == /usr/local/emhttp/plugins/yarr && "$YARR_BOOT_ROOT" == /boot && "$YARR_APPDATA_ROOT" == /mnt/user/appdata && "$YARR_ARRAY_STOPPING" == /var/run/yarr-array-stopping && "$YARR_LOCK" == /var/lock/yarr-plugin.lock ]]' _ "$installed_common" || \
    fail 'installed common script accepted caller-controlled roots'

installed_updater="$test_root/installed/usr/local/emhttp/plugins/yarr/scripts/yarr-update.sh"
bootstrap_attacker_root="$test_root/bootstrap-attacker/plugin"
bootstrap_attacker_rc="$test_root/bootstrap-attacker/rc.yarr"
bootstrap_marker="$test_root/bootstrap-marker"
mkdir -p "$(dirname "$installed_updater")" "$bootstrap_attacker_root/scripts" "$(dirname "$bootstrap_attacker_rc")"
cp "$updater" "$installed_updater"
cat > "$bootstrap_attacker_root/scripts/yarr-common.sh" <<EOF
#!/usr/bin/env bash
printf 'common\n' >> "$bootstrap_marker"
EOF
cat > "$bootstrap_attacker_rc" <<EOF
#!/usr/bin/env bash
printf 'rc\n' >> "$bootstrap_marker"
EOF
chmod 755 "$installed_updater" "$bootstrap_attacker_root/scripts/yarr-common.sh" "$bootstrap_attacker_rc"

expect_failure 'installed updater accepted environment-selected bootstrap helpers' \
    env YARR_PLUGIN_ROOT="$bootstrap_attacker_root" YARR_RC_YARR="$bootstrap_attacker_rc" "$installed_updater" check --json
[[ ! -e "$bootstrap_marker" ]] || fail 'installed updater sourced attacker bootstrap helper'

env YARR_PLUGIN_ROOT="$YARR_PLUGIN_ROOT" YARR_RC_YARR="$rc" bash -c '
    source "$1"
    YARR_PLUGIN_ROOT="$3/bootstrap-attacker/plugin"
    YARR_RC_YARR="$3/bootstrap-attacker/rc.yarr"
    mapfile -t bootstrap_paths < <(yarr_update_bootstrap_paths "$2")
    [[ "${bootstrap_paths[0]}" == /usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh ]]
    [[ "${bootstrap_paths[1]}" == /etc/rc.d/rc.yarr ]]
' _ "$updater" "$installed_updater" "$test_root" || \
    fail 'installed updater bootstrap selector accepted caller-controlled helper paths'

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
if { [[ "\${YARR_TEST_FAIL_COMMAND:-}" == "\$name" && "\${YARR_TEST_FAIL_AT:-0}" == "\$count" ]]; } ||
    { [[ "\${YARR_TEST_FAIL_COMMAND_2:-}" == "\$name" && "\${YARR_TEST_FAIL_AT_2:-0}" == "\$count" ]]; }; then
    exit 1
fi
if [[ "\$name" == rm && "\${YARR_TEST_FAIL_RECOVERY_RM:-false}" == true &&
      "\$*" == *".yarr."*".recovery."* ]]; then
    exit 1
fi
$real "\$@"
status=\$?
if [[ "\$status" == 0 && "\$name" == install &&
      "\${YARR_TEST_CORRUPT_INSTALL_AT:-0}" == "\$count" ]]; then
    printf '\\ncorrupted snapshot\\n' >> "\${!#}"
fi
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
    unset YARR_TEST_FAIL_COMMAND YARR_TEST_FAIL_AT YARR_TEST_FAIL_COMMAND_2 \
        YARR_TEST_FAIL_AT_2 YARR_TEST_CORRUPT_INSTALL_AT \
        YARR_TEST_FAIL_RECOVERY_RM YARR_TEST_SIGNAL_COMMAND YARR_TEST_SIGNAL_AT
}

write_yarr() {
    local path=$1 version=$2
    cat > "${path}.c" <<'EOF'
#include <stdio.h>
#include <arpa/inet.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static volatile sig_atomic_t running = 1;
static void stop(int signal_number) { (void)signal_number; running = 0; }

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--version") == 0) {
        printf("yarr %s\n", VERSION);
        return 0;
    }
    if (argc == 3 && strcmp(argv[1], "serve") == 0 && strcmp(argv[2], "mcp") == 0) {
        const char *port_text = getenv("YARR_MCP_PORT");
        const char *host = getenv("YARR_MCP_HOST");
        int port = port_text ? atoi(port_text) : 40070;
        int listener = socket(AF_INET, SOCK_STREAM, 0);
        int enabled = 1;
        struct sockaddr_in address = {0};
        if (listener < 0) return 65;
        setsockopt(listener, SOL_SOCKET, SO_REUSEADDR, &enabled, sizeof(enabled));
        address.sin_family = AF_INET;
        address.sin_port = htons((unsigned short)port);
        if (!host || inet_pton(AF_INET, host, &address.sin_addr) != 1) return 66;
        if (bind(listener, (struct sockaddr *)&address, sizeof(address)) != 0) return 67;
        if (listen(listener, 8) != 0) return 68;
        signal(SIGTERM, stop);
        signal(SIGINT, stop);
        while (running) pause();
        close(listener);
        return 0;
    }
    return 2;
}
EOF
    cc -O2 -DVERSION=\"$version\" -o "$path" "${path}.c"
    rm -f "${path}.c"
}

write_config() {
    cat > "$YARR_BOOT_ROOT/config/plugins/yarr/yarr.cfg" <<EOF
ENABLED=yes
BIND_MODE=loopback
CUSTOM_HOST=
PORT=$YARR_TEST_PORT
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
max_filesize=''
printf '%s\n' "$*" >> "${YARR_TEST_CURL_ARGUMENT_LOG}"
while (($#)); do
    case "$1" in
        -o|--output) output=$2; shift 2 ;;
        --max-filesize) max_filesize=$2; shift 2 ;;
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
if [[ -n "${YARR_TEST_CURL_WAIT_FILE:-}" ]]; then
    : > "${YARR_TEST_CURL_WAIT_FILE}.entered"
    while [[ -e "$YARR_TEST_CURL_WAIT_FILE" ]]; do sleep 0.02; done
fi
if [[ "${YARR_TEST_CURL_STALL:-no}" == yes || ( -n "${YARR_TEST_CURL_STALL_PATTERN:-}" && "$url" == *"$YARR_TEST_CURL_STALL_PATTERN"* ) ]]; then
    printf 'partial' > "$output"
    exit 28
fi
if [[ "${YARR_TEST_CURL_OVERSIZE:-no}" == yes ]]; then
    head -c "$((max_filesize + 1))" /dev/zero > "$output"
    exit 63
fi
case "$url" in
    "$YARR_UPDATE_API_URL") cp "$YARR_TEST_RELEASES" "$output" ;;
    */v2.0.0/yarr-x86_64.tar.gz) cp "$YARR_TEST_ARCHIVE_2_0_0" "$output" ;;
    */v2.0.0/yarr-x86_64.tar.gz.sha256) cp "$YARR_TEST_CHECKSUM_2_0_0" "$output" ;;
    */v3.0.0/yarr-x86_64.tar.gz) cp "$YARR_TEST_ARCHIVE_3_0_0" "$output" ;;
    */v3.0.0/yarr-x86_64.tar.gz.sha256) cp "$YARR_TEST_CHECKSUM_3_0_0" "$output" ;;
    */yarr-x86_64.tar.gz) cp "$YARR_TEST_ARCHIVE" "$output" ;;
    */yarr-x86_64.tar.gz.sha256) cp "$YARR_TEST_CHECKSUM" "$output" ;;
    *) printf 'unexpected curl URL: %s\n' "$url" >&2; exit 1 ;;
esac
EOF
chmod 755 "$YARR_CURL_BIN"
export YARR_TEST_CURL_ARGUMENT_LOG="$test_root/curl-arguments.log"
: > "$YARR_TEST_CURL_ARGUMENT_LOG"

write_config
write_yarr "$YARR_PLUGIN_ROOT/bin/yarr" 2.0.0
make_archive 2.1.0
export YARR_TEST_RELEASES="$fixture"
export YARR_TEST_ARCHIVE="$test_root/releases/yarr-x86_64.tar.gz"
export YARR_TEST_CHECKSUM="$test_root/releases/yarr-x86_64.tar.gz.sha256"
make_archive 2.0.0
export YARR_TEST_ARCHIVE_2_0_0="$test_root/releases/yarr-2.0.0-x86_64.tar.gz"
export YARR_TEST_CHECKSUM_2_0_0="${YARR_TEST_ARCHIVE_2_0_0}.sha256"
cp "$YARR_TEST_ARCHIVE" "$YARR_TEST_ARCHIVE_2_0_0"
cp "$YARR_TEST_CHECKSUM" "$YARR_TEST_CHECKSUM_2_0_0"
make_archive 3.0.0
export YARR_TEST_ARCHIVE_3_0_0="$test_root/releases/yarr-3.0.0-x86_64.tar.gz"
export YARR_TEST_CHECKSUM_3_0_0="${YARR_TEST_ARCHIVE_3_0_0}.sha256"
cp "$YARR_TEST_ARCHIVE" "$YARR_TEST_ARCHIVE_3_0_0"
cp "$YARR_TEST_CHECKSUM" "$YARR_TEST_CHECKSUM_3_0_0"
make_archive 2.1.0

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
grep -Fq -- '--connect-timeout 10' "$YARR_TEST_CURL_ARGUMENT_LOG" || fail 'updater omitted curl connect timeout'
grep -Fq -- '--retry 2' "$YARR_TEST_CURL_ARGUMENT_LOG" || fail 'updater omitted bounded curl retry policy'
grep -Fq -- '--max-filesize 2097152' "$YARR_TEST_CURL_ARGUMENT_LOG" || fail 'updater omitted metadata size limit'

expect_failure 'stalled metadata response' env YARR_TEST_CURL_STALL=yes \
    YARR_UPDATE_METADATA_TIMEOUT=1 "$updater" check --json
expect_failure 'oversized metadata response' env YARR_TEST_CURL_OVERSIZE=yes \
    YARR_UPDATE_METADATA_MAX_BYTES=128 "$updater" check --json
expect_failure 'oversized checksum response' env YARR_UPDATE_CHECKSUM_MAX_BYTES=16 \
    "$updater" apply --version 2.1.0 --json
expect_failure 'oversized archive response' env YARR_UPDATE_ARCHIVE_MAX_BYTES=128 \
    "$updater" apply --version 2.1.0 --json
expect_failure 'stalled archive response' env YARR_TEST_CURL_STALL_PATTERN='/yarr-x86_64.tar.gz' \
    YARR_UPDATE_ARCHIVE_TIMEOUT=1 "$updater" apply --version 2.1.0 --json
if find "$YARR_UPDATE_TMP_ROOT" -mindepth 1 -print -quit | grep -q .; then
    fail 'stalled or oversized updater response retained temporary data'
fi

# Network staging must not hold the lifecycle lock. A real array-stop hook must
# quiesce Yarr while an apply is stalled, and the later short activation must
# fence every later appdata access until the mounted-array start hook clears it.
"$rc" start
stop_wins_hold="$tmp_dir/stop-wins-hold"
touch "$stop_wins_hold"
env YARR_TEST_CURL_WAIT_FILE="$stop_wins_hold" YARR_UPDATE_LOCK_WAIT_SECONDS=5 \
    "$updater" apply --version 2.1.0 --json > "$tmp_dir/stop-wins.json" 2> "$tmp_dir/stop-wins.err" &
stop_wins_pid=$!
for _ in {1..100}; do
    [[ -e "${stop_wins_hold}.entered" ]] && break
    sleep 0.02
done
[[ -e "${stop_wins_hold}.entered" ]] || fail 'stalled updater did not enter network staging'
flock -n "$YARR_LOCK" /usr/bin/true || fail 'network staging retained the lifecycle lock'
env YARR_RC="$rc" YARR_EVENT_ATTEMPTS=2 YARR_EVENT_LOCK_WAIT_SECONDS=1 \
    YARR_EVENT_RETRY_SECONDS=0 "$stopping"
[[ ! -e "$YARR_PID" ]] || fail 'array-stop hook did not quiesce Yarr during updater staging'
rm -f "$stop_wins_hold"
if wait "$stop_wins_pid"; then
    fail 'updater activated after array-stop fence was established'
fi
[[ ! -e "$YARR_PID" ]] || fail 'updater restarted Yarr after array-stop quiescence'
[[ -f "$YARR_ARRAY_STOPPING" && ! -L "$YARR_ARRAY_STOPPING" ]] || fail 'array-stop hook omitted the activation fence'
[[ $(stat -c %a "$YARR_ARRAY_STOPPING") == 600 ]] || fail 'array-stop fence is not private'
[[ ! -e "$YARR_OVERLAY_DIR/yarr" ]] || fail 'updater wrote appdata after array stop won'
if find "$YARR_OVERLAY_DIR" -maxdepth 1 -name '.yarr.update.*' -print -quit | grep -q .; then
    fail 'updater retained appdata staging after array stop won'
fi
expect_failure 'manual start during array stop' "$rc" start
expect_failure 'update check during array stop' "$updater" check --json
expect_failure 'update reset during array stop' "$updater" reset --json
env YARR_RC="$rc" YARR_EVENT_ATTEMPTS=2 YARR_EVENT_LOCK_WAIT_SECONDS=1 \
    YARR_EVENT_RETRY_SECONDS=0 "$started"
[[ ! -e "$YARR_ARRAY_STOPPING" ]] || fail 'mounted-array start hook retained the activation fence'
"$rc" stop

# All installed-state and policy checks occur after acquiring the stable lock.
# An older and a cross-major candidate queued behind a newer candidate must
# re-read the new installed version and fail rather than race it.
exec 8>"$YARR_LOCK"
flock -n 8 || fail 'could not hold lifecycle lock for updater race'
env YARR_UPDATE_LOCK_WAIT_SECONDS=5 "$updater" apply --version 2.1.0 --json \
    > "$tmp_dir/race-newer.json" 2> "$tmp_dir/race-newer.err" 8>&- &
newer_pid=$!
for _ in {1..100}; do
    [[ "$(readlink -f "/proc/$newer_pid/fd/9" 2>/dev/null || true)" == "$(readlink -f "$YARR_LOCK")" ]] && break
    sleep 0.02
done
[[ "$(readlink -f "/proc/$newer_pid/fd/9" 2>/dev/null || true)" == "$(readlink -f "$YARR_LOCK")" ]] || \
    fail 'newer updater did not queue after network staging'
env YARR_UPDATE_LOCK_WAIT_SECONDS=5 "$updater" apply --version 2.0.0 --json \
    > "$tmp_dir/race-older.json" 2> "$tmp_dir/race-older.err" 8>&- &
older_pid=$!
env YARR_UPDATE_LOCK_WAIT_SECONDS=5 "$updater" apply --version 3.0.0 --json \
    > "$tmp_dir/race-major.json" 2> "$tmp_dir/race-major.err" 8>&- &
major_pid=$!
exec 8>&-
if ! wait "$newer_pid"; then
    cat "$tmp_dir/race-newer.json" >&2
    cat "$tmp_dir/race-newer.err" >&2
    cat "$YARR_TEST_OPERATION_LOG" >&2
    fail 'newer candidate failed during lock race'
fi
if wait "$older_pid"; then fail 'queued older candidate downgraded the newer install'; fi
if wait "$major_pid"; then fail 'queued cross-major candidate bypassed same-major policy'; fi
expect_eq '2.1.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" 'race winner version'
"$updater" reset --json > "$tmp_dir/race-reset.json"
[[ ! -e "$YARR_OVERLAY_DIR/yarr" ]] || fail 'race reset did not restore packaged baseline'

# A retained or manually recovered overlay cannot redefine the major supported
# by the installed classic/API package.
write_yarr "$YARR_OVERLAY_DIR/yarr" 3.0.0
expect_failure 'incompatible retained overlay check' "$updater" check --json
expect_failure 'incompatible retained overlay update' "$updater" apply --version 3.0.0 --json
rm -f "$YARR_OVERLAY_DIR/yarr"

expect_failure 'major version update' "$updater" apply --version 3.0.0 --json
expect_failure 'leading-zero version' "$updater" apply --version 2.01.0 --json

missing_assets="$tmp_dir/releases-missing-assets.json"
jq 'map(if .tag_name == "v2.1.0" then .assets = [.assets[0]] else . end)' "$fixture" > "$missing_assets"
export YARR_TEST_RELEASES="$missing_assets"
expect_failure 'release missing checksum asset' "$updater" apply --version 2.1.0 --json
export YARR_TEST_RELEASES="$fixture"

cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_OVERLAY_DIR/yarr"
overlay_before=$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')
reset_boundaries
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
jq -e '.rollbackAvailable == true' "$tmp_dir/apply.json" >/dev/null ||
    fail 'successful update did not advertise manual rollback'
install_line=$(grep -n '^install .*\.yarr\.update\.recovery\..*/active\.next$' \
    "$YARR_TEST_OPERATION_LOG" | head -n1 | cut -d: -f1)
data_sync_line=$(grep -n '^sync -f .*\.yarr\.update\.recovery\..*/active\.next$' "$YARR_TEST_OPERATION_LOG" | head -n1 | cut -d: -f1)
directory_sync_line=$(grep -n "^sync -f $YARR_OVERLAY_DIR$" "$YARR_TEST_OPERATION_LOG" | tail -n1 | cut -d: -f1)
[[ -n "$install_line" && -n "$data_sync_line" && -n "$directory_sync_line" ]] || fail 'durability commands were not issued'
((install_line < data_sync_line && data_sync_line < directory_sync_line)) || fail 'durability command ordering is unsafe'
if ! "$rc" status > "$tmp_dir/updated-status.out" 2>&1; then
    cat "$tmp_dir/updated-status.out" >&2
    fail 'updated service is not ready'
fi
"$updater" rollback --json > "$tmp_dir/rollback.json"
expect_eq '2.0.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" 'manual rollback selected predecessor'
expect_eq '2.1.0' "$("$YARR_OVERLAY_DIR/yarr.previous" --version | awk '{print $2}')" 'manual rollback retained replaced binary'
"$rc" status >/dev/null || fail 'manual rollback service is not ready'
"$updater" rollback --json > "$tmp_dir/rollback-again.json"
expect_eq '2.1.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" 'second manual rollback restored update'
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

rm -rf "$YARR_OVERLAY_DIR"
"$updater" reset --json > "$tmp_dir/reset.json"
[[ -d "$YARR_OVERLAY_DIR" ]] || fail 'fresh reset did not create the absent overlay directory'
[[ $(stat -c %a "$YARR_OVERLAY_DIR") == 755 ]] || fail 'fresh reset overlay directory mode is not 0755'
[[ $(stat -c '%u:%g' "$YARR_OVERLAY_DIR") == "$(id -u):$(id -g)" ]] ||
    fail 'fresh reset overlay directory ownership is unsafe'
[[ ! -e "$YARR_OVERLAY_DIR/yarr" && ! -e "$YARR_OVERLAY_DIR/yarr.previous" ]] || fail 'reset retained an overlay'
expect_eq '2.0.0' "$("$YARR_PLUGIN_ROOT/bin/yarr" --version | awk '{print $2}')" 'packaged binary after reset'
"$rc" status >/dev/null || fail 'reset did not restart the packaged binary'

"$rc" stop
"$updater" apply --version 2.1.0 --json > "$tmp_dir/stopped-apply.json"
[[ ! -e "$YARR_PID" ]] || fail 'stopped service was started by apply'
"$updater" reset --json > "$tmp_dir/stopped-reset.json"
[[ ! -e "$YARR_PID" ]] || fail 'stopped service was started by reset'
if "$updater" rollback --json > "$tmp_dir/no-previous.json"; then
    fail 'manual rollback without a previous binary unexpectedly succeeded'
fi
jq -e '.rollbackAvailable == false and .message == "Manual rollback is unavailable; no previous binary exists"' \
    "$tmp_dir/no-previous.json" >/dev/null || fail 'no-previous rollback outcome is not structured'

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

assert_candidate_committed() {
    expect_eq '2.1.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" "$1 active candidate preservation"
    expect_eq '2.0.0' "$("$YARR_OVERLAY_DIR/yarr.previous" --version | awk '{print $2}')" "$1 predecessor preservation"
    "$rc" status >/dev/null || fail "$1 did not retain candidate readiness"
}

recovery_directory_count() {
    local operation=$1
    find "$YARR_OVERLAY_DIR" -maxdepth 1 -type d \
        -name ".yarr.${operation}.recovery.*" -printf . | wc -c
}

assert_preparation_sources_unchanged() {
    local label=$1 active_sha=$2 active_mode=$3 previous_sha=$4 previous_mode=$5
    expect_eq "$active_sha" "$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')" \
        "$label active binary hash"
    expect_eq "$active_mode" "$(stat -c '%a' "$YARR_OVERLAY_DIR/yarr")" \
        "$label active binary mode"
    expect_eq "$previous_sha" "$(sha256sum "$YARR_OVERLAY_DIR/yarr.previous" | awk '{print $1}')" \
        "$label previous binary hash"
    expect_eq "$previous_mode" "$(stat -c '%a' "$YARR_OVERLAY_DIR/yarr.previous")" \
        "$label previous binary mode"
    if grep -q '^mv ' "$YARR_TEST_OPERATION_LOG"; then
        fail "$label mutated a source binary"
    fi
}

snapshot_preparation_cases=(
    'active snapshot install|install|1|false'
    'active snapshot file sync|sync|1|false'
    'active snapshot verification|install|1|true'
    'previous snapshot install|install|2|false'
    'previous snapshot file sync|sync|2|false'
    'previous snapshot verification|install|2|true'
    'recovery transaction sync|sync|3|false'
    'overlay directory sync|sync|4|false'
)

for operation in apply reset; do
    if [[ "$operation" == apply ]]; then
        recovery_label=update
        expected_preparation_message='Update failed before activation'
    else
        recovery_label=reset
        expected_preparation_message='Reset failed before mutation'
    fi
    for case_spec in "${snapshot_preparation_cases[@]}"; do
        IFS='|' read -r case_label boundary failure_at corrupt_install <<<"$case_spec"
        prepare_running_overlay
        active_sha_before=$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')
        active_mode_before=$(stat -c '%a' "$YARR_OVERLAY_DIR/yarr")
        previous_sha_before=$(sha256sum "$YARR_OVERLAY_DIR/yarr.previous" | awk '{print $1}')
        previous_mode_before=$(stat -c '%a' "$YARR_OVERLAY_DIR/yarr.previous")
        for attempt in 1 2; do
            reset_boundaries
            if [[ "$corrupt_install" == true ]]; then
                export YARR_TEST_CORRUPT_INSTALL_AT=$failure_at
            else
                export YARR_TEST_FAIL_COMMAND=$boundary
                export YARR_TEST_FAIL_AT=$failure_at
            fi
            if [[ "$operation" == apply ]]; then
                expect_failure "$operation $case_label attempt $attempt" \
                    "$updater" apply --version 2.1.0 --json
            else
                expect_failure "$operation $case_label attempt $attempt" \
                    "$updater" reset --json
            fi
            jq -e --arg message "$expected_preparation_message" \
                '.rolledBack == false and .message == $message' \
                "$tmp_dir/command.out" >/dev/null ||
                fail "$operation $case_label did not return a truthful pre-mutation outcome"
            expect_eq '0' "$(recovery_directory_count "$recovery_label")" \
                "$operation $case_label leaked a recovery directory"
            assert_preparation_sources_unchanged "$operation $case_label attempt $attempt" \
                "$active_sha_before" "$active_mode_before" \
                "$previous_sha_before" "$previous_mode_before"
            assert_running_overlay_restored "$operation $case_label attempt $attempt"
        done
    done
done

for operation in apply reset; do
    if [[ "$operation" == apply ]]; then
        recovery_label=update
        pending_prefix='Update failed before activation; recovery cleanup pending: '
    else
        recovery_label=reset
        pending_prefix='Reset failed before mutation; recovery cleanup pending: '
    fi
    prepare_running_overlay
    active_sha_before=$(sha256sum "$YARR_OVERLAY_DIR/yarr" | awk '{print $1}')
    active_mode_before=$(stat -c '%a' "$YARR_OVERLAY_DIR/yarr")
    previous_sha_before=$(sha256sum "$YARR_OVERLAY_DIR/yarr.previous" | awk '{print $1}')
    previous_mode_before=$(stat -c '%a' "$YARR_OVERLAY_DIR/yarr.previous")
    reset_boundaries
    export YARR_TEST_FAIL_COMMAND=sync
    export YARR_TEST_FAIL_AT=1
    export YARR_TEST_FAIL_RECOVERY_RM=true
    if [[ "$operation" == apply ]]; then
        expect_failure "$operation preparation cleanup failure" \
            "$updater" apply --version 2.1.0 --json
    else
        expect_failure "$operation preparation cleanup failure" \
            "$updater" reset --json
    fi
    cleanup_message=$(jq -r '.message' "$tmp_dir/command.out")
    [[ "$cleanup_message" == "$pending_prefix"* ]] ||
        fail "$operation cleanup failure was not preserved as a structured outcome"
    recovery_identifier=${cleanup_message#"$pending_prefix"}
    [[ "$recovery_identifier" =~ ^\.yarr\.${recovery_label}\.recovery\.[A-Za-z0-9]{8}$ ]] ||
        fail "$operation cleanup failure returned an unsafe recovery identifier"
    jq -e '.rolledBack == false' "$tmp_dir/command.out" >/dev/null ||
        fail "$operation cleanup failure falsely claimed restoration"
    retained_recovery="$YARR_OVERLAY_DIR/$recovery_identifier"
    [[ -d "$retained_recovery" && ! -L "$retained_recovery" &&
        -x "$retained_recovery/active.snapshot" ]] ||
        fail "$operation cleanup failure did not retain its partial recovery transaction"
    expect_eq '700' "$(stat -c '%a' "$retained_recovery")" \
        "$operation retained recovery transaction mode"
    expect_eq '1' "$(recovery_directory_count "$recovery_label")" \
        "$operation cleanup failure recovery directory count"
    assert_preparation_sources_unchanged "$operation cleanup failure" \
        "$active_sha_before" "$active_mode_before" \
        "$previous_sha_before" "$previous_mode_before"
    assert_running_overlay_restored "$operation cleanup failure"

    /bin/rm -rf -- "$retained_recovery"
    reset_boundaries
    export YARR_TEST_FAIL_COMMAND=sync
    export YARR_TEST_FAIL_AT=1
    if [[ "$operation" == apply ]]; then
        expect_failure "$operation preparation retry after cleanup failure" \
            "$updater" apply --version 2.1.0 --json
        expected_preparation_message='Update failed before activation'
    else
        expect_failure "$operation preparation retry after cleanup failure" \
            "$updater" reset --json
        expected_preparation_message='Reset failed before mutation'
    fi
    jq -e --arg message "$expected_preparation_message" \
        '.rolledBack == false and .message == $message' \
        "$tmp_dir/command.out" >/dev/null ||
        fail "$operation retry did not return a truthful pre-mutation outcome"
    expect_eq '0' "$(recovery_directory_count "$recovery_label")" \
        "$operation retry leaked a recovery directory"
    assert_preparation_sources_unchanged "$operation retry after cleanup failure" \
        "$active_sha_before" "$active_mode_before" \
        "$previous_sha_before" "$previous_mode_before"
    assert_running_overlay_restored "$operation retry after cleanup failure"
done

prepare_running_overlay
write_yarr "$YARR_OVERLAY_DIR/yarr.previous" 2.0.1
reset_boundaries
export YARR_TEST_READY_FAIL_ONCE="$tmp_dir/fail-manual-rollback-readiness-once"
expect_failure 'manual rollback activation fault' "$updater" rollback --json
unset YARR_TEST_READY_FAIL_ONCE
if ! jq -e '.rolledBack == true and .message == "Rollback failed; current binary restored"' \
    "$tmp_dir/command.out" >/dev/null; then
    cat "$tmp_dir/command.out" >&2
    cat "$tmp_dir/command.err" >&2
    fail 'failed manual rollback did not return its structured outcome'
fi
expect_eq '2.0.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" 'manual rollback activation fault active restoration'
expect_eq '2.0.1' "$("$YARR_OVERLAY_DIR/yarr.previous" --version | awk '{print $2}')" 'manual rollback activation fault predecessor restoration'
"$rc" status >/dev/null || fail 'manual rollback activation fault did not restore service readiness'
if find "$YARR_OVERLAY_DIR" -maxdepth 1 -type d -name '.yarr.rollback.*' -print -quit | grep -q .; then
    fail 'successful manual rollback restoration retained a transaction snapshot'
fi

prepare_running_overlay
write_yarr "$YARR_OVERLAY_DIR/yarr.previous" 2.0.1
reset_boundaries
export YARR_TEST_READY_FAIL_ONCE="$tmp_dir/fail-manual-rollback-restore-readiness-once"
export YARR_TEST_FAIL_COMMAND=install
export YARR_TEST_FAIL_AT=5
expect_failure 'manual rollback restoration helper fault' "$updater" rollback --json
unset YARR_TEST_READY_FAIL_ONCE YARR_TEST_FAIL_COMMAND YARR_TEST_FAIL_AT
if ! jq -e '.rolledBack == false and .rollbackAvailable == true and
    .message == "Rollback failed; restoration incomplete; recovery snapshots retained"' \
    "$tmp_dir/command.out" >/dev/null; then
    cat "$tmp_dir/command.out" >&2
    cat "$tmp_dir/command.err" >&2
    fail 'manual rollback restoration fault did not return its truthful structured outcome'
fi
expect_eq '2.0.1' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" \
    'manual rollback restoration fault surviving active binary'
expect_eq '2.0.0' "$("$YARR_OVERLAY_DIR/yarr.previous" --version | awk '{print $2}')" \
    'manual rollback restoration fault surviving predecessor binary'
rollback_snapshot=$(find "$YARR_OVERLAY_DIR" -maxdepth 1 -type d -name '.yarr.rollback.*' -print -quit)
[[ -n "$rollback_snapshot" && -x "$rollback_snapshot/active.snapshot" &&
    -x "$rollback_snapshot/previous.snapshot" ]] ||
    fail 'manual rollback restoration fault did not preserve both recovery snapshots'
expect_eq '700' "$(stat -c '%a' "$rollback_snapshot")" \
    'manual rollback recovery transaction mode'
expect_eq '2.0.0' "$("$rollback_snapshot/active.snapshot" --version | awk '{print $2}')" \
    'manual rollback active recovery snapshot'
expect_eq '2.0.1' "$("$rollback_snapshot/previous.snapshot" --version | awk '{print $2}')" \
    'manual rollback predecessor recovery snapshot'
expect_eq '2' "$(<"$YARR_TEST_FAKE_COUNTS/mv")" \
    'manual rollback restoration stopped before a destructive move'
if "$rc" status >/dev/null 2>&1; then
    fail 'manual rollback restoration fault claimed readiness without a restored service'
fi
/bin/rm -rf -- "$rollback_snapshot"

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=mv YARR_TEST_FAIL_AT=2
expect_failure 'predecessor rotation fault' "$updater" apply --version 2.1.0 --json
assert_running_overlay_restored 'predecessor rotation fault'

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=install YARR_TEST_FAIL_AT=3
expect_failure 'candidate install fault' "$updater" apply --version 2.1.0 --json
assert_running_overlay_restored 'candidate install fault'

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=sync YARR_TEST_FAIL_AT=5
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
export YARR_TEST_FAIL_COMMAND=sync YARR_TEST_FAIL_AT=8
export YARR_TEST_FAIL_COMMAND_2=mv YARR_TEST_FAIL_AT_2=4
expect_failure 'update restoration move fault after commit sync' \
    "$updater" apply --version 2.1.0 --json
unset YARR_TEST_FAIL_COMMAND YARR_TEST_FAIL_AT YARR_TEST_FAIL_COMMAND_2 YARR_TEST_FAIL_AT_2
if ! jq -e '.rolledBack == false and
    .message == "Update failed; restoration incomplete; recovery snapshots retained"' \
    "$tmp_dir/command.out" >/dev/null; then
    cat "$tmp_dir/command.out" >&2
    cat "$tmp_dir/command.err" >&2
    fail 'update restoration fault did not return its truthful structured outcome'
fi
update_recovery=$(find "$YARR_OVERLAY_DIR" -maxdepth 1 -type d \
    -name '.yarr.update.recovery.*' -print -quit)
[[ -n "$update_recovery" && -x "$update_recovery/active.snapshot" &&
    -x "$update_recovery/previous.snapshot" ]] ||
    fail 'update restoration fault did not preserve both durable snapshots'
expect_eq '700' "$(stat -c '%a' "$update_recovery")" \
    'update recovery transaction mode'
expect_eq '2.0.0' "$("$update_recovery/active.snapshot" --version | awk '{print $2}')" \
    'update active recovery snapshot'
expect_eq '1.9.0' "$("$update_recovery/previous.snapshot" --version | awk '{print $2}')" \
    'update predecessor recovery snapshot'
expect_eq '2.1.0' "$("$YARR_OVERLAY_DIR/yarr" --version | awk '{print $2}')" \
    'update restoration fault surviving active candidate'
if "$rc" status >/dev/null 2>&1; then
    fail 'update restoration fault claimed service readiness'
fi
/bin/rm -rf -- "$update_recovery"

prepare_running_overlay
reset_boundaries
export YARR_TEST_FAIL_COMMAND=sync YARR_TEST_FAIL_AT=5
export YARR_TEST_FAIL_COMMAND_2=mv YARR_TEST_FAIL_AT_2=3
expect_failure 'reset restoration move fault after commit sync' "$updater" reset --json
unset YARR_TEST_FAIL_COMMAND YARR_TEST_FAIL_AT YARR_TEST_FAIL_COMMAND_2 YARR_TEST_FAIL_AT_2
if ! jq -e '.rolledBack == false and
    .message == "Reset failed; restoration incomplete; recovery snapshots retained"' \
    "$tmp_dir/command.out" >/dev/null; then
    cat "$tmp_dir/command.out" >&2
    cat "$tmp_dir/command.err" >&2
    fail 'reset restoration fault did not return its truthful structured outcome'
fi
reset_recovery=$(find "$YARR_OVERLAY_DIR" -maxdepth 1 -type d \
    -name '.yarr.reset.recovery.*' -print -quit)
[[ -n "$reset_recovery" && -x "$reset_recovery/active.snapshot" &&
    -x "$reset_recovery/previous.snapshot" &&
    -x "$reset_recovery/active.retired" &&
    -x "$reset_recovery/previous.retired" ]] ||
    fail 'reset restoration fault did not preserve snapshots and retired binaries'
expect_eq '700' "$(stat -c '%a' "$reset_recovery")" \
    'reset recovery transaction mode'
expect_eq '2.0.0' "$("$reset_recovery/active.snapshot" --version | awk '{print $2}')" \
    'reset active recovery snapshot'
expect_eq '1.9.0' "$("$reset_recovery/previous.snapshot" --version | awk '{print $2}')" \
    'reset predecessor recovery snapshot'
[[ ! -e "$YARR_OVERLAY_DIR/yarr" && ! -e "$YARR_OVERLAY_DIR/yarr.previous" ]] ||
    fail 'reset restoration move fault fabricated an active binary'
if "$rc" status >/dev/null 2>&1; then
    fail 'reset restoration fault claimed service readiness'
fi
/bin/rm -rf -- "$reset_recovery"

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

prepare_running_overlay
reset_boundaries
export YARR_TEST_SIGNAL_COMMAND=rm YARR_TEST_SIGNAL_AT=4
expect_failure 'signal during apply post-commit cleanup' "$updater" apply --version 2.1.0 --json
assert_candidate_committed 'signal during apply post-commit cleanup'

unset YARR_TEST_FAIL_COMMAND YARR_TEST_FAIL_AT YARR_TEST_FAIL_COMMAND_2 \
    YARR_TEST_FAIL_AT_2 YARR_TEST_CORRUPT_INSTALL_AT \
    YARR_TEST_FAIL_RECOVERY_RM YARR_TEST_SIGNAL_COMMAND YARR_TEST_SIGNAL_AT
"$rc" stop

printf 'update contract: PASS\n'
