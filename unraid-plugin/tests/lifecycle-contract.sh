#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
common="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh"
rc="$repo_root/unraid-plugin/source/etc/rc.d/rc.yarr"
classic_uninstall="$repo_root/unraid-plugin/source/usr/local/emhttp/plugins/yarr/scripts/uninstall-classic-plugin.sh"
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
YARR_TEST_PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')
export YARR_TEST_PORT
export YARR_PLUGIN_ROOT="$test_root/plugin"
export YARR_BOOT_ROOT="$test_root/boot"
export YARR_APPDATA_ROOT="$test_root/appdata"
export YARR_RUN_ROOT="$test_root/var/run"
export YARR_LOCK_ROOT="$test_root/var/lock"
export YARR_LOG_ROOT="$test_root/var/log"
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
#include <arpa/inet.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static volatile sig_atomic_t running = 1;
static void stop(int signal_number) { (void)signal_number; running = 0; }

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--version") == 0) {
        puts("yarr 2.1.0");
        return 0;
    }
    if (argc != 3 || strcmp(argv[1], "serve") != 0 || strcmp(argv[2], "mcp") != 0) return 64;
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
EOF
cc -O2 -o "$YARR_PLUGIN_ROOT/bin/yarr" "$test_root/yarr.c"
cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_OVERLAY_DIR/yarr"
chmod 644 "$YARR_OVERLAY_DIR/yarr"

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
    cat > "$YARR_BOOT_ROOT/config/plugins/yarr/.env" <<EOF
YARR_MCP_TOKEN=contract-token
EOF
}

write_config

[[ -f "$common" ]] || fail "missing yarr-common.sh"
[[ -x "$rc" ]] || fail "missing executable rc.yarr"
grep -Fq 'YARR_FLOCK_BIN=/usr/bin/flock' "$common" || fail 'installed inherited-fd verification is not pinned to /usr/bin/flock'
[[ -x "$started" && -x "$stopping" && -x "$unmounting" ]] || fail "missing executable event hooks"
mkdir -p "$YARR_PLUGIN_ROOT/scripts"
cp "$common" "$YARR_PLUGIN_ROOT/scripts/yarr-common.sh"

installed_rc="$test_root/installed/etc/rc.d/rc.yarr"
bootstrap_attacker_root="$test_root/bootstrap-attacker/plugin"
bootstrap_marker="$test_root/bootstrap-marker"
mkdir -p "$(dirname "$installed_rc")" "$bootstrap_attacker_root/scripts"
cp "$rc" "$installed_rc"
cat > "$bootstrap_attacker_root/scripts/yarr-common.sh" <<EOF
#!/usr/bin/env bash
printf 'common\n' >> "$bootstrap_marker"
EOF
chmod 755 "$installed_rc" "$bootstrap_attacker_root/scripts/yarr-common.sh"

expect_failure 'installed rc execution accepted an environment-selected common helper' \
    env YARR_PLUGIN_ROOT="$bootstrap_attacker_root" "$installed_rc" status
[[ ! -e "$bootstrap_marker" ]] || fail 'installed rc execution sourced attacker common helper'

expect_failure 'installed rc sourcing accepted an environment-selected common helper' \
    env YARR_PLUGIN_ROOT="$bootstrap_attacker_root" bash -c 'source "$1"' _ "$installed_rc"
[[ ! -e "$bootstrap_marker" ]] || fail 'installed rc sourcing sourced attacker common helper'

# shellcheck disable=SC1090
source "$common"

# The API owns one canonical open file description after its short acquisition
# child exits, and lifecycle children share it as descriptor 3. rc.yarr accepts only that exact
# inherited lock description, and direct actions must keep their old behavior.
exec 8>"$YARR_LOCK"
flock -n 8 || fail 'could not acquire shared descriptor fixture lock'
"$rc" --lock-fd 8 status 8>&8 >/dev/null || [[ $? -eq 3 ]] || \
    fail 'shared canonical lock descriptor was rejected'
