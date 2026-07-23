import { createApp, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import YarrSettings from "./YarrSettings.ce.vue";
import type { YarrConfig, YarrRuntime } from "./types";

const api = vi.hoisted(() => ({
  applyYarrDiscovery: vi.fn(),
  applyYarrImport: vi.fn(),
  controlYarr: vi.fn(),
  mutateYarrConfig: vi.fn(),
  previewYarrImport: vi.fn(),
  queryYarrConfig: vi.fn(),
  queryYarrDiscovery: vi.fn(),
  queryYarrLogs: vi.fn(),
  queryYarrRuntime: vi.fn(),
  queryYarrUpdateStatus: vi.fn(),
  resetYarrBinary: vi.fn(),
  rollbackYarrBinary: vi.fn(),
  updateYarrBinary: vi.fn(),
}));

vi.mock("./graphql", () => api);

const runtime: YarrRuntime = {
  state: "running",
  pid: 123,
  version: "1.2.3",
  bindAddress: "127.0.0.1",
  port: 40070,
  ready: true,
  healthMessage: "Ready",
  uptimeSeconds: 60,
};

const config: YarrConfig = {
  plugin: {
    enabled: true,
    dashboardWidgetEnable: true,
    bindMode: "LOOPBACK",
    customHost: "",
    port: 40070,
    authMode: "BEARER",
    tailscaleServe: false,
    tailscaleHostname: "yarr",
    logLevel: "INFO",
    updateChannel: "stable",
  },
  services: [
    {
      service: "yarr",
      enabled: true,
      baseUrl: "http://127.0.0.1:40070",
      username: "oauth-client-id",
      hasPassword: true,
      hasApiKey: true,
      extra: [
        { key: "YARR_MCP_ALLOWED_HOSTS", value: "gateway.example" },
        { key: "YARR_MCP_ALLOWED_ORIGINS", value: "https://gateway.example" },
      ],
    },
    {
      service: "sonarr",
      enabled: true,
      baseUrl: "http://sonarr:8989",
      username: null,
      hasPassword: false,
      hasApiKey: true,
      extra: [],
    },
    {
      service: "qbittorrent",
      enabled: true,
      baseUrl: "http://qbittorrent:8080",
      username: "jacob",
      hasPassword: true,
      hasApiKey: false,
      extra: [],
    },
  ],
};

let app: ReturnType<typeof createApp> | undefined;
let host: HTMLDivElement;

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
}

function button(name: string): HTMLButtonElement {
  const match = [...host.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent?.trim() === name);
  if (!match) throw new Error(`button not found: ${name}`);
  return match;
}

function input(label: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const labels = [...host.querySelectorAll<HTMLLabelElement>("label")];
  const match = labels.find((item) => item.textContent?.includes(label));
  const control = match?.control;
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) {
    throw new Error(`control not found: ${label}`);
  }
  return control;
}

async function setValue(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): Promise<void> {
  control.value = value;
  control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  await nextTick();
}

