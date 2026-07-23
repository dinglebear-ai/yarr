#!/usr/bin/env bash
set -euo pipefail

package_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
repo_root=$(cd "$package_root/.." && pwd)
manifest=${YARR_VERIFY_MANIFEST:-$package_root/release-manifest.json}
plugin=${YARR_VERIFY_PLUGIN:-$package_root/yarr.plg}
source_root=${YARR_VERIFY_SOURCE:-$package_root/source}
package_file=$(jq -er '.packageFile' "$manifest")
archive=${YARR_VERIFY_ARCHIVE:-$package_root/packages/$package_file}
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT

fail() {
    printf 'package verification: %s\n' "$1" >&2
    exit 1
}

[[ -f "$archive" ]] || fail "missing archive: $archive"
"$package_root/scripts/verify-archive-layout.sh" "$archive"
bash "$package_root/tests/release-contract.sh" --manifest "$manifest" --reject-zero-sha
xmllint --noout "$plugin"

expected_sha=$(jq -er '.packageSha256' "$manifest")
actual_sha=$(sha256sum "$archive" | cut -d' ' -f1)
[[ "$actual_sha" == "$expected_sha" ]] || fail 'archive SHA-256 differs from release manifest'
plugin_sha=$(sed -n 's/.*<!ENTITY sha256[[:space:]]*"\([0-9a-f]*\)".*/\1/p' "$plugin")
plugin_md5=$(sed -n 's/.*<!ENTITY md5[[:space:]]*"\([0-9a-f]*\)".*/\1/p' "$plugin")
[[ "$plugin_sha" == "$actual_sha" ]] || fail 'classic plugin SHA-256 differs from archive'
[[ "$plugin_md5" == "$(md5sum "$archive" | cut -d' ' -f1)" ]] || fail 'classic plugin legacy MD5 differs from archive'

