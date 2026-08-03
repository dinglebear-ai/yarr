use super::*;

#[test]
fn yaml_resolves_credential_environment_indirection() {
    let mut env = crate::testing::TestEnv::new();
    env.set("PLEX_DEN_TOKEN", "secret-token");
    let yaml = r#"
services:
  - name: plex_den
    kind: plex
    url: http://10.0.0.11:32400
    token_env: PLEX_DEN_TOKEN
    client_identifier: machine-den
"#;

    let services =
        fleet_file::parse_and_resolve(yaml, FleetFormat::Yaml, std::path::Path::new("fleet.yaml"))
            .unwrap();

    assert_eq!(services.len(), 1);
    assert_eq!(services[0].name, "plex_den");
    assert_eq!(services[0].token.as_deref(), Some("secret-token"));
    assert_eq!(
        services[0].client_identifier.as_deref(),
        Some("machine-den")
    );
}

#[test]
fn toml_fleet_file_parses_the_same_contract() {
    let mut env = crate::testing::TestEnv::new();
    env.set("TAUTULLI_DEN_KEY", "secret-key");
    let toml = r#"
[[services]]
name = "tautulli_den"
kind = "tautulli"
url = "http://10.0.0.11:8181"
api_key_env = "TAUTULLI_DEN_KEY"
plex = "plex_den"
"#;

    let services =
        fleet_file::parse_and_resolve(toml, FleetFormat::Toml, std::path::Path::new("fleet.toml"))
            .unwrap();

    assert_eq!(services[0].api_key.as_deref(), Some("secret-key"));
    assert_eq!(services[0].plex.as_deref(), Some("plex_den"));
}

#[test]
fn inline_secret_is_rejected_with_name_source_and_line() {
    let yaml = "services:\n  - name: plex_den\n    kind: plex\n    url: http://plex:32400\n    token: do-not-allow\n";
    let error = fleet_file::parse_and_resolve(
        yaml,
        FleetFormat::Yaml,
        std::path::Path::new("/config/fleet.yaml"),
    )
    .unwrap_err();
    let message = error.to_string();

    assert!(message.contains("/config/fleet.yaml:2"), "{message}");
    assert!(message.contains("plex_den"), "{message}");
    assert!(message.contains("token"), "{message}");
    assert!(message.contains("token_env"), "{message}");
}

#[test]
fn environment_source_overrides_same_name_and_preserves_union() {
    let file = vec![
        ServiceConfig {
            name: "plex_den".into(),
            kind: ServiceKind::Plex,
            base_url: "http://file:32400".into(),
            ..ServiceConfig::default()
        },
        ServiceConfig {
            name: "plex_4k".into(),
            kind: ServiceKind::Plex,
            base_url: "http://4k:32400".into(),
            ..ServiceConfig::default()
        },
    ];
    let environment = vec![ServiceConfig {
        name: "plex_den".into(),
        kind: ServiceKind::Plex,
        base_url: "http://environment:32400".into(),
        ..ServiceConfig::default()
    }];

    let merged = merge_service_sources(file, environment).unwrap();
    assert_eq!(merged.len(), 2);
    assert_eq!(merged[0].name, "plex_4k");
    assert_eq!(merged[1].name, "plex_den");
    assert_eq!(merged[1].base_url, "http://environment:32400");
}

#[test]
fn twenty_four_instance_yaml_loads_in_stable_name_order() {
    let mut yaml = String::from("services:\n");
    for index in (0..24).rev() {
        yaml.push_str(&format!(
            "  - name: plex_{index:02}\n    kind: plex\n    url: http://10.0.0.{index}:32400\n"
        ));
    }

    let services =
        fleet_file::parse_and_resolve(&yaml, FleetFormat::Yaml, std::path::Path::new("fleet.yaml"))
            .unwrap();

    assert_eq!(services.len(), 24);
    assert_eq!(services.first().unwrap().name, "plex_00");
    assert_eq!(services.last().unwrap().name, "plex_23");
}
