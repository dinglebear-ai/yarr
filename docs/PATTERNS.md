---
title: "rmcp-server Patterns"
created: 2026-05-22
updated: 2026-07-30
---

# rmcp-server Patterns

Canonical reference for all patterns used across the Rust MCP server family:
`lab`, `axon_rust` (Axon), `syslog-mcp`, `rustify` (Gotify), `rustifi` (UniFi),
`apprise-mcp`, `rustscale` (Tailscale), `yarr` (this repo), and
`unrust` (Unraid).

Every server in the family MUST follow these patterns. Deviation requires an explicit
architectural decision recorded in the repo.

---

## 0. Surface Parity Policy

Every business action MUST have MCP + CLI parity. MCP is the primary integration
surface for agents; CLI is the mandatory scripting, debugging, and regression-test
surface. If an operation is exposed to one of those surfaces, expose it to both unless
there is a documented protocol constraint.

REST API and Web UI are required only for application/platform servers that are more
than a thin client over an upstream API.

| Server category | Required surfaces | Examples | Guidance |
|---|---|---|---|
| Upstream-client MCP server | MCP + CLI | `unrust`, `rustifi`, `rustify`, `rustscale`, `apprise` | Do not duplicate the upstream HTTP API as a local REST API by default. Add REST/Web only when the server owns meaningful state, workflows, dashboards, or non-MCP consumers. |
| Application/platform server | API + CLI + MCP + Web | `axon`, `lab`, `syslog` | Keep all four surfaces thin and backed by the same service layer. Web talks to the local API; API/MCP/CLI all delegate to `app/`. |

Allowed exceptions:

- MCP-only protocol interactions, such as elicitation, may omit CLI when there is no
  equivalent non-interactive command. Document the reason in the action metadata/docs.
- CLI-only operational commands, such as `serve`, `mcp`, `doctor`, `watch`, and
  `setup`, are not business actions and do not need MCP equivalents.

---

## 1. Module Architecture — Strict Layering

```
src/
  <service>.rs      ← HTTP/API transport ONLY (no business logic)
  app/
    errors.rs       ← domain-specific errors and shared Result aliases
    common.rs       ← shared validation/helpers used across domain modules
    read.rs         ← read/query use-cases
    write.rs        ← create/update/delete use-cases
    # add more focused modules as needed: auth.rs, sync.rs, cache.rs, etc.
  config.rs         ← Config structs + env overrides
  api.rs            ← REST API handlers (api_dispatch, health, status)
  server.rs         ← AppState, AuthPolicy, build_auth_layer
  server/
    routes.rs       ← axum router: wires mcp + api + auth + SPA fallback
  mcp.rs            ← MCP module entry: submodule decls + re-exports only
  mcp/
    tools.rs        ← thin shim: parse args → call service facade → return Value
    schemas.rs      ← tool JSON schema + ACTIONS const
    rmcp_server.rs  ← ServerHandler impl (tools, resources, prompts)
    prompts.rs      ← MCP prompts
  cli.rs            ← thin shim: parse args → call service facade → format/print
  lib.rs            ← pub modules + test helpers (testing::*)
  main.rs           ← mode dispatch ONLY (serve_mcp / serve_stdio / run_cli)

Rule: keep business logic out of transports, but DO NOT force all logic into one giant file.
The service layer may be split across multiple focused modules under `src/app/`; what matters
is that transports stay thin and all domain logic lives in the service layer.

**The golden rule:** If you are writing business logic in `mcp/tools.rs`, `cli.rs`, or
`main.rs`, you are doing it wrong. Move it to `app.rs`.

### What "thin shim" means

`mcp/tools.rs` does exactly three things per action:
1. Extract named arguments from the `Value` args object
2. Call the corresponding `state.service.method()` 
3. Return the `Value` result

`cli.rs` does exactly three things per command:
1. Parse CLI flags/positional args into typed values
2. Call the corresponding `service.method()`
3. Format and print the result (or pass `--json` through verbatim)

**Zero validation, zero defaults, zero error message crafting** in shims. All of that
lives in `app.rs`.

---

## 1a. Module Architecture — Advanced (API + CLI + MCP + Web)

Use this layout for application/platform servers that expose REST/JSON and/or Web UI
surfaces in addition to the mandatory MCP + CLI pair. Do not use this layout merely
because the upstream service has an HTTP API; upstream-client MCP servers should stay
focused on MCP + CLI unless they own additional workflows/state. The guiding constraints
are the same as the base layout — thin shims, domain logic in `app/` — with two additions:

1. **Any surface that would exceed ~400 lines becomes a directory.**
   `api/`, `web/`, `app/`, and `mcp/` are all directories from the start.
2. **The `api/` surface mirrors `mcp/` structurally** — thin router + thin handlers,
   all real logic delegated to the shared `app/` service facade.

```
src/
  ├── <service>.rs            ← HTTP/API transport ONLY (single upstream client)
  │   or <service>/           ← split into a directory when ≥ 2 resource groups
  │       client.rs           ← reqwest/tonic client, request helpers, error mapping
  │       things.rs           ← /things resource (one file per upstream group)
  │       users.rs            ← /users resource
  │       └── ...
  │
  ├── app/                    ← ALL business logic lives here; never in shims
  │   ├── errors.rs           ← domain error types + shared Result<T> alias
  │   ├── common.rs           ← shared validation helpers, pagination, cursors
  │   ├── read.rs             ← read/query use-cases (impl YarrService block)
  │   ├── write.rs            ← create/update/delete use-cases
  │   ├── auth.rs             ← service-level auth helpers (token exchange, refresh)
  │   └── ...                 ← add focused modules as the domain grows
  │
  ├── config.rs               ← Config structs + env overrides (single file is fine)
  │
  ├── api.rs                  ← REST API handlers: api_dispatch, health, status
  │   or api/                 ← split into a directory when ≥ 2 resource groups
  │       things.rs           ← GET/POST/PUT/DELETE /things → service calls
  │       users.rs
  │       └── ...
  │
  ├── server.rs               ← AppState, AuthPolicy, build_auth_layer
  ├── server/
  │   └── routes.rs           ← axum router: wires mcp + api + auth + SPA fallback
  │
  ├── mcp.rs                  ← MCP module entry: submodule decls + re-exports only
  ├── mcp/                    ← MCP protocol layer (thin shims, no business logic)
  │   ├── tools.rs            ← dispatch: parse args → call service → return Value
  │   ├── schemas.rs          ← ACTIONS const + tool_definitions()
  │   ├── rmcp_server.rs      ← ServerHandler impl (tools, resources, prompts, scopes)
  │   └── prompts.rs          ← MCP prompt definitions
  │
  ├── web.rs                  ← embedded SPA asset serving (include_dir! + fallback)
  │
  ├── cli.rs                  ← thin shim: parse args → call service → format/print
  ├── lib.rs                  ← pub modules + test helpers (testing::*)
  └── main.rs                 ← mode dispatch ONLY (serve / serve_stdio / run_cli)
```

### Port/router layout

```
:3100  (or $PORT)
  /mcp            ← MCP JSON-RPC (rmcp ServerHandler)
  /health         ← health check
  /api/v1/...     ← REST API (api/ handlers)
  /               ← Web UI (web/ static or SSR)
  /.well-known/   ← OAuth discovery (when auth_mode=oauth)
```

All four surfaces share one `AppState` (same `Arc<YarrService>`, same auth layer).
The axum router nests them as separate sub-routers:

```rust
// main.rs — router assembly (no logic here)
let app = Router::new()
    .nest("/mcp",    mcp::router(state.clone()))
    .nest("/api/v1", api::router(state.clone()))
    .nest("/",       web::router(state.clone()))
    .route("/health", get(health_handler));
```

### Split rules — when to make a directory vs a file

| Surface | Split into a directory when… |
|---|---|
| `<service>/` | upstream API has ≥ 2 resource groups (things, users, etc.) |
| `app/` | service methods exceed one focused domain (always use a directory) |
| `mcp/` | already a directory in the base layout |
| `api/handlers/` | ≥ 2 resource groups; each file stays thin (≤ 200 lines target) |
| `web/pages/` | ≥ 3 page routes |
| `web/templates/` | any SSR; omit entirely for SPAs served from `assets/` |

### Thin-shim rule applies to `api/handlers/` too

`api/handlers/things.rs` does exactly three things per endpoint:
1. Extract typed inputs from the request (path params, query, JSON body) via extractors
2. Call the corresponding `state.service.method()`
3. Return `ApiResponse<T>` or the mapped error

No validation, no defaults, no business logic in handlers — same as `mcp/tools.rs`.

---

## 2. Service Layer (app.rs)

```rust
#[derive(Clone)]
pub struct YarrService {
    client: YarrClient,
}

impl YarrService {
    pub fn new(client: YarrClient) -> Self { ... }

    pub async fn read_action(&self) -> Result<Value> {
        self.client.some_api_call().await
    }

    pub async fn delete_action(&self, id: i64) -> Result<Value> {
        self.client.delete_thing(id).await
    }
}
```

The service is where you add:
- Input validation and defaults
- Business rules and upstream capability checks
- Cross-cutting concerns (logging, metrics, caching)
- Error enrichment ("couldn't connect to X: check YARR_URL")

---

## 3. API Client (<service>.rs)

```rust
#[derive(Clone)]
pub struct YarrClient {
    client: reqwest::Client,
    base_url: String,
    api_key: String,
}

impl YarrClient {
    pub fn new(cfg: &YarrConfig) -> Result<Self> {
        if cfg.url.is_empty() { anyhow::bail!("YARR_URL is not set"); }
        let client = reqwest::ClientBuilder::new()
            .danger_accept_invalid_certs(cfg.skip_tls_verify)
            .build()?;
        Ok(Self { client, base_url: cfg.url.trim_end_matches('/').to_string(), api_key: cfg.api_key.clone() })
    }

    // One method per API endpoint — transport only, no logic
    pub async fn list_things(&self) -> Result<Value> {
        self.get("things").await
    }

    async fn get(&self, path: &str) -> Result<Value> {
        let url = format!("{}/{}", self.base_url, path.trim_start_matches('/'));
        let resp = self.client.get(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send().await?;
        // ... parse and return
    }
}
```

**Never put logic in the client.** It's a transport adapter. If the API returns a weird
format, parse it here minimally but don't transform or interpret the data.

---

## 4. Config Split — Secrets vs Settings

### Rule

| Goes in `.env` | Goes in `config.toml` |
|---|---|
| API keys, tokens, passwords | bind host, port, server_name |
| Service URLs | TLS skip, site, tailnet |
| Google OAuth credentials | auth_mode, auth TTLs |
| MCP bearer token | allowed_hosts, allowed_origins |
| Immutable production image reference | retention settings, batch sizes |
| RUST_LOG | resource limits |

### config.toml structure

```toml
# config.toml — non-secret settings only
# Env vars override everything here.

[<service>]
skip_tls_verify = false
site = "default"

[mcp]
host = "127.0.0.1"
port = 3000
server_name = "yarr"

[mcp.auth]
mode = "bearer"           # or "oauth"
admin_email = ""
sqlite_path = "/data/auth.db"
key_path = "/data/auth-jwt.pem"
access_token_ttl_secs = 3600
refresh_token_ttl_secs = 2592000
auth_code_ttl_secs = 300
```

### .env structure

```bash
# .env — secrets and URLs ONLY
YARR_SERVICES=sonarr,radarr
YARR_SONARR_URL=https://sonarr.internal
YARR_SONARR_API_KEY=your_sonarr_api_key_here
YARR_RADARR_URL=https://radarr.internal
YARR_RADARR_API_KEY=your_radarr_api_key_here

# MCP auth
YARR_MCP_TOKEN=your_bearer_token_here

# OAuth (only when auth_mode=oauth in config.toml)
# YARR_MCP_GOOGLE_CLIENT_ID=...
# YARR_MCP_GOOGLE_CLIENT_SECRET=...

# Docker runtime
DOCKER_NETWORK=mcp
RUST_LOG=info
```

### Config loading pattern (config.rs)

```rust
impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let mut config = Config::default();

        // 1. Load config.toml (non-secret settings)
        match std::fs::read_to_string("config.toml") {
            Ok(contents) => { config = toml::from_str(&contents)?; }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(anyhow::anyhow!("config.toml: {e}")),
        }

