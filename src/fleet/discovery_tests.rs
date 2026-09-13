use super::*;
use crate::{Config, testing::TestEnv};
use std::{fs, io::Write};

const FIXTURE: &str = include_str!("fixtures/plex_resources_redacted.json");

#[test]
fn parser_ignores_non_servers_and_defaults_to_owned_resources() {
    let resources = parse_plex_resources(FIXTURE).expect("redacted fixture parses");
    let discovered = build_report(&resources, false).expect("owned resources select connections");
    assert_eq!(discovered.resources.len(), 2);
    assert!(
        discovered
            .resources
            .iter()
            .all(|item| item.name != "Web Client")
    );
    assert!(
        discovered
            .resources
            .iter()
            .all(|item| item.name != "Shared Server")
    );
}

#[test]
fn parser_rejects_missing_observed_resources_shape() {
    let error = parse_plex_resources(r#"{"MediaContainer":{"Device":{}}}"#)
        .expect_err("Device must be the observed resource array");
    assert!(error.to_string().contains("MediaContainer.Device"));
}

#[test]
fn include_shared_retains_shared_servers() {
    let resources = parse_plex_resources(FIXTURE).unwrap();
    let discovered = build_report(&resources, true).unwrap();
    assert!(
        discovered
            .resources
            .iter()
            .any(|item| item.name == "plex_shared_server")
    );
}

#[test]
fn connection_priority_is_local_then_direct_https_then_relay() {
    let resources = parse_plex_resources(FIXTURE).unwrap();
    let first = resources
        .iter()
        .find(|resource| resource.client_identifier == "server-one")
        .unwrap();
    let chosen = select_connection(first).expect("a connection is available");
    assert_eq!(chosen.url, "http://192.0.2.10:32400");
    assert!(!chosen.relay_only);

    let relay = resources
        .iter()
        .find(|resource| resource.client_identifier == "relay-server")
        .unwrap();
    assert!(select_connection(relay).unwrap().relay_only);

    let mut unsafe_local = PlexResource::for_test("Unsafe", "unsafe-local");
    unsafe_local.connections = vec![
        PlexConnection {
            uri: "https://user:password@unsafe.invalid".into(),
            local: true,
            relay: false,
            protocol: "https".into(),
        },
        PlexConnection {
            uri: "https://direct.invalid".into(),
            local: false,
            relay: false,
            protocol: "https".into(),
        },
    ];
    assert_eq!(
        select_connection(&unsafe_local).unwrap().url,
        "https://direct.invalid"
    );
}

#[test]
fn configured_names_are_stable_and_collision_safe() {
    let resources = vec![
        PlexResource::for_test("Same Name", "client-a"),
        PlexResource::for_test("Same Name", "client-b"),
    ];
    let names = configured_names(&resources);
    assert_eq!(names.len(), 2);
    assert!(names.iter().all(|name| name.starts_with("plex_same_name")));
    assert_ne!(names[0], names[1]);
    assert_eq!(names, configured_names(&resources));
    assert!(names.iter().all(|name| {
        name.chars()
            .all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '_')
    }));
}

#[test]
fn public_and_secret_outputs_are_separate_and_secret_is_owner_only() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.yaml");
    let secret = temp.path().join("plex.env");
    let report = build_report(&parse_plex_resources(FIXTURE).unwrap(), false).unwrap();
    write_discovery_outputs(&fleet, &secret, &report).unwrap();
    let public = fs::read_to_string(&fleet).unwrap();
    let private = fs::read_to_string(&secret).unwrap();
    assert!(public.contains("token_env:"));
    assert!(!public.contains("<redacted>"));
    assert!(!public.contains("accessToken"));
    assert!(private.contains("=\"<redacted>\""));
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            fs::metadata(&secret).unwrap().permissions().mode() & 0o777,
            0o600
        );
    }
}

