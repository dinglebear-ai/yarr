"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_SERVICE_PATH_LENGTH = exports.MAX_SERVICE_HOSTNAME_LENGTH = exports.MAX_SERVICE_URL_LENGTH = exports.DOCKER_IDENTITY_LABEL_KEYS = exports.DOCKER_ENDPOINT_LABEL_KEYS = exports.SECRET_ENVIRONMENT_KEYS = exports.SERVICE_CATALOG_BY_ID = exports.PUBLIC_EXTRA_KEYS_BY_SERVICE = exports.YARR_CONTROL_PUBLIC_EXTRA_KEYS = exports.SERVICE_CATALOG = void 0;
exports.normalizeCatalogKey = normalizeCatalogKey;
exports.normalizeServiceUrl = normalizeServiceUrl;
exports.SERVICE_CATALOG = [
    service("sonarr", "Sonarr", 8989, ["sonarr"], [], [], ["SONARR_API_KEY", "SONARR_APIKEY"], []),
    service("radarr", "Radarr", 7878, ["radarr"], [], [], ["RADARR_API_KEY", "RADARR_APIKEY"], []),
    service("prowlarr", "Prowlarr", 9696, ["prowlarr"], [], [], ["PROWLARR_API_KEY", "PROWLARR_APIKEY"], []),
    service("tautulli", "Tautulli", 8181, ["tautulli"], [], [], ["TAUTULLI_API_KEY", "TAUTULLI_APIKEY"], []),
    service("overseerr", "Overseerr", 5055, ["overseerr"], [], [], ["OVERSEERR_API_KEY", "OVERSEERR_APIKEY"], []),
    service("bazarr", "Bazarr", 6767, ["bazarr"], [], [], ["BAZARR_API_KEY", "BAZARR_APIKEY"], []),
    service("tracearr", "Tracearr", 3000, ["tracearr"], [], [], [], []),
    service("sabnzbd", "SABnzbd", 8080, ["sabnzbd", "sab"], [], [], ["SABNZBD_API_KEY", "SABNZBD_APIKEY"], []),
    service("qbittorrent", "qBittorrent", 8080, ["qbittorrent", "qbit"], ["QBITTORRENT_USERNAME", "QBIT_USERNAME"], ["QBITTORRENT_PASSWORD", "QBIT_PASSWORD"], [], []),
    service("plex", "Plex", 32400, ["plex", "plexmediaserver"], [], [], ["PLEX_TOKEN"], []),
    service("jellyfin", "Jellyfin", 8096, ["jellyfin"], [], [], ["JELLYFIN_API_KEY", "JELLYFIN_APIKEY"], []),
];
exports.YARR_CONTROL_PUBLIC_EXTRA_KEYS = [
    "YARR_MCP_ALLOWED_HOSTS",
    "YARR_MCP_ALLOWED_ORIGINS",
];
exports.PUBLIC_EXTRA_KEYS_BY_SERVICE = new Map([
    ["yarr", exports.YARR_CONTROL_PUBLIC_EXTRA_KEYS],
    ...exports.SERVICE_CATALOG.map((entry) => [entry.id, entry.publicExtraKeys]),
]);
exports.SERVICE_CATALOG_BY_ID = new Map(exports.SERVICE_CATALOG.map((entry) => [entry.id, entry]));
exports.SECRET_ENVIRONMENT_KEYS = new Set([
    "YARR_MCP_TOKEN",
    "YARR_MCP_GOOGLE_CLIENT_SECRET",
    ...exports.SERVICE_CATALOG.flatMap((entry) => [
        ...entry.usernameKeys,
        ...entry.passwordKeys,
        ...entry.apiKeyKeys,
    ]),
]);
exports.DOCKER_ENDPOINT_LABEL_KEYS = [
    "net.unraid.docker.webui",
    "io.yarr.service-url",
];
exports.DOCKER_IDENTITY_LABEL_KEYS = [
    "com.docker.compose.service",
    "net.unraid.docker.name",
];
exports.MAX_SERVICE_URL_LENGTH = 2048;
exports.MAX_SERVICE_HOSTNAME_LENGTH = 253;
exports.MAX_SERVICE_PATH_LENGTH = 1024;
function normalizeCatalogKey(key) {
    return key.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function normalizeServiceUrl(value) {
    const trimmed = value.trim();
    if (trimmed.length === 0 ||
        trimmed.length > exports.MAX_SERVICE_URL_LENGTH ||
        trimmed.includes("?") ||
        trimmed.includes("#")) {
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
        if (url.pathname.length > exports.MAX_SERVICE_PATH_LENGTH)
            return null;
        const path = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
        const normalized = `${url.protocol}//${url.host}${path === "" || path === "/" ? "" : path}`;
        return normalized.length <= exports.MAX_SERVICE_URL_LENGTH ? normalized : null;
    }
    catch {
        return null;
    }
}
function validHostname(hostname) {
    if (hostname.length === 0 || hostname.length > exports.MAX_SERVICE_HOSTNAME_LENGTH)
        return false;
    if (hostname.includes(":"))
        return true;
    return hostname.split(".").every((label) => label.length > 0 && label.length <= 63);
}
function service(id, displayName, defaultPort, containerHints, usernameAliases, passwordAliases, apiKeyAliases, publicExtraKeys) {
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
