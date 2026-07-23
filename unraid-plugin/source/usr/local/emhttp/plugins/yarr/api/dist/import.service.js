"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const import_parser_1 = require("./import-parser");
const service_catalog_1 = require("./service-catalog");
const session_store_1 = require("./session-store");
const MAX_IMPORT_KEYS = 512;
const MAX_IMPORT_VALUE_BYTES = 64 * 1024;
const MAX_IMPORT_BYTES = 512 * 1024;
const KEY_INDEX = buildKeyIndex();
class ImportService {
    config;
    sessions;
    constructor(config, options = {}) {
        this.config = config;
        this.sessions = new session_store_1.ExpiringSessionStore(options);
    }
    async previewText(text) {
        const parsed = (0, import_parser_1.parseImportText)(text);
        const preview = await this.preview(parsed.values);
        return {
            ...preview,
            warnings: [...parsed.warnings, ...preview.warnings],
        };
    }
    async preview(input) {
        assertStructuredInput(input);
        const services = new Map();
        const warnings = [];
        for (const [rawKey, value] of Object.entries(input)) {
            const key = (0, service_catalog_1.normalizeCatalogKey)(rawKey);
            if (key === "YARR_SERVICES") {
                warnUnknownListedServices(value, warnings);
                continue;
            }
            const target = KEY_INDEX.get(key);
            if (!target) {
                warnings.push("Unknown structured key was ignored");
                continue;
            }
            const imported = services.get(target.entry.id) ?? { serviceId: target.entry.id };
            if (target.field === "url") {
                const normalized = (0, service_catalog_1.normalizeServiceUrl)(value);
                if (!normalized) {
                    warnings.push(`${rawKey} must be an http or https URL without embedded credentials`);
                    continue;
                }
                assignOnce(imported, "baseUrl", normalized, rawKey, warnings);
            }
            else {
                assignOnce(imported, target.field, value, rawKey, warnings);
            }
            services.set(target.entry.id, imported);
        }
        const ordered = service_catalog_1.SERVICE_CATALOG
            .map((entry) => services.get(entry.id))
            .filter((entry) => entry !== undefined);
        const previewId = this.sessions.create({ services: new Map(ordered.map((item) => [item.serviceId, item])) });
        return {
            previewId,
            mappings: ordered.map(publicMapping),
            warnings,
        };
    }
    async apply(input) {
        const session = this.sessions.take(input.previewId);
        if (!session)
            throw new Error("invalid or expired import preview");
        const selected = uniqueStrings(input.selectedServiceIds, "selectedServiceIds");
        const updates = [];
        for (const serviceId of selected) {
            const imported = session.services.get(serviceId);
            if (!imported)
                throw new Error(`service ${serviceId} was not present in this import preview`);
            const consent = input.credentialConsent[serviceId] === true;
            updates.push(toConfigUpdate(imported, consent));
        }
        return this.config.save({ services: updates });
    }
}
exports.ImportService = ImportService;
function buildKeyIndex() {
    const index = new Map();
    for (const entry of service_catalog_1.SERVICE_CATALOG) {
        for (const key of entry.urlKeys)
            index.set((0, service_catalog_1.normalizeCatalogKey)(key), { entry, field: "url" });
        for (const key of entry.usernameKeys)
            index.set((0, service_catalog_1.normalizeCatalogKey)(key), { entry, field: "username" });
        for (const key of entry.passwordKeys)
            index.set((0, service_catalog_1.normalizeCatalogKey)(key), { entry, field: "password" });
        for (const key of entry.apiKeyKeys)
            index.set((0, service_catalog_1.normalizeCatalogKey)(key), { entry, field: "apiKey" });
    }
    return index;
}
function publicMapping(imported) {
    return {
        serviceId: imported.serviceId,
        baseUrl: imported.baseUrl ?? null,
        hasUsername: hasValue(imported.username),
        hasPassword: hasValue(imported.password),
        hasApiKey: hasValue(imported.apiKey),
    };
}
function toConfigUpdate(imported, consent) {
    return {
        service: imported.serviceId,
        enabled: true,
        baseUrl: imported.baseUrl,
        username: consent ? imported.username : undefined,
        password: secretUpdate(imported.password, consent),
        apiKey: secretUpdate(imported.apiKey, consent),
    };
}
function secretUpdate(value, consent) {
    return consent && hasValue(value) ? { kind: "set", value } : { kind: "preserve" };
}
function assignOnce(target, field, value, rawKey, warnings) {
    if (target[field] !== undefined && target[field] !== value) {
        warnings.push(`Conflicting structured key ${rawKey} was ignored`);
        return;
    }
    target[field] = value;
}
function assertStructuredInput(input) {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("structured import must be a key/value object");
    }
    const entries = Object.entries(input);
    if (entries.length > MAX_IMPORT_KEYS)
        throw new Error("structured import has too many keys");
    let total = 0;
    for (const [key, value] of entries) {
        if (typeof value !== "string")
            throw new Error(`structured import value for ${key} must be a string`);
        const bytes = Buffer.byteLength(key) + Buffer.byteLength(value);
        if (Buffer.byteLength(value) > MAX_IMPORT_VALUE_BYTES)
            throw new Error(`structured import value for ${key} is too large`);
        total += bytes;
    }
    if (total > MAX_IMPORT_BYTES)
        throw new Error("structured import is too large");
}
function warnUnknownListedServices(value, warnings) {
    const unsupported = value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((serviceId) => serviceId.length > 0 && !service_catalog_1.SERVICE_CATALOG_BY_ID.has(serviceId));
    if (unsupported.length > 0) {
        warnings.push(`YARR_SERVICES contains ${unsupported.length} unsupported ${unsupported.length === 1 ? "entry" : "entries"}`);
    }
}
function uniqueStrings(values, name) {
    if (!Array.isArray(values) || values.some((value) => typeof value !== "string")) {
        throw new Error(`${name} must be an array of service IDs`);
    }
    if (values.length > service_catalog_1.SERVICE_CATALOG.length)
        throw new Error(`${name} contains too many service IDs`);
    if (new Set(values).size !== values.length)
        throw new Error(`${name} must not contain duplicates`);
    return values;
}
function hasValue(value) {
    return value !== undefined && value.length > 0;
}
