#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
common="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh"
rc="$repo_root/unraid-plugin/source/etc/rc.d/rc.yarr"
started="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/started"
stopping="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/stopping_svcs"
unmounting="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/event/unmounting_disks"
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

fail() {
    printf 'lifecycle contract: %s\n' "$1" >&2
    exit 1
}

expect_failure() {
    local label=$1
    shift
    if "$@" >/dev/null 2>&1; then
        fail "$label unexpectedly succeeded"
    fi
}

expect_eq() {
    local expected=$1 actual=$2 label=$3
    [[ "$actual" == "$expected" ]] || fail "$label: expected $expected, got $actual"
}

test_root="$tmp_dir/root"
export YARR_PLUGIN_ROOT="$test_root/plugin"
export YARR_BOOT_ROOT="$test_root/boot"
export YARR_APPDATA_ROOT="$test_root/appdata"
export YARR_RUN_ROOT="$test_root/run"
export YARR_LOCK_ROOT="$test_root/lock"
export YARR_LOG_ROOT="$test_root/log"
export YARR_OVERLAY_DIR="$YARR_APPDATA_ROOT/yarr/bin"
export YARR_CURL_BIN="$test_root/bin/curl"
export YARR_TAILSCALE_BIN="$test_root/bin/tailscale"
export YARR_RC_YARR="$rc"

mkdir -p "$YARR_PLUGIN_ROOT/bin" "$YARR_BOOT_ROOT/config/plugins/yarr" \
    "$YARR_OVERLAY_DIR" "$YARR_RUN_ROOT" "$YARR_LOCK_ROOT" "$YARR_LOG_ROOT" \
    "$test_root/bin"

cat > "$YARR_CURL_BIN" <<'EOF'
#!/usr/bin/env bash
exit "${YARR_TEST_CURL_STATUS:-0}"
EOF
chmod 755 "$YARR_CURL_BIN"

cat > "$YARR_TAILSCALE_BIN" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "${YARR_TEST_TAILSCALE_LOG}"
exit "${YARR_TEST_TAILSCALE_STATUS:-0}"
EOF
chmod 755 "$YARR_TAILSCALE_BIN"
export YARR_TEST_TAILSCALE_LOG="$test_root/tailscale.log"

cat > "$test_root/yarr.c" <<'EOF'
#include <unistd.h>
int main(void) { sleep(30); return 0; }
EOF
cc -O2 -o "$YARR_PLUGIN_ROOT/bin/yarr" "$test_root/yarr.c"
cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_OVERLAY_DIR/yarr"
chmod 644 "$YARR_OVERLAY_DIR/yarr"

write_config() {
    cat > "$YARR_BOOT_ROOT/config/plugins/yarr/yarr.cfg" <<EOF
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
    cat > "$YARR_BOOT_ROOT/config/plugins/yarr/.env" <<EOF
YARR_MCP_TOKEN=contract-token
EOF
}

write_config

[[ -f "$common" ]] || fail "missing yarr-common.sh"
[[ -x "$rc" ]] || fail "missing executable rc.yarr"
[[ -x "$started" && -x "$stopping" && -x "$unmounting" ]] || fail "missing executable event hooks"
mkdir -p "$YARR_PLUGIN_ROOT/scripts"
cp "$common" "$YARR_PLUGIN_ROOT/scripts/yarr-common.sh"

# shellcheck disable=SC1090
source "$common"

yarr_load_config
yarr_validate_config
expect_eq "127.0.0.1" "$(yarr_effective_host)" "default host"
expect_eq "40070" "$PORT" "default port"

sed -i 's/$/\r/' "$YARR_CFG"
yarr_load_config
yarr_validate_config
printf 'UNKNOWN_KEY=no\n' >> "$YARR_CFG"
expect_failure "unknown configuration key" bash -c "source '$common'; yarr_load_config"
write_config
printf 'YARR_MCP_TOKEN=contract-token\a\n' > "$YARR_ENV"
expect_failure "control character in environment" bash -c "source '$common'; yarr_load_config"
printf 'LD_PRELOAD=/tmp/unsafe.so\n' > "$YARR_ENV"
expect_failure "unsafe process environment key" bash -c "source '$common'; yarr_load_config"
write_config

sed -i 's/^BIND_MODE=loopback$/BIND_MODE=lan/' "$YARR_CFG"
yarr_load_config
yarr_validate_config
expect_eq "0.0.0.0" "$(yarr_effective_host)" "LAN host"

