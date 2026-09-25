//! Shared bounded SSH execution for the disposable shart test host.

use anyhow::{Context, Result, bail};
use std::process::Command;
use std::time::Duration;

pub const SHART_HOST: &str = "shart";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RemoteOutput {
    pub status: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

impl RemoteOutput {
    pub fn success(&self) -> bool {
        self.status == Some(0)
    }

    pub fn ensure_success(self, operation: &str) -> Result<Self> {
        if self.success() {
            return Ok(self);
        }
        bail!(
            "{operation} failed on {SHART_HOST} (exit={}): stdout={:?} stderr={:?}",
            self.status
                .map_or_else(|| "signal".to_owned(), |code| code.to_string()),
            self.stdout,
            self.stderr,
        )
    }
}

pub fn run(command: &str, deadline: Duration) -> Result<RemoteOutput> {
    let deadline_secs = deadline.as_secs().max(1).to_string();
    let output = Command::new("timeout")
        .args(["--kill-after=5s", &deadline_secs, "ssh"])
        .arg("-o")
        .arg("BatchMode=yes")
        .arg("-o")
        .arg("ConnectTimeout=10")
        .arg("-o")
        .arg("ServerAliveInterval=10")
        .arg("-o")
        .arg("ServerAliveCountMax=3")
        .arg(SHART_HOST)
        .arg(command)
        .output()
        .with_context(|| format!("failed to spawn bounded SSH command for {SHART_HOST}"))?;
    Ok(RemoteOutput {
        status: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).trim().to_owned(),
    })
}

#[cfg(test)]
#[path = "ssh_tests.rs"]
mod tests;
