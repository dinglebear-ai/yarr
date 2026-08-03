//! CLI facade — thin shim that parses args, calls `YarrService`, formats output.
//!
//! The CLI uses the same service layer as the MCP server. **No business logic
//! lives here** (the thin-shim rule): every arm parses input, makes exactly one
//! `YarrService` call, and prints. Logic belongs in `app.rs`.
//!
//! # Grammar
//!
//! ```text
//! yarr <service> status                       Upstream status for one service
//! yarr <service> get --path PATH              Passthrough GET
//! yarr <service> post --path PATH [--body JSON]
//! yarr <service> put  --path PATH [--body JSON]
//! yarr <service> delete --path PATH [--body JSON]
//!
//! yarr help                     JSON action reference
//! yarr doctor [--json]          Pre-flight checks
//! yarr watch [--url URL] [--interval N] [--once]
//! yarr setup check|repair|install|plugin-hook
//! yarr [serve] | yarr mcp    Run modes (intercepted in main.rs)
//! ```
//!
//! # Module map
//!
//!   - [`command`] — the parsed [`Command`] enum (pure data).
//!   - [`router`]  — `token1` → infra verb OR service→kind→capability dispatch.
//!   - [`parse`]   — shared flag parsers (path/body + selectors).
//!   - [`usage`](mod@self::usage)   — USAGE generated from the action registry + capability map.
//!   - [`doctor`] / [`setup`] / [`watch`] — infra-command implementations.
//!
//! Capability beads add curated commands as parse-only modules under
//! `src/cli/commands/<capability>.rs` and extend
//! [`router::parse_capability_command`].

use crate::{actions::rest_help, app::YarrService, config::YarrConfig, yarr::YarrClient};
use anyhow::Result;

pub mod command;
pub mod commands;
pub mod doctor;
pub mod parse;
pub mod router;
pub mod setup;
pub mod usage;
pub mod watch;

pub use command::Command;
pub use commands::capability_verb_tables;
pub use doctor::run_doctor;
pub use setup::{SetupCommand, apply_plugin_options, run_setup};
pub use usage::usage;
pub use watch::run_watch;

/// Parse CLI arguments from `std::env::args()`.
///
/// Returns `Ok(None)` when no subcommand was given so `main.rs` can print the
/// "Unknown command" hint.
pub fn parse_args() -> Result<Option<Command>> {
    parse_args_from(std::env::args().skip(1))
}

/// Parse process arguments using configured service identities. This is the
/// production CLI entry point; [`parse_args_from`] remains the config-free
/// parser used by registry/parity tests.
pub fn parse_args_configured(cfg: &YarrConfig) -> Result<Option<Command>> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    router::route_configured(&args, cfg)
}

/// Parse CLI arguments from an arbitrary iterator (used by tests).
pub fn parse_args_from<I, S>(args: I) -> Result<Option<Command>>
where
    I: IntoIterator<Item = S>,
    S: Into<String>,
{
    let args: Vec<String> = args.into_iter().map(Into::into).collect();
    router::route(&args)
}

/// Run a CLI command, print the result, and exit.
///
/// `Doctor`, `Watch`, and `Setup` are handled directly in `main.rs::run_cli`
/// (they need the full `Config`); they are unreachable here.
pub async fn run(cmd: Command, cfg: &YarrConfig) -> Result<()> {
    let client = YarrClient::new(cfg)?;
    let mut service = YarrService::new(client, cfg.clone());
    // Enable Code Mode `writeArtifact` under the data dir (best-effort), matching
    // the server so `yarr codemode` behaves the same on both surfaces.
    if let Ok(dir) = crate::config::resolve_data_dir() {
        service = service.with_data_dir(dir);
    }

    let result = match &cmd {
        Command::Status { service: name } => service.service_status(name).await?,
        Command::Get {
            service: name,
            path,
        } => service.api_get(name, path).await?,
        Command::Post {
            service: name,
            path,
            body,
        } => service.api_post(name, path, body.clone()).await?,
        Command::Put {
            service: name,
            path,
            body,
        } => service.api_put(name, path, body.clone()).await?,
        Command::Delete {
            service: name,
            path,
            body,
        } => service.api_delete(name, path, body.clone()).await?,
        // Generated operation dispatch — runs immediately, including DELETE ops.
        Command::Op {
            service: name,
            op,
            args,
        } => service.execute_operation(name, op, args).await?,
        Command::Help => rest_help(),
        // Code Mode runs through the SAME shared dispatch path as the MCP
        // `codemode` action, so CLI↔MCP behaviour is identical.
        Command::CodeMode { code } => {
            let parsed = crate::actions::YarrAction::CodeMode { code: code.clone() };
            crate::actions::execute_service_action(&service, &parsed).await?
        }
        // Snippet store verbs run through the SAME shared dispatch as the MCP
        // `snippet_*` actions (thin shim — no logic here).
        Command::SnippetList => {
            crate::actions::execute_service_action(
                &service,
                &crate::actions::YarrAction::SnippetList,
            )
            .await?
        }
        Command::SnippetSave {
            name,
            code,
            description,
        } => {
            let parsed = crate::actions::YarrAction::SnippetSave {
                name: name.clone(),
                code: code.clone(),
                description: description.clone(),
            };
            crate::actions::execute_service_action(&service, &parsed).await?
        }
        Command::SnippetRun { name, input } => {
            let parsed = crate::actions::YarrAction::SnippetRun {
                name: name.clone(),
                input: input.clone(),
            };
            crate::actions::execute_service_action(&service, &parsed).await?
        }
        Command::SnippetDelete { name } => {
            let parsed = crate::actions::YarrAction::SnippetDelete { name: name.clone() };
            crate::actions::execute_service_action(&service, &parsed).await?
        }
        // Curated commands run through the SAME shared dispatch path as MCP
        // (`execute_service_action`), which applies the action×kind guard and
        // routes to the descriptor handler — so CLI↔MCP parity is automatic.
        Command::Curated { action, params } => {
            let parsed = crate::actions::YarrAction::Curated {
                name: action,
                params: params.clone(),
            };
            crate::actions::execute_service_action(&service, &parsed).await?
        }
        Command::Doctor { .. }
        | Command::Watch { .. }
        | Command::Setup(_)
        | Command::DiscoverPlex { .. } => {
            unreachable!("dispatched directly in main.rs::run_cli")
        }
    };

    println!("{}", serde_json::to_string_pretty(&result)?);
    Ok(())
}

#[cfg(test)]
#[path = "cli_tests.rs"]
mod tests;
