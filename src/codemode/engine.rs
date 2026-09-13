//! The rquickjs execution harness.
//!
//! Pure with respect to yarr's domain: it takes the user code, a JS preamble,
//! resource limits, and an opaque [`ToolCaller`] callback. The engine knows
//! nothing about actions, services, or tokio — the caller wires `on_call` to the
//! async dispatcher (typically via a blocking channel round-trip).
//!
//! Execution model: the preamble's `__yarrRun(entry)` kicks off
//! `Promise.resolve().then(() => entry())`, stores the JSON-stringified result on
//! `globalThis.__yarrResult`, and sets `globalThis.__yarrDone`. Because the
//! only async operation (`callTool`) is a *synchronous* blocking native call,
//! draining the microtask queue settles the whole chain — no async JS runtime is
//! required.

use std::sync::{Arc, Mutex};
use std::time::Instant;

use rquickjs::{CatchResultExt, Context, Function, Runtime};

/// Synchronous bridge from JS `callTool` to the host. Given `(action, params_json)`
/// it returns either a result JSON string (`Ok`) or an error message (`Err`, thrown
/// into JS as an `Error`). The engine treats it as opaque; the real implementation
/// blocks on a channel round-trip to the async dispatcher.
///
/// Owned and `'static` because rquickjs stores the native bridge in the JS context
/// (it cannot borrow the caller's stack); the real caller boxes a closure that
/// captures a channel sender (which is `Send`).
pub type ToolCaller = Box<dyn Fn(&str, &str) -> Result<String, String> + Send>;

/// One actual `callTool` bridge invocation observed during a sandbox-only
/// preflight. The host parses these records with the regular action parser; this
/// is deliberately not source-text matching.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlannedToolCall {
    pub id: String,
    pub params_json: String,
}

/// Synchronous bridge for `writeArtifact(path, content, options_json)`: returns a
/// receipt JSON string (`Ok`) or an error message (`Err`, thrown into JS). Same
/// ownership rationale as [`ToolCaller`]; the real impl blocks on a channel
/// round-trip to the async writer.
pub type ArtifactWriter = Box<dyn Fn(&str, &str, &str) -> Result<String, String> + Send>;

/// Synchronous bridge for the internal `codemode.search()` semantic-scoring
/// hook: given the query string, returns a JSON object string
/// (`{"path": similarity, ...}`) — always `Ok`, never `Err`, since semantic
/// search fails open (an empty `{}` object is a completely normal, expected
/// result, not a bridge failure). The `Result` wrapper exists only for
/// consistency with [`ToolCaller`]/[`ArtifactWriter`]'s shape; the real impl
/// never actually returns `Err`. Unlike those two, this is NOT exposed to user
/// scripts as a callable — only the generated `codemode.search` preamble code
/// calls it.
pub type EmbedCaller = Box<dyn Fn(&str) -> Result<String, String> + Send>;

/// Resource limits for one execution.
#[derive(Clone)]
pub struct EngineLimits {
    pub memory_bytes: usize,
    pub stack_bytes: usize,
    /// Absolute wall-clock instant past which execution is aborted.
    pub deadline: Instant,
}

/// The successful outcome of an execution.
#[derive(Debug, Clone, PartialEq)]
pub struct EngineOutcome {
    /// The script's return value (already JSON-decoded from its stringified form).
    pub result: serde_json::Value,
    /// Captured `console.*` lines, in emission order.
    pub logs: Vec<String>,
}

