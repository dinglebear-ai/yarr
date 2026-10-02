//! Strict discovery-model tests: parsing, selection, naming, drift, export.

use super::*;

fn resources_fixture() -> &'static str {
    r#"{
      "MediaContainer": {
        "Device": [
          {
            "name": "Den Plex",
            "clientIdentifier": "den-123",
            "owned": true,
            "provides": "server,player",
            "accessToken": "token-den",
            "connections": [
              {"uri": "http://192.168.1.10:32400", "local": true, "relay": false, "protocol": "http"},
              {"uri": "https://den.example.com:32400", "local": false, "relay": false, "protocol": "https"},
              {"uri": "https://den-relay.plex.direct:443", "local": false, "relay": true, "protocol": "https"}
            ]
          },
          {
            "name": "Shared Plex",
            "clientIdentifier": "shared-999",
            "owned": false,
            "provides": "server",
            "accessToken": "token-shared",
            "connections": [
              {"uri": "https://shared.example.com:32400", "local": false, "relay": false, "protocol": "https"}
            ]
          },
          {
            "name": "A Player",
            "clientIdentifier": "player-1",
            "owned": true,
            "provides": "player",
            "accessToken": "token-player",
            "connections": []
          }
        ]
      }
    }"#
}

#[test]
fn parses_servers_and_skips_non_server_devices() {
    let resources = parse_plex_resources(resources_fixture()).unwrap();
    assert_eq!(resources.len(), 2, "player-only devices are skipped");
    assert_eq!(resources[0].name, "Den Plex");
    assert!(resources[0].owned);
    // The token survives parsing but never serializes.
    assert_eq!(resources[0].access_token, "token-den");
}

