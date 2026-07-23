#!/usr/bin/env bash
set -euo pipefail

package_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
version=${1:?usage: build-package.sh PLUGIN_VERSION PACKAGE_BUILD}
build=${2:?usage: build-package.sh PLUGIN_VERSION PACKAGE_BUILD}
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { printf 'invalid plugin version: %s\n' "$version" >&2; exit 2; }
[[ "$build" =~ ^[1-9][0-9]*$ ]] || { printf 'invalid package build: %s\n' "$build" >&2; exit 2; }

manifest="$package_root/release-manifest.json"
plugin="$package_root/yarr.plg"
source_root="$package_root/source"
api_root="$package_root/api"
web_root="$package_root/web"
package_file="yarr-${version}-x86_64-${build}.txz"
package_url="https://github.com/dinglebear-ai/yarr/releases/download/unraid-v${version}-${build}/${package_file}"
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT

download="$temporary/download"
mkdir -p "$download"
archive_asset=yarr-x86_64.tar.gz
checksum_asset=yarr-x86_64.tar.gz.sha256
if [[ -n "${YARR_RELEASE_ASSET_DIR:-}" ]]; then
    cp -- "$YARR_RELEASE_ASSET_DIR/$archive_asset" "$download/$archive_asset"
    cp -- "$YARR_RELEASE_ASSET_DIR/$checksum_asset" "$download/$checksum_asset"
else
    release_state=$(gh release view "v${version}" -R dinglebear-ai/yarr --json tagName,isDraft,assets)
    [[ $(jq -r '.tagName' <<< "$release_state") == "v${version}" ]] || { printf 'release tag mismatch\n' >&2; exit 1; }
    [[ $(jq -r --arg archive "$archive_asset" --arg checksum "$checksum_asset" \
        '([.assets[].name] | sort) == ([$archive, $checksum] | sort)' <<< "$release_state") == true ]] || {
        printf 'release must contain exactly %s and %s\n' "$archive_asset" "$checksum_asset" >&2
        exit 1
    }
    gh release download "v${version}" -R dinglebear-ai/yarr \
        --pattern "$archive_asset" --pattern "$checksum_asset" --dir "$download"
fi

checksum_line=$(cat "$download/$checksum_asset")
[[ "$checksum_line" =~ ^[0-9a-f]{64}[[:space:]][[:space:]]yarr-x86_64\.tar\.gz$ ]] || {
    printf 'upstream checksum has an unexpected shape\n' >&2
    exit 1
}
(cd "$download" && sha256sum -c -- "$checksum_asset")
[[ $(tar -tzf "$download/$archive_asset") == yarr ]] || { printf 'upstream archive must contain exactly yarr\n' >&2; exit 1; }
read -r upstream_mode _ <<< "$(tar --numeric-owner -tvzf "$download/$archive_asset")"
[[ "$upstream_mode" == -rwxr-xr-x ]] || { printf 'upstream yarr is not a regular mode-0755 executable\n' >&2; exit 1; }
mkdir "$temporary/upstream"
tar --same-permissions -xzf "$download/$archive_asset" -C "$temporary/upstream"
[[ -f "$temporary/upstream/yarr" && ! -L "$temporary/upstream/yarr" && -x "$temporary/upstream/yarr" ]] || {
    printf 'upstream yarr is not a regular executable\n' >&2
    exit 1
}
[[ $("$temporary/upstream/yarr" --version) == "yarr ${version}" ]] || { printf 'upstream binary version mismatch\n' >&2; exit 1; }

(cd "$api_root" && npm run build)
(cd "$web_root" && npm run build)

candidate_source="$temporary/source"
cp -a -- "$source_root" "$candidate_source"
generated_root="$candidate_source/usr/local/emhttp/plugins/yarr"
rm -rf -- "$generated_root/api" "$generated_root/web"
mkdir -p "$generated_root/api/dist" "$generated_root/web"
cp -- "$api_root/package.json" "$api_root/package-lock.json" "$generated_root/api/"
find "$api_root/dist" -maxdepth 1 -type f -name '*.js' ! -name '*.spec.js' -exec cp -- '{}' "$generated_root/api/dist/" \;
[[ -f "$generated_root/api/dist/index.js" ]] || { printf 'API build did not produce dist/index.js\n' >&2; exit 1; }
(cd "$generated_root/api" && npm ci --omit=dev --ignore-scripts --legacy-peer-deps)
if [[ -d "$generated_root/api/node_modules" ]]; then
    find "$generated_root/api/node_modules" -name '.package-lock.json' -delete
    rmdir "$generated_root/api/node_modules" 2>/dev/null || true
fi

cp -- "$web_root/dist/settings/yarr-settings.js" "$web_root/dist/settings/yarr-settings.css" \
    "$web_root/dist/dashboard/yarr-dashboard.js" "$web_root/dist/dashboard/yarr-dashboard.css" \
    "$generated_root/web/"

