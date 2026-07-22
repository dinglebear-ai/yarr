import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import { mkdtemp, open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import { FlockService, type LockProcess } from "./flock.service";

const TEST_FLOCK_PATH = existsSync("/usr/bin/flock")
  ? "/usr/bin/flock"
  : "/home/linuxbrew/.linuxbrew/bin/flock";

class FakeLockProcess extends EventEmitter implements LockProcess {
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly kill = vi.fn(() => {
    queueMicrotask(() => this.emit("close", null, "SIGKILL"));
    return true;
  });
}

describe("FlockService", () => {
  it("uses fixed fd-only flock arguments and retains the descriptor through the callback", async () => {
    const process = new FakeLockProcess();
    const close = vi.fn(async () => undefined);
    const chmod = vi.fn(async () => undefined);
    const callback = vi.fn(async () => "committed");
    const spawn = vi.fn(() => process);
    const service = new FlockService({
      openLock: vi.fn(async () => ({ fd: 42, chmod, close })),
      spawn,
      acquisitionTimeoutMs: 100,
    });

    const transaction = service.withLock(callback);
    await vi.waitFor(() => expect(spawn).toHaveBeenCalledOnce());
    expect(callback).not.toHaveBeenCalled();
    process.emit("close", 0, null);

    await expect(transaction).resolves.toBe("committed");
    expect(chmod).toHaveBeenCalledWith(0o600);
    expect(spawn).toHaveBeenCalledWith(
      "/usr/bin/flock",
      ["--exclusive", "--wait", "10", "3"],
      expect.objectContaining({ shell: false, stdio: ["ignore", "pipe", "pipe", 42] }),
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it("keeps the kernel flock after the acquisition child exits and releases it after parent close", async () => {
    const directory = await mkdtemp(join(tmpdir(), "yarr-flock-service-"));
    const lockPath = join(directory, "yarr-plugin.lock");
    const service = new FlockService({
      openLock: () => open(lockPath, "a+", 0o600),
      flockPath: TEST_FLOCK_PATH,
    });

    try {
      await service.withLock(async () => {
        const contender = spawnSync(TEST_FLOCK_PATH, [
          "--nonblock",
          lockPath,
          "/usr/bin/true",
        ]);
        expect(contender.status).toBe(1);
      });
      const afterClose = spawnSync(TEST_FLOCK_PATH, [
        "--nonblock",
        lockPath,
        "/usr/bin/true",
      ]);
      expect(afterClose.status).toBe(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("closes exactly once when the callback throws", async () => {
    const process = new FakeLockProcess();
    const close = vi.fn(async () => undefined);
    const service = new FlockService({
      openLock: vi.fn(async () => ({ fd: 8, chmod: async () => undefined, close })),
      spawn: () => {
        queueMicrotask(() => process.emit("close", 0, null));
        return process;
      },
      acquisitionTimeoutMs: 100,
    });

    const transaction = service.withLock(async () => {
      throw new Error("transaction failed");
    });
    await expect(transaction).rejects.toThrow("transaction failed");
    expect(close).toHaveBeenCalledOnce();
  });

  it("does not execute the callback after nonzero acquisition", async () => {
    const process = new FakeLockProcess();
    const callback = vi.fn(async () => undefined);
    const close = vi.fn(async () => undefined);
    const service = new FlockService({
      openLock: vi.fn(async () => ({ fd: 9, chmod: async () => undefined, close })),
      spawn: () => {
        queueMicrotask(() => {
          process.stderr.write("lock busy");
          process.emit("close", 1, null);
        });
        return process;
      },
      acquisitionTimeoutMs: 100,
    });

    const transaction = service.withLock(callback);
    await expect(transaction).rejects.toThrow("flock exited 1");
    expect(callback).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });

  it("kills timed-out acquisition, closes, and never executes the callback", async () => {
    vi.useFakeTimers();
    const process = new FakeLockProcess();
    const callback = vi.fn(async () => undefined);
    const close = vi.fn(async () => undefined);
    const service = new FlockService({
      openLock: vi.fn(async () => ({ fd: 10, chmod: async () => undefined, close })),
      spawn: () => process,
      acquisitionTimeoutMs: 50,
    });

    const transaction = service.withLock(callback);
    const rejection = expect(transaction).rejects.toThrow("timed out acquiring Yarr plugin lock");
    await vi.advanceTimersByTimeAsync(51);

    await rejection;
    expect(process.kill).toHaveBeenCalledWith("SIGKILL");
    expect(callback).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
