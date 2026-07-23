<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { controlYarr, queryYarrRuntime } from "./graphql";
import type { YarrControlAction, YarrRuntime } from "./types";

const POLL_INTERVAL_MS = 30_000;
const STALE_AFTER_MS = 75_000;
const FRESHNESS_TICK_MS = 5_000;
const iconPath = "/plugins/yarr/yarr.png";

const root = ref<HTMLElement>();
const runtime = ref<YarrRuntime>();
const error = ref("");
const busy = ref(false);
const lastConfirmedAt = ref<number>();
const now = ref(Date.now());
let elementVisible = false;
let timer: number | undefined;
let freshnessTimer: number | undefined;
let controller: AbortController | undefined;
let observer: IntersectionObserver | undefined;
let usingGeometryFallback = false;
let generation = 0;

const visible = () => elementVisible && document.visibilityState !== "hidden";
const stale = computed(() => (
  lastConfirmedAt.value !== undefined &&
  now.value - lastConfirmedAt.value > STALE_AFTER_MS
));
const action = computed<YarrControlAction | null>(() => {
  if (error.value || stale.value) return null;
  if (runtime.value?.state === "running") return "STOP";
  if (runtime.value?.state === "stopped") return "START";
  return null;
});
const actionLabel = computed(() => action.value === "STOP" ? "Stop Yarr" : "Start Yarr");
const statusLabel = computed(() => {
  if (error.value) return "Unavailable";
  if (!runtime.value) return "Loading";
  if (stale.value) return "Stale";
  if (runtime.value.ready) return "Ready";
  if (runtime.value.state === "running") return "Attention";
  if (runtime.value.state === "stopped") return "Stopped";
  return "Changing";
});
const statusTone = computed(() => {
  if (error.value) return "error";
  if (!runtime.value || runtime.value.state === "stopped") return "neutral";
  if (stale.value || !runtime.value.ready) return "warning";
  return "success";
});
const freshnessLabel = computed(() => {
  if (lastConfirmedAt.value === undefined) return "Awaiting first confirmed status";
  if (stale.value) return "Last confirmed status is stale";
  return "Status confirmed recently";
});
const runtimeMessage = computed(() => {
  if (!runtime.value) return "Waiting for a bounded GraphQL status response.";
  if (action.value) return runtime.value.healthMessage;
  return "State is changing or unavailable. Wait for the next refresh before acting.";
});

function clearTimer(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
}

function stopFreshnessClock(): void {
  if (freshnessTimer !== undefined) window.clearInterval(freshnessTimer);
  freshnessTimer = undefined;
}

function startFreshnessClock(): void {
  if (freshnessTimer !== undefined) return;
  now.value = Date.now();
  freshnessTimer = window.setInterval(() => {
    now.value = Date.now();
  }, FRESHNESS_TICK_MS);
}

function stop(): void {
  clearTimer();
  stopFreshnessClock();
  generation += 1;
  controller?.abort();
  busy.value = false;
}

function schedule(): void {
  clearTimer();
  if (!visible()) return;
  timer = window.setTimeout(() => { void refresh(); }, POLL_INTERVAL_MS);
}

async function refresh(): Promise<void> {
  if (!visible() || busy.value) return;
  startFreshnessClock();
  controller = new AbortController();
  const current = ++generation;
  busy.value = true;
  try {
    const result = await queryYarrRuntime(controller.signal);
    if (current === generation) {
      runtime.value = result;
      lastConfirmedAt.value = Date.now();
      now.value = lastConfirmedAt.value;
      error.value = "";
    }
  } catch {
    if (current === generation && !controller.signal.aborted) error.value = "Status unavailable. Open settings for recovery details.";
  } finally {
    if (current === generation) {
      busy.value = false;
      schedule();
    }
  }
}

async function runAction(): Promise<void> {
  if (!action.value || busy.value) return;
  controller = new AbortController();
  const current = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const result = await controlYarr(action.value, controller.signal);
    if (current === generation) {
      runtime.value = result;
      lastConfirmedAt.value = Date.now();
      now.value = lastConfirmedAt.value;
    }
  } catch {
    if (current === generation && !controller.signal.aborted) error.value = "Control result was not confirmed. Refresh status before retrying.";
  } finally {
    if (current === generation) {
      busy.value = false;
      schedule();
    }
  }
}

