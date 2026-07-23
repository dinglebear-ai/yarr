---
title: "Deployment"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["operators", "contributors", "agents"]
scope: "project"
source_of_truth: false
last_reviewed: "2026-07-16"
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
| `yarr doctor [--json]` | Configuration/upstream diagnostics |
| `yarr watch` | Poll the server liveness endpoint |

`--json` is command-specific, not a universal global flag. Check `yarr help`
and the command parser for the supported flags.

## Installation

Choose one installation path:

```bash
# npm launcher; downloads the matching checksummed release binary
npm install --global yarr-mcp

# Linux x86_64 release installer; installs to ~/.local/bin by default
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash

# source checkout
cargo build --release --locked
install -m 755 target/release/yarr "$HOME/.local/bin/yarr"
```

The npm launcher version and runtime release version are one coupled contract.
Release CI rejects version drift. Shell installers consume release archives and
their SHA-256 assets; they do not copy a repository-committed plugin binary.

## Configuration preflight

```bash
cp .env.example .env
# Set YARR_SERVICES and every named service's URL/auth variables.
yarr doctor --json
```

The data root is `YARR_HOME` when set, `/data` in a container, and `~/.yarr`
otherwise. There is no `YARR_DATA_DIR` variable and no `.env.yarr` template.

Non-loopback HTTP requires bearer auth, OAuth, or the explicit trusted-gateway
acknowledgement. Static bearer tokens are read-only. See `docs/AUTH.md`.

Deploy local OAuth with exactly one Yarr replica. Startup holds an exclusive
`${sqlite_path}.instance.lock`; a second replica fails closed. Do not place the
SQLite database on NFS/shared storage to scale horizontally. A shared auth
backend is required before multi-replica OAuth is supported.

## Production Compose

Production deployment requires an immutable manifest digest:

```bash
export YARR_MCP_IMAGE='ghcr.io/dinglebear-ai/yarr@sha256:<verified-digest>'
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml run --rm --no-deps yarr-mcp doctor --json
docker compose -f docker-compose.prod.yml up -d --wait yarr-mcp
curl --fail http://127.0.0.1:40070/ready
```

The production file requires `.env`; it does not start with an empty inventory.
`/health` proves process liveness. `/ready` returns 200 only when at least one
service is configured; it deliberately does not call upstream services.

Before changing the digest, record the exact current image:

```bash
docker inspect --format '{{.Config.Image}}' yarr-mcp | tee .yarr-previous-image
```

If readiness fails, restore that recorded value and recreate:

```bash
export YARR_MCP_IMAGE="$(cat .yarr-previous-image)"
docker compose -f docker-compose.prod.yml up -d --wait --force-recreate yarr-mcp
```

Do not derive rollback state from `latest`; the recorded digest is the rollback
artifact. See `docs/runbooks/deployment-rollback.md`.

## User systemd

This repository documents a user-unit pattern but does not ship a ready-made
`systemd/yarr.service` file. Create and review the unit from
`docs/SYSTEMD.md`, point `ExecStart` at `command -v yarr`, and use an absolute
environment-file path. Run `yarr doctor --json` as a preflight before restart.

## Public HTTP endpoints

| Endpoint | Meaning |
|---|---|
| `/health` | Liveness; always local-only data |
| `/ready` | Configured-service readiness |
| `/status` | Redacted runtime identity |
| `/metrics` | Prometheus exposition |
| `/mcp` | Authenticated Streamable HTTP MCP |

Probe and metrics routes are unauthenticated. Restrict them with network or
reverse-proxy policy when the bind address is externally reachable.

## Release recovery

Release-please creates the tag and a draft GitHub Release. `release.yml` builds
and checksums archives, uploads them to the draft, verifies/publishes the exact
npm version, checks every expected asset, and only then publishes the GitHub
Release. A failed stage leaves the release private. Rerun `Release` with the
same tag; existing npm versions and assets are detected/reused.

See `docs/runbooks/partial-release.md` for validation and recovery commands.
