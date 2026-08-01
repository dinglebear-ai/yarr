---
title: "Partial release recovery"
created: 2026-07-16
updated: 2026-07-30
---

---
title: "Partial Release Recovery"
doc_type: "runbook"
status: "active"
owner: "yarr"
audience: ["release operators", "maintainers", "agents"]
scope: "project"
source_of_truth: false
upstream_refs:
  - ".github/workflows/release.yml"
  - "scripts/check-dist-contract.js"
last_reviewed: "2026-07-27"
---

# Partial release recovery

Use this runbook when the coupled native/npm/GitHub release transaction did not
finish in one consistent state. Preserve evidence before changing any public
tag, release, package, or asset.

## Intended invariant

For version `VERSION`, all of these must agree:

- Git tag `vVERSION` resolves to the intended immutable commit;
- Cargo, lockfile, npm package, and `server.json` versions equal `VERSION`;
- the GitHub Release contains every checksummed platform archive;
- `SHA256SUMS` and sidecars match redownloaded assets;
- `@dinglebear/yarr-mcp@VERSION` exists on npm with expected provenance;
- the GitHub Release is public only after every prior condition passes.

The classic Unraid release is independent. It uses
`unraid-vVERSION-BUILD` and does not repair or depend on npm state.

## Safety boundary

The following actions require explicit release-operator authorization:

- publishing a missing npm version;
- changing a public GitHub Release back to draft;
- deleting or replacing a public asset;
- moving, deleting, or recreating a version tag;
- deprecating or unpublishing an npm version;
- publishing a new corrective version.

Do not improvise these actions during diagnosis. Read-only inspection and
workflow-log collection are safe defaults.

## 1. Capture incident identity

```bash
VERSION=2.1.0
REPO=dinglebear-ai/yarr
TAG="v${VERSION}"
gh release view "$TAG" --repo "$REPO" --json tagName,isDraft,isPrerelease,publishedAt,targetCommitish,assets,url
gh api "repos/${REPO}/git/ref/tags/${TAG}"
npm view "@dinglebear/yarr-mcp@${VERSION}" version dist.integrity dist.tarball --json
npm view @dinglebear/yarr-mcp version --json
```

Record the UTC time, operator, source commit, failed workflow URL, tag object
type/SHA, release visibility, asset names/digests, npm result, and any issue
created by automation. Redact credentials and registry tokens.

## 2. Classify the state

| GitHub Release | npm exact version | Meaning | Next action |
|---|---|---|---|
| Draft | Missing | Expected failed transaction | Repair cause, rerun same tag |
| Draft | Present | npm completed, GitHub not finalized | Verify package/assets, rerun same tag |
| Public | Present | Likely complete | Verify assets and coupled versions |
| Public | Missing | Split-brain incident | Freeze changes, preserve evidence, obtain authorization for recovery |
| Missing | Present | Registry escaped release transaction | Freeze changes and reconstruct intended GitHub release from immutable tag |
| Missing | Missing | Tag/workflow may not have run | Inspect tag and workflow dispatch history |

## 3. Verify immutable source and versions

```bash
git fetch origin --tags
git rev-parse "$TAG^{commit}"
git show "$TAG:Cargo.toml" | grep -m1 '^version'
git show "$TAG:packages/yarr-mcp/package.json" | jq -r .version
git show "$TAG:server.json" | jq -r .version
```

All values must equal `VERSION`. Do not move a tag to fix mismatched source;
prepare an explicitly approved corrective release instead.

## 4. Verify GitHub assets

```bash
tmp=$(mktemp -d)
gh release download "$TAG" --repo "$REPO" --dir "$tmp"
cd "$tmp"
sha256sum --check SHA256SUMS
```

Compare the downloaded asset list with `dist.targets.json` and workflow logs.
Confirm each archive contains the expected executable name and no unexpected
paths. Keep the downloaded checksums as incident evidence.

## 5. Verify npm without changing it

```bash
npm view "@dinglebear/yarr-mcp@${VERSION}" --json
npm view "@dinglebear/yarr-mcp@${VERSION}" dist.integrity --json
npm pack "@dinglebear/yarr-mcp@${VERSION}" --dry-run --json
```

If the exact version is absent, do not use `latest` as a substitute. Plugin
manifests intentionally pin the coupled version and should remain pinned.

## 6. Inspect workflow failure

```bash
gh run list --repo "$REPO" --workflow Release --limit 20
gh run view <run-id> --repo "$REPO" --log-failed
```

Determine whether failure occurred before build, asset staging, npm publication,
or final GitHub publication. The workflow is designed to reuse already-correct
assets and npm state when rerun for the same immutable tag.

## 7. Recovery paths

### Draft release, npm missing

1. Fix the workflow or registry/auth root cause without changing the tag.
2. Rerun `Release` for the same tag.
3. Verify exact npm version, all asset checksums, and release visibility.

### Draft release, npm present

1. Verify npm package identity/provenance and every GitHub asset.
2. Rerun the same release workflow so it reuses existing npm state.
3. Confirm GitHub becomes public only after final checks.

### Public release, npm missing

This is the current `v2.1.0` incident tracked in
[issue #80](https://github.com/dinglebear-ai/yarr/issues/80).

1. Do not publish another version, move the tag, or loosen plugin pins.
2. Attach the evidence above to the incident.
3. Identify why GitHub was published before npm existed.
4. Obtain explicit authorization for either exact-version npm publication or another documented recovery strategy.
5. Re-run all distribution contracts and verify both public surfaces after the authorized action.
6. Close the incident only when `npm view @dinglebear/yarr-mcp@VERSION version` and GitHub assets both verify.

## 8. Post-recovery verification

```bash
node scripts/check-dist-contract.js
npm test --prefix packages/yarr-mcp
npm run check --prefix packages/yarr-mcp
npm pack --dry-run --json ./packages/yarr-mcp
python3 scripts/check-doc-links.py
gh release view "$TAG" --repo "$REPO" --json isDraft,publishedAt,assets,url
npm view "@dinglebear/yarr-mcp@${VERSION}" version --json
```

Install the native archive in a disposable environment and, only when the npm
version exists, test the exact launcher:

```bash
npx -y "@dinglebear/yarr-mcp@${VERSION}" --version
npx -y "@dinglebear/yarr-mcp@${VERSION}" mcp
```

## 9. Closeout

Update the incident with root cause, exact authorized action, workflow/run IDs,
final tag and source SHA, asset digests, npm integrity, verification commands,
and prevention changes. Update README, deployment, plugin, CI, and changelog
documentation when the operator-facing state or release invariant changes.
