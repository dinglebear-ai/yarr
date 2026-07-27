<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { applyYarrDiscovery, queryYarrDiscovery } from "../graphql";
import type { YarrConfigMutationResult, YarrDiscoveryResult } from "../types";
import AccessibleDialog from "./AccessibleDialog.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; applied: [result: YarrConfigMutationResult]; busy: [value: boolean] }>();
const discovery = ref<YarrDiscoveryResult>();
const selected = ref<string[]>([]);
const consent = ref<Record<string, boolean>>({});
const busy = ref(false);
const error = ref("");
let controller: AbortController | undefined;
let generation = 0;

const canApply = computed(() => selected.value.length > 0 && !busy.value);

function displayName(id: string): string {
  return id === "sabnzbd" ? "SABnzbd" : id === "qbittorrent" ? "qBittorrent" : id.charAt(0).toUpperCase() + id.slice(1);
}

function reset(): void {
  generation += 1;
  controller?.abort();
  discovery.value = undefined;
  selected.value = [];
  consent.value = {};
  busy.value = false;
  error.value = "";
}

function close(): void {
  reset();
  emit("close");
}

async function discover(): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  const current = ++generation;
  busy.value = true;
  error.value = "";
  try {
    const result = await queryYarrDiscovery(controller.signal);
    if (current === generation) discovery.value = result;
  } catch {
    if (current === generation && !controller.signal.aborted) error.value = "Docker discovery failed. Confirm the read-only Docker socket is available, then retry.";
  } finally {
    if (current === generation) busy.value = false;
  }
}

async function apply(): Promise<void> {
  if (!discovery.value || selected.value.length === 0) return;
  controller?.abort();
  controller = new AbortController();
  busy.value = true;
  error.value = "";
  const candidates = discovery.value.candidates.filter((candidate) => selected.value.includes(candidate.candidateId));
  const serviceIds = [...new Set(candidates.map((candidate) => candidate.serviceId))];
  try {
    const result = await applyYarrDiscovery({
      discoveryId: discovery.value.discoveryId,
      selectedCandidateIds: [...selected.value],
      credentialConsent: serviceIds.map((serviceId) => ({ serviceId, consent: consent.value[serviceId] === true })),
    }, controller.signal);
    reset();
    emit("applied", result);
    emit("close");
  } catch {
    if (!controller.signal.aborted) error.value = "Discovery apply result was not confirmed. Refresh current configuration before retrying.";
    busy.value = false;
  }
}

function selectedService(serviceId: string): boolean {
  return discovery.value?.candidates.some((candidate) => candidate.serviceId === serviceId && selected.value.includes(candidate.candidateId)) === true;
}

watch(() => props.open, (open) => { if (open) { reset(); void discover(); } else reset(); });
watch(busy, (value) => emit("busy", value));
onBeforeUnmount(reset);
</script>

<template>
  <AccessibleDialog :open="open" title="Discover Docker services" :busy="busy" @close="close">
    <p>Yarr reads bounded container identity and endpoint metadata. Select each candidate explicitly.</p>
    <p v-if="busy && !discovery" role="status">Inspecting Docker services...</p>
    <div v-if="error" class="yarr-error" role="alert"><p>{{ error }}</p><button type="button" class="yarr-button" :disabled="busy" @click="discover">Retry discovery</button></div>
    <template v-if="discovery">
      <ul v-if="discovery.errors.length" class="yarr-warning-list"><li v-for="item in discovery.errors" :key="item.code"><strong>{{ item.code }}</strong>: {{ item.message }}</li></ul>
      <p v-if="discovery.candidates.length === 0" class="yarr-empty">No supported Docker services were found.</p>
      <fieldset v-for="candidate in discovery.candidates" :key="candidate.candidateId" class="yarr-choice-row">
        <label><input v-model="selected" type="checkbox" :name="`discovery-candidate-${candidate.candidateId}`" :value="candidate.candidateId" :disabled="busy"> <strong>{{ displayName(candidate.serviceId) }}</strong></label>
        <span>{{ candidate.baseUrl }} · {{ candidate.confidence }}% confidence</span>
        <small>{{ candidate.reasons.join("; ") }}</small>
      </fieldset>
      <label v-for="serviceId in [...new Set(discovery.candidates.filter((candidate) => candidate.hasCredential).map((candidate) => candidate.serviceId))]" v-show="selectedService(serviceId)" :key="serviceId" class="yarr-consent-row"><input v-model="consent[serviceId]" type="checkbox" :disabled="busy"> Import credentials for {{ displayName(serviceId) }}</label>
    </template>
    <template #footer>
      <button type="button" class="yarr-button is-quiet" data-autofocus :disabled="busy" @click="close">Cancel</button>
      <button type="button" class="yarr-button" :disabled="!canApply" @click="apply">{{ busy ? "Applying..." : "Apply selected" }}</button>
    </template>
  </AccessibleDialog>
</template>
