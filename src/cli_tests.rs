use super::{Command, SetupCommand, parse_args_from, usage};
use serde_json::json;

#[test]
fn empty_args_returns_none() {
    let result = parse_args_from::<_, String>([]).unwrap();
    assert!(result.is_none());
}

#[test]
fn unknown_token1_errors_with_inventory() {
    let err = parse_args_from(["unknown-command"]).unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("unknown command"));
    assert!(msg.contains("sonarr"), "should list services");
    assert!(msg.contains("help"), "should list infra verbs");
}

#[test]
fn service_status_subcommand() {
    let cmd = parse_args_from(["sonarr", "status"]).unwrap().unwrap();
    assert_eq!(
        cmd,
        Command::Status {
            service: "sonarr".into()
        }
    );
}

#[test]
fn service_without_command_errors() {
    let err = parse_args_from(["sonarr"]).unwrap_err();
    assert!(err.to_string().contains("requires a command"));
}

#[test]
fn get_and_post_subcommands() {
    let get = parse_args_from(["radarr", "get", "--path", "/api/v3/system/status"])
        .unwrap()
        .unwrap();
    assert_eq!(
        get,
        Command::Get {
            service: "radarr".into(),
            path: "/api/v3/system/status".into()
        }
    );

    let post = parse_args_from([
        "overseerr",
        "post",
        "--path",
        "/api/v1/request",
        "--body",
        "{\"mediaId\":1}",
    ])
    .unwrap()
    .unwrap();
    assert_eq!(
        post,
        Command::Post {
            service: "overseerr".into(),
            path: "/api/v1/request".into(),
            body: json!({"mediaId": 1}),
        }
    );
}

#[test]
fn put_subcommand() {
    let put = parse_args_from([
        "sonarr",
        "put",
        "--path",
        "/api/v3/series/editor",
        "--body",
        "{\"seriesIds\":[1],\"qualityProfileId\":4}",
    ])
    .unwrap()
    .unwrap();
    assert_eq!(
        put,
        Command::Put {
            service: "sonarr".into(),
            path: "/api/v3/series/editor".into(),
            body: json!({"seriesIds": [1], "qualityProfileId": 4}),
        }
    );
}

#[test]
fn delete_subcommand_allows_missing_body() {
    // Uses prowlarr (Indexer capability) because the generic passthrough `delete`
    // verb is shadowed by the curated arr `delete` command for ArrManager kinds
    // (C2). For a non-arr kind the generic passthrough still owns `delete`.
    let delete = parse_args_from(["prowlarr", "delete", "--path", "/api/v1/indexer/9"])
        .unwrap()
        .unwrap();
    assert_eq!(
        delete,
        Command::Delete {
            service: "prowlarr".into(),
            path: "/api/v1/indexer/9".into(),
            body: None,
        }
    );
}

#[test]
fn delete_no_longer_recognizes_confirm_or_yes() {
    // `delete` runs immediately now; --confirm/--yes are unrecognized flags.
    for flag in ["--confirm", "--yes"] {
        let err = parse_args_from(["prowlarr", "delete", "--path", "/api/v1/indexer/9", flag])
            .unwrap_err();
        assert!(err.to_string().contains("does not accept"), "got: {err}");
    }
}

#[test]
fn unknown_command_for_service_errors() {
    let err = parse_args_from(["sonarr", "sessions"]).unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("unknown command"));
    assert!(msg.contains("sonarr"));
}

#[test]
fn help_subcommand() {
    let cmd = parse_args_from(["help"]).unwrap().unwrap();
    assert_eq!(cmd, Command::Help);
}

#[test]
fn parses_cli_only_plex_discovery_without_an_mcp_action() {
    let command = parse_args_from([
        "discover",
        "plex",
        "--token-env",
        "PLEX_DISCOVERY_TOKEN",
        "--fleet-file",
        "fleet.yaml",
        "--secret-file",
        "plex.env",
        "--include-shared",
        "--diff",
    ])
    .unwrap()
    .unwrap();
    assert_eq!(
        command,
        Command::DiscoverPlex {
            token_env: "PLEX_DISCOVERY_TOKEN".into(),
            fleet_file: "fleet.yaml".into(),
            secret_file: "plex.env".into(),
            include_shared: true,
            diff: true,
        }
    );
    assert!(
        !crate::all_action_names()
            .iter()
            .any(|action| action.contains("discover"))
    );
}

#[test]
fn doctor_and_setup_subcommands() {
    assert_eq!(
        parse_args_from(["doctor", "--json"]).unwrap().unwrap(),
        Command::Doctor { json: true }
    );
    assert_eq!(
        parse_args_from(["setup", "plugin-hook", "--no-repair"])
            .unwrap()
            .unwrap(),
        Command::Setup(SetupCommand::PluginHook { no_repair: true })
    );
}

#[test]
fn usage_lists_grammar_and_services() {
    let text = usage();
    for expected in [
        "yarr help",
        "yarr <service> status",
        "yarr <service> get --path PATH",
        "yarr doctor",
        "sonarr",
        "Services:",
    ] {
        assert!(text.contains(expected), "usage missing {expected}");
    }
}
