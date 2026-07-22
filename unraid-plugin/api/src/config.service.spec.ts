import { describe, expect, it } from "vitest";

import type { LockLease, LockService } from "./flock.service";
import type { RuntimeState } from "./runtime.service";
import { FatalCommandError } from "./command-runner";
import {
  ConfigService,
  type ConfigFileSystem,
  type RuntimeController,
  type SaveConfigResult,
} from "./config.service";
import {
  YARR_CONFIG_DIR,
  YARR_ENVIRONMENT_GOOD_PATH,
  YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH,
  YARR_ENVIRONMENT_NEXT_PATH,
  YARR_ENVIRONMENT_PATH,
  YARR_ENVIRONMENT_TRANSACTION_PATH,
  YARR_PLUGIN_CONFIG_GOOD_PATH,
  YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH,
  YARR_PLUGIN_CONFIG_NEXT_PATH,
  YARR_PLUGIN_CONFIG_PATH,
  YARR_PLUGIN_CONFIG_TRANSACTION_PATH,
} from "./paths";

const pluginConfig = `ENABLED=yes\nBIND_MODE=loopback\nCUSTOM_HOST=\nPORT=40070\nAUTH_MODE=bearer\nTAILSCALE_SERVE=no\nTAILSCALE_HOSTNAME=\nLOG_LEVEL=info\nUPDATE_CHANNEL=stable\n`;
const environment = "YARR_MCP_TOKEN=current-secret\n";

class MemoryFileSystem implements ConfigFileSystem {
  readonly files = new Map<string, { text: string; mode: number }>([
    [YARR_PLUGIN_CONFIG_PATH, { text: pluginConfig, mode: 0o600 }],
    [YARR_ENVIRONMENT_PATH, { text: environment, mode: 0o600 }],
  ]);
  readonly operations: string[] = [];

  constructor(
    private readonly assertLocked: () => void,
    private failOnce?: string,
  ) {}

  async readFile(path: string): Promise<string> {
    this.assertLocked();
    this.operations.push(`read:${path}`);
    const file = this.files.get(path);
    if (!file) throw new Error(`missing ${path}`);
    return file.text;
  }

  async writeFile(path: string, text: string, mode: number): Promise<void> {
    this.assertLocked();
    this.operations.push(`write:${path}:${mode.toString(8)}`);
    this.files.set(path, { text, mode });
  }

  async syncFile(path: string): Promise<void> {
    this.assertLocked();
    this.operations.push(`fsync:${path}`);
  }

  async syncDirectory(path: string): Promise<void> {
    this.assertLocked();
    this.operations.push(`fsync-dir:${path}`);
  }

  async rename(from: string, to: string): Promise<void> {
    this.assertLocked();
    const operation = `rename:${from}->${to}`;
    this.operations.push(operation);
    if (this.failOnce === operation) {
      this.failOnce = undefined;
      throw new Error(`injected failure: ${operation}`);
    }
    const file = this.files.get(from);
    if (!file) throw new Error(`missing ${from}`);
    this.files.set(to, file);
    this.files.delete(from);
  }

  async copyFile(from: string, to: string, mode: number): Promise<void> {
    this.assertLocked();
    this.operations.push(`copy:${from}->${to}:${mode.toString(8)}`);
    const file = this.files.get(from);
    if (!file) throw new Error(`missing ${from}`);
    this.files.set(to, { text: file.text, mode });
  }

  async chmod(path: string, mode: number): Promise<void> {
    this.assertLocked();
    this.operations.push(`chmod:${path}:${mode.toString(8)}`);
    const file = this.files.get(path);
    if (!file) throw new Error(`missing ${path}`);
    file.mode = mode;
  }

  async exists(path: string): Promise<boolean> {
    this.assertLocked();
    return this.files.has(path);
  }

  async remove(path: string): Promise<void> {
    this.assertLocked();
    this.operations.push(`remove:${path}`);
    this.files.delete(path);
  }
}

const running: RuntimeState = {
  state: "running",
  pid: 1234,
  version: "2.1.0",
  bindAddress: "127.0.0.1",
  port: 40070,
  ready: true,
  healthMessage: "ready",
  uptimeSeconds: null,
};
const stopped: RuntimeState = {
  ...running,
  state: "stopped",
  pid: null,
  version: null,
  ready: false,
  healthMessage: "stopped",
};

