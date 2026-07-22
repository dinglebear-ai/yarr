import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import {
  SafeCommandRunner,
  FatalCommandError,
  type CommandProcess,
  type CommandResult,
  type CommandRunner,
  type RunOptions,
} from "./command-runner";
import { RuntimeService, type HttpClient, type RuntimeFileSystem } from "./runtime.service";
import { YARR_ENVIRONMENT_PATH, YARR_PID_PATH, YARR_PLUGIN_CONFIG_PATH } from "./paths";
import { redactSecrets } from "./secret-redactor";

const pluginConfig = `ENABLED=yes\nBIND_MODE=loopback\nCUSTOM_HOST=\nPORT=40070\nAUTH_MODE=bearer\nTAILSCALE_SERVE=no\nTAILSCALE_HOSTNAME=\nLOG_LEVEL=info\nUPDATE_CHANNEL=stable\n`;

class FakeCommandProcess extends EventEmitter implements CommandProcess {
  readonly pid = 4321;
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly kill = vi.fn(() => true);
}

class QueueRunner implements CommandRunner {
  readonly calls: Array<{ command: string; args: readonly string[]; lockFd?: number }> = [];
  constructor(private readonly results: CommandResult[]) {}

  async run(command: string, args: readonly string[], options: RunOptions = {}): Promise<CommandResult> {
    this.calls.push({ command, args, lockFd: options.inheritedLockFd });
    const result = this.results.shift();
    if (!result) throw new Error("unexpected command");
    return result;
  }
}

function runtimeHarness(results: CommandResult[]) {
  const runner = new QueueRunner(results);
  const data = new Map([
    [YARR_PLUGIN_CONFIG_PATH, pluginConfig],
    [YARR_ENVIRONMENT_PATH, "YARR_MCP_TOKEN=runtime-secret\n"],
    [YARR_PID_PATH, "1234\n"],
  ]);
  const files: RuntimeFileSystem = {
    readFile: async (path) => {
      const value = data.get(path);
      if (value === undefined) throw new Error(`missing ${path}`);
      return value;
    },
  };
  const http: HttpClient = {
    get: vi.fn(async (url) => {
      if (url.endsWith("/ready")) {
        return { status: 200, body: '{"status":"ready","configured_services":1}' };
      }
      return { status: 200, body: '{"status":"ok","server":"yarr","version":"2.1.0","transport":"http"}' };
    }),
  };
  return { runtime: new RuntimeService(runner, files, http), runner, http, data };
}

describe("SafeCommandRunner", () => {
  it("rejects shell and non-allowlisted command shapes before spawn", async () => {
    const spawn = vi.fn();
    const runner = new SafeCommandRunner(spawn);

    await expect(runner.run("/bin/sh", ["-c", "true"])).rejects.toThrow("command is not permitted");
    await expect(runner.run("/etc/rc.d/rc.yarr", ["start;id"])).rejects.toThrow(
      "arguments are not permitted",
    );
    expect(spawn).not.toHaveBeenCalled();
  });

  it("caps output, kills the child, and redacts secrets from command errors", async () => {
    const child = new FakeCommandProcess();
    const runner = new SafeCommandRunner(() => child, vi.fn());
    const command = runner.run("/etc/rc.d/rc.yarr", ["restart"], {
      maxOutputBytes: 16,
      secrets: ["runtime-secret"],
    });
    child.stderr.write("runtime-secret-output-that-overflows");
    child.emit("close", null, "SIGKILL");

    await expect(command).rejects.toThrow("command output exceeded");
    await expect(command).rejects.not.toThrow("runtime-secret");
    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
  });

  it("redacts empty, repeated, and overlapping secrets from successful output", async () => {
    const child = new FakeCommandProcess();
    const runner = new SafeCommandRunner(() => {
      queueMicrotask(() => {
        child.stdout.write("token-123 token token-123");
        child.stderr.write("token-123");
        child.emit("close", 0, null);
      });
      return child;
    });

    const result = await runner.run("/etc/rc.d/rc.yarr", ["restart"], {
      secrets: ["", "token", "token-123", "token"],
    });

    expect(result.stdout).toBe("  ");
    expect(result.stderr).toBe("");
  });

  it("uses collision-free empty replacement for marker text, overlap, and one-character secrets", async () => {
    const child = new FakeCommandProcess();
    const runner = new SafeCommandRunner(() => {
      queueMicrotask(() => {
        child.stdout.write("[REDACTED] abc ab a [REDACTED]");
        child.emit("close", 0, null);
      });
      return child;
    });

    const result = await runner.run("/etc/rc.d/rc.yarr", ["restart"], {
      secrets: ["", "[REDACTED]", "abc", "ab", "a"],
    });

    expect(result.stdout).toBe("    ");
    expect(result.stdout).not.toContain("[REDACTED]");
  });

  it.each([
    ["axb", ["ab", "x"]],
    ["axybc", ["abc", "x", "y"]],
    ["cabxd", ["cd", "ab", "x"]],
  ])("redacts to a fixed point without synthesizing secrets: %s", (input, secrets) => {
    const result = redactSecrets(input, secrets);

    expect(result).toBe("");
    for (const secret of secrets.filter(Boolean)) {
      expect(result).not.toContain(secret);
    }
  });

  it("waits for process-group closure after overflow before rejecting", async () => {
    const child = new FakeCommandProcess();
    let descendantAlive = true;
    const killGroup = vi.fn(() => {
      descendantAlive = false;
    });
    const runner = new SafeCommandRunner(() => child, killGroup);
    let rejected = false;
    const command = runner.run("/etc/rc.d/rc.yarr", ["restart"], { maxOutputBytes: 8 });
    void command.catch(() => {
      rejected = true;
    });

    child.stdout.write("output-that-overflows");
    await Promise.resolve();
    expect(descendantAlive).toBe(false);
    expect(rejected).toBe(false);
    child.emit("close", null, "SIGKILL");

    await expect(command).rejects.toThrow("command output exceeded");
    expect(child.stdout.listenerCount("data")).toBe(0);
  });

  it("returns a distinct fatal error when killed process group never closes", async () => {
    vi.useFakeTimers();
    const child = new FakeCommandProcess();
    const runner = new SafeCommandRunner(() => child, vi.fn());
    const command = runner.run("/etc/rc.d/rc.yarr", ["restart"], { timeoutMs: 10 });
    const rejection = expect(command).rejects.toThrow("fatal command termination failure");

    await vi.advanceTimersByTimeAsync(2_100);

    await rejection;
    vi.useRealTimers();
  });

  it("preserves fatal no-close identity through runtime lifecycle control", async () => {
    const runner: CommandRunner = {
      run: async () => {
        throw new FatalCommandError("fatal command termination failure: runtime-secret");
      },
    };
    const files: RuntimeFileSystem = {
      readFile: async (path) =>
        path === YARR_ENVIRONMENT_PATH
          ? "YARR_MCP_TOKEN=runtime-secret\n"
          : pluginConfig,
    };
    const runtime = new RuntimeService(runner, files, {
      get: async () => ({ status: 500, body: "" }),
    });

    const failure = runtime.restart();

    await expect(failure).rejects.toBeInstanceOf(FatalCommandError);
    await expect(failure).rejects.toThrow("fatal command termination failure: ");

    const statusFailure = runtime.status();
    await expect(statusFailure).rejects.toBeInstanceOf(FatalCommandError);
    await expect(statusFailure).rejects.toThrow("fatal command termination failure: ");
  });
});

