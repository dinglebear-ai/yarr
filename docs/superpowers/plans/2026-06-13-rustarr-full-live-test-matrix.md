# Rustarr Full Live Test Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an opt-in, shart-only live test suite that proves every Rustarr CLI command, MCP tool path, HTTP API route, and service action works against the actual configured media automation services with semantic success and expected-error assertions.

**Architecture:** Use the existing `xtask/` crate as the canonical automation home. Add `cargo xtask live --suite <guard|cli|rest|mcp|services|all>` with focused Rust modules for shart env guarding, service matrix loading, process execution, blocking HTTP/MCP calls, semantic assertions, report writing, and server lifecycle. Keep `just` recipes as thin aliases to `cargo xtask live`; keep shell scripts only as legacy compatibility wrappers.

**Tech Stack:** Rust xtask crate, `serde`, `serde_json`, `ureq`, `roxmltree`, Rustarr release binary, Justfile aliases, JSON live matrix, shart live media stack, Streamable HTTP MCP JSON-RPC.

---

## Scope And Coverage Contract

Rustarr currently exposes five MCP business actions in `src/actions.rs`: `help`, `integrations`, `service_status`, `api_get`, and `api_post`. The CLI exposes those same business actions through `help`, `integrations`, `status`, `get`, and `post`, plus infrastructure commands: `doctor`, `watch`, `setup check`, `setup repair`, `setup install`, `setup plugin-hook`, `serve`, `mcp`, `--help`, and `--version`. The HTTP server exposes `/health`, `/ready`, `/status`, and `POST /mcp`.

The full live suite must test this matrix:

| Surface | Required live checks |
|---|---|
| CLI business commands | `help`, `integrations`, `status --service`, `get --service --path`, `post --service --path --body --confirm`, `post` without `--confirm` |
| CLI infrastructure commands | `--help`, `--version`, `doctor --json`, `watch` against a loopback server with timeout, `setup check`, `setup plugin-hook --no-repair`; `serve` and `mcp` through the running server harness |
| MCP protocol | `initialize`, `tools/list`, `tools/call` for all actions, `resources/list`, schema resource read, `prompts/list`, `prompts/get quick_start`, read/write scope behavior when auth is enabled |
| HTTP routes | `GET /health`, `GET /ready`, `GET /status`, `POST /mcp`, one unknown route returning 404 |
| Service action matrix | For every `ServiceKind`: `service_status(service)`, at least one semantic `api_get`, `api_post` confirm guard, and one safe `api_post` expected-error call that reaches the upstream service without mutating data |

The suite is complete only when all 15 supported service kinds are configured on shart:

```text
sonarr, radarr, prowlarr, tautulli, overseerr, bazarr, tracearr, lidarr,
readarr, sabnzbd, qbittorrent, wizarr, notifiarr, plex, jellyfin
```

At the time this plan was written, the shart env was known to cover 12 initialized services and intentionally excluded `lidarr`, `readarr`, and initialized `wizarr`. The full runner must therefore fail with a clear `missing required service kind` error until those are added to `/home/jmagar/.rustarr-shart/.env`.

## File Structure

- Modify `xtask/Cargo.toml`
  - Add small automation dependencies: `serde`, `serde_json`, `ureq`, and `roxmltree`.
- Modify `xtask/src/main.rs`
  - Add `mod live;`, route `cargo xtask live`, and update help text.
- Create `xtask/src/live.rs`
  - CLI parsing for `--suite`, workspace-root orchestration, summary printing, and exit code handling.
- Create `xtask/src/live/assertions.rs`
  - JSON path, JSON type, substring, XML root, and expected-error assertions.
- Create `xtask/src/live/guard.rs`
  - Shart-only env loader and validator. This is the single source of truth for live-test safety.
- Create `xtask/src/live/http.rs`
  - Blocking HTTP helpers for REST routes and MCP JSON-RPC calls.
- Create `xtask/src/live/matrix.rs`
  - Typed loader for `tests/live/service_matrix.json`.
- Create `xtask/src/live/process.rs`
  - Rustarr binary command runner, local server lifecycle, fixed live-test env construction, timeout handling.
- Create `xtask/src/live/report.rs`
  - In-memory checks and `target/live-full/report.json` writer.
- Create `xtask/src/live_tests.rs`
  - Unit tests for guard behavior, matrix coverage, and assertion helpers.
- Modify `xtask/src/main.rs`
  - Include `#[cfg(test)] #[path = "live_tests.rs"] mod live_tests;` to keep the repo's sidecar test convention.
- Create `tests/live/service_matrix.json`
  - Declarative service coverage matrix for all 15 supported kinds.
- Modify `scripts/live-read-smoke.sh`
  - Keep it as legacy quick smoke, but make it call `cargo xtask live --suite guard --allow-partial` before doing any live calls.
- Modify `tests/mcporter/test-mcp.sh`
  - Make the legacy MCP harness shart-only by calling `cargo xtask live --suite guard`.
- Modify `Justfile`
  - Add thin aliases: `live-full-test`, `live-full-cli`, `live-full-rest`, `live-full-mcp`, `live-full-services`, `live-full-guard`.
- Modify `docs/TESTING.md`, `docs/MCPORTER.md`, `docs/SCRIPTS.md`, `docs/XTASKS.md`, `docs/JUSTFILE.md`, and `scripts/README.md`
  - Document the canonical `cargo xtask live` surface and the `just` aliases.

## Task 1: Add xtask Dependencies And Command Routing

**Files:**
- Modify: `xtask/Cargo.toml`
- Modify: `xtask/src/main.rs`

- [ ] **Step 1: Add failing command expectation**

Run:

```bash
cargo xtask live --suite guard
```

Expected:

```text
Error: Unknown xtask command: "live"
```

- [ ] **Step 2: Add xtask dependencies**

Modify `xtask/Cargo.toml` dependencies to:

```toml
[dependencies]
anyhow = "1"
walkdir = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
ureq = { version = "2", default-features = false, features = ["json"] }
roxmltree = "0.20"
```

- [ ] **Step 3: Route the live command**

In `xtask/src/main.rs`, add the module next to `mod patterns;`:

```rust
mod live;
mod patterns;
```

Add the match arm:

```rust
        Some("live") => live::run(&args[1..]),
```

Add this line to the command list in the file header:

```rust
//!   live         Run shart-only live tests against the real Rustarr service stack
```

Add this line to `print_help()`:

```rust
    println!("  live [--suite guard|cli|rest|mcp|services|all] [--allow-partial]");
```

- [ ] **Step 4: Add the live module stub**

Create `xtask/src/live.rs`:

```rust
use anyhow::{bail, Result};

pub fn run(args: &[String]) -> Result<()> {
    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        print_help();
        return Ok(());
    }
    bail!("live runner is not implemented yet");
}

fn print_help() {
    println!("cargo xtask live --suite <guard|cli|rest|mcp|services|all>");
    println!("  --allow-partial  Only permitted for legacy live-read-smoke guard checks");
}
```

- [ ] **Step 5: Run command and verify the new failure moved forward**

Run:

```bash
cargo xtask live --suite guard
```

Expected:

```text
Error: live runner is not implemented yet
```

- [ ] **Step 6: Commit the command skeleton**

Run:

```bash
git add xtask/Cargo.toml xtask/src/main.rs xtask/src/live.rs
git commit -m "test: add xtask live command skeleton"
```

Expected: commit succeeds.

## Task 2: Implement Shart Guard In xtask

**Files:**
- Create: `xtask/src/live/guard.rs`
- Modify: `xtask/src/live.rs`
- Create: `xtask/src/live_tests.rs`
- Modify: `xtask/src/main.rs`

