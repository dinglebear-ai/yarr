---
title: "Deployment"
created: 2026-05-22
updated: 2026-07-30
---

---
title: "Deployment"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["operators", "contributors", "agents"]
scope: "project"
source_of_truth: false
upstream_refs:
  - "docker-compose.prod.yml"
  - ".github/workflows/release.yml"
  - "install.sh"
  - "unraid-plugin/README.md"
last_reviewed: "2026-07-27"
---

# Deployment

## Supported entry points

| Command | Purpose |
|---|---|
| `yarr mcp` | Local stdio MCP child process |
| `yarr serve` or `yarr serve mcp` | Streamable HTTP MCP server |
| `yarr <service> <verb>` | Service-grouped CLI |
| `yarr codemode --code ...` | Local Code Mode execution |
| `yarr snippet ...` | Snippet lifecycle |
| `yarr doctor [--json]` | Configuration and upstream diagnostics |
| `yarr watch` | Poll the server liveness endpoint |

`--json` is command-specific, not a universal global flag. Check `yarr help`
and the command parser for supported flags.

## Installation matrix

| Environment | Recommended path | Integrity and availability notes |
|---|---|---|
| Linux x86-64 | Native installer | Verifies release archive and SHA-256; installs to `~/.local/bin` |
| Contributor checkout | `cargo build --release --locked` | Uses committed Rust lockfile |
| Node-managed client | Exact `yarr-mcp@VERSION` | Use only after `npm view` proves that exact version exists |
| Container | Immutable GHCR digest | Never deploy mutable `latest` as rollback state |
| Unraid | Classic `.plg` package | Independent checksummed `unraid-vVERSION-BUILD` release |

### Native installer

```bash
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash
yarr --version
```

### Exact-version npm launcher

```bash
YARR_VERSION=2.1.0
npm view "yarr-mcp@${YARR_VERSION}" version
npm install --global "yarr-mcp@${YARR_VERSION}"
```

The npm launcher and runtime release are a coupled contract. Do not use
unpinned `npx yarr-mcp` or `@latest` in production, plugin manifests, or
reproducibility instructions. GitHub release `v2.1.0` is currently public
while `yarr-mcp@2.1.0` is absent from npm; use the native binary until
[issue #80](https://github.com/dinglebear-ai/yarr/issues/80) is resolved.

### Source checkout

```bash
cargo build --release --locked
install -m 755 target/release/yarr "$HOME/.local/bin/yarr"
```

### Unraid

Install this URL under **Plugins > Install Plugin**:

```text
https://raw.githubusercontent.com/dinglebear-ai/yarr/main/unraid-plugin/yarr.plg
```

The Unraid distribution embeds the native runtime and does not depend on the
npm launcher. Its persistence, auth, GraphQL, update, rollback, and release
contracts are documented in the [Unraid operator guide](../unraid-plugin/README.md).

## Configuration preflight

```bash
cp .env.example .env
# Set YARR_SERVICES and every named service URL and credential.
yarr doctor --json
```

The data root is `YARR_HOME` when set, `/data` in a container, and `~/.yarr`
otherwise. There is no `YARR_DATA_DIR` variable and no `.env.yarr` template.

Non-loopback HTTP requires bearer auth, OAuth, or the explicit trusted-gateway
contract. Static bearer tokens default to read-only; grant `yarr:write`
explicitly only when that token must use Code Mode or write actions. See
[AUTH.md](AUTH.md). Local OAuth supports exactly one Yarr replica because
startup holds an exclusive SQLite instance lock. Do not place the auth database
on shared or network storage to simulate horizontal scaling.

## Local stdio deployment

Use stdio for a single local MCP client or a client that manages child-process
lifetime:

```json
{
  "mcpServers": {
    "yarr": {
      "command": "yarr",
      "args": ["mcp"]
    }
  }
}
```

The OS process boundary is the transport trust boundary; HTTP auth settings do
not apply to stdio.

## Persistent HTTP deployment

```bash
export YARR_MCP_HOST=127.0.0.1
export YARR_MCP_PORT=40070
export YARR_MCP_TOKEN="$(openssl rand -hex 32)"
yarr serve
```

Place non-loopback deployments behind an authenticated reverse proxy or MCP
gateway and separately restrict unauthenticated probe routes.

## Production Compose

Production deployment requires an immutable manifest digest:

```bash
export YARR_MCP_IMAGE="ghcr.io/dinglebear-ai/yarr@sha256:<verified-digest>"
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml run --rm --no-deps yarr-mcp doctor --json
docker compose -f docker-compose.prod.yml up -d --wait yarr-mcp
curl --fail http://127.0.0.1:40070/ready
```

The production file requires `.env`; it does not start with an empty service
inventory. `/health` proves liveness. `/ready` returns 200 only when at least
one service is configured and deliberately does not call upstream services.

Before changing a digest, record the exact current image:

```bash
docker inspect --format '{{.Config.Image}}' yarr-mcp | tee .yarr-previous-image
```

Rollback uses that recorded digest, never `latest`:

```bash
export YARR_MCP_IMAGE="$(cat .yarr-previous-image)"
docker compose -f docker-compose.prod.yml up -d --wait --force-recreate yarr-mcp
```

See [deployment-rollback.md](runbooks/deployment-rollback.md).

## User systemd

The repository documents a user-unit pattern but does not ship a ready-made
`systemd/yarr.service`. Create and review the unit from [SYSTEMD.md](SYSTEMD.md),
use an absolute `ExecStart` and environment-file path, and run
`yarr doctor --json` before restart.

## Public HTTP endpoints

| Endpoint | Meaning | Authentication |
|---|---|---|
| `/health` | Process liveness | None |
| `/ready` | Configured-service readiness | None |
| `/status` | Redacted runtime identity | None |
| `/metrics` | Prometheus exposition | None |
| `/mcp` | Streamable HTTP MCP | Server auth policy |

Probe and metrics routes reveal only bounded operational state, but they are
unauthenticated. Restrict them with network or reverse-proxy policy whenever
Yarr is externally reachable.

## Upgrade and rollback checklist

1. Record the current binary version, image digest, config path, and readiness.
2. Verify the exact replacement artifact and checksum or immutable digest.
3. Run `yarr doctor --json` against the prospective environment.
4. Deploy and verify `/health`, `/ready`, MCP initialization, and one read-only call.
5. Restore the recorded artifact if readiness fails; do not infer rollback from a mutable tag.
6. Preserve logs and release identifiers before retrying a failed transaction.

## Release recovery

Release-please creates the tag and draft GitHub Release. `release.yml` verifies
coupled versions, builds and checksums archives, stages and redownloads assets,
verifies or publishes the exact npm launcher, and publishes GitHub last.

If GitHub is public while npm is absent, the normal invariant is already
broken. Preserve evidence, do not publish another version or move the tag, and
follow [partial-release.md](runbooks/partial-release.md). Changing a public
release back to draft or publishing npm requires explicit release-operator
authorization. The Unraid package release remains independent.

## Deployment evidence

For a production change, retain: source commit, binary version, image digest or
archive SHA-256, config preflight output, post-deploy readiness, representative
read-only MCP result, rollback artifact, and the workflow/run URL. Redact all
upstream and server credentials before attaching evidence.
