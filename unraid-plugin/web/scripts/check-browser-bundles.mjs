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