- [ ] **Step 1: Add sidecar tests**

Append this test module include to `xtask/src/main.rs`:

```rust
#[cfg(test)]
#[path = "live_tests.rs"]
mod live_tests;
```

Create `xtask/src/live_tests.rs`:

```rust
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use crate::live::guard::{validate_env, SHART_HOME};

fn good_env() -> BTreeMap<String, String> {
    let mut env = BTreeMap::new();
    env.insert("RUSTARR_HOME".into(), SHART_HOME.into());
    env.insert("RUSTARR_SERVICES".into(), "sonarr,radarr,prowlarr,tautulli,overseerr,bazarr,tracearr,lidarr,readarr,sabnzbd,qbittorrent,wizarr,notifiarr,plex,jellyfin".into());
    for (name, kind, port) in [
        ("SONARR", "sonarr", "8989"),
        ("RADARR", "radarr", "7878"),
        ("PROWLARR", "prowlarr", "9696"),
        ("TAUTULLI", "tautulli", "8181"),
        ("OVERSEERR", "overseerr", "5055"),
        ("BAZARR", "bazarr", "6767"),
        ("TRACEARR", "tracearr", "8686"),
        ("LIDARR", "lidarr", "8687"),
        ("READARR", "readarr", "8787"),
        ("SABNZBD", "sabnzbd", "8080"),
        ("QBITTORRENT", "qbittorrent", "8081"),
        ("WIZARR", "wizarr", "5690"),
        ("NOTIFIARR", "notifiarr", "5454"),
        ("PLEX", "plex", "32400"),
        ("JELLYFIN", "jellyfin", "8096"),
    ] {
        env.insert(format!("RUSTARR_{name}_URL"), format!("http://shart.manatee-triceratops.ts.net:{port}"));
        env.insert(format!("RUSTARR_{name}_KIND"), kind.into());
    }
    env
}

#[test]
fn guard_accepts_complete_shart_env() {
    let env = good_env();
    let result = validate_env(env, false).expect("complete shart env should pass");
    assert_eq!(result.services.len(), 15);
    assert_eq!(result.kinds["sonarr"], "sonarr");
}

#[test]
fn guard_rejects_live_home() {
    let mut env = good_env();
    env.insert("RUSTARR_HOME".into(), "/home/jmagar/.rustarr".into());
    let err = validate_env(env, false).unwrap_err().to_string();
    assert!(err.contains("RUSTARR_HOME must be /home/jmagar/.rustarr-shart"));
}

#[test]
fn guard_rejects_tootie_url_override() {
    let mut env = good_env();
    env.insert("RUSTARR_SONARR_URL".into(), "https://sonarr.tootie.tv".into());
    let err = validate_env(env, false).unwrap_err().to_string();
    assert!(err.contains("is not a shart URL"));
}

#[test]
fn guard_rejects_missing_required_kind() {
    let mut env = good_env();
    env.insert("RUSTARR_SERVICES".into(), "sonarr,radarr".into());
    let err = validate_env(env, false).unwrap_err().to_string();
    assert!(err.contains("missing required service kind"));
}

#[test]
fn guard_parses_env_file() {
    let path = Path::new("target/live-test-env");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, "RUSTARR_SERVICES=sonarr\nRUSTARR_SONARR_URL=http://shart.manatee-triceratops.ts.net:8989\nRUSTARR_SONARR_KIND=sonarr\n").unwrap();
    let env = crate::live::guard::read_env_file(path).unwrap();
    assert_eq!(env["RUSTARR_SONARR_KIND"], "sonarr");
}
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
cargo test -p xtask guard_
```

Expected:

```text
unresolved import `crate::live::guard`
```

- [ ] **Step 3: Implement guard module**

Create `xtask/src/live/guard.rs`:

```rust
use anyhow::{bail, Context, Result};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

pub const SHART_HOME: &str = "/home/jmagar/.rustarr-shart";
pub const DEFAULT_ENV_FILE: &str = "/home/jmagar/.rustarr-shart/.env";

const REQUIRED_KINDS: &[&str] = &[
    "sonarr", "radarr", "prowlarr", "tautulli", "overseerr", "bazarr", "tracearr",
    "lidarr", "readarr", "sabnzbd", "qbittorrent", "wizarr", "notifiarr", "plex",
    "jellyfin",
];

#[derive(Debug, Clone)]
pub struct GuardedEnv {
    pub values: BTreeMap<String, String>,
    pub services: Vec<String>,
    pub kinds: BTreeMap<String, String>,
}

pub fn load(env_file: Option<PathBuf>, allow_partial: bool) -> Result<GuardedEnv> {
    let path = env_file.unwrap_or_else(|| PathBuf::from(DEFAULT_ENV_FILE));
    let mut values = read_env_file(&path)?;
    for (key, value) in std::env::vars() {
        if key.starts_with("RUSTARR_") {
            values.insert(key, value);
        }
    }
    values
        .entry("RUSTARR_HOME".into())
        .or_insert_with(|| SHART_HOME.into());
    validate_env(values, allow_partial)
}

pub fn read_env_file(path: &Path) -> Result<BTreeMap<String, String>> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read shart env file {}", path.display()))?;
    let mut values = BTreeMap::new();
    for line in raw.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        values.insert(key.trim().to_string(), unquote(value.trim()));
    }
    Ok(values)
}

pub fn validate_env(values: BTreeMap<String, String>, allow_partial: bool) -> Result<GuardedEnv> {
    let home = values.get("RUSTARR_HOME").map(String::as_str).unwrap_or(SHART_HOME);
    if home != SHART_HOME {
        bail!("RUSTARR_HOME must be {SHART_HOME}; got {home}");
    }

    let services: Vec<String> = values
        .get("RUSTARR_SERVICES")
        .map(String::as_str)
        .unwrap_or("")
        .split(',')
        .map(str::trim)
        .filter(|part| !part.is_empty())
        .map(str::to_string)
        .collect();
    if services.is_empty() {
        bail!("RUSTARR_SERVICES is empty");
    }

    let mut kinds = BTreeMap::new();
    for service in &services {
        let env_name = env_name(service);
        let url_key = format!("RUSTARR_{env_name}_URL");
        let kind_key = format!("RUSTARR_{env_name}_KIND");
        let url = values
            .get(&url_key)
            .with_context(|| format!("missing {url_key}"))?;
        assert_shart_url(&url_key, url)?;
        let kind = values.get(&kind_key).map(String::as_str).unwrap_or(service);
        kinds.insert(service.clone(), kind.to_ascii_lowercase());
    }

    if !allow_partial {
        let actual: BTreeSet<_> = kinds.values().map(String::as_str).collect();
        for required in REQUIRED_KINDS {
            if !actual.contains(required) {
                bail!("missing required service kind: {required}");
            }
        }
    }

    Ok(GuardedEnv { values, services, kinds })
}

pub fn required_kinds() -> BTreeSet<&'static str> {
    REQUIRED_KINDS.iter().copied().collect()
}

fn assert_shart_url(key: &str, value: &str) -> Result<()> {
    let lower = value.to_ascii_lowercase();
    let allowed = [
        "http://shart:",
        "https://shart:",
        "http://shart.manatee-triceratops.ts.net:",
        "https://shart.manatee-triceratops.ts.net:",
        "http://100.118.209.1:",
        "https://100.118.209.1:",
    ];
    if !allowed.iter().any(|prefix| lower.starts_with(prefix)) {
        bail!("{key}={value} is not a shart URL");
    }
    Ok(())
}

fn env_name(service: &str) -> String {
    service
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch.to_ascii_uppercase() } else { '_' })
        .collect()
}

fn unquote(value: &str) -> String {
    value
        .strip_prefix('"')
        .and_then(|v| v.strip_suffix('"'))
        .or_else(|| value.strip_prefix('\'').and_then(|v| v.strip_suffix('\'')))
        .unwrap_or(value)
        .to_string()
}
```