function visibilityChanged(): void {
  if (usingGeometryFallback) elementVisible = viewportVisible();
  if (visible()) {
    startFreshnessClock();
    void refresh();
  } else stop();
}

function viewportVisible(): boolean {
  if (!root.value || document.visibilityState === "hidden") return false;
  const rect = root.value.getBoundingClientRect();
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > 0 && rect.right > 0 && rect.top < height && rect.left < width;
}

function geometryChanged(): void {
  const next = viewportVisible();
  if (next === elementVisible) return;
  elementVisible = next;
  if (visible()) {
    startFreshnessClock();
    void refresh();
  } else stop();
}

onMounted(() => {
  document.addEventListener("visibilitychange", visibilityChanged);
  if (typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver((entries) => {
      const next = entries.some((entry) => entry.isIntersecting);
      if (next === elementVisible) return;
      elementVisible = next;
      if (visible()) {
        startFreshnessClock();
        void refresh();
      } else stop();
    });
    if (root.value) observer.observe(root.value);
  } else {
    usingGeometryFallback = true;
    window.addEventListener("scroll", geometryChanged, { passive: true });
    window.addEventListener("resize", geometryChanged);
    elementVisible = viewportVisible();
    if (visible()) void refresh();
  }
});

onBeforeUnmount(() => {
  elementVisible = false;
  stop();
  observer?.disconnect();
  if (usingGeometryFallback) {
    window.removeEventListener("scroll", geometryChanged);
    window.removeEventListener("resize", geometryChanged);
  }
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<template>
  <section ref="root" class="yarr-dashboard" :class="{ 'is-stale': stale, 'has-error': error }" aria-labelledby="yarr-dashboard-title" :aria-busy="busy">
    <header class="yarr-dashboard__header">
      <div class="yarr-dashboard__brand">
        <img :src="iconPath" alt="" width="42" height="42">
        <div><p class="yarr-dashboard__eyebrow">Media fleet control</p><h2 id="yarr-dashboard-title">Yarr</h2></div>
      </div>
      <div class="yarr-dashboard__header-actions">
        <span class="yarr-dashboard__status" :class="`is-${statusTone}`" role="status">
          <span class="yarr-dashboard__dot" aria-hidden="true"></span>{{ statusLabel }}
        </span>
        <a href="/Settings/Yarr">Settings</a>
      </div>
    </header>
    <p v-if="error" class="yarr-dashboard__notice is-error" role="alert">{{ error }}</p>
    <p v-else-if="stale" class="yarr-dashboard__notice is-stale" role="status">Status is stale. Open settings before taking action.</p>
    <p v-else-if="!runtime" class="yarr-dashboard__notice" role="status">Checking the local Yarr runtime...</p>

    <ol class="yarr-dashboard__signals" :class="{ 'is-unconfirmed': !runtime || error || stale }" aria-label="Yarr runtime signals">
      <li><span>Process</span><strong>{{ runtime?.state ?? "Checking" }}</strong></li>
      <li><span>Health</span><strong>{{ runtime ? (runtime.ready ? "Ready" : "Not ready") : "Checking" }}</strong></li>
      <li><span>Listener</span><strong>{{ runtime ? `${runtime.bindAddress}:${runtime.port}` : "Checking" }}</strong></li>
      <li><span>Version</span><strong>{{ runtime?.version ?? (runtime ? "Unavailable" : "Checking") }}</strong></li>
    </ol>

    <div class="yarr-dashboard__footer">
      <div>
        <p class="yarr-dashboard__message">{{ runtimeMessage }}</p>
        <p class="yarr-dashboard__freshness">{{ freshnessLabel }}</p>
      </div>
      <button v-if="action" type="button" :disabled="busy" @click="runAction">{{ busy ? "Working..." : actionLabel }}</button>
    </div>
  </section>
</template>