#[test]
fn toml_public_output_loads_through_runtime_fleet_config() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.toml");
    let secret = temp.path().join("plex.env");
    let report = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_library".into(),
            client_identifier: "stable-server-id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_LIBRARY_TOKEN".into(),
            relay_only: false,
            access_token: "discovery-secret".into(),
        }],
        drift: Vec::new(),
    };
    write_discovery_outputs(&fleet, &secret, &report)
        .expect("discovery writes its exact TOML public output");
    fs::write(
        temp.path().join(".env"),
        "YARR_PLEX_LIBRARY_TOKEN=discovery-secret\n",
    )
    .unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_HOME", temp.path());
    env.set("HOME", temp.path());
    env.set("YARR_FLEET_FILE", &fleet);
    env.remove("YARR_SERVICES");
    env.remove("YARR_PLEX_LIBRARY_TOKEN");

    let loaded = Config::load().expect("exact discovery TOML must load");

    assert!(
        fs::read_to_string(&fleet)
            .unwrap()
            .starts_with("[[services]]")
    );
    assert_eq!(loaded.yarr.services.len(), 1);
    assert_eq!(loaded.yarr.services[0].name, "plex_library");
    assert_eq!(loaded.yarr.services[0].kind, crate::ServiceKind::Plex);
    assert_eq!(
        loaded.yarr.services[0].token.as_deref(),
        Some("discovery-secret")
    );
}

#[test]
fn existing_toml_fleet_ignores_non_plex_services_for_drift_detection() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.toml");
    fs::write(
        &fleet,
        "[[services]]\nname = \"library\"\nkind = \"sonarr\"\nbase_url = \"https://sonarr.invalid\"\n\n[[services]]\nname = \"plex_library\"\nkind = \"plex\"\nclient_identifier = \"stable-server-id\"\nbase_url = \"https://server.invalid\"\ntoken_env = \"YARR_PLEX_LIBRARY_TOKEN\"\nrelay_only = false\n",
    )
    .unwrap();

    let reloaded = read_existing_report(&fleet)
        .expect("non-Plex fleet services must not affect discovery drift reads");

    assert_eq!(reloaded.resources.len(), 1);
    assert_eq!(reloaded.resources[0].name, "plex_library");
}

#[test]
fn toml_public_output_round_trips_for_drift_detection() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.toml");
    let secret = temp.path().join("plex.env");
    let report = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_library".into(),
            client_identifier: "stable-server-id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_LIBRARY_TOKEN".into(),
            relay_only: true,
            access_token: "discovery-secret".into(),
        }],
        drift: Vec::new(),
    };
    write_discovery_outputs(&fleet, &secret, &report).unwrap();

    let reloaded = read_existing_report(&fleet)
        .expect("discovery must read its exact TOML output for later --diff runs");

    assert_eq!(reloaded.resources.len(), 1);
    assert_eq!(reloaded.resources[0].client_identifier, "stable-server-id");
    assert!(reloaded.resources[0].relay_only);
}

#[test]
fn unsupported_fleet_extensions_fail_before_either_output_is_written() {
    let temp = tempfile::tempdir().unwrap();
    let report = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_library".into(),
            client_identifier: "stable-server-id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_LIBRARY_TOKEN".into(),
            relay_only: false,
            access_token: "discovery-secret".into(),
        }],
        drift: Vec::new(),
    };

    for fleet_name in ["fleet.txt", "fleet"] {
        let fleet = temp.path().join(fleet_name);
        let secret = temp.path().join(format!("{fleet_name}.env"));
        fs::write(&fleet, "sentinel-public").unwrap();
        fs::write(&secret, "sentinel-secret").unwrap();

        let error = write_discovery_outputs(&fleet, &secret, &report)
            .expect_err("unsupported fleet extension must be rejected");

        assert!(error.to_string().contains(".yaml, .yml, or .toml"));
        assert_eq!(fs::read_to_string(&fleet).unwrap(), "sentinel-public");
        assert_eq!(fs::read_to_string(&secret).unwrap(), "sentinel-secret");
    }
}