In `xtask/src/live.rs`, expose the module and make `guard` runnable:

```rust
use anyhow::{bail, Result};

pub mod guard;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Suite {
    Guard,
    Cli,
    Rest,
    Mcp,
    Services,
    All,
}

pub fn run(args: &[String]) -> Result<()> {
    let options = Options::parse(args)?;
    match options.suite {
        Suite::Guard => {
            let guarded = guard::load(None, options.allow_partial)?;
            println!("PASS guard complete shart env: {} services", guarded.services.len());
            Ok(())
        }
        _ => bail!("suite {:?} is not implemented yet", options.suite),
    }
}

#[derive(Debug)]
struct Options {
    suite: Suite,
    allow_partial: bool,
}

impl Options {
    fn parse(args: &[String]) -> Result<Self> {
        let mut suite = Suite::All;
        let mut allow_partial = false;
        let mut index = 0;
        while index < args.len() {
            match args[index].as_str() {
                "--help" | "-h" => {
                    print_help();
                    std::process::exit(0);
                }
                "--allow-partial" => allow_partial = true,
                "--suite" => {
                    index += 1;
                    let value = args.get(index).map(String::as_str).unwrap_or("");
                    suite = match value {
                        "guard" => Suite::Guard,
                        "cli" => Suite::Cli,
                        "rest" => Suite::Rest,
                        "mcp" => Suite::Mcp,
                        "services" => Suite::Services,
                        "all" => Suite::All,
                        _ => bail!("unknown live suite: {value}"),
                    };
                }
                other => bail!("unknown live option: {other}"),
            }
            index += 1;
        }
        Ok(Self { suite, allow_partial })
    }
}

fn print_help() {
    println!("cargo xtask live --suite <guard|cli|rest|mcp|services|all>");
    println!("  --allow-partial  Only permitted for legacy live-read-smoke guard checks");
}
```

- [ ] **Step 4: Run guard tests**

Run:

```bash
cargo test -p xtask guard_
```

Expected:

```text
test result: ok. 5 passed
```

- [ ] **Step 5: Run guard command**

Run:

```bash
cargo xtask live --suite guard --allow-partial
```

Expected while the shart stack is still partial:

```text
PASS guard complete shart env:
```

Run:

```bash
cargo xtask live --suite guard
```

Expected before all 15 services are configured:

```text
missing required service kind:
```

- [ ] **Step 6: Commit the guard**

Run:

```bash
git add xtask/src/main.rs xtask/src/live.rs xtask/src/live/guard.rs xtask/src/live_tests.rs
git commit -m "test: add shart-only guard to xtask live"
```

Expected: commit succeeds.

## Task 3: Bring Shart To Complete ServiceKind Coverage

**Files:**
- Remote review: shart compose files under the existing rustarr media test stack location
- Remote update: `/home/jmagar/.rustarr-shart/.env`
- Documentation: `docs/TESTING.md`

- [ ] **Step 1: Confirm current missing service kinds**

Run:

```bash
cargo xtask live --suite guard
```

Expected before this task is complete:

```text
missing required service kind: lidarr
```

- [ ] **Step 2: Add or start Lidarr on shart**

On shart, add a Lidarr service to the existing test compose stack with appdata rooted in the curated test config tree:

```yaml
lidarr:
  image: lscr.io/linuxserver/lidarr:latest
  container_name: rustarr-test-lidarr
  environment:
    - PUID=99
    - PGID=100
    - TZ=America/New_York
  volumes:
    - /mnt/user/lab/live/golden/lidarr:/config
    - /mnt/user/lab/live/media:/media
  ports:
    - "8687:8686"
  restart: unless-stopped
```

Run on shart:

```bash
docker compose up -d lidarr
docker ps --filter name=rustarr-test-lidarr --format '{{.Names}} {{.Status}}'
```

Expected:

```text
rustarr-test-lidarr Up
```

- [ ] **Step 3: Add or start Readarr on shart**

On shart, add a Readarr service to the same stack:

```yaml
readarr:
  image: lscr.io/linuxserver/readarr:develop
  container_name: rustarr-test-readarr
  environment:
    - PUID=99
    - PGID=100
    - TZ=America/New_York
  volumes:
    - /mnt/user/lab/live/golden/readarr:/config
    - /mnt/user/lab/live/media:/media
  ports:
    - "8787:8787"
  restart: unless-stopped
```

Run on shart:

```bash
docker compose up -d readarr
docker ps --filter name=rustarr-test-readarr --format '{{.Names}} {{.Status}}'
```

Expected:

```text
rustarr-test-readarr Up
```

- [ ] **Step 4: Initialize Wizarr on shart**

Open Wizarr on shart and complete the first-run setup using test-only credentials. Then verify the status endpoint no longer returns first-run 401.

Run from dookie:

```bash
curl -fsS http://shart.manatee-triceratops.ts.net:5690/api/status
```

Expected response contains:

```json
{"status":"ok"}
```

- [ ] **Step 5: Extract Lidarr and Readarr API keys**

Run from dookie:

```bash
ssh shart "sed -n 's:.*<ApiKey>\\(.*\\)</ApiKey>.*:\\1:p' /mnt/user/lab/live/golden/lidarr/config.xml"
ssh shart "sed -n 's:.*<ApiKey>\\(.*\\)</ApiKey>.*:\\1:p' /mnt/user/lab/live/golden/readarr/config.xml"
```

Expected: each command prints one non-empty API key line.

- [ ] **Step 6: Update `/home/jmagar/.rustarr-shart/.env`**

Run this command from dookie. It updates the service list and inserts the exact API keys extracted from shart without printing them into git-tracked files:

```bash
LIDARR_KEY="$(ssh shart "sed -n 's:.*<ApiKey>\\(.*\\)</ApiKey>.*:\\1:p' /mnt/user/lab/live/golden/lidarr/config.xml")"
READARR_KEY="$(ssh shart "sed -n 's:.*<ApiKey>\\(.*\\)</ApiKey>.*:\\1:p' /mnt/user/lab/live/golden/readarr/config.xml")"
python3 - <<'PY'
import os
from pathlib import Path

path = Path("/home/jmagar/.rustarr-shart/.env")
values = {}
for line in path.read_text().splitlines():
    if "=" in line and not line.lstrip().startswith("#"):
        key, value = line.split("=", 1)
        values[key] = value

values["RUSTARR_SERVICES"] = "sonarr,radarr,prowlarr,tautulli,overseerr,bazarr,tracearr,lidarr,readarr,sabnzbd,qbittorrent,wizarr,notifiarr,plex,jellyfin"
values["RUSTARR_LIDARR_URL"] = "http://shart.manatee-triceratops.ts.net:8687"
values["RUSTARR_LIDARR_KIND"] = "lidarr"
values["RUSTARR_LIDARR_API_KEY"] = os.environ["LIDARR_KEY"]
values["RUSTARR_READARR_URL"] = "http://shart.manatee-triceratops.ts.net:8787"
values["RUSTARR_READARR_KIND"] = "readarr"
values["RUSTARR_READARR_API_KEY"] = os.environ["READARR_KEY"]
values["RUSTARR_WIZARR_URL"] = "http://shart.manatee-triceratops.ts.net:5690"
values["RUSTARR_WIZARR_KIND"] = "wizarr"

ordered = []
seen = set()
for line in path.read_text().splitlines():
    if "=" in line and not line.lstrip().startswith("#"):
        key = line.split("=", 1)[0]
        if key in values:
            ordered.append(f"{key}={values[key]}")
            seen.add(key)
        else:
            ordered.append(line)
    else:
        ordered.append(line)

for key in sorted(set(values) - seen):
    ordered.append(f"{key}={values[key]}")

path.write_text("\n".join(ordered) + "\n")
PY
```

