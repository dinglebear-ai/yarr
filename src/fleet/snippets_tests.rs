use super::snippets;

#[test]
fn fleet_builtins_are_canonical_read_only_sources() {
    let builtins = snippets::builtins();
    assert_eq!(
        builtins
            .iter()
            .map(|snippet| snippet.name)
            .collect::<Vec<_>>(),
        [
            "fleet_activity",
            "fleet_health",
            "fleet_library_sizes",
            "fleet_transcode_load"
        ]
    );
    for snippet in builtins {
        assert!(snippet.source.starts_with("async () =>"), "{snippet:?}");
        assert!(!snippet.source.contains("api_delete"), "{snippet:?}");
    }
}
