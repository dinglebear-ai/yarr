import { createApp, nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import SecretField from "./SecretField.vue";

let mounted: ReturnType<typeof createApp> | undefined;

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  document.body.replaceChildren();
});

describe("SecretField", () => {
  it("labels the conditional new-secret password input", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    mounted = createApp(SecretField, {
      name: "bearer-token",
      label: "Bearer token",
      configured: true,
      intent: "SET",
    });
    mounted.mount(host);
    await nextTick();

    const input = host.querySelector<HTMLInputElement>('input[type="password"]');
    const label = host.querySelector<HTMLLabelElement>(`label[for="${input?.id}"]`);

    expect(input?.id).toMatch(/^yarr-secret-bearer-token-/);
    expect(label?.textContent).toContain("Bearer token");
  });

  it("disables every credential control without changing intent", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    mounted = createApp(SecretField, {
      name: "bearer-token",
      label: "Bearer token",
      configured: true,
      intent: "SET",
      disabled: true,
    });
    mounted.mount(host);
    await nextTick();

    expect([...host.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button")]).not.toHaveLength(0);
    expect([...host.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button")].every((control) => control.disabled)).toBe(true);
    expect(host.querySelector<HTMLInputElement>('input[type="password"]')?.value).toBe("");
  });
});