Do not commit `/home/jmagar/.rustarr-shart/.env`; it is outside the repo and contains secrets.

- [ ] **Step 7: Verify complete guard passes**

Run:

```bash
cargo xtask live --suite guard
```

Expected:

```text
PASS guard complete shart env: 15 services
```

- [ ] **Step 8: Commit docs for the prerequisite**

Run:

```bash
git add docs/TESTING.md
git commit -m "docs: document full shart service prerequisites"
```

Expected: commit succeeds.

## Task 4: Define The Live Service Matrix

**Files:**
- Create: `tests/live/service_matrix.json`
- Create: `xtask/src/live/matrix.rs`
- Modify: `xtask/src/live_tests.rs`

- [ ] **Step 1: Create the matrix JSON**

Create `tests/live/service_matrix.json` with this complete service list:

```json
{
  "services": [
    {"name":"sonarr","kind":"sonarr","status":{"json_path":"appName","equals":"Sonarr"},"get":[{"path":"/api/v3/system/status","json_path":"appName","equals":"Sonarr"},{"path":"/api/v3/series","type":"array"}],"post_blocked":{"path":"/api/v3/system/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v3/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"radarr","kind":"radarr","status":{"json_path":"appName","equals":"Radarr"},"get":[{"path":"/api/v3/system/status","json_path":"appName","equals":"Radarr"},{"path":"/api/v3/movie","type":"array"}],"post_blocked":{"path":"/api/v3/system/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v3/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"prowlarr","kind":"prowlarr","status":{"json_path":"appName","equals":"Prowlarr"},"get":[{"path":"/api/v1/system/status","json_path":"appName","equals":"Prowlarr"},{"path":"/api/v1/indexer","type":"array"}],"post_blocked":{"path":"/api/v1/system/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v1/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"tautulli","kind":"tautulli","status":{"json_path":"response.result","equals":"success"},"get":[{"path":"/api/v2?cmd=get_server_info","json_path":"response.result","equals":"success"}],"post_blocked":{"path":"/api/v2?cmd=get_server_info","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v2?cmd=__rustarr_live_post_probe__","body":{},"error_contains_any":["error","invalid","unknown","400","404"]}},
    {"name":"overseerr","kind":"overseerr","status":{"json_path":"version","type":"string"},"get":[{"path":"/api/v1/status","json_path":"version","type":"string"}],"post_blocked":{"path":"/api/v1/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v1/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"bazarr","kind":"bazarr","status":{"json_path":"bazarr_version","type":"string"},"get":[{"path":"/api/system/status","json_path":"bazarr_version","type":"string"}],"post_blocked":{"path":"/api/system/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"tracearr","kind":"tracearr","status":{"json_path":"status","equals_any":["ok","healthy"]},"get":[{"path":"/health","json_path":"status","equals_any":["ok","healthy"]}],"post_blocked":{"path":"/health","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"lidarr","kind":"lidarr","status":{"json_path":"appName","equals":"Lidarr"},"get":[{"path":"/api/v1/system/status","json_path":"appName","equals":"Lidarr"},{"path":"/api/v1/artist","type":"array"}],"post_blocked":{"path":"/api/v1/system/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v1/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"readarr","kind":"readarr","status":{"json_path":"appName","equals":"Readarr"},"get":[{"path":"/api/v1/system/status","json_path":"appName","equals":"Readarr"},{"path":"/api/v1/author","type":"array"}],"post_blocked":{"path":"/api/v1/system/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v1/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"sabnzbd","kind":"sabnzbd","status":{"json_path":"version","type":"string"},"get":[{"path":"/api?mode=version&output=json","json_path":"version","type":"string"},{"path":"/api?mode=queue&output=json","json_path":"queue","type":"object"}],"post_blocked":{"path":"/api?mode=version&output=json","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api?mode=__rustarr_live_post_probe__&output=json","body":{},"error_contains_any":["error","unknown","400"]}},
    {"name":"qbittorrent","kind":"qbittorrent","status":{"type":"string","contains":"qBittorrent"},"get":[{"path":"/api/v2/app/version","type":"string","contains":"qBittorrent"},{"path":"/api/v2/torrents/info","type":"array"}],"post_blocked":{"path":"/api/v2/app/version","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v2/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"wizarr","kind":"wizarr","status":{"json_path":"status","equals_any":["ok","healthy"]},"get":[{"path":"/api/status","json_path":"status","equals_any":["ok","healthy"]}],"post_blocked":{"path":"/api/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"notifiarr","kind":"notifiarr","status":{"json_path":"status","equals_any":["ok","success","healthy"]},"get":[{"path":"/api/v1/status","json_path":"status","equals_any":["ok","success","healthy"]}],"post_blocked":{"path":"/api/v1/status","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/api/v1/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"plex","kind":"plex","status":{"xml_root":"MediaContainer"},"get":[{"path":"/identity","xml_root":"MediaContainer"}],"post_blocked":{"path":"/identity","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}},
    {"name":"jellyfin","kind":"jellyfin","status":{"json_path":"ProductName","equals":"Jellyfin Server"},"get":[{"path":"/System/Info/Public","json_path":"ProductName","equals":"Jellyfin Server"}],"post_blocked":{"path":"/System/Info/Public","body":{},"error_contains":"confirm=true"},"post_expected_error":{"path":"/System/__rustarr_live_post_probe__","body":{},"error_contains_any":["404","405","Not Found","Method Not Allowed"]}}
  ]
}
```

- [ ] **Step 2: Add matrix loader**

Create `xtask/src/live/matrix.rs`:

```rust
use anyhow::{Context, Result};
use serde::Deserialize;
use serde_json::Value;
use std::path::Path;

#[derive(Debug, Deserialize)]
pub struct Matrix {
    pub services: Vec<ServiceCase>,
}

#[derive(Debug, Deserialize)]
pub struct ServiceCase {
    pub name: String,
    pub kind: String,
    pub status: Expectation,
    pub get: Vec<GetCase>,
    pub post_blocked: PostCase,
    pub post_expected_error: PostExpectedError,
}

#[derive(Debug, Deserialize)]
pub struct GetCase {
    pub path: String,
    #[serde(flatten)]
    pub expectation: Expectation,
}

#[derive(Debug, Deserialize)]
pub struct PostCase {
    pub path: String,
    pub body: Value,
    pub error_contains: String,
}

#[derive(Debug, Deserialize)]
pub struct PostExpectedError {
    pub path: String,
    pub body: Value,
    pub error_contains_any: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Expectation {
    pub json_path: Option<String>,
    pub equals: Option<Value>,
    pub equals_any: Option<Vec<Value>>,
    #[serde(rename = "type")]
    pub value_type: Option<String>,
    pub contains: Option<String>,
    pub xml_root: Option<String>,
}

pub fn load(path: &Path) -> Result<Matrix> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read live matrix {}", path.display()))?;
    serde_json::from_str(&raw).context("failed to parse live service matrix")
}
```

Add to `xtask/src/live.rs`:

```rust
pub mod matrix;
```

- [ ] **Step 3: Add matrix coverage test**

Append to `xtask/src/live_tests.rs`:

