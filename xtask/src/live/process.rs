use anyhow::{Context, Result, bail};
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Child, Command, Output, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use super::guard::GuardedEnv;

/// Upstream timeout handed to the yarr process under test. Must stay strictly
/// below [`CMD_TIMEOUT`] so yarr always returns its own (graceful) timeout error
/// before this harness kills the child — otherwise a slow upstream is a kill-race
/// that aborts the whole suite non-deterministically.
const HTTP_TIMEOUT_SECS: u64 = 90;

/// Per-command wall-clock budget. Strictly greater than the yarr client timeout
/// ([`HTTP_TIMEOUT_SECS`]) so a slow-but-bounded upstream read resolves inside
/// yarr rather than being killed here.
const CMD_TIMEOUT: Duration = Duration::from_secs(120);

pub struct YarrProcess {
    pub binary: String,
    pub env: BTreeMap<String, String>,
}

pub struct Server {
    child: Child,
}

impl YarrProcess {
    pub fn new(binary: String, guarded: &GuardedEnv) -> Self {
        let mut env = guarded.values.clone();
        env.insert("YARR_HOME".into(), super::guard::SHART_HOME.into());
        // Give yarr a generous, *bounded* upstream timeout (below CMD_TIMEOUT) so
        // a slow Prowlarr `/indexer` fan-out resolves gracefully instead of racing
        // this harness's process kill. Respect an explicit override if present.
        env.entry("YARR_HTTP_TIMEOUT_SECS".into())
            .or_insert_with(|| HTTP_TIMEOUT_SECS.to_string());
        Self { binary, env }
    }

    pub fn output(&self, args: &[&str]) -> Result<Output> {
        self.output_with_timeout(args, CMD_TIMEOUT)
    }

    pub fn output_with_env(
        &self,
        args: &[&str],
        extra_env: &BTreeMap<String, String>,
    ) -> Result<Output> {
        self.output_with_env_timeout(args, extra_env, CMD_TIMEOUT)
    }

    pub fn output_with_env_timeout(
        &self,
        args: &[&str],
        extra_env: &BTreeMap<String, String>,
        timeout: Duration,
    ) -> Result<Output> {
        let mut env = self.env.clone();
        env.extend(extra_env.clone());
        output_for_command(&self.binary, args, &env, None, timeout)
    }

    pub fn output_with_timeout(&self, args: &[&str], timeout: Duration) -> Result<Output> {
        output_for_command(&self.binary, args, &self.env, None, timeout)
    }

    pub fn output_with_stdin(
        &self,
        args: &[&str],
        input: &str,
        timeout: Duration,
    ) -> Result<Output> {
        output_for_command(&self.binary, args, &self.env, Some(input), timeout)
    }

    pub fn output_until_timeout(&self, args: &[&str], timeout: Duration) -> Result<Output> {
        let capture = OutputCapture::new("yarr-until-timeout")?;
        let mut child = Command::new(&self.binary)
            .args(args)
            .envs(&self.env)
            .stdout(capture.stdout_stdio()?)
            .stderr(capture.stderr_stdio()?)
            .spawn()
            .with_context(|| format!("failed to run {} {}", self.binary, args.join(" ")))?;

        let deadline = Instant::now() + timeout;
        while Instant::now() < deadline {
            if child.try_wait()?.is_some() {
                let status = child.wait().context("failed to collect command status")?;
                return capture.into_output(status);
            }
            thread::sleep(Duration::from_millis(50));
        }
        let _ = child.kill();
        let status = child
            .wait()
            .context("failed to collect timed-out command status")?;
        let output = capture.into_output(status)?;
        Ok(output)
    }

    pub fn json(&self, args: &[&str]) -> Result<serde_json::Value> {
        let output = self.output(args)?;
        if !output.status.success() {
            bail!("{}", String::from_utf8_lossy(&output.stderr));
        }
        serde_json::from_slice(&output.stdout).context("failed to parse Yarr CLI JSON")
    }

