"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlockService = exports.LockLostError = void 0;
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const paths_1 = require("./paths");
const PRODUCTION_FLOCK_PATH = "/usr/bin/flock";
const CHILD_LOCK_FD = 3;
const FLOCK_WAIT_SECONDS = 10;
const DEFAULT_ACQUISITION_TIMEOUT_MS = 11_000;
const MAX_ACQUISITION_OUTPUT_BYTES = 1024;
class LockLostError extends Error {
}
exports.LockLostError = LockLostError;
class FlockService {
    openLock;
    spawnFlock;
    flockPath;
    acquisitionTimeoutMs;
    constructor(options = {}) {
        this.openLock = options.openLock ?? (async () => (0, promises_1.open)(paths_1.YARR_LOCK_PATH, "a+", 0o600));
        this.spawnFlock =
            options.spawn ??
                ((command, args, spawnOptions) => (0, node_child_process_1.spawn)(command, [...args], spawnOptions));
        this.flockPath = options.flockPath ?? PRODUCTION_FLOCK_PATH;
        this.acquisitionTimeoutMs = options.acquisitionTimeoutMs ?? DEFAULT_ACQUISITION_TIMEOUT_MS;
        if (!this.flockPath.startsWith("/")) {
            throw new Error("flock executable path must be absolute");
        }
    }
    async withLock(callback) {
        const lockFile = await this.openLock();
        try {
            await lockFile.chmod(0o600);
            await this.acquire(lockFile.fd);
            const lease = {
                fd: lockFile.fd,
                assertHeld: () => undefined,
            };
            return await callback(lease);
        }
        finally {
            await lockFile.close();
        }
    }
    async acquire(parentFd) {
        let child;
        try {
            child = this.spawnFlock(this.flockPath, ["--exclusive", "--wait", String(FLOCK_WAIT_SECONDS), String(CHILD_LOCK_FD)], {
                shell: false,
                stdio: ["ignore", "pipe", "pipe", parentFd],
                env: { PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" },
            });
        }
        catch (error) {
            throw new LockLostError(`could not start flock: ${errorMessage(error)}`);
        }
        await new Promise((resolve, reject) => {
            let settled = false;
            let stdout = Buffer.alloc(0);
            let stderr = Buffer.alloc(0);
            const fail = (error, kill = false) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                if (kill)
                    child.kill("SIGKILL");
                reject(error);
            };
            const capture = (stream, chunk) => {
                if (settled)
                    return;
                const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                const current = stream === "stdout" ? stdout : stderr;
                const remaining = Math.max(0, MAX_ACQUISITION_OUTPUT_BYTES - current.length);
                const next = Buffer.concat([current, bytes.subarray(0, remaining)]);
                if (stream === "stdout")
                    stdout = next;
                else
                    stderr = next;
                if (bytes.length > remaining) {
                    fail(new LockLostError("flock output overflow"), true);
                }
            };
            const timer = setTimeout(() => {
                fail(new LockLostError("timed out acquiring Yarr plugin lock"), true);
            }, this.acquisitionTimeoutMs);
            child.stdout.on("data", (chunk) => capture("stdout", chunk));
            child.stderr.on("data", (chunk) => capture("stderr", chunk));
            child.once("error", (error) => fail(new LockLostError(`could not start flock: ${error.message}`)));
            child.once("close", (exitCode, signal) => {
                if (settled)
                    return;
                clearTimeout(timer);
                if (exitCode !== 0) {
                    const detail = stderr.toString("utf8") || stdout.toString("utf8") || signal || "no output";
                    fail(new LockLostError(`flock exited ${exitCode ?? "without a code"}: ${detail}`));
                    return;
                }
                settled = true;
                resolve();
            });
        });
    }
}
exports.FlockService = FlockService;
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
