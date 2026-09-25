use super::*;
pub(super) fn run_qbittorrent_lifecycle(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
) -> Result<()> {
    let hash = "1111111111111111111111111111111111111111";
    let magnet = format!("magnet:?xt=urn:btih:{hash}&dn=yarr-live-stateful");

    // Best-effort pre-clean (ignore errors if the torrent is not present).
    let _ = cli(yarr, &["qbittorrent", "remove", "--hash", hash]);

    let add = cli(yarr, &["qbittorrent", "add", "--magnet", &magnet])?;
    if !add.to_string().contains("Ok") {
        bail!("qBittorrent add did not return expected accepted response: {add}");
    }
    wait_for_torrent_presence(yarr, hash, true)?;

    for verb in ["pause", "resume"] {
        let value = cli(yarr, &["qbittorrent", verb, "--hash", hash])?;
        if value.get("submitted").and_then(Value::as_bool) != Some(true) {
            bail!("qBittorrent {verb} did not report submitted=true: {value}");
        }
        wait_for_torrent_presence(yarr, hash, true)?;
    }

    let removed = cli(yarr, &["qbittorrent", "remove", "--hash", hash])?;
    if removed.get("submitted").and_then(Value::as_bool) != Some(true) {
        bail!("qBittorrent remove did not report submitted=true: {removed}");
    }
    wait_for_torrent_presence(yarr, hash, false)?;

    report.pass(
        "lifecycle qbittorrent download",
        "add/pause/resume/remove changed observable queue state and cleaned up",
    );
    Ok(())
}

