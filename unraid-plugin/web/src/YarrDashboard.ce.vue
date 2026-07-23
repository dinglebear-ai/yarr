<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { queryYarrRuntime } from "./graphql";
import type { YarrRuntime } from "./types";
import StatusBadge from "./components/StatusBadge.vue";

const runtime = ref<YarrRuntime>();
const error = ref(false);
const controller = new AbortController();

onMounted(async () => {
  try {
    runtime.value = await queryYarrRuntime(controller.signal);
  } catch {
    error.value = true;
  }
});

onBeforeUnmount(() => controller.abort());
</script>

<template>
  <section class="yarr-shell yarr-dashboard" aria-labelledby="yarr-dashboard-title" :aria-busy="!runtime && !error">
    <header class="yarr-shell__header">
      <div>
        <p class="yarr-shell__eyebrow">Yarr</p>
        <h2 id="yarr-dashboard-title">Service status</h2>
      </div>
      <StatusBadge v-if="runtime" :state="runtime.ready ? 'success' : 'warning'" :label="runtime.ready ? 'Ready' : 'Not ready'" />
    </header>
    <p v-if="!runtime && !error" class="yarr-shell__message" role="status">Checking Yarr service status...</p>
    <p v-else-if="error" class="yarr-shell__message is-error" role="alert">Yarr status could not be loaded. Refresh this page and try again.</p>
    <p v-else class="yarr-shell__message">{{ runtime?.healthMessage }}</p>
  </section>
</template>
