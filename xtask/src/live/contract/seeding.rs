use anyhow::Result;
use serde_json::{Value, json};
use yarr::ServiceKind;

use super::fixture_args::unique_live_label;
use crate::live::process;

pub(in crate::live) fn seed_service_fixtures(
    yarr: &process::YarrProcess,
    svc: &str,
    kind: ServiceKind,
) -> Result<()> {
    match kind {
        ServiceKind::Sonarr => ensure_sonarr_download_client(yarr, svc),
        _ => Ok(()),
    }
}

/// Best-effort provider/resource fixtures for the generated-op contract sweep's
/// own POST create tests (distinct from `seed_service_fixtures` above, which
/// seeds specific named resources for path-param fixtures). Sonarr/Radarr's
/// provider-backed resources (downloadclient/indexer/notification/metadata/
/// importlist) validate the `implementation`/`configContract`/`fields` shape
/// server-side in a way the generic OpenAPI-schema synthesizer can't discover —
/// but each has a `GET .../schema` endpoint returning ready-to-POST templates
/// with real implementation names and correctly-typed default field values.
/// Every field here is optional: a failed/unsupported lookup just leaves the
/// corresponding contract op unfixed (falls back to the generic synth), it
/// never fails the whole seeding pass.
#[derive(Default, Debug)]
pub(in crate::live) struct ProviderFixtures {
    pub downloadclient: Option<Value>,
    pub indexer: Option<Value>,
    pub notification: Option<Value>,
    pub metadata: Option<Value>,
    pub importlist: Option<Value>,
    pub autotagging_spec: Option<Value>,
    pub customformat_spec: Option<Value>,
    pub tag_id: Option<Value>,
    pub quality_profile_id: Option<Value>,
    pub root_folder_path: Option<String>,
    /// An existing, on-disk subfolder under the configured root folder that is
    /// NOT itself already configured as a root folder — for `post_rootfolder`,
    /// which needs a valid path Sonarr hasn't already added (reusing
    /// `root_folder_path` itself gets "already configured as a root folder").
    pub unmapped_root_folder_path: Option<String>,
}

pub(in crate::live) fn prime_provider_fixtures(
    yarr: &process::YarrProcess,
    svc: &str,
    kind: ServiceKind,
) -> ProviderFixtures {
    if !matches!(kind, ServiceKind::Sonarr | ServiceKind::Radarr) {
        return ProviderFixtures::default();
    }
    let root_folders = yarr
        .json(&[svc, "op", "get_rootfolder", "--args", "{}"])
        .ok();
    ProviderFixtures {
        downloadclient: first_schema_entry(yarr, svc, "get_downloadclient_schema"),
        indexer: first_schema_entry(yarr, svc, "get_indexer_schema"),
        notification: first_schema_entry(yarr, svc, "get_notification_schema"),
        metadata: first_schema_entry(yarr, svc, "get_metadata_schema"),
        importlist: first_schema_entry(yarr, svc, "get_importlist_schema"),
        // Picking an arbitrary schema[0] specification (rather than a specific
        // known-safe one) risks a `fields`-typed value the generic template
        // leaves unset (e.g. a multi-select `tag` field with no default) — Sonarr
        // rejects those as empty at create time. `MonitoredSpecification` takes
        // zero fields, and a customformat preset ships a real regex value.
        autotagging_spec: schema_entry_by_implementation(
            yarr,
            svc,
            "get_autotagging_schema",
            "MonitoredSpecification",
        ),
        customformat_spec: first_customformat_preset(yarr, svc),
        tag_id: create_live_tag(yarr, svc, kind),
        quality_profile_id: first_quality_profile_id(yarr, svc),
        root_folder_path: root_folder_path(root_folders.as_ref()),
        unmapped_root_folder_path: unmapped_root_folder_path(root_folders.as_ref()),
    }
}

fn first_schema_entry(yarr: &process::YarrProcess, svc: &str, op_name: &str) -> Option<Value> {
    let value = yarr.json(&[svc, "op", op_name, "--args", "{}"]).ok()?;
    value.as_array()?.first().cloned()
}

fn schema_entry_by_implementation(
    yarr: &process::YarrProcess,
    svc: &str,
    op_name: &str,
    implementation: &str,
) -> Option<Value> {
    let value = yarr.json(&[svc, "op", op_name, "--args", "{}"]).ok()?;
    value
        .as_array()?
        .iter()
        .find(|entry| entry.get("implementation").and_then(Value::as_str) == Some(implementation))
        .cloned()
}