exec 8>&-
flock -n "$YARR_LOCK" /usr/bin/true || fail 'canonical lock remained held after shared descriptor close'
exec 8>"$YARR_LOCK"
flock -n 8 || fail 'could not acquire old-inode lock fixture'
rm -f "$YARR_LOCK"
: > "$YARR_LOCK"
chmod 0600 "$YARR_LOCK"
expect_failure 'held old lock inode accepted after path replacement' "$rc" --lock-fd 8 status
exec 8>&-
expect_failure 'malformed inherited lock descriptor' "$rc" --lock-fd nope status
expect_failure 'closed inherited lock descriptor' "$rc" --lock-fd 8 status
exec 8>"$test_root/alternate.lock"
flock -n 8
expect_failure 'alternate inherited lock path' "$rc" --lock-fd 8 status
exec 8>&-
bash -c 'exec 9>"$1"; flock 9; sleep 30' _ "$YARR_LOCK" &
separate_lock_holder=$!
sleep 0.1
exec 8>"$YARR_LOCK"
expect_failure 'separately owned canonical lock' "$rc" --lock-fd 8 status
exec 8>&-
kill "$separate_lock_holder"
wait "$separate_lock_holder" 2>/dev/null || true

# The inherited API lock descriptor must remain in rc.yarr while the action is
# active, but must not leak into the long-lived daemon launched by start.
exec 8>"$YARR_LOCK"
flock -n 8 || fail 'could not acquire inherited daemon leak fixture lock'
"$rc" --lock-fd 8 start 8>&8
inherited_start_pid=$(cat "$YARR_PID")
kill -0 "$inherited_start_pid" 2>/dev/null || fail 'inherited-fd start did not leave Yarr running'
exec 8>&-
flock -n "$YARR_LOCK" /usr/bin/true || fail 'launched Yarr daemon retained inherited API lock descriptor'
"$rc" stop

yarr_load_config
yarr_validate_config
expect_eq "127.0.0.1" "$(yarr_effective_host)" "default host"
expect_eq "$YARR_TEST_PORT" "$PORT" "configured test port"

cp "$YARR_CFG" "${YARR_CFG}.transaction"
cp "$YARR_ENV" "${YARR_ENV}.transaction"
printf 'version=1\nhad_previous_good=no\n' > "${YARR_CFG}.transaction-state"
sed -i "s/^PORT=${YARR_TEST_PORT}$/PORT=40199/" "$YARR_CFG"
printf 'YARR_MCP_TOKEN=prospective-crash-secret\n' > "$YARR_ENV"
yarr_load_config
yarr_validate_config
expect_eq "$YARR_TEST_PORT" "$PORT" "shell transaction recovery port"
grep -Fqx 'YARR_MCP_TOKEN=contract-token' "$YARR_ENV" || fail 'shell transaction recovery lost the prior credential'
[[ ! -e "${YARR_CFG}.transaction-state" ]] || fail 'shell transaction recovery retained its commit marker'

cp "$YARR_CFG" "${YARR_CFG}.good"
cp "$YARR_ENV" "${YARR_ENV}.good"
sed -i "s/^PORT=${YARR_TEST_PORT}$/PORT=40198/" "$YARR_CFG"
printf 'YARR_MCP_TOKEN=failed-rollback-secret\n' > "$YARR_ENV"
printf 'version=2\noperation=rollback\nhad_previous_good=yes\n' > "${YARR_CFG}.transaction-state"
cp "${YARR_CFG}.good" "$YARR_CFG"
yarr_load_config
yarr_validate_config
expect_eq "$YARR_TEST_PORT" "$PORT" "shell rollback transaction recovery port"
grep -Fqx 'YARR_MCP_TOKEN=contract-token' "$YARR_ENV" || fail 'shell rollback recovery lost the known-good credential'
[[ ! -e "${YARR_CFG}.transaction-state" ]] || fail 'shell rollback recovery retained its commit marker'

