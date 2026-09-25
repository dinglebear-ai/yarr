use super::{
    Command, LifecycleAction, Options, STACK, container_names, help_text, lifecycle_command,
    seed_plan,
};

fn args(values: &[&str]) -> Vec<String> {
    values.iter().map(|value| (*value).to_owned()).collect()
}

#[test]
fn manifest_pins_every_service_kind_and_container_identity() {
    let expected = [
        "sonarr",
        "radarr",
        "prowlarr",
        "tautulli",
        "overseerr",
        "bazarr",
        "tracearr",
        "sabnzbd",
        "qbittorrent",
        "plex",
        "jellyfin",
    ];
    assert_eq!(container_names(), expected);
    assert_eq!(STACK.len(), expected.len());
    for (entry, expected) in STACK.iter().zip(expected) {
        assert_eq!(entry.service, expected);
        assert_eq!(entry.kind, expected);
        assert_eq!(entry.container, expected);
    }
}

#[test]
fn parser_covers_help_commands_and_scoped_options() {
    assert_eq!(Options::parse(&[]).unwrap().command, Command::Help);
    assert_eq!(
        Options::parse(&args(&["start"])).unwrap().command,
        Command::Start
    );
    assert_eq!(
        Options::parse(&args(&["stop"])).unwrap().command,
        Command::Stop
    );
    assert!(Options::parse(&args(&["status", "--json"])).unwrap().json);
    assert!(
        Options::parse(&args(&["seed", "--dry-run"]))
            .unwrap()
            .dry_run
    );
    assert!(Options::parse(&args(&["start", "--dry-run"])).is_err());
    assert!(Options::parse(&args(&["seed", "--json"])).is_err());
    assert!(Options::parse(&args(&["unknown"])).is_err());
    assert!(Options::parse(&args(&["help", "extra"])).is_err());
}

#[test]
fn lifecycle_commands_are_typed_idempotent_and_manifest_limited() {
    let start = lifecycle_command(LifecycleAction::Start);
    assert!(start.contains("docker start \"$container\""));
    assert!(start.contains("state\" != \"running"));
    assert!(start.contains(&container_names().join(" ")));
    assert_eq!(start.matches("docker inspect --format").count(), 1);
    assert!(
        start.find("missing container").unwrap()
            < start.find("docker start \"$container\"").unwrap()
    );

    let stop = lifecycle_command(LifecycleAction::Stop);
    assert!(stop.contains("docker stop \"$container\""));
    assert!(stop.contains("state\" != \"exited"));
}

#[test]
fn help_and_just_recipes_cover_the_public_command_surface() {
    let help = help_text();
    let justfile = include_str!("../../Justfile");
    for command in ["start", "stop", "status", "seed"] {
        assert!(help.contains(command));
        assert!(
            justfile.contains(&format!("cargo xtask shart {command}")),
            "missing Just recipe mapping for {command}"
        );
    }
}

#[test]
fn seed_plan_reports_restored_and_retained_services() {
    let plan = seed_plan();
    assert_eq!(plan.containers.len(), 11);
    assert!(
        plan.restored_datasets
            .iter()
            .any(|item| item.contains("sonarr@configured-v1"))
    );
    assert_eq!(plan.retained_services, ["bazarr", "tracearr"]);
}
