//! CLI router: disambiguates `token1` and produces a [`Command`].
//!
//! # Grammar (architecture F3-a)
//!
//! ```text
//! yarr <token1> [rest...]
//! ```
//!
//! `token1` is resolved by **disjoint sets**:
//!
//!   1. If `token1` in [`INFRA_VERBS`] → parse an **infra, service-less** command
//!      (`help`, `codemode`, `snippet`, `doctor`, `watch`, `setup`). `serve`/`mcp` are
//!      also infra verbs but are intercepted as run *modes* in `main.rs` before
//!      `parse_args` runs — they never reach this router, yet are listed in
//!      [`INFRA_VERBS`] so they cannot be shadowed by a service name.
//!   2. Else resolve `token1` as a [`ServiceKind`] via `FromStr` and parse the
//!      remaining `<command> [flags]` through [`parse_capability_command`].
//!   3. Unknown `token1` → an error listing valid services + infra verbs.
//!
//! The infra-verb set and the `ServiceKind` name set are **disjoint** by
//! construction; `router_tests::infra_verbs_disjoint_from_service_kinds`
//! asserts this so a future kind can never collide with an infra verb.

use anyhow::{Result, anyhow};

use super::command::Command;
use super::parse::{parse_passthrough_flags, reject_args};
use crate::capability::Capability;
use crate::config::{ServiceKind, YarrConfig};

#[path = "router_infra.rs"]
mod infra;
use infra::parse_infra_command;

/// Infra verbs — service-less top-level commands. Disjoint from `ServiceKind`
/// names (asserted in tests). `serve`/`mcp` are handled as run modes in
/// `main.rs` but kept here to reserve the names.
pub const INFRA_VERBS: &[&str] = &[
    "help", "codemode", "snippet", "doctor", "watch", "setup", "discover", "fleet", "serve", "mcp",
];

/// True if `token` is an infra verb.
pub fn is_infra_verb(token: &str) -> bool {
    INFRA_VERBS.contains(&token)
}

/// Resolve a full argv (already stripped of the binary name) into a [`Command`].
///
/// Returns `Ok(None)` only for the empty argv (no subcommand) so `main.rs` can
/// fall through to its "Unknown command" path, matching prior behaviour.
pub fn route(args: &[String]) -> Result<Option<Command>> {
    let [token1, rest @ ..] = args else {
        return Ok(None);
    };

    if is_infra_verb(token1) {
        return parse_infra_command(token1, rest).map(Some);
    }

    match token1.parse::<ServiceKind>() {
        Ok(kind) => {
            let [verb, verb_rest @ ..] = rest else {
                return Err(anyhow!(
                    "service `{token1}` requires a command (e.g. status, get, post)"
                ));
            };
            parse_capability_command(kind, kind.capability(), verb, verb_rest).map(Some)
        }
        Err(_) => Err(unknown_token1_error(token1)),
    }
}

/// Resolve CLI service tokens against the loaded configured identities.
/// Exact configured-name matches win; a canonical kind/alias is accepted only
/// when exactly one configured instance has that kind.
pub fn route_configured(args: &[String], config: &YarrConfig) -> Result<Option<Command>> {
    let [token1, rest @ ..] = args else {
        return Ok(None);
    };
    if is_infra_verb(token1)
        && config
            .services
            .iter()
            .any(|service| service.name.eq_ignore_ascii_case(token1))
    {
        return Err(anyhow!(
            "configured service name `{token1}` is reserved for a yarr CLI command; rename the service identity"
        ));
    }
    if is_infra_verb(token1) {
        return parse_infra_command(token1, rest).map(Some);
    }

    let exact = config
        .services
        .iter()
        .filter(|service| service.name.eq_ignore_ascii_case(token1))
        .collect::<Vec<_>>();
    let (service_name, kind) = match exact.as_slice() {
        [service] => (service.name.as_str(), service.kind),
        [] => {
            let kind = token1
                .parse::<ServiceKind>()
                .map_err(|_| unknown_token1_error(token1))?;
            let matches = config
                .services
                .iter()
                .filter(|service| service.kind == kind)
                .collect::<Vec<_>>();
            match matches.as_slice() {
                [service] => (service.name.as_str(), kind),
                [] => {
                    return Err(anyhow!(
                        "service kind `{}` is not configured; configured services: {}",
                        kind.as_str(),
                        configured_service_names(config)
                    ));
                }
                _ => {
                    return Err(anyhow!(
                        "service kind `{}` is ambiguous; use one of the configured service names: {}",
                        kind.as_str(),
                        matches
                            .iter()
                            .map(|service| service.name.as_str())
                            .collect::<Vec<_>>()
                            .join(", ")
                    ));
                }
            }
        }
        _ => return Err(anyhow!("configured service name `{token1}` is duplicated")),
    };

    let [verb, verb_rest @ ..] = rest else {
        return Err(anyhow!(
            "service `{service_name}` requires a command (e.g. status, get, post)"
        ));
    };
    let command = parse_capability_command(kind, kind.capability(), verb, verb_rest)?;
    Ok(Some(rebind_service(command, service_name)))
}

fn configured_service_names(config: &YarrConfig) -> String {
    config
        .services
        .iter()
        .map(|service| service.name.as_str())
        .collect::<Vec<_>>()
        .join(", ")
}