pub(super) fn wait_for_torrent_presence(
    yarr: &process::YarrProcess,
    hash: &str,
    should_exist: bool,
) -> Result<()> {
    let deadline = Instant::now() + Duration::from_secs(8);
    let mut last_queue = Value::Null;
    while Instant::now() < deadline {
        let queue = cli(yarr, &["qbittorrent", "queue"])?;
        if torrent_hashes(&queue).any(|candidate| candidate.eq_ignore_ascii_case(hash))
            == should_exist
        {
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
    bail!("qBittorrent test torrent {hash} did not {expected} queue: {last_queue}");
}

pub(super) fn torrent_hashes(value: &Value) -> impl Iterator<Item = &str> {
    value
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|torrent| torrent.get("hash").and_then(Value::as_str))
}

// ── Tautulli maintenance lifecycle ──────────────────────────────────────────────

pub(super) fn run_tautulli_maintenance_lifecycle(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
) -> Result<()> {
    // All of these dispatch immediately; delete-image-cache is destructive but
    // there is no confirm flag on the CLI (see PLUGINS.md).
    for (verb, field) in [
        ("refresh-libraries", "refreshed"),
        ("refresh-users", "refreshed"),
        ("delete-image-cache", "cleared"),
    ] {
        let value = cli(yarr, &["tautulli", verb])?;
        if value.get("submitted").and_then(Value::as_bool) != Some(true) {
            bail!("tautulli {verb} did not report submitted=true: {value}");
        }
        if !value.get(field).map(Value::is_boolean).unwrap_or(false) {
            bail!("tautulli {verb} did not include boolean {field}: {value}");
        }
    }
    report.pass(
        "lifecycle tautulli maintenance",
        "refresh-libraries/refresh-users/delete-image-cache returned submitted maintenance state",
    );
    Ok(())
}

// ── Bazarr / Tracearr seeded api_delete cleanup ─────────────────────────────────

pub(super) fn run_bazarr_blacklist_delete(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
) -> Result<()> {
    seed_bazarr_blacklist_fixture()?;
    let before = bazarr_blacklist_fixture_count()?;
    if before == 0 {
        bail!("bazarr fixture seeding did not create a blacklist row");
    }
    let deleted = cli(
        yarr,
        &[
            "bazarr",
            "delete",
            "--path",
            "/api/movies/blacklist?all=true",
        ],
    )?;
    let accepted_empty = deleted.as_str() == Some("");
    if deleted.get("ok").and_then(Value::as_bool) != Some(true) && !accepted_empty {
        bail!("bazarr blacklist delete did not report ok=true or empty-string success: {deleted}");
    }
    let after = bazarr_blacklist_fixture_count()?;
    if after != 0 {
        bail!("bazarr blacklist fixture rows remained after delete: before={before} after={after}");
    }
    report.pass(
        "lifecycle bazarr blacklist delete",
        format!("api_delete removed {before} seeded movie blacklist row(s)"),
    );
    Ok(())
}

pub(super) fn seed_bazarr_blacklist_fixture() -> Result<()> {
    run_ssh_shart(
        r#"docker exec -i bazarr python3 <<'PY'
import datetime
import sqlite3

con = sqlite3.connect("/config/db/bazarr.db")
con.execute("delete from table_blacklist_movie where provider=? or subs_id=?", ("yarr-live", "yarr-live-sub"))
con.execute(
    "insert into table_blacklist_movie(language, provider, radarr_id, subs_id, timestamp) values (?,?,?,?,?)",
    ("en", "yarr-live", 999001, "yarr-live-sub", datetime.datetime.now(datetime.UTC).isoformat()),
)
con.commit()
PY"#,
    )?;
    Ok(())
}

pub(super) fn bazarr_blacklist_fixture_count() -> Result<i64> {
    let output = run_ssh_shart(
        r#"docker exec -i bazarr python3 <<'PY'
import sqlite3
con = sqlite3.connect("/config/db/bazarr.db")
print(con.execute("select count(*) from table_blacklist_movie where provider=? or subs_id=?", ("yarr-live", "yarr-live-sub")).fetchone()[0])
PY"#,
    )?;
    parse_i64_output(&output, "bazarr blacklist fixture count")
}

pub(super) fn run_tracearr_debug_delete(
    report: &mut report::Report,
    yarr: &process::YarrProcess,
) -> Result<()> {
    seed_tracearr_session_fixture()?;
    let before = tracearr_session_fixture_count()?;
    if before == 0 {
        bail!("tracearr fixture seeding did not create a session row");
    }
    let deleted = cli(
        yarr,
        &["tracearr", "delete", "--path", "/api/v1/debug/sessions"],
    )?;
    let deleted_sessions = deleted
        .get("deleted")
        .and_then(|deleted| deleted.get("sessions"))
        .and_then(Value::as_i64)
        .unwrap_or(0);
    if deleted_sessions < before {
        bail!(
            "tracearr debug delete removed {deleted_sessions}, expected at least {before}: {deleted}"
        );
    }
    let after = tracearr_session_fixture_count()?;
    if after != 0 {
        bail!("tracearr session fixture rows remained after delete: before={before} after={after}");
    }
    report.pass(
        "lifecycle tracearr debug delete",
        format!("api_delete removed {deleted_sessions} seeded session row(s)"),
    );
    Ok(())
}

pub(super) fn seed_tracearr_session_fixture() -> Result<()> {
    run_ssh_shart(
        r#"docker exec -i tracearr-db psql -U tracearr -d tracearr -v ON_ERROR_STOP=1 <<'SQL'
insert into users (id, username, name, email, role) values ('00000000-0000-4000-8000-000000000001','yarr-fixture','Yarr Fixture','yarr-fixture@example.invalid','member') on conflict (email) do update set username=excluded.username;
insert into servers (id, name, type, url, token) values ('00000000-0000-4000-8000-000000000002','Yarr Fixture Server','plex','http://example.invalid','fixture-token') on conflict (id) do update set name=excluded.name;
insert into server_users (id, user_id, server_id, external_id, username) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','yarr-fixture-user','yarr-fixture') on conflict (id) do update set username=excluded.username;
delete from sessions where id='00000000-0000-4000-8000-000000000004';
insert into sessions (id, server_id, server_user_id, session_key, state, media_type, media_title, ip_address, last_seen_at, started_at) values ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','yarr-fixture-session','playing','movie','Yarr Fixture Movie','127.0.0.1', now(), now());
SQL"#,
    )?;
    Ok(())
}

pub(super) fn tracearr_session_fixture_count() -> Result<i64> {
    let output = run_ssh_shart(
        r#"docker exec tracearr-db psql -U tracearr -d tracearr -tAc "select count(*) from sessions where id='00000000-0000-4000-8000-000000000004'""#,
    )?;
    parse_i64_output(&output, "tracearr session fixture count")
}

pub(super) fn run_ssh_shart(command: &str) -> Result<String> {
    let output = ssh::run(command, Duration::from_secs(30))?
        .ensure_success("seed shart lifecycle fixture")?;
    Ok(output.stdout)
}

pub(super) fn parse_i64_output(output: &str, label: &str) -> Result<i64> {
    output
        .lines()
        .rev()
        .find_map(|line| line.trim().parse::<i64>().ok())
        .ok_or_else(|| anyhow::anyhow!("{label} did not return an integer: {output}"))
}