find "$candidate_source" -type d -exec chmod 0755 '{}' +
find "$candidate_source" -type f -exec chmod 0644 '{}' +
find "$candidate_source/etc/rc.d" "$generated_root/event" -type f -exec chmod 0755 '{}' +
find "$generated_root/scripts" -maxdepth 1 -type f \
    \( -name 'install-*.sh' -o -name 'uninstall-*.sh' -o -name 'yarr-update.sh' \) \
    -exec chmod 0755 '{}' +
chmod 0600 "$generated_root/default.cfg" "$generated_root/default.env"
if find "$candidate_source" -type l -print -quit | grep -q .; then
    printf 'classic source contains a link\n' >&2
    exit 1
fi

stage="$temporary/root"
mkdir -p "$stage"
cp -a -- "$candidate_source/." "$stage/"
install -D -m 0755 -- "$temporary/upstream/yarr" "$stage/usr/local/yarr/bin/yarr"

embedded="$stage/usr/local/emhttp/plugins/yarr/package-manifest.sha256"
(
    cd "$stage"
    find . -type f ! -path './usr/local/emhttp/plugins/yarr/package-manifest.sha256' -print0 | sort -z | while IFS= read -r -d '' file; do
        relative=${file#./}
        printf '%s %s %s\n' "$(sha256sum "$file" | cut -d' ' -f1)" "$(stat -c %a "$file")" "$relative"
    done
) > "$embedded"
chmod 0644 "$embedded"

candidate_archive="$temporary/$package_file"
tar -C "$stage" --sort=name --mtime='@0' --owner=0 --group=0 --numeric-owner \
    --format=posix --pax-option=delete=atime,delete=ctime -cJf "$candidate_archive" etc usr
package_sha=$(sha256sum "$candidate_archive" | cut -d' ' -f1)
package_md5=$(md5sum "$candidate_archive" | cut -d' ' -f1)

candidate_manifest="$temporary/release-manifest.json"
jq --arg version "$version" --argjson build "$build" --arg file "$package_file" \
    --arg sha "$package_sha" --arg url "$package_url" '
      .pluginVersion = $version |
      .packageBuild = $build |
      .packageFile = $file |
      .packageSha256 = $sha |
      .packageUrl = $url |
      .apiVersion = $version
    ' "$manifest" > "$candidate_manifest"

candidate_plugin="$temporary/yarr.plg"
sed -E \
    -e "s|(<!ENTITY version[[:space:]]+\")[^\"]*|\\1${version}-${build}|" \
    -e "s|(<!ENTITY txz[[:space:]]+\")[^\"]*|\\1${package_file}|" \
    -e "s|(<!ENTITY txzURL[[:space:]]+\")[^\"]*|\\1${package_url}|" \
    -e "s|(<!ENTITY md5[[:space:]]+\")[^\"]*|\\1${package_md5}|" \
    -e "s|(<!ENTITY sha256[[:space:]]+\")[^\"]*|\\1${package_sha}|" \
    -e "s|^###.*|###${version}-${build}|" \
    "$plugin" > "$candidate_plugin"

YARR_VERIFY_ARCHIVE="$candidate_archive" \
YARR_VERIFY_MANIFEST="$candidate_manifest" \
YARR_VERIFY_PLUGIN="$candidate_plugin" \
YARR_VERIFY_SOURCE="$candidate_source" \
    "$package_root/scripts/verify-package.sh"

rm -rf -- "$source_root/usr/local/emhttp/plugins/yarr/api" "$source_root/usr/local/emhttp/plugins/yarr/web"
cp -a -- "$generated_root/api" "$source_root/usr/local/emhttp/plugins/yarr/api"
cp -a -- "$generated_root/web" "$source_root/usr/local/emhttp/plugins/yarr/web"
source_plugin_root="$source_root/usr/local/emhttp/plugins/yarr"
find "$source_root" -type d -exec chmod 0755 '{}' +
find "$source_root" -type f -exec chmod 0644 '{}' +
find "$source_root/etc/rc.d" "$source_plugin_root/event" -type f -exec chmod 0755 '{}' +
find "$source_plugin_root/scripts" -maxdepth 1 -type f \
    \( -name 'install-*.sh' -o -name 'uninstall-*.sh' -o -name 'yarr-update.sh' \) \
    -exec chmod 0755 '{}' +
chmod 0600 "$source_plugin_root/default.cfg" "$source_plugin_root/default.env"
mkdir -p "$package_root/packages"
install -m 0644 -- "$candidate_archive" "$package_root/packages/$package_file"
install -m 0644 -- "$candidate_manifest" "$package_root/.release-manifest.json.new"
install -m 0644 -- "$candidate_plugin" "$package_root/.yarr.plg.new"
mv -f -- "$package_root/.release-manifest.json.new" "$manifest"
mv -f -- "$package_root/.yarr.plg.new" "$plugin"

printf 'built %s\nsha256=%s\n' "$package_root/packages/$package_file" "$package_sha"
