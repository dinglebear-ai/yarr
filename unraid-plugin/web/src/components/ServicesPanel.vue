<script setup lang="ts">
import type { YarrSecretUpdate, YarrServiceDraft } from "../types";
import SecretField from "./SecretField.vue";

const props = defineProps<{ services: YarrServiceDraft[]; disabled: boolean }>();
const emit = defineEmits<{ update: [services: YarrServiceDraft[]] }>();

const names: Record<string, string> = {
  sonarr: "Sonarr", radarr: "Radarr", prowlarr: "Prowlarr", tautulli: "Tautulli",
  overseerr: "Overseerr", bazarr: "Bazarr", tracearr: "Tracearr", sabnzbd: "SABnzbd",
  qbittorrent: "qBittorrent", plex: "Plex", jellyfin: "Jellyfin",
};

function name(service: string): string {
  return names[service] ?? service;
}

function patch(index: number, update: Partial<YarrServiceDraft>): void {
  const next = props.services.map((service, serviceIndex) => serviceIndex === index ? { ...service, ...update } : service);
  emit("update", next);
}

function secret(index: number, key: "password" | "apiKey", value: YarrSecretUpdate): void {
  patch(index, { [key]: value });
}
</script>

<template>
  <section class="yarr-panel" aria-labelledby="services-heading">
    <div class="yarr-section-heading"><div><h2 id="services-heading">Services</h2><p>Enable only the integrations Yarr should contact.</p></div></div>
    <p v-if="services.length === 0" class="yarr-empty">No service definitions are available.</p>
    <section v-for="(service, index) in services" :key="service.service" class="yarr-service-row" :aria-labelledby="`service-${service.service}`">
      <div class="yarr-service-row__identity">
        <h3 :id="`service-${service.service}`">{{ name(service.service) }}</h3>
        <label class="yarr-switch"><input type="checkbox" :checked="service.enabled" :disabled="disabled" @change="patch(index, { enabled: ($event.target as HTMLInputElement).checked })"> Enabled</label>
      </div>
      <div class="yarr-form-grid">
        <label>{{ name(service.service) }} base URL<input type="url" :value="service.baseUrl" :disabled="disabled" @input="patch(index, { baseUrl: ($event.target as HTMLInputElement).value })"></label>
        <label v-if="service.username !== null">{{ name(service.service) }} username<input type="text" :value="service.username" :disabled="disabled" autocomplete="off" @input="patch(index, { username: ($event.target as HTMLInputElement).value })"></label>
      </div>
      <div class="yarr-secret-grid">
        <SecretField :name="`${service.service}-password`" :label="`${name(service.service)} password`" :configured="service.hasPassword" :intent="service.password.kind" :disabled="disabled" @update="secret(index, 'password', $event)" />
        <SecretField :name="`${service.service}-api-key`" :label="`${name(service.service)} API key`" :configured="service.hasApiKey" :intent="service.apiKey.kind" :disabled="disabled" @update="secret(index, 'apiKey', $event)" />
      </div>
    </section>
  </section>
</template>
