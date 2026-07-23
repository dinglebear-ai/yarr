#!/usr/bin/env bash
set -euo pipefail

fail() {
    printf 'release provenance: %s\n' "$1" >&2
    exit 1
}

require_token() {
    [[ -n "${GH_TOKEN:-}" ]] || fail 'GH_TOKEN is required for this step'
}

resolve_tag() {
    local repository=$1
    local tag=$2
    local object type sha depth=0

    [[ "$repository" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] ||
        fail "invalid repository: $repository"
    [[ "$tag" =~ ^(unraid-)?v[0-9]+\.[0-9]+\.[0-9]+(-[1-9][0-9]*)?$ ]] ||
        fail "invalid tag: $tag"

    object=$(gh api "repos/${repository}/git/ref/tags/${tag}") ||
        fail "cannot resolve tag ref: $tag"
    type=$(jq -er '.object.type' <<<"$object")
    sha=$(jq -er '.object.sha' <<<"$object")
    while [[ "$type" == tag ]]; do
        depth=$((depth + 1))
        [[ "$depth" -le 8 ]] || fail "annotated tag chain is too deep: $tag"
        object=$(gh api "repos/${repository}/git/tags/${sha}") ||
            fail "cannot resolve annotated tag object: $sha"
        type=$(jq -er '.object.type' <<<"$object")
        sha=$(jq -er '.object.sha' <<<"$object")
    done
    [[ "$type" == commit && "$sha" =~ ^[0-9a-f]{40}$ ]] ||
        fail "tag does not resolve to a commit: $tag"
    printf '%s\n' "$sha"
}

snapshot_release() {
    local repository=$1
    local tag=$2
    local state

    state=$(gh api "repos/${repository}/releases/tags/${tag}") ||
        fail "cannot read release snapshot: $tag"
    jq -S --arg repository "$repository" '
      {
        schemaVersion: 1,
        repository: $repository,
        releaseId: .id,
        tagName: .tag_name,
        draft: .draft,
        prerelease: .prerelease,
        assets: ([.assets[] | {id, name, size, digest}] | sort_by(.name))
      }
    ' <<<"$state"
}

verify_provenance() {
    local repository=$1
    local package_tag=$2
    local source_sha=$3
    local upstream_tag=$4
    local expected_snapshot=$5
    local resolved temporary current normalized_expected

    [[ "$source_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'source SHA is not immutable'
    [[ -f "$expected_snapshot" && ! -L "$expected_snapshot" ]] ||
        fail 'expected upstream snapshot is missing or unsafe'
    jq -e --arg repository "$repository" --arg tag "$upstream_tag" '
      .schemaVersion == 1 and
      .repository == $repository and
      .tagName == $tag and
      (.releaseId | type == "number") and
      (.draft | type == "boolean") and
      (.prerelease | type == "boolean") and
      (.assets | type == "array" and length == 2) and
      all(.assets[];
        (.id | type == "number") and
        (.name | type == "string") and
        (.size | type == "number") and
        (.digest | type == "string" and test("^sha256:[0-9a-f]{64}$"))
      )
    ' "$expected_snapshot" >/dev/null || fail 'expected upstream snapshot is malformed'

    resolved=$(resolve_tag "$repository" "$package_tag")
    [[ "$resolved" == "$source_sha" ]] ||
        fail "package tag moved: expected $source_sha, found $resolved"

    temporary=$(mktemp -d)
    trap "rm -rf '$temporary'" EXIT
    snapshot_release "$repository" "$upstream_tag" > "$temporary/current.json"
    jq -S . "$expected_snapshot" > "$temporary/expected.json"
    current=$(sha256sum "$temporary/current.json" | cut -d' ' -f1)
    normalized_expected=$(sha256sum "$temporary/expected.json" | cut -d' ' -f1)
    [[ "$current" == "$normalized_expected" ]] ||
        fail "upstream release snapshot changed: $upstream_tag"
    cmp -- "$temporary/expected.json" "$temporary/current.json" >/dev/null ||
        fail "upstream release snapshot changed: $upstream_tag"
    rm -rf "$temporary"
    trap - EXIT
    printf 'release provenance: PASS (%s -> %s)\n' "$package_tag" "$source_sha"
}

require_token
command=${1:-}
case "$command" in
    resolve-tag)
        [[ $# -eq 3 ]] || fail 'usage: resolve-tag REPOSITORY TAG'
        resolve_tag "$2" "$3"
        ;;
    snapshot)
        [[ $# -eq 3 ]] || fail 'usage: snapshot REPOSITORY TAG'
        snapshot_release "$2" "$3"
        ;;
    verify)
        [[ $# -eq 6 ]] ||
            fail 'usage: verify REPOSITORY PACKAGE_TAG SOURCE_SHA UPSTREAM_TAG SNAPSHOT'
        verify_provenance "$2" "$3" "$4" "$5" "$6"
        ;;
    *)
        fail 'expected resolve-tag, snapshot, or verify'
        ;;
esac
