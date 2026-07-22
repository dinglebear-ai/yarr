import { describe, expect, it, vi } from "vitest";

import { LogService, MAX_LOG_BYTES, MAX_LOG_LINES, type BoundedLogReader } from "./log.service";
import { YARR_LOG_PATH } from "./paths";

describe("LogService", () => {
  it("reads only the fixed Yarr log with fixed byte and line bounds", async () => {
    const lines = Array.from({ length: 600 }, (_, index) => `line-${index}`);
    lines[599] = "\u001b[31merror\u001b[0m\u0000\u0007";
    const reader: BoundedLogReader = {
      readTail: vi.fn(async () => ({ text: `${lines.join("\n")}\n`, bytesTruncated: true })),
    };
    const service = new LogService(reader);

    const result = await service.read();

    expect(reader.readTail).toHaveBeenCalledWith(YARR_LOG_PATH, MAX_LOG_BYTES);
    expect(result.lines).toHaveLength(MAX_LOG_LINES);
    expect(result.lines[0]).toBe("line-100");
    expect(result.lines.at(-1)).toBe("error");
    expect(result.truncated).toBe(true);
  });

  it("does not expose a caller-controlled path", () => {
    const service = new LogService({
      readTail: async () => ({ text: "", bytesTruncated: false }),
    });

    expect(service.read.length).toBe(0);
  });
});