YARR_LOG_MAX_BYTES=64
YARR_LOG_RETENTION=2
printf '%080d\n' 0 > "$YARR_LOG"
yarr_log 'rotation-trigger'
[[ -f "$YARR_LOG.1" && -f "$YARR_LOG" ]] || fail 'bounded wrapper log did not rotate at the threshold'
[[ $(stat -c %a "$YARR_LOG") == 600 && $(stat -c %a "$YARR_LOG.1") == 600 ]] || fail 'wrapper log rotation did not enforce mode 0600'
printf '%080d\n' 1 > "$YARR_LOG"
yarr_log 'second-rotation'
printf '%080d\n' 2 > "$YARR_LOG"
yarr_log 'third-rotation'
[[ -f "$YARR_LOG.2" && ! -e "$YARR_LOG.3" ]] || fail 'wrapper log retention exceeded its fixed bound'
rm -f "$YARR_LOG" "$YARR_LOG.1" "$YARR_LOG.2"
ln -s "$test_root/unsafe-log-target" "$YARR_LOG"
expect_failure 'symlink wrapper log path' yarr_log 'must-not-follow'
[[ ! -e "$test_root/unsafe-log-target" ]] || fail 'wrapper log followed a symlink'
rm -f "$YARR_LOG"

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
grep -Fqx 'export YARR_MCP_AUTH_MODE=oauth' "$YARR_RUNTIME_ENV" || fail "google-oauth did not generate Yarr OAuth mode"
grep -Fqx 'export YARR_MCP_GOOGLE_CLIENT_ID=contract-client-id' "$YARR_RUNTIME_ENV" || fail "google-oauth client ID missing"
grep -Fqx 'export YARR_MCP_GOOGLE_CLIENT_SECRET=contract-client-secret' "$YARR_RUNTIME_ENV" || fail "google-oauth client secret missing"

write_config
sed -i 's/^AUTH_MODE=bearer$/AUTH_MODE=trusted-gateway/' "$YARR_CFG"
: > "$YARR_ENV"
expect_failure "trusted-gateway without Yarr provenance" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
printf 'YARR_MCP_ALLOWED_HOSTS=proxy.tailnet.ts.net\n' > "$YARR_ENV"
yarr_load_config
yarr_validate_config
yarr_write_runtime_env
grep -Fqx 'export YARR_MCP_AUTH_MODE=bearer' "$YARR_RUNTIME_ENV" || fail "trusted-gateway auth mode missing"
grep -Fqx 'export YARR_NOAUTH=true' "$YARR_RUNTIME_ENV" || fail "trusted-gateway did not enable Yarr gateway mode"
sed -i 's/^BIND_MODE=loopback$/BIND_MODE=lan/' "$YARR_CFG"
expect_failure "direct-socket Host spoofing with trusted gateway" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
printf 'YARR_MCP_ALLOWED_ORIGINS=https://proxy.tailnet.ts.net\n' > "$YARR_ENV"
expect_failure "direct-socket Origin spoofing with trusted gateway" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"
sed -i 's/^BIND_MODE=lan$/BIND_MODE=loopback/' "$YARR_CFG"
sed -i 's/^TAILSCALE_SERVE=no$/TAILSCALE_SERVE=yes/; s/^TAILSCALE_HOSTNAME=$/TAILSCALE_HOSTNAME=yarr-contract/' "$YARR_CFG"
expect_failure "Tailscale exposure with trusted gateway" \
    bash -c "source '$common'; yarr_load_config; yarr_validate_config"

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
[[ -e "$YARR_PID" ]] || fail "foreign live PID evidence was discarded"
expect_failure "foreign process stop with unverified ownership" "$rc" stop
kill -0 "$foreign_pid" 2>/dev/null || fail "stop signaled a foreign PID"
kill "$foreign_pid"
wait "$foreign_pid" 2>/dev/null || true

# The canonical packaged binary is outside the emhttp plugin tree. It must be
# recognized as owned without broadening ownership to an unrelated executable.
export YARR_PACKAGED_BINARY="$test_root/usr/local/yarr/bin/yarr"
mkdir -p "$(dirname "$YARR_PACKAGED_BINARY")"
cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_PACKAGED_BINARY"
/bin/sleep 30 &
unrelated_pid=$!
rm -f "$YARR_PID"
chmod 644 "$YARR_OVERLAY_DIR/yarr"
"$rc" start
packaged_pid=$(cat "$YARR_PID")
yarr_pid_is_owned || fail 'canonical packaged process was not recognized as owned'
"$rc" status >/dev/null || fail 'status did not recognize canonical packaged process'
[[ -f "$YARR_LOGGER_PID" && ! -L "$YARR_LOGGER_PID" ]] ||
    fail 'logger start did not record structured identity evidence'