function harness(
  runtimeFailures: Error[] = [],
  fileFailure?: string,
  states: { status?: RuntimeState; restart?: RuntimeState[]; stop?: RuntimeState[] } = {},
) {
  let held = false;
  const lease: LockLease = {
    fd: 71,
    assertHeld: () => {
      if (!held) throw new Error("operation escaped plugin lock");
    },
  };
  const lock: LockService = {
    async withLock<T>(callback: (active: LockLease) => Promise<T>): Promise<T> {
      held = true;
      try {
        return await callback(lease);
      } finally {
        held = false;
      }
    },
  };
  const files = new MemoryFileSystem(lease.assertHeld, fileFailure);
  const calls: Array<{ action: "status" | "restart" | "stop"; lockFd: number; secrets: readonly string[] }> = [];
  const runtime: RuntimeController = {
    async status(options) {
      lease.assertHeld();
      calls.push({ action: "status", ...options });
      return states.status ?? running;
    },
    async restart(options) {
      lease.assertHeld();
      calls.push({ action: "restart", ...options });
      const failure = runtimeFailures.shift();
      if (failure) throw failure;
      return states.restart?.shift() ?? running;
    },
    async stop(options) {
      lease.assertHeld();
      calls.push({ action: "stop", ...options });
      const failure = runtimeFailures.shift();
      if (failure) throw failure;
      return states.stop?.shift() ?? stopped;
    },
  };
  return { service: new ConfigService(files, lock, runtime), files, calls };
}

