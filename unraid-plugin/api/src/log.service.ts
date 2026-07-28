import { open } from "node:fs/promises";

import { YARR_LOG_PATH } from "./paths";
import { FlockService, type LockService } from "./flock.service";
import { StoredSecretRedactor, type SecretRedactor } from "./secret-redactor";

export const MAX_LOG_LINES = 500;
export const MAX_LOG_BYTES = 256 * 1024;

export interface BoundedLogRead {
  text: string;
  bytesTruncated: boolean;
}

export interface BoundedLogReader {
  readTail(path: string, maxBytes: number): Promise<BoundedLogRead>;
}

export interface LogReadResult {
  lines: string[];
  truncated: boolean;
}

export class NodeBoundedLogReader implements BoundedLogReader {
  async readTail(path: string, maxBytes: number): Promise<BoundedLogRead> {
    const handle = await open(path, "r");
    try {
      const stat = await handle.stat();
      const position = Math.max(0, stat.size - maxBytes);
      const length = Math.min(stat.size, maxBytes);
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, position);
      let text = buffer.subarray(0, bytesRead).toString("utf8");
      if (position > 0) {
        const firstNewline = text.indexOf("\n");
        text = firstNewline === -1 ? "" : text.slice(firstNewline + 1);
      }
      return { text, bytesTruncated: position > 0 };
    } finally {
      await handle.close();
    }
  }
}

export class LogService {
  constructor(
    private readonly reader: BoundedLogReader = new NodeBoundedLogReader(),
    private readonly redactor: SecretRedactor = new StoredSecretRedactor(),
    private readonly lock: LockService = new FlockService(),
  ) {}

  async read(): Promise<LogReadResult> {
    return this.lock.withLock(async (lease) => {
      const snapshot = await this.redactor.snapshot();
      lease.assertHeld();
      const result = await this.reader.readTail(YARR_LOG_PATH, MAX_LOG_BYTES);
      lease.assertHeld();
      const allLines = result.text.replaceAll("\r\n", "\n").split("\n");
      if (allLines.at(-1) === "") allLines.pop();
      const linesTruncated = allLines.length > MAX_LOG_LINES;
      const sanitized = allLines.slice(-MAX_LOG_LINES).map(sanitizeLogLine);
      return {
        lines: snapshot.redactMany(sanitized),
        truncated: result.bytesTruncated || linesTruncated,
      };
    });
  }
}

function sanitizeLogLine(line: string): string {
  return line
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
}