async function mountSettings(overrides: Partial<YarrConfig> = {}): Promise<void> {
  api.queryYarrConfig.mockResolvedValue({ ...config, ...overrides });
  api.queryYarrRuntime.mockResolvedValue(runtime);
  api.mutateYarrConfig.mockResolvedValue({ config, changed: true, restarted: true, rolledBack: false, error: null });
  app = createApp(YarrSettings);
  app.mount(host);
  await flush();
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  vi.clearAllMocks();
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

describe("Yarr settings", () => {
  it("starts runtime and config requests in parallel and exposes the five tabs", async () => {
    let resolveConfig!: (value: YarrConfig) => void;
    let resolveRuntime!: (value: YarrRuntime) => void;
    api.queryYarrConfig.mockReturnValue(new Promise((resolve) => { resolveConfig = resolve; }));
    api.queryYarrRuntime.mockReturnValue(new Promise((resolve) => { resolveRuntime = resolve; }));
    app = createApp(YarrSettings);
    app.mount(host);
    await nextTick();

    expect(api.queryYarrConfig).toHaveBeenCalledTimes(1);
    expect(api.queryYarrRuntime).toHaveBeenCalledTimes(1);
    resolveConfig(config);
    resolveRuntime(runtime);
    await flush();

    expect([...host.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent?.trim())).toEqual([
      "Overview", "Services", "Server & Auth", "Updates", "Logs",
    ]);
  });

  it("uses roving keyboard tab focus", async () => {
    await mountSettings();
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await nextTick();

    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
  });

  it("renders an actionable retry state after a failed load", async () => {
    api.queryYarrConfig.mockRejectedValue(new Error("private detail"));
    api.queryYarrRuntime.mockRejectedValue(new Error("private detail"));
    app = createApp(YarrSettings);
    app.mount(host);
    await flush();

    expect(host.textContent).toContain("Yarr settings could not be loaded");
    expect(button("Retry")).toBeTruthy();
  });

  it("reports restart, rollback, and indeterminate save outcomes accurately", async () => {
    await mountSettings();
    api.mutateYarrConfig
      .mockResolvedValueOnce({ config, changed: true, restarted: true, rolledBack: false, error: null })
      .mockResolvedValueOnce({ config, changed: true, restarted: false, rolledBack: true, error: "Restart failed" })
      .mockResolvedValueOnce({ config, changed: true, restarted: false, rolledBack: false, error: "State unknown" });

    button("Save changes").click();
    await flush();
    expect(host.textContent).toContain("Changes saved and Yarr restarted");
    button("Save changes").click();
    await flush();
    expect(host.textContent).toContain("Previous configuration restored");
    button("Save changes").click();
    await flush();
    expect(host.textContent).toContain("Save outcome is indeterminate");
  });

  it("persists the dashboard widget toggle through the typed config mutation", async () => {
    await mountSettings();
    button("Server & Auth").click();
    await nextTick();
    const toggle = input("Dashboard widget") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    toggle.click();
    await nextTick();
    button("Save changes").click();
    await flush();

    expect(api.mutateYarrConfig).toHaveBeenCalledWith(expect.objectContaining({
      dashboardWidgetEnable: false,
    }), expect.any(AbortSignal));
  });

  it("blocks non-loopback binding when the yarr auth row is missing", async () => {
    await mountSettings({ services: config.services.filter((service) => service.service !== "yarr") });
    button("Server & Auth").click();
    await nextTick();
    await setValue(input("Bind mode"), "LAN");
    button("Save changes").click();
    await nextTick();

    expect(api.mutateYarrConfig).not.toHaveBeenCalled();
    expect(host.textContent).toContain("Bearer authentication requires a configured token");
  });

  it("shows only secret presence, preserves blank set values, and confirms explicit clearing", async () => {
    await mountSettings();
    button("Server & Auth").click();
    await nextTick();
    expect(host.textContent).toContain("Bearer token");
    expect(host.textContent).toContain("Configured");
    expect(host.textContent).not.toContain("YARR_MCP_TOKEN=");

    const setRadio = [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      .find((radio) => radio.parentElement?.textContent?.includes("Set a new value"));
    setRadio?.click();
    await nextTick();
    button("Save changes").click();
    await flush();
    expect(api.mutateYarrConfig).toHaveBeenCalledWith(expect.objectContaining({
      bearerToken: { kind: "PRESERVE" },
    }), expect.any(AbortSignal));

    button("Clear Bearer token").click();
    await nextTick();
    expect(host.querySelector('[role="dialog"][aria-modal="true"]')).toBeTruthy();
    expect(host.textContent).toContain("Clear Bearer token?");
    button("Keep credential").click();
  });

  it("disables credential editors while a save is unresolved without discarding intent", async () => {
    await mountSettings();
    button("Server & Auth").click();
    await nextTick();
    const setRadio = [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      .find((radio) => radio.parentElement?.textContent?.includes("Set a new value"))!;
    setRadio.click();
    await nextTick();
    let resolveSave!: (value: unknown) => void;
    api.mutateYarrConfig.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    button("Save changes").click();
    await nextTick();
    const field = host.querySelector(".yarr-secret-field")!;
    expect([...field.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button")].every((control) => control.disabled)).toBe(true);
    expect(field.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.parentElement?.textContent).toContain("Set a new value");
    resolveSave({ config, changed: false, restarted: false, rolledBack: false, error: null });
    await flush();
  });

  it("uses unconfirmed refresh guidance for save and control transport failures", async () => {
    await mountSettings();
    api.mutateYarrConfig.mockRejectedValueOnce(new Error("lost response"));
    button("Save changes").click();
    await flush();
    expect(host.textContent).toContain("Save result was not confirmed. Refresh current state before retrying.");

    api.controlYarr.mockRejectedValueOnce(new Error("lost response"));
    button("Restart Yarr").click();
    await flush();
    expect(host.textContent).toContain("Control result was not confirmed. Refresh current state before retrying.");
    expect(host.textContent).not.toContain("existing configuration was not replaced");
  });

  it("uses unconfirmed refresh guidance for import and discovery apply failures", async () => {
    await mountSettings();
    api.previewYarrImport.mockResolvedValue({
      previewId: "p".repeat(32),
      mappings: [{ serviceId: "sonarr", baseUrl: "http://sonarr:8989", hasUsername: false, hasPassword: false, hasApiKey: true }],
      warnings: [],
    });
    api.applyYarrImport.mockRejectedValueOnce(new Error("lost response"));
    button("Import configuration").click();
    await nextTick();
    await setValue(input("Paste .env or Yarr TOML"), "SONARR_URL=http://sonarr:8989");
    button("Preview import").click();
    await flush();
    host.querySelector<HTMLInputElement>('input[name="import-service-sonarr"]')!.click();
    await nextTick();
    button("Apply selected").click();
    await flush();
    expect(host.textContent).toContain("Import result was not confirmed. Refresh current configuration before retrying.");
    button("Cancel").click();
    await nextTick();

    api.queryYarrDiscovery.mockResolvedValue({
      discoveryId: "d".repeat(32),
      candidates: [{ candidateId: "c".repeat(32), source: "docker", serviceId: "sonarr", confidence: 90, reasons: ["match"], baseUrl: "http://sonarr:8989", hasCredential: false }],
      errors: [],
    });
    api.applyYarrDiscovery.mockRejectedValueOnce(new Error("lost response"));
    button("Discover Docker services").click();
    await flush();
    host.querySelector<HTMLInputElement>('input[name="discovery-candidate-' + "c".repeat(32) + '"]')!.click();
    await nextTick();
    button("Apply selected").click();
    await flush();
    expect(host.textContent).toContain("Discovery apply result was not confirmed. Refresh current configuration before retrying.");
  });

  it("uses unconfirmed refresh guidance for update and reset transport failures", async () => {
    await mountSettings();
    api.queryYarrUpdateStatus.mockResolvedValue({ installedVersion: "1.2.3", packagedVersion: "1.2.0", availableVersion: "1.3.0", updateAvailable: true, usingOverlay: true, rolledBack: false, message: "Update available" });
    button("Updates").click();
    await flush();
    api.updateYarrBinary.mockRejectedValueOnce(new Error("lost response"));
    button("Install 1.3.0").click();
    await nextTick();
    button("Install update").click();
    await flush();
    expect(host.textContent).toContain("Update result was not confirmed. Refresh update status before retrying.");
    button("Cancel").click();
    await nextTick();

    api.resetYarrBinary.mockRejectedValueOnce(new Error("lost response"));
    button("Reset to packaged version").click();
    await nextTick();
    button("Reset Yarr").click();
    await flush();
    expect(host.textContent).toContain("Reset result was not confirmed. Refresh update status before retrying.");
  });

  it("previews import metadata without secret text and requires selection with per-service consent", async () => {
    await mountSettings();
    api.previewYarrImport.mockResolvedValue({
      previewId: "p".repeat(32),
      mappings: [{ serviceId: "sonarr", baseUrl: "http://sonarr:8989", hasUsername: false, hasPassword: false, hasApiKey: true }],
      warnings: ["Unmapped key: UNKNOWN_KEY"],
    });
    api.applyYarrImport.mockResolvedValue({ config, changed: true, restarted: true, rolledBack: false, error: null });
    button("Import configuration").click();
    await nextTick();
    const rawSecret = "SONARR_API_KEY=never-render-this";
    await setValue(input("Paste .env or Yarr TOML"), rawSecret);
    button("Preview import").click();
    await flush();

    expect(host.textContent).toContain("Unmapped key: UNKNOWN_KEY");
    expect(host.textContent).not.toContain("never-render-this");
    expect(button("Apply selected").disabled).toBe(true);
    const selection = host.querySelector<HTMLInputElement>('input[name="import-service-sonarr"]')!;
    selection.click();
    await nextTick();
    expect(host.textContent).toContain("Import credentials for Sonarr");
  });

  it("requires explicit Docker candidate selection and per-service credential consent", async () => {
    await mountSettings();
    api.queryYarrDiscovery.mockResolvedValue({
      discoveryId: "d".repeat(32),
      candidates: [{
        candidateId: "c".repeat(32), source: "docker", serviceId: "sonarr", confidence: 90,
        reasons: ["Container name matched Sonarr"], baseUrl: "http://sonarr:8989", hasCredential: true,
      }],
      errors: [],
    });
    button("Discover Docker services").click();
    await flush();

    expect(button("Apply selected").disabled).toBe(true);
    const dialog = host.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).not.toContain("YARR_");
    expect(dialog.textContent).not.toContain("Docker labels");
    host.querySelector<HTMLInputElement>('input[name="discovery-candidate-' + "c".repeat(32) + '"]')!.click();
    await nextTick();
    expect(host.textContent).toContain("Import credentials for Sonarr");
  });

  it("confirms update and reset and displays rollback results", async () => {
    await mountSettings();
    api.queryYarrUpdateStatus.mockResolvedValue({
      installedVersion: "1.2.3", packagedVersion: "1.2.0", availableVersion: "1.3.0",
      updateAvailable: true, usingOverlay: true, rollbackAvailable: true, rolledBack: false, message: "Update available",
    });
    api.updateYarrBinary.mockResolvedValue({
      installedVersion: "1.2.3", packagedVersion: "1.2.0", availableVersion: "1.3.0",
      updateAvailable: true, usingOverlay: true, rollbackAvailable: true, rolledBack: true, message: "Update failed; previous version restored",
    });
    button("Updates").click();
    await flush();
    button("Install 1.3.0").click();
    await nextTick();
    expect(host.textContent).toContain("Install Yarr 1.3.0?");
    button("Install update").click();
    await flush();
    expect(host.textContent).toContain("previous version restored");
    api.rollbackYarrBinary.mockResolvedValue({
      installedVersion: "1.2.0", packagedVersion: "1.2.0", availableVersion: "1.3.0",
      updateAvailable: true, usingOverlay: true, rollbackAvailable: true, rolledBack: false,
      message: "Yarr rolled back to previous binary",
    });
    button("Roll back to previous version").click();
    await nextTick();
    expect(host.textContent).toContain("Roll back to the previous Yarr binary?");
    button("Roll back Yarr").click();
    await flush();
    expect(api.rollbackYarrBinary).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("Yarr rolled back to previous binary");
    button("Reset to packaged version").click();
    await nextTick();
    expect(host.textContent).toContain("Reset to packaged Yarr?");
  });

  it("renders a confirmed failed manual rollback without claiming the previous binary activated", async () => {
    await mountSettings();
    api.queryYarrUpdateStatus.mockResolvedValue({
      installedVersion: "1.3.0", packagedVersion: "1.2.0", availableVersion: "1.3.0",
      updateAvailable: false, usingOverlay: true, rollbackAvailable: true, rolledBack: false,
      message: "Yarr is current",
    });
    api.rollbackYarrBinary.mockResolvedValue({
      installedVersion: "1.3.0", packagedVersion: "1.2.0", availableVersion: "",
      updateAvailable: false, usingOverlay: true, rollbackAvailable: true, rolledBack: true,
      message: "Rollback failed; current binary restored",
    });
    button("Updates").click();
    await flush();
    button("Roll back to previous version").click();
    await nextTick();
    button("Roll back Yarr").click();
    await flush();

    expect(host.textContent).toContain("Rollback failed; current binary restored");
    expect(host.textContent).toContain("The current version was restored.");
    expect(host.textContent).not.toContain("The previous version was restored.");
  });

  it("serializes usernames only for capable services and preserves qBittorrent", async () => {
    await mountSettings();
    api.mutateYarrConfig.mockResolvedValue({
      config,
      changed: false,
      restarted: false,
      rolledBack: false,
      error: null,
    });

    button("Save changes").click();
    await flush();

    const payload = api.mutateYarrConfig.mock.calls.at(-1)?.[0];
    const sonarr = payload.services.find((service: { service: string }) => service.service === "sonarr");
    const qbittorrent = payload.services.find((service: { service: string }) => service.service === "qbittorrent");
    expect(sonarr).not.toHaveProperty("username");
    expect(qbittorrent).toMatchObject({ username: "jacob" });
  });

  it("sends real Yarr TOML and .env text unchanged for deliberate backend detection", async () => {
    await mountSettings();
    api.previewYarrImport.mockResolvedValue({
      previewId: "p".repeat(32),
      mappings: [],
      warnings: ["No service mappings"],
    });
    button("Import configuration").click();
    await nextTick();
    const toml = '[[yarr.services]]\nkind = "sonarr"\nbase_url = "http://sonarr:8989"\n';
    await setValue(input("Paste .env or Yarr TOML"), toml);
    button("Preview import").click();
    await flush();
    expect(api.previewYarrImport).toHaveBeenCalledWith(toml, expect.any(AbortSignal));
    button("Cancel").click();
    await nextTick();

    button("Import configuration").click();
    await nextTick();
    const env = "SONARR_URL=http://sonarr:8989\n";
    await setValue(input("Paste .env or Yarr TOML"), env);
    button("Preview import").click();
    await flush();
    expect(api.previewYarrImport).toHaveBeenCalledWith(env, expect.any(AbortSignal));
  });

  it("bounds log requests and supports manual refresh without HTML rendering", async () => {
    await mountSettings();
    api.queryYarrLogs.mockResolvedValue({ lines: ["<script>unsafe()</script>"], truncated: false });
    button("Logs").click();
    await flush();
    expect(api.queryYarrLogs).toHaveBeenLastCalledWith(200, expect.any(AbortSignal));
    await setValue(input("Lines"), "500");
    button("Refresh logs").click();
    await flush();
    expect(api.queryYarrLogs).toHaveBeenLastCalledWith(500, expect.any(AbortSignal));
    expect(host.querySelector("script")).toBeNull();
    expect(host.textContent).toContain("<script>unsafe()</script>");
  });
});
