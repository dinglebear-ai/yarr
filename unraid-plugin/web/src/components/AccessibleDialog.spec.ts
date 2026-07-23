import { createApp, defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessibleDialog from "./AccessibleDialog.vue";

let app: ReturnType<typeof createApp> | undefined;

function mountDialog(initialBusy = false) {
  const invoker = document.createElement("button");
  invoker.textContent = "Open dialog";
  document.body.append(invoker);
  invoker.focus();
  const open = ref(true);
  const busy = ref(initialBusy);
  const controlsEnabled = ref(!initialBusy);
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp(defineComponent({
    setup: () => () => h(AccessibleDialog, {
      open: open.value,
      title: "Contained dialog",
      busy: busy.value,
      onClose: () => { open.value = false; },
    }, {
      default: () => [
        h("button", { type: "button", disabled: !controlsEnabled.value }, "First generic"),
        h("button", { type: "button", disabled: true }, "Disabled"),
      ],
      footer: () => h("button", { type: "button", disabled: !controlsEnabled.value, "data-autofocus": "" }, "Preferred focus"),
    }),
  }));
  app.mount(host);
  return { host, invoker, open, busy, controlsEnabled };
}

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

describe("AccessibleDialog", () => {
  it("prefers data-autofocus over the first generic focusable", async () => {
    mountDialog();
    await nextTick();
    expect(document.activeElement?.textContent).toBe("Preferred focus");
  });

  it("cycles Tab and Shift+Tab within enabled visible controls", async () => {
    const { host } = mountDialog();
    await nextTick();
    const preferred = [...host.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Preferred focus")!;
    const close = [...host.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Close")!;
    preferred.focus();
    preferred.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(close);
    close.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(preferred);
  });

  it("redirects external focus back into the open dialog", async () => {
    const { invoker } = mountDialog();
    await nextTick();
    invoker.focus();
    invoker.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.activeElement?.textContent).toBe("Preferred focus");
  });

  it("closes on Escape and restores the invoking element", async () => {
    const { invoker, open } = mountDialog();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await nextTick();
    expect(open.value).toBe(false);
    expect(document.activeElement).toBe(invoker);
  });

  it("restores the invoking element and removes listeners when unmounted", async () => {
    const { invoker } = mountDialog();
    const remove = vi.spyOn(document, "removeEventListener");
    await nextTick();
    app?.unmount();
    app = undefined;
    expect(document.activeElement).toBe(invoker);
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("focusin", expect.any(Function));
  });

  it("contains focus on the panel while busy with zero focusable controls, then resumes cycling", async () => {
    const { host, busy, controlsEnabled } = mountDialog(true);
    await nextTick();
    const panel = host.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(panel.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(panel);

    const forward = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    panel.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(panel);
    const backward = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
    panel.dispatchEvent(backward);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(panel);

    controlsEnabled.value = true;
    busy.value = false;
    await nextTick();
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement?.textContent).toBe("Close");
  });

  it("redirects external focus to the panel when a busy dialog has no focusable controls", async () => {
    const { host, invoker } = mountDialog(true);
    await nextTick();
    const panel = host.querySelector<HTMLElement>('[role="dialog"]')!;
    invoker.focus();
    invoker.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(document.activeElement).toBe(panel);
  });
});