sed -i 's/^BIND_MODE=lan$/BIND_MODE=custom/' "$YARR_CFG"
expect_failure "empty custom host" bash -c "source '$common'; yarr_load_config; yarr_validate_config"
sed -i 's/^CUSTOM_HOST=$/CUSTOM_HOST=not-an-ip/' "$YARR_CFG"
expect_failure "non-IP custom host" bash -c "source '$common'; yarr_load_config; yarr_validate_config"
sed -i 's/^CUSTOM_HOST=not-an-ip$/CUSTOM_HOST=192.0.2.15/' "$YARR_CFG"
yarr_load_config
yarr_validate_config
expect_eq "192.0.2.15" "$(yarr_effective_host)" "custom host"

: > "$YARR_ENV"
expect_failure "non-loopback bearer mode without YARR_MCP_TOKEN" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
printf 'YARR_MCP_TOKEN=contract-token\n' > "$YARR_ENV"
yarr_load_config
yarr_validate_config

write_config
sed -i 's/^BIND_MODE=loopback$/BIND_MODE=lan/' "$YARR_CFG"
sed -i 's/^AUTH_MODE=bearer$/AUTH_MODE=google-oauth/' "$YARR_CFG"
: > "$YARR_ENV"
expect_failure "google-oauth without Yarr Google credentials" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
cat > "$YARR_ENV" <<EOF
YARR_MCP_GOOGLE_CLIENT_ID=contract-client-id
YARR_MCP_GOOGLE_CLIENT_SECRET=contract-client-secret
EOF
yarr_load_config
yarr_validate_config
yarr_write_runtime_env
grep -Fqx 'YARR_MCP_AUTH_MODE=oauth' "$YARR_RUNTIME_ENV" || fail "google-oauth did not generate Yarr OAuth mode"
grep -Fqx 'YARR_MCP_GOOGLE_CLIENT_ID=contract-client-id' "$YARR_RUNTIME_ENV" || fail "google-oauth client ID missing"
grep -Fqx 'YARR_MCP_GOOGLE_CLIENT_SECRET=contract-client-secret' "$YARR_RUNTIME_ENV" || fail "google-oauth client secret missing"

write_config
sed -i 's/^BIND_MODE=loopback$/BIND_MODE=lan/' "$YARR_CFG"
sed -i 's/^AUTH_MODE=bearer$/AUTH_MODE=trusted-gateway/' "$YARR_CFG"
: > "$YARR_ENV"
expect_failure "trusted-gateway without Yarr provenance" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
printf 'YARR_MCP_ALLOWED_HOSTS=proxy.tailnet.ts.net\n' > "$YARR_ENV"
yarr_load_config
yarr_validate_config
yarr_write_runtime_env
grep -Fqx 'YARR_MCP_AUTH_MODE=bearer' "$YARR_RUNTIME_ENV" || fail "trusted-gateway auth mode missing"
grep -Fqx 'YARR_NOAUTH=true' "$YARR_RUNTIME_ENV" || fail "trusted-gateway did not enable Yarr gateway mode"

write_config
sed -i 's/^TAILSCALE_SERVE=no$/TAILSCALE_SERVE=yes/' "$YARR_CFG"
expect_failure "Tailscale service without hostname" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
sed -i 's/^TAILSCALE_HOSTNAME=$/TAILSCALE_HOSTNAME=not_a_hostname/' "$YARR_CFG"
expect_failure "invalid Tailscale service hostname" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
write_config

chmod 644 "$YARR_OVERLAY_DIR/yarr"
yarr_select_binary
expect_eq "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_BINARY" "non-executable overlay ignored"
chmod 755 "$YARR_OVERLAY_DIR/yarr"
yarr_select_binary
expect_eq "$YARR_OVERLAY_DIR/yarr" "$YARR_BINARY" "executable overlay selected"

printf '999999\n' > "$YARR_PID"
expect_failure "stale pid ownership" yarr_pid_is_owned
[[ ! -e "$YARR_PID" ]] || fail "stale PID file was not removed"

/bin/sleep 30 &
foreign_pid=$!
printf '%s\n' "$foreign_pid" > "$YARR_PID"
expect_failure "foreign process ownership" yarr_pid_is_owned
"$rc" stop
kill -0 "$foreign_pid" 2>/dev/null || fail "stop signaled a foreign PID"
kill "$foreign_pid"
wait "$foreign_pid" 2>/dev/null || true

