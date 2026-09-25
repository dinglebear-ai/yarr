use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use crate::live::guard::{SHART_HOME, validate_env};
use crate::live::{coverage, report};

fn good_env() -> BTreeMap<String, String> {
    let mut env = BTreeMap::new();
    env.insert("YARR_HOME".into(), SHART_HOME.into());
    env.insert("YARR_SERVICES".into(), "sonarr,radarr,prowlarr,tautulli,overseerr,bazarr,tracearr,sabnzbd,qbittorrent,plex,jellyfin".into());
    for (name, kind, port) in [
        ("SONARR", "sonarr", "8989"),
        ("RADARR", "radarr", "7878"),
        ("PROWLARR", "prowlarr", "9696"),
        ("TAUTULLI", "tautulli", "8181"),
        ("OVERSEERR", "overseerr", "5055"),
        ("BAZARR", "bazarr", "6767"),
        ("TRACEARR", "tracearr", "8686"),
        ("SABNZBD", "sabnzbd", "8080"),
        ("QBITTORRENT", "qbittorrent", "8081"),
        ("PLEX", "plex", "32400"),
        ("JELLYFIN", "jellyfin", "8096"),
    ] {
        env.insert(
            format!("YARR_{name}_URL"),
            format!("http://shart.manatee-triceratops.ts.net:{port}"),
        );
        env.insert(format!("YARR_{name}_KIND"), kind.into());
    }
    env
}

#[test]
fn guard_accepts_complete_shart_env() {
    let env = good_env();
    let result = validate_env(env, false).expect("complete shart env should pass");
    assert_eq!(result.services.len(), 11);
    assert_eq!(result.kinds["sonarr"], "sonarr");
}

#[test]
fn guard_rejects_live_home() {
    let mut env = good_env();
    env.insert("YARR_HOME".into(), "/home/jmagar/.yarr".into());
    let err = validate_env(env, false).unwrap_err().to_string();
    assert!(err.contains("YARR_HOME must be /home/jmagar/.yarr-shart"));
}

#[test]
fn guard_rejects_tootie_url_override() {
    let mut env = good_env();
    env.insert("YARR_SONARR_URL".into(), "https://sonarr.tootie.tv".into());
    let err = validate_env(env, false).unwrap_err().to_string();
    assert!(err.contains("is not a shart URL"));
}

#[test]
fn guard_rejects_userinfo_prefix_host_bypass() {
    let mut env = good_env();
    env.insert(
        "YARR_SONARR_URL".into(),
        "http://shart:80@attacker.example:8989/".into(),
    );
    let err = validate_env(env, false).unwrap_err().to_string();
    assert!(err.contains("is not a shart URL"));
}

#[test]
fn guard_rejects_missing_required_kind() {
    let mut env = good_env();
    env.insert("YARR_SERVICES".into(), "sonarr,radarr".into());
    let err = validate_env(env, false).unwrap_err().to_string();
    assert!(err.contains("missing required service kind"));
}

#[test]
fn guard_parses_env_file() {
    let path = Path::new("target/live-test-env");
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, "YARR_SERVICES=sonarr\nYARR_SONARR_URL=http://shart.manatee-triceratops.ts.net:8989\nYARR_SONARR_KIND=sonarr\n").unwrap();
    let env = crate::live::guard::read_env_file(path).unwrap();
    assert_eq!(env["YARR_SONARR_KIND"], "sonarr");
}

#[test]
fn matrix_covers_all_required_service_kinds() {
    let matrix_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("tests/live/service_matrix.json");
    let matrix = crate::live::matrix::load(&matrix_path).unwrap();
    let kinds: std::collections::BTreeSet<_> = matrix
        .services
        .iter()
        .map(|service| service.kind.as_str())
        .collect();
    assert_eq!(kinds, crate::live::guard::required_kinds());
    for service in &matrix.services {
        assert!(
            !service.get.is_empty(),
            "{} needs at least one GET case",
            service.name
        );
        assert!(
            !service.post_expected_error.error_contains_any.is_empty(),
            "{} needs expected-error tokens",
            service.name
        );
    }
}