/// Run `user_code` (an async-arrow-function expression, or any expression that
/// evaluates to a function or value) after evaluating `preamble`. Returns the
/// decoded result + captured logs, or an error string (timeout, JS exception, or
/// a thrown tool error).
pub fn run(
    user_code: &str,
    preamble: &str,
    limits: &EngineLimits,
    on_call: ToolCaller,
    on_write: ArtifactWriter,
    on_embed: EmbedCaller,
    input_json: Option<&str>,
) -> Result<EngineOutcome, String> {
    let rt = Runtime::new().map_err(|e| format!("codemode: runtime init failed: {e}"))?;
    rt.set_memory_limit(limits.memory_bytes);
    rt.set_max_stack_size(limits.stack_bytes);
    let deadline = limits.deadline;
    rt.set_interrupt_handler(Some(Box::new(move || Instant::now() >= deadline)));

    let ctx = Context::full(&rt).map_err(|e| format!("codemode: context init failed: {e}"))?;

    // Phase 1 (inside ctx.with): register the native bridge, eval the preamble,
    // and kick off the user code. No microtask runs yet — `__yarrRun` schedules
    // the work and returns immediately.
    ctx.with(|ctx| {
        let emit = Function::new(
            ctx.clone(),
            move |cx: rquickjs::Ctx<'_>,
                  id: String,
                  params_json: String|
                  -> rquickjs::Result<String> {
                match on_call(&id, &params_json) {
                    Ok(result_json) => Ok(result_json),
                    // Throw a proper `Error` object (not a bare string) so user
                    // `catch (e)` blocks see `e.message` and `e instanceof Error`.
                    Err(message) => Err(rquickjs::Exception::throw_message(&cx, &message)),
                }
            },
        )
        .map_err(|e| format!("codemode: failed to register bridge: {e}"))?;
        ctx.globals()
            .set("__yarrEmitToolCall", emit)
            .map_err(|e| format!("codemode: failed to install bridge: {e}"))?;

        let write = Function::new(
            ctx.clone(),
            move |cx: rquickjs::Ctx<'_>,
                  path: String,
                  content: String,
                  options_json: String|
                  -> rquickjs::Result<String> {
                match on_write(&path, &content, &options_json) {
                    Ok(receipt_json) => Ok(receipt_json),
                    Err(message) => Err(rquickjs::Exception::throw_message(&cx, &message)),
                }
            },
        )
        .map_err(|e| format!("codemode: failed to register artifact bridge: {e}"))?;
        ctx.globals()
            .set("__yarrEmitWriteArtifact", write)
            .map_err(|e| format!("codemode: failed to install artifact bridge: {e}"))?;

        // Internal-only bridge for codemode.search()'s semantic-scoring blend —
        // not part of the documented scripting API, so it's deliberately not
        // wrapped in a validating global the way callTool/writeArtifact are.
        // Never throws: on_embed always returns Ok (see EmbedCaller's docs).
        let embed = Function::new(
            ctx.clone(),
            move |cx: rquickjs::Ctx<'_>, query: String| -> rquickjs::Result<String> {
                match on_embed(&query) {
                    Ok(scores_json) => Ok(scores_json),
                    Err(message) => Err(rquickjs::Exception::throw_message(&cx, &message)),
                }
            },
        )
        .map_err(|e| format!("codemode: failed to register embed bridge: {e}"))?;
        ctx.globals()
            .set("__yarrEmbedQuery", embed)
            .map_err(|e| format!("codemode: failed to install embed bridge: {e}"))?;

        // Bind the snippet `input` as a JSON STRING global (typed set — no source
        // splicing, so no escaping pitfalls); the preamble parses it into
        // `globalThis.input`. Set BEFORE the preamble runs.
        if let Some(input) = input_json {
            ctx.globals()
                .set("__yarrInputJson", input)
                .map_err(|e| format!("codemode: failed to bind input: {e}"))?;
        }

        ctx.eval::<(), _>(preamble)
            .catch(&ctx)
            .map_err(|e| format!("codemode: preamble error: {e}"))?;

        // `user_code` is wrapped, not concatenated into a statement position, so a
        // bare arrow-function expression parses (and a leading newline guards
        // against a `//` line-comment swallowing the closing paren).
        let invoke = format!("__yarrRun(\n{user_code}\n)");
        ctx.eval::<(), _>(invoke.as_bytes())
            .catch(&ctx)
            .map_err(|e| format!("codemode: script error: {e}"))?;
        Ok::<(), String>(())
    })?;

    // Phase 2 (OUTSIDE ctx.with, else the runtime double-borrows): drain microtasks
    // until the chain settles. Each job may run the synchronous `callTool` bridge,
    // which blocks this thread on the dispatcher round-trip.
    drain_jobs(&rt, deadline)?;

    // Phase 3: read back the result + logs.
    ctx.with(|ctx| {
        let done: bool = ctx
            .globals()
            .get("__yarrDone")
            .map_err(|e| format!("codemode: missing completion flag: {e}"))?;
        if !done {
            return Err(
                "codemode: script did not settle (did it return a never-resolving promise?)"
                    .to_string(),
            );
        }
        let result_json: String = ctx
            .globals()
            .get("__yarrResult")
            .map_err(|e| format!("codemode: missing result: {e}"))?;
        // Don't silently return empty logs if the readback fails (e.g. the script
        // clobbered `__yarrLogs`): surface a warning line so the agent can tell
        // "no console output" from "console output was lost".
        let logs: Vec<String> = match ctx.globals().get("__yarrLogs") {
            Ok(logs) => logs,
            Err(e) => vec![format!("WARN codemode: console logs unavailable: {e}")],
        };

        let value: serde_json::Value = serde_json::from_str(&result_json)
            .map_err(|e| format!("codemode: result was not valid JSON: {e}"))?;
        // A thrown/rejected script is promoted to a host error. Gate on the dedicated
        // `__yarrError` flag the preamble sets on its reject path — NOT on the
        // presence of an `__codemode_error` key in the result — so a script that
        // legitimately returns `{ __codemode_error: ... }` isn't misread as a failure.
        let errored: bool = ctx.globals().get("__yarrError").unwrap_or(false);
        if errored {
            let message = value
                .get("__codemode_error")
                .and_then(serde_json::Value::as_str)
                .unwrap_or("unknown script error");
            return Err(format!("codemode: script error: {message}"));
        }
        Ok(EngineOutcome {
            result: value,
            logs,
        })
    })
}

