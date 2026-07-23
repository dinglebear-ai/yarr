<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { queryYarrUpdateStatus, resetYarrBinary, updateYarrBinary } from "../graphql";
import type { YarrUpdateStatus } from "../types";
import ConfirmDialog from "./ConfirmDialog.vue";

const emit = defineEmits<{ busy: [value: boolean] }>();

const status = ref<YarrUpdateStatus>();
const error = ref("");
const busy = ref(false);
const confirmUpdate = ref(false);
const confirmReset = ref(false);
let controller: AbortController | undefined;
let generation = 0;

async function load(): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  const current = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const result = await queryYarrUpdateStatus(controller.signal);
    if (current === generation) status.value = result;
  } catch {
    if (current === generation && !controller.signal.aborted) error.value = "Update status could not be loaded. Check Yarr connectivity, then retry.";
  } finally {
    if (current === generation) busy.value = false;
  }
}

async function install(): Promise<void> {
  if (!status.value) return;
  controller?.abort();
  controller = new AbortController();
  busy.value = true;
  error.value = "";
  try {
    status.value = await updateYarrBinary(status.value.availableVersion, controller.signal);
    confirmUpdate.value = false;
  } catch {
    if (!controller.signal.aborted) error.value = "Update result was not confirmed. Refresh update status before retrying.";
  } finally {
    busy.value = false;
  }
}

async function reset(): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  busy.value = true;
  error.value = "";
  try {
    status.value = await resetYarrBinary(controller.signal);
    confirmReset.value = false;
  } catch {
    if (!controller.signal.aborted) error.value = "Reset result was not confirmed. Refresh update status before retrying.";
  } finally {
    busy.value = false;
  }
}

onMounted(load);
watch(busy, (value) => emit("busy", value));
onBeforeUnmount(() => { generation += 1; controller?.abort(); emit("busy", false); });
</script>

<template>
  <section class="yarr-panel" aria-labelledby="updates-heading" :aria-busy="busy">
    <div class="yarr-section-heading"><div><h2 id="updates-heading">Updates</h2><p>Install a verified release or return to the package version.</p></div><button type="button" class="yarr-button is-quiet" :disabled="busy" @click="load">Check again</button></div>
    <div v-if="error" class="yarr-error" role="alert"><p>{{ error }}</p><button v-if="!status" type="button" class="yarr-button" :disabled="busy" @click="load">Retry update check</button></div>
    <p v-if="!status && !error" role="status">Checking update status...</p>
    <template v-if="status">
      <dl class="yarr-detail-list">
        <div><dt>Installed</dt><dd>{{ status.installedVersion }}</dd></div>
        <div><dt>Packaged</dt><dd>{{ status.packagedVersion }}</dd></div>
        <div><dt>Available</dt><dd>{{ status.availableVersion }}</dd></div>
        <div><dt>Source</dt><dd>{{ status.usingOverlay ? "Update overlay" : "Plugin package" }}</dd></div>
      </dl>
      <p class="yarr-result" :class="{ 'is-warning': status.rolledBack }" role="status">{{ status.message }}<strong v-if="status.rolledBack"> The previous version was restored.</strong></p>
      <div class="yarr-actions">
        <button v-if="status.updateAvailable" type="button" class="yarr-button" :disabled="busy" @click="confirmUpdate = true">Install {{ status.availableVersion }}</button>
        <button type="button" class="yarr-button is-danger is-quiet" :disabled="busy" @click="confirmReset = true">Reset to packaged version</button>
      </div>
    </template>
    <ConfirmDialog :open="confirmUpdate" :title="`Install Yarr ${status?.availableVersion}?`" description="Yarr will restart. If readiness fails, the updater will attempt to restore the previous binary." confirm-label="Install update" :busy="busy" @close="confirmUpdate = false" @confirm="install" />
    <ConfirmDialog :open="confirmReset" title="Reset to packaged Yarr?" description="This removes the update overlay and restarts the binary shipped by the plugin package." confirm-label="Reset Yarr" :busy="busy" danger @close="confirmReset = false" @confirm="reset" />
  </section>
</template>
