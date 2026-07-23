import { createApp, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import YarrDashboard from "./YarrDashboard.ce.vue";

const api = vi.hoisted(() => ({
  controlYarr: vi.fn(),
  queryYarrRuntime: vi.fn(),
}));

vi.mock("./graphql", () => api);

const runtime = {
  state: "running",
  pid: 123,
  version: "1.2.3",
  bindAddress: "127.0.0.1",
  port: 40070,
  ready: true,
  healthMessage: "Ready",
  uptimeSeconds: 60,
};

let app: ReturnType<typeof createApp> | undefined;
let host: HTMLDivElement;
let intersectionCallback: IntersectionObserverCallback;
const disconnect = vi.fn();

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  host = document.createElement("div");
  document.body.append(host);
  vi.stubGlobal("IntersectionObserver", vi.fn(function (callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
    return { observe: vi.fn(), disconnect, unobserve: vi.fn(), takeRecords: vi.fn(), root: null, rootMargin: "", thresholds: [] };
  }));
  api.queryYarrRuntime.mockResolvedValue(runtime);
  api.controlYarr.mockResolvedValue(runtime);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Yarr dashboard", () => {
  it("shows process, readiness, endpoint, version, one safe action, and settings link", async () => {
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await flush();

    expect(host.textContent).toContain("Process");
    expect(host.textContent).toContain("running");
    expect(host.textContent).toContain("Ready");
    expect(host.textContent).toContain("127.0.0.1:40070");
    expect(host.textContent).toContain("1.2.3");
    expect(host.querySelector("img")?.getAttribute("src")).toBe("/plugins/yarr/yarr-2b068b08366b.png");
    expect(host.querySelector(".yarr-dashboard__status")?.getAttribute("role")).toBe("status");
    expect(host.querySelectorAll("button")).toHaveLength(1);
    expect(host.querySelector("button")?.textContent).toContain("Stop Yarr");
    expect(host.querySelector("a")?.getAttribute("href")).toBe("/Settings/Yarr");
  });

  it("renders honest loading, error, and stale states without exposing fleet detail", async () => {
    let resolveStatus!: (value: typeof runtime) => void;
    api.queryYarrRuntime.mockReturnValueOnce(new Promise((resolve) => { resolveStatus = resolve; }));
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await nextTick();
    expect(host.textContent).toContain("Checking the local Yarr runtime");
    expect(host.textContent).toContain("Awaiting first confirmed status");
    resolveStatus(runtime);
    await flush();

    api.queryYarrRuntime.mockReturnValueOnce(new Promise(() => undefined));
    await vi.advanceTimersByTimeAsync(80_000);
    expect(host.textContent).toContain("Status is stale");
    expect(host.querySelector("button")).toBeNull();
    expect(host.textContent).not.toMatch(/sonarr|radarr|api.?key|token/i);

    app.unmount();
    app = undefined;
    host.replaceChildren();
    api.queryYarrRuntime.mockRejectedValueOnce(new Error("private upstream detail"));
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await flush();
    expect(host.textContent).toContain("Status unavailable");
    expect(host.textContent).not.toContain("private upstream detail");
  });

  it("offers START only when stopped and no action for transitional or unknown states", async () => {
    api.queryYarrRuntime.mockResolvedValueOnce({ ...runtime, state: "stopped", ready: false });
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await flush();
    expect(host.querySelector("button")?.textContent).toContain("Start Yarr");
    app.unmount();
    app = undefined;
    host.replaceChildren();

    api.queryYarrRuntime.mockResolvedValueOnce({ ...runtime, state: "starting", ready: false });
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await flush();
    expect(host.querySelector("button")).toBeNull();
    expect(host.textContent).toContain("Wait for the next refresh");
  });

  it("uses fixed indeterminate guidance when a dashboard control response is lost", async () => {
    api.controlYarr.mockRejectedValueOnce(new Error("lost response"));
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await flush();
    host.querySelector<HTMLButtonElement>("button")!.click();
    await flush();

    expect(host.textContent).toContain("Control result was not confirmed. Refresh status before retrying.");
    expect(host.textContent).not.toContain("did not complete");
  });

  it("uses viewport geometry when IntersectionObserver is unavailable", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("IntersectionObserver", undefined);
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ top: 2000, bottom: 2100, left: 0, right: 300, width: 300, height: 100, x: 0, y: 2000, toJSON: () => ({}) });
    const remove = vi.spyOn(window, "removeEventListener");
    app = createApp(YarrDashboard);
    app.mount(host);
    await flush();
    expect(api.queryYarrRuntime).not.toHaveBeenCalled();

    rect.mockReturnValue({ top: 0, bottom: 100, left: 0, right: 300, width: 300, height: 100, x: 0, y: 0, toJSON: () => ({}) });
    window.dispatchEvent(new Event("scroll"));
    await flush();
    expect(api.queryYarrRuntime).toHaveBeenCalledTimes(1);

    app.unmount();
    app = undefined;
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("polls every 30 seconds only while the document and element are visible", async () => {
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await flush();
    expect(api.queryYarrRuntime).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(api.queryYarrRuntime).toHaveBeenCalledTimes(2);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(api.queryYarrRuntime).toHaveBeenCalledTimes(2);
  });

  it("does not overlap a slow status poll", async () => {
    api.queryYarrRuntime.mockReturnValue(new Promise(() => undefined));
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await nextTick();
    await vi.advanceTimersByTimeAsync(90_000);
    expect(api.queryYarrRuntime).toHaveBeenCalledTimes(1);
  });

  it("aborts stale work and removes timers, observers, and listeners on disconnect", async () => {
    const signals: AbortSignal[] = [];
    api.queryYarrRuntime.mockImplementation((signal: AbortSignal) => {
      signals.push(signal);
      return new Promise(() => undefined);
    });
    const removeListener = vi.spyOn(document, "removeEventListener");
    app = createApp(YarrDashboard);
    app.mount(host);
    intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    await nextTick();

    app.unmount();
    app = undefined;

    expect(signals[0]?.aborted).toBe(true);
    expect(disconnect).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });
});
