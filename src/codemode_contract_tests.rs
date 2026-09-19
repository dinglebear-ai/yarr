//! Contract tests for the neutral Code Mode naming/budget module.

use super::*;

#[test]
fn reserved_globals_are_unique_and_non_empty() {
    let mut seen = std::collections::BTreeSet::new();
    for name in RESERVED_GLOBALS {
        assert!(
            !name.is_empty(),
            "reserved global list contains an empty name"
        );
        assert!(
            seen.insert(*name),
            "reserved global {name:?} is listed twice"
        );
    }
    // The Code Mode built-in surface depends on these specific names being
    // reserved; pin the load-bearing ones.
    for name in [
        "api",
        "callTool",
        "codemode",
        "console",
        "fleet",
        "input",
        "writeArtifact",
    ] {
        assert!(
            RESERVED_GLOBALS.contains(&name),
            "{name:?} must stay reserved for the Code Mode surface"
        );
    }
}

#[test]
fn javascript_namespace_maps_hyphens_to_underscores() {
    assert_eq!(javascript_namespace("plex-den"), "plex_den");
    assert_eq!(javascript_namespace("plex_den"), "plex_den");
    assert_eq!(javascript_namespace("sonarr"), "sonarr");
}

#[test]
fn is_reserved_global_uses_the_same_list() {
    assert!(is_reserved_global("api"));
    assert!(is_reserved_global("fleet"));
    assert!(!is_reserved_global("sonarr"));
    assert!(!is_reserved_global("plex_den"));
}
