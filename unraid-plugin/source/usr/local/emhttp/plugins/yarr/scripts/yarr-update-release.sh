#!/bin/bash
# shellcheck shell=bash
# Release discovery, download, checksum, and archive validation helpers.

yarr_update_version_from_binary() {
    local output
    output=$("$1" --version 2>/dev/null) || return 1
    if [[ "$output" =~ ^yarr[[:space:]]+((0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))$ ]]; then
        printf '%s\n' "${BASH_REMATCH[1]}"
        return 0
    fi
    yarr_update_error "could not parse Yarr version from $1"
    return 1
}

yarr_update_valid_version() {
    [[ "$1" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]
}

yarr_update_major() {
    printf '%s\n' "${1%%.*}"
}

yarr_update_version_gt() {
    local left=$1 right=$2 lmajor lminor lpatch rmajor rminor rpatch
    IFS=. read -r lmajor lminor lpatch <<< "$left"
    IFS=. read -r rmajor rminor rpatch <<< "$right"
    ((10#$lmajor > 10#$rmajor)) && return 0
    ((10#$lmajor < 10#$rmajor)) && return 1
    ((10#$lminor > 10#$rminor)) && return 0
    ((10#$lminor < 10#$rminor)) && return 1
    ((10#$lpatch > 10#$rpatch))
}

yarr_update_fetch_bounded() {
    local destination=$1 url=$2 max_bytes=$3 total_timeout=$4 size status
    "$YARR_RM_BIN" -f -- "$destination" || return 1
    if "$YARR_CURL_BIN" \
        --fail --location --silent --show-error \
        --connect-timeout "$YARR_UPDATE_CONNECT_TIMEOUT" \
        --max-time "$total_timeout" \
        --retry "$YARR_UPDATE_RETRIES" \
        --retry-delay "$YARR_UPDATE_RETRY_DELAY" \
        --retry-connrefused \
        --retry-all-errors \
        --max-filesize "$max_bytes" \
        --output "$destination" \
        "$url"; then
        status=0
    else
        status=$?
    fi
    if (( status != 0 )); then
        "$YARR_RM_BIN" -f -- "$destination" || true
        return "$status"
    fi
    size=$(stat -c '%s' "$destination") || {
        "$YARR_RM_BIN" -f -- "$destination" || true
        return 1
    }
    if (( size > max_bytes )); then
        yarr_update_error "response exceeded the ${max_bytes}-byte limit"
        "$YARR_RM_BIN" -f -- "$destination" || true
        return 1
    fi
}

yarr_update_fetch_releases() {
    local destination=$1
    yarr_update_fetch_bounded \
        "$destination" "$YARR_UPDATE_API_URL" \
        "$YARR_UPDATE_METADATA_MAX_BYTES" "$YARR_UPDATE_METADATA_TIMEOUT" || return 1
    jq -e 'type == "array"' "$destination" >/dev/null
}

yarr_update_release_present() {
    local releases=$1 version=$2
    local tag="v${version}"
    yarr_update_valid_version "$version" || return 1
    jq -e --arg tag "$tag" --arg archive "$YARR_UPDATE_ASSET" --arg checksum "$YARR_UPDATE_CHECKSUM_ASSET" '
        [.[] | select(.tag_name == $tag)] as $matches |
        ($matches | length == 1) and
        ($matches[0].draft == false) and
        ($matches[0].prerelease == false) and
        ($matches[0].assets | type == "array") and
        ([ $matches[0].assets[] | select(.name == $archive) ] | length == 1) and
        ([ $matches[0].assets[] | select(.name == $checksum) ] | length == 1)
    ' "$releases" >/dev/null
}

yarr_update_release_eligible() {
    local releases=$1 version=$2 installed=$3 supported=$4
    [[ "$(yarr_update_major "$installed")" == "$(yarr_update_major "$supported")" ]] || return 1
    [[ "$(yarr_update_major "$version")" == "$(yarr_update_major "$supported")" ]] || return 1
    yarr_update_version_gt "$installed" "$version" && return 1
    yarr_update_release_present "$releases" "$version"
}

yarr_update_select_available() {
    local releases=$1 installed=$2 supported=$3 channel=$4 tag draft prerelease version suffix selected=''
    while IFS=$'\t' read -r tag draft prerelease; do
        [[ "$tag" =~ ^v((0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))(-.+)?$ ]] || continue
        version=${BASH_REMATCH[1]}
        suffix=${BASH_REMATCH[5]}
        [[ "$draft" == false ]] || continue
        [[ "$channel" == stable && "$prerelease" == false && -z "$suffix" ]] || continue
        yarr_update_release_eligible "$releases" "$version" "$installed" "$supported" || continue
        if [[ -z "$selected" ]] || yarr_update_version_gt "$version" "$selected"; then
            selected=$version
        fi
    done < <(jq -r '.[] | [(.tag_name // ""), (.draft // false), (.prerelease // false)] | @tsv' "$releases")
    [[ -n "$selected" ]] || return 1
    printf '%s\n' "$selected"
}

yarr_update_download_url() {
    local version=$1 asset=$2
    printf '%s/v%s/%s\n' "${YARR_UPDATE_DOWNLOAD_ROOT%/}" "$version" "$asset"
}

yarr_update_parse_checksum() {
    local checksum_file=$1 line digest filename
    mapfile -t checksum_lines < "$checksum_file"
    [[ ${#checksum_lines[@]} == 1 ]] || return 1
    line=${checksum_lines[0]}
    [[ "$line" =~ ^([0-9A-Fa-f]{64})[[:space:]]+\*?([^[:space:]]+)$ ]] || return 1
    digest=${BASH_REMATCH[1],,}
    filename=${BASH_REMATCH[2]}
    [[ "$filename" == "$YARR_UPDATE_ASSET" ]] || return 1
    printf '%s\n' "$digest"
}

yarr_update_verify_checksum() {
    local archive=$1 checksum=$2 expected actual
    expected=$(yarr_update_parse_checksum "$checksum") || return 1
    actual=$(sha256sum "$archive" | awk '{print tolower($1)}')
    [[ "$actual" == "$expected" ]]
}

yarr_update_validate_archive() {
    local archive=$1 extract_dir=$2 payload entry_type
    mapfile -t archive_entries < <("$YARR_TAR_BIN" -tzf "$archive")
    [[ ${#archive_entries[@]} == 1 && "${archive_entries[0]}" == yarr ]] || return 1
    entry_type=$("$YARR_TAR_BIN" -tvzf "$archive" | awk 'NR == 1 { print substr($1, 1, 1) }')
    [[ "$entry_type" == '-' ]] || return 1
    mkdir -p "$extract_dir" || return 1
    "$YARR_TAR_BIN" -xzf "$archive" -C "$extract_dir" --no-same-owner --no-same-permissions || return 1
    payload="$extract_dir/yarr"
    [[ -f "$payload" && ! -L "$payload" && -x "$payload" ]]
}
