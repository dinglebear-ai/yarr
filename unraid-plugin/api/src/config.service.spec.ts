import { describe, expect, it } from "vitest";

import type { LockLease, LockService } from "./flock.service";
import {
  ConfigService,
  type ConfigFileSystem,
  type RuntimeController,
  type SaveConfigResult,
} from "./config.service";
import {
  YARR_CONFIG_DIR,
  YARR_ENVIRONMENT_GOOD_PATH,
  YARR_ENVIRONMENT_NEXT_PATH,
  YARR_ENVIRONMENT_PATH,
  YARR_PLUGIN_CONFIG_GOOD_PATH,
  YARR_PLUGIN_CONFIG_NEXT_PATH,
  YARR_PLUGIN_CONFIG_PATH,
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
}

function harness(runtimeFailures: Error[] = [], fileFailure?: string) {
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
  const calls: Array<{ lockFd: number; secrets: readonly string[] }> = [];
  const runtime: RuntimeController = {
    async restart(options) {
      lease.assertHeld();
      calls.push(options);
      const failure = runtimeFailures.shift();
      if (failure) throw failure;
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
    expect(files.operations).toEqual([
      `read:${YARR_PLUGIN_CONFIG_PATH}`,
      `read:${YARR_ENVIRONMENT_PATH}`,
      `write:${YARR_PLUGIN_CONFIG_NEXT_PATH}:600`,
      `write:${YARR_ENVIRONMENT_NEXT_PATH}:600`,
      `fsync:${YARR_PLUGIN_CONFIG_NEXT_PATH}`,
      `fsync:${YARR_ENVIRONMENT_NEXT_PATH}`,
      `fsync-dir:${YARR_CONFIG_DIR}`,
      `rename:${YARR_PLUGIN_CONFIG_PATH}->${YARR_PLUGIN_CONFIG_GOOD_PATH}`,
      `rename:${YARR_ENVIRONMENT_PATH}->${YARR_ENVIRONMENT_GOOD_PATH}`,
      `rename:${YARR_PLUGIN_CONFIG_NEXT_PATH}->${YARR_PLUGIN_CONFIG_PATH}`,
      `rename:${YARR_ENVIRONMENT_NEXT_PATH}->${YARR_ENVIRONMENT_PATH}`,
      `fsync-dir:${YARR_CONFIG_DIR}`,
    ]);
    expect(calls).toEqual([{ lockFd: 71, secrets: ["current-secret"] }]);
    expect(JSON.stringify(result)).not.toContain("current-secret");
  });

  it("does not write or restart when effective state is unchanged", async () => {
    const { service, files, calls } = harness();

    const result = await service.save({ bearerToken: { kind: "preserve" } });

    expect(result).toMatchObject({ changed: false, restarted: false, rolledBack: false });
    expect(files.operations).toEqual([
      `read:${YARR_PLUGIN_CONFIG_PATH}`,
      `read:${YARR_ENVIRONMENT_PATH}`,
    ]);
    expect(calls).toHaveLength(0);
  });

  it("restores both known-good files and restarts when readiness fails", async () => {
    const { service, files, calls } = harness([new Error("readiness exposed current-secret")]);

    const result: SaveConfigResult = await service.save({ port: 40124 });

    expect(result).toMatchObject({ changed: true, restarted: true, rolledBack: true });
    expect(result.error).toContain("[REDACTED]");
    expect(result.error).not.toContain("current-secret");
    expect(result.config.plugin.port).toBe(40070);
    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_PATH)?.text).toBe(environment);
    expect(files.files.get(YARR_PLUGIN_CONFIG_GOOD_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_GOOD_PATH)?.text).toBe(environment);
    expect(calls).toHaveLength(2);
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

    await expect(failure).rejects.toThrow("[REDACTED]");
    await expect(failure).rejects.not.toThrow(/new-secret|current-secret/);
  });

  it("restores the first current file when the second known-good rename fails", async () => {
    const failedRename = `rename:${YARR_ENVIRONMENT_PATH}->${YARR_ENVIRONMENT_GOOD_PATH}`;
    const { service, files, calls } = harness([], failedRename);

    await expect(service.save({ port: 40125 })).rejects.toThrow("injected failure");

    expect(files.files.get(YARR_PLUGIN_CONFIG_PATH)?.text).toBe(pluginConfig);
    expect(files.files.get(YARR_ENVIRONMENT_PATH)?.text).toBe(environment);
    expect(calls).toHaveLength(0);
  });
});
