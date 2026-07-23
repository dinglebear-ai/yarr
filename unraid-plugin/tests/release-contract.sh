#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
package_root="$repo_root/unraid-plugin"
manifest="$package_root/release-manifest.json"
inventory="$package_root/tests/fixtures/required-package-paths.txt"
ci_workflow="$repo_root/.github/workflows/unraid-plugin-ci.yml"
release_workflow="$repo_root/.github/workflows/unraid-plugin-release.yml"
plugin_readme="$package_root/README.md"
root_readme="$repo_root/README.md"
justfile="$repo_root/Justfile"
reject_zero_sha=false

legacy_owner=jmagar
legacy_repository=yarr
if git -C "$repo_root" grep -n "${legacy_owner}/${legacy_repository}" -- \
    ':!CHANGELOG.md' ':!docs/sessions/**' > /dev/null; then
    printf 'release contract: stale legacy publication identity remains outside migration history\n' >&2
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case "$1" in
        --manifest)
            manifest=$2
            shift 2
            ;;
        --inventory)
            inventory=$2
            shift 2
            ;;
        --ci-workflow)
            ci_workflow=$2
            shift 2
            ;;
        --release-workflow)
            release_workflow=$2
            shift 2
            ;;
        --plugin-readme)
            plugin_readme=$2
            shift 2
            ;;
        --root-readme)
            root_readme=$2
            shift 2
            ;;
        --justfile)
            justfile=$2
            shift 2
            ;;
        --reject-zero-sha)
            reject_zero_sha=true
            shift
            ;;
        *)
            printf 'release contract: unknown argument: %s\n' "$1" >&2
            exit 2
            ;;
    esac
done

fail() {
    printf 'release contract: %s\n' "$1" >&2
    exit 1
}

require_literal() {
    local file=$1
    local needle=$2
    local message=$3
    grep -Fq -- "$needle" "$file" || fail "$message"
}

require_regex() {
    local file=$1
    local pattern=$2
    local message=$3
    grep -Eq -- "$pattern" "$file" || fail "$message"
}

for required_file in \
    "$manifest" \
    "$inventory" \
    "$ci_workflow" \
    "$release_workflow" \
    "$plugin_readme" \
    "$root_readme" \
    "$justfile" \
    "$package_root/tests/workflow_contract.py" \
    "$package_root/scripts/github-release-provenance.sh" \
    "$package_root/scripts/publish-package-release.sh"; do
    [[ -f "$required_file" && ! -L "$required_file" ]] ||
        fail "missing or unsafe release input: $required_file"
done

