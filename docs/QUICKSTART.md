---
title: "Quickstart"
doc_type: "guide"
status: "active"
owner: "yarr"
audience: ["operators", "contributors", "agents"]
scope: "project"
source_of_truth: false
upstream_refs:
  - "README.md"
  - "src/cli.rs"
  - "src/config.rs"
  - "unraid-plugin/README.md"
last_reviewed: "2026-07-27"
---

# yarr quickstart

Choose the path that matches how you intend to run Yarr. The native installer
is the default for Linux operators, source builds are the contributor path, the
npm launcher is valid only when the exact coupled version exists, and Unraid
uses its independent classic package.

## 1. Install Yarr

### Native Linux binary

The installer downloads the release archive and verifies its SHA-256 before
installing to `~/.local/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash
yarr --version
```

Ensure `~/.local/bin` is on `PATH` before configuring an MCP client.

### Source checkout

```bash
cargo build --release --locked
install -m 755 target/release/yarr "$HOME/.local/bin/yarr"
yarr --version
```

### Exact-version npm launcher

The launcher and native release use one version. Never use an unpinned
`npx yarr-mcp` or `@latest` in automation or an MCP manifest.

```bash
YARR_VERSION=2.1.0
npm view "yarr-mcp@${YARR_VERSION}" version
npx -y "yarr-mcp@${YARR_VERSION}" --version
```

If `npm view` returns `E404` or `ETARGET`, stop. Use the native binary or
source build instead of falling back to another npm version. GitHub release
`v2.1.0` currently exists while `yarr-mcp@2.1.0` is missing; recovery is
tracked in [issue #80](https://github.com/dinglebear-ai/yarr/issues/80).

### Unraid

Open **Plugins > Install Plugin** and use:

```text
https://raw.githubusercontent.com/dinglebear-ai/yarr/main/unraid-plugin/yarr.plg
```

Then open **Settings > Yarr**. Keep loopback binding for the first save and see
the [Unraid operator guide](../unraid-plugin/README.md) for auth, services,
discovery, updates, rollback, logs, and uninstall behavior.

## 2. Configure one service

This example uses Sonarr. Credentials belong in the server environment, never
in MCP tool arguments.

```bash
export YARR_SERVICES=sonarr
export YARR_SONARR_URL=http://127.0.0.1:8989
export YARR_SONARR_API_KEY=replace-me
```

Validate the configuration before starting a persistent server:

```bash
yarr doctor --json
```

See [CONFIG.md](CONFIG.md) and [ENV.md](ENV.md) for every supported service and
runtime variable.

## 3. Try the CLI

```bash
yarr help
yarr sonarr status
yarr sonarr get --path /api/v3/system/status
```

The CLI and MCP surfaces share the same service dispatcher and validation.

## 4. Run local stdio MCP

stdio is the preferred single-machine transport because it does not open a
network listener:

```bash
yarr mcp
```

Example client configuration:

```json
{
  "mcpServers": {
    "yarr": {
      "command": "yarr",
      "args": ["mcp"],
      "env": {
        "YARR_SERVICES": "sonarr",
        "YARR_SONARR_URL": "http://127.0.0.1:8989",
        "YARR_SONARR_API_KEY": "${YARR_SONARR_API_KEY}"
      }
    }
  }
}
```

## 5. Run Streamable HTTP MCP

Use HTTP when several clients need one long-running endpoint. Bearer auth is
required for this example:

```bash
export YARR_MCP_HOST=127.0.0.1
export YARR_MCP_PORT=40070
export YARR_MCP_TOKEN="$(openssl rand -hex 32)"
yarr serve
```

Verify liveness and readiness:

```bash
curl --fail http://127.0.0.1:40070/health
curl --fail http://127.0.0.1:40070/ready
```

Verify MCP initialization:

```bash
curl --fail http://127.0.0.1:40070/mcp \
  -H "Authorization: Bearer $YARR_MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl-smoke","version":"1"}}}'
```

Use an MCP client such as mcporter for session-aware `tools/list`, resources,
prompts, and Code Mode execution. See [MCPORTER.md](MCPORTER.md).

Do not expose an unauthenticated non-loopback listener. See [AUTH.md](AUTH.md)
and [DEPLOYMENT.md](DEPLOYMENT.md) before LAN, reverse-proxy, OAuth, Docker, or
systemd deployment.

## 6. Install marketplace plugins

Inside Claude Code:

```text
/plugin marketplace add dinglebear-ai/yarr
/plugin install yarr@yarr
```

The full plugin invokes the exact npm launcher pinned in its manifest, so it is
blocked while that exact version is absent from npm. Skills-only plugins such
as `sonarr@yarr` and `plex@yarr` call their configured upstream directly and
do not require the full launcher. See [PLUGINS.md](PLUGINS.md).

## 7. Verify a contributor checkout

```bash
cargo fmt --check
cargo test
cargo clippy -- -D warnings
python3 scripts/check-schema-docs.py --check
python3 scripts/check-doc-links.py
bash scripts/run-ascii-check.sh
```

Run `just verify` for the complete project gate and `just unraid-test` when
changing the Unraid distribution.

## Common first-run failures

- **`yarr: command not found`:** add `~/.local/bin` to `PATH` or use the
  absolute installed binary path in the MCP manifest.
- **npm `E404` or `ETARGET`:** the exact coupled launcher is unpublished.
  Do not use `latest`; use the native binary.
- **Unknown service:** include the service in `YARR_SERVICES` and configure its
  URL.
- **Upstream 401:** repair the service-specific API key/token in the server
  environment.
- **HTTP 401/403:** verify Yarr server auth separately from upstream service
  credentials.
- **`/ready` is not 200:** at least one supported service must be configured;
  readiness does not contact the upstream service.
