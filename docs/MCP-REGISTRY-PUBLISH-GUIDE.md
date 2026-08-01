---
title: "MCP Registry publishing"
created: 2026-05-22
updated: 2026-07-30
---

# MCP Registry publishing

`server.json` is the authoritative MCP Registry manifest. Yarr is published as
`ai.dinglebear/yarr`, proved through the `dinglebear.ai` DNS domain, and its
runtime package is the npm stdio launcher `yarr-mcp`.

## Manifest contract

Before publishing, verify these coupled values:

| Field | Required value |
|---|---|
| `name` | `ai.dinglebear/yarr` |
| `version` | Same version as Cargo and npm |
| `packages[0].registryType` | `npm` |
| `packages[0].identifier` | `yarr-mcp` |
| `packages[0].version` | Same release version |
| `packages[0].transport.type` | `stdio` |
| `_meta...namespace` | `ai.dinglebear` |
| `_meta...dnsDomain` | `dinglebear.ai` |

The package argument must launch `mcp`, and the distribution metadata must name
the exact `@dinglebear/yarr-mcp@<version>` release. `cargo xtask tool-docs --check`, repo
contract tests, and release version checks guard related generated/coupled files.

## Install the publisher deliberately

Download a specific `mcp-publisher` release for the runner architecture from
the [official registry releases](https://github.com/modelcontextprotocol/registry/releases).
Verify its published checksum before installing it. Do not automate a mutable
`releases/latest` download in a release workflow.

## Authenticate the namespace

The repository secret `MCP_PRIVATE_KEY` must correspond to the registry DNS
proof for `dinglebear.ai`:

```bash
./mcp-publisher login dns \
  --domain dinglebear.ai \
  --private-key "$MCP_PRIVATE_KEY"
```

Never print the private key or persist it in the repository/workflow artifacts.
GitHub OAuth authenticates a `github.com/...` namespace and therefore is not a
substitute for the `ai.dinglebear` DNS namespace.

## Publish

Publish only after the exact npm version in `server.json` is publicly
installable:

```bash
version="$(jq -r '.version' server.json)"
test "$(jq -r '.packages[0].version' server.json)" = "$version"
test "$(npm view "@dinglebear/yarr-mcp@${version}" version)" = "$version"
./mcp-publisher publish
```

Record the publisher version, manifest version, registry response, and workflow
or operator identity in the release evidence.

## Automation status

The current release workflow verifies and publishes GitHub assets and npm, but
does not invoke `mcp-publisher`. Registry publication is therefore a separate
explicit release operation. Do not claim registry publication from a green
Docker or GitHub release job alone.

If registry publishing is added to CI, pin the publisher artifact/checksum,
authenticate with `MCP_PRIVATE_KEY`, verify npm first, and run it before the
draft GitHub release becomes public. A registry failure must leave the GitHub
release in draft and follow `docs/runbooks/partial-release.md`.

## Troubleshooting

- **Name not in namespace:** confirm the login used `dinglebear.ai` and that
  DNS proof maps to `ai.dinglebear`.
- **Invalid schema:** compare `server.json` with the `$schema` URL declared in
  the file and run the repository contract checks.
- **Package unavailable:** verify the exact npm version, not merely the `latest`
  tag, and retry only after registry propagation.
- **Version mismatch:** update versions through the release-please coupling;
  do not hand-edit only `server.json`.
