use super::*;

fn payload() -> Vec<PlexResource> {
    parse_resources(
        br#"[
          {"name":"Den","clientIdentifier":"aaa","owned":true,"provides":"server",
           "accessToken":"tok-a","connections":[
             {"uri":"https://relay.plex.direct/a","local":false,"relay":true,"protocol":"https"},
             {"uri":"https://direct.example:32400","local":false,"relay":false,"protocol":"https"},
             {"uri":"http://10.0.0.11:32400","local":true,"relay":false,"protocol":"http"}]},
          {"name":"Shared","clientIdentifier":"bbb","owned":false,"provides":"server,player",
           "accessToken":"tok-b","connections":[{"uri":"https://relay.plex.direct/b","relay":true,"protocol":"https"}]},
          {"name":"TV","clientIdentifier":"ccc","owned":true,"provides":"player",
           "accessToken":"tok-c","connections":[]}
        ]"#,
    )
    .unwrap()
}

#[test]
fn filters_non_servers_and_shared_by_default_and_prefers_local() {
    let found = discover_resources(payload(), true).unwrap();
    assert_eq!(found.len(), 1);
    assert_eq!(found[0].name, "plex_den");
    assert_eq!(found[0].url, "http://10.0.0.11:32400");
    assert_eq!(found[0].token_env, "PLEX_DEN_TOKEN");
    assert!(!found[0].relay_only);
}

#[test]
fn shared_opt_in_and_relay_only_are_explicit() {
    let found = discover_resources(payload(), false).unwrap();
    let shared = found
        .iter()
        .find(|item| item.server_name == "Shared")
        .unwrap();
    assert_eq!(shared.url, "https://relay.plex.direct/b");
    assert!(shared.relay_only);
}

#[test]
fn colliding_slugs_receive_stable_identifier_hashes() {
    let resources = parse_resources(
        br#"[
          {"name":"4K Room","clientIdentifier":"identifier-a","owned":true,"provides":"server","accessToken":"a","connections":[{"uri":"http://a","local":true}]},
          {"name":"4k-room","clientIdentifier":"identifier-b","owned":true,"provides":"server","accessToken":"b","connections":[{"uri":"http://b","local":true}]}
        ]"#,
    ).unwrap();
    let first = discover_resources(resources.clone(), true).unwrap();
    let second = discover_resources(resources.into_iter().rev().collect(), true).unwrap();
    assert_eq!(first, second);
    assert!(
        first
            .iter()
            .all(|item| item.name.starts_with("plex_4k_room_"))
    );
    assert_ne!(first[0].name, first[1].name);
}

#[test]
fn pairs_tautulli_by_machine_identifier_and_reports_both_sides() {
    let plex = discover_resources(payload(), false).unwrap();
    let tautulli = vec![
        TautulliIdentity {
            name: "tautulli_den".into(),
            url: "http://t1".into(),
            pms_identifier: Some("aaa".into()),
        },
        TautulliIdentity {
            name: "tautulli_orphan".into(),
            url: "http://t2".into(),
            pms_identifier: Some("missing".into()),
        },
    ];
    let report = pair_tautulli(&plex, &tautulli).unwrap();
    assert_eq!(
        report.paired,
        vec![FleetPairing {
            tautulli: "tautulli_den".into(),
            plex: "plex_den".into()
        }]
    );
    assert_eq!(report.unpaired_plex, vec!["plex_shared"]);
    assert_eq!(report.unpaired_tautulli, vec!["tautulli_orphan"]);
}

#[test]
fn drift_is_pinned_by_identifier_not_name() {
    let previous = vec![item("plex_old", "Old", "aaa", "http://old")];
    let current = vec![
        item("plex_new", "New", "aaa", "http://new"),
        item("plex_added", "Added", "bbb", "http://added"),
    ];
    let report = diff_fleet(&current, &previous);
    assert_eq!(report.added, vec!["plex_added"]);
    assert!(report.removed.is_empty());
    assert_eq!(report.renamed, vec!["plex_old -> plex_new"]);
    assert_eq!(
        report.url_changed,
        vec!["plex_new: http://old -> http://new"]
    );
}

fn item(name: &str, server_name: &str, id: &str, url: &str) -> DiscoveredPlex {
    DiscoveredPlex {
        name: name.into(),
        server_name: server_name.into(),
        client_identifier: id.into(),
        url: url.into(),
        token_env: format!("{}_TOKEN", name.to_ascii_uppercase()),
        access_token: "token".into(),
        relay_only: false,
    }
}

#[test]
fn writes_secret_free_yaml_and_private_env_file() {
    let directory = tempfile::tempdir().unwrap();
    let fleet_path = directory.path().join("fleet.yaml");
    let env_path = directory.path().join("fleet.env");
    let plex = discover_resources(payload(), true).unwrap();
    let pairing = PairingReport::default();

    write_discovery_files(&fleet_path, &env_path, &plex, &[], &pairing).unwrap();

    let fleet = std::fs::read_to_string(&fleet_path).unwrap();
    let env = std::fs::read_to_string(&env_path).unwrap();
    assert!(fleet.contains("token_env: PLEX_DEN_TOKEN"));
    assert!(fleet.contains("client_identifier: aaa"));
    assert!(!fleet.contains("tok-a"));
    assert!(env.contains("PLEX_DEN_TOKEN=tok-a"));
    assert_eq!(
        diff_fleet(&plex, &read_discovered_fleet(&fleet_path).unwrap()),
        DriftReport::default()
    );

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            std::fs::metadata(env_path).unwrap().permissions().mode() & 0o777,
            0o600
        );
    }
}
