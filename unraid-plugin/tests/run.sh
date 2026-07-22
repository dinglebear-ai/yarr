#!/usr/bin/env bash
set -euo pipefail

test_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

expect_rejection() {
    local label=$1
    shift
    if "$@" >/dev/null 2>&1; then
        printf 'Task 1 regression: %s was accepted\n' "$label" >&2
        exit 1
    fi
}

bash "$test_dir/release-contract.sh"
bash "$test_dir/release-contract.sh" \
    --manifest "$test_dir/fixtures/release-manifest.valid.json"

jq '.packageFile = "yarr-9.9.9-x86_64-99.txz"' \
    "$test_dir/fixtures/release-manifest.valid.json" > "$tmp_dir/mismatched-package.json"
expect_rejection "package filename version/build mismatch" \
    bash "$test_dir/release-contract.sh" --manifest "$tmp_dir/mismatched-package.json"

jq '.packageSha256 = "not-a-sha256"' \
    "$test_dir/fixtures/release-manifest.valid.json" > "$tmp_dir/malformed-sha.json"
expect_rejection "malformed package checksum" \
    bash "$test_dir/release-contract.sh" --manifest "$tmp_dir/malformed-sha.json"

jq '.unexpectedKey = true' \
    "$test_dir/fixtures/release-manifest.valid.json" > "$tmp_dir/unknown-key.json"
expect_rejection "unknown manifest key" \
    bash "$test_dir/release-contract.sh" --manifest "$tmp_dir/unknown-key.json"

for path in \
    "unraid-plugin/source/etc/rc.d/rc.yarr/." \
    "unraid-plugin/source/etc/rc.d/rc.yarr/.." \
    "unraid-plugin/source/./etc/rc.d/rc.yarr" \
    "unraid-plugin//source/etc/rc.d/rc.yarr"; do
    printf '%s\n' "$path" > "$tmp_dir/path-inventory.txt"
    expect_rejection "non-canonical inventory path: $path" \
        bash "$test_dir/release-contract.sh" \
        --manifest "$test_dir/fixtures/release-manifest.valid.json" \
        --inventory "$tmp_dir/path-inventory.txt"
done

printf 'Task 1 aggregate contract: PASS\n'
