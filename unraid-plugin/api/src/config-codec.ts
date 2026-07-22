import { isIP } from "node:net";

import type {
  AuthMode,
  BindMode,
  LogLevel,
  ParsedConfigState,
  ParsedPluginConfig,
  ParsedYarrEnvironment,
  SaveYarrConfigInput,
  SecretUpdate,
  YarrConfigView,
  YarrPluginConfig,
} from "./config.types";

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
} as const;

const INPUT_KEYS = new Set<keyof SaveYarrConfigInput>([
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
]);

const BIND_MODES = new Set<BindMode>(["loopback", "lan", "custom"]);
const AUTH_MODES = new Set<AuthMode>(["bearer", "google-oauth", "trusted-gateway"]);
const LOG_LEVELS = new Set<LogLevel>(["trace", "debug", "info", "warn", "error"]);

export function parsePluginConfig(text: string): ParsedPluginConfig {
  return { values: parseAssignments(text, "yarr.cfg", false) };
}

export function serializePluginConfig(config: ParsedPluginConfig): string {
  return serializeAssignments(config.values, false);
}

export function parseYarrEnvironment(text: string): ParsedYarrEnvironment {
  return { values: parseAssignments(text, ".env", true) };
}

export function serializeYarrEnvironment(config: ParsedYarrEnvironment): string {
  return serializeAssignments(config.values, true);
}

export function toPublicConfig(
  plugin: ParsedPluginConfig,
  env: ParsedYarrEnvironment,
): YarrConfigView {
  const publicPlugin = pluginConfig(plugin.values);
  const baseUrl = `http://${urlHost(effectiveHost(publicPlugin))}:${publicPlugin.port}`;
  const extra: Record<string, string> = {};

  for (const key of ["YARR_MCP_ALLOWED_HOSTS", "YARR_MCP_ALLOWED_ORIGINS"] as const) {
    const value = env.values[key];
    if (value !== undefined) {
      extra[key] = value;
    }
  }

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
    ],
  };
}

export function mergeConfigInput(
  current: ParsedConfigState,
  input: SaveYarrConfigInput,
): ParsedConfigState {
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
  applySecret(
    input.googleClientSecret,
    env.values,
    "YARR_MCP_GOOGLE_CLIENT_SECRET",
    "googleClientSecret",
  );
  applyString(
    input.trustedGatewayHosts,
    env.values,
    "YARR_MCP_ALLOWED_HOSTS",
    "trustedGatewayHosts",
  );
  applyString(
    input.trustedGatewayOrigins,
    env.values,
    "YARR_MCP_ALLOWED_ORIGINS",
    "trustedGatewayOrigins",
  );

  const merged = { plugin, env };
  validateConfigState(merged);
  return merged;
}

export function validateConfigState(state: ParsedConfigState): void {
  const config = pluginConfig(state.plugin.values);
  const env = state.env.values;

  if (config.bindMode === "custom" && isIP(config.customHost) === 0) {
    throw new Error("custom bind mode requires an IP address");
  }
  if (config.tailscaleServe && config.tailscaleHostname.length === 0) {
    throw new Error("Tailscale Serve requires a hostname");
  }
  if (config.bindMode === "loopback") {
    return;
  }

  if (config.authMode === "bearer" && hasValue(env.YARR_MCP_TOKEN)) {
    return;
  }
  if (
    config.authMode === "google-oauth" &&
    hasValue(env.YARR_MCP_GOOGLE_CLIENT_ID) &&
    hasValue(env.YARR_MCP_GOOGLE_CLIENT_SECRET)
  ) {
    return;
  }
  if (
    config.authMode === "trusted-gateway" &&
    (hasValue(env.YARR_MCP_ALLOWED_HOSTS) || hasValue(env.YARR_MCP_ALLOWED_ORIGINS))
  ) {
    return;
  }

  throw new Error(`non-loopback configuration requires supported ${config.authMode} authentication`);
}

function parseAssignments(text: string, fileName: string, decodeEscapedNewlines: boolean): Record<string, string> {
  const values: Record<string, string> = {};
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
    const value = decodeEscapedNewlines ? rawValue.replaceAll("\\\\n", "\n") : rawValue;
    assertSafeValue(value, `${fileName}:${index + 1}`);
    values[key] = value;
  }

  return values;
}

