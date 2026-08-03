//! JS preamble generation.
//!
//! Builds the boilerplate injected before user code: the `callTool` bridge,
//! a `console` shim that captures output, the `__yarrRun` driver that settles
//! the script into `globalThis.__yarrResult`, and the per-service callable
//! namespaces — `globalThis.<service>.<verb>(params)`, one object per *configured*
//! service, the yarr analogue of lab's `codemode.<upstream>.<tool>` proxies and
//! Cloudflare's `<connector>.<method>`. The service is baked into every callable,
//! so a script never passes a `service` param and never enumerates services. The
//! raw passthrough client stays under `api.<service>.{get,post,put,delete}`.

use crate::codemode::catalog::service_action_names;
use crate::config::ServiceKind;

/// The fixed JS runtime injected before user code: capture-aware `console`, the
/// `callTool` bridge over the native emit, and the `__yarrRun` driver.
const RUNTIME_JS: &str = r#"
globalThis.__yarrLogs = [];
const __yarrFmt = (args) => args.map((a) => {
    if (typeof a === "string") return a;
    try { return JSON.stringify(a); } catch (_) { return String(a); }
}).join(" ");
globalThis.console = {
    log: (...a) => { globalThis.__yarrLogs.push(__yarrFmt(a)); },
    info: (...a) => { globalThis.__yarrLogs.push(__yarrFmt(a)); },
    warn: (...a) => { globalThis.__yarrLogs.push("WARN " + __yarrFmt(a)); },
    error: (...a) => { globalThis.__yarrLogs.push("ERROR " + __yarrFmt(a)); },
    debug: (...a) => { globalThis.__yarrLogs.push(__yarrFmt(a)); },
};
globalThis.callTool = (id, params = {}) => {
    if (typeof id !== "string" || id.trim() === "") {
        throw new TypeError("callTool(id, params): id must be a non-empty string");
    }
    if (params === null || typeof params !== "object" || Array.isArray(params)) {
        throw new TypeError("callTool(id, params): params must be a JSON object");
    }
    return JSON.parse(__yarrEmitToolCall(id, JSON.stringify(params)));
};
globalThis.writeArtifact = (path, content, options = {}) => {
    if (typeof path !== "string" || path.trim() === "") {
        throw new TypeError("writeArtifact(path, content): path must be a non-empty string");
    }
    if (typeof content !== "string") {
        throw new TypeError("writeArtifact(path, content): content must be a string");
    }
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
        throw new TypeError("writeArtifact(path, content, options): options must be a JSON object");
    }
    return JSON.parse(__yarrEmitWriteArtifact(path, content, JSON.stringify(options)));
};
globalThis.input = (typeof globalThis.__yarrInputJson === "string")
    ? JSON.parse(globalThis.__yarrInputJson) : null;
globalThis.__yarrDone = false;
globalThis.__yarrError = false;
globalThis.__yarrResult = "null";
globalThis.__yarrRun = (entry) => {
    Promise.resolve()
        .then(() => (typeof entry === "function" ? entry() : entry))
        .then((value) => {
            try { globalThis.__yarrResult = JSON.stringify(value === undefined ? null : value) || "null"; }
            catch (e) {
                // Serialization failed: this IS a host-surfaced error, so set the flag.
                globalThis.__yarrError = true;
                globalThis.__yarrResult = JSON.stringify({ __codemode_error: "result not serializable: " + String(e) });
            }
        })
        .catch((err) => {
            const message = (err && err.message) ? err.message : String(err);
            globalThis.__yarrError = true;
            globalThis.__yarrResult = JSON.stringify({ __codemode_error: message });
        })
        .finally(() => { globalThis.__yarrDone = true; });
};
"#;

