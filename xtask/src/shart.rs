//! Operator lifecycle commands for the dedicated shart test stack.
//!
//! These commands intentionally manage only the typed deployment manifest below.
//! They never start or stop the Unraid array.

use crate::live::{guard, reset, ssh};
mod readiness;
mod status;

use anyhow::{Result, bail};
use readiness::wait_for_services;
use serde::Serialize;
use status::{fetch_status, render_status};
use std::collections::BTreeSet;
use std::time::Duration;

const DOCKER_PREFLIGHT: &str = "if ! docker info >/dev/null 2>&1; then echo 'shart Docker is unavailable; start the Unraid array before managing the test stack' >&2; exit 1; fi";
const STACK_DEADLINE: Duration = Duration::from_secs(120);
const PROBE_TIMEOUT: Duration = Duration::from_secs(2);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct StackService {
    service: &'static str,
    kind: &'static str,
    container: &'static str,
}

const STACK: &[StackService] = &[
    stack_service("sonarr"),
    stack_service("radarr"),
    stack_service("prowlarr"),
    stack_service("tautulli"),
    stack_service("overseerr"),
    stack_service("bazarr"),
    stack_service("tracearr"),
    stack_service("sabnzbd"),
    stack_service("qbittorrent"),
    stack_service("plex"),
    stack_service("jellyfin"),
];

