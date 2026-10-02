//! Builtin snippet registry invariants.

use super::snippets::{builtins, get};

#[test]
fn builtins_are_unique_and_read_only_sources() {
    let mut seen = std::collections::BTreeSet::new();
    for snippet in builtins() {
        assert!(
            seen.insert(snippet.name),
            "duplicate builtin name {:?}",
            snippet.name
        );
        assert!(!snippet.description.is_empty());
        // Canonical builtins are read-only observability fan-outs: they must
        // never need destructive confirmation.
        assert!(
            snippet.source.contains("fleet."),
            "builtin {:?} must use the fleet bridge",
            snippet.name
        );
    }
    assert!(get("fleet_health").is_some());
    assert!(get("not_a_builtin").is_none());
}
