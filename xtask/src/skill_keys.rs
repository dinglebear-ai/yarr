//! Cross-check the four hand-maintained copies of the service→skill-key map.
//!
//! Plugin `userConfig` reaches the fallback skills through a chain that is
//! transcribed by hand in four places:
//!
//! 1. `src/cli/setup/plugin.rs::allowed_skill_keys` — the Rust filter used by
//!    `yarr setup plugin-hook`.
//! 2. `plugins/yarr/scripts/plugin-setup.sh` — the umbrella plugin's `services`
//!    map, run by its SessionStart hook.
//! 3. `plugins/<svc>/scripts/setup.sh` — each standalone plugin's
//!    `ALLOWED_KEYS`, run by its own hook.
//! 4. `plugins/<svc>/.claude-plugin/plugin.json` — the `userConfig` fields the
//!    settings UI renders.
//!
//! They drift silently. When `tracearr` gained an API key, copies 2–4 were
//! updated and copy 1 was not, so the Rust path filtered the credential out and
//! every tracearr call 401'd with no error mentioning configuration. Nothing
//! failed until a user hit the API.
//!
//! This check makes that a red build instead.

use anyhow::{Result, bail};
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

/// Services that ship a standalone skills-only plugin.
const SERVICES: &[&str] = &[
    "sonarr",
    "radarr",
    "prowlarr",
    "overseerr",
    "sabnzbd",
    "qbittorrent",
    "plex",
    "jellyfin",
    "tautulli",
    "tracearr",
    "bazarr",
];

/// `SONARR_API_KEY` -> `API_KEY` for service `sonarr`.
fn strip_service_prefix(service: &str, var: &str) -> Option<String> {
    let prefix = format!("{}_", service.to_uppercase());
    var.strip_prefix(&prefix).map(str::to_string)
}

/// `sonarr_api_key` -> `API_KEY` for service `sonarr`.
fn strip_service_prefix_lower(service: &str, key: &str) -> Option<String> {
    let prefix = format!("{service}_");
    key.strip_prefix(&prefix).map(|rest| rest.to_uppercase())
}

/// Copy 1 — the `allowed_skill_keys` match arms in the Rust source.
fn rust_map(root: &Path) -> Result<BTreeMap<String, Vec<String>>> {
    let src = fs::read_to_string(root.join("src/cli/setup/plugin.rs"))?;
    let Some(start) = src.find("fn allowed_skill_keys") else {
        bail!("allowed_skill_keys not found in src/cli/setup/plugin.rs");
    };
    let body = &src[start..];
    let Some(end) = body.find("\n}") else {
        bail!("could not find the end of allowed_skill_keys");
    };
    let body = &body[..end];

    // Format-independent parse. An earlier version split the flattened body on
    // "]," and broke the first time rustfmt ran: for a long arm rustfmt emits a
    // BLOCK body (`=> { &["URL", "API_KEY"] }`) with no comma after the `]`, so
    // that arm and the next one merged into a single bogus entry. A `cargo fmt`
    // silently defeating this check is precisely the failure it exists to catch,
    // so scan for `&[ .. ]` groups instead of relying on punctuation.
    let flat = body.replace(['\n', '\r'], " ");
    let mut out = BTreeMap::new();
    let mut cursor = 0usize;
    // Patterns for the current arm start after the previous arm's key list.
    let mut arm_start = 0usize;
    while let Some(rel) = flat[cursor..].find("&[") {
        let open = cursor + rel;
        let Some(close_rel) = flat[open..].find(']') else {
            break;
        };
        let close = open + close_rel;

        // `patterns` is everything between the previous arm and this arm's `=>`.
        let segment = &flat[arm_start..open];
        let patterns = segment.rsplit_once("=>").map(|(lhs, _)| lhs).unwrap_or("");

        let keys: Vec<String> = flat[open + 2..close]
            .split(',')
            .filter_map(|k| {
                let k = k.trim().trim_matches('"').trim();
                (!k.is_empty()).then(|| k.to_string())
            })
            .collect();

        // Patterns are the quoted service names. Take every double-quoted token
        // (odd indices of a `"` split) rather than splitting on `|`, so neither
        // the function prologue nor a block brace can swallow a name.
        for (i, token) in patterns.split('"').enumerate() {
            if i % 2 == 1 && SERVICES.contains(&token) {
                out.insert(token.to_string(), keys.clone());
            }
        }

        cursor = close + 1;
        arm_start = cursor;
    }
    Ok(out)
}

