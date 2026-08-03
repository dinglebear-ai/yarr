use super::{OperationSafety, ServiceKind, classify_operation, validate_write_inventory};

#[test]
fn plex_non_delete_high_impact_operations_are_destructive() {
    for operation in [
        "terminate_session",
        "edit_metadata_item",
        "refresh_section",
        "scan",
        "add_section",
        "edit_section",
    ] {
        assert_eq!(
            classify_operation(ServiceKind::Plex, operation),
            Some(OperationSafety::Destructive),
            "plex.{operation} must require elicitation"
        );
    }
}

#[test]
fn delete_remains_an_additional_destructive_trigger() {
    assert_eq!(
        classify_operation(ServiceKind::Plex, "stop_all_refreshes"),
        Some(OperationSafety::Destructive)
    );
    assert_eq!(
        classify_operation(ServiceKind::Sonarr, "delete_series_by_id"),
        Some(OperationSafety::Destructive)
    );
}

#[test]
fn audited_equivalent_operations_are_destructive() {
    for (kind, operation) in [
        (ServiceKind::Sonarr, "post_system_restart"),
        (ServiceKind::Sonarr, "post_system_shutdown"),
        (ServiceKind::Radarr, "post_system_restart"),
        (ServiceKind::Radarr, "post_system_shutdown"),
        (ServiceKind::Overseerr, "post_settings_jobs_run_by_job_id"),
        (ServiceKind::Jellyfin, "restart_application"),
        (ServiceKind::Jellyfin, "shutdown_application"),
        (ServiceKind::Jellyfin, "send_playstate_command"),
    ] {
        assert_eq!(
            classify_operation(kind, operation),
            Some(OperationSafety::Destructive),
            "{}.{} must require elicitation",
            kind.as_str(),
            operation
        );
    }
}

#[test]
fn ordinary_writes_are_mutating_but_not_destructive() {
    assert_eq!(
        classify_operation(ServiceKind::Sonarr, "put_episode_by_id"),
        Some(OperationSafety::Mutating)
    );
    assert_eq!(
        classify_operation(ServiceKind::Plex, "set_rating"),
        Some(OperationSafety::Mutating)
    );
}

#[test]
fn reads_are_classified_read_only() {
    assert_eq!(
        classify_operation(ServiceKind::Plex, "get_sessions"),
        Some(OperationSafety::Read)
    );
}

#[test]
fn every_current_generated_write_matches_the_reviewed_inventory() {
    validate_write_inventory().expect("generated write inventory must be explicitly reviewed");
}