/// Run the script in the same QuickJS sandbox without dispatching host actions,
/// returning the call sequence the script actually reaches. Each call receives
/// `null`, allowing independent sequential calls to be collected while making no
/// upstream request or artifact write.
#[cfg(test)]
pub fn plan_tool_calls(
    user_code: &str,
    preamble: &str,
    limits: &EngineLimits,
    input_json: Option<&str>,
) -> Result<Vec<PlannedToolCall>, String> {
    plan_tool_calls_with_caller(
        user_code,
        preamble,
        limits,
        input_json,
        Box::new(|_, _| Ok("null".to_owned())),
    )
}

/// Execute the planning sandbox while routing each non-destructive call through
/// `on_call`. The caller decides which calls may dispatch and supplies their real
/// JSON results; destructive calls can therefore be recorded without transport
/// while prior reads still drive data-dependent JavaScript branches.
pub fn plan_tool_calls_with_caller(
    user_code: &str,
    preamble: &str,
    limits: &EngineLimits,
    input_json: Option<&str>,
    on_call: ToolCaller,
) -> Result<Vec<PlannedToolCall>, String> {
    let calls = Arc::new(Mutex::new(Vec::new()));
    let recorded = Arc::clone(&calls);
    run(
        user_code,
        preamble,
        limits,
        Box::new(move |id, params_json| {
            recorded
                .lock()
                .map_err(|_| "codemode preflight state is unavailable".to_string())?
                .push(PlannedToolCall {
                    id: id.to_owned(),
                    params_json: params_json.to_owned(),
                });
            on_call(id, params_json)
        }),
        Box::new(|_, _, _| Ok("null".to_owned())),
        Box::new(|_| Ok("{}".to_owned())),
        input_json,
    )?;
    calls
        .lock()
        .map(|calls| calls.clone())
        .map_err(|_| "codemode preflight state is unavailable".to_string())
}

/// Drain the QuickJS job queue until empty, enforcing the deadline. Returns a
/// timeout error if the deadline passes mid-drain.
fn drain_jobs(rt: &Runtime, deadline: Instant) -> Result<(), String> {
    while rt.is_job_pending() {
        if Instant::now() >= deadline {
            return Err("codemode absolute deadline exceeded".to_string());
        }
        rt.execute_pending_job()
            .map_err(|e| format!("codemode: job error: {e:?}"))?;
    }
    if Instant::now() >= deadline {
        return Err("codemode absolute deadline exceeded".to_string());
    }
    Ok(())
}

#[cfg(test)]
#[path = "engine_tests.rs"]
mod tests;