#[test]
fn live_surface_inventory_names_every_cli_api_and_mcp_surface() {
    let inventory = crate::live::surface::inventory();
    let names: std::collections::BTreeSet<_> =
        inventory.checks.iter().map(|check| check.name).collect();

    for required in [
        "cli setup repair",
        "cli setup install",
        "cli serve default lifecycle",
        "cli serve mcp lifecycle",
        "cli mcp stdio initialize",
        "cli unknown command error",
        "cli parser rejects invalid watch interval",
        "rest mcp auth rejects missing bearer",
        "rest mcp auth accepts bearer",
        "rest oauth authorization metadata",
        "rest oauth protected resource metadata",
        "mcp resources/read schema",
        "mcp unknown tool error",
        "mcp api_get validation error",
        "mcp api_post confirmed upstream error",
        "mcporter contract sonarr",
        "mcporter contract radarr",
        "mcporter contract prowlarr",
        "mcporter contract overseerr",
        "mcporter contract jellyfin",
        "mcporter contract plex",
    ] {
        assert!(
            names.contains(required),
            "missing live coverage for {required}"
        );
    }
}

#[test]
fn live_runtime_markers_cover_the_surface_inventory() {
    let inventory = crate::live::surface::inventory();
    let required: std::collections::BTreeSet<_> =
        inventory.checks.iter().map(|check| check.name).collect();
    let runtime: std::collections::BTreeSet<_> = crate::live::surface::runtime_markers()
        .into_iter()
        .collect();

    assert_eq!(runtime, required);
}

#[test]
fn assertions_check_json_path_and_xml_root() {
    let json_expectation = crate::live::matrix::Expectation {
        json_path: Some("response.result".into()),
        equals: Some(serde_json::json!("success")),
        equals_any: None,
        value_type: None,
        contains: None,
        xml_root: None,
    };
    crate::live::assertions::assert_value(
        &serde_json::json!({"response":{"result":"success"}}),
        &json_expectation,
    )
    .unwrap();

    let number_expectation = crate::live::matrix::Expectation {
        json_path: Some("users".into()),
        equals: None,
        equals_any: None,
        value_type: Some("number".into()),
        contains: None,
        xml_root: None,
    };
    crate::live::assertions::assert_value(&serde_json::json!({"users":0}), &number_expectation)
        .unwrap();

    let xml_expectation = crate::live::matrix::Expectation {
        json_path: None,
        equals: None,
        equals_any: None,
        value_type: None,
        contains: None,
        xml_root: Some("MediaContainer".into()),
    };
    crate::live::assertions::assert_text(
        "<MediaContainer machineIdentifier=\"test\" />",
        &xml_expectation,
    )
    .unwrap();
}

#[test]
fn coverage_marks_named_missing_checks_explicitly() {
    let report = report_with_passes(["present"]);
    let markdown = coverage::render_markdown_for_rows(
        &report,
        "target/live-full/report.json",
        &[coverage::ServiceCoverage::new(
            "Example",
            &[coverage::EndpointCoverage::new(
                "/api/example",
                "`example_action`",
                &["present", "renamed-or-missing"],
            )],
        )],
    );

    assert!(
        markdown.contains("Missing check: `renamed-or-missing`"),
        "{markdown}"
    );
}

#[test]
fn coverage_check_detects_stale_markdown() {
    let report_path = Path::new("target/live-full/coverage-stale-report.json");
    let doc_path = Path::new("target/live-full/coverage-stale-doc.md");
    let report = report_with_passes(["present"]);
    report.write_json(report_path).unwrap();
    fs::write(doc_path, "# stale\n").unwrap();

    let err = coverage::check_markdown_for_rows(
        doc_path,
        report_path,
        &[coverage::ServiceCoverage::new(
            "Example",
            &[coverage::EndpointCoverage::new(
                "/api/example",
                "`example_action`",
                &["present"],
            )],
        )],
    )
    .unwrap_err()
    .to_string();

    assert!(err.contains("is stale"), "{err}");
}

#[test]
fn coverage_check_accepts_generated_markdown() {
    let report_path = Path::new("target/live-full/coverage-fresh-report.json");
    let doc_path = Path::new("target/live-full/coverage-fresh-doc.md");
    let report = report_with_passes(["present"]);
    report.write_json(report_path).unwrap();
    let markdown = coverage::render_markdown_for_rows(
        &report,
        report_path.to_str().unwrap(),
        &[coverage::ServiceCoverage::new(
            "Example",
            &[coverage::EndpointCoverage::new(
                "/api/example",
                "`example_action`",
                &["present"],
            )],
        )],
    );
    fs::write(doc_path, markdown).unwrap();

    coverage::check_markdown_for_rows(
        doc_path,
        report_path,
        &[coverage::ServiceCoverage::new(
            "Example",
            &[coverage::EndpointCoverage::new(
                "/api/example",
                "`example_action`",
                &["present"],
            )],
        )],
    )
    .unwrap();
}

fn report_with_passes(names: impl IntoIterator<Item = &'static str>) -> report::Report {
    let mut report = report::Report::default();
    for name in names {
        report.pass(name, "ok");
    }
    report
}