expect_eq '600' "$(stat -c '%a' "$YARR_LOGGER_PID")" 'logger identity evidence mode'
logger_pid=$(sed -n 's/^pid=//p' "$YARR_LOGGER_PID")
[[ "$logger_pid" =~ ^[1-9][0-9]*$ ]] || fail 'logger identity evidence omitted its PID'
yarr_logger_pid_is_owned || fail 'genuine logger identity could not be revalidated'
cp "$YARR_LOGGER_PID" "$test_root/genuine-logger.identity"
"$rc" stop
if kill -0 "$packaged_pid" 2>/dev/null; then
    kill "$packaged_pid" 2>/dev/null || true
    fail 'stop did not terminate canonical packaged process'
fi
kill -0 "$logger_pid" 2>/dev/null && fail 'stop did not terminate the genuine logger'
[[ ! -e "$YARR_LOGGER_PID" ]] || fail 'stop retained genuine logger identity evidence'
kill -0 "$unrelated_pid" 2>/dev/null || fail 'stop signaled an unrelated process'

/bin/sleep 30 &
reused_logger_pid=$!
sed "s/^pid=.*/pid=${reused_logger_pid}/" "$test_root/genuine-logger.identity" > "$YARR_LOGGER_PID"
chmod 0600 "$YARR_LOGGER_PID"
yarr_stop_logger
kill -0 "$reused_logger_pid" 2>/dev/null ||
    fail 'stale logger evidence signaled a reused unrelated PID'
[[ ! -e "$YARR_LOGGER_PID" ]] || fail 'stale logger identity evidence was not removed'
kill "$reused_logger_pid"
wait "$reused_logger_pid" 2>/dev/null || true

# Status and package/event quiescence establish process ownership before
# parsing configuration. A stopped installation remains removable even when a
# manually edited dotenv file is malformed; an unverified live PID remains
# fail-closed and is never signaled.
printf 'MALFORMED_LINE_WITHOUT_EQUALS\n' > "$YARR_ENV"
rm -f "$YARR_PID" "$YARR_PID_META" "$YARR_LOGGER_PID"
set +e
"$rc" status >/dev/null 2>&1
stopped_status=$?
set -e
expect_eq '3' "$stopped_status" 'malformed stopped status'
exec 8>"$YARR_LOCK"
flock -n 8 || fail 'could not acquire malformed pre-install quiescence lock'
"$rc" --lock-fd 8 stop 8>&8
set +e
"$rc" --lock-fd 8 status 8>&8 >/dev/null 2>&1
preinstall_status=$?
set -e
exec 8>&-
expect_eq '3' "$preinstall_status" 'malformed stopped pre-install quiescence'
env YARR_RC="$rc" YARR_EVENT_ATTEMPTS=2 YARR_EVENT_LOCK_WAIT_SECONDS=1 \
    YARR_EVENT_RETRY_SECONDS=0 "$stopping"
[[ -f "$YARR_ARRAY_STOPPING" && ! -L "$YARR_ARRAY_STOPPING" ]] ||
    fail 'malformed stopped event omitted the array fence'
rm -f "$YARR_ARRAY_STOPPING"
/bin/sleep 30 &
unverified_status_pid=$!
printf '%s\n' "$unverified_status_pid" > "$YARR_PID"
rm -f "$YARR_PID_META"
set +e
"$rc" status >/dev/null 2>&1
unverified_status=$?
set -e
expect_eq '4' "$unverified_status" 'malformed unverified-live status'
kill -0 "$unverified_status_pid" 2>/dev/null ||
    fail 'malformed status signaled an unverified live PID'
[[ -e "$YARR_PID" ]] || fail 'malformed status discarded unverified live PID evidence'
kill "$unverified_status_pid"
wait "$unverified_status_pid" 2>/dev/null || true
rm -f "$YARR_PID"
write_config

cat >> "$YARR_ENV" <<'EOF'
YARR_SERVICES=qbittorrent
YARR_QBITTORRENT_USERNAME=credential-only-user
EOF
yarr_load_config
expect_failure 'credential-only enabled service without URL' yarr_validate_config
expect_failure 'packaged lifecycle accepted enabled service without URL' "$rc" start
[[ ! -e "$YARR_PID" ]] || fail 'invalid credential-only service started Yarr'
write_config

