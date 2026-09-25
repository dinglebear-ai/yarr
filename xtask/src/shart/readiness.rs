use super::{PROBE_TIMEOUT, STACK, STACK_DEADLINE};
use crate::live::{guard, reset};
use anyhow::{Context, Result, bail};
use std::collections::BTreeMap;
use std::time::{Duration, Instant};
use ureq::Agent;

pub(super) fn wait_for_services(guarded: &guard::GuardedEnv) -> Result<()> {
    let services = STACK
        .iter()
        .map(|entry| {
            let url = reset::service_url(&guarded.values, entry.service)
                .with_context(|| format!("missing URL for shart service {}", entry.service))?;
            Ok((entry.service.to_owned(), url))
        })
        .collect::<Result<Vec<_>>>()?;
    let agent: Agent = Agent::config_builder()
        .http_status_as_error(false)
        .timeout_global(Some(PROBE_TIMEOUT))
        .build()
        .into();
    poll_readiness(
        &services,
        STACK_DEADLINE,
        Duration::from_millis(750),
        |url| match agent.get(url).call() {
            Ok(response) if response.status().as_u16() < 500 => Ok(()),
            Ok(response) => Err(format!("HTTP {}", response.status().as_u16())),
            Err(error) => Err(error.to_string()),
        },
    )
}

pub(super) fn poll_readiness<F>(
    services: &[(String, String)],
    deadline_after: Duration,
    interval: Duration,
    mut probe: F,
) -> Result<()>
where
    F: FnMut(&str) -> std::result::Result<(), String>,
{
    let deadline = Instant::now() + deadline_after;
    let mut pending = services
        .iter()
        .map(|(service, url)| (service.clone(), (url.clone(), "not probed".to_owned())))
        .collect::<BTreeMap<_, _>>();
    loop {
        let names = pending.keys().cloned().collect::<Vec<_>>();
        for name in names {
            if Instant::now() >= deadline && deadline_after != Duration::ZERO {
                break;
            }
            let Some((url, _)) = pending.get(&name).cloned() else {
                continue;
            };
            match probe(&url) {
                Ok(()) => {
                    pending.remove(&name);
                }
                Err(error) => {
                    if let Some(entry) = pending.get_mut(&name) {
                        entry.1 = error;
                    }
                }
            }
        }
        if pending.is_empty() {
            return Ok(());
        }
        if Instant::now() >= deadline {
            let failures = pending
                .into_iter()
                .map(|(service, (url, error))| format!("{service} ({url}): {error}"))
                .collect::<Vec<_>>()
                .join("; ");
            bail!("shart fleet did not become ready within {deadline_after:?}: {failures}");
        }
        std::thread::sleep(interval.min(deadline.saturating_duration_since(Instant::now())));
    }
}

#[cfg(test)]
#[path = "readiness_tests.rs"]
mod tests;