```rust
#[test]
fn matrix_covers_all_required_service_kinds() {
    let matrix = crate::live::matrix::load(Path::new("tests/live/service_matrix.json")).unwrap();
    let kinds: std::collections::BTreeSet<_> = matrix.services.iter().map(|service| service.kind.as_str()).collect();
    assert_eq!(kinds, crate::live::guard::required_kinds());
    for service in &matrix.services {
        assert!(!service.get.is_empty(), "{} needs at least one GET case", service.name);
        assert!(!service.post_expected_error.error_contains_any.is_empty(), "{} needs expected-error tokens", service.name);
    }
}
```

- [ ] **Step 4: Run matrix tests**

Run:

```bash
cargo test -p xtask matrix_covers_all_required_service_kinds
```

Expected:

```text
test result: ok. 1 passed
```

- [ ] **Step 5: Commit the matrix**

Run:

```bash
git add tests/live/service_matrix.json xtask/src/live.rs xtask/src/live/matrix.rs xtask/src/live_tests.rs
git commit -m "test: define xtask live service matrix"
```

Expected: commit succeeds.

## Task 5: Add Report, Assertion, Process, And HTTP Helpers

**Files:**
- Create: `xtask/src/live/assertions.rs`
- Create: `xtask/src/live/http.rs`
- Create: `xtask/src/live/process.rs`
- Create: `xtask/src/live/report.rs`
- Modify: `xtask/src/live.rs`
- Modify: `xtask/src/live_tests.rs`

- [ ] **Step 1: Add module exports**

Add to `xtask/src/live.rs`:

```rust
pub mod assertions;
pub mod http;
pub mod process;
pub mod report;
```

- [ ] **Step 2: Implement report helper**

Create `xtask/src/live/report.rs`:

```rust
use anyhow::{Context, Result};
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct Check {
    pub name: String,
    pub passed: bool,
    pub detail: String,
}

#[derive(Default)]
pub struct Report {
    checks: Vec<Check>,
}

impl Report {
    pub fn pass(&mut self, name: impl Into<String>, detail: impl Into<String>) {
        let check = Check { name: name.into(), passed: true, detail: detail.into() };
        println!("PASS {}: {}", check.name, check.detail);
        self.checks.push(check);
    }

    pub fn fail(&mut self, name: impl Into<String>, detail: impl Into<String>) {
        let check = Check { name: name.into(), passed: false, detail: detail.into() };
        println!("FAIL {}: {}", check.name, check.detail);
        self.checks.push(check);
    }

    pub fn is_success(&self) -> bool {
        self.checks.iter().all(|check| check.passed)
    }

    pub fn len(&self) -> usize {
        self.checks.len()
    }

    pub fn write_json(&self, path: &Path) -> Result<()> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("failed to create {}", parent.display()))?;
        }
        let raw = serde_json::to_string_pretty(&self.checks)?;
        std::fs::write(path, raw).with_context(|| format!("failed to write {}", path.display()))
    }
}
```

- [ ] **Step 3: Implement assertions**

Create `xtask/src/live/assertions.rs`:

```rust
use anyhow::{bail, Result};
use serde_json::Value;

use super::matrix::Expectation;

pub fn assert_value(value: &Value, expectation: &Expectation) -> Result<()> {
    let node = if let Some(path) = &expectation.json_path {
        json_path(value, path)?
    } else {
        value
    };

    if let Some(expected_type) = &expectation.value_type {
        let ok = matches!(
            (expected_type.as_str(), node),
            ("array", Value::Array(_)) | ("object", Value::Object(_)) | ("string", Value::String(_))
        );
        if !ok {
            bail!("expected type {expected_type}, got {node}");
        }
    }
    if let Some(expected) = &expectation.equals {
        if node != expected {
            bail!("expected {expected}, got {node}");
        }
    }
    if let Some(expected_values) = &expectation.equals_any {
        if !expected_values.iter().any(|expected| expected == node) {
            bail!("expected one of {expected_values:?}, got {node}");
        }
    }
    if let Some(needle) = &expectation.contains {
        let haystack = node.as_str().unwrap_or("");
        if !haystack.contains(needle) {
            bail!("expected {haystack:?} to contain {needle:?}");
        }
    }
    Ok(())
}

pub fn assert_text(text: &str, expectation: &Expectation) -> Result<()> {
    if let Some(root_name) = &expectation.xml_root {
        let doc = roxmltree::Document::parse(text)?;
        let root = doc.root_element().tag_name().name().to_string();
        if &root != root_name {
            bail!("expected XML root {root_name}, got {root}");
        }
        return Ok(());
    }
    let value: Value = serde_json::from_str(text)?;
    assert_value(&value, expectation)
}

pub fn assert_expected_error(text: &str, tokens: &[String]) -> Result<()> {
    if tokens.iter().any(|token| text.contains(token)) {
        return Ok(());
    }
    bail!("expected error to contain one of {tokens:?}; got {text}");
}

fn json_path<'a>(value: &'a Value, path: &str) -> Result<&'a Value> {
    let mut node = value;
    for part in path.split('.') {
        node = node
            .get(part)
            .ok_or_else(|| anyhow::anyhow!("missing JSON path {path} at {part}"))?;
    }
    Ok(node)
}
```

- [ ] **Step 4: Implement process helper**

Create `xtask/src/live/process.rs`:

```rust
use anyhow::{bail, Context, Result};
use std::collections::BTreeMap;
use std::process::{Child, Command, Output, Stdio};
use std::time::{Duration, Instant};

use super::guard::GuardedEnv;

pub struct RustarrProcess {
    pub binary: String,
    pub env: BTreeMap<String, String>,
}

pub struct Server {
    child: Child,
}

impl RustarrProcess {
    pub fn new(binary: String, guarded: &GuardedEnv) -> Self {
        let mut env = guarded.values.clone();
        env.insert("RUSTARR_HOME".into(), super::guard::SHART_HOME.into());
        Self { binary, env }
    }

    pub fn output(&self, args: &[&str]) -> Result<Output> {
        let output = Command::new(&self.binary)
            .args(args)
            .envs(&self.env)
            .output()
            .with_context(|| format!("failed to run {} {}", self.binary, args.join(" ")))?;
        Ok(output)
    }

    pub fn json(&self, args: &[&str]) -> Result<serde_json::Value> {
        let output = self.output(args)?;
        if !output.status.success() {
            bail!("{}", String::from_utf8_lossy(&output.stderr));
        }
        serde_json::from_slice(&output.stdout).context("failed to parse Rustarr CLI JSON")
    }

    pub fn start_server(&self, port: u16) -> Result<Server> {
        let mut env = self.env.clone();
        env.insert("RUSTARR_MCP_HOST".into(), "127.0.0.1".into());
        env.insert("RUSTARR_MCP_PORT".into(), port.to_string());
        env.insert("RUSTARR_MCP_NO_AUTH".into(), "true".into());
        let child = Command::new(&self.binary)
            .args(["serve", "mcp"])
            .envs(env)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .context("failed to start Rustarr MCP server")?;
        Ok(Server { child })
    }
}

impl Server {
    pub fn wait_healthy(&mut self, base_url: &str) -> Result<()> {
        let deadline = Instant::now() + Duration::from_secs(20);
        while Instant::now() < deadline {
            if let Ok(response) = ureq::get(&format!("{base_url}/health")).call() {
                if response.status() == 200 {
                    return Ok(());
                }
            }
            std::thread::sleep(Duration::from_millis(250));
        }
        bail!("Rustarr server did not become healthy at {base_url}");
    }
}

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
```

- [ ] **Step 5: Implement HTTP helper**

Create `xtask/src/live/http.rs`:

```rust
use anyhow::{bail, Result};
use serde_json::{json, Value};

pub fn get_text(url: &str) -> Result<(u16, String)> {
    match ureq::get(url).call() {
        Ok(response) => Ok((response.status(), response.into_string()?)),
        Err(ureq::Error::Status(status, response)) => Ok((status, response.into_string()?)),
        Err(err) => bail!(err),
    }
}

pub fn mcp(base_url: &str, method: &str, params: Option<Value>, id: u64) -> Result<Value> {
    let mut body = json!({"jsonrpc":"2.0","id":id,"method":method});
    if let Some(params) = params {
        body["params"] = params;
    }
    let response = ureq::post(&format!("{base_url}/mcp")).send_json(body)?;
    let payload: Value = response.into_json()?;
    if let Some(error) = payload.get("error") {
        bail!("{error}");
    }
    Ok(payload["result"].clone())
}

pub fn mcp_tool(base_url: &str, arguments: Value, id: u64) -> Result<Value> {
    let result = mcp(
        base_url,
        "tools/call",
        Some(json!({"name":"rustarr","arguments":arguments})),
        id,
    )?;
    let text = result["content"][0]["text"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("MCP tool did not return text content"))?;
    Ok(serde_json::from_str(text)?)
}
```

- [ ] **Step 6: Add assertion tests**

Append to `xtask/src/live_tests.rs`:

```rust
#[test]
fn assertions_check_json_path_and_xml_root() {
    let json_expectation = crate::live::matrix::Expectation {
        json_path: Some("response.result".into()),
        equals: Some(serde_json::json!("success")),
        equals_any: None,
        value_type: None,
        contains: None,
        xml_root: None,
    };
    crate::live::assertions::assert_value(
        &serde_json::json!({"response":{"result":"success"}}),
        &json_expectation,
    )
    .unwrap();

    let xml_expectation = crate::live::matrix::Expectation {
        json_path: None,
        equals: None,
        equals_any: None,
        value_type: None,
        contains: None,
        xml_root: Some("MediaContainer".into()),
    };
    crate::live::assertions::assert_text("<MediaContainer machineIdentifier=\"test\" />", &xml_expectation).unwrap();
}
```

- [ ] **Step 7: Run helper tests**

Run:

```bash
cargo test -p xtask live_tests
```

Expected:

```text
test result: ok.
```

- [ ] **Step 8: Commit helper modules**

Run:

```bash
git add xtask/src/live.rs xtask/src/live/assertions.rs xtask/src/live/http.rs xtask/src/live/process.rs xtask/src/live/report.rs xtask/src/live_tests.rs
git commit -m "test: add xtask live runner helpers"
```

Expected: commit succeeds.

## Task 6: Implement CLI Suite In xtask

**Files:**
- Modify: `xtask/src/live.rs`

- [ ] **Step 1: Add runner context and CLI suite**

Replace the body of `xtask/src/live.rs` after the module declarations with this orchestration shape:

```rust
use anyhow::{bail, Result};
use serde_json::json;
use std::path::Path;

pub mod assertions;
pub mod guard;
pub mod http;
pub mod matrix;
pub mod process;
pub mod report;

const MATRIX_PATH: &str = "tests/live/service_matrix.json";
const REPORT_PATH: &str = "target/live-full/report.json";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Suite { Guard, Cli, Rest, Mcp, Services, All }

pub fn run(args: &[String]) -> Result<()> {
    let options = Options::parse(args)?;
    let guarded = guard::load(None, options.allow_partial)?;
    let matrix = matrix::load(Path::new(MATRIX_PATH))?;
    let binary = std::env::var("RUSTARR_BIN").unwrap_or_else(|_| "target/release/rustarr".into());
    let rustarr = process::RustarrProcess::new(binary, &guarded);
    let mut report = report::Report::default();

    run_guard(&mut report, &guarded);
    match options.suite {
        Suite::Guard => {}
        Suite::Cli => run_cli(&mut report, &rustarr, &matrix)?,
        Suite::Rest => run_rest(&mut report, &rustarr)?,
        Suite::Mcp => run_mcp(&mut report, &rustarr, &matrix)?,
        Suite::Services => run_services(&mut report, &rustarr, &matrix)?,
        Suite::All => {
            run_cli(&mut report, &rustarr, &matrix)?;
            run_rest(&mut report, &rustarr)?;
            run_mcp(&mut report, &rustarr, &matrix)?;
            run_services(&mut report, &rustarr, &matrix)?;
        }
    }

    report.write_json(Path::new(REPORT_PATH))?;
    println!("{} live checks recorded in {REPORT_PATH}", report.len());
    if report.is_success() { Ok(()) } else { bail!("one or more live checks failed") }
}

fn run_guard(report: &mut report::Report, guarded: &guard::GuardedEnv) {
    report.pass("guard complete shart env", format!("{} services", guarded.services.len()));
}

fn run_cli(report: &mut report::Report, rustarr: &process::RustarrProcess, matrix: &matrix::Matrix) -> Result<()> {
    let version = rustarr.output(&["--version"])?;
    report.pass("cli --version", String::from_utf8_lossy(&version.stdout).trim());

    let help = rustarr.output(&["--help"])?;
    if !String::from_utf8_lossy(&help.stdout).contains("Usage:") {
        bail!("--help did not print usage");
    }
    report.pass("cli --help", "usage printed");

    let help_json = rustarr.json(&["help"])?;
    assertions::assert_value(&help_json, &matrix::Expectation {
        json_path: Some("actions".into()),
        equals: None,
        equals_any: None,
        value_type: Some("array".into()),
        contains: None,
        xml_root: None,
    })?;
    report.pass("cli help action", "structured help contains actions");

    let integrations = rustarr.json(&["integrations"])?;
    assertions::assert_value(&integrations, &matrix::Expectation {
        json_path: Some("configured".into()),
        equals: None,
        equals_any: None,
        value_type: Some("array".into()),
        contains: None,
        xml_root: None,
    })?;
    report.pass("cli integrations", "configured services returned");

    let doctor = rustarr.output(&["doctor", "--json"])?;
    if !doctor.status.success() {
        bail!("doctor --json failed: {}", String::from_utf8_lossy(&doctor.stderr));
    }
    report.pass("cli doctor --json", "doctor completed");

    for service in &matrix.services {
        let status = rustarr.json(&["status", "--service", &service.name])?;
        assertions::assert_value(&status, &service.status)?;
        report.pass(format!("cli status {}", service.name), "semantic status matched");

        for get_case in &service.get {
            let payload = rustarr.json(&["get", "--service", &service.name, "--path", &get_case.path])?;
            if get_case.expectation.xml_root.is_some() {
                assertions::assert_text(&payload.to_string(), &get_case.expectation)?;
            } else {
                assertions::assert_value(&payload, &get_case.expectation)?;
            }
            report.pass(format!("cli get {} {}", service.name, get_case.path), "semantic GET matched");
        }

        let body = service.post_blocked.body.to_string();
        let blocked = rustarr.output(&["post", "--service", &service.name, "--path", &service.post_blocked.path, "--body", &body])?;
        let combined = format!("{}{}", String::from_utf8_lossy(&blocked.stdout), String::from_utf8_lossy(&blocked.stderr));
        assertions::assert_expected_error(&combined, std::slice::from_ref(&service.post_blocked.error_contains))?;
        report.pass(format!("cli post confirm guard {}", service.name), "blocked before upstream mutation");
    }

    let setup_check = rustarr.output(&["setup", "check"])?;
    report.pass("cli setup check", format!("exit={}", setup_check.status.code().unwrap_or(-1)));

    let setup_hook = rustarr.output(&["setup", "plugin-hook", "--no-repair"])?;
    report.pass("cli setup plugin-hook --no-repair", format!("exit={}", setup_hook.status.code().unwrap_or(-1)));

    let mut server = rustarr.start_server(40070)?;
    server.wait_healthy("http://127.0.0.1:40070")?;
    let watch = rustarr.output(&["watch", "--url", "http://127.0.0.1:40070/health", "--interval", "1"])?;
    report.pass("cli watch", format!("exit={}", watch.status.code().unwrap_or(-1)));
    Ok(())
}
```