function serializeAssignments(values: Record<string, string>, encodeEscapedNewlines: boolean): string {
  const lines = Object.entries(values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, rawValue]) => {
      if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
        throw new Error(`invalid configuration key ${key}`);
      }
      assertSafeValue(rawValue, key);
      const value = encodeEscapedNewlines ? rawValue.replaceAll("\n", "\\n") : rawValue;
      return `${key}=${value}`;
    });

  return `${lines.join("\n")}\n`;
}

function pluginConfig(values: Record<string, string>): YarrPluginConfig {
  const raw = { ...PLUGIN_DEFAULTS, ...values };
  const port = Number(raw.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }
  if (!BIND_MODES.has(raw.BIND_MODE as BindMode)) {
    throw new Error("BIND_MODE is invalid");
  }
  if (!AUTH_MODES.has(raw.AUTH_MODE as AuthMode)) {
    throw new Error("AUTH_MODE is invalid");
  }
  if (!LOG_LEVELS.has(raw.LOG_LEVEL as LogLevel)) {
    throw new Error("LOG_LEVEL is invalid");
  }
  if (raw.UPDATE_CHANNEL !== "stable") {
    throw new Error("UPDATE_CHANNEL must be stable");
  }

  return {
    enabled: parseBoolean(raw.ENABLED, "ENABLED"),
    bindMode: raw.BIND_MODE as BindMode,
    customHost: raw.CUSTOM_HOST,
    port,
    authMode: raw.AUTH_MODE as AuthMode,
    tailscaleServe: parseBoolean(raw.TAILSCALE_SERVE, "TAILSCALE_SERVE"),
    tailscaleHostname: raw.TAILSCALE_HOSTNAME,
    logLevel: raw.LOG_LEVEL as LogLevel,
    updateChannel: "stable",
  };
}

function assertInputKeys(input: SaveYarrConfigInput): void {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("configuration input must be an object");
  }
  for (const key of Object.keys(input)) {
    if (!INPUT_KEYS.has(key as keyof SaveYarrConfigInput)) {
      throw new Error(`unknown configuration input field ${key}`);
    }
  }
}

function applyBoolean(value: boolean | undefined, values: Record<string, string>, key: string): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "boolean") {
    throw new Error(`${key} must be a boolean`);
  }
  values[key] = value ? "yes" : "no";
}

function applyEnum<T extends string>(
  value: T | undefined,
  allowed: ReadonlySet<T>,
  values: Record<string, string>,
  key: string,
  inputKey: string,
): void {
  if (value === undefined) {
    return;
  }
  if (!allowed.has(value)) {
    throw new Error(`${inputKey} is invalid`);
  }
  values[key] = value;
}

function applyString(
  value: string | undefined,
  values: Record<string, string>,
  key: string,
  inputKey: string,
): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string") {
    throw new Error(`${inputKey} must be a string`);
  }
  assertSafeValue(value, inputKey);
  values[key] = value;
}

function applyPort(value: number | undefined, values: Record<string, string>): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error("port must be an integer from 1 to 65535");
  }
  values.PORT = String(value);
}

function applySecret(
  update: SecretUpdate | undefined,
  values: Record<string, string>,
  key: string,
  inputKey: string,
): void {
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
  if (
    update.kind === "set" &&
    Object.keys(update).length === 2 &&
    typeof update.value === "string" &&
    update.value.length > 0
  ) {
    assertSafeValue(update.value, inputKey);
    values[key] = update.value;
    return;
  }
  throw new Error(`${inputKey} is invalid`);
}

function parseBoolean(value: string, key: string): boolean {
  if (value === "yes") {
    return true;
  }
  if (value === "no") {
    return false;
  }
  throw new Error(`${key} must be yes or no`);
}

function effectiveHost(config: YarrPluginConfig): string {
  if (config.bindMode === "loopback") {
    return "127.0.0.1";
  }
  if (config.bindMode === "lan") {
    return "0.0.0.0";
  }
  return config.customHost;
}

function urlHost(host: string): string {
  return host.includes(":") ? `[${host}]` : host;
}

function hasValue(value: string | undefined): boolean {
  return value !== undefined && value.length > 0;
}

function assertSafeValue(value: string, context: string): void {
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(value)) {
    throw new Error(`${context} contains a control character`);
  }
}