#[test]
fn malformed_responses_fail_with_field_context() {
    let cases = [
        ("not json at all", "not JSON"),
        (r#"{"MediaContainer":{}}"#, "Device array"),
        (
            r#"{"MediaContainer":{"Device":[{"name":"x","clientIdentifier":"y","owned":true,"provides":"server","connections":[]}]}}"#,
            "missing accessToken",
        ),
        (
            r#"{"MediaContainer":{"Device":[{"name":"x","clientIdentifier":"y","owned":true,"provides":"server","accessToken":"t"}]}}"#,
            "missing connections array",
        ),
        (
            r#"{"MediaContainer":{"Device":[{"name":"x","owned":true,"provides":"server","accessToken":"t","connections":[]}]}}"#,
            "missing clientIdentifier",
        ),
    ];
    for (body, fragment) in cases {
        let error = parse_plex_resources(body).expect_err("malformed response must fail");
        assert!(
            error.to_string().contains(fragment),
            "expected {fragment:?} in {error:#}"
        );
    }
}

#[test]
fn connection_selection_prefers_local_then_direct_https_then_relay() {
    let resource = PlexResource {
        name: "n".into(),
        client_identifier: "c".into(),
        owned: true,
        access_token: "t".into(),
        connections: vec![
            PlexConnection {
                uri: "https://den-relay.plex.direct:443".into(),
                local: false,
                relay: true,
                protocol: "https".into(),
            },
            PlexConnection {
                uri: "https://den.example.com:32400".into(),
                local: false,
                relay: false,
                protocol: "https".into(),
            },
            PlexConnection {
                uri: "http://192.168.1.10:32400".into(),
                local: true,
                relay: false,
                protocol: "http".into(),
            },
        ],
    };
    let selected = select_connection(&resource).unwrap();
    assert_eq!(selected.url, "http://192.168.1.10:32400", "local first");
    assert!(!selected.relay_only);

    // Without a local connection, direct HTTPS wins over relay.
    let mut no_local = resource.clone();
    no_local.connections.retain(|connection| !connection.local);
    let selected = select_connection(&no_local).unwrap();
    assert_eq!(selected.url, "https://den.example.com:32400");
    assert!(!selected.relay_only);

    // Relay is the last resort.
    let mut relay_only = no_local;
    relay_only.connections.retain(|connection| connection.relay);
    let selected = select_connection(&relay_only).unwrap();
    assert!(selected.relay_only);
}

#[test]
fn connection_selection_rejects_credential_uris() {
    let resource = PlexResource {
        name: "n".into(),
        client_identifier: "c".into(),
        owned: true,
        access_token: "t".into(),
        connections: vec![PlexConnection {
            uri: "https://user:pass@den.example.com:32400".into(),
            local: true,
            relay: false,
            protocol: "https".into(),
        }],
    };
    assert!(select_connection(&resource).is_none());
}

#[test]
fn naming_is_stable_and_collision_safe() {
    let resources = parse_plex_resources(resources_fixture()).unwrap();
    let report = build_report(&resources, false).unwrap();
    assert_eq!(report.resources.len(), 1, "owned only");
    assert_eq!(report.resources[0].name, "plex_den_plex");
    assert_eq!(report.resources[0].token_env, "YARR_PLEX_DEN_PLEX_TOKEN");
    assert_eq!(report.resources[0].base_url, "http://192.168.1.10:32400");

    let shared = build_report(&resources, true).unwrap();
    let names: Vec<&str> = shared
        .resources
        .iter()
        .map(|item| item.name.as_str())
        .collect();
    assert_eq!(names, vec!["plex_den_plex", "plex_shared_plex"], "sorted");

    // Duplicate display names get a stable hash suffix.
    let duplicated = vec![
        resources[0].clone(),
        PlexResource {
            name: "Den Plex".into(),
            client_identifier: "den-456".into(),
            ..resources[0].clone()
        },
    ];
    let report = build_report(&duplicated, false).unwrap();
    let names: Vec<&str> = report
        .resources
        .iter()
        .map(|item| item.name.as_str())
        .collect();
    assert_eq!(names.len(), 2);
    assert_ne!(names[0], names[1]);
    assert!(names.iter().all(|name| name.starts_with("plex_den_plex_")));

    // An empty slug falls back to `server`.
    let mut unnamed = resources[0].clone();
    unnamed.name = "!!!".into();
    let report = build_report(&[unnamed], false).unwrap();
    assert_eq!(report.resources[0].name, "plex_server");
}

#[test]
fn drift_against_configured_classifies_every_change_kind() {
    let report = build_report(&parse_plex_resources(resources_fixture()).unwrap(), true).unwrap();
    let configured = vec![
        KnownPlex {
            name: "plex_den_plex".into(),
            base_url: "http://old.example:32400".into(),
        },
        KnownPlex {
            name: "plex_gone".into(),
            base_url: "http://gone.example:32400".into(),
        },
    ];
    let drift = classify_drift_against_configured(&configured, &report);
    assert!(drift.contains(&Drift::UrlChanged {
        name: "plex_den_plex".into(),
        from: "http://old.example:32400".into(),
        to: "http://192.168.1.10:32400".into(),
    }));
    assert!(drift.contains(&Drift::Removed {
        name: "plex_gone".into()
    }));
    assert!(drift.contains(&Drift::Added {
        name: "plex_shared_plex".into()
    }));
}

#[test]
fn export_renders_assignments_and_never_serializes_tokens() {
    let report = build_report(&parse_plex_resources(resources_fixture()).unwrap(), false).unwrap();
    let export = render_export(&report).unwrap();
    assert!(export.starts_with(EXPORT_MARKER));
    assert!(export.contains("YARR_PLEX_DEN_PLEX_URL=http://192.168.1.10:32400"));
    assert!(export.contains("YARR_PLEX_DEN_PLEX_KIND=plex"));
    assert!(export.contains("YARR_PLEX_DEN_PLEX_TOKEN=token-den"));
    assert!(export.contains("client identifier: den-123"));

    // Structured output and Debug must never carry the token.
    let json = serde_json::to_string(&report.resources[0]).unwrap();
    assert!(
        !json.contains("token-den"),
        "serialized report leaks: {json}"
    );
    let debug = format!("{:?}", report.resources[0]);
    assert!(!debug.contains("token-den"), "Debug leaks: {debug}");
    let raw = parse_plex_resources(resources_fixture()).unwrap();
    let raw_debug = format!("{:?}", raw[0]);
    assert!(
        !raw_debug.contains("token-den"),
        "raw resource Debug leaks: {raw_debug}"
    );
}

#[test]
fn token_env_names_are_strictly_validated() {
    for valid in ["YARR_PLEX_TOKEN", "_X", "a1"] {
        validate_token_env_name(valid).unwrap();
    }
    for invalid in ["", "1X", "A-B", "A B", "A;rm", "A$B"] {
        let error = validate_token_env_name(invalid).expect_err("invalid name must fail");
        assert!(error.to_string().contains("invalid token_env"), "{error:#}");
    }
}

#[test]
fn dotenv_values_are_escaped_or_rejected() {
    assert_eq!(dotenv_value("simple-Value_1").unwrap(), "simple-Value_1");
    assert_eq!(dotenv_value("with space").unwrap(), "\"with space\"");
    assert_eq!(
        dotenv_value("quote\"inside").unwrap(),
        "\"quote\\\"inside\""
    );
    assert!(dotenv_value("line\nbreak").is_err());
    assert!(dotenv_value("nul\0byte").is_err());
}
