import { spawn } from "node:child_process";
import type { Readable } from "node:stream";

import { YARR_LOG_PATH, YARR_RC_PATH, YARR_UPDATE_PATH } from "./paths";
import { redactSecrets } from "./secret-redactor";

export interface RunOptions {
  timeoutMs?: number;
  maxOutputBytes?: number;
  allowedExitCodes?: readonly number[];
  secrets?: readonly string[];
  inheritedLockFd?: number;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface CommandRunner {
  run(command: string, args: readonly string[], options?: RunOptions): Promise<CommandResult>;
}

export interface CommandProcess {
  readonly pid?: number;
  readonly stdout: Readable;
  readonly stderr: Readable;
  kill(signal: NodeJS.Signals): boolean;
  on(event: "error", listener: (error: Error) => void): this;
  once(
    event: "close",
    listener: (exitCode: number | null, signal: NodeJS.Signals | null) => void,
  ): this;
}

export interface CommandSpawnOptions {
  shell: false;
  detached: true;
  stdio: ["ignore", "pipe", "pipe"] | ["ignore", "pipe", "pipe", number];
  env: NodeJS.ProcessEnv;
}

export type CommandSpawn = (
  command: string,
  args: readonly string[],
  options: CommandSpawnOptions,
) => CommandProcess;

export type CommandGroupKiller = (pid: number, signal: NodeJS.Signals) => void;

export class FatalCommandError extends Error {}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;
const MAX_TIMEOUT_MS = 120_000;
const MAX_CAPTURE_BYTES = 1024 * 1024;
const LOCK_CHILD_FD = 3;
const KILL_COMPLETION_TIMEOUT_MS = 2_000;
type CommandLifecycleState = "starting" | "running" | "terminating" | "settled";

export class SafeCommandRunner implements CommandRunner {
  constructor(
    private readonly spawnCommand: CommandSpawn = (command, args, options) =>
      spawn(command, [...args], options) as unknown as CommandProcess,
    private readonly killProcessGroup: CommandGroupKiller = (pid, signal) => {
      process.kill(-pid, signal);
    },
  ) {}