        // 2. Env overrides (secrets + any setting the user wants to override)
        env_str("YARR_MCP_HOST", &mut config.mcp.host);
        env_parse("YARR_MCP_PORT", &mut config.mcp.port)?;
        env_opt_str("YARR_MCP_TOKEN", &mut config.mcp.api_token);
        load_services_from_env(&mut config.yarr)?;
        // ...
        Ok(config)
    }
}
```

---

## 5. Authentication — OAuth + Bearer Simultaneously

Both auth modes are active simultaneously via the `AuthPolicy` enum:

```rust
pub enum AuthPolicy {
    /// No auth — only legal when bound to loopback (127.x).
    LoopbackDev,
    /// Auth active. auth_state=Some → OAuth+JWKS; auth_state=None → bearer-only.
    Mounted { auth_state: Option<Arc<lab_auth::state::AuthState>> },
}
```

### build_auth_policy (main.rs)

```rust
async fn build_auth_policy(config: &Config) -> Result<AuthPolicy> {
    if config.mcp.no_auth || config.mcp.host.starts_with("127.") {
        return Ok(AuthPolicy::LoopbackDev);
    }
    if config.mcp.auth.mode == AuthMode::OAuth {
        let auth_cfg = lab_auth::config::AuthConfigBuilder::new()
            .env_prefix("YARR_MCP")
            .session_cookie_name("yarr_mcp_session")
            .scopes_supported(vec!["yarr:read".into(), "yarr:write".into()])
            .default_scope("yarr:read")
            .resource_path("/mcp")
            .enable_dynamic_registration(true)
            .build_from_sources(vec![])  // reads from env vars
            .map_err(|e| anyhow::anyhow!("OAuth config error: {e}"))?;
        let auth_state = lab_auth::state::AuthState::new(auth_cfg).await
            .map_err(|e| anyhow::anyhow!("OAuth state init error: {e}"))?;
        Ok(AuthPolicy::Mounted { auth_state: Some(Arc::new(auth_state)) })
    } else {
        Ok(AuthPolicy::Mounted { auth_state: None })  // bearer-only
    }
}
```

### AuthLayer wiring (server.rs)

```rust
pub fn build_auth_layer(
    policy: &AuthPolicy,
    static_token: Option<Arc<str>>,
    resource_url: Option<Arc<str>>,
) -> Option<AuthLayer> {
    match policy {
        AuthPolicy::LoopbackDev => None,
        AuthPolicy::Mounted { auth_state } => Some(
            AuthLayer::new()
                .with_static_token(static_token)
                .with_auth_state(auth_state.clone())
                .with_static_token_scopes(vec!["yarr:read".into()])
                .with_resource_url(resource_url)
                .with_allow_session_cookie(false),
        ),
    }
}
```

### OAuth routes (server/routes.rs)

When `auth_state: Some(_)`, the OAuth router is automatically mounted:
- `/.well-known/oauth-authorization-server`
- `/.well-known/oauth-protected-resource`
- `/mcp/.well-known/*`
- `/authorize`, `/token`, `/register`, `/auth/google/callback`, `/jwks`

---

## 6. Transport — stdio AND Streamable HTTP

Both transports build the same `AppState` and serve the same `ServerHandler`:

```rust
// HTTP mode (default: `yarr` or `yarr serve`)
async fn serve_mcp() -> Result<()> {
    let config = Config::load()?;
    let state = build_state(config).await?;
    let bind = state.config.bind_addr();
    let app = mcp::router(state).layer(TraceLayer::new_for_http());
    let listener = tokio::net::TcpListener::bind(&bind).await?;
    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal()).await?;
}

// stdio mode (`yarr mcp` — for Claude Code local use)
async fn serve_stdio_mcp() -> Result<()> {
    let config = Config::load()?;
    let state = build_state(config).await?;
    mcp::rmcp_server(state).serve(stdio()).await?.waiting().await?;
}
```

### When to use each

| Transport | Use case |
|---|---|
| stdio | Claude Code local development, `~/.claude/settings.json` stdio server |
| Streamable HTTP | Remote/Docker deployment, Codex, multi-client, reverse proxy |

---

## 7. AppState

```rust
#[derive(Clone)]
pub struct AppState {
    pub config: McpConfig,        // MCP server config (host, port, auth settings)
    pub auth_policy: AuthPolicy,  // LoopbackDev | Mounted
    pub service: YarrService,  // The service layer — everything routes through here
}
```

AppState is cloned per-request by the RMCP framework. Keep it cheap to clone — the
service wraps an `Arc`-backed `reqwest::Client` internally.

---

## 8. MCP Tool — Action + Sub-action Pattern

All servers expose a **single MCP tool** with an `action` parameter that dispatches to
sub-functions. This is the canonical pattern across all servers:

```rust
// mcp/tools.rs
pub(super) async fn execute_tool(state: &AppState, name: &str, args: Value) -> anyhow::Result<Value> {
    match name {
        "yarr" => dispatch(state, args).await,
        _ => Err(anyhow::anyhow!("unknown tool: {name}")),
    }
}

async fn dispatch(state: &AppState, args: Value) -> anyhow::Result<Value> {
    let action = string_arg(&args, "action")
        .ok_or_else(|| anyhow::anyhow!("action is required"))?;
    match action.as_str() {
        "things"   => state.service.list_things().await,
        "thing"    => {
            let id = string_arg(&args, "id")
                .ok_or_else(|| anyhow::anyhow!("`id` is required for thing"))?;
            state.service.get_thing(&id).await
        }
        "delete_thing" => {
            let id = string_arg(&args, "id")
                .ok_or_else(|| anyhow::anyhow!("`id` is required"))?;
            state.service.delete_thing(&id).await
        }
        "help" => Ok(json!({ "help": HELP_TEXT })),
        other => Err(anyhow::anyhow!("unknown action: {other}; use action=help")),
    }
}
```

### Action metadata (actions.rs) and JSON schema (mcp/schemas.rs)

```rust
pub const ACTION_SPECS: &[ActionSpec] = &[
    ActionSpec { name: "things", required_scope: Some(READ_SCOPE), transport: ActionTransport::Any },
    ActionSpec { name: "thing", required_scope: Some(READ_SCOPE), transport: ActionTransport::Any },
    ActionSpec { name: "delete_thing", required_scope: Some(WRITE_SCOPE), transport: ActionTransport::Any },
    ActionSpec { name: "help", required_scope: None, transport: ActionTransport::Any },
];

pub(super) fn tool_definitions() -> Vec<Value> {
    vec![json!({
        "name": "yarr",
        "description": "Query and manage Yarr service. Use action=help for documentation.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": action_names() },
                "id":     { "type": "string", "description": "Item ID (thing, delete_thing)" }
            },
            "required": ["action"]
        }
    })]
}
```

### Scope enforcement (mcp/rmcp_server.rs)

```rust
const READ_SCOPE:  &str = "yarr:read";
const WRITE_SCOPE: &str = "yarr:write";
const DENY_SCOPE:  &str = "yarr:__deny__";  // sentinel — never granted

fn required_scope_for(action: &str) -> Option<&'static str> {
    required_scope_for_action(action)
}
```

---

## 9. MCP Resources

Every server exposes its tool JSON schema as a readable resource:

```rust
const SCHEMA_RESOURCE_URI: &str = "yarr://schema/mcp-tool";

async fn read_resource(&self, request: ReadResourceRequestParams, ...) -> Result<ReadResourceResult> {
    if request.uri != SCHEMA_RESOURCE_URI {
        return Err(ErrorData::invalid_params(format!("unknown resource: {}", request.uri), None));
    }
    let schema = tool_definitions();
    let text = serde_json::to_string_pretty(&schema)?;
    Ok(ReadResourceResult::new(vec![
        ResourceContents::text(text, SCHEMA_RESOURCE_URI).with_mime_type("application/json")
    ]))
}
```

---

## 10. MCP Prompts

Each server has at least one prompt that guides common workflows:

```rust
// mcp/prompts.rs
pub(super) fn list_prompts() -> ListPromptsResult {
    ListPromptsResult {
        prompts: vec![
            Prompt::new("quick_start", Some("Get an overview of the service status"), None),
        ],
        ..Default::default()
    }
}

pub(super) fn get_prompt(request: GetPromptRequestParams) -> anyhow::Result<GetPromptResult> {
    match request.name.as_str() {
        "quick_start" => Ok(GetPromptResult::new(vec![
            PromptMessage::new_text(PromptMessageRole::User,
                "Use the yarr tool with action=status, then action=things to get an overview.")
        ]).with_description("Get an overview")),
        other => Err(anyhow::anyhow!("unknown prompt: {other}")),
    }
}
```

---

## 11. CLI — Thin Shim Pattern

```rust
// cli.rs (binary module, not lib — uses `servicename::` not `crate::`)
use yarr::app::YarrService;

pub enum CliCommand {
    Things,
    Thing { id: String },
    DeleteThing { id: String },
}

impl CliCommand {
    pub fn parse(args: &[String]) -> Result<(Self, bool)> {
        let json = args.iter().any(|a| a == "--json");
        let rest: Vec<&str> = args.iter()
            .filter(|a| a.as_str() != "--json")
            .map(String::as_str).collect();

        let cmd = match rest.as_slice() {
            ["things"]          => Self::Things,
            ["thing", id, ..]   => Self::Thing { id: id.to_string() },
            ["delete", id, ..]  => Self::DeleteThing { id: id.to_string() },
            other => bail!("unknown command: {}\n\nRun `yarr --help`", other.join(" ")),
        };
        Ok((cmd, json))
    }
}

pub async fn run(service: &YarrService, cmd: CliCommand, json: bool) -> Result<()> {
    let (label, data) = match cmd {
        CliCommand::Things            => ("things",        service.list_things().await?),
        CliCommand::Thing { ref id }  => ("thing",         service.get_thing(id).await?),
        CliCommand::DeleteThing { ref id } => ("delete", service.delete_thing(id).await?),
    };
    if json { println!("{}", serde_json::to_string_pretty(&data)?); }
    else    { print_human(label, &data); }
    Ok(())
}
```

---

## 12. Test Sidecars

All tests live in `_tests.rs` sidecar files, NOT inline in the source file. This allows
testing private functions without making them `pub`.

```rust
// src/app.rs
pub struct YarrService { ... }
impl YarrService { ... }

#[cfg(test)]
#[path = "app_tests.rs"]
mod tests;

// src/app_tests.rs
use super::*;  // access to private items

#[tokio::test]
async fn delete_action_dispatches_to_client() {
    let client = stub_client();
    let svc = YarrService::new(client.clone());
    svc.delete_action(42).await.unwrap();
    client.assert_deleted(42);
}
```

Integration tests in `tests/` use the public API via `use yarr::testing::*`:

```rust
// tests/tool_dispatch.rs
use yarr::testing::loopback_state;

#[tokio::test]
async fn help_returns_help_key() {
    let state = loopback_state();
    let result = execute_tool(&state, "yarr", json!({"action": "help"})).await.unwrap();
    assert!(result.get("help").is_some());
    assert!(!result["help"].as_str().unwrap().is_empty());
}
```

### Test helpers (lib.rs)

```rust
#[cfg(any(test, feature = "test-support"))]
pub mod testing {
    pub fn loopback_state() -> AppState {
        AppState {
            config: McpConfig::default(),
            auth_policy: AuthPolicy::LoopbackDev,
            service: stub_service(),
        }
    }

    fn stub_service() -> YarrService {
        let client = YarrClient::new(&YarrConfig {
            url: "http://localhost:1".into(),  // unreachable — never called in unit tests
            api_key: "test".into(),
            ..Default::default()
        }).expect("stub client should build");
        YarrService::new(client)
    }
}
```

---

## 13. Claude Code Plugin Structure

```
plugins/
  <service>/
    .claude-plugin/
      plugin.json         ← plugin manifest; no version field
    .mcp.json             ← pinned npm stdio launcher
    scripts/
      plugin-setup.sh     ← strict JSON config writer (run on demand)
    skills/
      <service>/
        SKILL.md
```

Every `.mcp.json` launches the repository-coupled npm package over stdio. The
package version must equal the Cargo/server version and must not float:

```json
{
  "mcpServers": {
    "yarr": {
      "command": "npx",
      "args": ["-y", "@dinglebear/yarr-mcp@<repo-version>", "mcp"]
    }
  }
}
```

Plugins ship **lifecycle hooks by necessity**. Every manifest declares a `hooks`
key and every plugin contains a `hooks/` directory with a `SessionStart` +
`ConfigChange(user_settings)` pair. The hook is the only channel that can deliver
a `sensitive: true` setting to a skill script: `CLAUDE_PLUGIN_OPTION_*` reaches
hook processes only, sensitive values are never substituted into skill prose, and
the skills-only plugins have no MCP server to carry an `${user_config.*}` env
block. Contract checks assert their presence, so removing a hook fails CI.

The setup script accepts only allowlisted string values, writes them atomically to
`~/.config/lab-<service>/config.json`, sets the directory to mode 0700 and the
file to mode 0600, and rejects invalid input. Client scripts parse that JSON;
they never `source` or `eval` configuration. Plugins contain no bundled ELF and
no `config.env` compatibility path.

---

## 14. Dockerfile Pattern

`config/Dockerfile` is the executable source of truth. Keep these properties:

- both builder and runtime bases retain readable tags and pin multi-platform
  manifest digests;
- every Cargo build uses the lockfile and BuildKit cache mounts;
- the distroless runtime contains only the binary, CA certificates, and required
  dynamic libraries, and runs directly as numeric UID/GID 1000;
- `/data` is created with UID/GID 1000 during the build; host bind mounts are
  provisioned with matching ownership before deployment;
- port 40070 is exposed and the application-native one-shot health check probes
  `GET /ready` without a shell or curl;
- the MCP registry label matches `server.json` (`ai.dinglebear/yarr`).

Refresh base digests deliberately and review the upstream image diff. Do not
replace a digest with a mutable tag-only reference.

---

## 15. docker-compose.yml Pattern

```yaml
services:
  yarr-mcp:
    image: ${YARR_MCP_IMAGE:?Set an immutable ghcr.io/dinglebear-ai/yarr@sha256 digest}
    pull_policy: always
    container_name: yarr
    restart: unless-stopped
    env_file:
      - path: .env
        required: true
    ports:
      - "${YARR_MCP_HOST_PORT:-40070}:40070/tcp"
    volumes:
      - ${YARR_DATA_VOLUME:-yarr-mcp-data}:/data
    networks:
      - mcp
    healthcheck:
      test: ["CMD", "/usr/local/bin/yarr", "watch", "--once", "--url", "http://127.0.0.1:40070/ready"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'

volumes:
  yarr-mcp-data:

networks:
  mcp:
    name: ${DOCKER_NETWORK:-mcp}
    external: true
```

**Key requirements:**
- `container_name` must be unique across your stack
- Use the `${DOCKER_NETWORK:-mcp}` external network
- `env_file.required: false` so the container starts even without .env (relies on config.toml defaults)
- Resource limits to prevent runaway memory on homelab

---

## 16. Install Script Pattern

```bash
#!/usr/bin/env bash
# One-line install: curl -fsSL https://raw.githubusercontent.com/dinglebear-ai/yarr/main/install.sh | bash
set -euo pipefail

REPO="dinglebear-ai/yarr"
BINARY="yarr"
INSTALL_DIR="${HOME}/.local/bin"

# Detect platform
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "${ARCH}" in
  x86_64|amd64) ARCH="x86_64" ;;
  *) echo "Unsupported architecture: ${ARCH}; only x86_64 release binaries are published" >&2; exit 1 ;;
esac

echo "Installing ${BINARY} from ${REPO}..."
mkdir -p "${INSTALL_DIR}"

# Download latest release binary
LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": "\(.*\)".*/\1/')
URL="https://github.com/${REPO}/releases/download/${LATEST}/${BINARY}-${LATEST}-${ARCH}-unknown-linux-musl.tar.gz"
curl -fsSL "${URL}" | tar -xz -C "${INSTALL_DIR}" "${BINARY}"
chmod +x "${INSTALL_DIR}/${BINARY}"

