pub(super) fn generated_media_server_domain_response(detail: &str) -> bool {
    detail.contains("returned HTTP 400")
        || detail.contains("returned HTTP 404")
        || detail.contains("returned HTTP 405")
        || detail.contains("returned HTTP 409")
}

pub(super) fn jellyfin_expected_specific_domain_response(op_name: &str, detail: &str) -> bool {
    matches!(op_name, "update_user_policy")
        && detail.contains("returned HTTP 403")
        && detail
            .contains("There must be at least one user in the system with administrative access.")
        || matches!(
            op_name,
            "get_channel_mapping_options"
                | "get_trailers"
                | "create_collection"
                | "move_item"
                | "set_channel_mapping"
                | "get_attachment"
                | "get_audio_stream"
                | "get_audio_stream_by_container"
                | "get_playback_info"
                | "get_program"
                | "get_remote_subtitles"
                | "get_subtitle"
                | "get_subtitle_with_ticks"
                | "get_universal_audio_stream"
                | "get_video_stream"
                | "get_video_stream_by_container"
                | "remove_item_from_playlist"
                | "update_plugin_configuration"
        ) && detail.contains("returned HTTP 500")
            && detail.contains("Error processing request.")
        || matches!(
            op_name,
            "authenticate_with_quick_connect"
                | "authorize_quick_connect"
                | "complete_wizard"
                | "create_key"
                | "restart_application"
                | "revoke_key"
                | "set_remote_access"
                | "shutdown_application"
                | "start_restore_backup"
                | "update_branding_configuration"
                | "update_configuration"
                | "update_initial_configuration"
                | "update_named_configuration"
                | "update_plugin_configuration"
                | "update_startup_user"
                | "update_user_configuration"
        ) && detail.contains("returned HTTP 503")
            && detail.contains("Jellyfin Server is loading. Please try again shortly.")
}

pub(super) fn plex_expected_specific_domain_response(op_name: &str, detail: &str) -> bool {
    matches!(
        op_name,
        "get_all_subscriptions"
            | "get_scheduled_recordings"
            | "process_subscriptions"
            | "terminate_session"
            | "edit_subscription_preferences"
            | "get_subscription"
    ) && detail.contains("returned HTTP 401")
        && detail.contains("401 Unauthorized")
        || matches!(
            op_name,
            "get_source_connection_information"
                | "get_transient_token"
                | "detect_credits"
                | "detect_voice_activity"
                | "get_sonic_path"
                | "list_sonically_similar"
        ) && detail.contains("returned HTTP 403")
            && detail.contains("403 Forbidden")
        || matches!(op_name, "get_playlist_items")
            && detail.contains("returned HTTP 500")
            && detail.contains("500 Internal Server Error")
        || matches!(op_name, "get_stream")
            && detail.contains("returned HTTP 501")
            && detail.contains("501 Not Implemented")
}

pub(super) fn overseerr_expected_domain_response(op_name: &str, detail: &str) -> bool {
    if overseerr_expected_specific_domain_response(op_name, detail) {
        return true;
    }
    let is_overseerr_name = op_name.contains("settings")
        || op_name.contains("auth")
        || op_name.contains("request")
        || op_name.contains("issue")
        || op_name.contains("discover")
        || op_name.contains("movie")
        || op_name.contains("tv")
        || op_name.contains("user")
        || op_name.contains("media")
        || op_name.contains("person")
        || op_name.contains("keyword")
        || op_name.contains("collection")
        || op_name.contains("network")
        || op_name.contains("studio")
        || op_name.contains("service_sonarr");
    is_overseerr_name
        && (detail.contains("returned HTTP 400")
            || detail.contains("returned HTTP 404")
            || detail.contains("returned HTTP 405")
            || detail.contains("returned HTTP 409")
            || detail.contains("overseerr request failed"))
}

pub(super) fn overseerr_expected_specific_domain_response(op_name: &str, detail: &str) -> bool {
    matches!((op_name, detail), ("get_settings_notifications_pushover_sounds", d)
        if d.contains("returned HTTP 500") && d.contains("Unable to retrieve Pushover sounds."))
        || matches!((op_name, detail), ("put_user", d)
            if d.contains("returned HTTP 500") && d.contains("parameterValue.value is not iterable"))
        || matches!((op_name, detail), ("delete_user_push_subscription_by_user_id_endpoint", d)
            if d.contains("returned HTTP 500") && d.contains("User push subcription not found"))
        || matches!((op_name, detail), ("post_auth_local", d)
            if d.contains("returned HTTP 403") && d.contains("Access denied."))
        || matches!((op_name, detail), ("post_auth_plex", d)
            if d.contains("returned HTTP 500") && d.contains("Unable to authenticate."))
        || matches!((op_name, detail), ("post_auth_reset_password_by_guid", d)
            if d.contains("returned HTTP 500") && d.contains("Password must be at least 8 characters long."))
        || matches!((op_name, detail), ("post_settings_notifications_discord_test", d)
            if d.contains("returned HTTP 500") && d.contains("Failed to send Discord notification."))
        || matches!((op_name, detail), ("post_settings_notifications_lunasea_test", d)
            if d.contains("returned HTTP 500") && d.contains("Failed to send web push notification."))
        || matches!((op_name, detail), ("post_settings_notifications_slack_test", d)
            if d.contains("returned HTTP 500") && d.contains("Failed to send Slack notification."))
        || matches!((op_name, detail), ("post_settings_notifications_webhook", d)
            if d.contains("returned HTTP 500") && d.contains("is not valid JSON"))
        || matches!((op_name, detail), ("post_settings_notifications_webhook_test", d)
            if d.contains("returned HTTP 500") && d.contains("Failed to send webhook notification."))
        || matches!((op_name, detail), ("post_settings_plex", d)
            if d.contains("returned HTTP 500") && d.contains("Unable to connect to Plex."))
        || matches!((op_name, detail), ("post_settings_tautulli", d)
            if d.contains("returned HTTP 500") && d.contains("Unable to connect to Tautulli."))
        || matches!((op_name, detail), ("post_user_settings_permissions_by_user_id", d)
            if d.contains("returned HTTP 403")
                && d.contains("You do not have permission to modify this user"))
}

