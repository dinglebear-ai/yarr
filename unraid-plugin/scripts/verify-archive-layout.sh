#!/usr/bin/env bash
set -euo pipefail

archive=${1:?usage: verify-archive-layout.sh ARCHIVE}
[[ -f "$archive" && ! -L "$archive" ]] || {
    printf 'archive layout: missing or unsafe archive: %s\n' "$archive" >&2
    exit 1
}

fail() {
    printf 'archive layout: %s\n' "$1" >&2
    exit 1
}

inventory=$(mktemp)
details=$(mktemp)
trap 'rm -f -- "$inventory" "$details"' EXIT
tar -tJf "$archive" > "$inventory"
tar --numeric-owner -tvJf "$archive" > "$details"
[[ -s "$inventory" ]] || fail 'archive is empty'

while IFS= read -r path; do
    canonical=${path%/}
    [[ -n "$canonical" && "$canonical" != . && "$canonical" != ./* && "$canonical" != /* && "$canonical" != *//* ]] ||
        fail "non-canonical archive path: $path"
    IFS='/' read -r -a components <<< "$canonical"
    for component in "${components[@]}"; do
        [[ -n "$component" && "$component" != . && "$component" != .. ]] ||
            fail "archive path escapes staging root: $path"
    done
done < "$inventory"

while read -r mode owner _size _date _time path; do
    [[ "$owner" == 0/0 ]] || fail "archive entry is not root:root: $path ($owner)"
    case "$mode" in
        -*) ;;
        d*)
            [[ "$mode" == drwxr-xr-x ]] ||
                fail "directory is not root:root mode 0755: $path ($mode $owner)"
            ;;
        *) fail "archive contains a link or special entry: $path ($mode)" ;;
    esac
done < "$details"

printf 'archive layout: PASS\n'
