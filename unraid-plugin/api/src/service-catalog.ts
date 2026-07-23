export interface ServiceCatalogEntry {
  id: string;
  displayName: string;
  urlKeys: readonly string[];
  usernameKeys: readonly string[];
  passwordKeys: readonly string[];
  apiKeyKeys: readonly string[];
  defaultPort: number | null;
  containerHints: readonly string[];
}

export const SERVICE_CATALOG: readonly ServiceCatalogEntry[] = [
  service("sonarr", "Sonarr", 8989, ["sonarr"], [], [], ["SONARR_API_KEY", "SONARR_APIKEY"]),
  service("radarr", "Radarr", 7878, ["radarr"], [], [], ["RADARR_API_KEY", "RADARR_APIKEY"]),
  service("prowlarr", "Prowlarr", 9696, ["prowlarr"], [], [], ["PROWLARR_API_KEY", "PROWLARR_APIKEY"]),
  service("tautulli", "Tautulli", 8181, ["tautulli"], [], [], ["TAUTULLI_API_KEY", "TAUTULLI_APIKEY"]),
  service("overseerr", "Overseerr", 5055, ["overseerr"], [], [], ["OVERSEERR_API_KEY", "OVERSEERR_APIKEY"]),
  service("bazarr", "Bazarr", 6767, ["bazarr"], [], [], ["BAZARR_API_KEY", "BAZARR_APIKEY"]),
  service("tracearr", "Tracearr", 3000, ["tracearr"], [], [], []),
  service("sabnzbd", "SABnzbd", 8080, ["sabnzbd", "sab"], [], [], ["SABNZBD_API_KEY", "SABNZBD_APIKEY"]),
  service(
    "qbittorrent",
    "qBittorrent",
    8080,
    ["qbittorrent", "qbit"],
    ["QBITTORRENT_USERNAME", "QBIT_USERNAME"],
    ["QBITTORRENT_PASSWORD", "QBIT_PASSWORD"],
    [],
  ),
  service("plex", "Plex", 32400, ["plex", "plexmediaserver"], [], [], ["PLEX_TOKEN"]),
  service("jellyfin", "Jellyfin", 8096, ["jellyfin"], [], [], ["JELLYFIN_API_KEY", "JELLYFIN_APIKEY"]),
] as const;

export const SERVICE_CATALOG_BY_ID: ReadonlyMap<string, ServiceCatalogEntry> = new Map(
  SERVICE_CATALOG.map((entry) => [entry.id, entry]),
);

export function normalizeCatalogKey(key: string): string {
  return key.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function normalizeServiceUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
      return null;
    }
    url.hash = "";
    const normalized = url.toString();
    return normalized.endsWith("/") && url.pathname === "/" && !url.search
      ? normalized.slice(0, -1)
      : normalized.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function service(
  id: string,
  displayName: string,
  defaultPort: number | null,
  containerHints: readonly string[],
  usernameAliases: readonly string[],
  passwordAliases: readonly string[],
  apiKeyAliases: readonly string[],
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
    defaultPort,
    containerHints,
  };
}