#[cfg(test)]
mod tests {
    use super::super::{PreparedCall, ServiceKind, should_retry_domain_result};
    use super::*;
    use serde_json::{Map, json};
    use yarr::openapi::{self, OperationSpec};

    #[test]
    fn jellyfin_loading_response_is_retried_not_classified() {
        let op = Box::leak(Box::new(OperationSpec {
            name: "get_auth_providers",
            method: openapi::HttpMethod::Get,
            path: "/Auth/Providers",
            safety: openapi::OperationSafety::ReadOnly,
            path_params: &[],
            query_params: &[],
            has_body: false,
            parameters: &[],
            request_body: None,
            responses: &[],
            request_type: None,
            response_type: None,
            tag: "Auth",
            summary: "Get auth providers",
        }));
        let call = PreparedCall {
            kind: ServiceKind::Jellyfin,
            op,
            args: Map::new(),
        };
        let values = vec![json!({
            "name": "get_auth_providers",
            "args": {},
            "ok": false,
            "error": "Error: jellyfin returned HTTP 503 (Jellyfin Server is loading. Please try again shortly.)"
        })];
        assert!(should_retry_domain_result(&[call], &values));
    }

    #[test]
    fn media_server_domain_response_rejects_auth_and_server_outages() {
        for status in [401, 403, 500, 501, 503] {
            assert!(
                !generated_media_server_domain_response(&format!(
                    "jellyfin returned HTTP {status} (broken)"
                )),
                "HTTP {status} must not be accepted as a generic media-server domain response"
            );
        }
        for status in [400, 404, 405, 409] {
            assert!(generated_media_server_domain_response(&format!(
                "jellyfin returned HTTP {status} (domain error)"
            )));
        }
    }

    #[test]
    fn jellyfin_specific_domain_response_is_narrow() {
        assert!(jellyfin_expected_specific_domain_response(
            "get_video_stream",
            "Error: jellyfin returned HTTP 500 (Error processing request.)"
        ));
        assert!(jellyfin_expected_specific_domain_response(
            "shutdown_application",
            "Error: jellyfin returned HTTP 503 (Jellyfin Server is loading. Please try again shortly.)"
        ));
        assert!(jellyfin_expected_specific_domain_response(
            "update_user_policy",
            "Error: jellyfin returned HTTP 403 (\"There must be at least one user in the system with administrative access.\")"
        ));
        assert!(jellyfin_expected_specific_domain_response(
            "update_plugin_configuration",
            "Error: jellyfin returned HTTP 500 (Error processing request.)"
        ));
        assert!(!jellyfin_expected_specific_domain_response(
            "get_video_stream",
            "Error: jellyfin returned HTTP 500 (panic)"
        ));
        assert!(!jellyfin_expected_specific_domain_response(
            "get_users",
            "Error: jellyfin returned HTTP 503 (Jellyfin Server is loading. Please try again shortly.)"
        ));
    }

    #[test]
    fn plex_specific_domain_response_is_narrow() {
        assert!(plex_expected_specific_domain_response(
            "get_all_subscriptions",
            "Error: plex returned HTTP 401 (<html><head><title>Unauthorized</title></head><body><h1>401 Unauthorized</h1></body></html>)"
        ));
        assert!(plex_expected_specific_domain_response(
            "detect_credits",
            "Error: plex returned HTTP 403 (<html><head><title>Forbidden</title></head><body><h1>403 Forbidden</h1></body></html>)"
        ));
        assert!(plex_expected_specific_domain_response(
            "get_stream",
            "Error: plex returned HTTP 501 (<html><head><title>Not Implemented</title></head><body><h1>501 Not Implemented</h1></body></html>)"
        ));
        assert!(!plex_expected_specific_domain_response(
            "get_sections",
            "Error: plex returned HTTP 401 (<html><head><title>Unauthorized</title></head><body><h1>401 Unauthorized</h1></body></html>)"
        ));
        assert!(!plex_expected_specific_domain_response(
            "get_stream",
            "Error: plex returned HTTP 500 (<html><head><title>Internal Server Error</title></head><body><h1>500 Internal Server Error</h1></body></html>)"
        ));
    }

    #[test]
    fn overseerr_domain_response_rejects_auth_and_server_outages() {
        for status in [401, 403, 500, 501, 503] {
            assert!(
                !overseerr_expected_domain_response(
                    "get_user_by_user_id",
                    &format!("overseerr returned HTTP {status} (broken)")
                ),
                "HTTP {status} must not be accepted as an Overseerr domain response"
            );
        }
        for status in [400, 404, 405, 409] {
            assert!(overseerr_expected_domain_response(
                "get_user_by_user_id",
                &format!("overseerr returned HTTP {status} (domain error)")
            ));
        }
    }
}
