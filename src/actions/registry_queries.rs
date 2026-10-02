//! Derived action-registry queries and action-to-service-kind validation.

use crate::{capability::Capability, config::ServiceKind};

use super::{ParamType, action_names, action_spec, curated_command, curated_commands};

pub fn curated_command_names() -> Vec<&'static str> {
    curated_commands().iter().map(|cmd| cmd.name).collect()
}

pub fn all_action_names() -> Vec<&'static str> {
    let mut names = action_names();
    names.extend(curated_command_names());
    names
}

pub fn curated_param_names() -> Vec<&'static str> {
    let mut params = Vec::new();
    for command in curated_commands() {
        for param in command
            .required_params
            .iter()
            .chain(command.optional_params)
        {
            if !params.contains(param) {
                params.push(*param);
            }
        }
    }
    params
}

pub fn curated_param_type(param: &str) -> Option<ParamType> {
    curated_commands()
        .iter()
        .flat_map(|command| command.typed_params)
        .find_map(|(name, kind)| (*name == param).then_some(*kind))
}

pub fn actions_for_curated_param(param: &str) -> Vec<&'static str> {
    curated_commands()
        .iter()
        .filter(|command| {
            command.required_params.contains(&param) || command.optional_params.contains(&param)
        })
        .map(|command| command.name)
        .collect()
}

pub fn required_params_for_action(action: &str) -> Vec<&'static str> {
    if let Some(command) = curated_command(action) {
        return command.required_params.to_vec();
    }
    action_spec(action)
        .map(|spec| spec.required_params.to_vec())
        .unwrap_or_default()
}

pub fn action_is_destructive(action: &str) -> bool {
    action_spec(action)
        .map(|spec| spec.destructive)
        .or_else(|| curated_command(action).map(|command| command.destructive))
        .unwrap_or(false)
}

/// These action names are transport shapes. Their actual scope and destructive
/// status come from an exact generated operation resolved at runtime.
pub fn action_has_route_dependent_safety(action: &str) -> bool {
    matches!(
        action,
        "api_get" | "api_post" | "api_put" | "api_delete" | "op"
    )
}

/// Whether an action can mutate in at least one admitted form. Startup warnings
/// deliberately use this conservative classification.
pub fn action_may_mutate(action: &str) -> bool {
    action_spec(action)
        .map(|spec| spec.mutates)
        .or_else(|| curated_command(action).map(|command| command.mutates))
        .unwrap_or(false)
}

fn is_infra_action(action: &str) -> bool {
    action_spec(action).is_some()
}

#[allow(dead_code)]
pub fn allowed_kind_names_for_action(action: &str) -> Vec<&'static str> {
    if is_infra_action(action) {
        return ServiceKind::ALL.iter().map(|kind| kind.as_str()).collect();
    }
    curated_command(action).map_or_else(Vec::new, |command| {
        ServiceKind::ALL
            .iter()
            .filter(|kind| kind.capability() == command.capability)
            .map(|kind| kind.as_str())
            .collect()
    })
}

pub fn capability_digest() -> Option<String> {
    const ORDER: &[(Capability, &str)] = &[
        (Capability::ArrManager, "arr"),
        (Capability::Indexer, "indexer"),
        (Capability::DownloadClient, "download_client"),
        (Capability::MediaServer, "media_server"),
        (Capability::Requests, "requests"),
        (Capability::Stats, "stats"),
    ];

    let segments = ORDER
        .iter()
        .filter_map(|(capability, label)| {
            let commands = curated_commands()
                .iter()
                .filter(|command| command.capability == *capability)
                .map(|command| command.name)
                .collect::<Vec<_>>();
            if commands.is_empty() {
                return None;
            }
            let kinds = ServiceKind::ALL
                .iter()
                .filter(|kind| kind.capability() == *capability)
                .map(|kind| kind.as_str())
                .collect::<Vec<_>>();
            Some(format!(
                "{label}({}): {}",
                kinds.join(","),
                commands.join(",")
            ))
        })
        .collect::<Vec<_>>();
    (!segments.is_empty()).then(|| segments.join(" | "))
}

pub fn action_allowed_for_kind(action: &str, kind: ServiceKind) -> bool {
    is_infra_action(action)
        || curated_command(action).is_some_and(|command| command.capability == kind.capability())
}

pub fn valid_actions_for_kind(kind: ServiceKind) -> Vec<&'static str> {
    let mut names = action_names();
    names.extend(
        curated_commands()
            .iter()
            .filter(|command| command.capability == kind.capability())
            .map(|command| command.name),
    );
    names
}

#[cfg(test)]
#[path = "registry_queries_tests.rs"]
mod tests;
