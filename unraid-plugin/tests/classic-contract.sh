#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
plugin_root="$repo_root/unraid-plugin"
source_root="$plugin_root/source"
classic="$plugin_root/yarr.plg"
page="$source_root/usr/local/emhttp/plugins/yarr/yarr.page"
default_cfg="$source_root/usr/local/emhttp/plugins/yarr/default.cfg"
default_env="$source_root/usr/local/emhttp/plugins/yarr/default.env"
classic_install="$source_root/usr/local/emhttp/plugins/yarr/scripts/install-classic-plugin.sh"
classic_uninstall="$source_root/usr/local/emhttp/plugins/yarr/scripts/uninstall-classic-plugin.sh"
api_install="$source_root/usr/local/emhttp/plugins/yarr/scripts/install-api-plugin.sh"
api_uninstall="$source_root/usr/local/emhttp/plugins/yarr/scripts/uninstall-api-plugin.sh"
build_script="$plugin_root/scripts/build-package.sh"
verify_script="$plugin_root/scripts/verify-package.sh"
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
    "$classic" "$page" "$default_cfg" "$default_env" \
    "$classic_install" "$classic_uninstall" "$api_install" "$api_uninstall" \
    "$build_script" "$verify_script"; do
    [[ -f "$required" ]] || fail "missing Task 10 artifact: ${required#"$repo_root/"}"
done

xmllint --noout "$classic"