Keep `Options::parse()` and `print_help()` from Task 2 below these functions. Add `let _ = json!({});` only if the compiler reports an unused import; otherwise remove the `json` import.

- [ ] **Step 2: Run CLI suite**

Run:

```bash
cargo build --release
cargo xtask live --suite cli
```

Expected:

```text
PASS guard complete shart env
PASS cli --version
PASS cli integrations
PASS cli status sonarr
PASS cli post confirm guard sonarr
```

- [ ] **Step 3: Commit CLI suite**

Run:

```bash
git add xtask/src/live.rs
git commit -m "test: cover full live CLI surface in xtask"
```

Expected: commit succeeds.

## Task 7: Implement REST And MCP Suites In xtask

**Files:**
- Modify: `xtask/src/live.rs`

- [ ] **Step 1: Add REST suite**

Add this function to `xtask/src/live.rs`:

```rust
fn run_rest(report: &mut report::Report, rustarr: &process::RustarrProcess) -> Result<()> {
    let mut server = rustarr.start_server(40070)?;
    let base = "http://127.0.0.1:40070";
    server.wait_healthy(base)?;

    for (route, key) in [("/health", "status"), ("/ready", "ready"), ("/status", "server")] {
        let (status, body) = http::get_text(&format!("{base}{route}"))?;
        if status != 200 || !body.contains(key) {
            bail!("GET {route} expected 200 and {key}, got {status}: {body}");
        }
        report.pass(format!("rest GET {route}"), format!("status={status}"));
    }

    let (status, _) = http::get_text(&format!("{base}/__rustarr_live_missing_route__"))?;
    if status != 404 {
        bail!("missing route expected 404, got {status}");
    }
    report.pass("rest GET unknown route", "status=404");
    Ok(())
}
```

- [ ] **Step 2: Add MCP suite**

Add this function to `xtask/src/live.rs`:

```rust
fn run_mcp(report: &mut report::Report, rustarr: &process::RustarrProcess, matrix: &matrix::Matrix) -> Result<()> {
    let mut server = rustarr.start_server(40070)?;
    let base = "http://127.0.0.1:40070";
    server.wait_healthy(base)?;

    let init = http::mcp(base, "initialize", Some(json!({
        "protocolVersion": "2025-03-26",
        "capabilities": {},
        "clientInfo": {"name": "rustarr-live-test", "version": "1.0.0"}
    })), 1)?;
    assertions::assert_value(&init, &matrix::Expectation {
        json_path: Some("serverInfo.name".into()),
        equals: Some(json!("rustarr")),
        equals_any: None,
        value_type: None,
        contains: None,
        xml_root: None,
    })?;
    report.pass("mcp initialize", "rustarr");

    let tools = http::mcp(base, "tools/list", None, 2)?;
    if !tools.to_string().contains("\"rustarr\"") {
        bail!("tools/list did not advertise rustarr: {tools}");
    }
    report.pass("mcp tools/list", "rustarr tool advertised");

    let resources = http::mcp(base, "resources/list", None, 3)?;
    report.pass("mcp resources/list", format!("{} bytes", resources.to_string().len()));

    let prompts = http::mcp(base, "prompts/list", None, 4)?;
    if !prompts.to_string().contains("quick_start") {
        bail!("prompts/list did not advertise quick_start: {prompts}");
    }
    report.pass("mcp prompts/list", "quick_start advertised");

    let quick_start = http::mcp(base, "prompts/get", Some(json!({"name":"quick_start"})), 5)?;
    assertions::assert_value(&quick_start, &matrix::Expectation {
        json_path: Some("messages".into()),
        equals: None,
        equals_any: None,
        value_type: Some("array".into()),
        contains: None,
        xml_root: None,
    })?;
    report.pass("mcp prompts/get quick_start", "prompt returned messages");

    let help = http::mcp_tool(base, json!({"action":"help"}), 6)?;
    assertions::assert_value(&help, &matrix::Expectation {
        json_path: Some("actions".into()),
        equals: None,
        equals_any: None,
        value_type: Some("array".into()),
        contains: None,
        xml_root: None,
    })?;
    report.pass("mcp tool help", "structured help contains actions");

    for (idx, service) in matrix.services.iter().enumerate() {
        let id = 100 + idx as u64;
        let status = http::mcp_tool(base, json!({"action":"service_status","service":service.name}), id)?;
        assertions::assert_value(&status, &service.status)?;
        report.pass(format!("mcp service_status {}", service.name), "semantic status matched");

        for get_case in &service.get {
            let payload = http::mcp_tool(base, json!({"action":"api_get","service":service.name,"path":get_case.path}), id + 1000)?;
            assertions::assert_value(&payload, &get_case.expectation)?;
            report.pass(format!("mcp api_get {} {}", service.name, get_case.path), "semantic GET matched");
        }
    }
    Ok(())
}
```

- [ ] **Step 3: Run REST and MCP suites**

Run:

```bash
cargo xtask live --suite rest
cargo xtask live --suite mcp
```

Expected:

```text
PASS rest GET /health: status=200
PASS mcp initialize: rustarr
PASS mcp tools/list: rustarr tool advertised
PASS mcp service_status sonarr
```

- [ ] **Step 4: Commit REST and MCP suites**

Run:

```bash
git add xtask/src/live.rs
git commit -m "test: cover live REST and MCP surfaces in xtask"
```

Expected: commit succeeds.

## Task 8: Implement Dedicated Service Matrix Suite

**Files:**
- Modify: `xtask/src/live.rs`

- [ ] **Step 1: Add service suite**

Add this function to `xtask/src/live.rs`:

```rust
fn run_services(report: &mut report::Report, rustarr: &process::RustarrProcess, matrix: &matrix::Matrix) -> Result<()> {
    for service in &matrix.services {
        let status = rustarr.json(&["status", "--service", &service.name])?;
        assertions::assert_value(&status, &service.status)?;
        report.pass(format!("service_status {}", service.name), "semantic status matched");

        for get_case in &service.get {
            let payload = rustarr.json(&["get", "--service", &service.name, "--path", &get_case.path])?;
            assertions::assert_value(&payload, &get_case.expectation)?;
            report.pass(format!("api_get {} {}", service.name, get_case.path), "semantic GET matched");
        }

        let blocked_body = service.post_blocked.body.to_string();
        let blocked = rustarr.output(&["post", "--service", &service.name, "--path", &service.post_blocked.path, "--body", &blocked_body])?;
        let blocked_text = format!("{}{}", String::from_utf8_lossy(&blocked.stdout), String::from_utf8_lossy(&blocked.stderr));
        assertions::assert_expected_error(&blocked_text, std::slice::from_ref(&service.post_blocked.error_contains))?;
        report.pass(format!("api_post blocked {}", service.name), "confirm guard prevented mutation");

        let expected_body = service.post_expected_error.body.to_string();
        let expected = rustarr.output(&["post", "--service", &service.name, "--path", &service.post_expected_error.path, "--body", &expected_body, "--confirm"])?;
        let expected_text = format!("{}{}", String::from_utf8_lossy(&expected.stdout), String::from_utf8_lossy(&expected.stderr));
        assertions::assert_expected_error(&expected_text, &service.post_expected_error.error_contains_any)?;
        report.pass(format!("api_post safe upstream error {}", service.name), "safe expected error matched");
    }
    Ok(())
}
```

