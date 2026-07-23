import { randomBytes } from "node:crypto";

export interface SessionStoreOptions {
  ttlMs?: number;
  maxSessions?: number;
  now?: () => number;
}

interface StoredSession<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_SESSIONS = 64;

export class ExpiringSessionStore<T> {
  private readonly sessions = new Map<string, StoredSession<T>>();
  private readonly ttlMs: number;
  private readonly maxSessions: number;
  private readonly now: () => number;

  constructor(options: SessionStoreOptions = {}) {
    this.ttlMs = positiveInteger(options.ttlMs ?? DEFAULT_TTL_MS, "ttlMs");
    this.maxSessions = positiveInteger(options.maxSessions ?? DEFAULT_MAX_SESSIONS, "maxSessions");
    this.now = options.now ?? Date.now;
  }

  create(value: T): string {
    this.removeExpired();
    while (this.sessions.size >= this.maxSessions) {
      const oldest = this.sessions.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.sessions.delete(oldest);
    }
    let id = opaqueId();
    while (this.sessions.has(id)) id = opaqueId();
    this.sessions.set(id, { value, expiresAt: this.now() + this.ttlMs });
    return id;
  }

  take(id: string): T | undefined {
    this.removeExpired();
    const stored = this.sessions.get(id);
    if (!stored) return undefined;
    this.sessions.delete(id);
    return stored.value;
  }

  private removeExpired(): void {
    const now = this.now();
    for (const [id, stored] of this.sessions) {
      if (stored.expiresAt <= now) this.sessions.delete(id);
    }
  }
}

export function opaqueId(): string {
  return randomBytes(24).toString("base64url");
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}
