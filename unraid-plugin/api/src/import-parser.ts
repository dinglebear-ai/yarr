import {
  SERVICE_CATALOG_BY_ID,
  normalizeCatalogKey,
  type ServiceCatalogEntry,
} from "./service-catalog";

export interface ParsedImportText {
  format: "env" | "toml";
  values: Record<string, string>;
  warnings: string[];
}

type TomlScalar = string | number | boolean;
type TomlValue = TomlScalar | TomlScalar[];
type TomlTable = "yarr" | "mcp" | "mcp.auth" | "yarr.services";

const ENV_KEY = /^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/;
const MCP_FIELDS = new Set([
  "host",
  "port",
  "server_name",
  "codemode_max_concurrent",
  "codemode_queue_timeout_ms",
  "codemode_timeout_secs",
  "no_auth",
  "api_token",
  "allowed_hosts",
  "allowed_origins",
]);
const MCP_AUTH_FIELDS = new Set([
  "mode",
  "public_url",
  "google_client_id",
  "google_client_secret",
  "admin_email",
  "allowed_emails",
  "sqlite_path",
  "key_path",
  "access_token_ttl_secs",
  "refresh_token_ttl_secs",
  "auth_code_ttl_secs",
  "register_rpm",
  "authorize_rpm",
  "disable_static_token_with_oauth",
  "allowed_client_redirect_uris",
]);
const SERVICE_FIELDS = new Set([
  "name",
  "kind",
  "base_url",
  "api_key",
  "username",
  "password",
  "token",
]);

export function parseImportText(text: string): ParsedImportText {
  if (text.includes("\u0000")) throw new Error("import text contains an invalid NUL byte");
  const normalized = text.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const first = normalized
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("#"));
  if (first === undefined) throw new Error("import text is empty");
  if (first.startsWith("[")) return parseToml(normalized);
  if (/^(?:export\s+)?[A-Za-z_][A-Za-z0-9_.-]{0,127}\s*=/.test(first)) {
    return parseEnvironment(normalized);
  }
  throw new Error("import text must contain .env assignments or Yarr TOML");
}

function parseEnvironment(text: string): ParsedImportText {
  const values = Object.create(null) as Record<string, string>;
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index].trim();
    if (line === "" || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice(7).trimStart();
    const separator = line.indexOf("=");
    const key = separator === -1 ? "" : line.slice(0, separator).trim();
    if (!ENV_KEY.test(key) || Object.hasOwn(values, key)) {
      throw new Error(`invalid .env import entry on line ${index + 1}`);
    }
    values[key] = parseEnvironmentValue(line.slice(separator + 1), index + 1);
  }
  return { format: "env", values, warnings: [] };
}

function parseEnvironmentValue(raw: string, line: number): string {
  const value = raw.trim();
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed !== "string") throw new Error("not a string");
      return parsed;
    } catch {
      throw new Error(`invalid quoted .env value on line ${line}`);
    }
  }
  if (value.startsWith("'")) {
    if (value.length < 2 || !value.endsWith("'") || value.slice(1, -1).includes("'")) {
      throw new Error(`invalid quoted .env value on line ${line}`);
    }
    return value.slice(1, -1);
  }
  return value.replace(/\s+#.*$/, "").trimEnd();
}