describe("RuntimeService", () => {
  it("reports running only from the rc contract plus successful readiness", async () => {
    const { runtime, http } = runtimeHarness([
      { exitCode: 0, stdout: "yarr: RUNNING\n", stderr: "" },
    ]);

    const state = await runtime.status();

    expect(state).toEqual({
      state: "running",
      pid: 1234,
      version: "2.1.0",
      bindAddress: "127.0.0.1",
      port: 40070,
      ready: true,
      healthMessage: "ready",
      uptimeSeconds: null,
    });
    expect(http.get).toHaveBeenCalledWith("http://127.0.0.1:40070/ready", expect.any(Object));
  });

  it("does not trust a PID when rc.yarr reports stopped", async () => {
    const { runtime } = runtimeHarness([
      { exitCode: 3, stdout: "yarr: STOPPED\n", stderr: "" },
    ]);

    await expect(runtime.status()).resolves.toMatchObject({
      state: "stopped",
      pid: null,
      ready: false,
    });
  });

  it("keeps start and stop idempotent", async () => {
    const running = runtimeHarness([
      { exitCode: 0, stdout: "yarr: RUNNING\n", stderr: "" },
    ]);
    await running.runtime.start();
    expect(running.runner.calls).toHaveLength(1);

    const stopped = runtimeHarness([
      { exitCode: 3, stdout: "yarr: STOPPED\n", stderr: "" },
    ]);
    await stopped.runtime.stop();
    expect(stopped.runner.calls).toHaveLength(1);
  });

  it("passes the retained lock description as fixed child fd 3 during restart", async () => {
    const { runtime, runner } = runtimeHarness([
      { exitCode: 0, stdout: "", stderr: "" },
      { exitCode: 0, stdout: "yarr: RUNNING\n", stderr: "" },
    ]);

    await runtime.restart({ lockFd: 71, secrets: ["runtime-secret"] });

    expect(runner.calls[0]).toEqual({
      command: "/etc/rc.d/rc.yarr",
      args: ["--lock-fd", "3", "restart"],
      lockFd: 71,
    });
  });

  it("redacts secrets from runtime command failures", async () => {
    const runner: CommandRunner = {
      run: async () => {
        throw new Error("failed with runtime-secret");
      },
    };
    const { runtime, data } = runtimeHarness([]);
    const replacement = new RuntimeService(runner, { readFile: async (path) => data.get(path)! }, {
      get: async () => ({ status: 500, body: "" }),
    });

    const state = await replacement.status();

    expect(state.healthMessage).toBe("failed with ");
    expect(state.healthMessage).not.toContain("runtime-secret");
  });

  it("returns null for compromised status versions and never reflects server text", async () => {
    const { runtime, http } = runtimeHarness([
      { exitCode: 0, stdout: "yarr: RUNNING\n", stderr: "" },
    ]);
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        status: 200,
        body: '{"status":"ready","configured_services":1,"message":"runtime-secret"}',
      })
      .mockResolvedValueOnce({
        status: 200,
        body: '{"status":"runtime-secret","server":"runtime-secret","version":"runtime-secret\\n2.1.0"}',
      });

    const state = await runtime.status();

    expect(state.version).toBeNull();
    expect(state.healthMessage).toBe("ready");
    expect(JSON.stringify(state)).not.toContain("runtime-secret");
  });

  it("does not accept stopped as readiness success", async () => {
    const { runner, http, data } = runtimeHarness([
      { exitCode: 3, stdout: "yarr: STOPPED\n", stderr: "" },
    ]);
    const runtime = new RuntimeService(
      runner,
      { readFile: async (path) => data.get(path)! },
      http,
      async () => undefined,
      1,
    );

    await expect(runtime.waitUntilReady()).rejects.toThrow("stopped");
  });
});
