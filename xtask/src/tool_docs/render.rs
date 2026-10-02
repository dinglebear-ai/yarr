use super::*;
pub(super) fn endpoint_for_tools(row: EndpointRow) -> String {
    if row.tools.is_empty() {
        row.endpoint.to_string()
    } else {
        format!("{}: {}", row.tools, row.endpoint)
    }
}

pub(super) fn params(command: &CommandDescriptor) -> String {
    let mut parts: Vec<String> = Vec::new();
    for param in command
        .required_params
        .iter()
        .copied()
        .filter(|param| *param != "service")
    {
        parts.push(format!("`{param}`"));
    }
    for param in command.optional_params {
        parts.push(format!("optional `{param}`"));
    }
    if parts.is_empty() {
        "none".into()
    } else {
        parts.join(", ")
    }
}

pub(super) fn generic_params(spec: &yarr::ActionSpec) -> String {
    let mut params = spec
        .required_params
        .iter()
        .copied()
        .filter(|param| *param != "service")
        .map(|param| format!("`{param}`"))
        .collect::<Vec<_>>();
    params.extend(
        spec.optional_params
            .iter()
            .map(|param| format!("optional `{param}`")),
    );
    if params.is_empty() {
        "none".to_owned()
    } else {
        params.join(", ")
    }
}

pub(super) fn generic_endpoint(action: &str) -> &'static str {
    match action {
        "service_status" => {
            "GET the kind default status path, e.g. Sonarr/Radarr `/api/v3/system/status`, Prowlarr `/api/v1/system/status`, Overseerr `/api/v1/status`, Tautulli `/api/v2?cmd=get_server_info`, Bazarr `/api/system/status`, Tracearr `/health`, SABnzbd `/api?mode=version&output=json`, qBittorrent `/api/v2/app/version`, Plex `/identity`, Jellyfin `/System/Info/Public`."
        }
        "api_get" => {
            "`GET {path}`. Admitted only when the path uniquely matches one reviewed generated operation; scope is route-derived and resolved `Destructive` operations elicit on MCP."
        }
        "api_post" => {
            "`POST {path}` with JSON body. Same route admission and route-derived safety as `api_get`."
        }
        "api_put" => {
            "`PUT {path}` with JSON body. Same route admission and route-derived safety as `api_get`."
        }
        "api_delete" => {
            "`DELETE {path}` with optional JSON body. Route-derived: a reviewed `Mutation` route runs, a resolved Destructive route elicits on MCP, unmatched routes fail closed."
        }
        "help" => "No upstream call; returns registry-derived action help.",
        "codemode" => {
            "No direct upstream call; runs a Code Mode script that dispatches other actions."
        }
        "op" => {
            "Dispatches a generated OpenAPI operation for a spec-backed service; safety and scope are route-derived from the reviewed operation metadata."
        }
        "snippet_list" | "snippet_save" | "snippet_run" | "snippet_delete" => {
            "No upstream call; manages the Code Mode snippet store under the data dir."
        }
        _ => "",
    }
}

pub(super) fn scope(scope: Option<&'static str>) -> &'static str {
    scope.unwrap_or("public")
}

/// Actions whose effective scope (and destructive admission) is decided per
/// call by the resolved reviewed operation, not by static registry metadata.
/// Delegates to the library contract; a parity test pins the generator to
/// `yarr::action_has_route_dependent_safety` for every action name, so the
/// two can never drift.
pub(super) fn route_dependent(action: &str) -> bool {
    yarr::action_has_route_dependent_safety(action)
}

/// The Scope column text for a generic action row.
pub(super) fn scope_column(spec: &yarr::ActionSpec) -> &'static str {
    if route_dependent(spec.name) {
        "route-derived"
    } else {
        scope(spec.required_scope)
    }
}

pub(super) fn yes_no(value: bool) -> &'static str {
    if value { "yes" } else { "no" }
}

#[cfg(test)]
#[path = "render_tests.rs"]
mod tests;
