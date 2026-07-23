import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const bundles = [
  { path: "dist/settings/yarr-settings.js", tag: "yarr-settings-app" },
  { path: "dist/dashboard/yarr-dashboard.js", tag: "yarr-dashboard" },
];

const forbidden = [
  [/\bprocess(?:\.|\[)/, "process"],
  [/\brequire\s*\(/, "require"],
  [/(?:\btypeof\s+global\b|\bglobal\s*(?:\.|\[)|\b__dirname\b|\b__filename\b)/, "Node global"],
  [/\b(?:Buffer|module\.exports|exports\.)\b/, "CommonJS global"],
  [/["']node:[^"']+["']/, "Node builtin"],
];

for (const bundle of bundles) {
  const source = await readFile(resolve(bundle.path), "utf8");
  for (const [pattern, label] of forbidden) {
    if (pattern.test(source)) throw new Error(`${bundle.path} contains forbidden ${label} reference`);
  }
  const imports = [...source.matchAll(/\b(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)].map((match) => match[1]);
  if (imports.length > 0) throw new Error(`${bundle.path} contains unresolved imports: ${imports.join(", ")}`);
  if (!source.includes(bundle.tag) || !source.includes("customElements")) {
    throw new Error(`${bundle.path} does not contain custom-element registration for ${bundle.tag}`);
  }
}

const dashboardPage = await readFile(
  resolve("../source/usr/local/emhttp/plugins/yarr/YarrDashboard.page"),
  "utf8",
);
for (const required of [
  'Menu="Dashboard"',
  'Icon="yarr-2b068b08366b.png"',
  'Tag="plug"',
  "DASHBOARD_WIDGET_ENABLE",
  "<yarr-dashboard></yarr-dashboard>",
  "/plugins/yarr/web/yarr-dashboard.css",
  "/plugins/yarr/web/yarr-dashboard.js",
  "hash_file('sha256', $path)",
  "substr($digest, 0, 12)",
  '$yarr_dashboard_css_v = $yarr_content_token("$yarr_dashboard_web/yarr-dashboard.css");',
  '$yarr_dashboard_js_v = $yarr_content_token("$yarr_dashboard_web/yarr-dashboard.js");',
]) {
  if (!dashboardPage.includes(required)) {
    throw new Error(`YarrDashboard.page does not mount the packaged dashboard contract: ${required}`);
  }
}
if (dashboardPage.includes("filemtime")) {
  throw new Error("YarrDashboard.page uses an epoch cache token");
}
if (dashboardPage.includes("yarr-settings.js") || dashboardPage.includes("yarr-settings.css")) {
  throw new Error("YarrDashboard.page loads the full settings bundle");
}

const settingsPage = await readFile(
  resolve("../source/usr/local/emhttp/plugins/yarr/Yarr.page"),
  "utf8",
);
for (const required of [
  'Menu="Utilities"',
  'Icon="yarr-2b068b08366b.png"',
  'Tag="plug"',
  "<yarr-settings-app></yarr-settings-app>",
  "/plugins/yarr/web/yarr-settings.css",
  "/plugins/yarr/web/yarr-settings.js",
  "window.csrf_token",
  "hash_file('sha256', $path)",
  "substr($digest, 0, 12)",
  '$yarr_settings_css_v = $yarr_content_token("$yarr_web/yarr-settings.css");',
  '$yarr_settings_js_v = $yarr_content_token("$yarr_web/yarr-settings.js");',
]) {
  if (!settingsPage.includes(required)) {
    throw new Error(`Yarr.page does not satisfy the packaged settings contract: ${required}`);
  }
}
if (settingsPage.includes("filemtime")) {
  throw new Error("Yarr.page uses an epoch cache token");
}

for (const asset of [
  "../source/usr/local/emhttp/plugins/yarr/yarr-2b068b08366b.png",
  "dist/settings/yarr-settings.css",
  "dist/settings/yarr-settings.js",
  "dist/dashboard/yarr-dashboard.css",
  "dist/dashboard/yarr-dashboard.js",
]) {
  const bytes = await readFile(resolve(asset));
  const token = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  if (!/^[0-9a-f]{12}$/.test(token)) {
    throw new Error(`${asset} did not produce an exact 12-character SHA-256 content token`);
  }
  if (asset.endsWith("yarr-2b068b08366b.png") && token !== "2b068b08366b") {
    throw new Error("immutable icon filename does not match its content token");
  }
}

const originalProcess = globalThis.process;
const originalCustomElements = globalThis.customElements;
const registry = new Map();
try {
  Object.defineProperty(globalThis, "process", { configurable: true, writable: true, value: undefined });
  globalThis.customElements = {
    define(name, constructor) {
      if (registry.has(name)) throw new Error(`duplicate custom element: ${name}`);
      registry.set(name, constructor);
    },
    get(name) { return registry.get(name); },
  };
  for (const bundle of bundles) await import(`${pathToFileURL(resolve(bundle.path)).href}?browser-smoke=${Date.now()}`);
  for (const bundle of bundles) {
    if (typeof registry.get(bundle.tag) !== "function") throw new Error(`${bundle.tag} was not registered`);
  }
} finally {
  Object.defineProperty(globalThis, "process", { configurable: true, writable: true, value: originalProcess });
  globalThis.customElements = originalCustomElements;
}

console.log("Browser bundle contract and process-free registration smoke passed.");
