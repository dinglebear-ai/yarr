//! Tracearr curated command descriptors.

use serde_json::Value;

use crate::actions::model::{READ_SCOPE, WRITE_SCOPE};
use crate::actions::parse::{bool_arg, optional_i64, optional_string, string_arg};
use crate::actions::registry::{
    CommandDescriptor, CommandFuture, LocalEffect,
    ParamType::{Boolean, Integer, String as StringParam},
};
use crate::app::YarrService;
use crate::capability::Capability;

pub const TRACE_COMMANDS: &[CommandDescriptor] = &[
    read(
        "trace_health",
        "Tracearr public health/status.",
        &[],
        &[],
        handle_health,
    ),
    read(
        "trace_stats",
        "Tracearr aggregate public stats.",
        &[],
        &[],
        handle_stats,
    ),
    read(
        "trace_today",
        "Tracearr today's public stats; optional timezone.",
        &["timezone"],
        &[("timezone", StringParam)],
        handle_today,
    ),
    read(
        "trace_activity",
        "Tracearr activity buckets; optional period week/month/year.",
        &["period"],
        &[("period", StringParam)],
        handle_activity,
    ),
    read(
        "trace_streams",
        "Tracearr active streams; optional summary=true.",
        &["summary"],
        &[("summary", Boolean)],
        handle_streams,
    ),
    read(
        "trace_users",
        "Tracearr users; optional page/pageSize.",
        &["page", "page_size"],
        &[("page", Integer), ("page_size", Integer)],
        handle_users,
    ),
    read(
        "trace_violations",
        "Tracearr violations; optional page/pageSize.",
        &["page", "page_size"],
        &[("page", Integer), ("page_size", Integer)],
        handle_violations,
    ),
    read(
        "trace_history",
        "Tracearr session history; optional page/pageSize.",
        &["page", "page_size"],
        &[("page", Integer), ("page_size", Integer)],
        handle_history,
    ),
    CommandDescriptor {
        name: "trace_terminate_stream",
        capability: Capability::Trace,
        description: "terminate an active Tracearr stream by --id. DESTRUCTIVE — on MCP \
             the connected client is elicited for confirmation before this runs.",
        required_scope: WRITE_SCOPE,
        required_params: &["service", "id"],
        optional_params: &["reason"],
        destructive: true,
        mutates: true,
        local_effect: LocalEffect::None,
        typed_params: &[("id", StringParam), ("reason", StringParam)],
        handler: handle_terminate,
    },
];

const fn read(
    name: &'static str,
    description: &'static str,
    optional_params: &'static [&'static str],
    typed_params: &'static [(&'static str, crate::actions::registry::ParamType)],
    handler: crate::actions::registry::CommandHandler,
) -> CommandDescriptor {
    CommandDescriptor {
        name,
        capability: Capability::Trace,
        description,
        required_scope: READ_SCOPE,
        required_params: &["service"],
        optional_params,
        destructive: false,
        mutates: false,
        local_effect: LocalEffect::None,
        typed_params,
        handler,
    }
}

fn handle_health<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move { svc.trace_health(&string_arg(args, "service")?).await })
}

fn handle_stats<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move { svc.trace_stats(&string_arg(args, "service")?).await })
}

fn handle_today<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.trace_today(
            &string_arg(args, "service")?,
            optional_string(args, "timezone")?.as_deref(),
        )
        .await
    })
}

fn handle_activity<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.trace_activity(
            &string_arg(args, "service")?,
            optional_string(args, "period")?.as_deref(),
        )
        .await
    })
}

fn handle_streams<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.trace_streams(&string_arg(args, "service")?, bool_arg(args, "summary")?)
            .await
    })
}

fn handle_users<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.trace_users(
            &string_arg(args, "service")?,
            optional_i64(args, "page")?,
            optional_i64(args, "page_size")?,
        )
        .await
    })
}

fn handle_violations<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.trace_violations(
            &string_arg(args, "service")?,
            optional_i64(args, "page")?,
            optional_i64(args, "page_size")?,
        )
        .await
    })
}

fn handle_history<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.trace_history(
            &string_arg(args, "service")?,
            optional_i64(args, "page")?,
            optional_i64(args, "page_size")?,
        )
        .await
    })
}

fn handle_terminate<'a>(svc: &'a YarrService, args: &'a Value) -> CommandFuture<'a> {
    Box::pin(async move {
        svc.trace_terminate_stream(
            &string_arg(args, "service")?,
            &string_arg(args, "id")?,
            optional_string(args, "reason")?.as_deref(),
        )
        .await
    })
}

#[cfg(test)]
#[path = "trace_tests.rs"]
mod tests;
