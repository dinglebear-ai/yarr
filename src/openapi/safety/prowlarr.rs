use crate::config::ServiceKind;

use super::SafetyRow;

const KIND: ServiceKind = ServiceKind::Prowlarr;

pub(super) const ROWS: &[SafetyRow] = &[
    SafetyRow::new(KIND, "post_applications", false),
    SafetyRow::new(KIND, "post_applications_action_by_name", false),
    SafetyRow::new(KIND, "post_applications_test", false),
    SafetyRow::new(KIND, "post_applications_testall", false),
    SafetyRow::new(KIND, "post_appprofile", false),
    SafetyRow::new(KIND, "post_command", false),
    SafetyRow::new(KIND, "post_customfilter", false),
    SafetyRow::new(KIND, "post_downloadclient", false),
    SafetyRow::new(KIND, "post_downloadclient_action_by_name", false),
    SafetyRow::new(KIND, "post_downloadclient_test", false),
    SafetyRow::new(KIND, "post_downloadclient_testall", false),
    SafetyRow::new(KIND, "post_indexer", false),
    SafetyRow::new(KIND, "post_indexer_action_by_name", false),
    SafetyRow::new(KIND, "post_indexer_test", false),
    SafetyRow::new(KIND, "post_indexer_testall", false),
    SafetyRow::new(KIND, "post_indexerproxy", false),
    SafetyRow::new(KIND, "post_indexerproxy_action_by_name", false),
    SafetyRow::new(KIND, "post_indexerproxy_test", false),
    SafetyRow::new(KIND, "post_indexerproxy_testall", false),
    SafetyRow::new(KIND, "post_login", false),
    SafetyRow::new(KIND, "post_notification", false),
    SafetyRow::new(KIND, "post_notification_action_by_name", false),
    SafetyRow::new(KIND, "post_notification_test", false),
    SafetyRow::new(KIND, "post_notification_testall", false),
    SafetyRow::new(KIND, "post_search", false),
    SafetyRow::new(KIND, "post_search_bulk", false),
    SafetyRow::new(KIND, "post_system_backup_restore_by_id", false),
    SafetyRow::new(KIND, "post_system_backup_restore_upload", false),
    SafetyRow::new(KIND, "post_system_restart", false),
    SafetyRow::new(KIND, "post_system_shutdown", false),
    SafetyRow::new(KIND, "post_tag", false),
    SafetyRow::new(KIND, "put_applications_bulk", false),
    SafetyRow::new(KIND, "put_applications_by_id", false),
    SafetyRow::new(KIND, "put_appprofile_by_id", false),
    SafetyRow::new(KIND, "put_config_development_by_id", false),
    SafetyRow::new(KIND, "put_config_downloadclient_by_id", false),
    SafetyRow::new(KIND, "put_config_host_by_id", false),
    SafetyRow::new(KIND, "put_config_ui_by_id", false),
    SafetyRow::new(KIND, "put_customfilter_by_id", false),
    SafetyRow::new(KIND, "put_downloadclient_bulk", false),
    SafetyRow::new(KIND, "put_downloadclient_by_id", false),
    SafetyRow::new(KIND, "put_indexer_bulk", false),
    SafetyRow::new(KIND, "put_indexer_by_id", false),
    SafetyRow::new(KIND, "put_indexerproxy_by_id", false),
    SafetyRow::new(KIND, "put_notification_by_id", false),
    SafetyRow::new(KIND, "put_tag_by_id", false),
];

#[cfg(test)]
#[path = "prowlarr_tests.rs"]
mod tests;
