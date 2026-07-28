<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { queryYarrLogs } from "../graphql";
import type { YarrLogs } from "../types";

const lines = ref(200);
const logs = ref<YarrLogs>();
const busy = ref(false);
const error = ref("");
let controller: AbortController | undefined;
let generation = 0;

async function refresh(): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  const current = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const result = await queryYarrLogs(Math.max(1, Math.min(500, lines.value)), controller.signal);
    if (current === generation) logs.value = result;
  } catch {
    if (current === generation && !controller.signal.aborted) error.value = "Logs could not be loaded. Confirm Yarr is installed and retry.";
  } finally {
    if (current === generation) busy.value = false;
  }
}

onMounted(refresh);
onBeforeUnmount(() => { generation += 1; controller?.abort(); });
</script>

<template>
  <section class="yarr-panel" aria-labelledby="logs-heading" :aria-busy="busy">
    <div class="yarr-section-heading">
      <div><h2 id="logs-heading">Logs</h2><p>Read a bounded tail of the redacted Yarr log.</p></div>
      <div class="yarr-actions"><label>Lines<select v-model.number="lines" :disabled="busy"><option :value="100">100</option><option :value="200">200</option><option :value="500">500</option></select></label><button type="button" class="yarr-button" :disabled="busy" @click="refresh">Refresh logs</button></div>
    </div>
    <div v-if="error" class="yarr-error" role="alert"><p>{{ error }}</p><button type="button" class="yarr-button" :disabled="busy" @click="refresh">Retry log request</button></div>
    <p v-else-if="!logs" role="status">Loading logs...</p>
    <template v-else>
      <p v-if="logs.truncated" class="yarr-note">Older lines were omitted. Increase the bounded line count if needed.</p>
      <pre class="yarr-log" aria-label="Yarr log output"><span v-for="(line, index) in logs.lines" :key="index">{{ line }}{{ "\n" }}</span></pre>
    </template>
  </section>
</template>