#[test]
fn secret_output_ignores_precreated_predictable_temp_symlink() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.yaml");
    let secret = temp.path().join("plex.env");
    let victim = temp.path().join("victim");
    fs::write(&victim, "untouched").unwrap();
    let predictable = temp
        .path()
        .join(format!(".plex.env.{}.tmp", std::process::id()));
    #[cfg(unix)]
    std::os::unix::fs::symlink(&victim, &predictable).unwrap();

    let report = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_one".into(),
            client_identifier: "id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_ONE_TOKEN".into(),
            relay_only: false,
            access_token: "secret".into(),
        }],
        drift: Vec::new(),
    };
    write_discovery_outputs(&fleet, &secret, &report).unwrap();

    assert_eq!(fs::read_to_string(&victim).unwrap(), "untouched");
    assert_eq!(
        fs::read_to_string(&secret).unwrap(),
        "YARR_PLEX_ONE_TOKEN=secret\n"
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            fs::metadata(&secret).unwrap().permissions().mode() & 0o777,
            0o600
        );
    }
}

#[test]
fn secret_output_replaces_a_permissive_destination_with_owner_only_mode() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.yaml");
    let secret = temp.path().join("plex.env");
    fs::write(&secret, "YARR_OLD_TOKEN=old\n").unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&secret, fs::Permissions::from_mode(0o644)).unwrap();
    }
    let report = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_one".into(),
            client_identifier: "id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_ONE_TOKEN".into(),
            relay_only: false,
            access_token: "secret".into(),
        }],
        drift: Vec::new(),
    };

    write_discovery_outputs(&fleet, &secret, &report).unwrap();

    assert_eq!(
        fs::read_to_string(&secret).unwrap(),
        "YARR_PLEX_ONE_TOKEN=secret\n"
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            fs::metadata(&secret).unwrap().permissions().mode() & 0o777,
            0o600
        );
    }
}

#[test]
fn secret_output_rejects_injection_before_writes_and_preserves_quoted_tokens() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.yaml");
    let secret = temp.path().join(".env");
    fs::write(&fleet, "sentinel-public").unwrap();
    fs::write(&secret, "sentinel-secret").unwrap();
    let malicious = "valid-token\nYARR_INJECTED=unexpected";
    let report = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_one".into(),
            client_identifier: "id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_ONE_TOKEN".into(),
            relay_only: false,
            access_token: malicious.into(),
        }],
        drift: Vec::new(),
    };

    let error = write_discovery_outputs(&fleet, &secret, &report)
        .expect_err("newline token must be rejected before either output changes");
    assert!(!error.to_string().contains(malicious));
    assert_eq!(fs::read_to_string(&fleet).unwrap(), "sentinel-public");
    assert_eq!(fs::read_to_string(&secret).unwrap(), "sentinel-secret");

    let special = " leading # \"quoted\" \\ trailing ";
    let mut valid = report;
    valid.resources[0].access_token = special.into();
    write_discovery_outputs(&fleet, &secret, &valid).unwrap();
    assert_eq!(
        fs::read_to_string(&secret).unwrap(),
        "YARR_PLEX_ONE_TOKEN=\" leading # \\\"quoted\\\" \\\\ trailing \"\n"
    );

    fs::OpenOptions::new()
        .append(true)
        .open(&secret)
        .unwrap()
        .write_all(
            b"YARR_SERVICES=plex_one\nYARR_PLEX_ONE_URL=https://plex.invalid\nYARR_PLEX_ONE_KIND=plex\n",
        )
        .unwrap();
    let mut env = TestEnv::new();
    env.set("YARR_HOME", temp.path());
    for key in [
        "YARR_SERVICES",
        "YARR_PLEX_ONE_URL",
        "YARR_PLEX_ONE_KIND",
        "YARR_PLEX_ONE_TOKEN",
    ] {
        env.remove(key);
    }
    let config = Config::load().expect("documented dotenv overlay parses quoted token");
    assert_eq!(config.yarr.services[0].token.as_deref(), Some(special));
}

