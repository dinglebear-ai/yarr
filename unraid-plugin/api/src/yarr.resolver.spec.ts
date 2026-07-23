import { describe, expect, it, vi } from "vitest";

import {
  ApplyYarrDiscoveryInput,
  ApplyYarrImportInput,
  PreviewYarrImportInput,
  SaveYarrConfigInput,
  YarrControlAction,
} from "./graphql.types";
import { YarrResolver } from "./yarr.resolver";

function harness() {
  const runtimeState = {
    state: "running" as const,
    pid: 42,
    version: "2.1.0",
    bindAddress: "127.0.0.1",
    port: 40070,
    ready: true,
    healthMessage: "ready",
    uptimeSeconds: 10,
    token: "runtime-private",
  };
  const configView = {
    plugin: {
      enabled: true,
      bindMode: "loopback" as const,
      customHost: "",
      port: 40070,
      authMode: "bearer" as const,
      tailscaleServe: false,
      tailscaleHostname: "",
      logLevel: "info" as const,
      updateChannel: "stable" as const,
      bearerToken: "plugin-private",
    },
    services: [{
      service: "sonarr",
      enabled: true,
      baseUrl: "http://sonarr:8989",
      username: null,
      hasPassword: false,
      hasApiKey: true,
      extra: { YARR_SONARR_PATH: "/api", YARR_SONARR_API_KEY: "service-private" },
      apiKey: "service-private",
    }],
  };
  const mutationResult = {
    config: configView,
    changed: true,
    restarted: true,
    rolledBack: false,
    internalToken: "mutation-private",
  };
  const runtime = {
    status: vi.fn(async () => runtimeState),
    start: vi.fn(async () => runtimeState),
    stop: vi.fn(async () => ({ ...runtimeState, state: "stopped", ready: false })),
    restart: vi.fn(async () => runtimeState),
  };
  const config = {
    read: vi.fn(async () => configView),
    save: vi.fn(async () => mutationResult),
  };
  const logs = {
    read: vi.fn(async () => ({ lines: ["one", "two", "three"], truncated: false })),
  };
  const imports = {
    preview: vi.fn(async () => ({
      previewId: "p".repeat(32),
      mappings: [{
        serviceId: "sonarr",
        baseUrl: "http://sonarr:8989",
        hasUsername: false,
        hasPassword: false,
        hasApiKey: true,
        apiKey: "import-private",
      }],
      warnings: [],
      secret: "import-private",
    })),
    apply: vi.fn(async () => mutationResult),
  };
  const discovery = {
    discover: vi.fn(async () => ({
      discoveryId: "d".repeat(32),
      candidates: [{
        candidateId: "c".repeat(32),
        source: "docker" as const,
        serviceId: "sonarr",
        confidence: 95,
        reasons: ["container name matched sonarr"],
        baseUrl: "http://sonarr:8989",
        hasCredential: true,
        credential: "discovery-private",
      }],
      errors: [],
      secret: "discovery-private",
    })),
    apply: vi.fn(async () => mutationResult),
  };
  const updates = {
    status: vi.fn(async () => ({
      installedVersion: "2.0.0",
      packagedVersion: "2.0.0",
      availableVersion: "2.1.0",
      updateAvailable: true,
      usingOverlay: false,
      rolledBack: false,
      message: "Yarr update 2.1.0 is available",
      secret: "update-private",
    })),
    apply: vi.fn(async () => ({
      installedVersion: "2.1.0",
      packagedVersion: "2.0.0",
      availableVersion: "2.1.0",
      updateAvailable: false,
      usingOverlay: true,
      rolledBack: false,
      message: "Yarr updated to 2.1.0",
      secret: "update-private",
    })),
    reset: vi.fn(async () => ({
      installedVersion: "2.0.0",
      packagedVersion: "2.0.0",
      availableVersion: "2.1.0",
      updateAvailable: true,
      usingOverlay: false,
      rolledBack: false,
      message: "Yarr reset to packaged binary",
      secret: "update-private",
    })),
  };
  const resolver = new YarrResolver(
    runtime as never,
    config as never,
    logs as never,
    imports as never,
    discovery as never,
    updates as never,
  );
  return { resolver, runtime, config, logs, imports, discovery, updates };
}

