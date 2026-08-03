use super::*;

#[test]
fn generic_endpoint_describes_mutating_and_local_actions() {
    assert!(generic_endpoint("api_delete").contains("DELETE"));
    assert!(generic_endpoint("api_delete").contains("destructive"));
    assert!(generic_endpoint("snippet_list").contains("No upstream call"));
}

#[test]
fn small_render_helpers_are_stable() {
    assert_eq!(scope(None), "public");
    assert_eq!(yes_no(true), "yes");
    assert_eq!(yes_no(false), "no");
}

#[test]
fn generated_operation_report_includes_reviewed_safety_classification() {
    let rendered = render();
    assert!(rendered.contains("`plex.terminate_session`"));
    assert!(rendered.contains("destructive (elicited)"));
    assert!(rendered.contains("`sonarr.get_series`"));
    assert!(rendered.contains("read"));
}
