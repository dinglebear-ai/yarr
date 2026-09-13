//! Fixture-driven tests for strict public fleet files and source merging.

use super::*;
use crate::Config;
use std::io::Write;

fn write_fixture(extension: &str, contents: &str) -> tempfile::NamedTempFile {
    let mut file = tempfile::Builder::new()
        .suffix(&format!(".{extension}"))
        .tempfile()
        .unwrap();
    file.write_all(contents.as_bytes()).unwrap();
    file
}

fn service(name: &str) -> ServiceConfig {
    ServiceConfig {
        name: name.to_owned(),
        kind: ServiceKind::Sonarr,
        base_url: "https://public.example.invalid".to_owned(),
        ..ServiceConfig::default()
    }
}

#[test]
fn loads_yaml_public_metadata_with_api_key_environment_reference() {
    let fixture = write_fixture(
        "yaml",
        "services:\n  - name: library\n    kind: sonarr\n    base_url: https://public.example.invalid\n    api_key_env: YARR_LIBRARY_API_KEY\n",
    );

    let services = load_fleet_file(fixture.path()).expect("public YAML fixture loads");

    assert_eq!(services.len(), 1);
    assert_eq!(services[0].name, "library");
    assert_eq!(services[0].kind, ServiceKind::Sonarr);
    assert_eq!(services[0].base_url, "https://public.example.invalid");
    assert_eq!(services[0].api_key.as_deref(), Some("YARR_LIBRARY_API_KEY"));
}

#[test]
fn loads_toml_public_metadata() {
    let fixture = write_fixture(
        "toml",
        "[[services]]\nname = \"archive\"\nkind = \"radarr\"\nbase_url = \"https://public.example.invalid\"\ntoken_env = \"YARR_ARCHIVE_TOKEN\"\n",
    );

    let services = load_fleet_file(fixture.path()).expect("public TOML fixture loads");

    assert_eq!(services[0].name, "archive");
    assert_eq!(services[0].kind, ServiceKind::Radarr);
    assert_eq!(services[0].token.as_deref(), Some("YARR_ARCHIVE_TOKEN"));
}

#[test]
fn environment_replaces_file_service_case_insensitively_and_sorts_union() {
    let mut file_library = service("Library");
    file_library.kind = ServiceKind::Radarr;
    let merged = merge_service_sources(
        vec![service("zeta"), file_library],
        vec![service("alpha"), service("library")],
    )
    .expect("sources merge");

    assert_eq!(
        merged
            .iter()
            .map(|service| service.name.as_str())
            .collect::<Vec<_>>(),
        ["alpha", "library", "zeta"]
    );
    assert_eq!(merged[1].kind, ServiceKind::Sonarr);
}

#[test]
fn duplicate_case_insensitive_names_in_one_source_are_rejected() {
    let error = merge_service_sources(vec![service("library"), service("Library")], vec![])
        .expect_err("duplicate file names must fail");

    assert!(error.to_string().contains("fleet file"));
    assert!(error.to_string().contains("library"));
}

#[test]
fn normalized_cross_source_namespace_collision_is_rejected() {
    let error = merge_service_sources(vec![service("home-media")], vec![service("home_media")])
        .expect_err("normalized namespace collision must fail");

    assert!(error.to_string().contains("namespace collision"));
    assert!(error.to_string().contains("home-media"));
    assert!(error.to_string().contains("home_media"));
}

#[test]
fn reserved_global_name_is_rejected() {
    let error =
        merge_service_sources(vec![service("api")], vec![]).expect_err("reserved global must fail");

    assert!(error.to_string().contains("reserved Code Mode global"));
    assert!(error.to_string().contains("api"));
}

#[test]
fn invalid_environment_reference_is_rejected_with_service_and_path() {
    let fixture = write_fixture(
        "yaml",
        "services:\n  - name: library\n    kind: sonarr\n    base_url: https://public.example.invalid\n    api_key_env: invalid-reference\n",
    );

    let error = load_fleet_file(fixture.path()).expect_err("invalid reference must fail");

    assert!(
        error
            .to_string()
            .contains(&fixture.path().display().to_string())
    );
    assert!(error.to_string().contains("library"));
    assert!(error.to_string().contains("api_key_env"));
}

