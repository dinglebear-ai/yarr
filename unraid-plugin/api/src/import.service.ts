import type { SaveConfigResult } from "./config.service";
import type { SaveYarrConfigInput, SaveYarrServiceInput, SecretUpdate } from "./config.types";
import {
  normalizeCatalogKey,
  normalizeServiceUrl,
  SERVICE_CATALOG,
  SERVICE_CATALOG_BY_ID,
  type ServiceCatalogEntry,
} from "./service-catalog";
import { ExpiringSessionStore, type SessionStoreOptions } from "./session-store";

export interface ImportMapping {
  serviceId: string;
  baseUrl: string | null;
  hasUsername: boolean;
  hasPassword: boolean;
  hasApiKey: boolean;
}

export interface ImportPreview {
  previewId: string;
  mappings: ImportMapping[];
  warnings: string[];
}

export interface ApplyImportInput {
  previewId: string;
  selectedServiceIds: string[];
  credentialConsent: Record<string, boolean>;
}

export interface ConfigWriter {
  save(input: SaveYarrConfigInput): Promise<SaveConfigResult>;
}

interface ImportedService {
  serviceId: string;
  baseUrl?: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

interface ImportSession {
  services: Map<string, ImportedService>;
}

type Field = "url" | "username" | "password" | "apiKey";
interface KeyTarget {
  entry: ServiceCatalogEntry;
  field: Field;
}

const MAX_IMPORT_KEYS = 512;
const MAX_IMPORT_VALUE_BYTES = 64 * 1024;
const MAX_IMPORT_BYTES = 512 * 1024;
const KEY_INDEX = buildKeyIndex();

export class ImportService {
  private readonly sessions: ExpiringSessionStore<ImportSession>;

  constructor(private readonly config: ConfigWriter, options: SessionStoreOptions = {}) {
    this.sessions = new ExpiringSessionStore(options);
  }

  async preview(input: Record<string, string>): Promise<ImportPreview> {
    assertStructuredInput(input);
    const services = new Map<string, ImportedService>();
    const warnings: string[] = [];

    for (const [rawKey, value] of Object.entries(input)) {
      const key = normalizeCatalogKey(rawKey);
      if (key === "YARR_SERVICES") {
        warnUnknownListedServices(value, warnings);
        continue;
      }
      const target = KEY_INDEX.get(key);
      if (!target) {
        warnings.push(`Unknown structured key ${rawKey}`);
        continue;
      }
      const imported = services.get(target.entry.id) ?? { serviceId: target.entry.id };
      if (target.field === "url") {
        const normalized = normalizeServiceUrl(value);
        if (!normalized) {
          warnings.push(`${rawKey} must be an http or https URL without embedded credentials`);
          continue;
        }
        assignOnce(imported, "baseUrl", normalized, rawKey, warnings);
      } else {
        assignOnce(imported, target.field, value, rawKey, warnings);
      }
      services.set(target.entry.id, imported);
    }

    const ordered = SERVICE_CATALOG
      .map((entry) => services.get(entry.id))
      .filter((entry): entry is ImportedService => entry !== undefined);
    const previewId = this.sessions.create({ services: new Map(ordered.map((item) => [item.serviceId, item])) });
    return {
      previewId,
      mappings: ordered.map(publicMapping),
      warnings,
    };
  }

  async apply(input: ApplyImportInput): Promise<SaveConfigResult> {
    const session = this.sessions.take(input.previewId);
    if (!session) throw new Error("invalid or expired import preview");
    const selected = uniqueStrings(input.selectedServiceIds, "selectedServiceIds");
    const updates: SaveYarrServiceInput[] = [];

    for (const serviceId of selected) {
      const imported = session.services.get(serviceId);
      if (!imported) throw new Error(`service ${serviceId} was not present in this import preview`);
      const consent = input.credentialConsent[serviceId] === true;
      updates.push(toConfigUpdate(imported, consent));
    }
    return this.config.save({ services: updates });
  }
}

function buildKeyIndex(): ReadonlyMap<string, KeyTarget> {
  const index = new Map<string, KeyTarget>();
  for (const entry of SERVICE_CATALOG) {
    for (const key of entry.urlKeys) index.set(normalizeCatalogKey(key), { entry, field: "url" });
    for (const key of entry.usernameKeys) index.set(normalizeCatalogKey(key), { entry, field: "username" });
    for (const key of entry.passwordKeys) index.set(normalizeCatalogKey(key), { entry, field: "password" });
    for (const key of entry.apiKeyKeys) index.set(normalizeCatalogKey(key), { entry, field: "apiKey" });
  }
  return index;
}

function publicMapping(imported: ImportedService): ImportMapping {
  return {
    serviceId: imported.serviceId,
    baseUrl: imported.baseUrl ?? null,
    hasUsername: hasValue(imported.username),
    hasPassword: hasValue(imported.password),
    hasApiKey: hasValue(imported.apiKey),
  };
}

function toConfigUpdate(imported: ImportedService, consent: boolean): SaveYarrServiceInput {
  return {
    service: imported.serviceId,
    enabled: true,
    baseUrl: imported.baseUrl,
    username: consent ? imported.username : undefined,
    password: secretUpdate(imported.password, consent),
    apiKey: secretUpdate(imported.apiKey, consent),
  };
}

function secretUpdate(value: string | undefined, consent: boolean): SecretUpdate {
  return consent && hasValue(value) ? { kind: "set", value } : { kind: "preserve" };
}

function assignOnce(
  target: ImportedService,
  field: "baseUrl" | "username" | "password" | "apiKey",
  value: string,
  rawKey: string,
  warnings: string[],
): void {
  if (target[field] !== undefined && target[field] !== value) {
    warnings.push(`Conflicting structured key ${rawKey} was ignored`);
    return;
  }
  target[field] = value;
}

function assertStructuredInput(input: Record<string, string>): void {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("structured import must be a key/value object");
  }
  const entries = Object.entries(input);
  if (entries.length > MAX_IMPORT_KEYS) throw new Error("structured import has too many keys");
  let total = 0;
  for (const [key, value] of entries) {
    if (typeof value !== "string") throw new Error(`structured import value for ${key} must be a string`);
    const bytes = Buffer.byteLength(key) + Buffer.byteLength(value);
    if (Buffer.byteLength(value) > MAX_IMPORT_VALUE_BYTES) throw new Error(`structured import value for ${key} is too large`);
    total += bytes;
  }
  if (total > MAX_IMPORT_BYTES) throw new Error("structured import is too large");
}

function warnUnknownListedServices(value: string, warnings: string[]): void {
  for (const serviceId of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    if (!SERVICE_CATALOG_BY_ID.has(serviceId.toLowerCase())) {
      warnings.push(`Unknown YARR_SERVICES entry ${serviceId}`);
    }
  }
}

function uniqueStrings(values: unknown, name: string): string[] {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string")) {
    throw new Error(`${name} must be an array of service IDs`);
  }
  if (values.length > SERVICE_CATALOG.length) throw new Error(`${name} contains too many service IDs`);
  if (new Set(values).size !== values.length) throw new Error(`${name} must not contain duplicates`);
  return values;
}

function hasValue(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
}