# Replacement of a running executable leaves a deleted-inode process. The
# recorded start time, argv, and binary inode must still prove ownership so it
# can be stopped before package replacement.
"$rc" start
deleted_inode_pid=$(cat "$YARR_PID")
cp "$YARR_PLUGIN_ROOT/bin/yarr" "$YARR_PACKAGED_BINARY.new"
mv -f "$YARR_PACKAGED_BINARY.new" "$YARR_PACKAGED_BINARY"
grep -Fq ' (deleted)' "/proc/$deleted_inode_pid/maps" || true
yarr_pid_is_owned || fail 'owned deleted-inode daemon was orphaned during upgrade'
"$rc" stop
kill -0 "$deleted_inode_pid" 2>/dev/null && fail 'deleted-inode upgrade daemon survived stop'

# Classic uninstall delegates to the same ownership-safe stop path.
uninstall_plugin="$test_root/usr/local/emhttp/plugins/yarr"
mkdir -p "$test_root/etc/rc.d" "$uninstall_plugin/scripts"
cat > "$test_root/etc/rc.d/rc.yarr" <<'EOF'
#!/usr/bin/env bash
exec "$YARR_REAL_RC" "$@"
EOF
cat > "$uninstall_plugin/scripts/uninstall-api-plugin.sh" <<'EOF'
#!/usr/bin/env bash
: > "$YARR_TEST_UNINSTALL_API_MARKER"
exit 0
EOF
chmod 755 "$test_root/etc/rc.d/rc.yarr" "$uninstall_plugin/scripts/uninstall-api-plugin.sh"
ln -sf "$common" "$uninstall_plugin/scripts/yarr-common.sh"
export YARR_REAL_RC="$rc"
export YARR_TEST_UNINSTALL_API_MARKER="$test_root/uninstall-api-called"
/bin/sleep 30 &
residual_pid=$!
printf '%s\n' "$residual_pid" > "$YARR_PID"
expect_failure 'uninstall with unverified residual process' env YARR_TEST_ROOT="$test_root" "$classic_uninstall"
kill -0 "$residual_pid" 2>/dev/null || fail 'failed uninstall signaled an unrelated residual process'
[[ -e "$YARR_PID" ]] || fail 'failed uninstall discarded residual PID evidence'
[[ ! -e "$YARR_TEST_UNINSTALL_API_MARKER" ]] || fail 'failed uninstall removed API registration before proving stop'
kill "$residual_pid"
wait "$residual_pid" 2>/dev/null || true
rm -f "$YARR_PID"
"$rc" start
packaged_pid=$(cat "$YARR_PID")
YARR_TEST_ROOT="$test_root" "$classic_uninstall"
if kill -0 "$packaged_pid" 2>/dev/null; then
    kill "$packaged_pid" 2>/dev/null || true
    fail 'uninstall did not terminate canonical packaged process'
fi
kill -0 "$unrelated_pid" 2>/dev/null || fail 'uninstall signaled an unrelated process'
[[ -e "$YARR_TEST_UNINSTALL_API_MARKER" ]] || fail 'successful uninstall did not remove API registration'
mkdir -p "$uninstall_plugin/scripts"
cat > "$uninstall_plugin/scripts/uninstall-api-plugin.sh" <<'EOF'
#!/usr/bin/env bash
: > "$YARR_TEST_UNINSTALL_API_MARKER"
exit 0
EOF
chmod 755 "$uninstall_plugin/scripts/uninstall-api-plugin.sh"
ln -sf "$common" "$uninstall_plugin/scripts/yarr-common.sh"
rm -f "$YARR_TEST_UNINSTALL_API_MARKER" "$YARR_PID" "$YARR_PID_META" "$YARR_LOGGER_PID"
printf 'MALFORMED_LINE_WITHOUT_EQUALS\n' > "$YARR_ENV"
YARR_TEST_ROOT="$test_root" "$classic_uninstall"
[[ -e "$YARR_TEST_UNINSTALL_API_MARKER" ]] ||
    fail 'malformed stopped uninstall did not complete API removal'
kill -0 "$unrelated_pid" 2>/dev/null ||
    fail 'malformed stopped uninstall signaled an unrelated process'
kill "$unrelated_pid"
wait "$unrelated_pid" 2>/dev/null || true

