"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePluginConfig = parsePluginConfig;
exports.serializePluginConfig = serializePluginConfig;
exports.parseYarrEnvironment = parseYarrEnvironment;
exports.serializeYarrEnvironment = serializeYarrEnvironment;
exports.toPublicConfig = toPublicConfig;
exports.mergeConfigInput = mergeConfigInput;
exports.validateConfigState = validateConfigState;
const node_net_1 = require("node:net");
const service_catalog_1 = require("./service-catalog");
const PLUGIN_DEFAULTS = {
    ENABLED: "yes",
    BIND_MODE: "loopback",
    CUSTOM_HOST: "",
    PORT: "40070",
    AUTH_MODE: "bearer",
    TAILSCALE_SERVE: "no",
    TAILSCALE_HOSTNAME: "",
    LOG_LEVEL: "info",
    UPDATE_CHANNEL: "stable",
};
const INPUT_KEYS = new Set([
    "enabled",
    "bindMode",
    "customHost",
    "port",
    "authMode",
    "tailscaleServe",
    "tailscaleHostname",
    "logLevel",
    "updateChannel",
    "bearerToken",
    "googleClientId",
    "googleClientSecret",
    "trustedGatewayHosts",
    "trustedGatewayOrigins",
    "services",
]);
const BIND_MODES = new Set(["loopback", "lan", "custom"]);
const AUTH_MODES = new Set(["bearer", "google-oauth", "trusted-gateway"]);
const LOG_LEVELS = new Set(["trace", "debug", "info", "warn", "error"]);
function parsePluginConfig(text) {
    return { values: parseAssignments(text, "yarr.cfg") };
}
function serializePluginConfig(config) {
    return serializeAssignments(config.values);
}
function parseYarrEnvironment(text) {
    return { values: parseAssignments(text, ".env") };
}
function serializeYarrEnvironment(config) {
    return serializeAssignments(config.values);
}
function toPublicConfig(plugin, env) {
    const publicPlugin = pluginConfig(plugin.values);
    const baseUrl = `http://${urlHost(effectiveHost(publicPlugin))}:${publicPlugin.port}`;
    const extra = {};
    for (const key of ["YARR_MCP_ALLOWED_HOSTS", "YARR_MCP_ALLOWED_ORIGINS"]) {
        const value = env.values[key];
        if (value !== undefined) {
            extra[key] = value;
        }
    }
    const enabledServices = new Set((env.values.YARR_SERVICES ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
    return {
        plugin: publicPlugin,
        services: [
            {
                service: "yarr",
                enabled: publicPlugin.enabled,
                baseUrl,
                username: env.values.YARR_MCP_GOOGLE_CLIENT_ID ?? null,
                hasPassword: hasValue(env.values.YARR_MCP_GOOGLE_CLIENT_SECRET),
                hasApiKey: hasValue(env.values.YARR_MCP_TOKEN),
                extra,
            },
            ...service_catalog_1.SERVICE_CATALOG.map((entry) => ({
                service: entry.id,
                enabled: enabledServices.has(entry.id),
                baseUrl: safePublicServiceUrl(firstValue(env.values, entry.urlKeys)),
                username: null,
                hasPassword: hasValue(firstValue(env.values, entry.passwordKeys)),
                hasApiKey: hasValue(firstValue(env.values, entry.apiKeyKeys)),
                extra: {},
            })),
        ],
    };
}
function mergeConfigInput(current, input) {
    assertInputKeys(input);
    const plugin = { values: { ...current.plugin.values } };
    const env = { values: { ...current.env.values } };
    applyBoolean(input.enabled, plugin.values, "ENABLED");
    applyEnum(input.bindMode, BIND_MODES, plugin.values, "BIND_MODE", "bindMode");
    applyString(input.customHost, plugin.values, "CUSTOM_HOST", "customHost");
    applyPort(input.port, plugin.values);
    applyEnum(input.authMode, AUTH_MODES, plugin.values, "AUTH_MODE", "authMode");
    applyBoolean(input.tailscaleServe, plugin.values, "TAILSCALE_SERVE");
    applyString(input.tailscaleHostname, plugin.values, "TAILSCALE_HOSTNAME", "tailscaleHostname");
    applyEnum(input.logLevel, LOG_LEVELS, plugin.values, "LOG_LEVEL", "logLevel");
    applyEnum(input.updateChannel, new Set(["stable"]), plugin.values, "UPDATE_CHANNEL", "updateChannel");
    applySecret(input.bearerToken, env.values, "YARR_MCP_TOKEN", "bearerToken");
    applyString(input.googleClientId, env.values, "YARR_MCP_GOOGLE_CLIENT_ID", "googleClientId");
    applySecret(input.googleClientSecret, env.values, "YARR_MCP_GOOGLE_CLIENT_SECRET", "googleClientSecret");
    applyString(input.trustedGatewayHosts, env.values, "YARR_MCP_ALLOWED_HOSTS", "trustedGatewayHosts");
    applyString(input.trustedGatewayOrigins, env.values, "YARR_MCP_ALLOWED_ORIGINS", "trustedGatewayOrigins");
    applyServiceInputs(input.services, env.values);
    const merged = { plugin, env };
    validateConfigState(merged);
    return merged;
}
function applyServiceInputs(services, values) {
    if (services === undefined)
        return;
    if (!Array.isArray(services) || services.length > service_catalog_1.SERVICE_CATALOG.length) {
        throw new Error("services must be an array of supported service updates");
    }
    const enabled = (values.YARR_SERVICES ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    const seen = new Set();
    for (const update of services) {
        if (update === null || typeof update !== "object" || Array.isArray(update)) {
            throw new Error("service update must be an object");
        }
        for (const key of Object.keys(update)) {
            if (!["service", "enabled", "baseUrl", "username", "password", "apiKey"].includes(key)) {
                throw new Error(`unknown service update field ${key}`);
            }
        }
        const entry = typeof update.service === "string" ? service_catalog_1.SERVICE_CATALOG_BY_ID.get(update.service) : undefined;
        if (!entry)
            throw new Error(`unsupported service ${String(update.service)}`);
        if (seen.has(entry.id))
            throw new Error(`duplicate service update ${entry.id}`);
        seen.add(entry.id);
        if (update.enabled !== undefined) {
            if (typeof update.enabled !== "boolean")
                throw new Error(`${entry.id}.enabled must be a boolean`);
            const index = enabled.findIndex((value) => value.toLowerCase() === entry.id);
            if (update.enabled && index < 0)
                enabled.push(entry.id);
            if (!update.enabled && index >= 0)
                enabled.splice(index, 1);
        }
        if (update.baseUrl !== undefined) {
            const normalized = (0, service_catalog_1.normalizeServiceUrl)(update.baseUrl);
            if (!normalized) {
                throw new Error(`${entry.id}.baseUrl must be a bounded http or https URL without credentials, query, or fragment`);
            }
            values[entry.urlKeys[0]] = normalized;
        }
        if (update.username !== undefined) {
            if (entry.usernameKeys.length === 0)
                throw new Error(`${entry.id} does not support a username`);
            applyString(update.username, values, entry.usernameKeys[0], `${entry.id}.username`);
        }
        applyCatalogSecret(update.password, values, entry.passwordKeys[0], `${entry.id}.password`);
        applyCatalogSecret(update.apiKey, values, entry.apiKeyKeys[0], `${entry.id}.apiKey`);
    }
    if (enabled.length > 0)
        values.YARR_SERVICES = enabled.join(",");
    else
        delete values.YARR_SERVICES;
}
function applyCatalogSecret(update, values, key, inputKey) {
    if (update === undefined || update.kind === "preserve")
        return;
    if (!key)
        throw new Error(`${inputKey} is not supported`);
    applySecret(update, values, key, inputKey);
}
function firstValue(values, keys) {
    for (const key of keys) {
        if (hasValue(values[key]))
            return values[key];
    }
    return undefined;
}
function safePublicServiceUrl(value) {
    return value === undefined ? "" : (0, service_catalog_1.normalizeServiceUrl)(value) ?? "";
}
function validateConfigState(state) {
    const config = pluginConfig(state.plugin.values);
    const env = state.env.values;
    if (config.bindMode === "custom" && (0, node_net_1.isIP)(config.customHost) === 0) {
        throw new Error("custom bind mode requires an IP address");
    }
    if (config.tailscaleServe && config.tailscaleHostname.length === 0) {
        throw new Error("Tailscale Serve requires a hostname");
    }
    if (config.authMode === "trusted-gateway") {
        if (config.bindMode !== "loopback" || config.tailscaleServe) {
            throw new Error("trusted-gateway authentication is restricted to loopback without Tailscale Serve; network exposure requires bearer or google-oauth authentication");
        }
        if (!hasYarrListItem(env.YARR_MCP_ALLOWED_HOSTS) && !hasYarrListItem(env.YARR_MCP_ALLOWED_ORIGINS)) {
            throw new Error("trusted-gateway authentication requires at least one allowed host or origin");
        }
        return;
    }
    if (config.bindMode === "loopback" && !config.tailscaleServe) {
        return;
    }
    if (config.authMode === "bearer" && hasValue(env.YARR_MCP_TOKEN)) {
        return;
    }
    if (config.authMode === "google-oauth" &&
        hasValue(env.YARR_MCP_GOOGLE_CLIENT_ID) &&
        hasValue(env.YARR_MCP_GOOGLE_CLIENT_SECRET)) {
        return;
    }
    throw new Error(`network exposure requires configured ${config.authMode} authentication`);
}
function parseAssignments(text, fileName) {
    const values = {};
    const normalized = text.replaceAll("\r\n", "\n");
    for (const [index, line] of normalized.split("\n").entries()) {
        if (line.length === 0 || line.startsWith("#")) {
            continue;
        }
        const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
        if (!match) {
            throw new Error(`${fileName}:${index + 1}: expected KEY=value`);
        }
        const [, key, rawValue] = match;
        if (Object.hasOwn(values, key)) {
            throw new Error(`${fileName}:${index + 1}: duplicate key ${key}`);
        }
        assertSafeValue(rawValue, `${fileName}:${index + 1}`);
        values[key] = rawValue;
    }
    return values;
}
function serializeAssignments(values) {
    const lines = Object.entries(values)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, rawValue]) => {
        if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
            throw new Error(`invalid configuration key ${key}`);
        }
        assertSafeValue(rawValue, key);
        return `${key}=${rawValue}`;
    });
    return `${lines.join("\n")}\n`;
}
function pluginConfig(values) {
    const raw = { ...PLUGIN_DEFAULTS, ...values };
    const port = Number(raw.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer from 1 to 65535");
    }
    if (!BIND_MODES.has(raw.BIND_MODE)) {
        throw new Error("BIND_MODE is invalid");
    }
    if (!AUTH_MODES.has(raw.AUTH_MODE)) {
        throw new Error("AUTH_MODE is invalid");
    }
    if (!LOG_LEVELS.has(raw.LOG_LEVEL)) {
        throw new Error("LOG_LEVEL is invalid");
    }
    if (raw.UPDATE_CHANNEL !== "stable") {
        throw new Error("UPDATE_CHANNEL must be stable");
    }
    return {
        enabled: parseBoolean(raw.ENABLED, "ENABLED"),
        bindMode: raw.BIND_MODE,
        customHost: raw.CUSTOM_HOST,
        port,
        authMode: raw.AUTH_MODE,
        tailscaleServe: parseBoolean(raw.TAILSCALE_SERVE, "TAILSCALE_SERVE"),
        tailscaleHostname: raw.TAILSCALE_HOSTNAME,
        logLevel: raw.LOG_LEVEL,
        updateChannel: "stable",
    };
}
function assertInputKeys(input) {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("configuration input must be an object");
    }
    for (const key of Object.keys(input)) {
        if (!INPUT_KEYS.has(key)) {
            throw new Error(`unknown configuration input field ${key}`);
        }
    }
}
function applyBoolean(value, values, key) {
    if (value === undefined) {
        return;
    }
    if (typeof value !== "boolean") {
        throw new Error(`${key} must be a boolean`);
    }
    values[key] = value ? "yes" : "no";
}
function applyEnum(value, allowed, values, key, inputKey) {
    if (value === undefined) {
        return;
    }
    if (!allowed.has(value)) {
        throw new Error(`${inputKey} is invalid`);
    }
    values[key] = value;
}
function applyString(value, values, key, inputKey) {
    if (value === undefined) {
        return;
    }
    if (typeof value !== "string") {
        throw new Error(`${inputKey} must be a string`);
    }
    assertSafeValue(value, inputKey);
    values[key] = value;
}
function applyPort(value, values) {
    if (value === undefined) {
        return;
    }
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error("port must be an integer from 1 to 65535");
    }
    values.PORT = String(value);
}
function applySecret(update, values, key, inputKey) {
    if (update === undefined) {
        return;
    }
    if (update === null || typeof update !== "object" || Array.isArray(update)) {
        throw new Error(`${inputKey} must be a secret update`);
    }
    if (update.kind === "preserve" && Object.keys(update).length === 1) {
        return;
    }
    if (update.kind === "clear" && Object.keys(update).length === 1) {
        delete values[key];
        return;
    }
    if (update.kind === "set" &&
        Object.keys(update).length === 2 &&
        typeof update.value === "string" &&
        update.value.length > 0) {
        assertSafeValue(update.value, inputKey);
        values[key] = update.value;
        return;
    }
    throw new Error(`${inputKey} is invalid`);
}
function parseBoolean(value, key) {
    if (value === "yes") {
        return true;
    }
    if (value === "no") {
        return false;
    }
    throw new Error(`${key} must be yes or no`);
}
function effectiveHost(config) {
    if (config.bindMode === "loopback") {
        return "127.0.0.1";
    }
    if (config.bindMode === "lan") {
        return "0.0.0.0";
    }
    return config.customHost;
}
function urlHost(host) {
    return host.includes(":") ? `[${host}]` : host;
}
function hasValue(value) {
    return value !== undefined && value.length > 0;
}
function hasYarrListItem(value) {
    return value?.split(",").some((item) => item.trim().length > 0) ?? false;
}
function assertSafeValue(value, context) {
    if (value.includes("\r") || value.includes("\n")) {
        throw new Error(`${context} contains a line break`);
    }
    if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(value)) {
        throw new Error(`${context} contains a control character`);
    }
}
