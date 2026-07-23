# Partial release recovery

Owner: `@jmagar`

## Contract

Release-please creates a tag and draft GitHub Release. `Release` stages both
checksummed binary archives, publishes/verifies the exact npm launcher version,
checks required assets, and publishes the GitHub Release last.

## Failure handling

1. Open the failed workflow and identify `verify`, `build`, `stage-release`,
   `npm`, or `finalize`.
2. Confirm the GitHub Release is still a draft:
   `gh api repos/dinglebear-ai/yarr/releases/tags/vX.Y.Z --jq '{draft,tag_name,assets:[.assets[].name]}'`.
3. Check npm independently:
   `npm view yarr-mcp@X.Y.Z version`.
4. Fix the underlying source/credential/registry incident. Do not delete a
   published npm version and do not create a replacement tag.
5. Rerun `Release` with the same `vX.Y.Z` tag. Existing assets are replaced
   with deterministic rebuilds and an already-published exact npm version is
   reused.

If the release became public before npm exists, treat it as an incident: make
the GitHub Release draft again, preserve evidence, fix npm publication, rerun,
and only then publish.
