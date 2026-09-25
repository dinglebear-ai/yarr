//! Confirmed stateful write lifecycles for the doc-based services whose curated
//! commands are not generated OpenAPI ops: SABnzbd / qBittorrent `download_*`,
//! Tautulli `stats_*` maintenance, and Bazarr / Tracearr seeded `api_delete`
//! cleanup. These drive the CURRENT surface — service-grouped CLI verbs
//! (`yarr <svc> add|pause|resume|remove|...`) — and assert observable
//! before/after state, then clean up. (Logic recovered from the retired mcporter
//! suite; only the invocation moved from per-service MCP tools to the CLI.)
//!
//! Destructive by nature (queue removes, blacklist/session deletes), so the suite
//! is skipped under `--no-destructive`. It runs only against the disposable shart
//! stack. SABnzbd needs an NZB fixture URL reachable from shart — a tiny in-process
//! HTTP server on `YARR_LIVE_FIXTURE_HOST` (default the dookie tailnet IP).
//! Bazarr/Tracearr seeding runs over `ssh shart docker exec`.

use anyhow::{Context, Result, bail};
use serde_json::Value;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

use super::{process, report, ssh};

const FIXTURE_PORT: u16 = 40175;

const SAB_FIXTURE_NZB: &str = r#"<?xml version="1.0" encoding="iso-8859-1" ?>
<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/nzb/nzb-1.1.dtd">
<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">
  <file poster="yarr@example.invalid" date="1710000000" subject="yarr-live-test">
    <groups><group>alt.binaries.test</group></groups>
    <segments><segment bytes="1" number="1">yarr-live-test@example.invalid</segment></segments>
  </file>
</nzb>
"#;

pub(super) fn run(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
    no_destructive: bool,
) -> Result<()> {
    if no_destructive {
        return Ok(());
    }
    let fixture = start_fixture_server()?;
    run_sabnzbd_lifecycle(report, yarr, &fixture)?;
    run_qbittorrent_lifecycle(report, yarr)?;
    run_tautulli_maintenance_lifecycle(report, yarr)?;
    run_bazarr_blacklist_delete(report, yarr)?;
    run_tracearr_debug_delete(report, yarr)?;
    Ok(())
}

/// Run `yarr <args>` and parse stdout as JSON, bailing on a non-zero exit.
fn cli(yarr: &process::YarrProcess, args: &[&str]) -> Result<Value> {
    yarr.json(args)
}

// ── SABnzbd download lifecycle ──────────────────────────────────────────────────

struct FixtureServer {
    base_url: String,
}

fn start_fixture_server() -> Result<FixtureServer> {
    let host =
        std::env::var("YARR_LIVE_FIXTURE_HOST").unwrap_or_else(|_| "100.88.16.79".to_string());
    let listener = TcpListener::bind(("0.0.0.0", FIXTURE_PORT)).with_context(|| {
        format!(
            "failed to bind live fixture server on 0.0.0.0:{FIXTURE_PORT}; \
             set YARR_LIVE_FIXTURE_HOST to a host/IP reachable from shart"
        )
    })?;
    let body = Arc::new(SAB_FIXTURE_NZB.as_bytes().to_vec());
    thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            let body = Arc::clone(&body);
            thread::spawn(move || {
                let _ = serve_fixture_request(stream, &body);
            });
        }
    });
    Ok(FixtureServer {
        base_url: format!("http://{host}:{FIXTURE_PORT}"),
    })
}

fn serve_fixture_request(mut stream: std::net::TcpStream, body: &[u8]) -> Result<()> {
    let mut buf = [0_u8; 1024];
    let _ = stream.read(&mut buf);
    write!(
        stream,
        "HTTP/1.1 200 OK\r\nContent-Type: application/x-nzb\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    )?;
    stream.write_all(body)?;
    let _ = stream.flush();
    Ok(())
}

fn run_sabnzbd_lifecycle(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
    fixture: &FixtureServer,
) -> Result<()> {
    cleanup_sabnzbd_queue(yarr)?;
    let url = format!("{}/yarr-live-test.nzb", fixture.base_url);
    let added = cli(yarr, &["sabnzbd", "add", "--url", &url])?;
    if added.get("status").and_then(Value::as_bool) != Some(true) {
        bail!("SABnzbd add did not report status=true: {added}");
    }
    let id = added
        .get("nzo_ids")
        .and_then(Value::as_array)
        .and_then(|ids| ids.first())
        .and_then(Value::as_str)
        .ok_or_else(|| anyhow::anyhow!("SABnzbd add did not return nzo_ids: {added}"))?
        .to_string();
    wait_for_sab_job(yarr, &id, true)?;

    for verb in ["pause", "resume"] {
        let value = cli(yarr, &["sabnzbd", verb, "--id", &id])?;
        assert_sab_status(&value, &id, verb)?;
    }

    let removed = cli(yarr, &["sabnzbd", "remove", "--id", &id])?;
    assert_sab_status(&removed, &id, "remove")?;
    wait_for_sab_job(yarr, &id, false)?;

    report.pass(
        "lifecycle sabnzbd download",
        "add/pause/resume/remove changed observable queue state and cleaned up",
    );
    Ok(())
}

fn cleanup_sabnzbd_queue(yarr: &process::YarrProcess) -> Result<()> {
    let queue = sab_queue(yarr)?;
    for id in sab_ids(&queue).collect::<Vec<_>>() {
        let _ = cli(yarr, &["sabnzbd", "remove", "--id", &id]);
    }
    Ok(())
}

fn wait_for_sab_job(yarr: &process::YarrProcess, id: &str, should_exist: bool) -> Result<()> {
    let deadline = Instant::now() + Duration::from_secs(8);
    let mut last_queue = Value::Null;
    while Instant::now() < deadline {
        let queue = sab_queue(yarr)?;
        if sab_ids(&queue).any(|candidate| candidate == id) == should_exist {
            return Ok(());
        }
        last_queue = queue;
        thread::sleep(Duration::from_millis(500));
    }
    let expected = if should_exist {
        "appear in"
    } else {
        "disappear from"
    };
    bail!("SABnzbd test job {id} did not {expected} queue: {last_queue}");
}

fn sab_queue(yarr: &process::YarrProcess) -> Result<Value> {
    cli(yarr, &["sabnzbd", "queue"])
}

fn sab_ids(value: &Value) -> impl Iterator<Item = String> + '_ {
    value
        .get("slots")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|slot| slot.get("nzo_id").and_then(Value::as_str))
        .map(str::to_owned)
}

fn assert_sab_status(value: &Value, id: &str, verb: &str) -> Result<()> {
    if value.get("status").and_then(Value::as_bool) != Some(true) {
        bail!("SABnzbd {verb} did not report status=true: {value}");
    }
    let has_id = value
        .get("nzo_ids")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .any(|candidate| candidate.as_str() == Some(id));
    if !has_id {
        bail!("SABnzbd {verb} response did not include nzo id {id}: {value}");
    }
    Ok(())
}

// ── qBittorrent download lifecycle ──────────────────────────────────────────────

#[path = "lifecycles/services.rs"]
mod services;
use services::*;

#[cfg(test)]
#[path = "lifecycles_tests.rs"]
mod tests;
