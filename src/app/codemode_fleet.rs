//! Host-backed fleet fanout with bounded concurrency and isolated failures.

use std::time::Instant;

use anyhow::Result;
use futures_util::{StreamExt, stream};
use serde_json::{Value, json};

use super::FleetMapRequest;
use crate::actions::{YarrAction, execute_service_action};
use crate::app::YarrService;
use crate::config::ServiceKind;

#[derive(Debug)]
pub(crate) struct FleetAuthorization {
    pub targets: Vec<String>,
    pub action: String,
    pub scope_action: &'static str,
    pub destructive: bool,
}

impl YarrService {
    pub(crate) fn fleet_targets(&self, request: &FleetMapRequest) -> Result<Vec<String>> {
        let mut targets: Vec<String> = if request.kind == "*" {
            if request.method != "service_status" {
                anyhow::bail!("fleet kind `*` is supported only by fleet.status()");
            }
            self.services
                .iter()
                .map(|service| service.name.clone())
                .collect()
        } else {
            let kind = request
                .kind
                .parse::<ServiceKind>()
                .map_err(|_| anyhow::anyhow!("unknown fleet service kind `{}`", request.kind))?;
            self.services
                .iter()
                .filter(|service| service.kind == kind)
                .map(|service| service.name.clone())
                .collect()
        };
        targets.sort();
        Ok(targets)
    }

    pub(crate) fn fleet_authorization(
        &self,
        request: &FleetMapRequest,
    ) -> Result<FleetAuthorization> {
        let targets = self.fleet_targets(request)?;
        let Some(first) = targets.first() else {
            return Ok(FleetAuthorization {
                targets,
                action: "service_status".into(),
                scope_action: "service_status",
                destructive: false,
            });
        };
        let action = self.fleet_action(first, request)?;
        let destructive = match &action {
            YarrAction::Op { service, op, .. } => {
                self.kind_of(service)?
                    .and_then(|kind| crate::openapi::classify_operation(kind, op))
                    == Some(crate::openapi::OperationSafety::Destructive)
            }
            _ => crate::actions::action_is_destructive(action.name()),
        };
        Ok(FleetAuthorization {
            targets,
            action: request.method.clone(),
            scope_action: action.name(),
            destructive,
        })
    }

    pub(crate) async fn fleet_map(&self, request: &FleetMapRequest) -> Result<Value> {
        let targets = self.fleet_targets(request)?;
        // Validate once before spawning. A bad kind/method is a script error;
        // upstream failures after validation are isolated per instance.
        for target in &targets {
            self.fleet_action(target, request)?;
        }
        let timeout = self.fleet_instance_timeout;
        let mut results = stream::iter(targets.into_iter().map(|name| {
            let request = request.clone();
            async move {
                let started = Instant::now();
                let result = match self.fleet_action(&name, &request) {
                    Ok(action) => match tokio::time::timeout(
                        timeout,
                        Box::pin(execute_service_action(self, &action)),
                    )
                    .await
                    {
                        Ok(result) => result,
                        Err(_) => Err(anyhow::anyhow!(
                            "instance timed out after {} ms",
                            timeout.as_millis()
                        )),
                    },
                    Err(error) => Err(error),
                };
                match result {
                    Ok(value) => json!({
                        "name": name, "ok": true, "value": value,
                        "truncated": false, "elapsed_ms": started.elapsed().as_millis(),
                    }),
                    Err(error) => json!({
                        "name": name, "ok": false, "error": error.to_string(),
                        "truncated": false, "elapsed_ms": started.elapsed().as_millis(),
                    }),
                }
            }
        }))
        .buffer_unordered(self.fleet_max_concurrent)
        .collect::<Vec<_>>()
        .await;
        results.sort_by(|left, right| left["name"].as_str().cmp(&right["name"].as_str()));
        if request.kind == "*" && request.method == "service_status" {
            return Ok(Value::Array(
                results
                    .into_iter()
                    .map(|row| self.status_row(row))
                    .collect(),
            ));
        }
        Ok(Value::Array(results))
    }

    /// Per-instance reachability, version, and latency over the same bounded
    /// dispatcher used by Code Mode `fleet.status()`.
    pub async fn fleet_status(&self) -> Result<Value> {
        self.fleet_map(&FleetMapRequest {
            kind: "*".into(),
            method: "service_status".into(),
            args: json!({}),
        })
        .await
    }

    fn status_row(&self, row: Value) -> Value {
        let name = row["name"].as_str().unwrap_or("<unknown>");
        let kind = self.kind_of(name).ok().flatten().map(|kind| kind.as_str());
        json!({
            "name": name,
            "kind": kind,
            "reachable": row["ok"],
            "version": find_version(&row["value"]),
            "latency_ms": row["elapsed_ms"],
            "error": row.get("error").cloned().unwrap_or(Value::Null),
            "truncated": row["truncated"],
        })
    }

    fn fleet_action(&self, service_name: &str, request: &FleetMapRequest) -> Result<YarrAction> {
        let kind = self
            .kind_of(service_name)?
            .ok_or_else(|| anyhow::anyhow!("unknown fleet service `{service_name}`"))?;
        if request.method == "service_status" {
            return Ok(YarrAction::ServiceStatus {
                service: service_name.to_owned(),
            });
        }
        if crate::openapi::is_generated(kind) {
            if crate::openapi::classify_operation(kind, &request.method).is_none() {
                anyhow::bail!(
                    "operation `{}` is not available for kind {}",
                    request.method,
                    kind.as_str()
                );
            }
            return Ok(YarrAction::Op {
                service: service_name.to_owned(),
                op: request.method.clone(),
                args: request.args.clone(),
            });
        }
        if !crate::codemode::catalog::service_action_names(kind).contains(&request.method.as_str())
        {
            anyhow::bail!(
                "action `{}` is not available for kind {}",
                request.method,
                kind.as_str()
            );
        }
        let mut params = request.args.as_object().cloned().ok_or_else(|| {
            anyhow::anyhow!("fleet.map service method params must be a JSON object")
        })?;
        params.insert("action".into(), Value::String(request.method.clone()));
        params.insert("service".into(), Value::String(service_name.to_owned()));
        YarrAction::from_mcp_args(&Value::Object(params))
    }
}

fn find_version(value: &Value) -> Option<&str> {
    match value {
        Value::Object(object) => ["version", "productVersion", "pms_version"]
            .iter()
            .find_map(|field| object.get(*field).and_then(Value::as_str))
            .or_else(|| object.values().find_map(find_version)),
        Value::Array(items) => items.iter().find_map(find_version),
        _ => None,
    }
}
