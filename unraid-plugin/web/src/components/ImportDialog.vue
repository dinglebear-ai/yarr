<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { applyYarrImport, previewYarrImport } from "../graphql";
import type { YarrConfigMutationResult, YarrImportMapping, YarrImportPreview } from "../types";
import AccessibleDialog from "./AccessibleDialog.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; applied: [result: YarrConfigMutationResult]; busy: [value: boolean] }>();
const rawText = ref("");
const preview = ref<YarrImportPreview>();
const selected = ref<string[]>([]);
const consent = ref<Record<string, boolean>>({});
const busy = ref(false);
const error = ref("");
let controller: AbortController | undefined;

const canApply = computed(() =>
  selected.value.length > 0 &&
  !busy.value &&
  selected.value.every((serviceId) =>
    preview.value?.mappings.some((mapping) => mapping.serviceId === serviceId && !mapping.urlRequired) === true,
  ),
);

function reset(): void {
  controller?.abort();
  rawText.value = "";
  preview.value = undefined;
  selected.value = [];
  consent.value = {};
  busy.value = false;
  error.value = "";
}

function close(): void {
  reset();
  emit("close");
}

function displayName(id: string): string {
  return id === "sabnzbd" ? "SABnzbd" : id === "qbittorrent" ? "qBittorrent" : id.charAt(0).toUpperCase() + id.slice(1);
}

function hasCredential(mapping: YarrImportMapping): boolean {
  return mapping.hasUsername || mapping.hasPassword || mapping.hasApiKey;
}

async function requestPreview(): Promise<void> {
  if (rawText.value.trim() === "") {
    error.value = "Paste .env assignments or Yarr TOML before requesting a preview.";
    return;
  }
  controller?.abort();
  controller = new AbortController();
  busy.value = true;
  error.value = "";
  const text = rawText.value;
  try {
    preview.value = await previewYarrImport(text, controller.signal);
    rawText.value = "";
    selected.value = [];
    consent.value = {};
  } catch {
    if (!controller.signal.aborted) error.value = "Import preview failed. Check the format and retry; no settings were applied.";
  } finally {
    busy.value = false;
  }
}

async function apply(): Promise<void> {
  if (!preview.value || !canApply.value) return;
  controller?.abort();
  controller = new AbortController();
  busy.value = true;
  error.value = "";
  try {
    const result = await applyYarrImport({
      previewId: preview.value.previewId,
      selectedServiceIds: [...selected.value],
      credentialConsent: selected.value.map((serviceId) => ({ serviceId, consent: consent.value[serviceId] === true })),
    }, controller.signal);
    reset();
    emit("applied", result);
    emit("close");
  } catch {
    if (!controller.signal.aborted) error.value = "Import result was not confirmed. Refresh current configuration before retrying.";
    busy.value = false;
  }
}

watch(() => props.open, (open) => { if (open) reset(); else rawText.value = ""; });
watch(busy, (value) => emit("busy", value));
onBeforeUnmount(reset);
</script>

<template>
  <AccessibleDialog :open="open" title="Import configuration" :busy="busy" @close="close">
    <div v-if="!preview" class="yarr-dialog-flow">
      <p>Paste .env assignments or Yarr TOML. Yarr returns only mapped service metadata and warnings, never values.</p>
      <label>Paste .env or Yarr TOML<textarea v-model="rawText" rows="9" :disabled="busy" autocomplete="off" spellcheck="false" /></label>
      <p v-if="error" class="yarr-error" role="alert">{{ error }}</p>
    </div>
    <div v-else class="yarr-dialog-flow">
      <p>Select at least one service. Credential permission is separate for each selected service.</p>
      <ul v-if="preview.warnings.length" class="yarr-warning-list"><li v-for="warning in preview.warnings" :key="warning">{{ warning }}</li></ul>
      <fieldset v-for="mapping in preview.mappings" :key="mapping.serviceId" class="yarr-choice-row">
        <label><input v-model="selected" type="checkbox" :name="`import-service-${mapping.serviceId}`" :value="mapping.serviceId" :disabled="busy || mapping.urlRequired"> <strong>{{ displayName(mapping.serviceId) }}</strong></label>
        <span v-if="mapping.baseUrl">{{ mapping.baseUrl }}</span>
        <span v-else-if="mapping.urlRequired" class="yarr-error">URL required before this service can be imported.</span>
        <span v-else>Uses the existing configured URL.</span>
        <label v-if="selected.includes(mapping.serviceId) && hasCredential(mapping)"><input v-model="consent[mapping.serviceId]" type="checkbox" :disabled="busy"> Import credentials for {{ displayName(mapping.serviceId) }}</label>
      </fieldset>
      <p v-if="error" class="yarr-error" role="alert">{{ error }}</p>
    </div>
    <template #footer>
      <button type="button" class="yarr-button is-quiet" data-autofocus :disabled="busy" @click="close">Cancel</button>
      <button v-if="!preview" type="button" class="yarr-button" :disabled="busy || rawText.trim() === ''" @click="requestPreview">{{ busy ? "Previewing..." : "Preview import" }}</button>
      <button v-else type="button" class="yarr-button" :disabled="!canApply" @click="apply">{{ busy ? "Applying..." : "Apply selected" }}</button>
    </template>
  </AccessibleDialog>
</template>
