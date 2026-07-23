#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
    local message=$1
    printf 'package release transaction: %s\n' "$message" >&2
    if [[ "${transaction_active:-false}" == true &&
        "${cleanup_in_progress:-false}" != true ]]; then
        cleanup_in_progress=true
        trap - ERR INT TERM
        if ! cleanup_owned_draft "$message"; then
            printf 'package release transaction: RECOVERY REQUIRED for release ID %s marker %s\n' \
                "${owned_release_id:-unknown}" "${run_marker:-unknown}" >&2
        fi
    fi
    exit 1
}

[[ $# -eq 7 ]] ||
    fail 'usage: REPOSITORY PACKAGE_TAG SOURCE_SHA PLUGIN_VERSION PACKAGE_BUILD ASSETS_DIR UPSTREAM_SNAPSHOT'

repository=$1
package_tag=$2
source_sha=$3
plugin_version=$4
package_build=$5
assets_dir=$6
upstream_snapshot=$7
upstream_tag="v${plugin_version}"
run_marker="yarr-unraid-release:${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}:${source_sha}"
marker_line="<!-- ${run_marker} -->"
release_title="Yarr Unraid plugin ${plugin_version}-${package_build}"
release_body="${marker_line}
Classic Unraid package for Yarr ${plugin_version}. Upstream binary assets remain on ${upstream_tag}."
owned_release_id=''
transaction_active=false
cleanup_in_progress=false
query_error=''

[[ -n "${GH_TOKEN:-}" ]] || fail 'GH_TOKEN is required for the publication step'
[[ "$repository" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || fail 'invalid repository'
[[ "$package_tag" =~ ^unraid-v[0-9]+\.[0-9]+\.[0-9]+-[1-9][0-9]*$ ]] ||
    fail 'invalid package tag'
[[ "$source_sha" =~ ^[0-9a-f]{40}$ ]] || fail 'invalid immutable source SHA'
[[ -d "$assets_dir" && ! -L "$assets_dir" ]] || fail 'release assets directory is unsafe'

temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT

query_release_by_tag() {
    local output=$1
    query_error="$temporary/query-tag.err"
    if gh api "repos/${repository}/releases/tags/${package_tag}" >"$output" 2>"$query_error"; then
        return 0
    fi
    if grep -Fq '(HTTP 404)' "$query_error"; then
        return 4
    fi
    return 5
}

query_release_by_id() {
    local release_id=$1
    local output=$2
    query_error="$temporary/query-id.err"
    if gh api "repos/${repository}/releases/${release_id}" >"$output" 2>"$query_error"; then
        return 0
    fi
    if grep -Fq '(HTTP 404)' "$query_error"; then
        return 4
    fi
    return 5
}

release_is_owned() {
    local json=$1
    jq -e --arg tag "$package_tag" --arg marker "$marker_line" '
      .tag_name == $tag and
      (.body | type == "string" and contains($marker))
    ' "$json" >/dev/null
}

verify_remote_assets() {
    local release_id=$1
    local state="$temporary/remote-state.json"
    local remote="$temporary/remote-assets"
    local local_names="$temporary/local-names"
    local remote_names="$temporary/remote-names"
    local asset_id name

    rm -rf "$remote"
    mkdir -p "$remote"
    find "$assets_dir" -maxdepth 1 -type f -printf '%f\n' | sort >"$local_names"
    [[ -s "$local_names" ]] || return 1
    query_release_by_id "$release_id" "$state" || return 1
    release_is_owned "$state" || return 1
    jq -r '.assets[].name' "$state" | sort >"$remote_names"
    cmp -- "$local_names" "$remote_names" >/dev/null || return 1
    while IFS=$'\t' read -r asset_id name; do
        [[ "$asset_id" =~ ^[0-9]+$ ]] || return 1
        [[ -n "$name" && "$name" != */* && "$name" != .* ]] || return 1
        gh api -H 'Accept: application/octet-stream' \
            "repos/${repository}/releases/assets/${asset_id}" >"$remote/$name" || return 1
        cmp -- "$assets_dir/$name" "$remote/$name" >/dev/null || return 1
    done < <(jq -r '.assets[] | [.id, .name] | @tsv' "$state")
}

cleanup_owned_draft() {
    local reason=$1
    local state="$temporary/cleanup-state.json"
    local after="$temporary/cleanup-after.json"
    local query_status delete_status

    [[ -n "$owned_release_id" ]] || {
        printf 'package release transaction: no owned release ID; manual search marker: %s\n' \
            "$run_marker" >&2
        return 1
    }
    query_status=0
    query_release_by_id "$owned_release_id" "$state" || query_status=$?
    case "$query_status" in
        0) ;;
        4)
            transaction_active=false
            return 0
            ;;
        *)
            printf 'package release transaction: recovery required; cannot query owned release ID %s after %s\n' \
                "$owned_release_id" "$reason" >&2
            return 1
            ;;
    esac
    if ! release_is_owned "$state"; then
        printf 'package release transaction: refusing cleanup; release ID %s no longer has this run marker/target\n' \
            "$owned_release_id" >&2
        return 1
    fi
    if [[ $(jq -r '.draft' "$state") != true ]]; then
        printf 'package release transaction: refusing cleanup of published release ID %s\n' \
            "$owned_release_id" >&2
        return 1
    fi

    delete_status=0
    gh api --method DELETE "repos/${repository}/releases/${owned_release_id}" \
        >"$temporary/delete.out" 2>"$temporary/delete.err" || delete_status=$?
    query_status=0
    query_release_by_id "$owned_release_id" "$after" || query_status=$?
    if [[ "$query_status" -eq 4 ]]; then
        transaction_active=false
        return 0
    fi
    if [[ "$query_status" -eq 0 ]]; then
        printf 'package release transaction: cleanup failed; owned draft ID %s still exists after %s (delete status %s)\n' \
            "$owned_release_id" "$reason" "$delete_status" >&2
        return 1
    fi
    printf 'package release transaction: cleanup state is ambiguous for owned draft ID %s after %s (delete status %s)\n' \
        "$owned_release_id" "$reason" "$delete_status" >&2
    return 1
}

on_error() {
    local status=$?
    trap - ERR INT TERM
    if [[ "$transaction_active" == true ]]; then
        if ! cleanup_owned_draft "unexpected failure"; then
            printf 'package release transaction: RECOVERY REQUIRED for release ID %s marker %s\n' \
                "$owned_release_id" "$run_marker" >&2
        fi
    fi
    exit "$status"
}
trap on_error ERR INT TERM

verify_provenance() {
    bash unraid-plugin/scripts/github-release-provenance.sh verify \
        "$repository" "$package_tag" "$source_sha" "$upstream_tag" "$upstream_snapshot"
}

create_owned_draft() {
    local payload="$temporary/create-payload.json"
    local response="$temporary/create-response.json"
    local candidate="$temporary/create-candidate.json"
    local query_status=0

    jq -n \
        --arg tag "$package_tag" \
        --arg sha "$source_sha" \
        --arg name "$release_title" \
        --arg body "$release_body" '
          {
            tag_name: $tag,
            target_commitish: $sha,
            name: $name,
            body: $body,
            draft: true,
            prerelease: false,
            make_latest: "false"
          }
        ' >"$payload"
    if gh api --method POST "repos/${repository}/releases" --input "$payload" >"$response"; then
        release_is_owned "$response" ||
            fail 'create response did not preserve the exact run marker and package tag'
        [[ $(jq -r '.draft' "$response") == true ]] ||
            fail 'create response was not a draft'
        owned_release_id=$(jq -er '.id' "$response")
        transaction_active=true
        return 0
    fi

    query_release_by_tag "$candidate" || query_status=$?
    if [[ "$query_status" -eq 0 ]] &&
        release_is_owned "$candidate" &&
        [[ $(jq -r '.draft' "$candidate") == true ]]; then
        owned_release_id=$(jq -er '.id' "$candidate")
        transaction_active=true
        printf 'package release transaction: adopted owned draft %s after ambiguous create response\n' \
            "$owned_release_id"
        return 0
    fi
    printf 'package release transaction: create state ambiguous; no exact owned draft was proven. Search marker: %s\n' \
        "$run_marker" >&2
    return 1
}

verify_provenance
existing="$temporary/existing.json"
existing_status=0
query_release_by_tag "$existing" || existing_status=$?
case "$existing_status" in
    0)
        if ! release_is_owned "$existing"; then
            fail "release tag already exists but is not owned by this run: $package_tag"
        fi
        owned_release_id=$(jq -er '.id' "$existing")
        if [[ $(jq -r '.draft' "$existing") == false ]]; then
            verify_remote_assets "$owned_release_id" ||
                fail "owned published release has unexpected assets: $owned_release_id"
            printf 'package release transaction: already published exact release ID %s\n' \
                "$owned_release_id"
            exit 0
        fi
        transaction_active=true
        printf 'package release transaction: resuming owned draft ID %s\n' "$owned_release_id"
        ;;
    4)
        verify_provenance
        create_owned_draft
        ;;
    *)
        fail "cannot determine whether package release exists; no mutation attempted: $query_error"
        ;;
esac

upload_status=0
gh release upload "$package_tag" "$assets_dir"/* --repo "$repository" --clobber ||
    upload_status=$?
if ! verify_remote_assets "$owned_release_id"; then
    printf 'package release transaction: upload status %s did not produce exact remote assets\n' \
        "$upload_status" >&2
    cleanup_owned_draft 'asset upload/verification failure' ||
        fail "RECOVERY REQUIRED for owned draft ID $owned_release_id"
    fail 'release asset upload did not commit atomically'
fi
if [[ "$upload_status" -ne 0 ]]; then
    printf 'package release transaction: upload response was ambiguous but exact remote bytes were proven\n'
fi

verify_provenance
before_publish="$temporary/before-publish.json"
query_release_by_id "$owned_release_id" "$before_publish" ||
    fail "cannot re-read owned draft immediately before publish: $owned_release_id"
release_is_owned "$before_publish" ||
    fail "owned draft identity changed immediately before publish: $owned_release_id"
[[ $(jq -r '.draft' "$before_publish") == true ]] ||
    fail "release was published before the transaction committed: $owned_release_id"

publish_payload="$temporary/publish-payload.json"
jq -n '{draft: false, make_latest: "false"}' >"$publish_payload"
publish_status=0
gh api --method PATCH "repos/${repository}/releases/${owned_release_id}" \
    --input "$publish_payload" >"$temporary/publish-response.json" ||
    publish_status=$?

after_publish="$temporary/after-publish.json"
after_status=0
query_release_by_id "$owned_release_id" "$after_publish" || after_status=$?
if [[ "$after_status" -ne 0 ]]; then
    transaction_active=false
    fail "publish state is ambiguous for release ID $owned_release_id; retained for manual recovery (command status $publish_status)"
fi
if ! release_is_owned "$after_publish"; then
    transaction_active=false
    fail "publish returned a release with changed ownership/target; retained ID $owned_release_id"
fi
if [[ $(jq -r '.draft' "$after_publish") == false ]]; then
    verify_remote_assets "$owned_release_id" ||
        fail "published release assets changed after commit: $owned_release_id"
    transaction_active=false
    trap - ERR INT TERM
    printf 'package release transaction: published exact release ID %s (command status %s)\n' \
        "$owned_release_id" "$publish_status"
    exit 0
fi

cleanup_owned_draft "publish did not commit (command status $publish_status)" ||
    fail "RECOVERY REQUIRED for owned draft ID $owned_release_id"
fail "publish did not commit; exact owned draft $owned_release_id was removed safely"