describe("ConfigService", () => {
  it("durably installs both files and restarts while the shared flock is held", async () => {
    const { service, files, calls } = harness();

    const result = await service.save({ port: 40123 });

    expect(result).toMatchObject({ changed: true, restarted: true, rolledBack: false });
    expect(result.config.plugin.port).toBe(40123);
    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)).toMatchObject({ mode: 0o600 });
    expect(files.files.get(YARR_ENVIRONMENT_PATH)).toMatchObject({ mode: 0o600 });
    expect(files.files.get(YARR_PLUGIN_CONFIG_GOOD_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_GOOD_PATH)?.text).toBe(environment);
    expect(files.operations).toEqual(expect.arrayContaining([
      `chmod:${YARR_PLUGIN_CONFIG_PATH}:600`,
      `chmod:${YARR_ENVIRONMENT_PATH}:600`,
      `write:${YARR_PLUGIN_CONFIG_NEXT_PATH}:600`,
      `write:${YARR_ENVIRONMENT_NEXT_PATH}:600`,
      `fsync:${YARR_PLUGIN_CONFIG_NEXT_PATH}`,
      `fsync:${YARR_ENVIRONMENT_NEXT_PATH}`,
      `rename:${YARR_PLUGIN_CONFIG_PATH}->${YARR_PLUGIN_CONFIG_GOOD_PATH}`,
      `rename:${YARR_ENVIRONMENT_PATH}->${YARR_ENVIRONMENT_GOOD_PATH}`,
      `rename:${YARR_PLUGIN_CONFIG_NEXT_PATH}->${YARR_PLUGIN_CONFIG_PATH}`,
      `rename:${YARR_ENVIRONMENT_NEXT_PATH}->${YARR_ENVIRONMENT_PATH}`,
      `fsync-dir:${YARR_CONFIG_DIR}`,
    ]));
    expect(calls.map((call) => call.action)).toEqual(["status", "restart"]);
    expect(JSON.stringify(result)).not.toContain("current-secret");
  });

  it("does not write or restart when effective state is unchanged", async () => {
    const { service, files, calls } = harness();

    const result = await service.save({ bearerToken: { kind: "preserve" } });

    expect(result).toMatchObject({ changed: false, restarted: false, rolledBack: false });
    expect(files.operations).toEqual([
      `read:${YARR_PLUGIN_CONFIG_PATH}`,
      `read:${YARR_ENVIRONMENT_PATH}`,
      `chmod:${YARR_PLUGIN_CONFIG_PATH}:600`,
      `chmod:${YARR_ENVIRONMENT_PATH}:600`,
      `fsync:${YARR_PLUGIN_CONFIG_PATH}`,
      `fsync:${YARR_ENVIRONMENT_PATH}`,
      `fsync-dir:${YARR_CONFIG_DIR}`,
    ]);
    expect(calls.map((call) => call.action)).toEqual(["status"]);
  });

  it("restores both known-good files and restarts when readiness fails", async () => {
    const { service, files, calls } = harness([new Error("readiness exposed current-secret")]);

    const result: SaveConfigResult = await service.save({ port: 40124 });

    expect(result).toMatchObject({ changed: true, restarted: true, rolledBack: true });
    expect(result.error).not.toContain("current-secret");
    expect(result.config.plugin.port).toBe(40070);
    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_PATH)?.text).toBe(environment);
    expect(files.files.get(YARR_PLUGIN_CONFIG_GOOD_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_GOOD_PATH)?.text).toBe(environment);
    expect(calls.map((call) => call.action)).toEqual(["status", "restart", "restart"]);
    expect(files.operations).toContain(
      `copy:${YARR_PLUGIN_CONFIG_GOOD_PATH}->${YARR_PLUGIN_CONFIG_NEXT_PATH}:600`,
    );
    expect(files.operations.at(-1)).toBe(`fsync-dir:${YARR_CONFIG_DIR}`);
  });

  it("redacts both prospective and known-good secrets when rollback restart fails", async () => {
    const { service } = harness([
      new Error("new-secret was rejected"),
      new Error("current-secret rollback failed"),
    ]);

    const failure = service.save({ bearerToken: { kind: "set", value: "new-secret" } });

    await expect(failure).rejects.toThrow("configuration rollback failed");
    await expect(failure).rejects.not.toThrow(/new-secret|current-secret/);
  });

  it("restores the first current file when the second known-good rename fails", async () => {
    const failedRename = `rename:${YARR_ENVIRONMENT_PATH}->${YARR_ENVIRONMENT_GOOD_PATH}`;
    const { service, files, calls } = harness([], failedRename);

    await expect(service.save({ port: 40125 })).rejects.toThrow("injected failure");

    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_PATH)?.text).toBe(environment);
    expect(calls.map((call) => call.action)).toEqual(["status"]);
  });

  it("rolls back when restart reports stopped and restores the prior running state", async () => {
    const { service, files, calls } = harness([], undefined, {
      status: running,
      restart: [stopped, running],
    });

    const result = await service.save({ port: 40126 });

    expect(result).toMatchObject({ rolledBack: true, restarted: true });
    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.text).toBe(pluginConfig);
    expect(calls.map((call) => call.action)).toEqual(["status", "restart", "restart"]);
  });

  it("stops intentionally disabled configuration without treating stopped as readiness", async () => {
    const { service, calls } = harness([], undefined, { status: running, stop: [stopped] });

    const result = await service.save({ enabled: false });

    expect(result).toMatchObject({ rolledBack: false, restarted: true });
    expect(result.config.plugin.enabled).toBe(false);
    expect(calls.map((call) => call.action)).toEqual(["status", "stop"]);
  });

  it("restores the prior stopped runtime state after failed enable", async () => {
    const { service, calls } = harness([new Error("failed enable")], undefined, {
      status: stopped,
      stop: [stopped],
    });

    const result = await service.save({ port: 40127 });

    expect(result.rolledBack).toBe(true);
    expect(calls.map((call) => call.action)).toEqual(["status", "restart", "stop"]);
  });

  it("treats an explicitly equal default as a semantic no-op", async () => {
    const { service, files, calls } = harness();
    files.files.get(YARR_PLUGIN_CONFIG_PATH)!.text = pluginConfig.replace("LOG_LEVEL=info\n", "");

    const result = await service.save({ logLevel: "info" });

    expect(result.changed).toBe(false);
    expect(calls.map((call) => call.action)).toEqual(["status"]);
  });

  it("repairs permissive modes without restarting", async () => {
    const { service, files, calls } = harness();
    files.files.get(YARR_PLUGIN_CONFIG_PATH)!.mode = 0o644;
    files.files.get(YARR_ENVIRONMENT_PATH)!.mode = 0o666;

    const result = await service.save({ bearerToken: { kind: "preserve" } });

    expect(result.changed).toBe(false);
    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.mode).toBe(0o600);
    expect(files.files.get(YARR_ENVIRONMENT_PATH)?.mode).toBe(0o600);
    expect(files.operations).toContain(`fsync-dir:${YARR_CONFIG_DIR}`);
    expect(calls.map((call) => call.action)).toEqual(["status"]);
  });

  it.each([
    [`rename:${YARR_PLUGIN_CONFIG_PATH}->${YARR_PLUGIN_CONFIG_GOOD_PATH}`],
    [`rename:${YARR_ENVIRONMENT_PATH}->${YARR_ENVIRONMENT_GOOD_PATH}`],
  ])("retains the prior complete known-good pair when rotation fails at %s", async (failure) => {
    const { service, files } = harness([], failure);
    files.files.set(YARR_PLUGIN_CONFIG_GOOD_PATH, { text: "previous-plugin-good\n", mode: 0o600 });
    files.files.set(YARR_ENVIRONMENT_GOOD_PATH, { text: "previous-env-good\n", mode: 0o600 });

    await expect(service.save({ port: 40128 })).rejects.toThrow("injected failure");

    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_PATH)?.text).toBe(environment);
    expect(files.files.get(YARR_PLUGIN_CONFIG_GOOD_PATH)?.text).toBe("previous-plugin-good\n");
    expect(files.files.get(YARR_ENVIRONMENT_GOOD_PATH)?.text).toBe("previous-env-good\n");
    expect(files.files.has(YARR_PLUGIN_CONFIG_TRANSACTION_PATH)).toBe(false);
    expect(files.files.has(YARR_ENVIRONMENT_TRANSACTION_PATH)).toBe(false);
    expect(files.files.has(YARR_PLUGIN_CONFIG_GOOD_TRANSACTION_PATH)).toBe(false);
    expect(files.files.has(YARR_ENVIRONMENT_GOOD_TRANSACTION_PATH)).toBe(false);
  });

  it.each([
    [{ ...running, state: "starting", ready: false, healthMessage: "starting" } as RuntimeState],
    [{ ...running, state: "error", ready: false, healthMessage: "error" } as RuntimeState],
    [{ ...running, ready: false, healthMessage: "not ready" } as RuntimeState],
  ])("rejects non-restorable prior state before any mutation", async (priorState) => {
    const { service, files, calls } = harness([], undefined, { status: priorState });

    await expect(service.save({ port: 40129 })).rejects.toThrow("prior runtime state is not stable");

    expect(files.operations).toEqual([
      `read:${YARR_PLUGIN_CONFIG_PATH}`,
      `read:${YARR_ENVIRONMENT_PATH}`,
    ]);
    expect(calls.map((call) => call.action)).toEqual(["status"]);
  });

  it("does not roll back after the fatal guard-timeout termination result", async () => {
    const fatal = new FatalCommandError("fatal command termination failure: current-secret");
    const { service, files, calls } = harness([fatal]);

    const failure = service.save({ port: 40130 });

    await expect(failure).rejects.toBeInstanceOf(FatalCommandError);
    await expect(failure).rejects.toThrow("manual intervention required");
    await expect(failure).rejects.not.toThrow("current-secret");
    expect(calls.map((call) => call.action)).toEqual(["status", "restart"]);
    expect(files.operations).not.toContain(
      `copy:${YARR_PLUGIN_CONFIG_GOOD_PATH}->${YARR_PLUGIN_CONFIG_NEXT_PATH}:600`,
    );
    expect(files.operations.some((operation) => operation.startsWith("remove:"))).toBe(false);
    expect(files.files.get(YARR_PLUGIN_CONFIG_GOOD_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_GOOD_PATH)?.text).toBe(environment);
  });

  it("rolls back after the ordinary confirmed-close termination result", async () => {
    const { service, files, calls } = harness([new Error("confirmed-close termination failure")]);

    const result = await service.save({ port: 40131 });

    expect(result.rolledBack).toBe(true);
    expect(calls.map((call) => call.action)).toEqual(["status", "restart", "restart"]);
    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_PATH)?.text).toBe(environment);
  });
});
