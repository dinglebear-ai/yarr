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

  it("generates a 256-bit hexadecimal secret without exposing weak randomness", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const updates: unknown[] = [];
    mounted = createApp(SecretField, {
      name: "bearer-token",
      label: "Bearer token",
      configured: false,
      generate: true,
      onUpdate: (value: unknown) => updates.push(value),
    });
    mounted.mount(host);
    await nextTick();

    host.querySelector<HTMLButtonElement>("button")!.click();
    await nextTick();

    const value = host.querySelector<HTMLInputElement>('input[type="password"]')?.value;
    expect(value).toMatch(/^[0-9a-f]{64}$/);
    expect(updates.at(-1)).toEqual({ kind: "SET", value });
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