echo ""
echo "✓ ${BINARY} installed to ${INSTALL_DIR}/${BINARY}"
echo ""
echo "Next steps:"
echo "  1. Copy the repository .env.example into your chosen data root"
echo "  2. Add credentials and chmod the resulting .env to 600"
echo "  2. Run: ${BINARY} serve           (HTTP mode)"
echo "  3. Or:  ${BINARY} mcp             (stdio mode for Claude Code)"
```

---

## 17. mcporter Integration Test Pattern

Every server has `tests/mcporter/test-mcp.sh` and, when useful for named server workflows, `config/mcporter.json`. The live harness covers MCP tools and MCP resources; add prompt coverage when mcporter exposes first-class prompt testing.

### Philosophy

A test that checks `is_error: false` is not a good test — it only verifies the MCP
protocol layer responded. A semantic test checks that the actual service data is present
and structurally correct. Resource tests follow the same rule: prove the resource content is the expected schema/document, not just that `resources/read` returned HTTP 200.

```bash
# Bad test — only proves MCP responded
run_test "server info" "yarr" '{"action":"server_info"}'

# Good test — proves the API actually returned real data
run_test "server info has hostname" "yarr" '{"action":"server_info"}' "hostname"
run_test "server info hostname non-empty" "yarr" '{"action":"server_info"}' \
  && assert_nonempty "$(last_output | jq -r '.hostname')" "hostname"
