use super::{classify_error, parse_status, status_script};

#[test]
fn status_uses_one_inspect_per_container_and_parses_rows() {
    let script = status_script(true);
    assert_eq!(script.matches("docker inspect --format").count(), 1);
    assert!(script.contains("[ \"$state\" = \"running\" ] || failed=1"));
    assert!(
        script.contains("[ \"$health\" = \"-\" ] || [ \"$health\" = \"healthy\" ] || failed=1")
    );
    assert!(
        script.contains("[ \"$health\" = \"-\" ] || [ \"$health\" = \"healthy\" ] || failed=1")
    );

    let stopped_script = status_script(false);
    assert!(!stopped_script.contains("[ \"$state\" = \"running\" ] || failed=1"));
    assert!(stopped_script.contains("missing\\t-"));

    let rows = parse_status("sonarr\trunning\thealthy\nradarr\texited\t-\n").unwrap();
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0].container, "sonarr");
    assert_eq!(rows[1].state, "exited");
    assert!(parse_status("bad-row").is_err());
}

#[test]
fn remote_errors_distinguish_timeout_ssh_docker_and_container_failures() {
    assert_eq!(classify_error(Some(124), ""), "ssh_timeout");
    assert_eq!(classify_error(Some(137), ""), "ssh_timeout");
    assert_eq!(
        classify_error(Some(255), "connection refused"),
        "ssh_failed"
    );
    assert_eq!(
        classify_error(Some(1), "shart Docker is unavailable"),
        "docker_unavailable"
    );
    assert_eq!(classify_error(Some(1), ""), "container_state");
}
