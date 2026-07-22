#!/usr/bin/env bash
set -euo pipefail

test_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

bash "$test_dir/release-contract.sh"
bash "$test_dir/release-contract.sh" \
    --manifest "$test_dir/fixtures/release-manifest.valid.json"

if bash "$test_dir/release-contract.sh" \
    --manifest "$test_dir/fixtures/release-manifest.invalid.json"; then
    printf 'Task 1 contract: invalid manifest was accepted\n' >&2
    exit 1
fi

printf 'Task 1 aggregate contract: PASS\n'
