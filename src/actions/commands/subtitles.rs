//! Bazarr subtitles curated command descriptors.

use serde_json::Value;

use crate::actions::model::READ_SCOPE;
use crate::actions::parse::{optional_i64, string_arg};
use crate::actions::registry::{CommandDescriptor, CommandFuture, LocalEffect, ParamType::Integer};
use crate::app::YarrService;
use crate::capability::Capability;

pub const SUBTITLES_COMMANDS: &[CommandDescriptor] = &[
    read(
        "subtitles_status",
        "Bazarr system/version status.",
        handle_status,
    ),
    paged(
        "subtitles_movies",
        "Bazarr movie subtitle status rows.",
        handle_movies,
    ),
    paged(
        "subtitles_episodes",
        "Bazarr episode subtitle status rows.",
        handle_episodes,
    ),
    paged(
        "subtitles_wanted_episodes",
        "Bazarr wanted episode subtitles.",
        handle_wanted_episodes,
    ),
    paged(
        "subtitles_wanted_movies",
        "Bazarr wanted movie subtitles.",
        handle_wanted_movies,
    ),
    read(
        "subtitles_providers",
        "Bazarr provider throttling/status rows.",
        handle_providers,
    ),
    read(
        "subtitles_languages",
        "Bazarr configured subtitle languages.",
        handle_languages,
    ),
];

const fn read(
    name: &'static str,
    description: &'static str,
    handler: crate::actions::registry::CommandHandler,
) -> CommandDescriptor {
    CommandDescriptor {
        name,
        capability: Capability::Subtitles,
        description,
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params: &[],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params: &[],
        handler,
    }
}

const fn paged(
    name: &'static str,
    description: &'static str,
    handler: crate::actions::registry::CommandHandler,
) -> CommandDescriptor {
    CommandDescriptor {
        name,
        capability: Capability::Subtitles,
        description,
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params: &["start", "length"],
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params: &[("start", Integer), ("length", Integer)],
        handler,
    }
}

fn handle_status<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move { svc.subtitles_status(&string_arg(args, "service")?).await })
}

fn handle_movies<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.subtitles_movies(
            &string_arg(args, "service")?,
            optional_i64(args, "start")?,
            optional_i64(args, "length")?,
        )
        .await
    })
}

fn handle_episodes<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.subtitles_episodes(
            &string_arg(args, "service")?,
            optional_i64(args, "start")?,
            optional_i64(args, "length")?,
        )
        .await
    })
}

fn handle_wanted_episodes<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.subtitles_wanted_episodes(
            &string_arg(args, "service")?,
            optional_i64(args, "start")?,
            optional_i64(args, "length")?,
        )
        .await
    })
}

fn handle_wanted_movies<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.subtitles_wanted_movies(
            &string_arg(args, "service")?,
            optional_i64(args, "start")?,
            optional_i64(args, "length")?,
        )
        .await
    })
}

fn handle_providers<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move { svc.subtitles_providers(&string_arg(args, "service")?).await })
}

fn handle_languages<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move { svc.subtitles_languages(&string_arg(args, "service")?).await })
}

#[cfg(test)]
#[path = "subtitles_tests.rs"]
mod tests;