mapfile -t paths < "$inventory"
[[ ${#paths[@]} -gt 0 ]] || fail "package inventory is empty"

previous=''
declare -A seen=()
for path in "${paths[@]}"; do
    [[ -n "$path" ]] || fail "package inventory contains an empty line"
    [[ "$path" != /* && "$path" != */ && "$path" != *//* ]] ||
        fail "inventory path is not canonical: $path"
    IFS='/' read -r -a components <<<"$path"
    canonical=''
    for component in "${components[@]}"; do
        [[ -n "$component" && "$component" != . && "$component" != .. ]] ||
            fail "inventory path is not canonical: $path"
        canonical+="${canonical:+/}$component"
    done
    [[ "$canonical" == "$path" ]] || fail "inventory path is not canonical: $path"
    [[ "$path" == unraid-plugin/* ]] || fail "inventory path is outside package root: $path"
    [[ -z "${seen[$path]+yes}" ]] || fail "duplicate inventory path: $path"
    seen[$path]=1
    [[ "$path" == unraid-plugin/yarr.plg ||
        "$path" == unraid-plugin/release-manifest.json ||
        "$path" == unraid-plugin/assets/* ||
        "$path" == unraid-plugin/source/* ||
        "$path" == unraid-plugin/api/* ||
        "$path" == unraid-plugin/web/* ]] ||
        fail "unrecognized runtime prefix: $path"
    absolute="$repo_root/$path"
    [[ "$absolute" == "$package_root"/* ]] || fail "inventory path escapes package root: $path"
    if [[ -n "$previous" && "$previous" > "$path" ]]; then
        fail "package inventory is not sorted"
    fi
    previous=$path
done

manifest_keys=$(jq -r 'keys_unsorted[]' "$manifest")
while IFS= read -r key; do
    case "$key" in
        schemaVersion|pluginVersion|packageBuild|packageFile|packageSha256|packageUrl|sourceRepository|packageRepository|binaryRepository|binaryAsset|upstreamBinarySha256|apiPackage|apiVersion|settingsElement|dashboardElement) ;;
        *) fail "unknown manifest key: $key" ;;
    esac
done < <(printf '%s\n' "$manifest_keys" | sed '/^$/d')

jq -e '
    .schemaVersion == 1 and
    (.pluginVersion | type == "string") and
    (.packageBuild | type == "number" and floor == .) and
    (.packageFile | type == "string" and test("^yarr-[0-9]+\\.[0-9]+\\.[0-9]+-x86_64-[0-9]+\\.txz$")) and
    (.packageSha256 | type == "string" and test("^[0-9a-f]{64}$")) and
    (.packageUrl | type == "string") and
    (.sourceRepository | type == "string") and
    (.packageRepository | type == "string") and
    (.binaryRepository | type == "string") and
    (.binaryAsset | type == "string") and
    (.upstreamBinarySha256 | type == "string" and test("^[0-9a-f]{64}$")) and
    (.apiPackage | type == "string") and
    (.apiVersion | type == "string") and
    (.settingsElement | type == "string") and
    (.dashboardElement | type == "string")
' "$manifest" >/dev/null || fail "manifest schema or value contract failed"

plugin_version=$(jq -r '.pluginVersion' "$manifest")
package_build=$(jq -r '.packageBuild' "$manifest")
expected_package_file="yarr-${plugin_version}-x86_64-${package_build}.txz"
actual_package_file=$(jq -r '.packageFile' "$manifest")
[[ "$actual_package_file" == "$expected_package_file" ]] ||
    fail "package filename does not match manifest identity: expected $expected_package_file, got $actual_package_file"
jq -e --arg version "$plugin_version" --arg file "$expected_package_file" \
    --arg tag "unraid-v${plugin_version}-${package_build}" '
      .apiVersion == $version and
      .sourceRepository == "dinglebear-ai/yarr" and
      .packageRepository == "dinglebear-ai/yarr" and
      .binaryRepository == "dinglebear-ai/yarr" and
      .binaryAsset == "yarr-x86_64.tar.gz" and
      (.upstreamBinarySha256 | test("^[0-9a-f]{64}$")) and
      .apiPackage == "unraid-api-plugin-yarr" and
      .settingsElement == "yarr-settings-app" and
      .dashboardElement == "yarr-dashboard" and
      .packageUrl ==
        ("https://github.com/dinglebear-ai/yarr/releases/download/" + $tag + "/" + $file)
    ' "$manifest" >/dev/null ||
    fail "manifest component or two-version release contract failed"

if "$reject_zero_sha" &&
    jq -e '.packageSha256 == ("0" * 64) or .upstreamBinarySha256 == ("0" * 64)' \
        "$manifest" >/dev/null; then
    fail "zero release checksum is not allowed for a packaged release"
fi

python3 "$package_root/tests/workflow_contract.py" \
    --ci "$ci_workflow" \
    --release "$release_workflow" ||
    fail "structured workflow contract failed"
require_literal "$package_root/scripts/publish-package-release.sh" \
    'target_commitish: $sha' \
    "release transaction does not carry resolved SHA as target commitish"
require_literal "$package_root/scripts/publish-package-release.sh" \
    'query_release_by_id "$owned_release_id"' \
    "release transaction cleanup is not anchored to release ID"
require_literal "$package_root/scripts/publish-package-release.sh" \
    'refusing cleanup of published release ID' \
    "release transaction can delete a published release"

[[ $(grep -c '^## ' "$plugin_readme") -ge 10 ]] ||
    fail "Unraid operator documentation is too shallow"
for heading in \
    '## Installation' \
    '## Network and authentication' \
    '## Credentials and service import' \
    '## Persistent and runtime paths' \
    '## Binary updater rollback and reset' \
    '## API and web loader behavior' \
    '## Troubleshooting and logs' \
    '## Uninstall' \
    '## Two-version release procedure' \
    '## Disposable-Unraid live release gate'; do
    require_literal "$plugin_readme" "$heading" \
        "Unraid operator documentation is missing $heading"
done
for required_text in \
    'Loopback is the default' \
    'authentication gate as LAN mode' \
    'same-host proxy is the only caller' \
    'Bearer and Google OAuth are the only approved network-exposed modes' \
    'Tailscale Serve' \
    'Credentials are server-side only' \
    'read-only `GET` list/inspect operations' \
    'explicit operator consent' \
    '/boot/config/plugins/yarr/yarr.cfg' \
    '/mnt/user/appdata/yarr/' \
    '/mnt/user/appdata/yarr/bin/yarr.previous' \
    'retains both persistent paths' \
    'content-addressed module' \
    '/var/log/yarr/yarr.log' \
    '/var/log/graphql-api.log' \
    'unraid-v2.1.0-1' \
    'independently committed upstream archive SHA-256' \
    'per-run marker' \
    'a published release is never deleted' \
    'It does not implicitly publish the existing `v2.1.0` draft' \
    'Do not run this privileged gate against a production Unraid host'; do
    require_literal "$plugin_readme" "$required_text" \
        "Unraid operator documentation omits required invariant: $required_text"
done
require_literal "$root_readme" '## Unraid Plugin' "root README has no Unraid entry point"
require_literal "$root_readme" 'unraid-plugin/README.md' \
    "root README does not link the Unraid guide"
require_regex "$justfile" '^unraid-test:' "Justfile lacks unraid-test"
require_regex "$justfile" '^unraid-build version="2\.1\.0" build="1":' \
    "Justfile lacks the deterministic Unraid build recipe"
require_regex "$justfile" '^unraid-release-check:' \
    "Justfile lacks the coordinated release check"

default_env="$package_root/source/usr/local/emhttp/plugins/yarr/default.env"
[[ -f "$default_env" ]] || fail "missing credential-safe default.env"
if grep -Ev '^[[:space:]]*(#.*)?$' "$default_env" | grep -q .; then
    fail "default.env contains a packaged credential value"
fi

printf 'release contract: PASS (%d declared paths)\n' "${#paths[@]}"