- [ ] **Step 2: Run service suite**

Run:

```bash
cargo xtask live --suite services
```

Expected:

```text
PASS service_status sonarr
PASS api_get sonarr /api/v3/system/status
PASS api_post blocked sonarr
PASS api_post safe upstream error sonarr
```

All 15 services must have the same four categories of checks.

- [ ] **Step 3: Commit service suite**

Run:

```bash
git add xtask/src/live.rs
git commit -m "test: execute full live service action matrix in xtask"
```

Expected: commit succeeds.

## Task 9: Add Just Aliases And Legacy Script Guards

**Files:**
- Modify: `Justfile`
- Modify: `scripts/live-read-smoke.sh`
- Modify: `tests/mcporter/test-mcp.sh`

- [ ] **Step 1: Add Just aliases**

Append these recipes to `Justfile`:

```make
live-full-guard:
	cargo xtask live --suite guard

live-full-cli:
	cargo build --release
	cargo xtask live --suite cli

live-full-rest:
	cargo build --release
	cargo xtask live --suite rest

live-full-mcp:
	cargo build --release
	cargo xtask live --suite mcp

live-full-services:
	cargo build --release
	cargo xtask live --suite services

live-full-test:
	cargo build --release
	cargo xtask live --suite all
```

- [ ] **Step 2: Guard legacy live smoke**

At the top of `scripts/live-read-smoke.sh`, after `REPO_ROOT` is set, add:

```bash
cargo xtask live --suite guard --allow-partial >/dev/null
```

This keeps the old smoke test alive while making it impossible to use against non-shart service URLs.

- [ ] **Step 3: Guard legacy mcporter harness**

At the top of `tests/mcporter/test-mcp.sh`, before loading env or starting a server, add:

```bash
cargo xtask live --suite guard >/dev/null
```

Remove any direct loading of `${HOME}/.rustarr/.env`.

- [ ] **Step 4: Run alias and legacy guard checks**

Run:

```bash
just live-full-guard
RUSTARR_HOME=/home/jmagar/.rustarr bash scripts/live-read-smoke.sh
```

Expected:

```text
PASS guard complete shart env: 15 services
RUSTARR_HOME must be /home/jmagar/.rustarr-shart
```

The second command must exit non-zero.

- [ ] **Step 5: Commit aliases and legacy guards**

Run:

```bash
git add Justfile scripts/live-read-smoke.sh tests/mcporter/test-mcp.sh
git commit -m "test: expose xtask live suite through just"
```

Expected: commit succeeds.

## Task 10: Update Documentation

**Files:**
- Modify: `docs/TESTING.md`
- Modify: `docs/MCPORTER.md`
- Modify: `docs/SCRIPTS.md`
- Modify: `docs/XTASKS.md`
- Modify: `docs/JUSTFILE.md`
- Modify: `scripts/README.md`

- [ ] **Step 1: Document the canonical command**

Add this section to `docs/TESTING.md`:

```md
## Full Shart Live Suite

`cargo xtask live --suite all` is the complete opt-in live test suite. `just live-full-test` is a thin alias that builds the release binary first and then delegates to the xtask command.

The suite starts the local Rustarr binary with `RUSTARR_HOME=/home/jmagar/.rustarr-shart`, refuses any service URL outside shart, and requires all 15 supported `ServiceKind`s to be configured before it runs.

The suite covers:

- every CLI business command and selected infrastructure commands
- every MCP business action through Streamable HTTP JSON-RPC
- `/health`, `/ready`, `/status`, and `/mcp`
- every supported service kind with semantic status, semantic GET, blocked POST, and safe expected-error POST checks

It is intentionally not part of `cargo test` because it requires the shart live stack and real credentials.
```

- [ ] **Step 2: Document xtask live**

Add this row to the command table in `docs/XTASKS.md`:

```md
| `cargo xtask live --suite all` | Run the shart-only full live Rustarr service matrix. |
```

Add this note below the table:

```md
`cargo xtask live` is the canonical implementation. `just live-full-test` and related Justfile recipes are convenience aliases only.
```

- [ ] **Step 3: Document legacy script status**

Add this note to `scripts/README.md` under `live-read-smoke.sh`:

```md
`live-read-smoke.sh` is a legacy quick smoke. It calls `cargo xtask live --suite guard --allow-partial` before any network traffic. The complete suite lives in `cargo xtask live --suite all`.
```

- [ ] **Step 4: Run docs grep**

Run:

```bash
rg -n '/home/jmagar/\.rustarr|tootie\.tv|cache_appdata' docs scripts tests -g '*.md' -g '*.sh'
```

Expected: no result instructs live tests to use `/home/jmagar/.rustarr`, `tootie.tv`, or `cache_appdata`. Results that document rejection examples are acceptable.

- [ ] **Step 5: Commit docs**

Run:

```bash
git add docs/TESTING.md docs/MCPORTER.md docs/SCRIPTS.md docs/XTASKS.md docs/JUSTFILE.md scripts/README.md
git commit -m "docs: document xtask live suite"
```

Expected: commit succeeds.

## Task 11: Final Verification And Push

**Files:**
- Verify all changed files

- [ ] **Step 1: Run static quality gates**

Run:

```bash
cargo fmt
cargo test
cargo clippy -- -D warnings
cargo xtask live --suite guard
```

Expected:

```text
test result: ok
Finished `dev` profile
PASS guard complete shart env: 15 services
```

- [ ] **Step 2: Run the full live suite**

Run:

```bash
just live-full-test
```

Expected:

```text
PASS guard complete shart env
PASS cli --version
PASS rest GET /health
PASS mcp initialize
PASS service_status sonarr
PASS service_status jellyfin
```

The command exits 0 and writes `target/live-full/report.json`. The report must contain no entries with `"passed": false`.

- [ ] **Step 3: Inspect the report**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
checks = json.loads(Path("target/live-full/report.json").read_text())
failed = [check for check in checks if not check["passed"]]
assert not failed, failed
print(f"{len(checks)} live checks passed")
PY
```

Expected:

```text
live checks passed
```

The number prefix depends on the matrix size and must be greater than 120.

- [ ] **Step 4: Commit any final fixes**

Run:

```bash
git status --short
git add xtask tests scripts docs Justfile
git commit -m "test: add complete xtask live validation"
```

Expected: commit succeeds if there are uncommitted final fixes. If `git status --short` is empty, skip the commit.

- [ ] **Step 5: Push everything**

Run:

```bash
git pull --rebase
bd dolt push
git push
git status --short --branch
```

Expected:

```text
## main...origin/main
```

No uncommitted files remain.

## Self-Review

- Spec coverage: The plan covers every Rustarr service kind, every business action, CLI command coverage, MCP protocol and tool coverage, local HTTP API routes, semantic success assertions, expected-error assertions, and a shart-only safety guard.
- xtask alignment: The canonical implementation is now `cargo xtask live`; `just` is only an alias layer, and the old Python runner path has been removed.
- Safety coverage: The plan refuses live `/home/jmagar/.rustarr`, rejects tootie URLs and process overrides, requires the complete shart service set, and keeps live testing opt-in.
- Service gap coverage: The plan treats missing `lidarr`, `readarr`, and initialized `wizarr` as a blocking prerequisite for the full suite rather than silently skipping them.
- Placeholder scan: The plan contains no deferred implementation markers. Secret values are extracted from shart and written only to `/home/jmagar/.rustarr-shart/.env`, which remains outside the repo.
