use anyhow::{Context, Result, bail};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

pub const SHART_HOME: &str = "/home/jmagar/.yarr-shart";
pub const DEFAULT_ENV_FILE: &str = "/home/jmagar/.yarr-shart/.env";

const REQUIRED_KINDS: &[&str] = &[
    "sonarr",
    "radarr",
    "prowlarr",
    "tautulli",
    "overseerr",
    "bazarr",
    "tracearr",
    "sabnzbd",
    "qbittorrent",
    "plex",
    "jellyfin",
];

#[derive(Debug, Clone)]
pub struct GuardedEnv {
    pub values: BTreeMap<String, String>,
    pub services: Vec<String>,
    pub kinds: BTreeMap<String, String>,
}

pub fn load(env_file: Option<PathBuf>, allow_partial: bool) -> Result<GuardedEnv> {
    let path = env_file.unwrap_or_else(|| PathBuf::from(DEFAULT_ENV_FILE));
    let mut values = read_env_file(&path)?;
    for (key, value) in std::env::vars() {
        if key.starts_with("YARR_") {
            values.insert(key, value);
        }
    }
    values
        .entry("YARR_HOME".into())
        .or_insert_with(|| SHART_HOME.into());
    validate_env(values, allow_partial)
}

pub fn read_env_file(path: &Path) -> Result<BTreeMap<String, String>> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read shart env file {}", path.display()))?;
    let mut values = BTreeMap::new();
    for line in raw.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        values.insert(key.trim().to_string(), unquote(value.trim()));
    }
    Ok(values)
}

pub fn validate_env(values: BTreeMap<String, String>, allow_partial: bool) -> Result<GuardedEnv> {
    let home = values
        .get("YARR_HOME")
        .map(String::as_str)
        .unwrap_or(SHART_HOME);
    if home != SHART_HOME {
        bail!("YARR_HOME must be {SHART_HOME}; got {home}");
    }

    let services: Vec<String> = values
        .get("YARR_SERVICES")
        .map(String::as_str)
        .unwrap_or("")
        .split(',')
        .map(str::trim)
        .filter(|part| !part.is_empty())
        .map(str::to_string)
        .collect();
    if services.is_empty() {
        bail!("YARR_SERVICES is empty");
    }

    let mut kinds = BTreeMap::new();
    for service in &services {
        let env_name = env_name(service);
        let url_key = format!("YARR_{env_name}_URL");
        let kind_key = format!("YARR_{env_name}_KIND");
        let url = values
            .get(&url_key)
            .with_context(|| format!("missing {url_key}"))?;
        assert_shart_url(&url_key, url)?;
        let kind = values.get(&kind_key).map(String::as_str).unwrap_or(service);
        kinds.insert(service.clone(), kind.to_ascii_lowercase());
    }

    if !allow_partial {
        let actual: BTreeSet<_> = kinds.values().map(String::as_str).collect();
        for required in REQUIRED_KINDS {
            if !actual.contains(required) {
                bail!("missing required service kind: {required}");
            }
        }
    }

    Ok(GuardedEnv {
        values,
        services,
        kinds,
    })
}

pub fn required_kinds() -> BTreeSet<&'static str> {
    REQUIRED_KINDS.iter().copied().collect()
}

fn assert_shart_url(key: &str, value: &str) -> Result<()> {
    let parsed = url::Url::parse(value).with_context(|| format!("{key} is not a valid URL"))?;
    if !matches!(parsed.scheme(), "http" | "https")
        || !parsed.username().is_empty()
        || parsed.password().is_some()
        || parsed.port().is_none()
    {
        bail!("{key}={value} is not a shart URL");
    }
    let host = parsed.host_str().unwrap_or("").to_ascii_lowercase();
    let allowed = ["shart", "shart.manatee-triceratops.ts.net", "100.118.209.1"];
    if !allowed.contains(&host.as_str()) {
        bail!("{key}={value} is not a shart URL");
    }
    Ok(())
}

fn env_name(service: &str) -> String {
    service
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_uppercase()
            } else {
                '_'
            }
        })
        .collect()
}

fn unquote(value: &str) -> String {
    value
        .strip_prefix('"')
        .and_then(|v| v.strip_suffix('"'))
        .or_else(|| value.strip_prefix('\'').and_then(|v| v.strip_suffix('\'')))
        .unwrap_or(value)
        .to_string()
}
