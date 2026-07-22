import { spawn } from "node:child_process";
import { open } from "node:fs/promises";
import type { Readable } from "node:stream";

import { YARR_LOCK_PATH } from "./paths";

export interface LockLease {
  readonly fd: number;
  assertHeld(): void;
}

export interface LockService {
  withLock<T>(callback: (lease: LockLease) => Promise<T>): Promise<T>;
}

export interface LockProcess {
  readonly stdout: Readable;
  readonly stderr: Readable;
  kill(signal: NodeJS.Signals): boolean;
  once(
    event: "close",
    listener: (exitCode: number | null, signal: NodeJS.Signals | null) => void,
  ): this;
  once(event: "error", listener: (error: Error) => void): this;
}

interface OpenLockFile {
  readonly fd: number;
  chmod(mode: number): Promise<void>;
  close(): Promise<void>;
}

interface FlockSpawnOptions {
  shell: false;
  stdio: ["ignore", "pipe", "pipe", number];
  env: NodeJS.ProcessEnv;
}

type FlockSpawn = (
  command: string,
  args: readonly string[],
  options: FlockSpawnOptions,
) => LockProcess;

interface FlockServiceOptions {
  openLock?: () => Promise<OpenLockFile>;
  spawn?: FlockSpawn;
  flockPath?: string;
  acquisitionTimeoutMs?: number;
}

const PRODUCTION_FLOCK_PATH = "/usr/bin/flock";
const CHILD_LOCK_FD = 3;
const FLOCK_WAIT_SECONDS = 10;
const DEFAULT_ACQUISITION_TIMEOUT_MS = 11_000;
const MAX_ACQUISITION_OUTPUT_BYTES = 1024;

export class LockLostError extends Error {}

export class FlockService implements LockService {
  private readonly openLock: () => Promise<OpenLockFile>;
  private readonly spawnFlock: FlockSpawn;
  private readonly flockPath: string;
  private readonly acquisitionTimeoutMs: number;

  constructor(options: FlockServiceOptions = {}) {
    this.openLock = options.openLock ?? (async () => open(YARR_LOCK_PATH, "a+", 0o600));
    this.spawnFlock =
      options.spawn ??
      ((command, args, spawnOptions) =>
        spawn(command, [...args], spawnOptions) as unknown as LockProcess);
    this.flockPath = options.flockPath ?? PRODUCTION_FLOCK_PATH;
    this.acquisitionTimeoutMs = options.acquisitionTimeoutMs ?? DEFAULT_ACQUISITION_TIMEOUT_MS;
    if (!this.flockPath.startsWith("/")) {
      throw new Error("flock executable path must be absolute");
    }
  }

  async withLock<T>(callback: (lease: LockLease) => Promise<T>): Promise<T> {
    const lockFile = await this.openLock();
    try {
      await lockFile.chmod(0o600);
      await this.acquire(lockFile.fd);
      const lease: LockLease = {
        fd: lockFile.fd,
        assertHeld: () => undefined,
      };
      return await callback(lease);
    } finally {
      await lockFile.close();
    }
  }

  private async acquire(parentFd: number): Promise<void> {
    let child: LockProcess;
    try {
      child = this.spawnFlock(
        this.flockPath,
        ["--exclusive", "--wait", String(FLOCK_WAIT_SECONDS), String(CHILD_LOCK_FD)],
        {
          shell: false,
          stdio: ["ignore", "pipe", "pipe", parentFd],
          env: { PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" },
        },
      );
    } catch (error) {
      throw new LockLostError(`could not start flock: ${errorMessage(error)}`);
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let stdout = Buffer.alloc(0);
      let stderr = Buffer.alloc(0);

      const fail = (error: Error, kill = false): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (kill) child.kill("SIGKILL");
        reject(error);
      };
      const capture = (stream: "stdout" | "stderr", chunk: Buffer | string): void => {
        if (settled) return;
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        const current = stream === "stdout" ? stdout : stderr;
        const remaining = Math.max(0, MAX_ACQUISITION_OUTPUT_BYTES - current.length);
        const next = Buffer.concat([current, bytes.subarray(0, remaining)]);
        if (stream === "stdout") stdout = next;
        else stderr = next;
        if (bytes.length > remaining) {
          fail(new LockLostError("flock output overflow"), true);
        }
      };

      const timer = setTimeout(() => {
        fail(new LockLostError("timed out acquiring Yarr plugin lock"), true);
      }, this.acquisitionTimeoutMs);
      child.stdout.on("data", (chunk: Buffer | string) => capture("stdout", chunk));
      child.stderr.on("data", (chunk: Buffer | string) => capture("stderr", chunk));
      child.once("error", (error) => fail(new LockLostError(`could not start flock: ${error.message}`)));
      child.once("close", (exitCode, signal) => {
        if (settled) return;
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