/// The first ready-to-use preset (real field values, e.g. a non-empty regex)
/// across all custom-format specification schema entries, since the bare
/// (non-preset) schema entries leave their `fields[].value` unset.
fn first_customformat_preset(yarr: &process::YarrProcess, svc: &str) -> Option<Value> {
    let value = yarr
        .json(&[svc, "op", "get_customformat_schema", "--args", "{}"])
        .ok()?;
    value
        .as_array()?
        .iter()
        .find_map(|entry| entry.get("presets")?.as_array()?.first().cloned())
}

fn create_live_tag(yarr: &process::YarrProcess, svc: &str, kind: ServiceKind) -> Option<Value> {
    let body = json!({ "label": unique_live_label(kind, "provider-fixture-tag") });
    let args = serde_json::to_string(&json!({ "body": body })).ok()?;
    let created = yarr.json(&[svc, "op", "post_tag", "--args", &args]).ok()?;
    created.get("id").cloned()
}

fn first_quality_profile_id(yarr: &process::YarrProcess, svc: &str) -> Option<Value> {
    let value = yarr
        .json(&[svc, "op", "get_qualityprofile", "--args", "{}"])
        .ok()?;
    // Prefer a non-default profile ("Any" is frequently in use elsewhere and
    // can't be deleted/reused as a disposable target) but fall back to the
    // first one if that's all there is.
    let profiles = value.as_array()?;
    profiles
        .iter()
        .find(|p| p.get("name").and_then(Value::as_str) != Some("Any"))
        .or_else(|| profiles.first())
        .and_then(|p| p.get("id").cloned())
}

fn root_folder_path(root_folders: Option<&Value>) -> Option<String> {
    root_folders?
        .as_array()?
        .first()?
        .get("path")?
        .as_str()
        .map(str::to_owned)
}

fn unmapped_root_folder_path(root_folders: Option<&Value>) -> Option<String> {
    root_folders?
        .as_array()?
        .first()?
        .get("unmappedFolders")?
        .as_array()?
        .first()?
        .get("path")?
        .as_str()
        .map(str::to_owned)
}

fn ensure_sonarr_download_client(yarr: &process::YarrProcess, svc: &str) -> Result<()> {
    ensure_sonarr_qbittorrent_download_client(yarr, svc)?;
    ensure_sonarr_newznab_indexer(yarr, svc)?;
    ensure_sonarr_custom_script_notification(yarr, svc)?;
    ensure_sonarr_remote_path_mapping(yarr, svc)?;
    ensure_sonarr_autotagging(yarr, svc)
}

fn ensure_sonarr_qbittorrent_download_client(yarr: &process::YarrProcess, svc: &str) -> Result<()> {
    let existing = yarr.json(&[svc, "op", "get_downloadclient", "--args", "{}"])?;
    if existing.as_array().is_some_and(|items| {
        items.iter().any(|item| {
            item.get("name").and_then(Value::as_str) == Some("yarr-live-qbit")
                && item.get("implementation").and_then(Value::as_str) == Some("QBittorrent")
        })
    }) {
        return Ok(());
    }
    let body = json!({
        "enable": false,
        "protocol": "torrent",
        "priority": 1,
        "removeCompletedDownloads": false,
        "removeFailedDownloads": false,
        "name": "yarr-live-qbit",
        "implementation": "QBittorrent",
        "implementationName": "qBittorrent",
        "configContract": "QBittorrentSettings",
        "fields": [
            {"name": "host", "value": "100.118.209.1"},
            {"name": "port", "value": 8080},
            {"name": "useSsl", "value": false},
            {"name": "urlBase", "value": ""},
            {"name": "apiKey", "value": ""},
            {"name": "username", "value": ""},
            {"name": "password", "value": ""},
            {"name": "tvCategory", "value": "tv-sonarr"},
            {"name": "tvImportedCategory", "value": ""},
            {"name": "recentTvPriority", "value": 0},
            {"name": "olderTvPriority", "value": 0},
            {"name": "initialState", "value": 0},
            {"name": "sequentialOrder", "value": false},
            {"name": "firstAndLast", "value": false},
            {"name": "contentLayout", "value": 0}
        ],
        "tags": []
    });
    let args = serde_json::to_string(&json!({ "body": body }))?;
    yarr.json(&[svc, "op", "post_downloadclient", "--args", &args])?;
    Ok(())
}