/// Build the complete preamble: the fixed runtime, the per-service callable
/// namespaces (`<service>.<verb>()`, one object per configured service), and the
/// raw `api.<service>` client (sugar over the `api_*` passthrough actions).
/// `callTool` remains available as the low-level escape hatch.
///
/// `services` are the configured `(name, kind)` pairs (from
/// `YarrService::configured_service_kinds`); pass `&[]` when there are none.
pub fn build_preamble(services: &[(String, ServiceKind)]) -> String {
    let mut out = String::with_capacity(RUNTIME_JS.len() + 4096);
    out.push_str(RUNTIME_JS);
    out.push_str(&render_service_namespaces(services));
    let service_names: Vec<String> = services.iter().map(|(name, _)| name.clone()).collect();
    out.push_str(&render_api_namespace(&service_names));
    // Discovery: inject the per-service ACTION catalog + the per-service TYPE
    // catalog (response-shape TS interfaces), then the pure-JS search/describe
    // helpers. Types are surfaced ON DEMAND — only what the agent describes is
    // returned to it — so the full type surface is never dumped into its context.
    out.push_str("globalThis.__codemodeCatalog = ");
    out.push_str(&super::catalog::catalog_json(services));
    out.push_str(";\n");
    out.push_str("globalThis.__codemodeTypes = ");
    out.push_str(&super::dts::type_catalog_json_for(services));
    out.push_str(";\n");
    out.push_str(DISCOVERY_JS);
    out
}

/// Render the per-service callable namespaces. For each configured service, emit a
/// `globalThis.<name>` object whose methods are the actions valid for that kind
/// (`service_status` + the kind's curated commands). Each method bakes the service
/// into the params, so the script calls e.g. `sonarr.list()` / `radarr.add({...})`
/// with no `service` argument.
fn render_service_namespaces(services: &[(String, ServiceKind)]) -> String {
    let mut out = String::new();
    for (name, kind) in services {
        assert!(
            !crate::config::services::CODEMODE_RESERVED_GLOBALS
                .iter()
                .any(|reserved| reserved.eq_ignore_ascii_case(name)),
            "configured service `{name}` collides with a reserved Code Mode global; configuration validation must run before preamble generation"
        );
        // `{name:?}` emits a quoted, escaped JS string literal. `service` is merged
        // LAST so a script can never override the baked-in binding.
        out.push_str(&format!("globalThis[{name:?}] = {{\n"));
        if crate::openapi::is_generated(*kind) {
            // Spec-backed kind: every callable is a generated OpenAPI operation,
            // dispatched through the `op` action. `args` carries path/query params
            // and (for body ops) `args.body`.
            out.push_str(&format!(
                "  [\"service_status\"]: (params) => callTool(\"service_status\", {{ service: {name:?} }}),\n"
            ));
            for op in crate::openapi::operations_for_kind(*kind) {
                let op_name = op.name;
                out.push_str(&format!(
                    "  [{op_name:?}]: (params) => callTool(\"op\", \
                     {{ service: {name:?}, op: {op_name:?}, args: params || {{}} }}),\n"
                ));
            }
        } else {
            for action in service_action_names(*kind) {
                out.push_str(&format!(
                    "  [{action:?}]: (params) => callTool({action:?}, \
                     Object.assign({{}}, params || {{}}, {{ service: {name:?} }})),\n"
                ));
            }
        }
        out.push_str("};\n");
    }
    out
}