#[test]
fn inline_token_is_rejected_without_echoing_a_value() {
    let fixture = write_fixture(
        "yaml",
        "services:\n  - name: library\n    kind: sonarr\n    base_url: https://public.example.invalid\n    token: prohibited\n",
    );

    let error = load_fleet_file(fixture.path()).expect_err("inline token must fail");

    assert!(
        error
            .to_string()
            .contains(&fixture.path().display().to_string())
    );
    assert!(error.to_string().contains("token"));
}

#[test]
fn config_loads_exact_public_plex_discovery_output() {
    let fixture = write_fixture(
        "yaml",
        "services:\n  - name: plex_library\n    kind: plex\n    client_identifier: stable-server-id\n    base_url: https://server.invalid\n    token_env: YARR_PLEX_LIBRARY_TOKEN\n    relay_only: false\n",
    );
    let home = tempfile::tempdir().unwrap();
    std::fs::write(
        home.path().join(".env"),
        "YARR_PLEX_LIBRARY_TOKEN=discovery-secret\n",
    )
    .unwrap();
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_HOME", home.path());
    env.set("HOME", home.path());
    env.set("YARR_FLEET_FILE", fixture.path());
    env.remove("YARR_SERVICES");
    env.remove("YARR_PLEX_LIBRARY_TOKEN");

    let loaded = Config::load().expect("exact discovery YAML must load");

    assert_eq!(loaded.yarr.services.len(), 1);
    assert_eq!(loaded.yarr.services[0].name, "plex_library");
    assert_eq!(loaded.yarr.services[0].kind, ServiceKind::Plex);
    assert_eq!(
        loaded.yarr.services[0].token.as_deref(),
        Some("discovery-secret")
    );
}

#[test]
fn config_loads_fleet_after_overlay_and_replaces_file_with_environment_service() {
    let fixture = write_fixture(
        "yaml",
        "services:\n  - name: Library\n    kind: radarr\n    base_url: https://public.example.invalid\n  - name: archive\n    kind: sonarr\n    base_url: https://public.example.invalid\n",
    );
    let home = tempfile::tempdir().unwrap();
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_HOME", home.path());
    env.set("HOME", home.path());
    env.set("YARR_FLEET_FILE", fixture.path());
    env.set("YARR_SERVICES", "library");
    env.set("YARR_LIBRARY_KIND", "sonarr");
    env.set("YARR_LIBRARY_URL", "https://public.example.invalid");

    let loaded = Config::load().expect("fleet file and environment service load");

    assert_eq!(
        loaded
            .yarr
            .services
            .iter()
            .map(|service| service.name.as_str())
            .collect::<Vec<_>>(),
        ["archive", "library"]
    );
    assert_eq!(loaded.yarr.services[1].kind, ServiceKind::Sonarr);
}

#[test]
fn config_load_preserves_toml_services_and_gives_environment_precedence_over_fleet() {
    let config = write_fixture(
        "toml",
        "[[yarr.services]]\nname = \"toml-only\"\nkind = \"sonarr\"\nbase_url = \"https://toml.example.invalid\"\n",
    );
    let fleet = write_fixture(
        "yaml",
        "services:\n  - name: Library\n    kind: radarr\n    base_url: https://fleet.example.invalid\n  - name: fleet-only\n    kind: sonarr\n    base_url: https://fleet.example.invalid\n",
    );
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_CONFIG", config.path());
    env.set("YARR_FLEET_FILE", fleet.path());
    env.set("YARR_SERVICES", "library");
    env.set("YARR_LIBRARY_KIND", "sonarr");
    env.set("YARR_LIBRARY_URL", "https://env.example.invalid");

    let loaded = Config::load().expect("TOML, fleet, and environment services load");

    assert_eq!(
        loaded
            .yarr
            .services
            .iter()
            .map(|service| service.name.as_str())
            .collect::<Vec<_>>(),
        ["fleet-only", "library", "toml-only"]
    );
    assert_eq!(loaded.yarr.services[1].kind, ServiceKind::Sonarr);
    assert_eq!(
        loaded.yarr.services[1].base_url,
        "https://env.example.invalid"
    );
}

