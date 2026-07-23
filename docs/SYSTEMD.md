---
title: "systemd Deployment"
doc_type: "guide"
status: "active"
owner: "yarr"
audience:
  - "contributors"
  - "agents"
scope: "template"
source_of_truth: false
last_reviewed: "2026-05-15"
---

# systemd

The repository documents a user-level systemd pattern but does not ship a unit
file. Create and review `~/.config/systemd/user/yarr-mcp.service` explicitly.

## Install the binary

```bash
cargo build --release
install -m 755 target/release/yarr ~/.local/bin/yarr
```

Or install through npm:

```bash
npm i -g yarr-mcp
```

Or use the release installer:

```bash
curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash
```

The npm package and curl installer both expose `yarr`. Verify the command is in
`$PATH`:

```bash
yarr --version
yarr doctor
```

## Unit file pattern

```ini
[Unit]
Description=yarr MCP server
After=network.target

[Service]
Type=simple
ExecStart=%h/.local/bin/yarr serve mcp
Restart=on-failure
RestartSec=5
EnvironmentFile=%h/.yarr/.env
ExecStartPre=%h/.local/bin/yarr doctor --json

[Install]
WantedBy=default.target
```

Key points:
- The unit example assumes the curl installer. If you use `npm i -g yarr-mcp`, set
  `ExecStart` to the absolute path returned by `command -v yarr`.
- Use `EnvironmentFile` pointing at `~/.yarr/.env` — never hardcode tokens in unit files.
- `%h` expands to the user home directory.
- `serve mcp` is the canonical Streamable HTTP mode (see `docs/DEPLOYMENT.md`).
- The environment file is operator-created from `.env.example`; there is no
  committed `.env.yarr` file.

## Restart flow

```bash
systemctl --user daemon-reload
systemctl --user restart yarr-mcp.service
systemctl --user status yarr-mcp.service
```

## Runtime verification

`just runtime-current` detects stale running processes. The checker compares:

- `/proc/<pid>/exe` for the running service process
- the unit `ExecStart` binary
- optional `--expected-binary`

```bash
scripts/check-runtime-current.sh --mode systemd --expected-binary target/release/yarr
just runtime-current
```

If hashes differ, install the new binary and restart the unit.

## Logging

With systemd, logs go to the journal:

```bash
journalctl --user -u yarr-mcp.service -f
journalctl --user -u yarr-mcp.service --since "1h ago"
```

The binary also writes structured JSON logs to `~/.yarr/logs/yarr.log` regardless of deployment mode (see `docs/OBSERVABILITY.md`).

## Doctor pre-flight

Run `yarr doctor` before starting the unit to validate the environment:

```bash
yarr doctor
```

Exit code 0 = ready to start. Exit code 1 = one or more issues found.

## Environment

Prefer an `EnvironmentFile` that points at the repo or appdata `.env`. See `docs/ENV.md` for variable meanings.

See `docs/PATTERNS.md` §46, §47, §48 for binary commands, installation, and the doctor command patterns.
