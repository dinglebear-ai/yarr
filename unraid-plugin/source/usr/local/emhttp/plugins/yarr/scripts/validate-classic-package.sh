#!/usr/bin/env bash
set -euo pipefail

archive=${1:?usage: validate-classic-package.sh PACKAGE.txz}
[[ $# -eq 1 ]] || { printf 'classic package validation: expected one archive\n' >&2; exit 2; }
trusted_uid=${YARR_PACKAGE_TRUST_UID:-0}
trusted_gid=${YARR_PACKAGE_TRUST_GID:-0}

fail() {
    printf 'classic package validation: %s\n' "$1" >&2
    exit 1
}

basename=${archive##*/}
[[ ${#basename} -le 128 &&
    "$basename" =~ ^yarr-(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)-x86_64-([1-9][0-9]*)\.txz$ ]] ||
    fail 'archive basename is not canonical'
[[ -f "$archive" && ! -L "$archive" ]] || fail 'archive is not a regular file'
[[ $(stat -c '%u:%g:%a:%h' "$archive") == "${trusted_uid}:${trusted_gid}:600:1" ]] ||
    fail 'archive ownership, mode, or link count is unsafe'

temporary=$(mktemp -d)
trap 'rm -rf -- "$temporary"' EXIT
inventory="$temporary/archive.list"
details="$temporary/archive.details"
if ! tar -tJf "$archive" > "$inventory" ||
    ! tar --numeric-owner -tvJf "$archive" > "$details"; then
    fail 'archive cannot be parsed as xz tar'
fi
[[ -s "$inventory" ]] || fail 'archive is empty'

previous=''
declare -A seen=()
while IFS= read -r path; do
    canonical=${path%/}
    [[ -n "$canonical" && "$canonical" != . && "$canonical" != ./* &&
        "$canonical" != /* && "$canonical" != *//* ]] ||
        fail "non-canonical archive path: $path"
    [[ ! "$canonical" =~ [[:space:]] ]] || fail "archive path contains whitespace: $path"
    IFS='/' read -r -a components <<< "$canonical"
    for component in "${components[@]}"; do
        [[ -n "$component" && "$component" != . && "$component" != .. ]] ||
            fail "archive path escapes staging root: $path"
    done
    [[ -z "${seen[$canonical]+present}" ]] || fail "duplicate archive path: $path"
    seen[$canonical]=1
    if [[ -n "$previous" && "$previous" > "$path" ]]; then
        fail 'archive inventory is not sorted'
    fi
    previous=$path
done < "$inventory"

while read -r mode owner _size _date _time path extra; do
    [[ -z "${extra:-}" ]] || fail "archive path contains whitespace: $path"
    [[ "$owner" == 0/0 ]] || fail "archive entry is not root:root: $path"
    case "$mode" in
        drwxr-xr-x|-rw-------|-rw-r--r--|-rwxr-xr-x) ;;
        d*) fail "archive directory mode is unsafe: $path ($mode)" ;;
        -*) fail "archive file mode is unsafe: $path ($mode)" ;;
        *) fail "archive contains a link or special entry: $path ($mode)" ;;
    esac
done < "$details"

root="$temporary/root"
mkdir -m 0700 "$root"
umask 022
tar --no-same-owner -xJf "$archive" -C "$root"
embedded="$root/usr/local/emhttp/plugins/yarr/package-manifest.sha256"
[[ -f "$embedded" && ! -L "$embedded" ]] || fail 'embedded package manifest is missing'

embedded_paths="$temporary/embedded.paths"
: > "$embedded_paths"
while IFS=' ' read -r sha mode path extra; do
    [[ -z "${extra:-}" && "$sha" =~ ^[0-9a-f]{64}$ &&
        "$mode" =~ ^(600|644|755)$ ]] ||
        fail 'embedded package manifest line is malformed'
    [[ -n "$path" && "$path" != /* && "$path" != ./* &&
        "$path" != *//* ]] ||
        fail "embedded package path is unsafe: $path"
    [[ ! "$path" =~ [[:space:]] ]] || fail "embedded package path contains whitespace: $path"
    IFS='/' read -r -a components <<< "$path"
    for component in "${components[@]}"; do
        [[ -n "$component" && "$component" != . && "$component" != .. ]] ||
            fail "embedded package path escapes staging root: $path"
    done
    file="$root/$path"
    [[ -f "$file" && ! -L "$file" ]] || fail "embedded entry is not a regular file: $path"
    [[ $(sha256sum "$file" | cut -d' ' -f1) == "$sha" ]] ||
        fail "embedded checksum mismatch: $path"
    [[ $(stat -c %a "$file") == "$mode" ]] ||
        fail "embedded mode mismatch: $path"
    printf '%s\n' "$path" >> "$embedded_paths"
done < "$embedded"
sort -c "$embedded_paths" >/dev/null || fail 'embedded package inventory is not sorted'
[[ $(sort -u "$embedded_paths" | wc -l) == "$(wc -l < "$embedded_paths")" ]] ||
    fail 'embedded package inventory contains duplicates'

actual_paths="$temporary/actual.paths"
(
    cd "$root"
    find . -type f ! -path './usr/local/emhttp/plugins/yarr/package-manifest.sha256' \
        -printf '%P\n' | sort
) > "$actual_paths"
cmp -s "$embedded_paths" "$actual_paths" ||
    fail 'embedded package inventory does not match archive files'

for required in \
    etc/rc.d/rc.yarr \
    usr/local/yarr/bin/yarr \
    usr/local/emhttp/plugins/yarr/default.cfg \
    usr/local/emhttp/plugins/yarr/default.env \
    usr/local/emhttp/plugins/yarr/Yarr.page \
    usr/local/emhttp/plugins/yarr/YarrDashboard.page \
    usr/local/emhttp/plugins/yarr/yarr-2b068b08366b.png \
    usr/local/emhttp/plugins/yarr/scripts/api-readiness.sh \
    usr/local/emhttp/plugins/yarr/scripts/install-api-plugin.sh \
    usr/local/emhttp/plugins/yarr/scripts/install-classic-plugin.sh \
    usr/local/emhttp/plugins/yarr/scripts/uninstall-api-plugin.sh \
    usr/local/emhttp/plugins/yarr/scripts/uninstall-classic-plugin.sh \
    usr/local/emhttp/plugins/yarr/scripts/validate-classic-package.sh \
    usr/local/emhttp/plugins/yarr/api/package.json \
    usr/local/emhttp/plugins/yarr/api/package-lock.json \
    usr/local/emhttp/plugins/yarr/api/dist/index.js \
    usr/local/emhttp/plugins/yarr/web/yarr-settings.js \
    usr/local/emhttp/plugins/yarr/web/yarr-settings.css \
    usr/local/emhttp/plugins/yarr/web/yarr-dashboard.js \
    usr/local/emhttp/plugins/yarr/web/yarr-dashboard.css; do
    [[ -f "$root/$required" && ! -L "$root/$required" ]] ||
        fail "archive is missing required payload: $required"
done

printf 'classic package validation: PASS\n'
