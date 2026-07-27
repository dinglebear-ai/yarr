"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeService = exports.NodeHttpClient = exports.NodeRuntimeFileSystem = void 0;
const promises_1 = require("node:fs/promises");
const http = __importStar(require("node:http"));
const command_runner_1 = require("./command-runner");
const config_codec_1 = require("./config-codec");
const paths_1 = require("./paths");
const secret_redactor_1 = require("./secret-redactor");
const HTTP_TIMEOUT_MS = 2_000;
const HTTP_MAX_BYTES = 64 * 1024;
const READY_ATTEMPTS = 30;
const READY_INTERVAL_MS = 1_000;
class NodeRuntimeFileSystem {
    async readFile(path) {
        return (0, promises_1.readFile)(path, "utf8");
    }
}
exports.NodeRuntimeFileSystem = NodeRuntimeFileSystem;
class NodeHttpClient {
    async get(url, options) {
        if (!url.startsWith("http://"))
            throw new Error("runtime probes require HTTP");
        return new Promise((resolve, reject) => {
            const request = http.get(url, { timeout: options.timeoutMs }, (response) => {
                let bytes = 0;
                const chunks = [];
                response.on("data", (chunk) => {
                    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                    bytes += buffer.length;
                    if (bytes > options.maxBytes) {
                        request.destroy(new Error("runtime probe response overflow"));
                        return;
                    }
                    chunks.push(buffer);
                });
                response.on("end", () => {
                    resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") });
                });
            });
            request.once("timeout", () => request.destroy(new Error("runtime probe timed out")));
            request.once("error", reject);
        });
    }
}
exports.NodeHttpClient = NodeHttpClient;
class RuntimeService {
    commands;
    files;
    httpClient;
    sleep;
    readyAttempts;
    constructor(commands = new command_runner_1.SafeCommandRunner(), files = new NodeRuntimeFileSystem(), httpClient = new NodeHttpClient(), sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)), readyAttempts = READY_ATTEMPTS) {
        this.commands = commands;
        this.files = files;
        this.httpClient = httpClient;
        this.sleep = sleep;
        this.readyAttempts = readyAttempts;
    }
    async status(options = {}) {
        let bindAddress = "127.0.0.1";
        let port = 40070;
        let secrets = [...(options.secrets ?? [])];
        try {
            const plugin = (0, config_codec_1.parsePluginConfig)(await this.files.readFile(paths_1.YARR_PLUGIN_CONFIG_PATH));
            const environment = (0, config_codec_1.parseYarrEnvironment)(await this.files.readFile(paths_1.YARR_ENVIRONMENT_PATH));
            const view = (0, config_codec_1.toPublicConfig)(plugin, environment);
            bindAddress = effectiveBindAddress(view.plugin.bindMode, view.plugin.customHost);
            port = view.plugin.port;
            secrets = [...secrets, ...(0, secret_redactor_1.collectSecretValues)(environment.values)];
        }
        catch (error) {
            if (error instanceof command_runner_1.FatalCommandError) {
                throw new command_runner_1.FatalCommandError((0, secret_redactor_1.redactSecrets)(errorMessage(error), secrets));
            }
            return runtimeError(bindAddress, port, (0, secret_redactor_1.redactSecrets)(errorMessage(error), secrets));
        }
        try {
            const result = await this.commands.run(paths_1.YARR_RC_PATH, lifecycleArgs("status", options.lockFd), {
                allowedExitCodes: [0, 3],
                inheritedLockFd: options.lockFd,
                secrets,
            });
            if (result.exitCode === 3 && result.stdout === "yarr: STOPPED\n") {
                return {
                    state: "stopped",
                    pid: null,
                    version: null,
                    bindAddress,
                    port,
                    ready: false,
                    healthMessage: "stopped",
                    uptimeSeconds: null,
                };
            }
            if (result.exitCode !== 0 || result.stdout !== "yarr: RUNNING\n") {
                return runtimeError(bindAddress, port, "unexpected rc.yarr status response");
            }
            const pid = await this.readPid();
            const baseUrl = `http://${urlHost(probeAddress(bindAddress))}:${port}`;
            const readyResponse = await this.httpClient.get(`${baseUrl}/ready`, {
                timeoutMs: HTTP_TIMEOUT_MS,
                maxBytes: HTTP_MAX_BYTES,
            });
            const readyBody = parseObject(readyResponse.body);
            const ready = readyResponse.status >= 200 &&
                readyResponse.status < 300 &&
                readyBody?.status === "ready";
            if (!ready) {
                return {
                    state: "starting",
                    pid,
                    version: null,
                    bindAddress,
                    port,
                    ready: false,
                    healthMessage: `readiness probe failed: HTTP ${readyResponse.status}`,
                    uptimeSeconds: null,
                };
            }
            const statusResponse = await this.httpClient.get(`${baseUrl}/status`, {
                timeoutMs: HTTP_TIMEOUT_MS,
                maxBytes: HTTP_MAX_BYTES,
            });
            const statusBody = parseObject(statusResponse.body);
            const candidateVersion = statusResponse.status >= 200 &&
                statusResponse.status < 300 &&
                typeof statusBody?.version === "string"
                ? statusBody.version
                : null;
            const version = candidateVersion !== null &&
                isBoundedSemVer(candidateVersion) &&
                (0, secret_redactor_1.redactSecrets)(candidateVersion, secrets) === candidateVersion
                ? candidateVersion
                : null;
            return {
                state: "running",
                pid,
                version,
                bindAddress,
                port,
                ready: true,
                healthMessage: "ready",
                uptimeSeconds: null,
            };
        }
        catch (error) {
            if (error instanceof command_runner_1.FatalCommandError) {
                throw new command_runner_1.FatalCommandError((0, secret_redactor_1.redactSecrets)(errorMessage(error), secrets));
            }
            return runtimeError(bindAddress, port, (0, secret_redactor_1.redactSecrets)(errorMessage(error), secrets));
        }
    }
    async start(options = {}) {
        const current = await this.status(options);
        if (current.state === "running" && current.ready)
            return current;
        await this.runAction("start", options);
        return this.waitUntilReady(options);
    }
    async stop(options = {}) {
        const current = await this.status(options);
        if (current.state === "stopped")
            return current;
        await this.runAction("stop", options);
        return this.status(options);
    }
    async restart(options = {}) {
        await this.runAction("restart", options);
        return this.waitUntilReady(options);
    }
    async waitUntilReady(options = {}) {
        let last;
        for (let attempt = 0; attempt < this.readyAttempts; attempt += 1) {
            last = await this.status(options);
            if (last.state === "running" && last.ready)
                return last;
            if (attempt + 1 < this.readyAttempts)
                await this.sleep(READY_INTERVAL_MS);
        }
        throw new Error((0, secret_redactor_1.redactSecrets)(last?.healthMessage ?? "readiness check failed", options.secrets ?? []));
    }
    async runAction(action, options) {
        let secrets = [...(options.secrets ?? [])];
        try {
            const environment = (0, config_codec_1.parseYarrEnvironment)(await this.files.readFile(paths_1.YARR_ENVIRONMENT_PATH));
            secrets = [...secrets, ...(0, secret_redactor_1.collectSecretValues)(environment.values)];
            await this.commands.run(paths_1.YARR_RC_PATH, lifecycleArgs(action, options.lockFd), {
                inheritedLockFd: options.lockFd,
                secrets,
                timeoutMs: 60_000,
            });
        }
        catch (error) {
            const message = (0, secret_redactor_1.redactSecrets)(errorMessage(error), secrets);
            if (error instanceof command_runner_1.FatalCommandError)
                throw new command_runner_1.FatalCommandError(message);
            throw new Error(message);
        }
    }
    async readPid() {
        try {
            const text = (await this.files.readFile(paths_1.YARR_PID_PATH)).trim();
            if (!/^[1-9][0-9]*$/.test(text))
                return null;
            const pid = Number(text);
            return Number.isSafeInteger(pid) ? pid : null;
        }
        catch {
            return null;
        }
    }
}
exports.RuntimeService = RuntimeService;
function lifecycleArgs(action, lockFd) {
    return lockFd === undefined ? [action] : ["--lock-fd", "3", action];
}
function effectiveBindAddress(mode, customHost) {
    if (mode === "loopback")
        return "127.0.0.1";
    if (mode === "lan")
        return "0.0.0.0";
    return customHost;
}
function probeAddress(address) {
    return address === "0.0.0.0" || address === "127.0.0.1" ? "127.0.0.1" : address;
}
function urlHost(host) {
    return host.includes(":") ? `[${host}]` : host;
}
function parseObject(body) {
    try {
        const value = JSON.parse(body);
        return value !== null && typeof value === "object" && !Array.isArray(value)
            ? value
            : null;
    }
    catch {
        return null;
    }
}
function runtimeError(bindAddress, port, healthMessage) {
    return {
        state: "error",
        pid: null,
        version: null,
        bindAddress,
        port,
        ready: false,
        healthMessage,
        uptimeSeconds: null,
    };
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function isBoundedSemVer(value) {
    if (value.length === 0 || value.length > 128)
        return false;
    const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/.exec(value);
    if (!match || match.slice(1, 4).some((part) => part.length > 10))
        return false;
    const prerelease = match[4];
    const build = match[5];
    if (prerelease !== undefined && !validIdentifiers(prerelease, true))
        return false;
    return build === undefined || validIdentifiers(build, false);
}
function validIdentifiers(value, rejectNumericLeadingZero) {
    const identifiers = value.split(".");
    return identifiers.every((identifier) => identifier.length > 0 &&
        identifier.length <= 32 &&
        /^[0-9A-Za-z-]+$/.test(identifier) &&
        (!rejectNumericLeadingZero || !/^0[0-9]+$/.test(identifier)));
}
