<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { queryYarrConfig } from "./graphql";
import type { YarrConfig } from "./types";
import StatusBadge from "./components/StatusBadge.vue";

const config = ref<YarrConfig>();
const error = ref(false);
const controller = new AbortController();

onMounted(async () => {
  try {
    config.value = await queryYarrConfig(controller.signal);
  } catch {
    error.value = true;
  }
});

onBeforeUnmount(() => controller.abort());
</script>

<template>
  <section class="yarr-shell" aria-labelledby="yarr-settings-title" :aria-busy="!config && !error">
    <header class="yarr-shell__header">
      <div>
        <p class="yarr-shell__eyebrow">Yarr</p>
        <h2 id="yarr-settings-title">Integration settings</h2>
        <p>Review Yarr's current integration state before making changes.</p>
      </div>
      <StatusBadge v-if="config" :state="config.plugin.enabled ? 'success' : 'neutral'" :label="config.plugin.enabled ? 'Integration enabled' : 'Integration disabled'" />
    </header>
    <p v-if="!config && !error" class="yarr-shell__message" role="status">Loading integration settings...</p>
    <p v-else-if="error" class="yarr-shell__message is-error" role="alert">Yarr settings could not be loaded. Refresh this page and try again.</p>
    <p v-else class="yarr-shell__message">Settings controls will appear here.</p>
  </section>
</template>
