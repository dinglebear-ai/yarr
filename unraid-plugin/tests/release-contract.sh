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

check_immutable_actions() {
    local workflow=$1
    local label=$2
    mapfile -t actions < <(sed -nE 's/^[[:space:]]*uses:[[:space:]]*([^ #]+).*/\1/p' "$workflow")
    [[ ${#actions[@]} -ge 2 ]] || fail "$label workflow has no meaningful action set"
    local action
    for action in "${actions[@]}"; do
        [[ "$action" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+@[0-9a-f]{40}$ ]] ||
            fail "$label workflow action is not pinned to an immutable SHA: $action"
    done
}

[[ -f "$manifest" ]] || fail "missing release manifest: $manifest"
[[ -f "$inventory" ]] || fail "missing package inventory: $inventory"
[[ -f "$ci_workflow" ]] || fail "missing Unraid CI workflow: $ci_workflow"
[[ -f "$release_workflow" ]] || fail "missing Unraid release workflow: $release_workflow"
[[ -f "$plugin_readme" ]] || fail "missing Unraid operator documentation: $plugin_readme"
[[ -f "$root_readme" ]] || fail "missing root README: $root_readme"
[[ -f "$justfile" ]] || fail "missing Justfile: $justfile"

mapfile -t paths < "$inventory"
[[ ${#paths[@]} -gt 0 ]] || fail "package inventory is empty"

previous=''
declare -A seen=()
for path in "${paths[@]}"; do
    [[ -n "$path" ]] || fail "package inventory contains an empty line"
    [[ "$path" != /* && "$path" != */ && "$path" != *//* ]] || fail "inventory path is not canonical: $path"
    IFS='/' read -r -a components <<< "$path"
    canonical=''
    for component in "${components[@]}"; do
        [[ -n "$component" && "$component" != . && "$component" != .. ]] || fail "inventory path is not canonical: $path"
        canonical+="${canonical:+/}$component"
    done
    [[ "$canonical" == "$path" ]] || fail "inventory path is not canonical: $path"
    [[ "$path" == unraid-plugin/* ]] || fail "inventory path is outside package root: $path"
    [[ -z "${seen[$path]+yes}" ]] || fail "duplicate inventory path: $path"
    seen[$path]=1
    [[ "$path" == unraid-plugin/yarr.plg || "$path" == unraid-plugin/release-manifest.json || "$path" == unraid-plugin/source/* || "$path" == unraid-plugin/api/* || "$path" == unraid-plugin/web/* ]] || fail "unrecognized runtime prefix: $path"
    absolute="$repo_root/$path"
    [[ "$absolute" == "$package_root"/* ]] || fail "inventory path escapes package root: $path"
    if [[ -n "$previous" && "$previous" > "$path" ]]; then
        fail "package inventory is not sorted"
    fi
    previous="$path"
done

manifest_keys=$(jq -r 'keys_unsorted[]' "$manifest")
while IFS= read -r key; do
    case "$key" in
        schemaVersion|pluginVersion|packageBuild|packageFile|packageSha256|packageUrl|binaryRepository|binaryAsset|apiPackage|apiVersion|settingsElement|dashboardElement) ;;
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
    (.binaryRepository | type == "string") and
    (.binaryAsset | type == "string") and
    (.apiPackage | type == "string") and
    (.apiVersion | type == "string") and
    (.settingsElement | type == "string") and
    (.dashboardElement | type == "string")
' "$manifest" >/dev/null || fail "manifest schema or value contract failed"

plugin_version=$(jq -r '.pluginVersion' "$manifest")
package_build=$(jq -r '.packageBuild' "$manifest")
expected_package_file="yarr-${plugin_version}-x86_64-${package_build}.txz"
actual_package_file=$(jq -r '.packageFile' "$manifest")
[[ "$actual_package_file" == "$expected_package_file" ]] || fail "package filename does not match manifest identity: expected $expected_package_file, got $actual_package_file"
jq -e --arg version "$plugin_version" --arg file "$expected_package_file" \
    --arg tag "unraid-v${plugin_version}-${package_build}" '
      .apiVersion == $version and
      .binaryRepository == "dinglebear-ai/yarr" and
      .binaryAsset == "yarr-x86_64.tar.gz" and
      .apiPackage == "unraid-api-plugin-yarr" and
      .settingsElement == "yarr-settings-app" and
      .dashboardElement == "yarr-dashboard" and
      .packageUrl ==
        ("https://github.com/dinglebear-ai/yarr/releases/download/" + $tag + "/" + $file)
    ' "$manifest" >/dev/null || fail "manifest component or two-version release contract failed"

if "$reject_zero_sha" && jq -e '.packageSha256 == ("0" * 64)' "$manifest" >/dev/null; then
    fail "zero package checksum is not allowed for a packaged release"
fi

check_immutable_actions "$ci_workflow" "CI"
check_immutable_actions "$release_workflow" "release"

require_regex "$ci_workflow" '^permissions:$' "CI workflow lacks top-level permissions"
require_literal "$ci_workflow" "  contents: read" "CI workflow lacks read-only contents permission"
if grep -Eq 'contents:[[:space:]]*write|packages:[[:space:]]*write|id-token:[[:space:]]*write' "$ci_workflow"; then
    fail "CI workflow grants write permissions"
fi
require_literal "$ci_workflow" '"unraid-plugin/**"' "CI workflow is not scoped to plugin paths"
require_literal "$ci_workflow" '".github/workflows/unraid-plugin-ci.yml"' "CI workflow does not watch itself"
require_literal "$ci_workflow" '".github/workflows/unraid-plugin-release.yml"' "CI workflow does not watch release automation"
require_literal "$ci_workflow" 'cd unraid-plugin/api && npm ci && npm test && npx tsc --noEmit && npx tsc' \
    "CI workflow omits the complete API gate"
require_literal "$ci_workflow" 'cd unraid-plugin/web && npm ci && npm test && npx vue-tsc --noEmit && npm run build' \
    "CI workflow omits the complete web gate"
require_literal "$ci_workflow" 'yarr-settings.js' "CI workflow does not assert the settings bundle"
require_literal "$ci_workflow" 'yarr-dashboard.js' "CI workflow does not assert the dashboard bundle"
require_literal "$ci_workflow" 'bash unraid-plugin/tests/run.sh' "CI workflow omits classic/static contracts"
require_literal "$ci_workflow" 'shellcheck -S error' "CI workflow omits ShellCheck"
require_literal "$ci_workflow" "bash unraid-plugin/scripts/build-package.sh ${plugin_version} ${package_build}" \
    "CI workflow build identity differs from release manifest"
require_literal "$ci_workflow" 'bash unraid-plugin/scripts/verify-package.sh' \
    "CI workflow omits package verification"
require_literal "$ci_workflow" 'umask 022' "CI workflow omits the first deterministic umask"
require_literal "$ci_workflow" 'umask 077' "CI workflow omits the second deterministic umask"
require_literal "$ci_workflow" 'cmp -- .ci/repro/umask-022.txz' \
    "CI workflow does not compare deterministic package output"
require_literal "$ci_workflow" 'default.env contains a credential value' \
    "CI workflow omits the packaged-secret check"
require_literal "$ci_workflow" 'package-manifest.sha256' \
    "CI workflow omits embedded inventory verification"
require_literal "$ci_workflow" '[[ "$path" != /* && "$path" != *".."* && "$path" != *"//"* ]]' \
    "CI workflow omits explicit package path checks"
require_literal "$ci_workflow" 'sha256sum --check SHA256SUMS' \
    "CI workflow does not verify its staged artifact checksums"
require_literal "$ci_workflow" 'actions/upload-artifact@' \
    "CI workflow does not retain the checksummed package artifact"

require_regex "$release_workflow" '^permissions:$' "release workflow lacks top-level permissions"
require_literal "$release_workflow" "  contents: read" "release workflow lacks read-only default permission"
[[ $(grep -Ec '^[[:space:]]+contents:[[:space:]]+write$' "$release_workflow") -eq 1 ]] ||
    fail "release workflow must grant contents write exactly once"
require_literal "$release_workflow" '"unraid-v*"' \
    "release workflow does not trigger on unraid-v* tags"
require_literal "$release_workflow" 'workflow_dispatch:' \
    "release workflow lacks a manual trigger"
require_literal "$release_workflow" \
    '^unraid-v([0-9]+\.[0-9]+\.[0-9]+)-([1-9][0-9]*)$' \
    "release workflow lacks the strict package-tag parser"
require_literal "$release_workflow" 'cd unraid-plugin/api && npm ci && npm test && npx tsc --noEmit && npx tsc' \
    "release workflow omits the complete API gate"
require_literal "$release_workflow" 'cd unraid-plugin/web && npm ci && npm test && npx vue-tsc --noEmit && npm run build' \
    "release workflow omits the complete web gate"
require_literal "$release_workflow" 'bash unraid-plugin/tests/run.sh' \
    "release workflow omits classic/static contracts"
require_literal "$release_workflow" 'bash unraid-plugin/scripts/verify-package.sh' \
    "release workflow omits package verification"
require_literal "$release_workflow" 'umask 022' "release workflow omits the first deterministic umask"
require_literal "$release_workflow" 'umask 077' "release workflow omits the second deterministic umask"
require_literal "$release_workflow" 'cmp -- .release/repro/umask-022.txz' \
    "release workflow does not compare deterministic package output"
require_literal "$release_workflow" 'yarr ${PLUGIN_VERSION}' \
    "release workflow does not verify the embedded Yarr version"
require_literal "$release_workflow" 'package-manifest.sha256' \
    "release workflow omits the embedded payload inventory"
require_literal "$release_workflow" 'release-inventory.json' \
    "release workflow omits the machine-readable inventory"
require_literal "$release_workflow" 'for checksum in *.sha256' \
    "release workflow does not reverify every artifact checksum"
require_literal "$release_workflow" 'actions/upload-artifact@' \
    "release workflow does not stage an immutable candidate"
require_literal "$release_workflow" 'actions/download-artifact@' \
    "release workflow does not consume the immutable candidate"
require_literal "$release_workflow" 'UPSTREAM_TAG="v${PLUGIN_VERSION}"' \
    "release workflow does not isolate the upstream binary tag"
require_literal "$release_workflow" 'gh release view "$UPSTREAM_TAG"' \
    "release workflow does not snapshot the upstream binary release"
require_literal "$release_workflow" 'gh release create "$PACKAGE_TAG"' \
    "release workflow does not create the package release"
require_literal "$release_workflow" '--draft --verify-tag' \
    "release workflow does not stage a verified draft"
require_literal "$release_workflow" 'trap cleanup_draft ERR INT TERM' \
    "release workflow has no partial-draft cleanup"
require_literal "$release_workflow" 'gh release upload "$PACKAGE_TAG"' \
    "release workflow does not upload to the package tag"
require_literal "$release_workflow" 'gh release edit "$PACKAGE_TAG"' \
    "release workflow does not publish the verified package tag"
require_literal "$release_workflow" '--draft=false --latest=false' \
    "release workflow can publish before verification or replace binary latest"
if grep -Eq 'gh release (create|delete|edit|upload) "\$UPSTREAM_TAG"|gh release (create|delete|edit|upload) "v\$\{PLUGIN_VERSION\}"' "$release_workflow"; then
    fail "release workflow can mutate the upstream binary release"
fi

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
    require_literal "$plugin_readme" "$heading" "Unraid operator documentation is missing $heading"
done
for required_text in \
    'Loopback is the default' \
    'authentication gate as LAN mode' \
    'Tailscale Serve' \
    'Credentials are server-side only' \
    'read-only `GET` list/inspect operations' \
    'explicit operator consent' \
    '/boot/config/plugins/yarr/yarr.cfg' \
    '/mnt/user/appdata/yarr/' \
    '/mnt/user/appdata/yarr/bin/yarr.previous' \
    'retains both persistent paths' \
    'content-addressed module' \
    '/var/log/yarr.log' \
    '/var/log/graphql-api.log' \
    'unraid-v2.1.0-1' \
    'It does not implicitly publish the existing `v2.1.0` draft' \
    'Do not run this privileged gate against a production Unraid host'; do
    require_literal "$plugin_readme" "$required_text" \
        "Unraid operator documentation omits required invariant: $required_text"
done
require_literal "$root_readme" '## Unraid Plugin' "root README has no Unraid entry point"
require_literal "$root_readme" 'unraid-plugin/README.md' "root README does not link the Unraid guide"
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
