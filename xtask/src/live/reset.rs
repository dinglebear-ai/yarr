//! Shart live-stack reset support.
//!
//! The shart test stack mounts several service `/config` directories directly
//! from `backup/lab/live/golden/<service>` ZFS datasets. Rolling each dataset
//! back to `@configured-v1` gives the live harness a cheap reset point for
//! operations that intentionally rewrite config/auth state or stop a service.

use anyhow::{Result, bail};
use std::collections::BTreeMap;
use std::time::{Duration, Instant};

use super::ssh;

#[derive(Debug, Clone, Copy)]
pub struct ResetTarget {
    pub service: &'static str,
    pub container: &'static str,
    pub dataset: &'static str,
    pub snapshot: &'static str,
}

const RESET_TARGETS: &[ResetTarget] = &[
    target("sonarr"),
    target("radarr"),
    target("prowlarr"),
    target("overseerr"),
    target("plex"),
    target("tautulli"),
    target("sabnzbd"),
    target("qbittorrent"),
    target("jellyfin"),
    ResetTarget {
        service: "jellyfin",
        container: "jellyfin",
        dataset: "jellyfin-cache",
        snapshot: "configured-v1",
    },
];

const fn target(service: &'static str) -> ResetTarget {
    ResetTarget {
        service,
        container: service,
        dataset: service,
        snapshot: "configured-v1",
    }
}

pub fn target_for(service: &str) -> Option<&'static ResetTarget> {
    RESET_TARGETS
        .iter()
        .find(|target| target.service == service)
}

pub fn all_targets() -> &'static [ResetTarget] {
    RESET_TARGETS
}

pub fn reset_service(service: &str) -> Result<()> {
    let targets = targets_for(service);
    if targets.is_empty() {
        bail!("no shart ZFS golden reset target for {service}");
    }
    reset_targets(&targets)
}

pub fn reset_targets(targets: &[&ResetTarget]) -> Result<()> {
    let containers = targets
        .iter()
        .map(|target| target.container)
        .collect::<std::collections::BTreeSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();
    reset_targets_with_fleet(targets, &containers)
}

pub fn reset_all(fleet_containers: &[&str]) -> Result<()> {
    let targets = RESET_TARGETS.iter().collect::<Vec<_>>();
    reset_targets_with_fleet(&targets, fleet_containers)
}

fn reset_targets_with_fleet(targets: &[&ResetTarget], fleet_containers: &[&str]) -> Result<()> {
    if targets.is_empty() {
        return Ok(());
    }
    let command = reset_script(targets, fleet_containers);
    eprintln!("reset shart: preflighting and restoring golden datasets");
    let output = ssh::run(&command, Duration::from_secs(180))?
        .ensure_success("reset shart golden datasets")?;
    if !output.stdout.is_empty() {
        eprintln!("{}", output.stdout);
    }
    Ok(())
}

fn reset_script(targets: &[&ResetTarget], fleet_containers: &[&str]) -> String {
    let containers = fleet_containers.join(" ");
    let preflight_targets = targets
        .iter()
        .map(|target| {
            format!(
                r#"zfs list -H backup/lab/live/golden/{dataset} >/dev/null
zfs list -H -t snapshot backup/lab/live/golden/{dataset}@{snapshot} >/dev/null
newest=$(zfs list -H -t snapshot -o name -s creation -r backup/lab/live/golden/{dataset} | tail -n 1)
[ "$newest" = "backup/lab/live/golden/{dataset}@{snapshot}" ] || {{ echo "refusing rollback: {dataset}@{snapshot} is not newest (newest=$newest)" >&2; exit 1; }}
[ -d /mnt/backup/lab/live/golden/{dataset} ] || {{ echo "missing source mount for {dataset}" >&2; exit 1; }}"#,
                dataset = target.dataset,
                snapshot = target.snapshot,
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    let rollbacks = targets
        .iter()
        .map(|target| {
            format!(
                "zfs rollback backup/lab/live/golden/{dataset}@{snapshot}\nfind /mnt/backup/lab/live/golden/{dataset} -maxdepth 2 \\( -name '*.db-shm' -o -name '*.db-wal' -o -name '*.pid' \\) -delete\nmkdir -p /mnt/user/lab/live/golden/{dataset}\nrsync -a --delete /mnt/backup/lab/live/golden/{dataset}/ /mnt/user/lab/live/golden/{dataset}/\nfind /mnt/user/lab/live/golden/{dataset} -maxdepth 2 \\( -name '*.db-shm' -o -name '*.db-wal' -o -name '*.pid' \\) -delete",
                dataset = target.dataset,
                snapshot = target.snapshot,
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"set -euo pipefail
containers="{containers}"
for tool in docker zfs rsync find; do command -v "$tool" >/dev/null || {{ echo "missing required tool: $tool" >&2; exit 1; }}; done
docker info >/dev/null
for container in $containers; do docker inspect "$container" >/dev/null || {{ echo "missing container: $container" >&2; exit 1; }}; done
[ -d /mnt/user/lab/live/golden ] || {{ echo "missing live golden base directory" >&2; exit 1; }}
{preflight_targets}
completed=0
finish() {{
  rc=$?
  trap - EXIT
  if [ "$rc" -ne 0 ] && [ "$completed" -eq 0 ]; then
    docker stop $containers >/dev/null 2>&1 || true
    echo "golden restore failed; managed fleet remains stopped; rerun seed after correcting the reported failure" >&2
  fi
  exit "$rc"
}}
trap finish EXIT
docker stop $containers >/dev/null
{rollbacks}
docker start $containers >/dev/null
completed=1
"#
    )
}

fn targets_for(service: &str) -> Vec<&'static ResetTarget> {
    RESET_TARGETS
        .iter()
        .filter(|target| target.service == service)
        .collect()
}

pub fn wait_service_url(url: &str) -> Result<()> {
    let deadline = Instant::now() + Duration::from_secs(120);
    let mut last = String::new();
    while Instant::now() < deadline {
        match ureq::get(url).call() {
            Ok(response) if response.status().as_u16() < 500 => return Ok(()),
            Ok(response) => last = format!("HTTP {}", response.status().as_u16()),
            Err(err) => last = err.to_string(),
        }
        std::thread::sleep(Duration::from_millis(750));
    }
    bail!("service did not become reachable at {url}: {last}");
}

pub fn service_url(values: &BTreeMap<String, String>, service: &str) -> Option<String> {
    let env_name: String = service
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_uppercase()
            } else {
                '_'
            }
        })
        .collect();
    values.get(&format!("YARR_{env_name}_URL")).cloned()
}

#[cfg(test)]
#[path = "reset_tests.rs"]
mod tests;
