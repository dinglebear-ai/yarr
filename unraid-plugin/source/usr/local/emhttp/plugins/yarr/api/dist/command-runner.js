"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeCommandRunner = exports.FatalCommandError = void 0;
const node_child_process_1 = require("node:child_process");
const paths_1 = require("./paths");
const secret_redactor_1 = require("./secret-redactor");
class FatalCommandError extends Error {
}
exports.FatalCommandError = FatalCommandError;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;
const MAX_TIMEOUT_MS = 120_000;
const MAX_CAPTURE_BYTES = 1024 * 1024;
const LOCK_CHILD_FD = 3;
const KILL_COMPLETION_TIMEOUT_MS = 2_000;
class SafeCommandRunner {
    spawnCommand;
    killProcessGroup;
    constructor(spawnCommand = (command, args, options) => (0, node_child_process_1.spawn)(command, [...args], options), killProcessGroup = (pid, signal) => {
        process.kill(-pid, signal);
    }) {
        this.spawnCommand = spawnCommand;
        this.killProcessGroup = killProcessGroup;
    }
    async run(command, args, options = {}) {
        assertCommand(command, args, options.inheritedLockFd);
        const timeoutMs = boundedInteger(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1, MAX_TIMEOUT_MS, "command timeout");
        const maxOutputBytes = boundedInteger(options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES, 1, MAX_CAPTURE_BYTES, "command output limit");
        const allowedExitCodes = options.allowedExitCodes ?? [0];
        if (!allowedExitCodes.every((code) => Number.isInteger(code) && code >= 0 && code <= 255)) {
            throw new Error("allowed exit codes are invalid");
        }
        const stdio = options.inheritedLockFd === undefined
            ? ["ignore", "pipe", "pipe"]
            : ["ignore", "pipe", "pipe", options.inheritedLockFd];
        const child = this.spawnCommand(command, args, {
            shell: false,
            detached: true,
            stdio,
            env: { PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" },
        });
        return new Promise((resolve, reject) => {
            let state = child.pid !== undefined && Number.isInteger(child.pid) && child.pid > 0
                ? "running"
                : "starting";
            let terminationError = null;
            let stdout = Buffer.alloc(0);
            let stderr = Buffer.alloc(0);
            let killGuard;
            const cleanup = () => {
                clearTimeout(timer);
                if (killGuard !== undefined)
                    clearTimeout(killGuard);
                child.stdout.off("data", onStdout);
                child.stderr.off("data", onStderr);
            };
            const finishError = (message) => {
                if (state === "settled")
                    return;
                state = "settled";
                cleanup();
                reject(new Error((0, secret_redactor_1.redactSecrets)(message, options.secrets ?? [])));
            };
            const beginTermination = (message) => {
                if (state === "settled" || state === "terminating")
                    return;
                state = "terminating";
                terminationError = new Error((0, secret_redactor_1.redactSecrets)(message, options.secrets ?? []));
                clearTimeout(timer);
                try {
                    if (child.pid === undefined || !Number.isInteger(child.pid) || child.pid <= 0) {
                        throw new Error("child PID is unavailable");
                    }
                    this.killProcessGroup(child.pid, "SIGKILL");
                }
                catch (error) {
                    terminationError = new FatalCommandError(`fatal command termination failure: could not kill process group: ${errorMessage(error)}`);
                }
                child.kill("SIGKILL");
                killGuard = setTimeout(() => {
                    if (state !== "terminating")
                        return;
                    state = "settled";
                    cleanup();
                    reject(new FatalCommandError("fatal command termination failure: process group did not close"));
                }, KILL_COMPLETION_TIMEOUT_MS);
            };
            const capture = (stream, chunk) => {
                if (state === "settled" || state === "terminating")
                    return;
                const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                const current = stream === "stdout" ? stdout : stderr;
                const remaining = Math.max(0, maxOutputBytes - current.length);
                const next = Buffer.concat([current, bytes.subarray(0, remaining)]);
                if (stream === "stdout")
                    stdout = next;
                else
                    stderr = next;
                if (bytes.length > remaining) {
                    beginTermination(`command output exceeded ${maxOutputBytes} bytes: ${next.toString("utf8")}`);
                }
            };
            const onStdout = (chunk) => capture("stdout", chunk);
            const onStderr = (chunk) => capture("stderr", chunk);
            const timer = setTimeout(() => {
                beginTermination(`command timed out after ${timeoutMs}ms`);
            }, timeoutMs);
            child.stdout.on("data", onStdout);
            child.stderr.on("data", onStderr);
            child.on("error", (error) => {
                if (state === "settled" || state === "terminating")
                    return;
                finishError(`command failed to start: ${error.message}`);
            });
            child.once("close", (exitCode, signal) => {
                if (state === "settled")
                    return;
                if (state === "terminating") {
                    state = "settled";
                    cleanup();
                    reject(terminationError ?? new Error("command termination failed"));
                    return;
                }
                cleanup();
                const code = exitCode ?? 255;
                const stdoutText = (0, secret_redactor_1.redactSecrets)(stdout.toString("utf8"), options.secrets ?? []);
                const stderrText = (0, secret_redactor_1.redactSecrets)(stderr.toString("utf8"), options.secrets ?? []);
                if (exitCode === null || !allowedExitCodes.includes(code)) {
                    const detail = stderrText || stdoutText || (signal ? `signal ${signal}` : "no output");
                    finishError(`command exited ${code}: ${detail}`);
                    return;
                }
                state = "settled";
                resolve({ exitCode: code, stdout: stdoutText, stderr: stderrText });
            });
        });
    }
}
exports.SafeCommandRunner = SafeCommandRunner;
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function assertCommand(command, args, inheritedLockFd) {
    if (!command.startsWith("/") || ![paths_1.YARR_RC_PATH, paths_1.YARR_UPDATE_PATH, "/usr/bin/tail"].includes(command)) {
        throw new Error("command is not permitted");
    }
    if (inheritedLockFd !== undefined && (!Number.isInteger(inheritedLockFd) || inheritedLockFd < 0)) {
        throw new Error("inherited lock descriptor is invalid");
    }
    let permitted = false;
    if (command === paths_1.YARR_RC_PATH) {
        const actions = new Set(["start", "stop", "restart", "status", "reload"]);
        permitted =
            (args.length === 1 && actions.has(args[0]) && inheritedLockFd === undefined) ||
                (args.length === 3 &&
                    args[0] === "--lock-fd" &&
                    args[1] === String(LOCK_CHILD_FD) &&
                    actions.has(args[2]) &&
                    inheritedLockFd !== undefined);
    }
    else if (command === paths_1.YARR_UPDATE_PATH) {
        permitted = isUpdaterArgs(args) && inheritedLockFd === undefined;
    }
    else if (command === "/usr/bin/tail") {
        permitted =
            args.length === 4 &&
                args[0] === "-n" &&
                /^(?:[1-9][0-9]?|[1-4][0-9]{2}|500)$/.test(args[1]) &&
                args[2] === "--" &&
                args[3] === paths_1.YARR_LOG_PATH &&
                inheritedLockFd === undefined;
    }
    if (!permitted)
        throw new Error("command arguments are not permitted");
}
function isUpdaterArgs(args) {
    if ((args.length === 1 || args.length === 2) && ["check", "reset"].includes(args[0])) {
        return args.length === 1 || args[1] === "--json";
    }
    if (args[0] !== "apply" || args[1] !== "--version" || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(args[2] ?? "")) {
        return false;
    }
    return args.length === 3 || (args.length === 4 && args[3] === "--json");
}
function boundedInteger(value, minimum, maximum, label) {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${label} must be an integer from ${minimum} to ${maximum}`);
    }
    return value;
}
