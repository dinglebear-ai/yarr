use super::poll_readiness;
use std::time::Duration;

#[test]
fn readiness_aggregates_all_failures_under_one_deadline() {
    let services = vec![
        ("sonarr".into(), "http://sonarr".into()),
        ("radarr".into(), "http://radarr".into()),
    ];
    let error = poll_readiness(&services, Duration::ZERO, Duration::ZERO, |url| {
        Err(format!("unreachable {url}"))
    })
    .unwrap_err()
    .to_string();
    assert!(error.contains("sonarr"));
    assert!(error.contains("radarr"));
}

#[test]
fn readiness_removes_successes_and_converges() {
    let services = vec![("sonarr".into(), "http://sonarr".into())];
    let mut calls = 0;
    poll_readiness(&services, Duration::from_secs(1), Duration::ZERO, |_| {
        calls += 1;
        if calls == 1 {
            Err("starting".into())
        } else {
            Ok(())
        }
    })
    .unwrap();
    assert_eq!(calls, 2);
}