fn ensure_sonarr_newznab_indexer(yarr: &process::YarrProcess, svc: &str) -> Result<()> {
    let existing = yarr.json(&[svc, "op", "get_indexer", "--args", "{}"])?;
    if existing.as_array().is_some_and(|items| {
        items.iter().any(|item| {
            item.get("name").and_then(Value::as_str) == Some("yarr-live-newznab")
                && item.get("implementation").and_then(Value::as_str) == Some("Newznab")
        })
    }) {
        return Ok(());
    }
    let body = json!({
        "enableRss": false,
        "enableAutomaticSearch": false,
        "enableInteractiveSearch": false,
        "supportsRss": true,
        "supportsSearch": true,
        "protocol": "usenet",
        "priority": 1,
        "name": "yarr-live-newznab",
        "implementation": "Newznab",
        "implementationName": "Newznab",
        "configContract": "NewznabSettings",
        "fields": [
            {"name": "baseUrl", "value": "http://127.0.0.1:9"},
            {"name": "apiPath", "value": "/api"},
            {"name": "apiKey", "value": "yarr-live"},
            {"name": "categories", "value": [5030, 5040]},
            {"name": "animeCategories", "value": []},
            {"name": "animeStandardFormatSearch", "value": false},
            {"name": "additionalParameters", "value": ""},
            {"name": "multiLanguages", "value": []},
            {"name": "failDownloads", "value": []}
        ],
        "tags": []
    });
    let args = serde_json::to_string(&json!({ "body": body }))?;
    yarr.json(&[svc, "op", "post_indexer", "--args", &args])?;
    Ok(())
}

fn ensure_sonarr_custom_script_notification(yarr: &process::YarrProcess, svc: &str) -> Result<()> {
    let existing = yarr.json(&[svc, "op", "get_notification", "--args", "{}"])?;
    if existing.as_array().is_some_and(|items| {
        items.iter().any(|item| {
            item.get("name").and_then(Value::as_str) == Some("yarr-live-script")
                && item.get("implementation").and_then(Value::as_str) == Some("CustomScript")
        })
    }) {
        return Ok(());
    }
    let body = json!({
        "name": "yarr-live-script",
        "implementation": "CustomScript",
        "implementationName": "Custom Script",
        "configContract": "CustomScriptSettings",
        "fields": [
            {"name": "path", "value": "/bin/true"},
            {"name": "arguments", "value": ""}
        ],
        "onGrab": false,
        "onDownload": false,
        "onUpgrade": false,
        "onRename": false,
        "onSeriesAdd": false,
        "onSeriesDelete": false,
        "onEpisodeFileDelete": false,
        "onEpisodeFileDeleteForUpgrade": false,
        "onHealthIssue": false,
        "onHealthRestored": false,
        "onApplicationUpdate": false,
        "includeHealthWarnings": false,
        "tags": []
    });
    let args = serde_json::to_string(&json!({ "body": body }))?;
    yarr.json(&[svc, "op", "post_notification", "--args", &args])?;
    Ok(())
}

fn ensure_sonarr_remote_path_mapping(yarr: &process::YarrProcess, svc: &str) -> Result<()> {
    let existing = yarr.json(&[svc, "op", "get_remotepathmapping", "--args", "{}"])?;
    if existing.as_array().is_some_and(|items| {
        items.iter().any(|item| {
            item.get("host").and_then(Value::as_str) == Some("yarr-live-host")
                && item.get("remotePath").and_then(Value::as_str) == Some("/downloads/")
                && item.get("localPath").and_then(Value::as_str) == Some("/data/media/tv/")
        })
    }) {
        return Ok(());
    }
    let body = json!({
        "host": "yarr-live-host",
        "remotePath": "/downloads/",
        "localPath": "/data/media/tv/"
    });
    let args = serde_json::to_string(&json!({ "body": body }))?;
    yarr.json(&[svc, "op", "post_remotepathmapping", "--args", &args])?;
    Ok(())
}

fn ensure_sonarr_autotagging(yarr: &process::YarrProcess, svc: &str) -> Result<()> {
    let existing = yarr.json(&[svc, "op", "get_autotagging", "--args", "{}"])?;
    if existing.as_array().is_some_and(|items| {
        items
            .iter()
            .any(|item| item.get("name").and_then(Value::as_str) == Some("yarr-live-autotag"))
    }) {
        return Ok(());
    }
    let body = json!({
        "name": "yarr-live-autotag",
        "removeTagsAutomatically": false,
        "tags": [40],
        "specifications": [{
            "name": "Monitored",
            "implementation": "MonitoredSpecification",
            "implementationName": "Monitored",
            "negate": false,
            "required": false,
            "fields": []
        }]
    });
    let args = serde_json::to_string(&json!({ "body": body }))?;
    yarr.json(&[svc, "op", "post_autotagging", "--args", &args])?;
    Ok(())
}