#[test]
fn persisted_output_preserves_identity_and_relay_state_for_drift_detection() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.yaml");
    let secret = temp.path().join("plex.env");
    let persisted = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_old_name".into(),
            client_identifier: "stable-server-id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_OLD_NAME_TOKEN".into(),
            relay_only: false,
            access_token: "never-in-public-output".into(),
        }],
        drift: Vec::new(),
    };
    write_discovery_outputs(&fleet, &secret, &persisted).unwrap();

    let previous = read_existing_report(&fleet).unwrap();
    let current = PlexDiscoveryReport {
        resources: vec![DiscoveredPlex {
            name: "plex_new_name".into(),
            client_identifier: "stable-server-id".into(),
            base_url: "https://server.invalid".into(),
            token_env: "YARR_PLEX_NEW_NAME_TOKEN".into(),
            relay_only: true,
            access_token: String::new(),
        }],
        drift: Vec::new(),
    };
    let drift = classify_drift(&previous, &current);

    assert!(drift.iter().any(|change| matches!(
        change,
        Drift::Renamed { client_identifier, from, to }
            if client_identifier == "stable-server-id"
                && from == "plex_old_name"
                && to == "plex_new_name"
    )));
    assert!(drift.iter().any(|change| matches!(
        change,
        Drift::RelayStateChanged { name, from: false, to: true }
            if name == "plex_new_name"
    )));
    assert!(
        !drift
            .iter()
            .any(|change| matches!(change, Drift::Added { .. } | Drift::Removed { .. }))
    );

    let public = fs::read_to_string(&fleet).unwrap();
    assert!(public.contains("client_identifier: stable-server-id"));
    assert!(public.contains("relay_only: false"));
    assert!(!public.contains("never-in-public-output"));
}

#[test]
fn diff_reports_typed_drift_without_writing_files() {
    let temp = tempfile::tempdir().unwrap();
    let fleet = temp.path().join("fleet.yaml");
    let secret = temp.path().join("plex.env");
    fs::write(&fleet, "sentinel-public").unwrap();
    fs::write(&secret, "sentinel-secret").unwrap();
    let new = build_report(&parse_plex_resources(FIXTURE).unwrap(), false).unwrap();
    let mut old = PlexDiscoveryReport::empty();
    let mut prior_relay = new
        .resources
        .iter()
        .find(|item| item.relay_only)
        .expect("fixture includes a relay-only server")
        .clone();
    prior_relay.relay_only = false;
    old.resources.push(prior_relay);
    let drift = classify_drift(&old, &new);
    assert!(
        drift
            .iter()
            .any(|change| matches!(change, Drift::Added { .. }))
    );
    assert!(
        drift
            .iter()
            .any(|change| matches!(change, Drift::RelayStateChanged { .. }))
    );
    let options = PlexDiscoveryOptions::for_test(fleet.clone(), secret.clone(), true);
    write_or_diff(&options, &old, &new).unwrap();
    assert_eq!(fs::read_to_string(&fleet).unwrap(), "sentinel-public");
    assert_eq!(fs::read_to_string(&secret).unwrap(), "sentinel-secret");
}

#[test]
fn injected_client_receives_only_the_env_value_and_report_never_returns_it() {
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_TEST_PLEX_TOKEN", "<redacted>");
    let options = PlexDiscoveryOptions::for_test("unused.yaml".into(), "unused.env".into(), true);
    let report = discover_plex_with_client(options, &FixtureClient { body: FIXTURE }).unwrap();
    assert!(
        report
            .drift
            .iter()
            .any(|change| matches!(change, Drift::Added { .. }))
    );
    let rendered = serde_json::to_string(&report).unwrap();
    assert!(!rendered.contains("<redacted>"));
}

struct FixtureClient {
    body: &'static str,
}
impl PlexDiscoveryClient for FixtureClient {
    fn fetch_resources(&self, _token: &str) -> anyhow::Result<String> {
        Ok(self.body.to_owned())
    }
}
