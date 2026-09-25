use super::{DOCKER_PREFLIGHT, container_names};
use crate::live::ssh;
use anyhow::{Result, bail};
use serde::Serialize;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub(super) struct ContainerStatus {
    pub(super) container: String,
    pub(super) state: String,
    health: String,
}

#[derive(Debug, Clone, Serialize)]
pub(super) struct StatusReport {
    ok: bool,
    host: &'static str,
    containers: Vec<ContainerStatus>,
    error: Option<RemoteError>,
}

#[derive(Debug, Clone, Serialize)]
struct RemoteError {
    kind: &'static str,
    exit_status: Option<i32>,
    stdout: String,
    stderr: String,
}

pub(super) fn status_script(require_running: bool) -> String {
    let running_check = if require_running {
        r#"    health=$(printf '%s\n' "$values" | cut -f 2)
    [ "$state" = "running" ] || failed=1
    [ "$health" = "-" ] || [ "$health" = "healthy" ] || failed=1"#
    } else {
        ""
    };
    format!(
        r#"set -u
{DOCKER_PREFLIGHT}
failed=0
for container in {}; do
  if values=$(docker inspect --format '{{{{.State.Status}}}}{{{{"\t"}}}}{{{{if .State.Health}}}}{{{{.State.Health.Status}}}}{{{{else}}}}-{{{{end}}}}' "$container" 2>/dev/null); then
    printf '%s\t%s\n' "$container" "$values"
    state=$(printf '%s\n' "$values" | cut -f 1)
{running_check}
  else
    printf '%s\tmissing\t-\n' "$container"
    failed=1
  fi
done
exit "$failed""#,
        container_names().join(" "),
    )
}

pub(super) fn fetch_status(require_running: bool) -> Result<StatusReport> {
    let output = ssh::run(&status_script(require_running), Duration::from_secs(30))?;
    let containers = parse_status(&output.stdout)?;
    let ok = output.success();
    let error = (!ok).then(|| RemoteError {
        kind: classify_error(output.status, &output.stderr),
        exit_status: output.status,
        stdout: output.stdout.clone(),
        stderr: output.stderr,
    });
    Ok(StatusReport {
        ok,
        host: ssh::SHART_HOST,
        containers,
        error,
    })
}

fn classify_error(status: Option<i32>, stderr: &str) -> &'static str {
    match status {
        Some(124 | 137) => "ssh_timeout",
        Some(255) | None => "ssh_failed",
        _ if stderr.contains("Docker is unavailable") => "docker_unavailable",
        _ => "container_state",
    }
}

pub(super) fn parse_status(output: &str) -> Result<Vec<ContainerStatus>> {
    output
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| {
            let mut fields = line.split('\t');
            let container = fields.next().unwrap_or("");
            let state = fields.next().unwrap_or("");
            let health = fields.next().unwrap_or("");
            if container.is_empty()
                || state.is_empty()
                || health.is_empty()
                || fields.next().is_some()
            {
                bail!("invalid shart status row: {line:?}");
            }
            Ok(ContainerStatus {
                container: container.into(),
                state: state.into(),
                health: health.into(),
            })
        })
        .collect()
}

pub(super) fn render_status(report: StatusReport, json: bool) -> Result<()> {
    if json {
        println!("{}", serde_json::to_string_pretty(&report)?);
    } else {
        println!("{:<16} {:<12} HEALTH", "CONTAINER", "STATE");
        for container in &report.containers {
            println!(
                "{:<16} {:<12} {}",
                container.container, container.state, container.health
            );
        }
        if let Some(error) = &report.error {
            eprintln!(
                "shart status error: kind={} exit={:?} stderr={}",
                error.kind, error.exit_status, error.stderr
            );
        }
    }
    if !report.ok {
        bail!("one or more shart containers are unavailable or not running");
    }
    Ok(())
}

#[cfg(test)]
#[path = "status_tests.rs"]
mod tests;
