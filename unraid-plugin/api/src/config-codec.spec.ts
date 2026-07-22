import { describe, expect, it } from "vitest";

import * as codec from "./config-codec";

const pluginConfig = `ENABLED=yes\nBIND_MODE=loopback\nCUSTOM_HOST=\nPORT=40070\nAUTH_MODE=bearer\nTAILSCALE_SERVE=no\nTAILSCALE_HOSTNAME=\nLOG_LEVEL=info\nUPDATE_CHANNEL=stable\n`;

describe("Yarr configuration codec", () => {
  it("preserves unknown yarr.cfg keys without accepting them from input", () => {
    const parsed = codec.parsePluginConfig(`${pluginConfig}EXISTING_KEY=preserve\n`);
    const current = { plugin: parsed, env: codec.parseYarrEnvironment("") };

    expect(() =>
      codec.mergeConfigInput(current, { port: 40100, injected: "reject" } as unknown as import("./config.types").SaveYarrConfigInput),
    ).toThrow("unknown configuration input field injected");

    const merged = codec.mergeConfigInput(current, { port: 40100 });

    expect(merged.plugin.values.EXISTING_KEY).toBe("preserve");
    expect(codec.serializePluginConfig(merged.plugin)).toContain("EXISTING_KEY=preserve\n");
  });

  it("preserves unknown environment keys", () => {
    const env = codec.parseYarrEnvironment("KEEP_ME=unchanged\nYARR_MCP_TOKEN=private\n");

    expect(codec.serializeYarrEnvironment(env)).toContain("KEEP_ME=unchanged\n");
  });

  it("redacts known secrets from the public configuration", () => {
    const view = codec.toPublicConfig(
      codec.parsePluginConfig(pluginConfig),
      codec.parseYarrEnvironment(
        "YARR_MCP_TOKEN=private-token\nYARR_MCP_GOOGLE_CLIENT_SECRET=private-secret\n",
      ),
    );

    expect(view.services).toContainEqual(
      expect.objectContaining({ hasApiKey: true, hasPassword: true }),
    );
    expect(JSON.stringify(view)).not.toContain("private-token");
    expect(JSON.stringify(view)).not.toContain("private-secret");
  });

  it("preserves an omitted secret update", () => {
    const current = {
      plugin: codec.parsePluginConfig(pluginConfig),
      env: codec.parseYarrEnvironment("YARR_MCP_TOKEN=private-token\n"),
    };

    const merged = codec.mergeConfigInput(current, { port: 40100 });

    expect(merged.env.values.YARR_MCP_TOKEN).toBe("private-token");
  });

  it("clears an explicitly cleared secret", () => {
    const current = {
      plugin: codec.parsePluginConfig(pluginConfig),
      env: codec.parseYarrEnvironment("YARR_MCP_TOKEN=private-token\n"),
    };

    const merged = codec.mergeConfigInput(current, {
      bearerToken: { kind: "clear" },
    });

    expect(merged.env.values.YARR_MCP_TOKEN).toBeUndefined();
  });

  it("normalizes CRLF input to LF output", () => {
    const parsed = codec.parsePluginConfig(pluginConfig.replaceAll("\n", "\r\n"));

    expect(codec.serializePluginConfig(parsed)).not.toContain("\r");
  });

  it("rejects duplicate keys", () => {
    expect(() => codec.parseYarrEnvironment("YARR_MCP_TOKEN=one\nYARR_MCP_TOKEN=two\n")).toThrow(
      "duplicate key",
    );
  });

  it("rejects non-loopback configuration without supported authentication", () => {
    const state = {
      plugin: codec.parsePluginConfig(pluginConfig.replace("BIND_MODE=loopback", "BIND_MODE=lan")),
      env: codec.parseYarrEnvironment(""),
    };

    expect(() => codec.validateConfigState(state)).toThrow("authentication");
  });

  it("writes exactly one trailing newline", () => {
    const plugin = codec.parsePluginConfig(`${pluginConfig}\n\n`);
    const env = codec.parseYarrEnvironment("YARR_MCP_TOKEN=private\n\n");

    expect(codec.serializePluginConfig(plugin)).toMatch(/[^\n]\n$/);
    expect(codec.serializePluginConfig(plugin)).not.toMatch(/\n\n$/);
    expect(codec.serializeYarrEnvironment(env)).toMatch(/[^\n]\n$/);
    expect(codec.serializeYarrEnvironment(env)).not.toMatch(/\n\n$/);
  });
});