const fn stack_service(name: &'static str) -> StackService {
    StackService {
        service: name,
        kind: name,
        container: name,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum LifecycleAction {
    Start,
    Stop,
}

impl LifecycleAction {
    const fn docker_verb(self) -> &'static str {
        match self {
            Self::Start => "start",
            Self::Stop => "stop",
        }
    }

    const fn desired_state(self) -> &'static str {
        match self {
            Self::Start => "running",
            Self::Stop => "exited",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Command {
    Help,
    Start,
    Stop,
    Status,
    Seed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Options {
    command: Command,
    json: bool,
    dry_run: bool,
}

impl Options {
    fn parse(args: &[String]) -> Result<Self> {
        let Some(command) = args.first().map(String::as_str) else {
            return Ok(Self {
                command: Command::Help,
                json: false,
                dry_run: false,
            });
        };
        if matches!(command, "--help" | "-h" | "help") {
            if args.len() != 1 {
                bail!("help does not accept additional arguments");
            }
            return Ok(Self {
                command: Command::Help,
                json: false,
                dry_run: false,
            });
        }
        let command = match command {
            "start" => Command::Start,
            "stop" => Command::Stop,
            "status" => Command::Status,
            "seed" => Command::Seed,
            unknown => bail!("unknown shart command: {unknown}"),
        };
        let mut json = false;
        let mut dry_run = false;
        for arg in &args[1..] {
            match arg.as_str() {
                "--json" if command == Command::Status => json = true,
                "--dry-run" if command == Command::Seed => dry_run = true,
                "--json" => bail!("--json is only valid with shart status"),
                "--dry-run" => bail!("--dry-run is only valid with shart seed"),
                other => bail!("unknown option for shart {command:?}: {other}"),
            }
        }
        Ok(Self {
            command,
            json,
            dry_run,
        })
    }
}

pub fn run(args: &[String]) -> Result<()> {
    let options = Options::parse(args)?;
    match options.command {
        Command::Help => {
            print_help();
            Ok(())
        }
        Command::Start => start(),
        Command::Stop => stop(),
        Command::Status => status(options.json),
        Command::Seed => seed(options.dry_run),
    }
}

fn start() -> Result<()> {
    let guarded = guarded_stack()?;
    run_lifecycle(LifecycleAction::Start)?;
    finish_start(&guarded)
}

fn stop() -> Result<()> {
    run_lifecycle(LifecycleAction::Stop)?;
    render_status(fetch_status(false)?, false)
}

fn status(json: bool) -> Result<()> {
    let report = fetch_status(true)?;
    render_status(report, json)
}

fn seed(dry_run: bool) -> Result<()> {
    let guarded = guarded_stack()?;
    let plan = seed_plan();
    print_seed_plan(&plan);
    if dry_run {
        println!("dry-run: no remote changes made");
        return Ok(());
    }
    reset::reset_all(&container_names())?;
    finish_start(&guarded)
}

fn guarded_stack() -> Result<guard::GuardedEnv> {
    let guarded = guard::load(None, false)?;
    let configured = guarded
        .services
        .iter()
        .map(String::as_str)
        .collect::<BTreeSet<_>>();
    let expected = STACK
        .iter()
        .map(|entry| entry.service)
        .collect::<BTreeSet<_>>();
    if configured != expected {
        bail!(
            "shart lifecycle requires exact canonical service identities; configured={configured:?} expected={expected:?}"
        );
    }
    for entry in STACK {
        let kind = guarded.kinds.get(entry.service).map(String::as_str);
        if kind != Some(entry.kind) {
            bail!(
                "shart service {} must use kind {}; got {:?}",
                entry.service,
                entry.kind,
                kind
            );
        }
    }
    Ok(guarded)
}

fn container_names() -> Vec<&'static str> {
    STACK.iter().map(|entry| entry.container).collect()
}

fn lifecycle_command(action: LifecycleAction) -> String {
    let containers = container_names().join(" ");
    let verb = action.docker_verb();
    let desired = action.desired_state();
    format!(
        r#"set -eu
{DOCKER_PREFLIGHT}
plan=""
for container in {containers}; do
  state=$(docker inspect --format '{{{{.State.Status}}}}' "$container" 2>/dev/null) || {{ echo "missing container: $container" >&2; exit 1; }}
  plan="$plan $container:$state"
done
for item in $plan; do
  container=${{item%%:*}}
  state=${{item#*:}}
  if [ "$state" != "{desired}" ]; then docker {verb} "$container" >/dev/null; fi
done"#
    )
}

fn run_lifecycle(action: LifecycleAction) -> Result<()> {
    ssh::run(&lifecycle_command(action), Duration::from_secs(180))?
        .ensure_success(action.docker_verb())?;
    Ok(())
}

#[derive(Debug, Serialize)]
struct SeedPlan {
    host: &'static str,
    environment_file: &'static str,
    containers: Vec<&'static str>,
    restored_datasets: Vec<String>,
    retained_services: Vec<&'static str>,
}

fn seed_plan() -> SeedPlan {
    let restored_services = reset::all_targets()
        .iter()
        .map(|target| target.service)
        .collect::<BTreeSet<_>>();
    SeedPlan {
        host: ssh::SHART_HOST,
        environment_file: guard::DEFAULT_ENV_FILE,
        containers: container_names(),
        restored_datasets: reset::all_targets()
            .iter()
            .map(|target| {
                format!(
                    "backup/lab/live/golden/{}@{}",
                    target.dataset, target.snapshot
                )
            })
            .collect(),
        retained_services: STACK
            .iter()
            .filter(|entry| !restored_services.contains(entry.service))
            .map(|entry| entry.service)
            .collect(),
    }
}

fn print_seed_plan(plan: &SeedPlan) {
    println!("shart seed plan:");
    println!("  host: {}", plan.host);
    println!("  environment: {}", plan.environment_file);
    println!("  containers: {}", plan.containers.join(", "));
    println!("  restored datasets:");
    for dataset in &plan.restored_datasets {
        println!("    - {dataset}");
    }
    println!(
        "  retained services (no golden): {}",
        plan.retained_services.join(", ")
    );
}

fn finish_start(guarded: &guard::GuardedEnv) -> Result<()> {
    let readiness = wait_for_services(guarded);
    let status = fetch_status(true);
    match status {
        Ok(report) => {
            let status_result = render_status(report, false);
            readiness.and(status_result)
        }
        Err(status_error) => match readiness {
            Ok(()) => Err(status_error),
            Err(readiness_error) => bail!(
                "readiness failed: {readiness_error:#}; fleet status also failed: {status_error:#}"
            ),
        },
    }
}

fn print_help() {
    print!("{}", help_text());
}

fn help_text() -> &'static str {
    "cargo xtask shart <start|stop|status|seed> [options]\n\
  start              Start stopped manifest containers and wait for readiness\n\
  stop               Stop running manifest containers\n\
  status [--json]    Show container state/health; fail unless all are running\n\
  seed [--dry-run]   Restore goldens fail-closed, start the fleet, and wait\n\
These commands do not start or stop the shart Unraid array.\n"
}

#[cfg(test)]
#[path = "shart_tests.rs"]
mod tests;