function parseToml(text: string): ParsedImportText {
  const tables = new Map<TomlTable, Map<string, TomlValue>>();
  const services: Map<string, TomlValue>[] = [];
  let table: TomlTable | undefined;
  let service: Map<string, TomlValue> | undefined;

  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = stripTomlComment(lines[index]).trim();
    if (line === "") continue;
    const arrayHeader = /^\[\[([A-Za-z0-9_.-]+)\]\]$/.exec(line);
    if (arrayHeader) {
      if (arrayHeader[1] !== "yarr.services") {
        throw new Error(`unsupported TOML array table on line ${index + 1}`);
      }
      table = "yarr.services";
      service = new Map<string, TomlValue>();
      services.push(service);
      continue;
    }
    const header = /^\[([A-Za-z0-9_.-]+)\]$/.exec(line);
    if (header) {
      if (!["yarr", "mcp", "mcp.auth"].includes(header[1])) {
        throw new Error(`unsupported TOML table on line ${index + 1}`);
      }
      table = header[1] as TomlTable;
      service = undefined;
      if (tables.has(table)) throw new Error(`duplicate TOML table on line ${index + 1}`);
      tables.set(table, new Map<string, TomlValue>());
      continue;
    }
    const assignment = /^([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(.+)$/.exec(line);
    if (!assignment || table === undefined) {
      throw new Error(`invalid Yarr TOML entry on line ${index + 1}`);
    }
    const destination = table === "yarr.services" ? service : tables.get(table);
    if (!destination || destination.has(assignment[1])) {
      throw new Error(`duplicate or misplaced Yarr TOML field on line ${index + 1}`);
    }
    destination.set(assignment[1], parseTomlValue(assignment[2], index + 1));
  }

  const warnings: string[] = [];
  if (services.length > 0 && tables.get("yarr")?.has("services")) {
    throw new Error("Yarr TOML cannot define both [yarr].services and [[yarr.services]]");
  }
  validateNonServiceTables(tables, warnings);
  const values = importTomlServices(services, warnings);
  return { format: "toml", values, warnings };
}

function validateNonServiceTables(
  tables: Map<TomlTable, Map<string, TomlValue>>,
  warnings: string[],
): void {
  for (const [table, fields] of tables) {
    for (const [field, value] of fields) {
      if (table === "yarr") {
        if (field !== "services" || !Array.isArray(value) || value.length !== 0) {
          throw new Error("Yarr TOML [yarr].services must be empty or use [[yarr.services]] entries");
        }
        warnings.push("Yarr TOML [yarr].services is empty; no inline service was imported");
        continue;
      }
      const supported = table === "mcp" ? MCP_FIELDS : MCP_AUTH_FIELDS;
      if (!supported.has(field)) throw new Error(`unsupported Yarr TOML field [${table}].${field}`);
      warnings.push(`Yarr TOML field [${table}].${field} is valid but is not imported as a service setting`);
    }
  }
}

function importTomlServices(
  services: readonly Map<string, TomlValue>[],
  warnings: string[],
): Record<string, string> {
  const values = Object.create(null) as Record<string, string>;
  const seen = new Set<string>();
  for (const [index, service] of services.entries()) {
    for (const field of service.keys()) {
      if (!SERVICE_FIELDS.has(field)) {
        throw new Error(`unsupported Yarr TOML service field ${field}`);
      }
    }
    const kind = optionalTomlString(service, "kind");
    const name = optionalTomlString(service, "name");
    const entry = resolveService(kind ?? name, index + 1);
    if (seen.has(entry.id)) throw new Error(`duplicate Yarr TOML service ${entry.id}`);
    seen.add(entry.id);

    if (kind !== undefined && name !== undefined) {
      const named = resolveOptionalService(name);
      if (named && named.id !== entry.id) {
        throw new Error(`Yarr TOML service name and kind disagree for ${entry.id}`);
      }
      if (!named) warnings.push(`Yarr TOML display name for ${entry.id} was not imported`);
    }

    let imported = 0;
    imported += assignServiceValue(values, entry.urlKeys, optionalTomlString(service, "base_url"), "base_url", entry.id);
    imported += assignServiceValue(values, entry.usernameKeys, optionalTomlString(service, "username"), "username", entry.id);
    imported += assignServiceValue(values, entry.passwordKeys, optionalTomlString(service, "password"), "password", entry.id);
    const apiKey = optionalTomlString(service, "api_key");
    const token = optionalTomlString(service, "token");
    if (apiKey !== undefined && token !== undefined) {
      throw new Error(`Yarr TOML service ${entry.id} defines both api_key and token`);
    }
    imported += assignServiceValue(
      values,
      entry.apiKeyKeys,
      apiKey ?? token,
      apiKey === undefined ? "token" : "api_key",
      entry.id,
    );
    if (imported === 0) {
      warnings.push(`Yarr TOML service ${entry.id} has no importable URL or credential fields`);
    }
  }
  return values;
}

function resolveService(value: string | undefined, position: number): ServiceCatalogEntry {
  const entry = value === undefined ? undefined : resolveOptionalService(value);
  if (!entry) throw new Error(`unsupported or missing Yarr TOML service identity at entry ${position}`);
  return entry;
}

function resolveOptionalService(value: string): ServiceCatalogEntry | undefined {
  const normalized = normalizeCatalogKey(value).replace(/^YARR_/, "").toLowerCase();
  return SERVICE_CATALOG_BY_ID.get(normalized);
}

function assignServiceValue(
  values: Record<string, string>,
  keys: readonly string[],
  value: string | undefined,
  field: string,
  service: string,
): number {
  if (value === undefined) return 0;
  if (keys.length === 0) throw new Error(`Yarr TOML service ${service} does not support ${field}`);
  if (Object.hasOwn(values, keys[0])) throw new Error(`duplicate Yarr TOML service value for ${service}`);
  values[keys[0]] = value;
  return 1;
}

function optionalTomlString(fields: Map<string, TomlValue>, field: string): string | undefined {
  const value = fields.get(field);
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`Yarr TOML service field ${field} must be a string`);
  return value;
}

function parseTomlValue(raw: string, line: number): TomlValue {
  const value = raw.trim();
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed !== "string") throw new Error("not a string");
      return parsed;
    } catch {
      throw new Error(`invalid TOML string on line ${line}`);
    }
  }
  if (value.startsWith("'")) {
    if (value.length < 2 || !value.endsWith("'") || value.slice(1, -1).includes("'")) {
      throw new Error(`invalid TOML string on line ${line}`);
    }
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?(?:0|[1-9][0-9]*)$/.test(value)) {
    const number = Number(value);
    if (Number.isSafeInteger(number)) return number;
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    const members = splitTomlArray(value.slice(1, -1), line);
    return members.map((member) => {
      const parsed = parseTomlValue(member, line);
      if (Array.isArray(parsed)) throw new Error(`nested TOML arrays are unsupported on line ${line}`);
      return parsed;
    });
  }
  throw new Error(`unsupported TOML value on line ${line}`);
}

function splitTomlArray(raw: string, line: number): string[] {
  if (raw.trim() === "") return [];
  const result: string[] = [];
  let start = 0;
  let quote = "";
  let escaped = false;
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
    } else if (quote === "'") {
      if (character === quote) quote = "";
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ",") {
      const member = raw.slice(start, index).trim();
      if (member === "") throw new Error(`invalid TOML array on line ${line}`);
      result.push(member);
      start = index + 1;
    }
  }
  if (quote !== "") throw new Error(`unterminated TOML array string on line ${line}`);
  const final = raw.slice(start).trim();
  if (final === "") throw new Error(`invalid TOML array on line ${line}`);
  result.push(final);
  return result;
}

function stripTomlComment(line: string): string {
  let quote = "";
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
    } else if (quote === "'") {
      if (character === quote) quote = "";
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "#") {
      return line.slice(0, index);
    }
  }
  return line;
}
