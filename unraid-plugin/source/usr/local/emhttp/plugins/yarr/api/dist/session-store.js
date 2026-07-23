"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpiringSessionStore = void 0;
exports.opaqueId = opaqueId;
const node_crypto_1 = require("node:crypto");
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_SESSIONS = 64;
class ExpiringSessionStore {
    sessions = new Map();
    ttlMs;
    maxSessions;
    now;
    constructor(options = {}) {
        this.ttlMs = positiveInteger(options.ttlMs ?? DEFAULT_TTL_MS, "ttlMs");
        this.maxSessions = positiveInteger(options.maxSessions ?? DEFAULT_MAX_SESSIONS, "maxSessions");
        this.now = options.now ?? Date.now;
    }
    create(value) {
        this.removeExpired();
        while (this.sessions.size >= this.maxSessions) {
            const oldest = this.sessions.keys().next().value;
            if (oldest === undefined)
                break;
            this.sessions.delete(oldest);
        }
        let id = opaqueId();
        while (this.sessions.has(id))
            id = opaqueId();
        this.sessions.set(id, { value, expiresAt: this.now() + this.ttlMs });
        return id;
    }
    take(id) {
        this.removeExpired();
        const stored = this.sessions.get(id);
        if (!stored)
            return undefined;
        this.sessions.delete(id);
        return stored.value;
    }
    removeExpired() {
        const now = this.now();
        for (const [id, stored] of this.sessions) {
            if (stored.expiresAt <= now)
                this.sessions.delete(id);
        }
    }
}
exports.ExpiringSessionStore = ExpiringSessionStore;
function opaqueId() {
    return (0, node_crypto_1.randomBytes)(24).toString("base64url");
}
function positiveInteger(value, name) {
    if (!Number.isSafeInteger(value) || value < 1)
        throw new Error(`${name} must be a positive integer`);
    return value;
}
