use super::*;

#[test]
fn generic_endpoint_describes_mutating_and_local_actions() {
    assert!(generic_endpoint("api_delete").contains("DELETE"));
    assert!(generic_endpoint("api_delete").contains("Route-derived"));
    assert!(generic_endpoint("api_get").contains("route-derived"));
    assert!(generic_endpoint("snippet_list").contains("No upstream call"));
}

#[test]
fn route_dependent_actions_render_a_route_derived_scope() {
    // The five route-dependent actions never advertise a static scope; every
    // other action keeps its registry scope (public when none).
    for action in ["api_get", "api_post", "api_put", "api_delete", "op"] {
        assert!(route_dependent(action), "{action} must be route-dependent");
    }
    for action in ["service_status", "download_remove"] {
        assert!(
            !route_dependent(action),
            "{action} must keep its static scope"
        );
    }
}

#[test]
fn route_dependent_mirror_matches_the_library_for_every_action() {
    // The generator's mirror must never drift from the library contract: this
    // asserts parity across the full action inventory, not a hand-pinned list.
    for action in yarr::all_action_names() {
        assert_eq!(
            route_dependent(action),
            yarr::action_has_route_dependent_safety(action),
            "generator mirror drifted from the library for {action}"
        );
    }
}

#[test]
fn small_render_helpers_are_stable() {
    assert_eq!(scope(None), "public");
    assert_eq!(yes_no(true), "yes");
    assert_eq!(yes_no(false), "no");
}