    pub fn start_server(&self, port: u16) -> Result<Server> {
        self.start_server_args(&["serve", "mcp"], "127.0.0.1", port, &BTreeMap::new())
    }

    pub fn start_server_args(
        &self,
        args: &[&str],
        host: &str,
        port: u16,
        extra_env: &BTreeMap<String, String>,
    ) -> Result<Server> {
        let mut env = self.env.clone();
        env.extend(extra_env.clone());
        env.insert("YARR_MCP_HOST".into(), host.into());
        env.insert("YARR_MCP_PORT".into(), port.to_string());
        let child = Command::new(&self.binary)
            .args(args)
            .envs(env)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .context("failed to start Yarr MCP server")?;
        Ok(Server { child })
    }
}

fn output_for_command(
    binary: &str,
    args: &[&str],
    env: &BTreeMap<String, String>,
    input: Option<&str>,
    timeout: Duration,
) -> Result<Output> {
    let capture = OutputCapture::new("yarr-command")?;
    let mut child = Command::new(binary)
        .args(args)
        .envs(env)
        .stdin(if input.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(capture.stdout_stdio()?)
        .stderr(capture.stderr_stdio()?)
        .spawn()
        .with_context(|| format!("failed to run {} {}", binary, args.join(" ")))?;

    if let Some(input) = input {
        let mut stdin = child.stdin.take().context("failed to open command stdin")?;
        stdin.write_all(input.as_bytes())?;
    }

    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if child.try_wait()?.is_some() {
            let status = child.wait().context("failed to collect command status")?;
            return capture.into_output(status);
        }
        thread::sleep(Duration::from_millis(50));
    }
    let _ = child.kill();
    let status = child
        .wait()
        .context("failed to collect timed-out command status")?;
    let output = capture.into_output(status)?;
    bail!(
        "{} {} timed out after {}s; stdout={} stderr={}",
        binary,
        args.join(" "),
        timeout.as_secs(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

struct OutputCapture {
    stdout: PathBuf,
    stderr: PathBuf,
}

impl OutputCapture {
    fn new(label: &str) -> Result<Self> {
        let nonce = format!(
            "{}-{}-{}",
            label,
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .context("system clock before unix epoch")?
                .as_nanos()
        );
        let dir = std::env::temp_dir();
        Ok(Self {
            stdout: dir.join(format!("{nonce}.stdout")),
            stderr: dir.join(format!("{nonce}.stderr")),
        })
    }

    fn stdout_stdio(&self) -> Result<Stdio> {
        Ok(Stdio::from(File::create(&self.stdout).with_context(
            || format!("create {}", self.stdout.display()),
        )?))
    }

    fn stderr_stdio(&self) -> Result<Stdio> {
        Ok(Stdio::from(File::create(&self.stderr).with_context(
            || format!("create {}", self.stderr.display()),
        )?))
    }

    fn into_output(self, status: std::process::ExitStatus) -> Result<Output> {
        let stdout = fs::read(&self.stdout).unwrap_or_default();
        let stderr = fs::read(&self.stderr).unwrap_or_default();
        let _ = fs::remove_file(&self.stdout);
        let _ = fs::remove_file(&self.stderr);
        Ok(Output {
            status,
            stdout,
            stderr,
        })
    }
}

impl Server {
    pub fn wait_healthy(&mut self, base_url: &str) -> Result<()> {
        let deadline = Instant::now() + Duration::from_secs(20);
        while Instant::now() < deadline {
            if let Ok(response) = ureq::get(format!("{base_url}/health")).call()
                && response.status().as_u16() == 200
            {
                return Ok(());
            }
            std::thread::sleep(Duration::from_millis(250));
        }
        bail!("Yarr server did not become healthy at {base_url}");
    }
}

#[cfg(test)]
#[path = "process_tests.rs"]
mod tests;

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let deadline = Instant::now() + Duration::from_secs(5);
        while Instant::now() < deadline {
            match self.child.try_wait() {
                Ok(Some(_)) => return,
                Ok(None) => thread::sleep(Duration::from_millis(50)),
                Err(_) => return,
            }
        }
    }
}
