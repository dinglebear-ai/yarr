use super::*;
use crate::actions::all_action_names;

#[test]
fn rest_help_lists_actions_and_examples() {
    let help = rest_help();
    let actions = help.get("actions").and_then(|v| v.as_array()).unwrap();
    let names: Vec<&str> = actions.iter().filter_map(|v| v.as_str()).collect();
    assert!(names.contains(&"service_status"));
    assert!(names.contains(&"api_get"));
    assert!(names.contains(&"help"));
    assert!(help.get("examples").unwrap().get("api_delete").is_some());
}

#[test]
fn help_text_lists_every_action() {
    let text = help_text();
    for action in all_action_names() {
        assert!(
            text.contains(&format!("`{action}`")),
            "help missing action {action}"
        );
    }
}

#[test]
fn help_text_marks_route_dependent_api_actions() {
    let text = help_text();
    let line = text
        .lines()
        .find(|line| line.contains("`api_post`"))
        .expect("api_post line present");
    assert!(
        line.contains("reviewed generated operation"),
        "api_post must explain route-derived admission: {line}"
    );
    assert!(
        !line.contains("[requires yarr:write]"),
        "api_post must not advertise a verb-wide scope: {line}"
    );
}

#[test]
fn help_text_has_header_and_credentials_note() {
    let text = help_text();
    assert!(text.contains("# yarr MCP Tool"));
    assert!(text.contains("YARR_SERVICES"));
}

#[test]
fn help_text_shows_capability_digest_and_curated_commands() {
    // The help renders the capability digest line and lists each doc-based curated
    // command. (Spec-backed kinds are served by generated ops, not curated commands.)
    let text = help_text();
    assert!(
        text.contains("Capabilities: "),
        "help missing capability digest"
    );
    assert!(
        text.contains("download_client(") || text.contains("stats("),
        "digest should name a doc-based capability"
    );
    for cmd in [
        "download_queue",
        "download_add",
        "stats_activity",
        "stats_history",
        "stats_libraries",
    ] {
        assert!(
            text.contains(&format!("`{cmd}`")),
            "help missing curated `{cmd}`"
        );
    }
}

#[test]
fn help_text_write_commands_present() {
    let text = help_text();
    for cmd in [
        "download_add",
        "download_remove",
        "stats_refresh_libraries",
        "stats_delete_image_cache",
    ] {
        assert!(text.contains(&format!("`{cmd}`")), "help missing {cmd}");
    }
    let add = text.lines().find(|l| l.contains("`download_add`")).unwrap();
    assert!(
        add.contains("yarr:write"),
        "download_add must mark write scope: {add}"
    );
    let enum_names = crate::actions::all_action_names();
    for cmd in ["download_add", "download_remove"] {
        assert!(enum_names.contains(&cmd), "schema enum missing {cmd}");
    }
}
