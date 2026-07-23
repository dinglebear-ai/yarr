#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
plugin_root="$repo_root/unraid-plugin"
source_root="$plugin_root/source"
classic="$plugin_root/yarr.plg"
page="$source_root/usr/local/emhttp/plugins/yarr/Yarr.page"
dashboard_page="$source_root/usr/local/emhttp/plugins/yarr/YarrDashboard.page"
icon="$source_root/usr/local/emhttp/plugins/yarr/yarr.png"
icon_source="$plugin_root/assets/yarr.svg"
default_cfg="$source_root/usr/local/emhttp/plugins/yarr/default.cfg"
default_env="$source_root/usr/local/emhttp/plugins/yarr/default.env"
classic_install="$source_root/usr/local/emhttp/plugins/yarr/scripts/install-classic-plugin.sh"
classic_uninstall="$source_root/usr/local/emhttp/plugins/yarr/scripts/uninstall-classic-plugin.sh"
api_install="$source_root/usr/local/emhttp/plugins/yarr/scripts/install-api-plugin.sh"
api_uninstall="$source_root/usr/local/emhttp/plugins/yarr/scripts/uninstall-api-plugin.sh"
build_script="$plugin_root/scripts/build-package.sh"
verify_script="$plugin_root/scripts/verify-package.sh"
archive_layout_script="$plugin_root/scripts/verify-archive-layout.sh"
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

fail() {
    printf 'classic contract: %s\n' "$1" >&2
    exit 1
}

expect_failure_message() {
    local label=$1 expected=$2
    shift 2
    if "$@" >"$tmp_dir/failure.out" 2>"$tmp_dir/failure.err"; then
        fail "$label unexpectedly succeeded"
    fi
    if ! grep -Fq -- "$expected" "$tmp_dir/failure.err" && ! grep -Fq -- "$expected" "$tmp_dir/failure.out"; then
        printf '%s\n' "--- $label stdout ---" >&2
        cat "$tmp_dir/failure.out" >&2
        printf '%s\n' "--- $label stderr ---" >&2
        cat "$tmp_dir/failure.err" >&2
        fail "$label did not report expected diagnostic: $expected"
    fi
}

for required in \
    "$classic" "$page" "$dashboard_page" "$icon" "$icon_source" "$default_cfg" "$default_env" \
    "$classic_install" "$classic_uninstall" "$api_install" "$api_uninstall" \
    "$build_script" "$verify_script" "$archive_layout_script"; do
    [[ -f "$required" ]] || fail "missing Task 10 artifact: ${required#"$repo_root/"}"
done

xmllint --noout "$classic"

