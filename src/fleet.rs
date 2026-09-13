//! Host-owned fleet planning and dispatch types.
//!
//! Fleet selectors are resolved against configured identities before any
//! authorization or upstream work begins. They are deliberately not actions in
//! the MCP registry: Code Mode reaches them through a private bridge.

use serde::Serialize;
use serde_json::{Map, Value};
use std::str::FromStr;

use crate::{ServiceKind, YarrAction};

pub mod discovery;
pub mod pairing;
pub mod snippets;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FleetSelector {
    Of { name: String },
    All { kind: Option<ServiceKind> },
}

#[derive(Debug, Clone)]
pub struct FleetInvocation {
    pub selector: FleetSelector,
    pub action: String,
    pub params: Map<String, Value>,
}

#[derive(Debug, Clone)]
pub(crate) struct PlannedFleetInvocation {
    pub(crate) leaves: Vec<PlannedFleetLeaf>,
}

impl PlannedFleetInvocation {
    #[cfg(test)]
    pub(crate) fn leaves(&self) -> &[PlannedFleetLeaf] {
        &self.leaves
    }
}

#[derive(Debug, Clone)]
pub(crate) struct PlannedFleetLeaf {
    pub(crate) service: String,
    pub(crate) kind: ServiceKind,
    pub(crate) action: YarrAction,
}

impl PlannedFleetLeaf {
    #[cfg(test)]
    pub(crate) fn action_service(&self) -> &str {
        match &self.action {
            YarrAction::ServiceStatus { service }
            | YarrAction::ApiGet { service, .. }
            | YarrAction::ApiPost { service, .. }
            | YarrAction::ApiPut { service, .. }
            | YarrAction::ApiDelete { service, .. }
            | YarrAction::Op { service, .. } => service,
            YarrAction::Curated { params, .. } => params
                .get("service")
                .and_then(Value::as_str)
                .expect("fleet planner injects every leaf identity"),
            YarrAction::Help
            | YarrAction::CodeMode { .. }
            | YarrAction::SnippetList
            | YarrAction::SnippetSave { .. }
            | YarrAction::SnippetRun { .. }
            | YarrAction::SnippetDelete { .. } => unreachable!("fleet leaf must target a service"),
        }
    }
}

fn reject_unknown_fields(
    object: &Map<String, Value>,
    allowed: &[&str],
    context: &str,
) -> Result<(), String> {
    if let Some(field) = object
        .keys()
        .find(|field| !allowed.contains(&field.as_str()))
    {
        return Err(format!("{context} contains unknown field `{field}`"));
    }
    Ok(())
}

pub(crate) fn parse_private_invocation(params_json: &str) -> Result<FleetInvocation, String> {
    let params: Value = serde_json::from_str(params_json)
        .map_err(|error| format!("invalid fleet params: {error}"))?;
    let object = params
        .as_object()
        .ok_or_else(|| "fleet params must be a JSON object".to_owned())?;
    reject_unknown_fields(object, &["selector", "action", "params"], "fleet params")?;
    let action = object
        .get("action")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| "fleet action must be a non-empty string".to_owned())?
        .to_owned();
    let supplied = object
        .get("params")
        .cloned()
        .unwrap_or_else(|| Value::Object(Map::new()));
    let params = supplied
        .as_object()
        .cloned()
        .ok_or_else(|| "fleet params.params must be a JSON object".to_owned())?;
    let selector = object
        .get("selector")
        .and_then(Value::as_object)
        .ok_or_else(|| "fleet selector must be an object".to_owned())?;
    let selector = match selector.get("type").and_then(Value::as_str) {
        Some("of") => {
            reject_unknown_fields(selector, &["type", "name"], "fleet.of selector")?;
            FleetSelector::Of {
                name: selector
                    .get("name")
                    .and_then(Value::as_str)
                    .filter(|name| !name.is_empty())
                    .ok_or_else(|| "fleet.of requires a name".to_owned())?
                    .to_owned(),
            }
        }
        Some("all") => {
            reject_unknown_fields(selector, &["type", "kind"], "fleet.all selector")?;
            FleetSelector::All {
                kind: match selector.get("kind") {
                    None | Some(Value::Null) => None,
                    Some(Value::String(kind)) => {
                        Some(ServiceKind::from_str(kind).map_err(|error| error.to_string())?)
                    }
                    Some(_) => return Err("fleet.all kind must be a string or null".to_owned()),
                },
            }
        }
        _ => return Err("fleet selector type must be `of` or `all`".to_owned()),
    };
    Ok(FleetInvocation {
        selector,
        action,
        params,
    })
}

#[derive(Debug, Clone, Serialize)]
pub struct FleetResultSummary {
    #[serde(rename = "type")]
    pub value_type: &'static str,
    pub item_count: usize,
    pub observed_bytes: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct FleetResult {
    pub service: String,
    pub kind: ServiceKind,
    pub ok: bool,
    pub elapsed_ms: u128,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latency_ms: Option<u128>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reachable: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<Value>,
    pub truncated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<FleetResultSummary>,
    pub value: Value,
    pub error: Option<String>,
}

#[cfg(test)]
#[path = "fleet_tests.rs"]
mod tests;

#[cfg(test)]
#[path = "fleet/snippets_tests.rs"]
mod snippets_tests;