#[test]
fn config_load_preserves_literal_toml_credentials_when_fleet_is_enabled() {
    let config = write_fixture(
        "toml",
        "[[yarr.services]]\nname = \"toml-only\"\nkind = \"sonarr\"\nbase_url = \"https://toml.example.invalid\"\napi_key = \"toml-literal-key\"\n",
    );
    let fleet = write_fixture(
        "yaml",
        "services:\n  - name: fleet-only\n    kind: radarr\n    base_url: https://fleet.example.invalid\n",
    );
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_CONFIG", config.path());
    env.set("YARR_FLEET_FILE", fleet.path());
    env.remove("YARR_SERVICES");
    env.remove("toml-literal-key");

    let loaded = Config::load().expect("literal TOML credentials remain usable with fleet enabled");

    let toml_service = loaded
        .yarr
        .services
        .iter()
        .find(|service| service.name == "toml-only")
        .expect("TOML service is retained");
    assert_eq!(toml_service.api_key.as_deref(), Some("toml-literal-key"));
}

#[test]
fn config_load_rejects_toml_and_fleet_name_collision() {
    let config = write_fixture(
        "toml",
        "[[yarr.services]]\nname = \"library\"\nkind = \"sonarr\"\nbase_url = \"https://toml.example.invalid\"\n",
    );
    let fleet = write_fixture(
        "yaml",
        "services:\n  - name: Library\n    kind: radarr\n    base_url: https://fleet.example.invalid\n",
    );
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_CONFIG", config.path());
    env.set("YARR_FLEET_FILE", fleet.path());
    env.remove("YARR_SERVICES");

    let error = Config::load().expect_err("TOML/fleet collision must be actionable");

    assert!(error.to_string().contains("config.toml"));
    assert!(error.to_string().contains("fleet file"));
    assert!(error.to_string().contains("library"));
}

#[test]
fn config_loads_fleet_credential_from_dotenv_overlay() {
    let fixture = write_fixture(
        "yaml",
        "services:\n  - name: library\n    kind: sonarr\n    base_url: https://public.example.invalid\n    api_key_env: YARR_LIBRARY_API_KEY\n",
    );
    let home = tempfile::tempdir().unwrap();
    std::fs::write(
        home.path().join(".env"),
        "YARR_LIBRARY_API_KEY=from-overlay\n",
    )
    .unwrap();
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_HOME", home.path());
    env.set("HOME", home.path());
    env.set("YARR_FLEET_FILE", fixture.path());
    env.remove("YARR_SERVICES");
    env.remove("YARR_LIBRARY_API_KEY");

    let loaded = Config::load().expect("fleet reference resolves from the installed overlay");

    assert_eq!(
        loaded.yarr.services[0].api_key.as_deref(),
        Some("from-overlay")
    );
}

#[test]
fn config_rejects_unresolved_credential_reference_from_installed_overlay() {
    let fixture = write_fixture(
        "yaml",
        "services:\n  - name: library\n    kind: sonarr\n    base_url: https://public.example.invalid\n    api_key_env: YARR_LIBRARY_API_KEY\n",
    );
    let home = tempfile::tempdir().unwrap();
    let mut env = crate::testing::TestEnv::new();
    env.set("YARR_HOME", home.path());
    env.set("HOME", home.path());
    env.set("YARR_FLEET_FILE", fixture.path());
    env.remove("YARR_SERVICES");
    env.remove("YARR_LIBRARY_API_KEY");

    let error = Config::load().expect_err("missing overlay reference must fail");

    assert!(error.to_string().contains("YARR_LIBRARY_API_KEY"));
    assert!(error.to_string().contains("installed environment overlay"));
}
