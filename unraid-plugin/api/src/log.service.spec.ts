import { describe, expect, it, vi } from "vitest";

import type { LockLease, LockService } from "./flock.service";
import { LogService, MAX_LOG_BYTES, MAX_LOG_LINES, type BoundedLogReader } from "./log.service";
import { YARR_ENVIRONMENT_GOOD_PATH, YARR_ENVIRONMENT_PATH, YARR_LOG_PATH } from "./paths";
import { StoredSecretProvider, StoredSecretRedactor } from "./secret-redactor";

class SerialLock implements LockService {
  private tail: Promise<void> = Promise.resolve();

  async withLock<T>(callback: (lease: LockLease) => Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.tail;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await callback({ fd: 3, assertHeld: () => undefined });
    } finally {
      release();
    }
  }
}

describe("LogService", () => {
  it("reads only the fixed log and removes current and known-good generation secrets", async () => {
    const lines = Array.from({ length: 600 }, (_, index) => `line-${index}`);
    lines[599] = "\u001b[31mcurrent-secret previous-secret current-secret\u001b[0m\u0000\u0007";
    const reader: BoundedLogReader = {
      readTail: vi.fn(async () => ({ text: `${lines.join("\n")}\n`, bytesTruncated: true })),
    };
    const paths: string[] = [];
    const provider = new StoredSecretProvider({
      readFile: async (path) => {
        paths.push(path);
        if (path === YARR_ENVIRONMENT_PATH) return "YARR_MCP_TOKEN=current-secret\n";
        if (path === YARR_ENVIRONMENT_GOOD_PATH) return "YARR_MCP_TOKEN=previous-secret\n";
        throw new Error(`unexpected path ${path}`);
      },
    });
    const service = new LogService(reader, new StoredSecretRedactor(provider), new SerialLock());

    const result = await service.read();

    expect(paths).toEqual([YARR_ENVIRONMENT_PATH, YARR_ENVIRONMENT_GOOD_PATH]);
    expect(reader.readTail).toHaveBeenCalledWith(YARR_LOG_PATH, MAX_LOG_BYTES);
    expect(result.lines).toHaveLength(MAX_LOG_LINES);
    expect(result.lines[0]).toBe("line-100");
    expect(result.lines.at(-1)).toBe("  ");
    expect(result.truncated).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/current-secret|previous-secret/);
  });

  it("blocks concurrent rotation until snapshot, bounded read, and redaction complete", async () => {
    const lock = new SerialLock();
    let releaseRead!: () => void;
    const readBlocked = new Promise<void>((resolve) => {
      releaseRead = resolve;
    });
    const reader: BoundedLogReader = {
      readTail: vi.fn(async () => {
        await readBlocked;
        return { text: "secret\n", bytesTruncated: false };
      }),
    };
    const service = new LogService(
      reader,
      new StoredSecretRedactor({ currentSecrets: async () => ["secret"] }),
      lock,
    );

    const reading = service.read();
    await vi.waitFor(() => expect(reader.readTail).toHaveBeenCalledOnce());
    let rotated = false;
    const rotation = lock.withLock(async () => {
      rotated = true;
    });
    await Promise.resolve();
    expect(rotated).toBe(false);
    releaseRead();

    await expect(reading).resolves.toMatchObject({ lines: [""] });
    await rotation;
    expect(rotated).toBe(true);
  });

  it("does not expose a caller-controlled path", () => {
    const service = new LogService(
      { readTail: async () => ({ text: "", bytesTruncated: false }) },
      new StoredSecretRedactor({ currentSecrets: async () => [] }),
      new SerialLock(),
    );

    expect(service.read.length).toBe(0);
  });
});