write_config
sed -i 's/^TAILSCALE_SERVE=no$/TAILSCALE_SERVE=yes/' "$YARR_CFG"
sed -i 's/^TAILSCALE_HOSTNAME=$/TAILSCALE_HOSTNAME=yarr-contract/' "$YARR_CFG"
export YARR_TEST_CURL_STATUS=0
"$rc" start
service_pid=$(cat "$YARR_PID")
[[ -n "$service_pid" ]] || fail "start did not record a PID"
if tr '\0' '\n' < "/proc/$service_pid/cmdline" | grep -Eq 'contract-token|client-secret|API_KEY|PASSWORD'; then
    fail "runtime secret appeared in the Yarr daemon command line"
fi
"$rc" start
expect_eq "$service_pid" "$(cat "$YARR_PID")" "idempotent start"
grep -Fqx "serve --bg --service svc:yarr-contract --https $YARR_TEST_PORT --set-path / http://127.0.0.1:$YARR_TEST_PORT" "$YARR_TEST_TAILSCALE_LOG" || \
    fail "Tailscale setup was not scoped to the configured Yarr service"

yarr_load_config
yarr_validate_config
yarr_select_binary
yarr_write_runtime_env
[[ "$(stat -c '%a' "$YARR_RUNTIME_ENV")" == "600" ]] || fail "runtime environment is not mode 0600"
grep -Fqx "export YARR_MCP_HOST=127.0.0.1" "$YARR_RUNTIME_ENV" || fail "runtime host missing"
grep -Fqx "export YARR_MCP_TOKEN=contract-token" "$YARR_RUNTIME_ENV" || fail "runtime token was not shell-safely rendered"

"$rc" stop
cat >> "$YARR_ENV" <<'EOF'
YARR_MCP_GOOGLE_CLIENT_SECRET=oauth-cmdline-sentinel
SONARR_APIKEY=sonarr-cmdline-sentinel
QBIT_PASSWORD=qbit-cmdline-sentinel
EOF
"$rc" start
service_pid=$(cat "$YARR_PID")
if tr '\0' '\n' < "/proc/$service_pid/cmdline" | grep -Fq -- '-cmdline-sentinel'; then
    fail 'bearer, OAuth, or service credential leaked through daemon argv'
fi
"$rc" stop

cp "$YARR_PLUGIN_ROOT/bin/yarr" "$test_root/bin/port-occupier"
YARR_MCP_HOST=127.0.0.1 YARR_MCP_PORT="$YARR_TEST_PORT" "$test_root/bin/port-occupier" serve mcp &
occupier_pid=$!
sleep 0.1
expect_failure 'occupied port readiness accepted unrelated listener' "$rc" start
kill -0 "$occupier_pid" 2>/dev/null || fail 'failed startup signaled the unrelated port owner'
kill "$occupier_pid"
wait "$occupier_pid" 2>/dev/null || true

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
action=$1
printf '%s\n' "$action" >> "${YARR_TEST_HOOK_LOG}"
if [[ "$action" == status ]]; then
  exit 3
fi
exit "${YARR_TEST_HOOK_STATUS:-0}"
EOF
chmod 755 "$hook_rc"
export YARR_RC="$hook_rc"
export YARR_TEST_HOOK_LOG="$test_root/hooks.log"
export YARR_EVENT_RETRY_SECONDS=0
"$started"
"$stopping"
"$unmounting"
expect_eq $'start\nstop\nstatus\nstop\nstatus' "$(cat "$YARR_TEST_HOOK_LOG")" "hook delegation and quiescence"
export YARR_TEST_HOOK_STATUS=7
expect_failure "started hook failure propagation" "$started"
unset YARR_TEST_HOOK_STATUS
export YARR_RC="$rc"
exec 8>"$YARR_LOCK"
flock -n 8 || fail 'could not hold lock for event contention'
expect_failure "start hook lock contention" env YARR_EVENT_ATTEMPTS=2 YARR_EVENT_LOCK_WAIT_SECONDS=0 "$started"
expect_failure "stop hook lock contention" env YARR_EVENT_ATTEMPTS=2 YARR_EVENT_LOCK_WAIT_SECONDS=0 "$stopping"
exec 8>&-
unset YARR_RC

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
sed -i "s/^PORT=${YARR_TEST_PORT}$/PORT=invalid/" "$YARR_CFG"
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
