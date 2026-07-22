import { readFile } from "node:fs/promises";
import * as http from "node:http";

import {
  collectSecretValues,
  redactSecrets,
  SafeCommandRunner,
  type CommandRunner,
} from "./command-runner";
import { parsePluginConfig, parseYarrEnvironment, toPublicConfig } from "./config-codec";
import {
  YARR_ENVIRONMENT_PATH,
  YARR_PID_PATH,
  YARR_PLUGIN_CONFIG_PATH,
  YARR_RC_PATH,
} from "./paths";

export interface RuntimeState {
  state: "running" | "stopped" | "starting" | "error";
  pid: number | null;
  version: string | null;
  bindAddress: string;
  port: number;
  ready: boolean;
  healthMessage: string;
  uptimeSeconds: number | null;
}

export interface RuntimeFileSystem {
  readFile(path: string): Promise<string>;
}

export interface HttpResponse {
  status: number;
  body: string;
}

export interface HttpClient {
  get(url: string, options: { timeoutMs: number; maxBytes: number }): Promise<HttpResponse>;
}

export interface RuntimeOptions {
  lockFd?: number;
  secrets?: readonly string[];
}

const HTTP_TIMEOUT_MS = 2_000;
const HTTP_MAX_BYTES = 64 * 1024;
const READY_ATTEMPTS = 30;
const READY_INTERVAL_MS = 1_000;

export class NodeRuntimeFileSystem implements RuntimeFileSystem {
  async readFile(path: string): Promise<string> {
    return readFile(path, "utf8");
  }
}

export class NodeHttpClient implements HttpClient {
  async get(url: string, options: { timeoutMs: number; maxBytes: number }): Promise<HttpResponse> {
    if (!url.startsWith("http://")) throw new Error("runtime probes require HTTP");
    return new Promise<HttpResponse>((resolve, reject) => {
      const request = http.get(url, { timeout: options.timeoutMs }, (response) => {
        let bytes = 0;
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer | string) => {
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

export class RuntimeService {
  constructor(
    private readonly commands: CommandRunner = new SafeCommandRunner(),
    private readonly files: RuntimeFileSystem = new NodeRuntimeFileSystem(),
    private readonly httpClient: HttpClient = new NodeHttpClient(),
    private readonly sleep: (milliseconds: number) => Promise<void> = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    private readonly readyAttempts = READY_ATTEMPTS,
  ) {}

  async status(options: RuntimeOptions = {}): Promise<RuntimeState> {
    let bindAddress = "127.0.0.1";
    let port = 40070;
    let secrets = [...(options.secrets ?? [])];
    try {
      const plugin = parsePluginConfig(await this.files.readFile(YARR_PLUGIN_CONFIG_PATH));
      const environment = parseYarrEnvironment(await this.files.readFile(YARR_ENVIRONMENT_PATH));
      const view = toPublicConfig(plugin, environment);
      bindAddress = effectiveBindAddress(view.plugin.bindMode, view.plugin.customHost);
      port = view.plugin.port;
      secrets = [...secrets, ...collectSecretValues(environment.values)];
    } catch (error) {
      return runtimeError(bindAddress, port, redactSecrets(errorMessage(error), secrets));
    }

    try {
      const result = await this.commands.run(YARR_RC_PATH, lifecycleArgs("status", options.lockFd), {
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
      const ready =
        readyResponse.status >= 200 &&
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
      const version =
        statusResponse.status >= 200 &&
        statusResponse.status < 300 &&
        typeof statusBody?.version === "string"
          ? statusBody.version
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
    } catch (error) {
      return runtimeError(bindAddress, port, redactSecrets(errorMessage(error), secrets));
    }
  }

  async start(options: RuntimeOptions = {}): Promise<RuntimeState> {
    const current = await this.status(options);
    if (current.state === "running" && current.ready) return current;
    await this.runAction("start", options);
    return this.waitUntilReady(options);
  }

  async stop(options: RuntimeOptions = {}): Promise<RuntimeState> {
    const current = await this.status(options);
    if (current.state === "stopped") return current;
    await this.runAction("stop", options);
    return this.status(options);
  }

  async restart(options: RuntimeOptions = {}): Promise<RuntimeState> {
    await this.runAction("restart", options);
    return this.waitUntilReady(options);
  }

  async waitUntilReady(options: RuntimeOptions = {}): Promise<RuntimeState> {
    let last: RuntimeState | undefined;
    for (let attempt = 0; attempt < this.readyAttempts; attempt += 1) {
      last = await this.status(options);
      if (last.ready || last.state === "stopped") return last;
      if (attempt + 1 < this.readyAttempts) await this.sleep(READY_INTERVAL_MS);
    }
    throw new Error(redactSecrets(last?.healthMessage ?? "readiness check failed", options.secrets ?? []));
  }

  private async runAction(
    action: "start" | "stop" | "restart",
    options: RuntimeOptions,
  ): Promise<void> {
    let secrets = [...(options.secrets ?? [])];
    try {
      const environment = parseYarrEnvironment(await this.files.readFile(YARR_ENVIRONMENT_PATH));
      secrets = [...secrets, ...collectSecretValues(environment.values)];
      await this.commands.run(YARR_RC_PATH, lifecycleArgs(action, options.lockFd), {
        inheritedLockFd: options.lockFd,
        secrets,
        timeoutMs: 60_000,
      });
    } catch (error) {
      throw new Error(redactSecrets(errorMessage(error), secrets));
    }
  }

  private async readPid(): Promise<number | null> {
    try {
      const text = (await this.files.readFile(YARR_PID_PATH)).trim();
      if (!/^[1-9][0-9]*$/.test(text)) return null;
      const pid = Number(text);
      return Number.isSafeInteger(pid) ? pid : null;
    } catch {
      return null;
    }
  }
}

function lifecycleArgs(action: string, lockFd?: number): string[] {
  return lockFd === undefined ? [action] : ["--lock-fd", "3", action];
}

function effectiveBindAddress(mode: string, customHost: string): string {
  if (mode === "loopback") return "127.0.0.1";
  if (mode === "lan") return "0.0.0.0";
  return customHost;
}

function probeAddress(address: string): string {
  return address === "0.0.0.0" || address === "127.0.0.1" ? "127.0.0.1" : address;
}

function urlHost(host: string): string {
  return host.includes(":") ? `[${host}]` : host;
}

function parseObject(body: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(body);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function runtimeError(bindAddress: string, port: number, healthMessage: string): RuntimeState {
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
