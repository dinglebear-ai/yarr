"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = exports.NodeBoundedLogReader = exports.MAX_LOG_BYTES = exports.MAX_LOG_LINES = void 0;
const promises_1 = require("node:fs/promises");
const paths_1 = require("./paths");
const flock_service_1 = require("./flock.service");
const secret_redactor_1 = require("./secret-redactor");
exports.MAX_LOG_LINES = 500;
exports.MAX_LOG_BYTES = 256 * 1024;
class NodeBoundedLogReader {
    async readTail(path, maxBytes) {
        const handle = await (0, promises_1.open)(path, "r");
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
        }
        finally {
            await handle.close();
        }
    }
}
exports.NodeBoundedLogReader = NodeBoundedLogReader;
class LogService {
    reader;
    redactor;
    lock;
    constructor(reader = new NodeBoundedLogReader(), redactor = new secret_redactor_1.StoredSecretRedactor(), lock = new flock_service_1.FlockService()) {
        this.reader = reader;
        this.redactor = redactor;
        this.lock = lock;
    }
    async read() {
        return this.lock.withLock(async (lease) => {
            const snapshot = await this.redactor.snapshot();
            lease.assertHeld();
            const result = await this.reader.readTail(paths_1.YARR_LOG_PATH, exports.MAX_LOG_BYTES);
            lease.assertHeld();
            const allLines = result.text.replaceAll("\r\n", "\n").split("\n");
            if (allLines.at(-1) === "")
                allLines.pop();
            const linesTruncated = allLines.length > exports.MAX_LOG_LINES;
            const sanitized = allLines.slice(-exports.MAX_LOG_LINES).map(sanitizeLogLine);
            return {
                lines: snapshot.redactMany(sanitized),
                truncated: result.bytesTruncated || linesTruncated,
            };
        });
    }
}
exports.LogService = LogService;
function sanitizeLogLine(line) {
    return line
        .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
        .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
}