describe("YarrResolver", () => {
  it("returns explicit safe DTOs for every query", async () => {
    const { resolver } = harness();

    const result = {
      runtime: await resolver.yarrRuntime(),
      config: await resolver.yarrConfig(),
      discovery: await resolver.yarrDiscoveredServices(),
      logs: await resolver.yarrLogs(2),
      update: await resolver.yarrUpdateStatus(),
    };

    expect(result.logs).toEqual({ lines: ["two", "three"], truncated: true });
    expect(result.config.services[0].extra).toEqual([
      { key: "YARR_SONARR_PATH", value: "/api" },
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /runtime-private|plugin-private|service-private|import-private|discovery-private|update-private/,
    );
  });

  it("dispatches lifecycle actions and maps mutation results explicitly", async () => {
    const { resolver, runtime, config } = harness();

    await resolver.controlYarr(YarrControlAction.START);
    await resolver.controlYarr(YarrControlAction.STOP);
    await resolver.controlYarr(YarrControlAction.RESTART);
    const result = await resolver.saveYarrConfig(new SaveYarrConfigInput());

    expect(runtime.start).toHaveBeenCalledOnce();
    expect(runtime.stop).toHaveBeenCalledOnce();
    expect(runtime.restart).toHaveBeenCalledOnce();
    expect(config.save).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toMatch(/plugin-private|service-private|mutation-private/);
  });

  it("parses bounded import text and requires explicit apply selections", async () => {
    const { resolver, imports, discovery } = harness();
    const previewInput = Object.assign(new PreviewYarrImportInput(), {
      text: "SONARR_URL=http://sonarr:8989\nSONARR_API_KEY=private-value\n",
    });

    const preview = await resolver.previewYarrImport(previewInput);
    expect(imports.preview).toHaveBeenCalledWith({
      SONARR_URL: "http://sonarr:8989",
      SONARR_API_KEY: "private-value",
    });
    expect(JSON.stringify(preview)).not.toContain("private-value");

    const importInput = Object.assign(new ApplyYarrImportInput(), {
      previewId: "p".repeat(32),
      selectedServiceIds: ["sonarr"],
      credentialConsent: [{ serviceId: "sonarr", consent: true }],
    });
    await resolver.applyYarrImport(importInput);
    expect(imports.apply).toHaveBeenCalledWith({
      previewId: "p".repeat(32),
      selectedServiceIds: ["sonarr"],
      credentialConsent: { sonarr: true },
    });

    const discoveryInput = Object.assign(new ApplyYarrDiscoveryInput(), {
      discoveryId: "d".repeat(32),
      selectedCandidateIds: ["c".repeat(32)],
      credentialConsent: [{ serviceId: "sonarr", consent: false }],
    });
    await resolver.applyYarrDiscovery(discoveryInput);
    expect(discovery.apply).toHaveBeenCalledWith({
      discoveryId: "d".repeat(32),
      selectedCandidateIds: ["c".repeat(32)],
      credentialConsent: { sonarr: false },
    });
  });

  it("rejects excessive import text and invalid log bounds before service calls", async () => {
    const { resolver, imports, logs } = harness();
    await expect(resolver.previewYarrImport(Object.assign(new PreviewYarrImportInput(), {
      text: "x".repeat(256 * 1024 + 1),
    }))).rejects.toThrow("256 KiB");
    await expect(resolver.yarrLogs(0)).rejects.toThrow("1 to 500");
    await expect(resolver.yarrLogs(501)).rejects.toThrow("1 to 500");
    expect(imports.preview).not.toHaveBeenCalled();
    expect(logs.read).not.toHaveBeenCalled();
  });

  it("dispatches binary updates through the narrow update service", async () => {
    const { resolver, updates } = harness();
    const applied = await resolver.updateYarrBinary("2.1.0");
    const reset = await resolver.resetYarrBinary();
    expect(updates.apply).toHaveBeenCalledWith("2.1.0");
    expect(updates.reset).toHaveBeenCalledOnce();
    expect(JSON.stringify({ applied, reset })).not.toContain("update-private");
  });
});
