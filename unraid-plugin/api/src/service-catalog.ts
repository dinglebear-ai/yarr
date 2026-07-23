export interface ServiceCatalogEntry {
  id: string;
  displayName: string;
  urlKeys: readonly string[];
  usernameKeys: readonly string[];
  passwordKeys: readonly string[];
  apiKeyKeys: readonly string[];
  publicExtraKeys: readonly string[];
  defaultPort: number | null;
  containerHints: readonly string[];
}

export const SERVICE_CATALOG: readonly ServiceCatalogEntry[] = [
  service("sonarr", "Sonarr", 8989, ["sonarr"], [], [], ["SONARR_API_KEY", "SONARR_APIKEY"], []),
  service("radarr", "Radarr", 7878, ["radarr"], [], [], ["RADARR_API_KEY", "RADARR_APIKEY"], []),
  service("prowlarr", "Prowlarr", 9696, ["prowlarr"], [], [], ["PROWLARR_API_KEY", "PROWLARR_APIKEY"], []),
  service("tautulli", "Tautulli", 8181, ["tautulli"], [], [], ["TAUTULLI_API_KEY", "TAUTULLI_APIKEY"], []),
  service("overseerr", "Overseerr", 5055, ["overseerr"], [], [], ["OVERSEERR_API_KEY", "OVERSEERR_APIKEY"], []),
  service("bazarr", "Bazarr", 6767, ["bazarr"], [], [], ["BAZARR_API_KEY", "BAZARR_APIKEY"], []),
  service("tracearr", "Tracearr", 3000, ["tracearr"], [], [], [], []),
  service("sabnzbd", "SABnzbd", 8080, ["sabnzbd", "sab"], [], [], ["SABNZBD_API_KEY", "SABNZBD_APIKEY"], []),
  service(
    "qbittorrent",
    "qBittorrent",
    8080,
    ["qbittorrent", "qbit"],
    ["QBITTORRENT_USERNAME", "QBIT_USERNAME"],
    ["QBITTORRENT_PASSWORD", "QBIT_PASSWORD"],
    [],
    [],
  ),
  service("plex", "Plex", 32400, ["plex", "plexmediaserver"], [], [], ["PLEX_TOKEN"], []),
  service("jellyfin", "Jellyfin", 8096, ["jellyfin"], [], [], ["JELLYFIN_API_KEY", "JELLYFIN_APIKEY"], []),
] as const;

export const YARR_CONTROL_PUBLIC_EXTRA_KEYS = [
  "YARR_MCP_ALLOWED_HOSTS",
  "YARR_MCP_ALLOWED_ORIGINS",
] as const;

export const PUBLIC_EXTRA_KEYS_BY_SERVICE: ReadonlyMap<string, readonly string[]> = new Map([
  ["yarr", YARR_CONTROL_PUBLIC_EXTRA_KEYS],
  ...SERVICE_CATALOG.map((entry) => [entry.id, entry.publicExtraKeys] as const),
]);

export const SERVICE_CATALOG_BY_ID: ReadonlyMap<string, ServiceCatalogEntry> = new Map(
  SERVICE_CATALOG.map((entry) => [entry.id, entry]),
);

export const SECRET_ENVIRONMENT_KEYS: ReadonlySet<string> = new Set([
  "YARR_MCP_TOKEN",
  "YARR_MCP_GOOGLE_CLIENT_SECRET",
  ...SERVICE_CATALOG.flatMap((entry) => [
    ...entry.usernameKeys,
    ...entry.passwordKeys,
    ...entry.apiKeyKeys,
  ]),
]);

export const DOCKER_ENDPOINT_LABEL_KEYS = [
  "net.unraid.docker.webui",
  "io.yarr.service-url",
] as const;

export const DOCKER_IDENTITY_LABEL_KEYS = [
  "com.docker.compose.service",
  "net.unraid.docker.name",
] as const;

export const MAX_SERVICE_URL_LENGTH = 2048;
export const MAX_SERVICE_HOSTNAME_LENGTH = 253;
export const MAX_SERVICE_PATH_LENGTH = 1024;

export function normalizeCatalogKey(key: string): string {
  return key.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function normalizeServiceUrl(value: string): string | null {
  const trimmed = value.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_SERVICE_URL_LENGTH ||
    trimmed.includes("?") ||
    trimmed.includes("#")
  ) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
      return null;
    }
    const hostname = url.hostname.startsWith("[") && url.hostname.endsWith("]")
      ? url.hostname.slice(1, -1)
      : url.hostname;
    if (!validHostname(hostname) || (url.port !== "" && (Number(url.port) < 1 || Number(url.port) > 65535))) {
      return null;
    }
    if (url.pathname.length > MAX_SERVICE_PATH_LENGTH) return null;
    const path = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
    const normalized = `${url.protocol}//${url.host}${path === "" || path === "/" ? "" : path}`;
    return normalized.length <= MAX_SERVICE_URL_LENGTH ? normalized : null;
  } catch {
    return null;
  }
}

function validHostname(hostname: string): boolean {
  if (hostname.length === 0 || hostname.length > MAX_SERVICE_HOSTNAME_LENGTH) return false;
  if (hostname.includes(":")) return true;
  return hostname.split(".").every((label) => label.length > 0 && label.length <= 63);
}

function service(
  id: string,
  displayName: string,
  defaultPort: number | null,
  containerHints: readonly string[],
  usernameAliases: readonly string[],
  passwordAliases: readonly string[],
  apiKeyAliases: readonly string[],
  publicExtraKeys: readonly string[],
): ServiceCatalogEntry {
  const prefix = id.toUpperCase();
  return {
    id,
    displayName,
    urlKeys: [`YARR_${prefix}_URL`, `${prefix}_URL`],
    usernameKeys: usernameAliases.length > 0
      ? [`YARR_${prefix}_USERNAME`, ...usernameAliases]
      : [],
    passwordKeys: passwordAliases.length > 0
      ? [`YARR_${prefix}_PASSWORD`, ...passwordAliases]
      : [],
    apiKeyKeys: apiKeyAliases.length > 0
      ? [id === "plex" ? "YARR_PLEX_TOKEN" : `YARR_${prefix}_API_KEY`, ...apiKeyAliases]
      : [],
    publicExtraKeys,
    defaultPort,
    containerHints,
  };
}
