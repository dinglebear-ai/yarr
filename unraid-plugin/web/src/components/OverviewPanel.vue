<script setup lang="ts">
import type { YarrConfig, YarrControlAction, YarrRuntime } from "../types";

defineProps<{
  runtime: YarrRuntime;
  config: YarrConfig;
  busy: boolean;
}>();

const emit = defineEmits<{
  control: [action: YarrControlAction];
  import: [];
  discover: [];
}>();
</script>

<template>
  <section class="yarr-panel" aria-labelledby="overview-heading">
    <div class="yarr-section-heading">
      <div><h2 id="overview-heading">Current operation</h2><p>{{ runtime.healthMessage }}</p></div>
      <div class="yarr-actions">
        <button v-if="runtime.state !== 'running'" type="button" class="yarr-button" :disabled="busy" @click="emit('control', 'START')">Start Yarr</button>
        <button v-else type="button" class="yarr-button" :disabled="busy" @click="emit('control', 'RESTART')">Restart Yarr</button>
        <button v-if="runtime.state === 'running'" type="button" class="yarr-button is-quiet" :disabled="busy" @click="emit('control', 'STOP')">Stop Yarr</button>
      </div>
    </div>
    <dl class="yarr-detail-list">
      <div><dt>Process ID</dt><dd>{{ runtime.pid ?? "Not running" }}</dd></div>
      <div><dt>Uptime</dt><dd>{{ runtime.uptimeSeconds === null ? "Unavailable" : `${runtime.uptimeSeconds} seconds` }}</dd></div>
      <div><dt>Enabled services</dt><dd>{{ config.services.filter((service) => service.service !== 'yarr' && service.enabled).length }}</dd></div>
      <div><dt>Tailscale Serve</dt><dd>{{ config.plugin.tailscaleServe ? config.plugin.tailscaleHostname : "Off" }}</dd></div>
    </dl>
    <div class="yarr-operation-row">
      <div><h3>Bring in existing services</h3><p>Preview environment settings or inspect Docker metadata before choosing what Yarr may apply.</p></div>
      <div class="yarr-actions">
        <button type="button" class="yarr-button is-quiet" :disabled="busy" @click="emit('import')">Import configuration</button>
        <button type="button" class="yarr-button is-quiet" :disabled="busy" @click="emit('discover')">Discover Docker services</button>
      </div>
    </div>
  </section>
</template>