/// Pure-JS `codemode.search`/`codemode.describe` over the injected callable +
/// type catalogs. Catalog entries are keyed by `path` — the exact fully-qualified
/// callable (`sonarr.list`) — so search returns something the script can call
/// directly. `describe` resolves either a callable `path` or a `service.TypeName`
/// response type (returning its TS interface).
///
/// `codemode.search` is otherwise pure JS (no host round-trip) except for one
/// call to `__yarrEmbedQuery` — the semantic-scoring bridge (see
/// `codemode::semantic`) — whose result is blended into the lexical score below.
/// That bridge fails open to `"{}"` (empty scores) whenever semantic search is
/// disabled, cooling down after a TEI failure, or the query is empty, so this
/// blend is always safe to attempt unconditionally: worst case it's a no-op, not
/// an error. Only callables get the semantic blend, not response types — the
/// catalog embedded against is the callable catalog, and "find me the tool for
/// X" is the query shape semantic search exists for.
const DISCOVERY_JS: &str = r#"
globalThis.codemode = globalThis.codemode || {};
globalThis.codemode.search = (query, limit) => {
    const rawQuery = String(query == null ? "" : query).trim();
    const q = rawQuery.toLowerCase();
    const lim = (typeof limit === "number" && limit > 0) ? limit : 20;
    const toks = q.split(/\s+/).filter(Boolean);
    // A cosine similarity of ~0.7-0.9 (a strong semantic match) contributes
    // ~14-18 points here — enough for a query with ZERO lexical token overlap
    // (e.g. a synonym) to still clear the `score > 0` results filter below, but
    // still ranked under a true exact/substring path match (score 50-100) or a
    // couple of solid lexical token hits (+5 each). Semantic search is a net
    // under lexical matching, not a replacement for it.
    const SEMANTIC_WEIGHT = 20;
    const semanticScores = q === "" ? {} : JSON.parse(__yarrEmbedQuery(rawQuery));
    const callHits = globalThis.__codemodeCatalog.map((e) => {
        const hay = (e.path + " " + e.method + " " + (e.description || "") + " " + (e.capability || "")).toLowerCase();
        let score = 0;
        if (e.path.toLowerCase() === q || e.method.toLowerCase() === q) score += 100;
        else if (e.path.toLowerCase().indexOf(q) !== -1) score += 50;
        for (const tok of toks) { if (hay.indexOf(tok) !== -1) score += 5; }
        const semantic = semanticScores[e.path];
        if (typeof semantic === "number" && semantic > 0) score += semantic * SEMANTIC_WEIGHT;
        return { e: { path: e.path, service: e.service, method: e.method, kind: e.kind, scope: e.scope, destructive: e.destructive, description: e.description }, score: score };
    });
    const typeHits = globalThis.__codemodeTypes.map((t) => {
        const hay = (t.name + " " + t.type_name).toLowerCase();
        let score = 0;
        if (t.name.toLowerCase() === q || t.type_name.toLowerCase() === q) score += 100;
        else if (hay.indexOf(q) !== -1) score += 40;
        for (const tok of toks) { if (hay.indexOf(tok) !== -1) score += 4; }
        return { e: { path: t.name, kind: "type", service: t.service }, score: score };
    });
    const scored = callHits.concat(typeHits).filter((x) => q === "" || x.score > 0);
    scored.sort((a, b) => b.score - a.score || a.e.path.localeCompare(b.e.path));
    const results = scored.slice(0, lim).map((x) => x.e);
    return { total: results.length, results: results };
};
globalThis.codemode.describe = (name) => {
    // A callable, by its fully-qualified path (e.g. "radarr.add")?
    const call = globalThis.__codemodeCatalog.find((e) => e.path === name);
    if (call) {
        const sig = call.path + "(" + (call.required_params || []).join(", ") + ")";
        return Object.assign({}, call, { signature: sig });
    }
    // A response type, by "service.TypeName" or an unambiguous bare "TypeName".
    let type = globalThis.__codemodeTypes.find((t) => t.name === name);
    if (!type) {
        const bare = globalThis.__codemodeTypes.filter((t) => t.type_name === name);
        if (bare.length === 1) type = bare[0];
    }
    if (type) return { name: type.name, kind: "type", service: type.service, dts: type.dts };
    return null;
};
globalThis.codemode.snippets = () => callTool("snippet_list", {});
globalThis.codemode.run = (name, input) =>
    callTool("snippet_run", { name: name, input: (input === undefined ? null : input) });
"#;

/// Render the `api.<service>` client: per configured service, `get/post/put/delete`
/// helpers that are thin sugar over the generic `api_*` passthrough actions
/// (`api.sonarr.get("/series")` → `callTool("api_get", {service:"sonarr", path})`).
/// `delete` resolves to `api_delete`. MCP executions reauthorize the inner call
/// and require elicitation; direct trusted CLI executions have no peer channel.
fn render_api_namespace(service_names: &[String]) -> String {
    let mut out = String::from("globalThis.api = {};\n");
    for name in service_names {
        // `{name:?}` emits a quoted, escaped JS string literal — never raw
        // interpolation. `body` is forwarded as-is (undefined drops out of the
        // JSON object, so the server-side body default applies).
        out.push_str(&format!(
            "globalThis.api[{name:?}] = {{\n  \
               get: (path) => callTool(\"api_get\", {{ service: {name:?}, path: path }}),\n  \
               post: (path, body) => callTool(\"api_post\", {{ service: {name:?}, path: path, body: body }}),\n  \
               put: (path, body) => callTool(\"api_put\", {{ service: {name:?}, path: path, body: body }}),\n  \
               delete: (path, body) => callTool(\"api_delete\", {{ service: {name:?}, path: path, body: body }}),\n\
             }};\n"
        ));
    }
    out
}

#[cfg(test)]
#[path = "proxy_tests.rs"]
mod tests;
