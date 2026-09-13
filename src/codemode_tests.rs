//! Facade-level sanity checks for the Code Mode limits + subdir layout.

use super::*;

#[test]
fn artifact_and_snippet_subdirs_are_distinct_relative_paths() {
    // Both store roots are relative (joined under the data dir) and distinct, so
    // artifacts and snippets never share a directory.
    let artifacts = std::path::Path::new(CODEMODE_ARTIFACTS_SUBDIR);
    let snippets = std::path::Path::new(CODEMODE_SNIPPETS_SUBDIR);
    assert!(artifacts.is_relative(), "artifacts subdir must be relative");
    assert!(snippets.is_relative(), "snippets subdir must be relative");
    assert_ne!(artifacts, snippets);
}

#[test]
fn engine_limits_build_from_the_constants() {
    // The exported limits compose into an `EngineLimits` with a future deadline —
    // a runtime smoke check that the constants are usable as configured.
    let limits = EngineLimits {
        memory_bytes: CODEMODE_MEMORY_LIMIT,
        stack_bytes: CODEMODE_STACK_LIMIT,
        deadline: std::time::Instant::now() + CODEMODE_TIMEOUT,
    };
    assert!(limits.memory_bytes >= CODEMODE_STACK_LIMIT);
    assert!(limits.deadline > std::time::Instant::now());
}

#[test]
fn default_execution_deadline_is_two_minutes() {
    assert_eq!(CODEMODE_TIMEOUT, std::time::Duration::from_secs(120));
}