```

### config/mcporter.json

```json
{
  "mcpServers": {
    "yarr": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

### Tool validation helpers in test-mcp.sh

```bash
# Validate that a JSON path exists and is non-empty
assert_key() {
  local label="$1" output="$2" key_path="$3"
  python3 -c "
import sys, json
d = json.loads('''${output}''')
keys = '${key_path}'.split('.')
node = d
for k in keys:
    node = node[int(k)] if isinstance(node, list) and k.isdigit() else node[k]
assert node is not None and node != '' and node != [] and node != {}
" 2>/dev/null || { echo "[FAIL] ${label}: missing or empty .${key_path}"; return 1; }
}
```

### Resource validation

MCP resources are public contract, not implementation detail. Test every stable resource URI exported by the server. The template validates `yarr://schema/mcp-tool` by asserting:

- the resource URI resolves
- the returned content parses as JSON
- the tool name is `yarr`
- `inputSchema.type` is `object`
- `inputSchema.properties.action` exists

Prefer mcporter's resource command when available. Keep a JSON-RPC `resources/read` fallback while older local mcporter versions are still common.

### Prompt validation

When mcporter supports prompts directly, add a prompt suite beside tool/resource suites. Until then, prompt coverage should live in Rust tests for `src/mcp/prompts.rs` and in plugin/skill docs that demonstrate the expected prompt workflow.

### Live actions

On disposable test stacks, exercise mutating actions and assert
observable before/after state plus cleanup. Reserve "destructive" for permanent
loss of data that cannot be quickly and easily regenerated or recreated with
minimal effort.

Do not run genuinely destructive live actions against non-disposable targets:
- Formatting or wiping storage
- Deleting hard-to-recreate folders, repositories, or media libraries
- Overwriting data without rollback
- Sending irreversible notifications to many users

For services where "send" IS the primary action (Apprise, Gotify), use a dedicated
test tag/app (`APPRISE_TEST_TAG`, `GOTIFY_TEST_APP_ID`) gated by an env var.

---

## 18. Three-Tier Skill Pattern

Every server has a skill covering three fallback tiers:

```markdown
# yarr — Claude Code Skill

Use this skill whenever... [trigger phrases]

## Tier 1: MCP tool (preferred)
Use when the yarr MCP server is configured.

yarr(code="async () => sonarr.get_system_status()")
yarr(code="async () => api.sonarr.get('/api/v3/system/status')")
yarr(code="async () => codemode.search('series')")

## Tier 2: CLI binary
Use when MCP is unavailable but the binary is installed.

yarr sonarr status
yarr sonarr get --path /api/v3/system/status

Env required: YARR_SERVICES, YARR_<SERVICE>_URL, and service credentials.

## Tier 3: Direct API (last resort)
Use when neither MCP nor CLI is available.

curl -H "X-Api-Key: $YARR_SONARR_API_KEY" \
     "$YARR_SONARR_URL/api/v3/system/status"

## Gotchas
- [service-specific pitfalls]
```

---

## 19. Port Assignments

| Service | MCP Port | Binary name |
|---|---|---|
| lab | 8765 | `labby` |
| axon_rust (axon) | 8001 | `axon` |
| syslog-mcp | 3100 | `syslog` |
| unraid-mcp (unrust) | 6970 | `unraid` |
| gotify-mcp (rustify) | 9158 | `gotify` |
| unifi-mcp (rustifi) | 7474 | `unifi` |
| tailscale-mcp (rustscale) | 7575 | `tailscale` |
| apprise-mcp | 8765 | `apprise` |
| yarr | 40070 | `yarr` |

---

## 20. Checklist for New Servers

Use this when creating a new server from yarr:

- [ ] Replace every occurrence of `yarr`/`Yarr`/`YARR` with your service name
- [ ] Implement API client in `src/<service>.rs` (transport only)
- [ ] Add service methods to `src/app.rs` (all logic here)
- [ ] Add tool actions to `src/mcp/tools.rs` and `src/mcp/schemas.rs`
- [ ] Add CLI commands to `src/cli.rs`
- [ ] Update `src/config.rs` with service-specific config fields
- [ ] Set correct port in `config.toml` and `docker-compose.yml`
- [ ] Update `EXPOSE` in `config/Dockerfile`
- [ ] Configure the strict JSON plugin option allowlist for the service
- [ ] Write tests in `*_tests.rs` sidecars + `tests/` integration tests
- [ ] Write `tests/mcporter/test-mcp.sh` with semantic validation
- [ ] Update `plugins/<service>/skills/<service>/SKILL.md` with real API details
- [ ] Update `install.sh` with correct binary/repo name
- [ ] Run `cargo check` — must compile clean, zero warnings
- [ ] Run `cargo nextest run` — all tests pass
- [ ] Run `./tests/mcporter/test-mcp.sh` against a live server instance

---

## 21. Release Artifact Distribution

Version tags build release binaries and attach them to the GitHub Release. The
release workflow must not push generated binaries back to `main`. Local `dist`
recipes are operator conveniences for preparing artifacts, not a CI write-back path.

---

## 22. Thin Shim Rule — Absolute Prohibition

**No business logic in `mcp/tools.rs` OR `cli.rs`. Ever.**

This is the hardest architectural rule to enforce and the most commonly violated.
The full prohibition:

| Layer | Allowed | Prohibited |
|---|---|---|
| `<service>.rs` | HTTP requests, response parsing | Defaults, validation, error messages |
| `app.rs` | Everything else | Nothing |
| `mcp/tools.rs` | Parse args, call service, return Value | Any conditional logic, defaults |
| `cli.rs` | Parse flags, call service, format output | Any conditional logic, defaults |
| `main.rs` | Config loading, mode dispatch | Any domain logic |

Signs you are violating the rule:
- An `if` statement in `tools.rs` that isn't arg parsing
- A default value set in `cli.rs` rather than `app.rs`  
- An error message about the domain in `tools.rs` (not "action is required")
- Any `match` in `cli.rs` beyond `cmd_name → service.method()`

---

## 23. Elicitation — Destructive Action Protection

Only destructive MCP actions require elicitation. In this project, destructive
means permanent loss of data that cannot be quickly and easily regenerated or
recreated. Ordinary recoverable writes are mutating and are authorized by their
declared write scope without an extra confirmation argument.

The outer `yarr` dispatcher and every nested Code Mode call must apply the same
action metadata, scope check, and destructive-action policy at the final dispatch
point. A destructive nested call must elicit through the connected MCP client; if
the client does not support elicitation, declines it, or the request fails, the
operation fails closed. Snippets inherit the same guarded dispatcher.

CLI actions have no MCP client through which to elicit and run immediately after
normal argument validation. There is no `confirm` field, `--confirm` flag, or
trusted-automation bypass.

---

## 24. nextest + xtasks

### nextest

All repos use `cargo nextest` instead of `cargo test`. Add to `Cargo.toml`:
```toml
[dev-dependencies]
# no special dep needed — nextest is a cargo plugin
```

Install: `cargo install cargo-nextest`

Justfile `test` recipe:
```just
test:
    cargo nextest run
test-ci:
    cargo nextest run --profile ci
```

`.config/nextest.toml`:
```toml
[profile.default]
fail-fast = false

[profile.ci]
fail-fast = true
retries = 2
```

### xtasks

Every repo has an `xtask/` crate for repo automation:

```
xtask/
  Cargo.toml    # name = "xtask", path dep on main crate
  src/
    main.rs     # cargo xtask <command>
```

Commands every xtask must implement:
- `cargo xtask dist` — build release artifacts locally
- `cargo xtask ci` — run all checks (fmt, clippy, test, deny)
- `cargo xtask symlink-docs` — symlink CLAUDE.md → AGENTS.md, GEMINI.md everywhere
- `cargo xtask check-env` — validate required env vars are set

Justfile delegates to xtask:
```just
dist:
    cargo xtask dist
symlink-docs:
    cargo xtask symlink-docs
```

---

## 25. Appdata Convention — `~/.<service>`

All servers use `~/.<service>` as their local data directory by default. This is
consistent between Docker and bare-metal deployments.

| Deployment | Data directory |
|---|---|
| Local binary | `~/.unraid/`, `~/.gotify/`, `~/.tailscale-mcp/`, etc. |
| Docker | `/data/` inside container, mounted from `~/.<service>/` on host |
| Plugin | `$CLAUDE_PLUGIN_DATA` (symlinked to `~/.<service>/`) |

The binary detects its environment and resolves the correct path:

```rust
fn default_data_dir() -> PathBuf {
    // In container: /data is mounted from ~/.<service> — use it directly
    if std::env::var("RUNNING_IN_CONTAINER").is_ok() || std::path::Path::new("/.dockerenv").exists() {
        return PathBuf::from("/data");
    }
    // Local: use ~/.<service>
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".yarr")  // replace with actual service name
}
```

`docker-compose.yml` always mounts the host `~/.<service>` to `/data`:
```yaml
volumes:
  - ${HOME}/.yarr:/data
```

This means `config.toml`, `.env`, `auth.db`, `auth-jwt.pem`, etc. are all in the same
place whether the server runs in Docker or locally.

---

## 26. Distroless Direct Entrypoint

Production images run the service binary directly as a numeric non-root user.
Do not add a shell, privilege-drop helper, or root startup wrapper merely to fix
bind-mount ownership. Provision the host directory before deployment and keep
the image incapable of runtime package installation.

```dockerfile
FROM gcr.io/distroless/cc-debian13:nonroot@sha256:<manifest-digest>
COPY --from=builder --chown=1000:1000 /usr/local/bin/yarr /usr/local/bin/yarr
COPY --from=builder --chown=1000:1000 /runtime-data/ /data/
USER 1000:1000
HEALTHCHECK CMD ["/usr/local/bin/yarr", "watch", "--once", "--url", "http://127.0.0.1:40070/ready"]
ENTRYPOINT ["/usr/local/bin/yarr"]
CMD ["serve", "mcp"]
```

The application is PID 1 and receives stop signals directly. The host must
prepare the bind mount with `install -d -m 0750 -o 1000 -g 1000 ~/.yarr`.

---

## 27. Security — No 0.0.0.0 Without Auth

The server MUST refuse to bind to a non-loopback address without authentication
configured, unless the operator explicitly opts out.

Centralize this decision in library code, not the binary:

- loopback bind with `YARR_MCP_NO_AUTH=true` → `LoopbackDev`
- non-loopback with `YARR_NOAUTH=true` → `TrustedGatewayUnscoped`
- non-loopback with bearer token → mounted bearer auth
- non-loopback with OAuth mode → mounted OAuth auth
- non-loopback with `YARR_MCP_NO_AUTH=true` but no gateway acknowledgment → startup error

Called in `serve_mcp()` before binding the TCP listener.

---

## 28. Binary Environment Awareness

The binary normalizes paths, IPs, and ports based on its deployment context:

```rust
fn is_containerized() -> bool {
    std::path::Path::new("/.dockerenv").exists()
        || std::env::var("RUNNING_IN_CONTAINER").is_ok()
        || std::env::var("container").is_ok()
}

fn resolve_data_dir(config_path: Option<&str>) -> PathBuf {
    if let Some(p) = config_path { return PathBuf::from(p); }
    if is_containerized() { return PathBuf::from("/data"); }
    dirs::home_dir().unwrap_or_default().join(".yarr")
}

fn resolve_bind_host(configured: &str) -> &str {
    // Inside a container, 0.0.0.0 is always correct (NAT handles external access)
    // Outside, prefer 127.0.0.1 unless explicitly configured otherwise
    if configured == "0.0.0.0" && !is_containerized() {
        return "127.0.0.1";  // safe default for bare-metal
    }
    configured
}
```

The key invariant: **the same `.env` and `config.toml` in `~/.<service>/` work for
both Docker and bare-metal deployment without modification.**

---

## 29. taplo — TOML Formatter

Every repo has a `taplo.toml` configuration:

```toml
# taplo.toml
[formatting]
align_entries = false
array_trailing_comma = true
array_auto_expand = true
array_auto_collapse = true
compact_arrays = true
compact_inline_tables = false
column_width = 100
indent_string = "  "
trailing_newline = true
allowed_blank_lines = 1
```

Justfile:
```just
fmt-toml:
    taplo format
check-toml:
    taplo check
```

CI runs `taplo check` on all PRs. Install: `cargo install taplo-cli` or `mise use taplo`.

---

## 30. lefthook — Minimal Pre-commit

Pre-commit hooks must be FAST and NON-BLOCKING for developer flow. Heavy checks
live in CI, not pre-commit.

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    # Fast: just check for obvious problems
    diff_check:
      run: git --no-pager diff --check --cached
    toml_fmt:
      glob: "*.toml"
      run: taplo check {staged_files}
    env_guard:
      run: bash scripts/block-env-commits.sh  # prevents committing .env with secrets

# NOT in pre-commit (too slow / too blocking):
# - cargo clippy  → CI only
# - cargo test    → CI only  
# - cargo nextest → CI only
# - cargo fmt check → CI only (fmt is ok locally but check blocks flow)
```

The philosophy: **commit early, commit often**. A pre-commit that takes 30 seconds
kills momentum. Only block on things that catch secrets or obviously broken syntax.

---

## 31. GitHub Workflows

The executable workflow contract is:

### `.github/workflows/ci.yml`
Runs on push/PR to main. Its required job names are `Actionlint`, `Format`,
`Clippy`, `Docs`, `Test`, `NPM Package`, `TOML Format`, `Repo Contracts`,
`Cargo Deny`, and `Secret Scan`. `.github/workflows/msrv.yml` adds `Minimum
Supported Rust Version (1.90)`. GitHub ruleset 19036511 requires all of them.

### `.github/workflows/docker-publish.yml`
Runs only after a successful main CI workflow, on version tags, or by explicit
dispatch. It verifies the complete CI/MSRV check set for the source SHA, pushes
a quarantine tag, scans the immutable digest with Trivy, then promotes that
same digest to channel/version tags. A failed scan never promotes the image.

### `.github/workflows/release.yml`
Runs on version tags (`v*`) or explicit dispatch. It verifies coupled versions,
builds Linux and Windows archives plus checksums, stages assets on a draft
release, publishes the exact npm version idempotently, verifies every public
surface, and only then publishes the GitHub release.

---

## 32. CLAUDE.md as Source of Truth

`CLAUDE.md` is the authoritative project instructions file. `AGENTS.md` and `GEMINI.md`
are symlinks to it. This applies to ALL `CLAUDE.md` files in the repo, not just the root.

```bash
# cargo xtask symlink-docs (or: just symlink-docs)
find . -name "CLAUDE.md" -not -path "./.git/*" -not -path "./target/*" | while read f; do
    dir=$(dirname "$f")
    ln -sf "CLAUDE.md" "${dir}/AGENTS.md"
    ln -sf "CLAUDE.md" "${dir}/GEMINI.md"
done
```

Justfile:
```just
symlink-docs:
    cargo xtask symlink-docs

# Or inline if no xtask yet:
symlink-docs:
    find . -name "CLAUDE.md" -not -path "./.git/*" -not -path "./target/*" \
        -exec sh -c 'ln -sf CLAUDE.md "$(dirname {})/AGENTS.md"; ln -sf CLAUDE.md "$(dirname {})/GEMINI.md"' \;
```

Run `just symlink-docs` after adding any new `CLAUDE.md` file.

---

## 33. .gitignore and .dockerignore

Use the canonical files from syslog-mcp as the base. Copy them without modification.

Key `.gitignore` rules:
- `.env` and secret-bearing `.env.*` ignored; `.env.example` committed
- `target/` ignored
- `*.db`, `*.db-shm`, `*.db-wal` ignored
- AI tooling dirs ignored (`.claude/`, `.omc/`, `.lavra/`, etc.)
- `bin/` NOT ignored (LFS-tracked binaries are committed)

Key `.dockerignore` rules:
- `target/` excluded (built inside container)
- `tests/`, `docs/`, `scripts/`, `*.md` excluded (not needed at runtime)
- `.env`, `.env.*` excluded (injected at runtime)
- `Justfile`, `lefthook.yml` excluded
- Never exclude: `src/`, `Cargo.toml`, `Cargo.lock`, `config/`

---

## 34. CHANGELOG.md

Every repo has a `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-05-13

### Added
- Initial release
- MCP server with action-based tool dispatch
- CLI thin shim
- Bearer token + Google OAuth authentication
- Streamable HTTP + stdio transport
- Pinned npm stdio plugin launcher
- Strict JSON plugin configuration with private permissions
```

---

## Updated Checklist for New Servers

- [ ] Replace `yarr`/`YARR` with your service name throughout
- [ ] Implement API client in `src/<service>.rs` (transport only)
- [ ] Add service methods to `src/app.rs` (ALL logic here)
- [ ] Add actions to `src/actions.rs`, `src/mcp/tools.rs`, and `src/mcp/schemas.rs` (thin shim ONLY)
- [ ] Add CLI commands to `src/cli.rs` (thin shim ONLY)
- [ ] Update `src/config.rs` with service-specific fields
- [ ] Add fail-closed MCP elicitation to destructive actions, including nested Code Mode calls
- [ ] Set port in `config.toml` + `docker-compose.yml` + Dockerfile
- [ ] Implement central auth policy resolution in library code
- [ ] Implement `default_data_dir()` with container detection
- [ ] Use a pinned distroless runtime and direct numeric non-root entrypoint
- [ ] Set up xtask crate with `dist`, `ci`, `symlink-docs`, `check-env`
- [ ] Configure nextest (`.config/nextest.toml`)
- [ ] Configure taplo (`taplo.toml`)
- [ ] Configure lefthook (`lefthook.yml`) — minimal hooks only
- [ ] Write `.github/workflows/ci.yml`, `docker-publish.yml`, `release.yml`
- [ ] Write tests in `*_tests.rs` sidecars + `tests/` integration tests
- [ ] Write `tests/mcporter/test-mcp.sh` with semantic validation
- [ ] Update `plugins/<service>/skills/<service>/SKILL.md`
- [ ] Write `install.sh` matching the GitHub release tarball names
- [ ] Copy `.gitignore` and `.dockerignore` from syslog-mcp
- [ ] Write `CHANGELOG.md`
- [ ] Run `just symlink-docs` to create AGENTS.md + GEMINI.md symlinks
- [ ] Write `server.json` for MCP registry
- [ ] Write `.codex-plugin/plugin.json` next to `.claude-plugin/plugin.json`
- [ ] Verify CLI ↔ MCP action parity (every action reachable from both)
- [ ] Run `cargo check` — zero warnings
- [ ] Run `cargo nextest run` — all pass
- [ ] Run `taplo check` — all TOML valid
- [ ] Run `./tests/mcporter/test-mcp.sh` against live server

---

## 35. MCP Registry — server.json

Every server must have a `server.json` in the repo root for publishing to the
[official MCP registry](https://modelcontextprotocol.io/registry/quickstart).

Yarr's checked-in contract is npm stdio, not OCI or a hosted remote:

- name `ai.dinglebear/yarr`, proved through DNS for `dinglebear.ai`;
- package `@dinglebear/yarr-mcp@<repo-version>` with positional `mcp` argument;
- version coupled to Cargo, npm, release-please, and the registry manifest.

Install a specific, checksum-verified `mcp-publisher` release and publish only
after the exact npm version is public. GitHub/npm/Docker release automation does
not currently publish the MCP Registry entry. The complete manual procedure and
recovery contract live in `docs/MCP-REGISTRY-PUBLISH-GUIDE.md`.

---

## 36. Codex Plugin — .codex-plugin/plugin.json

Every server needs a Codex plugin manifest alongside the Claude plugin:

```
plugins/
  <service>/
    .claude-plugin/
      plugin.json     ← Claude Code plugin
    .codex-plugin/
      plugin.json     ← Codex plugin (this section)
    .mcp.json
    skills/
```

### .codex-plugin/plugin.json structure

```json
{
  "name": "yarr-mcp",
  "description": "Yarr service MCP server for Codex.",
  "homepage": "https://github.com/dinglebear-ai/yarr",
  "repository": "https://github.com/dinglebear-ai/yarr",
  "license": "MIT",
  "keywords": ["yarr", "mcp", "homelab"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "interface": {
    "displayName": "Yarr MCP",
    "shortDescription": "Query and manage Yarr service",
    "longDescription": "Full description of what this MCP server does, what data it exposes, and what operations it supports.",
    "developerName": "Jacob Magar",
    "category": "Infrastructure",
    "capabilities": ["Read"],
    "websiteURL": "https://github.com/dinglebear-ai/yarr",
    "defaultPrompt": [
      "Check Yarr service status.",
      "List all items in Yarr.",
      "Show Yarr health."
    ],
    "brandColor": "#6366F1"
  },
  "author": {
    "name": "Jacob Magar",
    "email": "jmagar@users.noreply.github.com",
    "url": "https://github.com/jmagar"
  }
}
```

The `.mcp.json` referenced is the shared one at `plugins/<service>/.mcp.json` —
both Claude and Codex plugins point to the same MCP server connection config.

---

## 37. CLI ↔ MCP Action Parity

**Every action accessible via the MCP tool MUST also be accessible via the CLI, and vice versa.**

This is the corollary to the thin-shim rule: since both CLI and MCP call the same
service methods, parity is achieved automatically IF the shims are complete.

### Parity enforcement

Maintain a parity table in `CLAUDE.md`:

| Service Method | MCP Action | CLI Command |
|---|---|---|
| `service.list_things()` | `yarr(action="things")` | `yarr things` |
| `service.get_thing(id)` | `yarr(action="thing", id=...)` | `yarr thing <id>` |
| `service.create_thing(name)` | `yarr(action="create_thing", name=...)` | `yarr create <name>` |
| `service.delete_thing(id)` | `yarr(action="delete_thing", id=...)` | `yarr delete <id>` |

### Common parity gaps to check

- `help` action in MCP → `yarr --help` or `yarr help` in CLI
- Resource listing in MCP → no CLI equivalent needed (resources are MCP-only)
- Prompts in MCP → no CLI equivalent needed (prompts are MCP-only)
- `health` action in MCP → `yarr health` in CLI
- Actions with optional params → CLI needs `--flag` for each optional param

### Template parity table (yarr)

| Method | MCP | CLI |
|---|---|---|
| `service.greet(name)` | `yarr(action="greet", name="...")` | `yarr greet [--name N]` |
| `service.echo(message)` | `yarr(action="echo", message="...")` | `yarr echo <message>` |
| `service.status()` | `yarr(action="status")` | `yarr status` |
| `service.help()` | `yarr(action="help")` | `yarr --help` |

---

## 38. refresh-docs.sh — Reference Documentation Refresh

Every server repo has a `scripts/refresh-docs.sh` that fetches fresh reference
material into `docs/references/`. This gives AI agents working in the repo accurate,
up-to-date docs for both the service API and the MCP transport layer.

### Pattern source

Adapted from `agentcast/scripts/refresh-docs.sh`. The core mechanics are identical:
- **Axon crawls** — `axon crawl <url> --wait --yes` → copies markdown output into `docs/references/<target>/`
- **Repomix packs** — `repomix --remote <repo> --style xml --output <file>` → XML snapshot for codebase-level reference
- **Sparse clones** — `git clone --sparse` to pull only specific doc directories
- **Change tracking** — sha256 checksums of all files before/after; appends a diff summary to `docs/references/CHANGES.md`

### What each server fetches

| Repo | Crawled sites | Repomix packs |
|---|---|---|
| lab | project docs and service docs as needed | jmagar/lab |
| axon_rust | modelcontextprotocol.io, Gemini/Qdrant/TEI docs as needed | jmagar/axon, mcp/rust-sdk |
| syslog-mcp | RFC/syslog and modelcontextprotocol.io docs as needed | jmagar/syslog-mcp, mcp/rust-sdk |
| unrust | docs.unraid.net, modelcontextprotocol.io | jmagar/unraid-api, mcp/rust-sdk, mcp/registry |
| rustify | gotify.net/docs, modelcontextprotocol.io | gotify/server, gotify/android, mcp/rust-sdk |
| rustifi | developer.ui.com, modelcontextprotocol.io | Art-of-WiFi/UniFi-API-client, mcp/rust-sdk |
| rustscale | tailscale.com/api, modelcontextprotocol.io | tailscale/tailscale (filtered), mcp/rust-sdk |
| apprise-mcp | github.com/caronc/apprise/wiki, modelcontextprotocol.io | caronc/apprise, caronc/apprise-api, mcp/rust-sdk |
| yarr | modelcontextprotocol.io, code.claude.com | mcp/rust-sdk, mcp/spec, mcp/registry, openclaw/mcporter |

### docs/references/ layout

```
docs/references/
  INDEX.md              ← auto-generated index of all reference material
  CHANGES.md            ← append-only change log from each refresh run
  <service>/
    docs/               ← Axon crawl output (manifest.jsonl + markdown/)
    repos/              ← Repomix XML packs
  mcp/
    docs/               ← modelcontextprotocol.io crawl
    repos/              ← rust-sdk, spec, registry XML packs
```

### Justfile recipes

```just
refresh-docs:           bash scripts/refresh-docs.sh
refresh-docs-repomix:   bash scripts/refresh-docs.sh --skip-crawl
refresh-docs-crawl:     bash scripts/refresh-docs.sh --skip-repomix
refresh-docs-dry:       bash scripts/refresh-docs.sh --dry-run
```

### .gitignore

`docs/references/` is in `.gitignore` — the content is large, auto-generated, and
should be fetched fresh by each developer. Only `docs/references/INDEX.md` and
`docs/references/CHANGES.md` are meaningful to commit (optional).

If you want to commit the INDEX and CHANGES but not the bulk content:
```gitignore
docs/references/
!docs/references/INDEX.md
!docs/references/CHANGES.md
```

### When to run

- When starting development on a new feature touching the service API
- When the service releases a new API version
- When debugging an unexpected API response shape
- Monthly, to keep docs current

### Dependencies

- `axon` — the Axon crawl CLI (`axon crawl <url> --wait --yes`)
- `repomix` or `npx --yes repomix` — codebase packer
- `git` — for sparse clones
- `sha256sum` — for change detection

### Adding your service's docs (when adapting the template)

In `scripts/refresh-docs.sh`, find the `TEMPLATE:` comment blocks and add:

```bash
# In the crawl_docs section:
crawl_docs "https://your-service.com/api-docs" "your-service.com" "your-service/docs"

# In the pack_repo section:
pack_repo "your-org/your-service" "your-service/repos/your-service.xml" \
  "api/**,src/**" "test/**,node_modules/**"
```

Then update `write_index()` to include your new paths in the generated `INDEX.md`.

---

## 39. Informative Error Messages — Agent-First Design

Every error that can be returned from an MCP tool, CLI command, or API endpoint
must tell an agent exactly what went wrong AND how to fix it.

### MCP tool error structure

```rust
// Bad — opaque error
Err(anyhow::anyhow!("not found"))

// Good — agent-correctable error
Err(anyhow::anyhow!(
    "docker_logs: container not found: id={id}\n\
     Hint: use action=docker to list available container IDs first.\n\
     Yarr: yarr(action=\"docker\") → pick an id from the results"
))
```

### Error response shape for MCP

When a tool call fails, return `CallToolResult::error()` with structured text:

```rust
Ok(CallToolResult::error(vec![Content::text(format!(
    "ERROR: {action} failed\n\
     Reason: {reason}\n\
     Hint: {how_to_fix}\n\
     See: action=help for full documentation"
))]))
```

### Required error fields

Every MCP error message must include:

| Field | Yarr |
|---|---|
| What failed | `"docker_logs: container id not found"` |
| The bad value | `"id=\"abc123\""` |
| Why it failed | `"container may be stopped or removed"` |
| How to fix | `"use action=docker to list running container ids"` |

### Validation errors vs runtime errors

- **Missing required arg**: `"`id` is required for docker_logs — pass id=<container_id>"`
- **Wrong type**: `"`tail` must be an integer, got \"fifty\""`
- **Unknown action**: `"unknown action: \"florp\" — valid actions: array, disks, docker, ..., help"`
- **API unreachable**: `"YARR_URL unreachable: connection refused (http://localhost:8765) — is the service running?"`
- **Auth failure**: `"API key rejected (YARR_API_KEY) — check the key is valid and has not expired"`

### CLI error messages

CLI errors go to stderr, always include the failing command, and suggest the fix:

```
Error: `yarr thing abc` — id must be numeric
       Run `yarr things` to list valid IDs
```

---

## 40. Agent-First Output — Token Discipline

Every surface assumes an agent may be consuming the output. Agents have finite
context windows. All outputs must be bounded, structured, and paginated.

### 10K token cap

No single response may return more than ~10,000 tokens (~40KB of text). If the
raw response would exceed this, truncate with a clear message:

```rust
const MAX_RESPONSE_BYTES: usize = 40_000; // ~10K tokens

fn truncate_response(text: &str) -> String {
    if text.len() <= MAX_RESPONSE_BYTES {
        return text.to_string();
    }
    let truncated = &text[..MAX_RESPONSE_BYTES];
    format!("{truncated}\n\n[TRUNCATED: response exceeded 10K token limit. Use limit/offset or more specific filters.]")
}
```

### Pagination for list actions

Every action that returns a list MUST support `limit` and `offset` (or `cursor`):

```rust
// In tools.rs:
"things" => {
    let limit  = u32_arg(&args, "limit")?.unwrap_or(50).min(200);
    let offset = u32_arg(&args, "offset")?.unwrap_or(0);
    state.service.list_things(limit, offset).await
}

// Response shape includes pagination metadata:
{
  "items": [...],
  "total": 1842,
  "limit": 50,
  "offset": 0,
  "has_more": true,
  "next_offset": 50
}
```

### Filtering for list actions

List actions that return heterogeneous data MUST support filtering:

```rust
// In schemas.rs — add to inputSchema properties:
"filter": {
    "type": "string",
    "description": "Filter by name/label (substring match, case-insensitive)"
},
"state": {
    "type": "string",
    "description": "Filter by state (e.g. running, stopped)"
}
```

### --json flag on all CLI commands

Every CLI command that outputs data MUST support `--json`. JSON output:
- Is machine-readable without parsing
- Matches the MCP response shape exactly
- Goes to stdout (human-readable output goes to stderr)
- Enables piping: `yarr things --json | jq '.items[].name'`

### Stable output shapes

JSON shapes must be stable across versions. Field additions are OK; removals and
renames are breaking changes. Every field returned must be documented.

### Summarize by default, expand on request

```
# Default: summary view (fits on screen)
$ yarr things
  ID   NAME               STATE    UPDATED
  42   my-thing           active   2m ago
  43   other-thing        idle     1h ago

# Full detail: --verbose or specific action
$ yarr thing 42
$ yarr thing 42 --json
```

---

## 41. Observability — Glass House, Not Black Box

Every server must expose its internal state through observable surfaces.
Agents and operators should never have to guess what the server is doing.

### Required HTTP endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /health` | none | Basic liveness + upstream connectivity |
| `GET /status` | none | Redacted runtime status from the service layer |
| `GET /metrics` | bearer | Prometheus-compatible metrics (optional) |

### /health response (always fast, no auth)

```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime_secs": 3600,
  "upstream": {
    "reachable": true,
    "latency_ms": 12
  }
}
```

If upstream is unreachable, return HTTP 200 with `status: "degraded"` — the MCP
server is up even if the upstream service is down.

### /status response (redacted runtime state)

```json
{
  "status": "ok",
  "server": {
    "version": "0.1.0",
    "uptime_secs": 3600,
    "pid": 12345,
    "data_dir": "/home/user/.yarr"
  },
  "config": {
    "host": "0.0.0.0",
    "port": 3000,
    "auth_mode": "bearer",
    "upstream_url": "https://yarr.com/api"
  },
  "counters": {
    "requests_total": 1234,
    "errors_total": 5,
    "upstream_calls": 1200,
    "upstream_errors": 3
  },
  "upstream": {
    "reachable": true,
    "last_check_ms_ago": 250,
    "consecutive_failures": 0
  }
}
```

### MCP tool: status action

Expose runtime state via MCP too (same data as /status):

```rust
"status" => state.service.status().await,
```

The `status` action must ALWAYS be available even when the upstream service is down.

### Structured tracing spans

Every external API call must be wrapped in a tracing span:

```rust
async fn list_things(&self) -> Result<Value> {
    let span = tracing::info_span!("upstream.list_things");
    let _guard = span.enter();
    tracing::debug!(url = %self.base_url, "calling upstream API");
    let result = self.client.list_things().await;
    match &result {
        Ok(v)  => tracing::debug!(count = v.as_array().map(|a| a.len()).unwrap_or(0), "upstream call ok"),
        Err(e) => tracing::warn!(error = %e, "upstream call failed"),
    }
    result
}
```

### Atomic request counters

```rust
pub struct Counters {
    pub requests_total:     AtomicU64,
    pub errors_total:       AtomicU64,
    pub upstream_calls:     AtomicU64,
    pub upstream_errors:    AtomicU64,
}
```

These counters live on `AppState` and increment in the MCP tool dispatcher and
the API client respectively.

---

## 42. Logging — Dual Output, One File, Aurora Colors

### Two writers, always

Every server writes logs to two destinations simultaneously:
1. **Console (stderr)**: human-readable, colored, pretty format
2. **File**: structured JSON (one field per line), machine-readable

```rust
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn init_logging(data_dir: &Path, service_name: &str) -> anyhow::Result<()> {
    let log_path = data_dir.join("logs").join(format!("{service_name}.log"));
    std::fs::create_dir_all(log_path.parent().unwrap())?;

    let file = rolling_file(log_path, 10 * 1024 * 1024)?; // 10MB cap, 1 file
    let console_ansi = should_colorize();

    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(
            // Console: pretty, colored, human-readable
            tracing_subscriber::fmt::layer()
                .with_ansi(console_ansi)
                .with_writer(std::io::stderr)
                .event_format(AuroraFormatter)  // custom formatter, see below
        )
        .with(
            // File: structured JSON, no ANSI
            tracing_subscriber::fmt::layer()
                .json()
                .with_ansi(false)
                .with_writer(file)
        )
        .init();
    Ok(())
}
```

### Log file rotation — 1 file, 10MB cap, then restart

One log file only. When it reaches 10MB, truncate it and start over:

```rust
fn rolling_file(path: PathBuf, max_bytes: u64) -> anyhow::Result<impl std::io::Write + Send + Sync> {
    // Check size on open; truncate if over limit
    if path.exists() && path.metadata()?.len() >= max_bytes {
        std::fs::write(&path, b"")?; // truncate
    }
    Ok(RollingWriter { path, max_bytes, current_size: 0 })
}
```

Or use `tracing-appender` with a custom sink. The key invariant: **exactly one log file, never more**.

Log file location: `{data_dir}/logs/{service}.log` (which resolves to `~/.{service}/logs/{service}.log`)

### Aurora color palette for console logs

Copy the aurora constants from `lab/crates/lab/src/output/theme.rs`.
All repos in the family **must** use these exact values — they are ground-truthed
against the Aurora design system CSS tokens in `aurora-design-system/registry/aurora/styles/aurora.css`.

```rust
// src/logging/aurora.rs  (ANSI 256 — matches lab's aurora palette exactly)
pub const SERVICE_NAME:   u8 = 211; // pink        RGB (255,175,215)
pub const ACCENT_PRIMARY: u8 = 39;  // bright blue RGB (41,182,246)
pub const TEXT_MUTED:     u8 = 250; // light grey  RGB (167,188,201)
pub const SUCCESS:        u8 = 115; // teal        RGB (125,211,199)
pub const WARN:           u8 = 180; // amber       RGB (198,163,107)
pub const ERROR:          u8 = 174; // muted red   RGB (199,132,144)
```

Cross-reference to Aurora CSS tokens (terminals that support TrueColor use the RGB column;
ANSI 256 is the fallback for terminals like `docker compose logs`):

| Const | ANSI 256 | TrueColor RGB | Aurora CSS token | CSS hex |
|---|---|---|---|---|
| `SERVICE_NAME` | 211 | (255, 175, 215) | `--aurora-accent-pink` | `#f9a8c4` |
| `ACCENT_PRIMARY` | 39 | (41, 182, 246) | `--aurora-accent-primary` | `#29b6f6` |
| `TEXT_MUTED` | 250 | (167, 188, 201) | `--aurora-text-muted` | `#a7bcc9` |
| `SUCCESS` | 115 | (125, 211, 199) | `--aurora-success` | `#7dd3c7` |
| `WARN` | 180 | (198, 163, 107) | `--aurora-warn` | `#c6a36b` |
| `ERROR` | 174 | (199, 132, 144) | `--aurora-error` | `#c78490` |

Note: `SERVICE_NAME` ANSI 256 (211) and TrueColor RGB are the closest terminal
approximations to `--aurora-accent-pink: #f9a8c4`; the palette is tuned for readability
in log streams rather than pixel-perfect CSS parity.

Level colors for the console formatter:
- `ERROR` → aurora::ERROR (muted red), bold
- `WARN`  → aurora::WARN (amber), bold
- `INFO`  → no color (white/default)
- `DEBUG` → dim
- `TRACE` → dim

Structured field colors (matching lab's `style_value`):
- `action`, `tool`, `route` → aurora::ACCENT_PRIMARY (bright blue)
- `service` → aurora::SERVICE_NAME (pink)
- `error` → aurora::ERROR (muted red)
- `status` HTTP code < 300 → aurora::SUCCESS, < 500 → aurora::WARN, else aurora::ERROR

### Environment-aware colorization

```rust
fn should_colorize() -> bool {
    // Respect NO_COLOR (https://no-color.org)
    if std::env::var_os("NO_COLOR").is_some() { return false; }
    // Force color in containers (Docker sets TERM=xterm or similar)
    if std::env::var("FORCE_COLOR").is_ok()   { return true; }
    // Check if stderr is a TTY
    use std::io::IsTerminal;
    std::io::stderr().is_terminal()
}
```

This keeps logs colored in docker (for `docker compose logs`) while staying
pipeable when stderr is redirected.

### Log format — console

```
2026-05-13T14:32:01Z  INFO  unraid-mcp started  bind=0.0.0.0:6970  auth=bearer
2026-05-13T14:32:05Z  INFO  MCP tool call  tool=unraid  action=array  elapsed_ms=42
2026-05-13T14:32:10Z  WARN  upstream slow  action=metrics  elapsed_ms=3200
2026-05-13T14:32:15Z ERROR  upstream failed  action=docker  error="connection refused"
```

### Log format — file (JSON)

```json
{"timestamp":"2026-05-13T14:32:01Z","level":"INFO","message":"MCP tool call","tool":"unraid","action":"array","elapsed_ms":42}
```

---

## 43. Graceful Degradation

The MCP server must stay running and return useful responses even when the
upstream service is unavailable. Never crash on upstream failures.

### Principles

1. **MCP server UP, upstream DOWN** — return tool errors, not panics
2. **Partial failures** — return what succeeded, mark what failed
3. **Startup with bad config** — warn, don't crash (except security violations)
4. **Upstream timeouts** — fail fast with a clear error, suggest health check

### Error handling hierarchy

```rust
// In the API client — never panic, always Result
pub async fn list_things(&self) -> Result<Value> {
    self.client
        .get(&url)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .context("upstream request failed — is YARR_URL correct?")?
        .json::<Value>()
        .await
        .context("upstream returned invalid JSON")
}

// In the service — categorize errors
pub async fn list_things(&self) -> Result<Value> {
    self.client.list_things().await.map_err(|e| {
        if e.to_string().contains("connection refused") {
            anyhow::anyhow!(
                "upstream unreachable: {}\n\
                 Hint: run `yarr health` to check service status\n\
                 Config: YARR_URL={}",
                e, self.base_url
            )
        } else {
            e
        }
    })
}
```

### MCP tool — never return Err from execute_tool

MCP tool errors should be `CallToolResult::error()`, not `Err(ErrorData)`.
An `Err` crashes the tool call at the protocol level; a `CallToolResult::error`
gives the agent a readable message:

```rust
match state.service.list_things().await {
    Ok(result)  => tool_result_from_json(result),
    Err(error)  => Ok(CallToolResult::error(vec![
        Content::text(format!(
            "ERROR: list_things failed\n\
             Reason: {error}\n\
             Hint: use action=status to check server health"
        ))
    ])),
}
```

---

## 44. Plugin Setup Contract

The normative plugin contract is defined in section 13: pinned npm stdio
launch, a `SessionStart`/`ConfigChange` hook pair driving a repository-relative
setup script, allowlisted string options, atomic mode-0600 JSON in a mode-0700
directory, and JSON-only client loading. Contract tests must require the hook
pair, and must reject bundled executables, `config.env`, `source`/`eval`,
floating npm versions, unsafe keys/types, and non-private file permissions.

---

## 45. Code Organization — Small Focused Modules

### File size targets (from agentcast CODE_ORGANIZATION.md)

| Threshold | Action |
|---|---|
| ≤ 250 non-test lines | Target — ideal module size |
| > 400 non-test lines | Must add split/refactor note in PR |
| > 600 non-test lines | Requires documented exception |
| > 800 total lines | Must split unless generated/fixture/schema mirror |

### Function size targets

| Threshold | Action |
|---|---|
| ≤ 60 lines | Target |
| > 100 lines | Requires refactor or documented exception |

### Module naming — one responsibility per file

Good:
```
src/mcp/tools/dispatch.rs     — action dispatch match arm
src/mcp/tools/arg_helpers.rs  — string_arg, i64_arg, bool_arg helpers
src/logging/console.rs        — console formatter
src/logging/file.rs           — file writer + rotation
src/logging/aurora.rs         — color constants
src/error.rs                  — error types and helpers
src/pagination.rs             — limit/offset/cursor helpers
src/token_limit.rs            — response truncation
```

Bad:
```
src/utils.rs      — catch-all
src/helpers.rs    — catch-all
src/manager.rs    — ambiguous
src/mod.rs        — BANNED (see §45)
```

### Split large files immediately

When a file approaches 400 lines, split it before it gets larger. Common splits:
- `tools.rs` → `tools/dispatch.rs` + `tools/arg_helpers.rs` + `tools/formatters.rs`
- `cli.rs`   → `cli/commands.rs` + `cli/parse.rs` + `cli/format.rs`
- `config.rs`→ `config/env.rs` + `config/toml.rs` + `config/validate.rs`

---

## 45. Modern Rust — No mod.rs

**`mod.rs` files are BANNED.** Use named module files instead.

```
# Wrong (old style)
src/mcp/mod.rs
src/mcp/tools.rs

# Correct (modern)
src/mcp.rs          ← module entry point (replaces mod.rs)
src/mcp/tools.rs
src/mcp/schemas.rs
```

This makes the module tree navigable without opening `mod.rs` everywhere.

A pre-commit git hook enforces this at commit time:

```sh
# .git/hooks/pre-commit (chmod +x)
mod_rs_files=$(git diff --cached --name-only | grep '/mod\.rs$\|^mod\.rs$')
if [ -n "$mod_rs_files" ]; then
  echo "error: mod.rs is banned. Use foo.rs + foo/ instead of foo/mod.rs." >&2
  echo "$mod_rs_files" | sed 's/^/  /' >&2
  exit 1
fi
```

### Other modern Rust requirements

- Rust 2024 edition
- Use `async fn` in traits where the crate supports it (rmcp 1.6+ does)
- Prefer `?` operator chains over nested `match`
- `#[must_use]` on functions returning `Result` or important values
- `impl Display for Error` instead of raw string errors where types are reused
- `thiserror` for structured error types in the service layer
- `serde_json::json!()` macro over manual Value construction
- Avoid `unwrap()`/`expect()` in production paths — use `?` or proper error handling


---

## 46. Binary Commands — Canonical Mode Names

Every server binary exposes exactly two server modes and a CLI:

| Command | Mode | Description |
|---|---|---|
| `<service> mcp` | stdio MCP transport | For Claude Code `.claude/settings.json` stdio servers; output goes to stdout, logs to stderr |
| `<service> serve` | Streamable HTTP MCP | For remote/Docker deployment; binds to `YARR_MCP_HOST:YARR_MCP_PORT` |
| `<service> [subcommand]` | CLI | Direct API access; flags such as `--json` are command-specific |
| `<service> doctor` | Pre-flight check | Validates environment and config before deployment (see §48) |
| `<service> --help` | Help | Print usage |
| `<service> --version` | Version | Print version |

### Claude Code stdio config (`~/.claude/settings.json`)

```json
{
  "mcpServers": {
    "yarr": {
      "type": "stdio",
      "command": "yarr",
      "args": ["mcp"]
    }
  }
}
```

The binary MUST be in `$PATH` for the stdio config to work (see §47).

---

## 47. Binary Installation — Copying to PATH

The install script MUST copy (or symlink) the binary to `~/.local/bin/` so it is
available in the user's `$PATH` without prefixing the full path.

### install.sh binary installation

```bash
INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "${INSTALL_DIR}"

# Download and install
BINARY_URL="https://github.com/dinglebear-ai/yarr/releases/latest/download/yarr-x86_64.tar.gz"
tmpdir="$(mktemp -d)"
curl -fsSL "${BINARY_URL}" -o "${tmpdir}/yarr.tar.gz"
tar -xzf "${tmpdir}/yarr.tar.gz" -C "${tmpdir}"
install -m 755 "${tmpdir}/yarr" "${INSTALL_DIR}/yarr"
chmod +x "${INSTALL_DIR}/yarr"

# Ensure ~/.local/bin is in PATH
if ! echo "$PATH" | grep -q "${HOME}/.local/bin"; then
    echo "⚠  Add ~/.local/bin to your PATH:"
    echo "   echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
fi

echo "✓ yarr installed to ${INSTALL_DIR}/yarr"
echo "  Run: yarr doctor    # validate environment"
echo "  Run: yarr --version # verify install"
```

### Plugin launcher

Plugins launch the exact repository-coupled `@dinglebear/yarr-mcp@<version>` npm package
through `npx -y`; SessionStart never installs or symlinks a bundled binary.

---

## 48. doctor Command — Pre-flight Validation

Every server binary MUST implement a `doctor` subcommand that validates the
environment and reports what's missing before the user tries to start the server.

### doctor output format

```
$ yarr doctor

yarr-mcp v0.1.0 — environment check

  Config
  ──────────────────────────────────────────────
  ✓ Config file:       ~/.yarr/config.toml
  ✓ Data directory:    ~/.yarr/ (writable)
  ✓ Log directory:     ~/.yarr/logs/ (writable, 1.2 MB)
  ✓ Binary in PATH:    /home/user/.local/bin/yarr

  Service credentials
  ──────────────────────────────────────────────
  ✓ YARR_SERVICES:  sonarr,radarr (set)
  ✗ YARR_SONARR_API_KEY: not set
    → Set YARR_SONARR_API_KEY in ~/.yarr/.env or your environment

  Connectivity
  ──────────────────────────────────────────────
  ✓ sonarr reachable: https://sonarr.internal → 200 OK (42 ms)

  MCP server
  ──────────────────────────────────────────────
  ✓ MCP port 40070:    available  # TEMPLATE: canonical yarr port is 40070 (YARR_MCP_PORT)
  ✓ Auth mode:         no-auth (YARR_NOAUTH=true)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1 issue found. Fix it before running: yarr serve

```

### doctor Rust implementation

```rust
// In src/cli/doctor.rs (or src/cli.rs CliCommand::Doctor)
pub async fn run_doctor(config: &Config, json: bool) -> anyhow::Result<()> {
    let mut checks: Vec<DoctorCheck> = Vec::new();

    // 1. Config file
    let data_dir = default_data_dir();
    checks.push(check_config_file(&data_dir));
    checks.push(check_dir_writable("Data directory", &data_dir));
    checks.push(check_dir_writable("Log directory", &data_dir.join("logs")));
    checks.push(check_binary_in_path("yarr"));

    // 2. Required env vars / config
    checks.push(check_required_var("YARR_SERVICES", &configured_services));

    // 3. Connectivity (non-fatal if unreachable)
    for service in &config.yarr.services {
        checks.push(check_upstream(&service.base_url, service.api_key.as_deref()).await);
    }
    }

    // 4. MCP port availability
    checks.push(check_port_available(config.mcp.port));

    // 5. Auth config
    checks.push(check_auth_config(config));

    let issues = checks.iter().filter(|c| !c.ok).count();

    if json {
        println!("{}", serde_json::to_string_pretty(&checks)?);
    } else {
        print_doctor_report(&checks);
    }

    if issues > 0 {
        std::process::exit(1);
    }
    Ok(())
}

#[derive(serde::Serialize)]
struct DoctorCheck {
    category: &'static str,
    name: String,
    ok: bool,
    value: Option<String>,     // what was found
    hint: Option<String>,      // how to fix (only when !ok)
    latency_ms: Option<u64>,   // for connectivity checks
}
```

### doctor --json output

```json
[
  {"category": "config", "name": "Config file", "ok": true, "value": "~/.yarr/config.toml"},
  {"category": "credentials", "name": "YARR_API_KEY", "ok": false, "hint": "Set YARR_API_KEY in ~/.yarr/.env"},
  {"category": "connectivity", "name": "Upstream", "ok": true, "value": "200 OK", "latency_ms": 42}
]
```

Exit code: `0` = all checks pass, `1` = one or more failures.

---

## 49. install.sh — Pre-flight Checks

The install script must validate the environment BEFORE installing anything and
report a clear summary of what it found and what it will do.

### Pre-flight checklist

```bash
preflight() {
    local errors=0

    echo "Pre-flight checks..."

    # 1. OS / arch
    local os arch
    os="$(uname -s | tr '[:upper:]' '[:lower:]')"
    arch="$(uname -m)"
    case "${arch}" in
        x86_64|amd64) arch="amd64" ;;
        *) echo "✗ Unsupported arch: ${arch}; only x86_64 is supported"; (( errors++ )) ;;
    esac
    [[ "${os}" == "linux" ]] || { echo "✗ Only Linux is supported (got: ${os})"; (( errors++ )); }
    echo "✓ Platform: ${os}/${arch}"

    # 2. Required tools
    for cmd in curl tar grep; do
        command -v "${cmd}" >/dev/null 2>&1 \
            && echo "✓ ${cmd}: $(command -v ${cmd})" \
            || { echo "✗ ${cmd}: not found (required)"; (( errors++ )); }
    done

    # 3. Disk space (need at least 50MB)
    local free_mb
    free_mb="$(df -k "${HOME}" | awk 'NR==2{printf "%d", $4/1024}')"
    if (( free_mb < 50 )); then
        echo "✗ Disk space: only ${free_mb}MB free in ${HOME} (need 50MB)"; (( errors++ ))
    else
        echo "✓ Disk space: ${free_mb}MB free"
    fi

    # 4. ~/.local/bin writable (or can be created)
    local install_dir="${INSTALL_DIR:-${HOME}/.local/bin}"
    if mkdir -p "${install_dir}" && [[ -w "${install_dir}" ]]; then
        echo "✓ Install dir: ${install_dir} (writable)"
    else
        echo "✗ Install dir: ${install_dir} (not writable)"; (( errors++ ))
    fi

    # 5. PATH check
    echo "${PATH}" | grep -q "${HOME}/.local/bin" \
        && echo "✓ PATH: ~/.local/bin is present" \
        || echo "⚠  PATH: ~/.local/bin not in PATH — will print instructions"

    # 6. Required env vars (warn, don't fail — can be set post-install)
    [[ -n "${YARR_SERVICES:-}" ]] \
        && echo "✓ YARR_SERVICES: set" \
        || echo "⚠  YARR_SERVICES: not set (required before running the server)"

    # 7. Port availability (warn only)
    # TEMPLATE: canonical yarr port is 40070; update this default when adapting
    local port="${YARR_MCP_PORT:-40070}"
    if ss -tlnp "sport = :${port}" 2>/dev/null | awk 'NR>1' | grep -q .; then
        echo "⚠  Port ${port}: already in use (change YARR_MCP_PORT if needed)"
    else
        echo "✓ Port ${port}: available"
    fi

    echo ""
    if (( errors > 0 )); then
        echo "✗ Pre-flight failed with ${errors} error(s). Fix them and re-run."
        return 1
    fi
    echo "✓ Pre-flight passed — proceeding with install"
    return 0
}
```

### Post-install setup

After installing the binary, the script MUST:

1. Copy/link binary to `INSTALL_DIR`
2. Create `~/.{service}/` data directory
3. Write a starter `.env` if none exists (with required vars as comments/examples)
4. Run `<service> doctor` to validate the installation
5. Print next steps

```bash
post_install() {
    echo ""
    echo "Running doctor check..."
    if "${INSTALL_DIR}/${BINARY}" doctor 2>/dev/null; then
        echo ""
        echo "✓ Installation complete and verified."
    else
        echo ""
        echo "⚠  Installation complete but doctor found issues."
        echo "   Fix the reported issues, then run: ${BINARY} serve"
    fi

    echo ""
    echo "Next steps:"
    echo "  1. Edit ~/.${SERVICE}/.env with your credentials"
    echo "  2. Run: ${BINARY} doctor       # validate config"
    echo "  3. Run: ${BINARY} serve        # start HTTP server"
    echo "  4. Or:  ${BINARY} mcp          # stdio for Claude Code"
}
```

---

## 50. Distroless Startup — Defense by Removal

The production runtime should contain only the dynamic libraries and CA bundle
needed by the service binary. It must not start as root, include a shell, or
mutate bind-mount ownership at startup.

```dockerfile
FROM gcr.io/distroless/cc-debian13:nonroot@sha256:<manifest-digest>
COPY --from=builder --chown=1000:1000 /usr/local/bin/yarr /usr/local/bin/yarr
COPY --from=builder --chown=1000:1000 /runtime-data/ /data/
USER 1000:1000
HEALTHCHECK CMD ["/usr/local/bin/yarr", "watch", "--once", "--url", "http://127.0.0.1:40070/ready"]
ENTRYPOINT ["/usr/local/bin/yarr"]
CMD ["serve", "mcp"]
```

### Key principles

1. **Provision outside the container** — create the host data directory with UID/GID 1000 and mode 0750 before deployment.
2. **No privilege transition** — the process starts and remains non-root.
3. **No shell or package manager** — runtime mutation and shell-based persistence are unavailable.
4. **Direct PID 1** — the service binary receives SIGTERM/SIGINT without a wrapper.
5. **Application-native readiness** — the one-shot probe exits non-zero unless `/ready` returns 2xx.
6. **Immutable dependency surface** — pin the distroless manifest and scan the built digest before promotion.

---

# Advanced Patterns

---

## A1. Single Binary, Single Port — Multi-Surface Architecture

Every service runs all surfaces (MCP, REST API, web UI) from **one binary on one port**.
There is no separate web server, no separate API server — just one axum router.

```
Port 3000
  ├── /mcp                   → Streamable HTTP MCP transport
  ├── /health                → Unauthenticated liveness probe
  ├── /status                → Runtime state (auth required)
  ├── /v1/<service>          → REST API action dispatch
  │     POST {"action":"greet","params":{"name":"Alice"}}
  ├── /.well-known/*         → OAuth metadata (when auth_mode=oauth)
  ├── /authorize, /token     → OAuth flow endpoints
  └── /*                     → SPA fallback (serves embedded web UI)
```

### Why one port?

- No port management complexity for operators
- Auth middleware wraps the whole stack consistently
- Claude Code stdio + HTTP MCP + browser all connect to the same server
- Docker config is one port mapping, one healthcheck

### Route composition pattern (axum)

```rust
// src/server/routes.rs
pub fn router(state: AppState) -> Router {
    // 1. Public routes (no auth)
    let public = Router::new()
        .route("/health", get(health))
        .route("/status", get(status));  // returns degraded if auth absent

    // 2. REST API — action dispatch (same methods as MCP tools)
    let api = Router::new()
        .route("/v1/yarr", post(api_dispatch))  // see §A2
        .route_layer(auth_layer.clone());

    // 3. MCP transport
    let mcp_service = Router::new()
        .nest_service("/mcp", streamable_http_service(state.clone(), mcp_config));
    let mcp = if let Some(layer) = build_auth_layer(&state.auth_policy, ...) {
        mcp_service.layer(layer)
    } else {
        mcp_service
    };

    // 4. OAuth routes (when auth_mode=oauth)
    let oauth = oauth_routes_if_configured(&state);

    // 5. Compose — order matters: specific routes before fallback
    let mut router = Router::new()
        .merge(public)
        .merge(api)
        .merge(mcp);
    if let Some(oauth) = oauth {
        router = router.merge(oauth);
    }
    // 6. SPA fallback — LAST (catches anything not matched above)
    if state.web_assets_enabled() {
        router = router.fallback(serve_web_assets);
    }

    router
        .with_state(state)
        .layer(CorsLayer::new()...)
        .layer(CompressionLayer::new())
        .layer(TimeoutLayer::new(Duration::from_secs(30)))
        .layer(TraceLayer::new_for_http())
}
```

---

## A2. REST API — Action Dispatch Mirrors MCP

The REST API uses the same `action` + `params` pattern as MCP tools. This means:
- **One service method** serves both MCP and HTTP — no duplication
- Agents can use whichever surface is available
- The request shape is identical: `{"action":"greet","params":{"name":"Alice"}}`

```rust
// src/api.rs
#[derive(Deserialize)]
pub struct ActionRequest {
    pub action: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

async fn api_dispatch(
    State(state): State<AppState>,
    Json(body): Json<ActionRequest>,
) -> impl IntoResponse {
    // Reuse the same service methods as MCP tools
    let result = match body.action.as_str() {
        "greet" => {
            let name = body.params["name"].as_str();
            state.service.greet(name).await
        }
        "echo" => {
            let msg = body.params["message"].as_str().unwrap_or("");
            state.service.echo(msg).await
        }
        "status" => state.service.status().await,
        other => Err(anyhow::anyhow!(
            "unknown action: {other}. POST to /v1/yarr with action=help"
        )),
    };

    match result {
        Ok(value) => Json(value).into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": e.to_string()})),
        ).into_response(),
    }
}
```

### API parity table

| Surface | Call pattern |
|---|---|
| MCP | `yarr(action="greet", name="Alice")` |
| REST | `POST /v1/yarr {"action":"greet","params":{"name":"Alice"}}` |
| CLI | `yarr greet --name Alice` |

All three call `state.service.greet(Some("Alice"))`.

---

## A3. Embedded Static Web Assets

The web UI is a Next.js (or Vite) app compiled to static files and embedded in the
Rust binary at compile time using `include_dir!`. No separate file serving process.

### Build flow

```
apps/web/           ← Next.js or Vite app source
  next.config.ts    ← output: "export" (static HTML/CSS/JS)
  out/              ← compiled static output (gitignored, built in CI)

src/web.rs          ← Rust: embeds out/ into binary with include_dir!
```

### Embedding (src/web.rs)

```rust
use include_dir::{Dir, include_dir};
use axum::{
    extract::Request,
    response::{IntoResponse, Response},
    http::{StatusCode, header},
    body::Body,
};

// Compiled at build time — zero runtime file I/O
static WEB_ASSETS: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/apps/web/out");

pub fn web_assets_available() -> bool {
    WEB_ASSETS.get_file("index.html").is_some()
}

pub async fn serve_web_assets(request: Request<Body>) -> Response {
    let path = request.uri().path().trim_start_matches('/');

    // Try exact path, then with .html, then index.html (SPA fallback)
    let candidates = [
        path.to_string(),
        format!("{path}.html"),
        format!("{path}/index.html"),
        "index.html".to_string(),
    ];

    for candidate in &candidates {
        if let Some(file) = WEB_ASSETS.get_file(candidate) {
            let content_type = guess_mime(candidate);
            let cache_control = if candidate == "index.html" {
                "no-store"  // SPA shell must not be cached
            } else {
                "public, max-age=31536000, immutable"  // hashed assets = forever
            };
            return (
                StatusCode::OK,
                [(header::CONTENT_TYPE, content_type),
                 (header::CACHE_CONTROL, cache_control)],
                file.contents().to_vec(),
            ).into_response();
        }
    }

    // 404 → SPA fallback (client-side routing handles the rest)
    if let Some(file) = WEB_ASSETS.get_file("index.html") {
        return (StatusCode::OK, [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
                file.contents().to_vec()).into_response();
    }

    StatusCode::NOT_FOUND.into_response()
}

fn guess_mime(path: &str) -> &'static str {
    if path.ends_with(".html") { "text/html; charset=utf-8" }
    else if path.ends_with(".css")  { "text/css; charset=utf-8" }
    else if path.ends_with(".js")   { "application/javascript; charset=utf-8" }
    else if path.ends_with(".json") { "application/json" }
    else if path.ends_with(".svg")  { "image/svg+xml" }
    else if path.ends_with(".png")  { "image/png" }
    else if path.ends_with(".ico")  { "image/x-icon" }
    else if path.ends_with(".woff2"){ "font/woff2" }
    else { "application/octet-stream" }
}
```

### Build script (build.rs)

```rust
// build.rs — ensure Next.js output is built before embedding
fn main() {
    // Tell cargo to re-run if web source changes
    println!("cargo:rerun-if-changed=apps/web/src");
    println!("cargo:rerun-if-changed=apps/web/package.json");

    // Build Next.js in CI; skip in local dev if out/ already exists
    let out_dir = std::path::Path::new("apps/web/out");
    if !out_dir.exists() {
        let status = std::process::Command::new("pnpm")
            .args(["--dir", "apps/web", "build"])
            .status();
        if let Err(e) = status {
            // Don't fail the Rust build — just warn. Serve will show 404 for web.
            println!("cargo:warning=Web build failed: {e}. Web UI will be unavailable.");
        }
    }
}
```

### AppState: web_assets_enabled()

```rust
impl AppState {
    pub fn web_assets_enabled(&self) -> bool {
        crate::web::web_assets_available()
        // Can also be controlled by: !config.mcp.disable_web_ui
    }
}
```

---

## A4. Aurora Design System Integration

The web UI uses the Aurora design system — a shadcn-compatible registry of
128 components designed for operator-grade AI products.

Registry URL: `https://aurora.tootie.tv`
GitHub: `https://github.com/dinglebear-ai/aurora`

### Setup

```bash
cd apps/web
# 1. Add Aurora to components.json registries
# Already configured if using the template — see apps/web/components.json

# 2. Install Aurora token layer (required first)
pnpm dlx shadcn@latest add https://aurora.tootie.tv/r/aurora-tokens.json

# 3. Install all Aurora components
pnpm dlx shadcn@latest add @aurora/aurora-button @aurora/aurora-card @aurora/aurora-badge \
  @aurora/aurora-input @aurora/aurora-table @aurora/aurora-dialog @aurora/aurora-tabs \
  @aurora/aurora-alert @aurora/aurora-toast @aurora/aurora-progress @aurora/aurora-skeleton
  # ... all 64 UI primitives from the registry
```

### components.json setup

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@aurora": "https://aurora.tootie.tv/r/{name}.json"
  }
}
```

### Aurora palette (ANSI 256 ↔ CSS custom properties)

The Aurora design system uses the same palette in both Rust (ANSI 256 for terminal)
and CSS (custom properties for the browser). The source of truth is the token layer:

| Const | ANSI 256 | TrueColor RGB | Aurora CSS token | CSS hex |
|---|---|---|---|---|
| `SERVICE_NAME` | 211 | (255, 175, 215) | `--aurora-accent-pink` | `#f9a8c4` |
| `ACCENT_PRIMARY` | 39 | (41, 182, 246) | `--aurora-accent-primary` | `#29b6f6` |
| `TEXT_MUTED` | 250 | (167, 188, 201) | `--aurora-text-muted` | `#a7bcc9` |
| `SUCCESS` | 115 | (125, 211, 199) | `--aurora-success` | `#7dd3c7` |
| `WARN` | 180 | (198, 163, 107) | `--aurora-warn` | `#c6a36b` |
| `ERROR` | 174 | (199, 132, 144) | `--aurora-error` | `#c78490` |

### Typical web UI structure for an MCP server

```
apps/web/
  app/
    layout.tsx          ← Aurora tokens loaded here
    page.tsx            ← Dashboard: server status + quick actions
    tools/
      page.tsx          ← Tool runner: call any action from browser
    doctor/
      page.tsx          ← Doctor check results (calls /status)
  components/
    ui/                 ← Aurora components (installed via shadcn CLI)
    server-status.tsx   ← Polls /health every 30s
    tool-runner.tsx     ← Form to call /v1/<service> actions
    log-viewer.tsx      ← Tails /v1/logs (if log API available)
  lib/
    api.ts              ← Typed client for /v1/<service> REST API
  next.config.ts        ← output: "export", trailingSlash: true
```

### next.config.ts for static export

```typescript
/** @type {import('next').NextConfig} */
const config = {
  output: "export",           // Static HTML — embedded in Rust binary
  trailingSlash: true,        // index.html files for each route
  images: { unoptimized: true }, // No Next.js image optimization in static mode
  basePath: "",               // Served from root of the Rust binary
};
export default config;
```

---

## A5. Cargo.toml — Web Feature Gate

Embedding 64KB+ of web assets is always-on by default. To opt-out:

```toml
[features]
default = ["web"]
web = ["include_dir"]

[dependencies]
include_dir = { version = "0.7", optional = true }
```

```rust
// src/web.rs
#[cfg(feature = "web")]
static WEB_ASSETS: Dir<'static> = include_dir!("...");

pub fn web_assets_available() -> bool {
    #[cfg(feature = "web")] { WEB_ASSETS.get_file("index.html").is_some() }
    #[cfg(not(feature = "web"))] { false }
}
```

Build without web UI:
```bash
cargo build --no-default-features   # fast local dev, no asset embedding
cargo build                          # includes web UI (CI / release)
```

---

## A6. Worktree File Propagation — `.worktreeinclude`

Claude Code worktrees are fresh checkouts. Gitignored files like `.env` and
`config.toml` are absent by default, so the server can't start without them.
The `.worktreeinclude` file tells Claude Code which gitignored files to copy
into each new worktree automatically.

**Rule**: Every repo in this family carries a `.worktreeinclude` at the root.

```
# .worktreeinclude — files to copy into Claude Code worktrees
# Uses .gitignore syntax. Only gitignored files are ever copied.
.env
config.toml
```

This covers the two files a service needs to run:

| File | What it holds |
|---|---|
| `.env` | Secrets: API keys, tokens, URLs |
| `config.toml` | Runtime settings: ports, host, auth mode, timeouts |

**Why `config.toml` is gitignored**: per the config split pattern (§9), the
committed `config.toml` is the canonical defaults. A developer's local
`config.toml` may override port, host, auth mode, etc. — it must never land
in git. Add `config.toml` to `.gitignore` (not just `config.local.toml`).

**.gitignore additions** (required alongside `.worktreeinclude`):
```gitignore
config.toml
.beagle/
```

**Applies to**: `--worktree` flag, subagent worktrees, and parallel sessions
in the Claude Code desktop app. The copy is one-way (main → worktree) and
happens at worktree creation time only.
