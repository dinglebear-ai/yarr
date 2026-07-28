---
title: "CI and Release Gates"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["contributors", "release operators", "agents"]
scope: "project"
source_of_truth: false
upstream_refs:
  - ".github/workflows/"
  - "xtask/src/ci.rs"
  - "scripts/pre-release-check.sh"
last_reviewed: "2026-07-27"
---

# CI and release gates

CI mirrors local quality gates so failures can be reproduced before pushing.
Workflow YAML, scripts, `xtask`, package contracts, and branch protection are
authoritative; this guide explains how they fit together.

## Fast local entry points

```bash
just verify
just template-check
python3 scripts/check-doc-links.py
scripts/pre-release-check.sh
```

`just ci` delegates to `cargo xtask ci`, which runs the supported formatting,
clippy, tests, TOML, pattern, generated-doc, and audit stages. Use
`scripts/pre-release-check.sh --mcporter` only when a live server is available.

For Unraid changes:

```bash
just unraid-test
bash unraid-plugin/scripts/verify-package.sh
actionlint .github/workflows/unraid-plugin-ci.yml .github/workflows/unraid-plugin-release.yml
```

## Workflow inventory

| Workflow | Purpose |
|---|---|
| `ci.yml` | Required Rust, npm, docs, repository-contract, dependency, and secret gates |
| `msrv.yml` | Minimum Supported Rust Version 1.90 |
| `codeql.yml` | CodeQL security analysis |
| `scheduled.yml` | Recurring dependency/security/maintenance checks |
| `dependabot-auto-merge.yml` | No-checkout patch/minor Dependabot auto-merge after required checks |
| `release-please.yml` | Release PR and version/tag orchestration |
| `release.yml` | Coupled native/npm/GitHub release transaction |
| `docker-publish.yml` | Quarantine, scan, and digest promotion for GHCR |
| `unraid-plugin-ci.yml` | Audited Unraid API/web tests, contracts, and deterministic package reproduction |
| `unraid-plugin-release.yml` | Independent `unraid-vVERSION-BUILD` package publication |
| `openwiki-update.yml` | Refresh generated OpenWiki orientation content |

Third-party actions are pinned to immutable commit SHAs. Readable version
comments may accompany pins, but mutable action tags are not accepted.

## Required CI jobs

`.github/workflows/ci.yml` exposes these check names:

| Check | Core responsibility |
|---|---|
| Format | `cargo fmt` |
| Clippy | Lints with warnings denied |
| Docs | Rustdoc plus checked generated references |
| Test | `cargo nextest` with CI profile |
| Actionlint | Workflow syntax and embedded shell |
| NPM Package | Launcher tests, distribution contract, and dry-run pack |
| TOML Format | `taplo check` |
| Repo Contracts | Patterns, test siblings, plugin layout, schema docs, doc links, smoke tests, blob/coupling/ASCII |
| Cargo Deny | Advisories, licenses, bans, and sources |
| Secret Scan | Gitleaks over the relevant commit range |

`.github/workflows/msrv.yml` supplies `Minimum Supported Rust Version (1.90)`.
Main branch protection should require the complete current check set and reject
direct or force pushes.

## Repository contracts

The Repo Contracts job runs:

1. `cargo xtask patterns`
2. `cargo xtask check-test-siblings`
3. `bash scripts/validate-plugin-layout.sh`
4. `python3 scripts/check-schema-docs.py --check`
5. `python3 scripts/check-doc-links.py`
6. `bash scripts/test-template-features.sh`
7. `python3 scripts/check-blob-size.py --base origin/main --head HEAD`
8. `bash scripts/check-coupled-files.sh origin/main HEAD`
9. `bash scripts/run-ascii-check.sh`

This job is the main defense against documentation and packaging drift that can
compile cleanly while still misleading users.

## Unraid CI

Both push and pull-request events run the same `Test and reproduce committed
package` job on Ubuntu 24.04 with Node 22.18.0/npm 10.9.3. The job:

1. installs pinned verification tooling and actionlint;
2. runs `npm ci` and `npm audit --audit-level=high` for API and web;
3. runs API tests/typechecks/build and web tests/typecheck/bundle builds;
4. verifies browser bundles contain no forbidden process/runtime behavior;
5. validates workflow semantics and the full shell/static contract suite;
6. downloads and checks the committed upstream runtime identity;
7. builds the `.txz` twice under different umasks and byte-compares it;
8. verifies the committed package digest, file inventory, paths, modes, and secret inventory;
9. stages and uploads the checksummed CI artifact.

Any change to source, package metadata, API dependencies, web bundles, release
manifest, or `.plg` checksums must keep this two-build contract green.

## Coupled native/npm/GitHub release

`release.yml` runs for `v*` tags after release-please creates a draft release.
The intended transaction order is:

1. verify Cargo, lockfile, npm, registry, and tag versions agree;
2. build Linux and Windows archives;
3. generate sidecars and aggregate `SHA256SUMS`;
4. upload to the draft release and redownload for verification;
5. verify or publish the exact npm launcher with provenance;
6. confirm every required asset and package version exists;
7. publish the GitHub Release last.

A public GitHub release with a missing npm version is a partial-release
incident, not a reason to use npm `latest`. Follow
[partial-release.md](runbooks/partial-release.md). Issue #80 tracks the current
`v2.1.0`/npm mismatch.

## Independent Unraid release

`unraid-plugin-release.yml` uses `unraid-vVERSION-BUILD` tags and a three-job
prepare/build/publish transaction:

- resolve the tag to an immutable commit and validate frozen release identity;
- build and byte-match the committed package using audited API/web dependencies;
- assemble a checksummed inventory;
- grant `contents: write` only to the final publication job;
- reverify local assets and upstream provenance immediately before publication;
- publish transactionally without changing the normal `v*` release or npm state.

## Container publication

`docker-publish.yml` builds an amd64 image into a source-SHA quarantine tag,
attaches SBOM/provenance, scans the immutable digest with Trivy, and promotes
main/latest or semver tags only after a clean scan. Record and deploy the digest,
not the mutable tag. Publication failures create or deduplicate an incident issue.

## Security gates

- `scripts/check-security-exceptions.sh` fails closed when a temporary exception
  expires, even if cargo-deny would otherwise accept it.
- Cargo Deny covers Rust dependency policy.
- `npm audit --audit-level=high` protects the Unraid build toolchains.
- Gitleaks scans repository history/ranges for credentials.
- CodeQL and Trivy cover source and container analysis.
- Package verification rejects unexpected paths, modes, and credential material.

## Release-readiness gate

`scripts/pre-release-check.sh` runs patterns, plugin layout, npm package
contract, schema docs, documentation links, template smoke, version sync, blob
size, ASCII hygiene, and the main quality gate. It reports every failed stage
instead of stopping after the first one.

## Evidence to retain

For releases and high-risk deployments, retain workflow URLs, source commit,
tag, package/version identities, archive and image digests, npm availability
output, generated inventory, readiness evidence, and rollback artifact. Do not
attach secrets, raw `.env` files, auth databases, or unredacted service logs.

## Changelog discipline

Update `CHANGELOG.md` under `[Unreleased]` for meaningful operator-visible
changes. Release automation promotes entries into versioned sections. The
changelog describes user impact; it does not replace executable release evidence.
