//! Stats (Tautulli) curated command descriptors (C8).
//!
//! The per-capability const slice the registry concatenates at its single
//! extension point (`build_curated_commands`). Each
//! [`CommandDescriptor`] is the SSOT for one curated command — its scope, params,
//! allowed kinds (via `capability` = [`Capability::Stats`], so only Tautulli),
//! schema fragment, help line, and handler.
//!
//! The registry is keyed by action name, so these use `stats_`-prefixed names: the
//! friendly verb `history` already collides with the ArrManager `history` command,
//! and `activity`/`users`/`libraries` are kept consistently prefixed for global
//! uniqueness. The CLI maps the friendlier kebab verbs
//! (`activity`/`history`/`users`/`libraries`) onto them.
//!
//! Read commands are `yarr:read`; maintenance commands mutate Tautulli state
//! and are `yarr:write`. Only `stats_delete_image_cache` is *destructive* — on
//! MCP it gets an elicitation prompt before dispatch; it runs immediately like
//! the refresh commands on the CLI and in Code Mode. Handlers
//! are THIN adapters — extract params and call the corresponding
//! `YarrService` method. No business logic here; the cmd/envelope/slim logic
//! lives in `crate::app::stats`.

use serde_json::Value;

use crate::actions::model::{READ_SCOPE, WRITE_SCOPE};
use crate::actions::parse::{optional_i64, optional_string, string_arg};
use crate::actions::registry::{
    CommandDescriptor, CommandFuture, LocalEffect,
    ParamType::{Integer, String as StringParam},
};
use crate::app::YarrService;
use crate::capability::Capability;

/// The Stats (Tautulli) curated commands.
pub const STATS_COMMANDS: &[CommandDescriptor] = &[
    CommandDescriptor {
        name: "stats_activity",
        capability: Capability::Stats,
        description: "current Tautulli activity: stream count + per-stream user, title, \
             state, and progress (slimmed).",
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler: handle_activity,
    },
    CommandDescriptor {
        name: "stats_history",
        capability: Capability::Stats,
        description: "Tautulli watch history (slimmed). Optional --start (offset), \
             --length (page size), --user (filter by username).",
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params: &["start", "length", "user"],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params: &[
            ("start", Integer),
            ("length", Integer),
            ("user", StringParam),
        ],
        handler: handle_history,
    },
    CommandDescriptor {
        name: "stats_users",
        capability: Capability::Stats,
        description: "Tautulli users, slimmed to user_id, username, plays.",
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler: handle_users,
    },
    CommandDescriptor {
        name: "stats_libraries",
        capability: Capability::Stats,
        description: "Tautulli libraries, slimmed to section id/name/type and counts.",
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler: handle_libraries,
    },
    CommandDescriptor {
        name: "stats_refresh_libraries",
        capability: Capability::Stats,
        description: "refresh Tautulli's Plex library inventory (write). Non-destructive — \
             runs immediately.",
        required_scope: WRITE_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: false,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler: handle_refresh_libraries,
    },
    CommandDescriptor {
        name: "stats_refresh_users",
        capability: Capability::Stats,
        description: "refresh Tautulli's Plex user inventory (write). Non-destructive — \
             runs immediately.",
        required_scope: WRITE_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: false,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler: handle_refresh_users,
    },
    CommandDescriptor {
        name: "stats_delete_image_cache",
        capability: Capability::Stats,
        description: "clear Tautulli's regenerable image cache. DESTRUCTIVE — on MCP \
             the connected client is elicited for confirmation before this runs.",
        required_scope: WRITE_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: true,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler: handle_delete_image_cache,
    },
];

// ── thin handler adapters (marshal params → service method) ──────────────────────

fn handle_activity<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        svc.stats_activity(&service).await
    })
}

fn handle_history<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        let start = optional_i64(args, "start")?;
        let length = optional_i64(args, "length")?;
        let user = optional_string(args, "user")?;
        svc.stats_history(&service, start, length, user.as_deref())
            .await
    })
}

fn handle_users<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        svc.stats_users(&service).await
    })
}

fn handle_libraries<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        svc.stats_libraries(&service).await
    })
}

fn handle_refresh_libraries<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        svc.stats_refresh_libraries(&service).await
    })
}

fn handle_refresh_users<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        svc.stats_refresh_users(&service).await
    })
}

fn handle_delete_image_cache<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        let service = string_arg(args, "service")?;
        svc.stats_delete_image_cache(&service).await
    })
}

#[cfg(test)]
#[path = "stats_tests.rs"]
mod tests;
