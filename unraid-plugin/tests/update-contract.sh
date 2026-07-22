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
export YARR_PID="$YARR_RUN_ROOT/yarr.pid"
export YARR_CURL_BIN="$test_root/bin/curl"
export YARR_RC_YARR="$rc"
export YARR_UPDATE_API_URL='https://fixture.invalid/api/releases'
export YARR_UPDATE_DOWNLOAD_ROOT='https://fixture.invalid/releases/download'
export YARR_READY_ATTEMPTS=1
export YARR_READY_INTERVAL=0

mkdir -p "$YARR_PLUGIN_ROOT/bin" "$YARR_PLUGIN_ROOT/scripts" \
    "$YARR_BOOT_ROOT/config/plugins/yarr" "$YARR_APPDATA_ROOT/yarr" \
    "$YARR_RUN_ROOT" "$YARR_LOCK_ROOT" "$YARR_LOG_ROOT" "$test_root/bin" \
    "$test_root/releases"
cp "$common" "$YARR_PLUGIN_ROOT/scripts/yarr-common.sh"

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

check_json=$("$updater" check --json)
expect_eq '2.1.0' "$(jq -r '.availableVersion' <<< "$check_json")" 'stable update selection'
expect_eq 'true' "$(jq -r '.updateAvailable' <<< "$check_json")" 'update availability'
if grep -Fq 'contract-token' <<< "$check_json"; then
    fail 'status output exposed environment value'
fi

expect_failure 'major version update' "$updater" apply --version 3.0.0 --json

missing_assets="$tmp_dir/releases-missing-assets.json"
jq 'map(if .tag_name == "v2.1.0" then .assets = [.assets[0]] else . end)' "$fixture" > "$missing_assets"
export YARR_TEST_RELEASES="$missing_assets"
expect_failure 'release missing checksum asset' "$updater" apply --version 2.1.0 --json
export YARR_TEST_RELEASES="$fixture"

cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_APPDATA/yarr"
overlay_before=$(sha256sum "$YARR_APPDATA/yarr" | awk '{print $1}')
printf '000000000000000000000000000000000000000000000000000000000000 yarr-x86_64.tar.gz\n' > "$tmp_dir/bad.sha256"
export YARR_TEST_CHECKSUM="$tmp_dir/bad.sha256"
expect_failure 'checksum mismatch' "$updater" apply --version 2.1.0 --json
expect_eq "$overlay_before" "$(sha256sum "$YARR_APPDATA/yarr" | awk '{print $1}')" 'checksum failure overlay preservation'
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
expect_eq "$overlay_before" "$(sha256sum "$YARR_APPDATA/yarr" | awk '{print $1}')" 'extra entry overlay preservation'
make_archive 2.1.0 symlink
expect_failure 'archive symlink payload' "$updater" apply --version 2.1.0 --json
expect_eq "$overlay_before" "$(sha256sum "$YARR_APPDATA/yarr" | awk '{print $1}')" 'symlink overlay preservation'
make_archive 2.1.0 path
expect_failure 'archive path entry' "$updater" apply --version 2.1.0 --json
expect_eq "$overlay_before" "$(sha256sum "$YARR_APPDATA/yarr" | awk '{print $1}')" 'path entry overlay preservation'
make_archive 2.1.0 regular

expect_failure 'untrusted lock-held lifecycle invocation' \
    env YARR_LOCK_HELD=1 YARR_LOCK_FD=9 "$rc" start

"$rc" start
[[ -f "$YARR_PID" ]] || fail 'pre-update service did not start'
"$updater" apply --version 2.1.0 --json > "$tmp_dir/apply.json"
expect_eq '2.1.0' "$("$YARR_APPDATA/yarr" --version | awk '{print $2}')" 'installed overlay version'
expect_eq '2.0.0' "$("$YARR_APPDATA/yarr.previous" --version | awk '{print $2}')" 'predecessor overlay version'
if ! "$rc" status > "$tmp_dir/updated-status.out" 2>&1; then
    cat "$tmp_dir/updated-status.out" >&2
    fail 'updated service is not ready'
fi

cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_APPDATA/.yarr.test"
mv -f "$YARR_APPDATA/.yarr.test" "$YARR_APPDATA/yarr"
rm -f "$YARR_APPDATA/yarr.previous"
"$rc" restart
export YARR_TEST_READY_FAIL_ONCE="$tmp_dir/fail-readiness-once"
expect_failure 'readiness failure update' "$updater" apply --version 2.1.0 --json
unset YARR_TEST_READY_FAIL_ONCE
expect_eq '2.0.0' "$("$YARR_APPDATA/yarr" --version | awk '{print $2}')" 'rollback overlay restoration'
"$rc" status >/dev/null || fail 'rollback service is not ready'

"$updater" reset --json > "$tmp_dir/reset.json"
[[ ! -e "$YARR_APPDATA/yarr" && ! -e "$YARR_APPDATA/yarr.previous" ]] || fail 'reset retained an overlay'
expect_eq '2.0.0' "$("$YARR_PLUGIN_ROOT/bin/yarr" --version | awk '{print $2}')" 'packaged binary after reset'
"$rc" status >/dev/null || fail 'reset did not restart the packaged binary'

"$rc" stop
"$updater" apply --version 2.1.0 --json > "$tmp_dir/stopped-apply.json"
[[ ! -e "$YARR_PID" ]] || fail 'stopped service was started by apply'
"$updater" reset --json > "$tmp_dir/stopped-reset.json"
[[ ! -e "$YARR_PID" ]] || fail 'stopped service was started by reset'

printf 'update contract: PASS\n'