mapfile -t urls < <(xmllint --noent --xpath '//FILE/URL/text()' "$classic" 2>/dev/null | sed '/^$/d')
[[ ${#urls[@]} -gt 0 ]] || fail 'classic plugin has no downloadable artifacts'
for url in "${urls[@]}"; do
    [[ "$url" == https://* ]] || fail "non-HTTPS download: $url"
done
grep -Fq 'sha256sum -c -' "$classic" || fail 'classic download lacks SHA-256 verification'
grep -Fq '<!ENTITY launch     "Settings/Yarr">' "$classic" || fail 'classic launch route is not Settings/Yarr'
plugin_sha=$(sed -n 's/.*<!ENTITY sha256[[:space:]]*"\([0-9a-f]*\)".*/\1/p' "$classic")
[[ "$plugin_sha" =~ ^[0-9a-f]{64}$ ]] || fail 'classic SHA-256 entity is malformed'

install_inline="$tmp_dir/install-inline.sh"
remove_inline="$tmp_dir/remove-inline.sh"
xmllint --noent --xpath 'string(/PLUGIN/FILE[@Run="/bin/bash"][1]/INLINE)' "$classic" > "$install_inline"
xmllint --noent --xpath 'string(/PLUGIN/FILE[@Run="/bin/bash" and @Method="remove"]/INLINE)' "$classic" > "$remove_inline"
bash -n "$install_inline"
bash -n "$remove_inline"
grep -Fq 'upgradepkg --install-new --reinstall' "$install_inline" || fail 'classic install is not idempotent'
grep -Fq 'install-classic-plugin.sh' "$install_inline" || fail 'classic install does not delegate coordinated activation'
grep -Fq 'uninstall-classic-plugin.sh' "$remove_inline" || fail 'classic uninstall does not stop before package removal'
grep -Fq 'flock --exclusive --wait 30 9' "$install_inline" || fail 'classic package install does not hold the stable lifecycle lock'
grep -Fq '/etc/rc.d/rc.yarr --lock-fd 9 stop' "$install_inline" || fail 'classic upgrade does not stop the old daemon under lock'
grep -Fq 'flock --exclusive --wait 30 9' "$remove_inline" || fail 'classic package removal does not hold the stable lifecycle lock'
grep -Fq 'API uninstall failed; refusing to remove classic payload' "$remove_inline" || fail 'classic removal is not gated on API uninstall success'
if grep -Eq '(/boot/config/plugins/yarr|/mnt/user/appdata/yarr).*(rm|remove)|(rm|remove).*(/boot/config/plugins/yarr|/mnt/user/appdata/yarr)' "$remove_inline"; then
    fail 'classic uninstall removes persistent config or appdata'
fi

[[ ! -e "$source_root/usr/local/emhttp/plugins/yarr/yarr.page" ]] || fail 'lowercase settings page route still exists'
grep -Fq 'Menu="Utilities"' "$page" || fail 'settings page is not in Utilities'
grep -Fq 'Icon="yarr.png"' "$page" || fail 'settings page does not use the packaged Yarr icon'
grep -Fq 'Tag="plug"' "$page" || fail 'settings page tag drifted'
grep -Fq '/plugins/yarr/web/yarr-settings.css?v=' "$page" || fail 'settings page CSS is not cache-busted'
grep -Fq '<yarr-settings-app></yarr-settings-app>' "$page" || fail 'settings custom element is not mounted'
grep -Fq '/plugins/yarr/web/yarr-settings.js?v=' "$page" || fail 'settings page JS is not cache-busted'
grep -Fq "\$var['csrf_token']" "$page" || fail 'settings page does not use the host CSRF token'
grep -Fq '/usr/local/emhttp/state/var.ini' "$page" || fail 'settings page lacks the safe host CSRF fallback'
grep -Fq 'json_encode((string) $yarr_csrf' "$page" || fail 'settings page does not encode CSRF data for JavaScript'
if grep -Eqi '(\$_(POST|GET)|file_put_contents|fopen|/boot/config/plugins/yarr)' "$page"; then
    fail 'settings page contains a config-writing endpoint'
fi
grep -Fq 'Menu="Dashboard"' "$dashboard_page" || fail 'dashboard page is not in Dashboard'
grep -Fq 'Title="Yarr"' "$dashboard_page" || fail 'dashboard title drifted'
grep -Fq 'Icon="yarr.png"' "$dashboard_page" || fail 'dashboard page does not use the packaged Yarr icon'
grep -Fq 'Tag="plug"' "$dashboard_page" || fail 'dashboard tag drifted'
grep -Fq 'DASHBOARD_WIDGET_ENABLE' "$dashboard_page" || fail 'dashboard page has no config-backed condition'
grep -Fq '/boot/config/plugins/yarr/yarr.cfg' "$dashboard_page" || fail 'dashboard condition does not read persistent config'
grep -Fq '<yarr-dashboard></yarr-dashboard>' "$dashboard_page" || fail 'dashboard custom element is not mounted'
grep -Fq '/plugins/yarr/web/yarr-dashboard.css?v=' "$dashboard_page" || fail 'dashboard CSS is not cache-busted'
grep -Fq '/plugins/yarr/web/yarr-dashboard.js?v=' "$dashboard_page" || fail 'dashboard JS is not cache-busted'
if grep -Fq 'yarr-settings.' "$dashboard_page"; then
    fail 'dashboard page loads the full settings bundle'
fi

[[ $(stat -c %a "$icon") == 644 ]] || fail 'source yarr.png must be mode 0644'
icon_header=$(od -An -tx1 -N26 "$icon" | tr -d ' \n')
[[ "$icon_header" == 89504e470d0a1a0a0000000d4948445200000100000001000806 ]] ||
    fail 'source yarr.png must be a 256x256 8-bit RGBA PNG'
grep -Fq 'viewBox="0 0 256 256"' "$icon_source" || fail 'Yarr icon source has the wrong canvas'
grep -Fq '#29b6f6' "$icon_source" || fail 'Yarr icon source lacks the Aurora cyan motif'
grep -Fq '#f9a8c4' "$icon_source" || fail 'Yarr icon source lacks the rose signal accent'
grep -Fxq 'DASHBOARD_WIDGET_ENABLE=true' "$default_cfg" || fail 'dashboard widget does not default enabled'

[[ $(stat -c %a "$default_cfg") == 600 ]] || fail 'default.cfg must be mode 0600'
[[ $(stat -c %a "$default_env") == 600 ]] || fail 'default.env must be mode 0600'
if grep -Ev '^[[:space:]]*(#.*)?$' "$default_env" | grep -q .; then
    fail 'default.env packages a value instead of an empty commented template'
fi

# Rootless classic install preserves existing files and creates only missing
# defaults with restrictive modes.
classic_root="$tmp_dir/classic-root"
installed_plugin="$classic_root/usr/local/emhttp/plugins/yarr"
mkdir -p "$installed_plugin/scripts" "$classic_root/boot/config/plugins/yarr"
cp "$default_cfg" "$installed_plugin/default.cfg"
cp "$default_env" "$installed_plugin/default.env"
cp "$classic_install" "$installed_plugin/scripts/install-classic-plugin.sh"
ln -sf "$source_root/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh" "$installed_plugin/scripts/yarr-common.sh"
cat > "$installed_plugin/scripts/install-api-plugin.sh" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod 755 "$installed_plugin/scripts/install-classic-plugin.sh" \
    "$installed_plugin/scripts/install-api-plugin.sh"
printf 'sentinel-config\n' > "$classic_root/boot/config/plugins/yarr/yarr.cfg"
chmod 640 "$classic_root/boot/config/plugins/yarr/yarr.cfg"
YARR_TEST_ROOT="$classic_root" "$installed_plugin/scripts/install-classic-plugin.sh"
[[ $(cat "$classic_root/boot/config/plugins/yarr/yarr.cfg") == sentinel-config ]] || fail 'install overwrote existing yarr.cfg'
[[ $(stat -c %a "$classic_root/boot/config/plugins/yarr/yarr.cfg") == 600 ]] || fail 'install did not harden existing yarr.cfg mode'
[[ -f "$classic_root/boot/config/plugins/yarr/.env" ]] || fail 'install did not create missing .env'
[[ $(stat -c %a "$classic_root/boot/config/plugins/yarr/.env") == 600 ]] || fail 'created .env is not mode 0600'
printf 'sentinel-env\n' > "$classic_root/boot/config/plugins/yarr/.env"
YARR_TEST_ROOT="$classic_root" "$installed_plugin/scripts/install-classic-plugin.sh"
[[ $(cat "$classic_root/boot/config/plugins/yarr/.env") == sentinel-env ]] || fail 'upgrade overwrote existing .env'
cp "$classic_root/boot/config/plugins/yarr/yarr.cfg" "$classic_root/boot/config/plugins/yarr/yarr.cfg.transaction"
cp "$classic_root/boot/config/plugins/yarr/.env" "$classic_root/boot/config/plugins/yarr/.env.transaction"
printf 'version=1\nhad_previous_good=no\n' > "$classic_root/boot/config/plugins/yarr/yarr.cfg.transaction-state"
printf 'mixed-new-config\n' > "$classic_root/boot/config/plugins/yarr/yarr.cfg"
printf 'mixed-new-env\n' > "$classic_root/boot/config/plugins/yarr/.env"
YARR_TEST_ROOT="$classic_root" "$installed_plugin/scripts/install-classic-plugin.sh"
[[ $(cat "$classic_root/boot/config/plugins/yarr/yarr.cfg") == sentinel-config ]] || fail 'classic install did not recover interrupted config generation'
[[ $(cat "$classic_root/boot/config/plugins/yarr/.env") == sentinel-env ]] || fail 'classic install did not preserve interrupted transaction credentials'

# Rootless API fixture exercises loader registration, atomic symlink swaps,
# stale-log exclusion, rollback, and uninstall registration cleanup.
api_root="$tmp_dir/api-root"
payload="$api_root/usr/local/emhttp/plugins/yarr/api"
api_home="$api_root/usr/local/unraid-api"
api_nodes="$api_home/node_modules"
api_config="$api_root/boot/config/plugins/dynamix.my.servers/configs/api.json"
api_credentials="$api_root/boot/config/plugins/dynamix.my.servers/myservers.cfg"
api_log="$api_root/var/log/graphql-api.log"
mkdir -p "$payload" "$api_nodes/.unraid-api-plugin-yarr/prior" \
    "$(dirname "$api_config")" "$(dirname "$api_log")" "$api_root/bin"
packaged_api="$source_root/usr/local/emhttp/plugins/yarr/api"
cp -a "$packaged_api/." "$payload/"
diff -qr "$packaged_api" "$payload" >/dev/null || fail 'API activation fixture is not the exact staged packaged payload'
for dependency in "$plugin_root/api/node_modules"/*; do
    [[ -e "$dependency" ]] || continue
    ln -s "$dependency" "$api_nodes/$(basename "$dependency")"
done
printf 'prior\n' > "$api_nodes/.unraid-api-plugin-yarr/prior/marker"
ln -s "$api_nodes/.unraid-api-plugin-yarr/prior" "$api_nodes/unraid-api-plugin-yarr"
printf '{"name":"@unraid/api","peerDependencies":{"existing":"*"}}\n' > "$api_home/package.json"
printf '{"version":"test","plugins":["existing"]}\n' > "$api_config"
printf 'apikey="contract-api-key"\n' > "$api_credentials"
printf 'FATAL stale error that must be ignored\n' > "$api_log"

cat > "$api_root/bin/unraid-api" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf 'api %s\n' "$1" >> "$YARR_TEST_OPERATIONS"
case "$1" in
  stop)
    rm -f "$YARR_TEST_API_RUNNING"
    exit 0
    ;;
  start)
    count=0
    [[ ! -f "$YARR_TEST_START_COUNT_FILE" ]] || count=$(cat "$YARR_TEST_START_COUNT_FILE")
    count=$((count + 1))
    printf '%s\n' "$count" > "$YARR_TEST_START_COUNT_FILE"
    if [[ "${YARR_TEST_FAIL_START_AT:-0}" == "$count" || "${YARR_TEST_FAIL_ALL_STARTS:-no}" == yes ]]; then
      exit 1
    fi
    : > "$YARR_TEST_API_RUNNING"
    printf '%s\n' "${YARR_TEST_NEW_LOG:-YarrApiModule loaded}" >> "$YARR_TEST_API_LOG"
    ;;
  *) exit 2 ;;
esac
EOF
cat > "$api_root/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf 'curl\n' >> "$YARR_TEST_OPERATIONS"
tr '\0' ' ' < "/proc/$$/cmdline" >> "$YARR_TEST_CMDLINES"
printf '\n' >> "$YARR_TEST_CMDLINES"
if grep -Fq 'contract-api-key' "/proc/$$/cmdline"; then
  printf 'API key leaked through curl argv\n' >&2
  exit 91
fi
previous=''
for argument in "$@"; do
  if [[ "$previous" == --header && "$argument" == @* ]]; then
    header_file=${argument#@}
    [[ -f "$header_file" && ! -L "$header_file" ]] || exit 92
    [[ $(stat -c %a "$header_file") == 600 ]] || exit 93
    grep -Fqx 'x-api-key: contract-api-key' "$header_file" || exit 94
  fi
  previous=$argument
done
if [[ "${YARR_TEST_PROBE_FAIL:-no}" == yes ]]; then
  printf '%s\n' '{"errors":[{"message":"field missing"}]}'
else
  printf '%s\n' '{"data":{"yarrRuntime":{"__typename":"YarrRuntime"}}}'
fi
EOF
chmod 755 "$api_root/bin/unraid-api" "$api_root/bin/curl"
: > "$tmp_dir/api-operations.log"
: > "$tmp_dir/api-running"
: > "$tmp_dir/api-start-count"

cat > "$api_root/bin/mv" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
count=0
[[ ! -f "$YARR_TEST_MV_COUNT_FILE" ]] || count=$(cat "$YARR_TEST_MV_COUNT_FILE")
count=$((count + 1))
printf '%s\n' "$count" > "$YARR_TEST_MV_COUNT_FILE"
if [[ "${YARR_TEST_FAIL_MV_AT:-0}" == "$count" ]]; then
  printf 'injected mv failure at %s\n' "$count" >&2
  exit 71
fi
exec /bin/mv "$@"
EOF
chmod 755 "$api_root/bin/mv"
: > "$tmp_dir/api-mv-count"

api_env=(
    YARR_API_TEST_ROOT="$api_root"
    YARR_API_COMMAND="$api_root/bin/unraid-api"
    YARR_API_CURL="$api_root/bin/curl"
    YARR_API_NODE="$(command -v node)"
    YARR_API_ATTEMPTS=2
    YARR_API_INTERVAL=0
    YARR_TEST_OPERATIONS="$tmp_dir/api-operations.log"
    YARR_TEST_API_LOG="$api_log"
    YARR_TEST_API_RUNNING="$tmp_dir/api-running"
    YARR_TEST_START_COUNT_FILE="$tmp_dir/api-start-count"
    YARR_TEST_CMDLINES="$tmp_dir/api-cmdlines"
)
env "${api_env[@]}" "$api_install"
active_target=$(readlink "$api_nodes/unraid-api-plugin-yarr")
[[ "$active_target" == "$api_nodes/.unraid-api-plugin-yarr/"* ]] || fail 'API target does not point at immutable activation store'
[[ -f "$active_target/dist/index.js" ]] || fail 'activated API package is incomplete'
diff -qr "$payload" "$active_target" >/dev/null || fail 'activated API package differs from the exact staged payload'
if grep -Fq 'contract-api-key' "$tmp_dir/api-cmdlines"; then
    fail 'Unraid API key appeared in a probe process command line'
fi
jq -e '.peerDependencies["unraid-api-plugin-yarr"] == "*"' "$api_home/package.json" >/dev/null || fail 'API package registration missing'
jq -e '.plugins | index("unraid-api-plugin-yarr")' "$api_config" >/dev/null || fail 'API config registration missing'
if find "$api_nodes" -maxdepth 1 -name 'unraid-api-plugin-yarr.new.*' -print -quit | grep -q .; then
    fail 'temporary API activation symlink was retained'
fi
grep -Fqx 'api stop' "$tmp_dir/api-operations.log" || fail 'API activation did not stop the supported service'
grep -Fqx 'api start' "$tmp_dir/api-operations.log" || fail 'API activation did not start the supported service'

# A new fatal/load failure must roll back to the exact prior activation while
# an old fatal line before the recorded offset must not affect success.
prior_active=$active_target
set_payload_version() {
    local next=$1
    jq --arg version "$next" '.version = $version' "$payload/package.json" > "$payload/package.json.new"
    mv "$payload/package.json.new" "$payload/package.json"
    jq --arg version "$next" '.version = $version | .packages[""].version = $version' "$payload/package-lock.json" > "$payload/package-lock.json.new"
    mv "$payload/package-lock.json.new" "$payload/package-lock.json"
    printf '\nmodule.exports.build = "%s";\n' "$next" >> "$payload/dist/index.js"
}

set_payload_version 2.1.1
: > "$tmp_dir/api-start-count"
expect_failure_message 'fatal-log API activation' 'new fatal/module-load error in graphql-api.log' env "${api_env[@]}" \
    YARR_TEST_NEW_LOG='FATAL Plugin from unraid-api-plugin-yarr is invalid' \
    "$api_install"
[[ $(readlink "$api_nodes/unraid-api-plugin-yarr") == "$prior_active" ]] || fail 'failed activation did not restore prior API target'
jq -e '.peerDependencies["unraid-api-plugin-yarr"] == "*"' "$api_home/package.json" >/dev/null || fail 'rollback damaged prior package registration'
jq -e '.plugins | index("unraid-api-plugin-yarr")' "$api_config" >/dev/null || fail 'rollback damaged prior config registration'

set_payload_version 2.1.2
: > "$tmp_dir/api-start-count"
expect_failure_message 'probe API activation' 'yarrRuntime probe failed' env "${api_env[@]}" \
    YARR_TEST_NEW_LOG='YarrApiModule loaded' YARR_TEST_PROBE_FAIL=yes "$api_install"
[[ $(readlink "$api_nodes/unraid-api-plugin-yarr") == "$prior_active" ]] || fail 'probe failure did not restore prior API target'
[[ -f "$tmp_dir/api-running" ]] || fail 'probe rollback left unraid-api stopped'

set_payload_version 2.1.3
: > "$tmp_dir/api-start-count"
expect_failure_message 'rollback restart retry' 'failed to restart prior unraid-api (attempt 1 of 3)' env "${api_env[@]}" \
    YARR_TEST_NEW_LOG='YarrApiModule loaded' YARR_TEST_PROBE_FAIL=yes \
    YARR_TEST_FAIL_START_AT=2 "$api_install"
[[ $(readlink "$api_nodes/unraid-api-plugin-yarr") == "$prior_active" ]] || fail 'restart-retry rollback did not restore prior API target'
[[ -f "$tmp_dir/api-running" ]] || fail 'rollback restart retry left unraid-api stopped'

set_payload_version 2.1.4
: > "$tmp_dir/api-start-count"
expect_failure_message 'rollback restart exhaustion' 'rollback could not restart prior unraid-api' env "${api_env[@]}" \
    YARR_TEST_FAIL_ALL_STARTS=yes "$api_install"
[[ $(readlink "$api_nodes/unraid-api-plugin-yarr") == "$prior_active" ]] || fail 'restart-exhaustion rollback did not restore prior API target'
jq -e '.peerDependencies["unraid-api-plugin-yarr"] == "*"' "$api_home/package.json" >/dev/null || fail 'restart-exhaustion rollback damaged package registration'
jq -e '.plugins | index("unraid-api-plugin-yarr")' "$api_config" >/dev/null || fail 'restart-exhaustion rollback damaged config registration'
[[ ! -e "$tmp_dir/api-running" ]] || fail 'restart-exhaustion contract did not inject a stopped API'
: > "$tmp_dir/api-start-count"
env "${api_env[@]}" "$api_root/bin/unraid-api" start
[[ -f "$tmp_dir/api-running" ]] || fail 'test recovery could not restart unraid-api after restart exhaustion'

uninstall_env=("${api_env[@]}" YARR_API_MV="$api_root/bin/mv" YARR_TEST_MV_COUNT_FILE="$tmp_dir/api-mv-count")
: > "$tmp_dir/api-mv-count"
: > "$tmp_dir/api-start-count"
expect_failure_message 'mid-uninstall recovery' 'API uninstall failed; restoring prior activation' env "${uninstall_env[@]}" \
    YARR_TEST_FAIL_MV_AT=4 YARR_TEST_FAIL_START_AT=1 "$api_uninstall"
[[ $(readlink "$api_nodes/unraid-api-plugin-yarr") == "$prior_active" ]] || fail 'mid-uninstall failure did not restore prior API target'
[[ -f "$tmp_dir/api-running" ]] || fail 'mid-uninstall recovery left unraid-api stopped'
jq -e '.peerDependencies["unraid-api-plugin-yarr"] == "*"' "$api_home/package.json" >/dev/null || fail 'mid-uninstall recovery damaged package registration'
jq -e '.plugins | index("unraid-api-plugin-yarr")' "$api_config" >/dev/null || fail 'mid-uninstall recovery damaged config registration'

: > "$tmp_dir/api-mv-count"
: > "$tmp_dir/api-start-count"
env "${uninstall_env[@]}" "$api_uninstall"
[[ ! -e "$api_nodes/unraid-api-plugin-yarr" && ! -L "$api_nodes/unraid-api-plugin-yarr" ]] || fail 'API uninstall retained active target'
[[ ! -e "$api_nodes/.unraid-api-plugin-yarr" ]] || fail 'API uninstall retained activation store'
jq -e '.peerDependencies.existing == "*" and (.peerDependencies["unraid-api-plugin-yarr"] == null)' "$api_home/package.json" >/dev/null || fail 'API uninstall damaged package registration'
jq -e '.plugins == ["existing"]' "$api_config" >/dev/null || fail 'API uninstall damaged config registration'

# Classic uninstall must stop first, remove volatile state, and retain boot
# config plus appdata. Package paths are removed by removepkg in yarr.plg.
uninstall_root="$tmp_dir/uninstall-root"
uninstall_plugin="$uninstall_root/usr/local/emhttp/plugins/yarr"
mkdir -p "$uninstall_plugin/scripts" "$uninstall_root/etc/rc.d" \
    "$uninstall_root/boot/config/plugins/yarr" "$uninstall_root/mnt/user/appdata/yarr" \
    "$uninstall_root/var/run" "$uninstall_root/var/lock" "$uninstall_root/var/log/yarr"
cp "$classic_uninstall" "$uninstall_plugin/scripts/uninstall-classic-plugin.sh"
ln -sf "$source_root/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh" "$uninstall_plugin/scripts/yarr-common.sh"
cat > "$uninstall_root/etc/rc.d/rc.yarr" <<'EOF'
#!/usr/bin/env bash
set -u
lock_fd=''
if [[ "${1:-}" == --lock-fd ]]; then
  lock_fd=$2
  shift 2
fi
action=${1:-}
printf 'rc %s\n' "$action" >> "$YARR_TEST_UNINSTALL_OPERATIONS"
case "$action" in
  stop) exit 0 ;;
  status) exit 3 ;;
  start)
    [[ "${YARR_ARRAY_MOUNTED_REQUEST:-no}" == yes && -n "$lock_fd" ]] || exit 2
    # shellcheck source=/usr/local/emhttp/plugins/yarr/scripts/yarr-common.sh
    source "$YARR_PLUGIN_ROOT/scripts/yarr-common.sh" || exit 1
    yarr_with_inherited_lock "$lock_fd" yarr_clear_array_stopping
    ;;
  *) exit 2 ;;
esac
EOF
cat > "$uninstall_plugin/scripts/uninstall-api-plugin.sh" <<'EOF'
#!/usr/bin/env bash
printf 'api uninstall\n' >> "$YARR_TEST_UNINSTALL_OPERATIONS"
EOF
chmod 755 "$uninstall_root/etc/rc.d/rc.yarr" \
    "$uninstall_plugin/scripts/uninstall-classic-plugin.sh" \
    "$uninstall_plugin/scripts/uninstall-api-plugin.sh"
printf 'keep config\n' > "$uninstall_root/boot/config/plugins/yarr/yarr.cfg"
printf 'keep appdata\n' > "$uninstall_root/mnt/user/appdata/yarr/state"
touch "$uninstall_root/var/run/yarr.pid" "$uninstall_root/var/run/yarr.env" \
    "$uninstall_root/var/lock/yarr-plugin.lock" "$uninstall_root/var/log/yarr/yarr.log"
printf 'array-stopping\n' > "$uninstall_root/var/run/yarr-array-stopping"
chmod 0600 "$uninstall_root/var/run/yarr-array-stopping"
uninstall_ops="$tmp_dir/uninstall-operations.log"
YARR_TEST_ROOT="$uninstall_root" YARR_TEST_UNINSTALL_OPERATIONS="$uninstall_ops" \
    "$uninstall_plugin/scripts/uninstall-classic-plugin.sh"
[[ $(sed -n '1p' "$uninstall_ops") == 'rc stop' ]] || fail 'uninstall did not stop Yarr first'
[[ -f "$uninstall_root/boot/config/plugins/yarr/yarr.cfg" ]] || fail 'uninstall removed boot config'
[[ -f "$uninstall_root/mnt/user/appdata/yarr/state" ]] || fail 'uninstall removed appdata'
[[ ! -e "$uninstall_root/var/run/yarr.pid" && ! -e "$uninstall_root/var/run/yarr.env" ]] || fail 'uninstall retained volatile runtime files'
[[ -e "$uninstall_root/var/lock/yarr-plugin.lock" ]] || fail 'uninstall unlinked the stable lock inode'
[[ -f "$uninstall_root/var/run/yarr-array-stopping" ]] || fail 'uninstall removed the fail-closed array fence'

# A same-boot reinstall must retain the fence while the array is unmounted, then
# clear it through the real lock-aware mounted transition before autostart.
cp "$classic_install" "$uninstall_plugin/scripts/install-classic-plugin.sh"
cp "$default_cfg" "$uninstall_plugin/default.cfg"
cp "$default_env" "$uninstall_plugin/default.env"
cat > "$uninstall_plugin/scripts/install-api-plugin.sh" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod 755 "$uninstall_plugin/scripts/install-classic-plugin.sh" \
    "$uninstall_plugin/scripts/install-api-plugin.sh"
printf 'ENABLED=yes\n' > "$uninstall_root/boot/config/plugins/yarr/yarr.cfg"
reinstall_bin="$tmp_dir/reinstall-bin"
mkdir -p "$reinstall_bin"
cat > "$reinstall_bin/mountpoint" <<'EOF'
#!/usr/bin/env bash
[[ "${1:-}" == -q && "${2:-}" == "${YARR_TEST_MOUNTPOINT:-}" ]]
EOF
chmod 755 "$reinstall_bin/mountpoint"
PATH="$reinstall_bin:$PATH" YARR_TEST_ROOT="$uninstall_root" \
    YARR_TEST_MOUNTPOINT="$uninstall_root/not-mounted" \
    YARR_TEST_UNINSTALL_OPERATIONS="$uninstall_ops" \
    "$uninstall_plugin/scripts/install-classic-plugin.sh"
[[ -f "$uninstall_root/var/run/yarr-array-stopping" ]] || fail 'unmounted reinstall cleared the array fence'
PATH="$reinstall_bin:$PATH" YARR_TEST_ROOT="$uninstall_root" \
    YARR_TEST_MOUNTPOINT="$uninstall_root/mnt/user" \
    YARR_TEST_UNINSTALL_OPERATIONS="$uninstall_ops" \
    "$uninstall_plugin/scripts/install-classic-plugin.sh"
[[ ! -e "$uninstall_root/var/run/yarr-array-stopping" ]] || fail 'mounted reinstall retained the stale array fence'
grep -Fxq 'rc start' "$uninstall_ops" || fail 'mounted reinstall did not enter the mounted start transition'

for executable in "$classic_install" "$classic_uninstall" "$api_install" "$api_uninstall" "$build_script" "$verify_script" "$archive_layout_script"; do
    [[ -x "$executable" ]] || fail "script is not executable: ${executable#"$repo_root/"}"
    bash -n "$executable"
done

grep -Fq '/usr/local/yarr/bin/yarr' "$build_script" || fail 'build does not stage the binary at the runtime path'
grep -Fq 'install -d -m 0755' "$build_script" || fail 'build does not fix packaged directory modes'
grep -Fq 'yarr-dashboard.js' "$build_script" || fail 'build does not stage the dashboard bundle'
grep -Fq 'yarr-settings.js' "$build_script" || fail 'build does not stage the settings bundle'
grep -Fq 'yarr.png' "$build_script" || fail 'build does not validate and stage the shared Yarr icon'
grep -Fq 'package-manifest.sha256' "$build_script" || fail 'build does not embed a SHA-256/mode inventory'
grep -Fq 'package-manifest.sha256' "$verify_script" || fail 'verifier does not enforce embedded inventory'
grep -Fq 'git ls-files' "$verify_script" || fail 'verifier does not enforce tracked source parity'
grep -Fq 'xmllint' "$verify_script" || fail 'verifier does not validate plugin XML'
grep -Fq 'packaged /usr/local/yarr directory mode is not 0755' "$verify_script" || fail 'verifier does not check /usr/local/yarr mode'
grep -Fq 'packaged /usr/local/yarr/bin directory mode is not 0755' "$verify_script" || fail 'verifier does not check /usr/local/yarr/bin mode'
grep -Fq 'verify-archive-layout.sh' "$verify_script" || fail 'package verifier does not enforce canonical directory layout'
grep -Fq 'directory is not root:root mode 0755' "$archive_layout_script" || fail 'archive layout verifier does not reject writable directories'

layout_root="$tmp_dir/layout-root"
mkdir -p "$layout_root/etc" "$layout_root/usr"
chmod 0755 "$layout_root" "$layout_root/etc" "$layout_root/usr"
tar -C "$layout_root" --owner=0 --group=0 --numeric-owner -cJf "$tmp_dir/layout-safe.txz" etc usr
"$archive_layout_script" "$tmp_dir/layout-safe.txz" >/dev/null
chmod 0777 "$layout_root/usr"
tar -C "$layout_root" --owner=0 --group=0 --numeric-owner -cJf "$tmp_dir/layout-writable.txz" etc usr
expect_failure_message 'group/world-writable archive directory' 'directory is not root:root mode 0755' \
    "$archive_layout_script" "$tmp_dir/layout-writable.txz"
chmod 0755 "$layout_root/usr"
tar -C "$layout_root" --owner=0 --group=0 --numeric-owner -cJf "$tmp_dir/layout-dot-root.txz" .
expect_failure_message 'archive dot root member' 'non-canonical archive path: ./' \
    "$archive_layout_script" "$tmp_dir/layout-dot-root.txz"

# A traversal-shaped upstream release archive must be rejected before builds
# or release metadata swaps. This is intentionally stopped at archive intake.
bad_assets="$tmp_dir/bad-assets"
bad_payload="$tmp_dir/bad-payload"
mkdir -p "$bad_assets" "$bad_payload"
printf '#!/usr/bin/env bash\nprintf "yarr 2.1.0\\n"\n' > "$bad_payload/yarr"
chmod 0755 "$bad_payload/yarr"
tar -C "$bad_payload" --transform='s|^yarr$|../yarr|' -czf "$bad_assets/yarr-x86_64.tar.gz" yarr
(cd "$bad_assets" && sha256sum -- yarr-x86_64.tar.gz > yarr-x86_64.tar.gz.sha256)
metadata_before=$(sha256sum "$plugin_root/release-manifest.json" "$classic")
expect_failure_message 'upstream archive traversal' 'upstream archive must contain exactly yarr' env YARR_RELEASE_ASSET_DIR="$bad_assets" \
    "$build_script" 2.1.0 1
metadata_after=$(sha256sum "$plugin_root/release-manifest.json" "$classic")
[[ "$metadata_after" == "$metadata_before" ]] || fail 'failed build changed tracked release metadata'

printf 'classic contract: PASS\n'
