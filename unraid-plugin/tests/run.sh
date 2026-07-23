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

expect_rejection_contains() {
    local label=$1
    local expected=$2
    shift 2
    local output
    if output=$("$@" 2>&1); then
        printf 'Task 11 regression: %s was accepted\n' "$label" >&2
        exit 1
    fi
    grep -Fq -- "$expected" <<<"$output" || {
        printf 'Task 11 regression: %s failed for the wrong reason\n%s\n' "$label" "$output" >&2
        exit 1
    }
}

bash "$test_dir/release-contract.sh"
bash "$test_dir/lifecycle-contract.sh"
bash "$test_dir/update-contract.sh"
bash "$test_dir/classic-contract.sh"
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

sed -E '0,/actions\/checkout@[0-9a-f]{40}/s//actions\/checkout@main/' \
    "$test_dir/../../.github/workflows/unraid-plugin-ci.yml" > "$tmp_dir/mutable-action.yml"
expect_rejection_contains "mutable workflow action" \
    "CI workflow action is not pinned to an immutable SHA" \
    bash "$test_dir/release-contract.sh" --ci-workflow "$tmp_dir/mutable-action.yml"

sed '/cd unraid-plugin\/api && npm ci && npm test && npx tsc --noEmit && npx tsc/d' \
    "$test_dir/../../.github/workflows/unraid-plugin-ci.yml" > "$tmp_dir/missing-api-gate.yml"
expect_rejection_contains "missing API workflow gate" \
    "CI workflow omits the complete API gate" \
    bash "$test_dir/release-contract.sh" --ci-workflow "$tmp_dir/missing-api-gate.yml"

sed '0,/"unraid-v\*"/s//"v*"/' \
    "$test_dir/../../.github/workflows/unraid-plugin-release.yml" > "$tmp_dir/wrong-release-tag.yml"
expect_rejection_contains "upstream/package tag collision" \
    "release workflow does not trigger on unraid-v* tags" \
    bash "$test_dir/release-contract.sh" --release-workflow "$tmp_dir/wrong-release-tag.yml"

sed '/Loopback is the default/d' "$test_dir/../README.md" > "$tmp_dir/incomplete-readme.md"
expect_rejection_contains "missing network security documentation" \
    "Unraid operator documentation omits required invariant: Loopback is the default" \
    bash "$test_dir/release-contract.sh" --plugin-readme "$tmp_dir/incomplete-readme.md"

printf 'Task 1 aggregate contract: PASS\n'
