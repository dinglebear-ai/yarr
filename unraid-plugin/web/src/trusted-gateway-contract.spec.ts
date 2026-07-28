import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = (name: string) =>
  readFileSync(fileURLToPath(new URL(name, import.meta.url)), "utf8");

describe("trusted gateway settings contract", () => {
  it("disables trusted gateway for LAN, custom, and Tailscale exposure", () => {
    const panel = source("./components/ServerAuthPanel.vue");
    const settings = source("./YarrSettings.ce.vue");

    expect(panel).toContain(
      `:disabled="plugin.bindMode !== 'LOOPBACK' || plugin.tailscaleServe"`,
    );
    expect(panel).toContain("Trusted gateway (same-host loopback only)");
    expect(settings).toContain(
      `plugin.value.bindMode !== "LOOPBACK" || plugin.value.tailscaleServe`,
    );
    expect(settings).toContain("Use bearer or Google OAuth for network exposure.");
  });
});