fn rebind_service(mut command: Command, service_name: &str) -> Command {
    match &mut command {
        Command::Status { service }
        | Command::Get { service, .. }
        | Command::Post { service, .. }
        | Command::Put { service, .. }
        | Command::Delete { service, .. }
        | Command::Op { service, .. } => *service = service_name.to_owned(),
        Command::Curated { params, .. } => {
            if let Some(object) = params.as_object_mut() {
                object.insert(
                    "service".to_owned(),
                    serde_json::Value::String(service_name.to_owned()),
                );
            }
        }
        _ => {}
    }
    command
}

// ── capability branch ─────────────────────────────────────────────────────────

/// Per-capability command-parse HOOK. Two-stage:
///
///   1. **Curated dispatch first** — `capability` selects the matching
///      `src/cli/commands/<cap>.rs` parser, which returns `Some(Command)` for a
///      verb it owns or `None` to fall through.
///   2. **Generic passthrough fallback** — if no curated parser claimed the verb,
///      the generic surface common to every capability handles it: `status`,
///      `get`, `post`, `put`, `delete`. Any other verb yields a clear "unknown
///      command for `<service>` error.
pub fn parse_capability_command(
    kind: ServiceKind,
    capability: Capability,
    verb: &str,
    rest: &[String],
) -> Result<Command> {
    // Curated, capability-scoped verbs first. Each capability bead adds a parse
    // module under `cli/commands/<cap>.rs` and a dispatch arm here; a module
    // returns `Ok(None)` for a verb it doesn't own so we fall through to the
    // generic passthrough verbs below.
    if let Some(command) = match capability {
        // Spec-backed capabilities have no curated CLI verbs (generated ops are
        // MCP/Code-Mode only); they fall through to the generic passthrough verbs.
        Capability::DownloadClient => super::commands::download::parse(kind, verb, rest)?,
        Capability::Stats => super::commands::stats::parse(kind, verb, rest)?,
        Capability::Subtitles => super::commands::subtitles::parse(kind, verb, rest)?,
        Capability::Trace => super::commands::trace::parse(kind, verb, rest)?,
        _ => None,
    } {
        return Ok(command);
    }

    let service = kind.as_str().to_string();
    match verb {
        "status" => {
            reject_args(rest, "status")?;
            Ok(Command::Status { service })
        }
        "get" => {
            let flags = parse_passthrough_flags(rest, "get", false)?;
            if flags.body.is_some() {
                return Err(anyhow!("get does not accept --body"));
            }
            Ok(Command::Get {
                service,
                path: flags.path,
            })
        }
        "post" => {
            let flags = parse_passthrough_flags(rest, "post", true)?;
            Ok(Command::Post {
                service,
                path: flags.path,
                body: flags.body.unwrap_or(serde_json::Value::Null),
            })
        }
        "put" => {
            let flags = parse_passthrough_flags(rest, "put", true)?;
            Ok(Command::Put {
                service,
                path: flags.path,
                body: flags.body.unwrap_or(serde_json::Value::Null),
            })
        }
        "delete" => {
            let flags = parse_passthrough_flags(rest, "delete", false)?;
            Ok(Command::Delete {
                service,
                path: flags.path,
                body: flags.body,
            })
        }
        // `op <name> [--args JSON]` — invoke a generated operation for a
        // spec-backed kind directly (the test-harness / operator path). Runs
        // immediately, including DELETE ops.
        "op" => parse_op_command(service, rest),
        // Unknown verb: not a generic passthrough verb and not claimed by the
        // capability's curated parser above.
        other => Err(anyhow!(
            "unknown command `{other}` for service `{}`",
            kind.as_str()
        )),
    }
}

/// Parse `op <name> [--args JSON]`. The first positional is the operation
/// name; `--args` carries a JSON object of path/query params + `body`.
fn parse_op_command(service: String, rest: &[String]) -> Result<Command> {
    let [op, flags @ ..] = rest else {
        return Err(anyhow!(
            "op requires an operation name (e.g. `yarr {service} op get_series`)"
        ));
    };
    let mut args = serde_json::Value::Object(serde_json::Map::new());
    let mut iter = flags.iter();
    while let Some(flag) = iter.next() {
        match flag.as_str() {
            "--args" => {
                let raw = iter
                    .next()
                    .ok_or_else(|| anyhow!("op --args requires a JSON object argument"))?;
                args = serde_json::from_str(raw)
                    .map_err(|e| anyhow!("op --args must be valid JSON: {e}"))?;
                if !args.is_object() {
                    return Err(anyhow!("op --args must be a JSON object"));
                }
            }
            other => return Err(anyhow!("unknown op flag `{other}` (use --args)")),
        }
    }
    Ok(Command::Op {
        service,
        op: op.clone(),
        args,
    })
}

// ── errors ──────────────────────────────────────────────────────────────────────

fn unknown_token1_error(token1: &str) -> anyhow::Error {
    let services = ServiceKind::ALL
        .iter()
        .map(|k| k.as_str())
        .collect::<Vec<_>>()
        .join(", ");
    let infra = INFRA_VERBS.join(", ");
    anyhow!("unknown command `{token1}`.\n  services: {services}\n  infra commands: {infra}")
}

#[cfg(test)]
#[path = "router_tests.rs"]
mod tests;