/// Copy 2 — the `services` object in the umbrella `plugin-setup.sh`.
fn umbrella_map(root: &Path) -> Result<BTreeMap<String, Vec<String>>> {
    let src = fs::read_to_string(root.join("plugins/yarr/scripts/plugin-setup.sh"))?;
    let Some(start) = src.find("const services = {") else {
        bail!("`const services = {{` not found in plugins/yarr/scripts/plugin-setup.sh");
    };
    let body = &src[start..];
    let Some(end) = body.find("\n};") else {
        bail!("could not find the end of the services map");
    };

    let mut out = BTreeMap::new();
    for line in body[..end].lines().skip(1) {
        let line = line.trim();
        let Some((name, rest)) = line.split_once(':') else {
            continue;
        };
        let name = name.trim();
        if !SERVICES.contains(&name) {
            continue;
        }
        let keys: Vec<String> = rest
            .trim_start_matches(" [")
            .trim_end_matches("],")
            .split(',')
            .filter_map(|k| {
                let k = k.trim().trim_matches('\'').trim_matches('"').trim();
                strip_service_prefix(name, k)
            })
            .collect();
        out.insert(name.to_string(), keys);
    }
    Ok(out)
}

/// Copy 3 — `ALLOWED_KEYS` in each standalone `setup.sh`.
fn per_service_map(root: &Path) -> Result<BTreeMap<String, Vec<String>>> {
    let mut out = BTreeMap::new();
    for svc in SERVICES {
        let path = root.join(format!("plugins/{svc}/scripts/setup.sh"));
        let src = fs::read_to_string(&path)?;
        let Some(line) = src
            .lines()
            .find(|l| l.trim_start().starts_with("ALLOWED_KEYS="))
        else {
            bail!("ALLOWED_KEYS not found in {}", path.display());
        };
        let Some(open) = line.find('(') else {
            bail!("malformed ALLOWED_KEYS in {}", path.display());
        };
        let Some(close) = line.rfind(')') else {
            bail!("malformed ALLOWED_KEYS in {}", path.display());
        };
        let keys: Vec<String> = line[open + 1..close]
            .split_whitespace()
            .filter_map(|k| strip_service_prefix(svc, k.trim_matches('"')))
            .collect();
        out.insert((*svc).to_string(), keys);
    }
    Ok(out)
}

/// Copy 4 — `userConfig` in each standalone plugin manifest.
fn manifest_map(root: &Path) -> Result<BTreeMap<String, Vec<String>>> {
    let mut out = BTreeMap::new();
    for svc in SERVICES {
        let path = root.join(format!("plugins/{svc}/.claude-plugin/plugin.json"));
        let raw = fs::read_to_string(&path)?;
        let json: serde_json::Value = serde_json::from_str(&raw)?;
        let Some(cfg) = json.get("userConfig").and_then(|v| v.as_object()) else {
            bail!("no userConfig object in {}", path.display());
        };
        let keys: Vec<String> = cfg
            .keys()
            .filter_map(|k| strip_service_prefix_lower(svc, k))
            .collect();
        out.insert((*svc).to_string(), keys);
    }
    Ok(out)
}

fn sorted(mut v: Vec<String>) -> Vec<String> {
    v.sort();
    v.dedup();
    v
}

/// Compare all four copies and report every disagreement.
pub fn run() -> Result<()> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("xtask lives one level below the repo root")
        .to_path_buf();

    let sources: [(&str, BTreeMap<String, Vec<String>>); 4] = [
        (
            "src/cli/setup/plugin.rs (allowed_skill_keys)",
            rust_map(&root)?,
        ),
        (
            "plugins/yarr/scripts/plugin-setup.sh (services)",
            umbrella_map(&root)?,
        ),
        (
            "plugins/<svc>/scripts/setup.sh (ALLOWED_KEYS)",
            per_service_map(&root)?,
        ),
        (
            "plugins/<svc>/.claude-plugin/plugin.json (userConfig)",
            manifest_map(&root)?,
        ),
    ];

    let mut problems = Vec::new();
    for svc in SERVICES {
        let per_source: Vec<(&str, Vec<String>)> = sources
            .iter()
            .map(|(label, map)| (*label, sorted(map.get(*svc).cloned().unwrap_or_default())))
            .collect();

        let baseline = &per_source[0].1;
        if per_source.iter().any(|(_, keys)| keys != baseline) {
            problems.push(format!(
                "{svc}:\n{}",
                per_source
                    .iter()
                    .map(|(label, keys)| format!("    {:?}  <- {label}", keys))
                    .collect::<Vec<_>>()
                    .join("\n")
            ));
        }
    }

    if !problems.is_empty() {
        bail!(
            "service->skill-key map disagrees across its copies.\n\n{}\n\n\
             All four must list the same keys per service. This is the drift that\n\
             silently dropped TRACEARR_API_KEY and made every tracearr call 401.",
            problems.join("\n\n")
        );
    }

    println!(
        "skill-keys: all 4 copies agree across {} services",
        SERVICES.len()
    );
    Ok(())
}