write_config
sed -i 's/^TAILSCALE_SERVE=no$/TAILSCALE_SERVE=yes/' "$YARR_CFG"
sed -i 's/^TAILSCALE_HOSTNAME=$/TAILSCALE_HOSTNAME=yarr-contract/' "$YARR_CFG"
export YARR_TEST_CURL_STATUS=0
"$rc" start
service_pid=$(cat "$YARR_PID")
[[ -n "$service_pid" ]] || fail "start did not record a PID"
"$rc" start
expect_eq "$service_pid" "$(cat "$YARR_PID")" "idempotent start"
grep -Fqx 'serve --bg --service svc:yarr-contract --https 40070 --set-path / http://127.0.0.1:40070' "$YARR_TEST_TAILSCALE_LOG" || \
    fail "Tailscale setup was not scoped to the configured Yarr service"

yarr_load_config
yarr_validate_config
yarr_select_binary
yarr_write_runtime_env
[[ "$(stat -c '%a' "$YARR_RUNTIME_ENV")" == "600" ]] || fail "runtime environment is not mode 0600"
grep -Fqx "YARR_MCP_HOST=127.0.0.1" "$YARR_RUNTIME_ENV" || fail "runtime host missing"
grep -Fqx "YARR_MCP_TOKEN=contract-token" "$YARR_RUNTIME_ENV" || fail "runtime token was not shell-safely rendered"

poison="$test_root/poison"
malicious_token="contract-token;\$(touch $poison)"
printf 'YARR_MCP_TOKEN=%s\n' "$malicious_token" > "$YARR_ENV"
yarr_load_config
yarr_validate_config
yarr_write_runtime_env
env -i bash -c 'source "$1"; [[ "$YARR_MCP_TOKEN" == "$2" ]]' _ "$YARR_RUNTIME_ENV" "$malicious_token" || \
    fail "runtime environment did not preserve a shell-safe value"
[[ ! -e "$poison" ]] || fail "runtime environment executed a dotenv value"

hook_rc="$test_root/hook-rc"
cat > "$hook_rc" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$1" >> "${YARR_TEST_HOOK_LOG}"
exit "${YARR_TEST_HOOK_STATUS:-0}"
EOF
chmod 755 "$hook_rc"
export YARR_RC_YARR="$hook_rc"
export YARR_TEST_HOOK_LOG="$test_root/hooks.log"
"$started"
"$stopping"
"$unmounting"
expect_eq $'start\nstop\nstop' "$(cat "$YARR_TEST_HOOK_LOG")" "hook delegation"
export YARR_TEST_HOOK_STATUS=7
expect_failure "started hook failure propagation" "$started"

export YARR_RC_YARR="$rc"
sed -i 's/^TAILSCALE_SERVE=yes$/TAILSCALE_SERVE=no/' "$YARR_CFG"
"$rc" stop
[[ ! -e "$YARR_PID" ]] || fail "stop did not remove PID file"
grep -Fqx 'serve clear svc:yarr-contract' "$YARR_TEST_TAILSCALE_LOG" || \
    fail "Tailscale cleanup did not target the recorded Yarr service"
if grep -Fqx 'serve off' "$YARR_TEST_TAILSCALE_LOG"; then
    fail "Tailscale cleanup removed unscoped Serve state"
fi

write_config
"$rc" start
service_pid=$(cat "$YARR_PID")
sed -i 's/^PORT=40070$/PORT=invalid/' "$YARR_CFG"
"$rc" stop
if kill -0 "$service_pid" 2>/dev/null; then
    fail "stop did not terminate Yarr after configuration became invalid"
fi

# A compound restart keeps the canonical lock held across stop and start. The
# contender runs at the stop boundary and must fail before start is invoked.
write_config
"$rc" start
# shellcheck disable=SC1090
source "$rc"
eval "$(declare -f yarr_stop_locked | sed '1s/yarr_stop_locked/yarr_stop_locked_real/')"
eval "$(declare -f yarr_start_locked | sed '1s/yarr_start_locked/yarr_start_locked_real/')"
yarr_stop_locked() {
    yarr_stop_locked_real
    printf 'stop\n' >> "$test_root/restart-lock-trace"
    if flock -n "$YARR_LOCK" -c true; then
        fail 'restart released the lock between stop and start'
    fi
    printf 'contender-blocked\n' >> "$test_root/restart-lock-trace"
}
yarr_start_locked() {
    printf 'start\n' >> "$test_root/restart-lock-trace"
    yarr_start_locked_real
}
yarr_with_lock yarr_restart_locked
expect_eq $'stop\ncontender-blocked\nstart' "$(cat "$test_root/restart-lock-trace")" "restart lock trace"
"$rc" restart
"$rc" reload

printf 'lifecycle contract: PASS\n'
