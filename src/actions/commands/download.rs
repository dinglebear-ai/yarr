//! DownloadClient (SABnzbd, qBittorrent) curated command descriptors (C5).
//!
//! The per-capability const slice the registry concatenates at its single
//! extension point (`build_curated_commands`). Each
//! [`CommandDescriptor`] is the SSOT for one curated command — its scope, params,
//! allowed kinds (via `capability` = [`Capability::DownloadClient`], so only
//! SABnzbd + qBittorrent), schema fragment, help line, and handler.
//!
//! ACTION-NAME UNIQUENESS: registry action names are GLOBALLY unique across
//! capabilities, and the ArrManager surface already owns a `queue` command (C1).
//! So these use `download_`-prefixed names (`download_queue`, `download_add`, …);
//! the CLI maps the friendlier kebab verbs (`queue`/`add`/`pause`/`resume`/
//! `remove`) onto them.
//!
//! Handlers are THIN adapters: extract params with the shared parse helpers and
//! call the corresponding `YarrService` method. No business logic here — the
//! per-client path/slim logic lives in `crate::app::download`.

use serde_json::Value;

use crate::actions::model::{READ_SCOPE, WRITE_SCOPE};
use crate::actions::parse::{bool_arg, optional_string, string_arg};
use crate::actions::registry::{
    CommandDescriptor, CommandFuture, LocalEffect,
    ParamType::{Boolean, String as StringParam},
};
use crate::app::YarrService;
use crate::capability::Capability;

/// The DownloadClient (SABnzbd, qBittorrent) curated commands.
pub const DOWNLOAD_COMMANDS: &[CommandDescriptor] = &[
    CommandDescriptor {
        name: "download_queue",
        capability: Capability::DownloadClient,
        description: "list the active downloads (sab queue slots / qbit torrents), slimmed.",
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler: handle_queue,
    },
    CommandDescriptor {
        name: "download_add",
        capability: Capability::DownloadClient,
        description: "queue a new download from a --url/magnet (write). Non-destructive — \
             runs immediately.",
        required_scope: WRITE_SCOPE,
        required_params: &["service", "url"],
        optional_params: &[],
        destructive: false,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[("url", StringParam)],
        handler: handle_add,
    },
    CommandDescriptor {
        name: "download_pause",
        capability: Capability::DownloadClient,
        description: "pause a download by --id/--hash, or all when omitted (write). \
             Non-destructive — runs immediately.",
        required_scope: WRITE_SCOPE,
        required_params: &["service"],
        optional_params: &["id", "hash"],
        destructive: false,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[("id", StringParam), ("hash", StringParam)],
        handler: handle_pause,
    },
    CommandDescriptor {
        name: "download_resume",
        capability: Capability::DownloadClient,
        description: "resume a download by --id/--hash, or all when omitted (write). \
             Non-destructive — runs immediately.",
        required_scope: WRITE_SCOPE,
        required_params: &["service"],
        optional_params: &["id", "hash"],
        destructive: false,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[("id", StringParam), ("hash", StringParam)],
        handler: handle_resume,
    },
    CommandDescriptor {
        name: "download_remove",
        capability: Capability::DownloadClient,
        description: "remove a download by --id/--hash; --delete-files also deletes data \
             (default off). DESTRUCTIVE — on MCP the connected client is elicited for \
             confirmation before this runs.",
        required_scope: WRITE_SCOPE,
        required_params: &["service"],
        optional_params: &["id", "hash", "delete_files"],
        destructive: true,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[
            ("id", StringParam),
            ("hash", StringParam),
            ("delete_files", Boolean),
        ],
        handler: handle_remove,
    },
];

// ── thin handler adapters (marshal params → service method) ──────────────────────

fn handle_queue<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        svc.download_queue(&service).await
    })
}

fn handle_add<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        let url = string_arg(args, "url")?;
        svc.download_add(&service, &url).await
    })
}

fn handle_pause<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        let id = download_id(args)?;
        svc.download_pause(&service, id.as_deref()).await
    })
}

fn handle_resume<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        let id = download_id(args)?;
        svc.download_resume(&service, id.as_deref()).await
    })
}

fn handle_remove<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        let id = download_id(args)?.ok_or_else(|| {
            crate::actions::model::ValidationError::MissingField { field: "id".into() }
        })?;
        svc.download_remove(&service, &id, bool_arg(args, "delete_files")?)
            .await
    })
}

/// The download identifier: SABnzbd uses `nzo_id`, qBittorrent uses `hash`. Both
/// are exposed via `--id` (canonical) and `--hash` (qbit-friendly alias); either
/// param resolves to the same value here.
fn download_id(args: &Value) -> anyhow::Result<Option<String>> {
    Ok(optional_string(args, "id")?.or(optional_string(args, "hash")?))
}

#[cfg(test)]
#[path = "download_tests.rs"]
mod tests;
