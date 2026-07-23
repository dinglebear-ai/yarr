<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { queryYarrConfig, queryYarrRuntime } from "./graphql";
import type { YarrConfig, YarrRuntime } from "./types";
import StatusBadge from "./components/StatusBadge.vue";

const config = ref<YarrConfig>();
const runtime = ref<YarrRuntime>();
const error = ref(false);
const controller = new AbortController();
const configuredServiceCount = computed(() => config.value?.services.filter((service) => service.enabled).length ?? 0);

function label(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

onMounted(async () => {
  try {
    const [loadedConfig, loadedRuntime] = await Promise.all([
      queryYarrConfig(controller.signal),
      queryYarrRuntime(controller.signal),
    ]);
    config.value = loadedConfig;
    runtime.value = loadedRuntime;
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
    <dl v-else-if="runtime" class="yarr-foundation-summary">
      <div><dt>Runtime</dt><dd>{{ runtime.state }}; {{ runtime.ready ? "ready" : "not ready" }}</dd></div>
      <div><dt>Endpoint</dt><dd>{{ runtime.bindAddress }}:{{ runtime.port }}; {{ label(config!.plugin.bindMode) }} binding</dd></div>
      <div><dt>Authentication</dt><dd>{{ label(config!.plugin.authMode) }}</dd></div>
      <div><dt>Services</dt><dd>{{ configuredServiceCount }} configured</dd></div>
      <div><dt>Tailscale Serve</dt><dd>{{ config!.plugin.tailscaleServe ? "enabled" : "disabled" }}</dd></div>
    </dl>
  </section>
</template>
