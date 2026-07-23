<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { controlYarr, queryYarrRuntime } from "./graphql";
import type { YarrControlAction, YarrRuntime } from "./types";

const root = ref<HTMLElement>();
const runtime = ref<YarrRuntime>();
const error = ref("");
const busy = ref(false);
let elementVisible = false;
let timer: number | undefined;
let controller: AbortController | undefined;
let observer: IntersectionObserver | undefined;
let usingGeometryFallback = false;
let generation = 0;

const visible = () => elementVisible && document.visibilityState !== "hidden";
const action = computed<YarrControlAction | null>(() => {
  if (runtime.value?.state === "running") return "STOP";
  if (runtime.value?.state === "stopped") return "START";
  return null;
});
const actionLabel = computed(() => action.value === "STOP" ? "Stop Yarr" : "Start Yarr");

function clearTimer(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
}

function stop(): void {
  clearTimer();
  generation += 1;
  controller?.abort();
}

function schedule(): void {
  clearTimer();
  if (!visible()) return;
  timer = window.setTimeout(() => { void refresh(); }, 30_000);
}

async function refresh(): Promise<void> {
  if (!visible()) return;
  controller?.abort();
  controller = new AbortController();
  const current = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const result = await queryYarrRuntime(controller.signal);
    if (current === generation) runtime.value = result;
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
  if (!action.value) return;
  controller?.abort();
  controller = new AbortController();
  const current = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const result = await controlYarr(action.value, controller.signal);
    if (current === generation) runtime.value = result;
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
  if (visible()) void refresh(); else stop();
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
  if (visible()) void refresh(); else stop();
}

onMounted(() => {
  document.addEventListener("visibilitychange", visibilityChanged);
  if (typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver((entries) => {
      const next = entries.some((entry) => entry.isIntersecting);
      if (next === elementVisible) return;
      elementVisible = next;
      if (visible()) void refresh(); else stop();
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
  <section ref="root" class="yarr-dashboard" aria-labelledby="yarr-dashboard-title" :aria-busy="busy">
    <header class="yarr-dashboard__header">
      <div><p class="yarr-dashboard__eyebrow">Yarr</p><h2 id="yarr-dashboard-title">Service operations</h2></div>
      <a href="/Settings/Yarr">Open settings</a>
    </header>
    <p v-if="error" class="yarr-dashboard__error" role="alert">{{ error }}</p>
    <p v-else-if="!runtime" role="status">Checking Yarr...</p>
    <template v-else>
      <ol class="yarr-dashboard__signals" aria-label="Yarr lifecycle signals">
        <li><span>Process</span><strong>{{ runtime.state }}</strong></li>
        <li><span>Ready</span><strong>{{ runtime.ready ? "Ready" : "Not ready" }}</strong></li>
        <li><span>Endpoint</span><strong>{{ runtime.bindAddress }}:{{ runtime.port }}</strong></li>
        <li><span>Version</span><strong>{{ runtime.version ?? "Unavailable" }}</strong></li>
      </ol>
      <div class="yarr-dashboard__footer">
        <p>{{ action ? runtime.healthMessage : "State is changing or unavailable. Wait for the next refresh before acting." }}</p>
        <button v-if="action" type="button" :disabled="busy" @click="runAction">{{ busy ? "Working..." : actionLabel }}</button>
      </div>
    </template>
  </section>
</template>
