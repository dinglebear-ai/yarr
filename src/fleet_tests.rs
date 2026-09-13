use super::{FleetInvocation, FleetSelector, parse_private_invocation};
use crate::{ServiceConfig, ServiceKind, YarrClient, YarrConfig, YarrService};
use serde_json::{Map, Value, json};

#[test]
fn private_fleet_invocation_rejects_unknown_outer_field() {
    let error = parse_private_invocation(
        r#"{"selector":{"type":"of","name":"instance-01"},"action":"service_status","unexpected":true}"#,
    )
    .expect_err("unknown outer fields must be rejected");

    assert_eq!(error, "fleet params contains unknown field `unexpected`");
}

#[test]
fn private_fleet_invocation_rejects_unknown_all_selector_field() {
    let error = parse_private_invocation(
        r#"{"selector":{"type":"all","kind":"sonarr","unexpected":true},"action":"service_status"}"#,
    )
    .expect_err("unknown all-selector fields must be rejected");

    assert_eq!(
        error,
        "fleet.all selector contains unknown field `unexpected`"
    );
}

#[test]
fn private_fleet_invocation_rejects_unknown_of_selector_field() {
    let error = parse_private_invocation(
        r#"{"selector":{"type":"of","name":"instance-01","unexpected":true},"action":"service_status"}"#,
    )
    .expect_err("unknown of-selector fields must be rejected");

    assert_eq!(
        error,
        "fleet.of selector contains unknown field `unexpected`"
    );
}

#[test]
fn private_fleet_invocation_accepts_existing_valid_forms() {
    let of = parse_private_invocation(
        r#"{"selector":{"type":"of","name":"instance-01"},"action":"service_status","params":{"verbose":true}}"#,
    )
    .expect("valid of selector must parse");
    assert_eq!(
        of.selector,
        FleetSelector::Of {
            name: "instance-01".into()
        }
    );
    assert_eq!(of.action, "service_status");
    assert_eq!(of.params.get("verbose"), Some(&Value::Bool(true)));

    let all = parse_private_invocation(
        r#"{"selector":{"type":"all","kind":null},"action":"service_status"}"#,
    )
    .expect("valid all selector must parse");
    assert_eq!(all.selector, FleetSelector::All { kind: None });
    assert!(all.params.is_empty());
}

fn service() -> YarrService {
    let services = (0..20)
        .map(|index| ServiceConfig {
            name: format!("instance-{index:02}"),
            kind: if index % 2 == 0 {
                ServiceKind::Sonarr
            } else {
                ServiceKind::Radarr
            },
            base_url: format!("http://127.0.0.1:{}", 40000 + index),
            ..ServiceConfig::default()
        })
        .rev()
        .collect::<Vec<_>>();
    let config = YarrConfig { services };
    YarrService::new(YarrClient::new(&config).unwrap(), config)
}

#[test]
fn plan_fleet_sorts_twenty_mixed_instances_and_forces_identity() {
    let svc = service();
    let mut params = Map::new();
    params.insert("service".into(), Value::String("attacker".into()));
    let plan = svc
        .plan_fleet(FleetInvocation {
            selector: FleetSelector::All {
                kind: Some(ServiceKind::Sonarr),
            },
            action: "service_status".into(),
            params,
        })
        .expect("valid selected read action");
    assert_eq!(plan.leaves().len(), 10);
    assert_eq!(
        plan.leaves()
            .iter()
            .map(|leaf| leaf.service.as_str())
            .collect::<Vec<_>>(),
        (0..20)
            .step_by(2)
            .map(|index| format!("instance-{index:02}"))
            .collect::<Vec<_>>()
    );
    assert!(
        plan.leaves()
            .iter()
            .all(|leaf| leaf.action_service() == leaf.service)
    );
}

#[test]
fn plan_fleet_of_requires_exact_configured_identity_and_rejects_invalid_actions() {
    let svc = service();
    let exact = svc
        .plan_fleet(FleetInvocation {
            selector: FleetSelector::Of {
                name: "instance-01".into(),
            },
            action: "service_status".into(),
            params: Map::new(),
        })
        .expect("configured identity is accepted");
    assert_eq!(exact.leaves()[0].service, "instance-01");

    let alias = svc
        .plan_fleet(FleetInvocation {
            selector: FleetSelector::Of {
                name: "sonarr".into(),
            },
            action: "service_status".into(),
            params: Map::new(),
        })
        .expect_err("kind alias is not an identity");
    assert!(alias.to_string().contains("configured service identity"));

    for action in ["help", "codemode", "snippet_list", "no_such_action"] {
        let error = svc
            .plan_fleet(FleetInvocation {
                selector: FleetSelector::Of {
                    name: "instance-00".into(),
                },
                action: action.into(),
                params: if action == "codemode" {
                    serde_json::from_value(json!({"code":"async () => null"})).unwrap()
                } else {
                    Map::new()
                },
            })
            .expect_err("infra/script/invalid actions cannot fan out");
        assert!(!error.to_string().is_empty());
    }
}
