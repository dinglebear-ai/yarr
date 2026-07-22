#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
package_root="$repo_root/unraid-plugin"
manifest="$package_root/release-manifest.json"
inventory="$package_root/tests/fixtures/required-package-paths.txt"
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

[[ -f "$manifest" ]] || fail "missing release manifest: $manifest"
[[ -f "$inventory" ]] || fail "missing package inventory: $inventory"

mapfile -t paths < "$inventory"
[[ ${#paths[@]} -gt 0 ]] || fail "package inventory is empty"

previous=''
declare -A seen=()
for path in "${paths[@]}"; do
    [[ -n "$path" ]] || fail "package inventory contains an empty line"
    [[ "$path" == unraid-plugin/* ]] || fail "inventory path is outside package root: $path"
    [[ "$path" != */../* && "$path" != ../* && "$path" != */./* ]] || fail "inventory path is not normalized: $path"
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

if "$reject_zero_sha" && jq -e '.packageSha256 == ("0" * 64)' "$manifest" >/dev/null; then
    fail "zero package checksum is not allowed for a packaged release"
fi

printf 'release contract: PASS (%d declared paths)\n' "${#paths[@]}"