  async run(
    command: string,
    args: readonly string[],
    options: RunOptions = {},
  ): Promise<CommandResult> {
    assertCommand(command, args, options.inheritedLockFd);
    const timeoutMs = boundedInteger(
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      1,
      MAX_TIMEOUT_MS,
      "command timeout",
    );
    const maxOutputBytes = boundedInteger(
      options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES,
      1,
      MAX_CAPTURE_BYTES,
      "command output limit",
    );
    const allowedExitCodes = options.allowedExitCodes ?? [0];
    if (!allowedExitCodes.every((code) => Number.isInteger(code) && code >= 0 && code <= 255)) {
      throw new Error("allowed exit codes are invalid");
    }

    const stdio: CommandSpawnOptions["stdio"] =
      options.inheritedLockFd === undefined
        ? ["ignore", "pipe", "pipe"]
        : ["ignore", "pipe", "pipe", options.inheritedLockFd];
    const child = this.spawnCommand(command, args, {
      shell: false,
      detached: true,
      stdio,
      env: { PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" },
    });

    return new Promise<CommandResult>((resolve, reject) => {
      let state: CommandLifecycleState =
        child.pid !== undefined && Number.isInteger(child.pid) && child.pid > 0
          ? "running"
          : "starting";
      let terminationError: Error | null = null;
      let stdout = Buffer.alloc(0);
      let stderr = Buffer.alloc(0);
      let killGuard: NodeJS.Timeout | undefined;

      const cleanup = (): void => {
        clearTimeout(timer);
        if (killGuard !== undefined) clearTimeout(killGuard);
        child.stdout.off("data", onStdout);
        child.stderr.off("data", onStderr);
      };

      const finishError = (message: string): void => {
        if (state === "settled") return;
        state = "settled";
        cleanup();
        reject(new Error(redactSecrets(message, options.secrets ?? [])));
      };
      const beginTermination = (message: string): void => {
        if (state === "settled" || state === "terminating") return;
        state = "terminating";
        terminationError = new Error(redactSecrets(message, options.secrets ?? []));
        clearTimeout(timer);
        try {
          if (child.pid === undefined || !Number.isInteger(child.pid) || child.pid <= 0) {
            throw new Error("child PID is unavailable");
          }
          this.killProcessGroup(child.pid, "SIGKILL");
        } catch (error) {
          terminationError = new FatalCommandError(
            `fatal command termination failure: could not kill process group: ${errorMessage(error)}`,
          );
        }
        child.kill("SIGKILL");
        killGuard = setTimeout(() => {
          if (state !== "terminating") return;
          state = "settled";
          cleanup();
          reject(new FatalCommandError("fatal command termination failure: process group did not close"));
        }, KILL_COMPLETION_TIMEOUT_MS);
      };
      const capture = (stream: "stdout" | "stderr", chunk: Buffer | string): void => {
        if (state === "settled" || state === "terminating") return;
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        const current = stream === "stdout" ? stdout : stderr;
        const remaining = Math.max(0, maxOutputBytes - current.length);
        const next = Buffer.concat([current, bytes.subarray(0, remaining)]);
        if (stream === "stdout") stdout = next;
        else stderr = next;
        if (bytes.length > remaining) {
          beginTermination(`command output exceeded ${maxOutputBytes} bytes: ${next.toString("utf8")}`);
        }
      };

      const onStdout = (chunk: Buffer | string): void => capture("stdout", chunk);
      const onStderr = (chunk: Buffer | string): void => capture("stderr", chunk);

      const timer = setTimeout(() => {
        beginTermination(`command timed out after ${timeoutMs}ms`);
      }, timeoutMs);
      child.stdout.on("data", onStdout);
      child.stderr.on("data", onStderr);
      child.on("error", (error) => {
        if (state === "settled" || state === "terminating") return;
        finishError(`command failed to start: ${error.message}`);
      });
      child.once("close", (exitCode, signal) => {
        if (state === "settled") return;
        if (state === "terminating") {
          state = "settled";
          cleanup();
          reject(terminationError ?? new Error("command termination failed"));
          return;
        }
        cleanup();
        const code = exitCode ?? 255;
        const stdoutText = redactSecrets(stdout.toString("utf8"), options.secrets ?? []);
        const stderrText = redactSecrets(stderr.toString("utf8"), options.secrets ?? []);
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assertCommand(command: string, args: readonly string[], inheritedLockFd?: number): void {
  if (!command.startsWith("/") || ![YARR_RC_PATH, YARR_UPDATE_PATH, "/usr/bin/tail"].includes(command)) {
    throw new Error("command is not permitted");
  }
  if (inheritedLockFd !== undefined && (!Number.isInteger(inheritedLockFd) || inheritedLockFd < 0)) {
    throw new Error("inherited lock descriptor is invalid");
  }

  let permitted = false;
  if (command === YARR_RC_PATH) {
    const actions = new Set(["start", "stop", "restart", "status", "reload"]);
    permitted =
      (args.length === 1 && actions.has(args[0]) && inheritedLockFd === undefined) ||
      (args.length === 3 &&
        args[0] === "--lock-fd" &&
        args[1] === String(LOCK_CHILD_FD) &&
        actions.has(args[2]) &&
        inheritedLockFd !== undefined);
  } else if (command === YARR_UPDATE_PATH) {
    permitted = isUpdaterArgs(args) && inheritedLockFd === undefined;
  } else if (command === "/usr/bin/tail") {
    permitted =
      args.length === 4 &&
      args[0] === "-n" &&
      /^(?:[1-9][0-9]?|[1-4][0-9]{2}|500)$/.test(args[1]) &&
      args[2] === "--" &&
      args[3] === YARR_LOG_PATH &&
      inheritedLockFd === undefined;
  }
  if (!permitted) throw new Error("command arguments are not permitted");
}

function isUpdaterArgs(args: readonly string[]): boolean {
  if ((args.length === 1 || args.length === 2) && ["check", "reset", "rollback"].includes(args[0])) {
    return args.length === 1 || args[1] === "--json";
  }
  if (args[0] !== "apply" || args[1] !== "--version" || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(args[2] ?? "")) {
    return false;
  }
  return args.length === 3 || (args.length === 4 && args[3] === "--json");
}

function boundedInteger(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}