archive_list="$temporary/archive.list"
tar -tJf "$archive" > "$archive_list"
[[ -s "$archive_list" ]] || fail 'archive is empty'
previous=''
declare -A seen=()
while IFS= read -r path; do
    canonical=${path%/}
    [[ -n "$canonical" && "$canonical" != /* && "$canonical" != ./* && "$canonical" != *//* ]] || fail "non-canonical archive path: $path"
    IFS='/' read -r -a components <<< "$canonical"
    for component in "${components[@]}"; do
        [[ -n "$component" && "$component" != . && "$component" != .. ]] || fail "archive path escapes staging root: $path"
    done
    [[ -z "${seen[$canonical]+yes}" ]] || fail "duplicate archive path: $path"
    seen[$canonical]=1
    if [[ -n "$previous" && "$previous" > "$path" ]]; then
        fail 'archive inventory is not sorted'
    fi
    previous=$path
done < "$archive_list"

bad_type=$(tar --numeric-owner -tvJf "$archive" | awk 'substr($1,1,1) != "-" && substr($1,1,1) != "d" { print $NF; exit }')
[[ -z "$bad_type" ]] || fail "archive contains a link or special entry: $bad_type"
bad_owner=$(tar --numeric-owner -tvJf "$archive" | awk '$2 != "0/0" { print $2; exit }')
[[ -z "$bad_owner" ]] || fail "archive contains non-root ownership: $bad_owner"

mkdir -p "$temporary/root"
tar --same-permissions -xJf "$archive" -C "$temporary/root"
embedded="$temporary/root/usr/local/emhttp/plugins/yarr/package-manifest.sha256"
[[ -f "$embedded" ]] || fail 'missing embedded package-manifest.sha256'

embedded_paths="$temporary/embedded.paths"
: > "$embedded_paths"
while IFS=' ' read -r sha mode path extra; do
    [[ -z "${extra:-}" && "$sha" =~ ^[0-9a-f]{64}$ && "$mode" =~ ^[0-7]{3,4}$ ]] || fail 'malformed embedded inventory line'
    [[ -n "$path" && "$path" != /* && "$path" != *'..'* ]] || fail "unsafe embedded path: $path"
    file="$temporary/root/$path"
    [[ -f "$file" && ! -L "$file" ]] || fail "embedded inventory entry is not a regular file: $path"
    [[ $(sha256sum "$file" | cut -d' ' -f1) == "$sha" ]] || fail "embedded checksum mismatch: $path"
    [[ $(stat -c %a "$file") == "$mode" ]] || fail "embedded mode mismatch: $path"
    printf '%s\n' "$path" >> "$embedded_paths"
done < "$embedded"
sort -c "$embedded_paths" || fail 'embedded inventory is not sorted'

actual_files="$temporary/actual.paths"
(
    cd "$temporary/root"
    find . -type f ! -path './usr/local/emhttp/plugins/yarr/package-manifest.sha256' -printf '%P\n' | sort
) > "$actual_files"
cmp -s "$embedded_paths" "$actual_files" || fail 'embedded inventory does not exactly match archive files'

for required in \
    etc/rc.d/rc.yarr \
    usr/local/yarr/bin/yarr \
    usr/local/emhttp/plugins/yarr/default.cfg \
    usr/local/emhttp/plugins/yarr/default.env \
    usr/local/emhttp/plugins/yarr/Yarr.page \
    usr/local/emhttp/plugins/yarr/YarrDashboard.page \
    usr/local/emhttp/plugins/yarr/yarr-2b068b08366b.png \
    usr/local/emhttp/plugins/yarr/scripts/install-api-plugin.sh \
    usr/local/emhttp/plugins/yarr/scripts/uninstall-api-plugin.sh \
    usr/local/emhttp/plugins/yarr/api/package.json \
    usr/local/emhttp/plugins/yarr/api/package-lock.json \
    usr/local/emhttp/plugins/yarr/api/dist/index.js \
    usr/local/emhttp/plugins/yarr/web/yarr-settings.js \
    usr/local/emhttp/plugins/yarr/web/yarr-settings.css \
    usr/local/emhttp/plugins/yarr/web/yarr-dashboard.js \
    usr/local/emhttp/plugins/yarr/web/yarr-dashboard.css \
    usr/local/emhttp/plugins/yarr/package-manifest.sha256; do
    [[ -f "$temporary/root/$required" ]] || fail "archive missing required path: $required"
done

if find "$temporary/root/usr/local/emhttp/plugins/yarr/api/dist" -type f -name '*.spec.js' -print -quit | grep -q .; then
    fail 'API staging contains test output'
fi
if find "$temporary/root/usr/local/emhttp/plugins/yarr/api/node_modules" -type f \
    \( -path '*/typescript/*' -o -path '*/vitest/*' -o -path '*/@types/*' \) -print -quit 2>/dev/null | grep -q .; then
    fail 'API staging contains development dependencies'
fi

plugin_version=$(jq -er '.pluginVersion' "$manifest")
[[ $("$temporary/root/usr/local/yarr/bin/yarr" --version) == "yarr ${plugin_version}" ]] || fail 'packaged binary version differs from manifest'
[[ $(stat -c %a "$temporary/root/usr/local/yarr/bin/yarr") == 755 ]] || fail 'packaged binary mode is not 0755'
[[ $(stat -c %a "$temporary/root/usr/local/yarr") == 755 ]] || fail 'packaged /usr/local/yarr directory mode is not 0755'
[[ $(stat -c %a "$temporary/root/usr/local/yarr/bin") == 755 ]] || fail 'packaged /usr/local/yarr/bin directory mode is not 0755'
[[ $(stat -c %a "$temporary/root/usr/local/emhttp/plugins/yarr/default.cfg") == 600 ]] || fail 'packaged default.cfg mode is not 0600'
[[ $(stat -c %a "$temporary/root/usr/local/emhttp/plugins/yarr/default.env") == 600 ]] || fail 'packaged default.env mode is not 0600'
icon="$temporary/root/usr/local/emhttp/plugins/yarr/yarr-2b068b08366b.png"
[[ $(stat -c %a "$icon") == 644 ]] || fail 'packaged immutable Yarr icon mode is not 0644'
icon_sha=$(sha256sum "$icon" | awk '{print $1}')
[[ "${icon_sha:0:12}" == 2b068b08366b ]] || fail 'packaged icon filename does not match its SHA-256 prefix'
icon_header=$(od -An -tx1 -N26 "$icon" | tr -d ' \n')
[[ "$icon_header" == 89504e470d0a1a0a0000000d4948445200000100000001000806 ]] ||
    fail 'packaged immutable Yarr icon must be a 256x256 8-bit RGBA PNG'
[[ ! -e "$temporary/root/usr/local/emhttp/plugins/yarr/yarr.png" ]] ||
    fail 'package retains the stale mutable Yarr icon path'

api_name=$(jq -er '.apiPackage' "$manifest")
api_version=$(jq -er '.apiVersion' "$manifest")
[[ $(jq -er '.name' "$temporary/root/usr/local/emhttp/plugins/yarr/api/package.json") == "$api_name" ]] || fail 'staged API package identity differs from release manifest'
[[ $(jq -er '.version' "$temporary/root/usr/local/emhttp/plugins/yarr/api/package.json") == "$api_version" ]] || fail 'staged API version differs from release manifest'
settings_element=$(jq -er '.settingsElement' "$manifest")
dashboard_element=$(jq -er '.dashboardElement' "$manifest")
grep -Fq "<${settings_element}></${settings_element}>" "$temporary/root/usr/local/emhttp/plugins/yarr/Yarr.page" || fail 'settings element differs from release manifest'
[[ "$dashboard_element" == yarr-dashboard ]] || fail 'dashboard element differs from release manifest'

# Every physical source file must have exact archive byte and mode parity.
while IFS= read -r -d '' source_file; do
    relative=${source_file#"$source_root/"}
    packaged="$temporary/root/$relative"
    [[ -f "$packaged" ]] || fail "source shrinkage: $relative is absent from archive"
    cmp -s "$source_file" "$packaged" || fail "source/archive byte drift: $relative"
    [[ $(stat -c %a "$source_file") == "$(stat -c %a "$packaged")" ]] || fail "source/archive mode drift: $relative"
done < <(find "$source_root" -type f -print0 | sort -z)

# Tracked classic source may not disappear from a generated candidate root.
while IFS= read -r tracked; do
    relative=${tracked#unraid-plugin/source/}
    [[ -f "$source_root/$relative" ]] || fail "tracked source shrinkage: $relative"
done < <(cd "$repo_root" && git ls-files 'unraid-plugin/source/**')

printf 'package verification: PASS (%s, %s files)\n' "$actual_sha" "$(wc -l < "$actual_files")"
