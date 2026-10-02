use super::*;

fn args(values: &[&str]) -> Vec<String> {
    values.iter().map(|value| (*value).to_owned()).collect()
}

#[test]
fn doctor_and_watch_infra_flags_are_parsed() {
    assert!(matches!(
        parse_infra_command("doctor", &args(&["--json"])).unwrap(),
        Command::Doctor { json: true }
    ));
    assert!(matches!(
        parse_infra_command("watch", &args(&["--interval", "5", "--once"])).unwrap(),
        Command::Watch {
            interval: 5,
            once: true,
            ..
        }
    ));
    assert!(parse_infra_command("watch", &args(&["--interval", "0"])).is_err());
}

#[test]
fn snippet_infra_requires_a_name_and_valid_json_input() {
    assert!(parse_infra_command("snippet", &args(&["delete"])).is_err());
    let command = parse_infra_command(
        "snippet",
        &args(&["run", "--name", "demo", "--input", r#"{"ok":true}"#]),
    )
    .unwrap();
    assert!(matches!(
        command,
        Command::SnippetRun { name, input }
            if name == "demo" && input["ok"] == serde_json::json!(true)
    ));
}

#[test]
fn discover_plex_flags_are_parsed_and_validated() {
    let command = parse_infra_command(
        "discover",
        &args(&[
            "plex",
            "--token-env",
            "YARR_PLEX_ACCOUNT_TOKEN",
            "--out",
            "/tmp/plex-export.env",
            "--include-shared",
            "--diff",
        ]),
    )
    .unwrap();
    assert!(matches!(
        command,
        Command::DiscoverPlex { token_env, out, include_shared: true, diff: true }
            if token_env == "YARR_PLEX_ACCOUNT_TOKEN"
                && out.as_deref() == Some(std::path::Path::new("/tmp/plex-export.env"))
    ));

    // Owned-only, no export: token-env is the only requirement.
    let command = parse_infra_command("discover", &args(&["plex", "--token-env", "X"])).unwrap();
    assert!(matches!(
        command,
        Command::DiscoverPlex {
            out: None,
            include_shared: false,
            diff: false,
            ..
        }
    ));

    // Strict: provider, required flag, and unknown flags all fail closed.
    assert!(parse_infra_command("discover", &args(&[])).is_err());
    assert!(parse_infra_command("discover", &args(&["sonarr"])).is_err());
    assert!(parse_infra_command("discover", &args(&["plex"])).is_err());
    assert!(
        parse_infra_command("discover", &args(&["plex", "--token-env", "X", "--force"])).is_err()
    );
}
