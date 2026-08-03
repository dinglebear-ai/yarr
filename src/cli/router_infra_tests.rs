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
fn plex_discovery_is_owned_only_and_reviewable_by_default() {
    assert_eq!(
        parse_infra_command("discover", &args(&["plex"])).unwrap(),
        Command::DiscoverPlex {
            owned_only: true,
            token_env: "PLEX_ACCOUNT_TOKEN".into(),
            output: "fleet.yaml".into(),
            env_output: "fleet.env".into(),
            diff: false,
        }
    );
    assert!(matches!(
        parse_infra_command("discover", &args(&["plex", "--include-shared", "--diff"])).unwrap(),
        Command::DiscoverPlex {
            owned_only: false,
            diff: true,
            ..
        }
    ));
}