mapfile -t urls < <(xmllint --noent --xpath '//FILE/URL/text()' "$classic" 2>/dev/null | sed '/^$/d')
[[ ${#urls[@]} -gt 0 ]] || fail 'classic plugin has no downloadable artifacts'
for url in "${urls[@]}"; do
    [[ "$url" == https://* ]] || fail "non-HTTPS download: $url"
done
grep -Fq 'sha256sum -c -' "$classic" || fail 'classic download lacks SHA-256 verification'
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
grep -Fq 'API uninstall failed; refusing to remove classic payload' "$remove_inline" || fail 'classic removal is not gated on API uninstall success'
if grep -Eq '(/boot/config/plugins/yarr|/mnt/user/appdata/yarr).*(rm|remove)|(rm|remove).*(/boot/config/plugins/yarr|/mnt/user/appdata/yarr)' "$remove_inline"; then
    fail 'classic uninstall removes persistent config or appdata'
fi

grep -Fq '<link rel="stylesheet" href="/plugins/yarr/web/yarr-settings.css">' "$page" || fail 'settings page CSS path is wrong'
grep -Fq '<yarr-settings-app></yarr-settings-app>' "$page" || fail 'settings custom element is not mounted'
grep -Fq '<script type="module" src="/plugins/yarr/web/yarr-settings.js"></script>' "$page" || fail 'settings page JS path is wrong'
if grep -Eqi '(\$_(POST|GET)|file_put_contents|fopen|credential|password|secret|token)' "$page"; then
    fail 'settings page contains config writing or credential handling'
fi

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
cat > "$installed_plugin/scripts/install-api-plugin.sh" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod 755 "$installed_plugin/scripts/"*.sh
printf 'sentinel-config\n' > "$classic_root/boot/config/plugins/yarr/yarr.cfg"
chmod 640 "$classic_root/boot/config/plugins/yarr/yarr.cfg"
YARR_TEST_ROOT="$classic_root" "$installed_plugin/scripts/install-classic-plugin.sh"
[[ $(cat "$classic_root/boot/config/plugins/yarr/yarr.cfg") == sentinel-config ]] || fail 'install overwrote existing yarr.cfg'
[[ $(stat -c %a "$classic_root/boot/config/plugins/yarr/yarr.cfg") == 640 ]] || fail 'install changed existing yarr.cfg mode'
[[ -f "$classic_root/boot/config/plugins/yarr/.env" ]] || fail 'install did not create missing .env'
[[ $(stat -c %a "$classic_root/boot/config/plugins/yarr/.env") == 600 ]] || fail 'created .env is not mode 0600'
printf 'sentinel-env\n' > "$classic_root/boot/config/plugins/yarr/.env"
YARR_TEST_ROOT="$classic_root" "$installed_plugin/scripts/install-classic-plugin.sh"
[[ $(cat "$classic_root/boot/config/plugins/yarr/.env") == sentinel-env ]] || fail 'upgrade overwrote existing .env'

# Rootless API fixture exercises loader registration, atomic symlink swaps,
# stale-log exclusion, rollback, and uninstall registration cleanup.
api_root="$tmp_dir/api-root"
payload="$api_root/usr/local/emhttp/plugins/yarr/api"
api_home="$api_root/usr/local/unraid-api"
api_nodes="$api_home/node_modules"
api_config="$api_root/boot/config/plugins/dynamix.my.servers/configs/api.json"
api_credentials="$api_root/boot/config/plugins/dynamix.my.servers/myservers.cfg"
api_log="$api_root/var/log/graphql-api.log"
mkdir -p "$payload/dist" "$api_nodes/.unraid-api-plugin-yarr/prior" \
    "$(dirname "$api_config")" "$(dirname "$api_log")" "$api_root/bin"
cat > "$payload/package.json" <<'EOF'
{"name":"unraid-api-plugin-yarr","version":"2.1.0","type":"commonjs","main":"dist/index.js","peerDependencies":{"@nestjs/common":"*"}}
EOF
printf '{"name":"unraid-api-plugin-yarr","version":"2.1.0","lockfileVersion":3,"packages":{"":{"name":"unraid-api-plugin-yarr","version":"2.1.0"}}}\n' > "$payload/package-lock.json"
cat > "$payload/dist/index.js" <<'EOF'
class YarrApiModule {}
module.exports = {
  adapter: "nestjs",
  ApiModule: YarrApiModule,
  graphqlSchemaExtension: "extend type Query { yarrRuntime: YarrRuntime! }",
};
EOF
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
)
env "${api_env[@]}" "$api_install"
active_target=$(readlink "$api_nodes/unraid-api-plugin-yarr")
[[ "$active_target" == "$api_nodes/.unraid-api-plugin-yarr/"* ]] || fail 'API target does not point at immutable activation store'
[[ -f "$active_target/dist/index.js" ]] || fail 'activated API package is incomplete'
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
cat > "$uninstall_root/etc/rc.d/rc.yarr" <<'EOF'
#!/usr/bin/env bash
printf 'rc %s\n' "$1" >> "$YARR_TEST_UNINSTALL_OPERATIONS"
EOF
cat > "$uninstall_plugin/scripts/uninstall-api-plugin.sh" <<'EOF'
#!/usr/bin/env bash
printf 'api uninstall\n' >> "$YARR_TEST_UNINSTALL_OPERATIONS"
EOF
chmod 755 "$uninstall_root/etc/rc.d/rc.yarr" "$uninstall_plugin/scripts/"*.sh
printf 'keep config\n' > "$uninstall_root/boot/config/plugins/yarr/yarr.cfg"
printf 'keep appdata\n' > "$uninstall_root/mnt/user/appdata/yarr/state"
touch "$uninstall_root/var/run/yarr.pid" "$uninstall_root/var/run/yarr.env" \
    "$uninstall_root/var/lock/yarr-plugin.lock" "$uninstall_root/var/log/yarr/yarr.log"
uninstall_ops="$tmp_dir/uninstall-operations.log"
YARR_TEST_ROOT="$uninstall_root" YARR_TEST_UNINSTALL_OPERATIONS="$uninstall_ops" \
    "$uninstall_plugin/scripts/uninstall-classic-plugin.sh"
[[ $(sed -n '1p' "$uninstall_ops") == 'rc stop' ]] || fail 'uninstall did not stop Yarr first'
[[ -f "$uninstall_root/boot/config/plugins/yarr/yarr.cfg" ]] || fail 'uninstall removed boot config'
[[ -f "$uninstall_root/mnt/user/appdata/yarr/state" ]] || fail 'uninstall removed appdata'
[[ ! -e "$uninstall_root/var/run/yarr.pid" && ! -e "$uninstall_root/var/run/yarr.env" ]] || fail 'uninstall retained volatile runtime files'

for executable in "$classic_install" "$classic_uninstall" "$api_install" "$api_uninstall" "$build_script" "$verify_script"; do
    [[ -x "$executable" ]] || fail "script is not executable: ${executable#"$repo_root/"}"
    bash -n "$executable"
done

grep -Fq '/usr/local/yarr/bin/yarr' "$build_script" || fail 'build does not stage the binary at the runtime path'
grep -Fq 'install -d -m 0755' "$build_script" || fail 'build does not fix packaged directory modes'
grep -Fq 'yarr-dashboard.js' "$build_script" || fail 'build does not stage the dashboard bundle'
grep -Fq 'yarr-settings.js' "$build_script" || fail 'build does not stage the settings bundle'
grep -Fq 'package-manifest.sha256' "$build_script" || fail 'build does not embed a SHA-256/mode inventory'
grep -Fq 'package-manifest.sha256' "$verify_script" || fail 'verifier does not enforce embedded inventory'
grep -Fq 'git ls-files' "$verify_script" || fail 'verifier does not enforce tracked source parity'
grep -Fq 'xmllint' "$verify_script" || fail 'verifier does not validate plugin XML'
grep -Fq 'packaged /usr/local/yarr directory mode is not 0755' "$verify_script" || fail 'verifier does not check /usr/local/yarr mode'
grep -Fq 'packaged /usr/local/yarr/bin directory mode is not 0755' "$verify_script" || fail 'verifier does not check /usr/local/yarr/bin mode'

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
