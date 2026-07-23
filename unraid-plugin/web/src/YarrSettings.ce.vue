<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { controlYarr, mutateYarrConfig, queryYarrConfig, queryYarrRuntime } from "./graphql";
import type {
  SaveYarrConfigInput, SaveYarrServiceInput, YarrAuthDraft, YarrConfig, YarrConfigMutationResult, YarrControlAction,
  YarrPluginConfig, YarrRuntime, YarrSecretUpdate, YarrServiceDraft,
} from "./types";
import DiscoveryDialog from "./components/DiscoveryDialog.vue";
import ImportDialog from "./components/ImportDialog.vue";
import LogsPanel from "./components/LogsPanel.vue";
import OverviewPanel from "./components/OverviewPanel.vue";
import ServerAuthPanel from "./components/ServerAuthPanel.vue";
import ServicesPanel from "./components/ServicesPanel.vue";
import StatusBadge from "./components/StatusBadge.vue";
import UpdatesPanel from "./components/UpdatesPanel.vue";

const tabs = ["Overview", "Services", "Server & Auth", "Updates", "Logs"] as const;
type Tab = typeof tabs[number];

const config = ref<YarrConfig>();
const runtime = ref<YarrRuntime>();
const plugin = ref<YarrPluginConfig>();
const auth = ref<YarrAuthDraft>();
const services = ref<YarrServiceDraft[]>([]);
const bearerConfigured = ref(false);
const googleSecretConfigured = ref(false);
const activeTab = ref<Tab>("Overview");
const loading = ref(true);
const busy = ref(false);
const delegatedBusy = ref(false);
const loadError = ref("");
const actionError = ref("");
const resultMessage = ref("");
const importOpen = ref(false);
const discoveryOpen = ref(false);
const refreshing = ref(false);
const tabElements = ref<HTMLButtonElement[]>([]);
let loadController: AbortController | undefined;
let actionController: AbortController | undefined;
let loadGeneration = 0;

const loaded = computed(() => config.value && runtime.value && plugin.value && auth.value);
const operationBusy = computed(() => busy.value || delegatedBusy.value);

function extraValue(service: YarrConfig["services"][number] | undefined, key: string): string {
  return service?.extra.find((entry) => entry.key === key)?.value ?? "";
}

function hydrate(next: YarrConfig): void {
  config.value = next;
  plugin.value = { ...next.plugin };
  const yarr = next.services.find((service) => service.service === "yarr");
  bearerConfigured.value = yarr?.hasApiKey ?? false;
  googleSecretConfigured.value = yarr?.hasPassword ?? false;
  auth.value = {
    bearerToken: { kind: "PRESERVE" },
    googleClientId: yarr?.username ?? "",
    googleClientSecret: { kind: "PRESERVE" },
    trustedGatewayHosts: extraValue(yarr, "YARR_MCP_ALLOWED_HOSTS"),
    trustedGatewayOrigins: extraValue(yarr, "YARR_MCP_ALLOWED_ORIGINS"),
  };
  services.value = next.services.filter((service) => service.service !== "yarr").map((service) => ({
    ...service,
    extra: service.extra.map((entry) => ({ ...entry })),
    password: { kind: "PRESERVE" },
    apiKey: { kind: "PRESERVE" },
  }));
}

async function load(): Promise<void> {
  loadController?.abort();
  loadController = new AbortController();
  const current = ++loadGeneration;
  loading.value = true;
  refreshing.value = true;
  loadError.value = "";
  actionError.value = "";
  try {
    const [nextConfig, nextRuntime] = await Promise.all([
      queryYarrConfig(loadController.signal),
      queryYarrRuntime(loadController.signal),
    ]);
    if (current !== loadGeneration) return;
    hydrate(nextConfig);
    runtime.value = nextRuntime;
  } catch {
    if (current === loadGeneration && !loadController.signal.aborted) {
      loadError.value = "Yarr settings could not be loaded. Confirm the Unraid API is running, then retry.";
    }
  } finally {
    if (current === loadGeneration) {
      loading.value = false;
      refreshing.value = false;
    }
  }
}

function effectiveSecret(configured: boolean, update: YarrSecretUpdate): boolean {
  if (update.kind === "CLEAR") return false;
  if (update.kind === "SET") return update.value.trim().length > 0;
  return configured;
}

function exposureError(): string {
  if (!plugin.value || !auth.value) return "";
  if (plugin.value.authMode === "TRUSTED_GATEWAY") {
    if (plugin.value.bindMode !== "LOOPBACK" || plugin.value.tailscaleServe) {
      return "Trusted gateway is limited to a same-host proxy with loopback binding and Tailscale Serve disabled. Use bearer or Google OAuth for network exposure.";
    }
    if (auth.value.trustedGatewayHosts.trim() === "" && auth.value.trustedGatewayOrigins.trim() === "") {
      return "Trusted gateway authentication requires at least one allowed host or origin.";
    }
    return "";
  }
  if (plugin.value.bindMode === "LOOPBACK" && !plugin.value.tailscaleServe) return "";
  if (plugin.value.authMode === "BEARER" && !effectiveSecret(bearerConfigured.value, auth.value.bearerToken)) {
    return "Bearer authentication requires a configured token before Yarr can bind beyond loopback.";
  }
  if (plugin.value.authMode === "GOOGLE_OAUTH" && (
    auth.value.googleClientId.trim() === "" || !effectiveSecret(googleSecretConfigured.value, auth.value.googleClientSecret)
  )) {
    return "Google OAuth requires a client ID and configured client secret before Yarr can bind beyond loopback.";
  }
  return "";
}

function normalizedSecret(update: YarrSecretUpdate): YarrSecretUpdate {
  return update.kind === "SET" && update.value.trim() === "" ? { kind: "PRESERVE" } : update;
}

function saveInput(): SaveYarrConfigInput {
  const currentPlugin = plugin.value!;
  const currentAuth = auth.value!;
  return {
    ...currentPlugin,
    bearerToken: normalizedSecret(currentAuth.bearerToken),
    googleClientId: currentAuth.googleClientId,
    googleClientSecret: normalizedSecret(currentAuth.googleClientSecret),
    trustedGatewayHosts: currentAuth.trustedGatewayHosts,
    trustedGatewayOrigins: currentAuth.trustedGatewayOrigins,
    services: services.value.map((service) => {
      const input: SaveYarrServiceInput = {
        service: service.service,
        enabled: service.enabled,
        password: normalizedSecret(service.password),
        apiKey: normalizedSecret(service.apiKey),
      };
      if (service.baseUrl.trim() !== "") input.baseUrl = service.baseUrl;
      if (service.username !== null) input.username = service.username;
      return input;
    }),
  };
}

function mutationMessage(result: YarrConfigMutationResult): string {
  if (result.rolledBack) return `Changes were not kept. Previous configuration restored.${result.error ? ` ${result.error}` : ""}`;
  if (result.error) return `Save outcome is indeterminate. ${result.error} Check runtime status and logs before retrying.`;
  if (!result.changed) return "No configuration changes were needed.";
  if (result.restarted) return "Changes saved and Yarr restarted.";
  return "Changes saved. Yarr did not require a restart.";
}

async function save(): Promise<void> {
  const validation = exposureError();
  if (validation) {
    actionError.value = validation;
    return;
  }
  actionController?.abort();
  actionController = new AbortController();
  busy.value = true;
  actionError.value = "";
  resultMessage.value = "";
  try {
    const result = await mutateYarrConfig(saveInput(), actionController.signal);
    hydrate(result.config);
    resultMessage.value = mutationMessage(result);
  } catch {
    if (!actionController.signal.aborted) actionError.value = "Save result was not confirmed. Refresh current state before retrying.";
  } finally {
    busy.value = false;
  }
}

async function control(action: YarrControlAction): Promise<void> {
  actionController?.abort();
  actionController = new AbortController();
  busy.value = true;
  actionError.value = "";
  try {
    runtime.value = await controlYarr(action, actionController.signal);
    resultMessage.value = action === "STOP" ? "Yarr stopped." : action === "START" ? "Yarr started." : "Yarr restarted.";
  } catch {
    if (!actionController.signal.aborted) actionError.value = "Control result was not confirmed. Refresh current state before retrying.";
  } finally {
    busy.value = false;
  }
}

function applied(result: YarrConfigMutationResult): void {
  hydrate(result.config);
  resultMessage.value = mutationMessage(result);
}

function selectTab(tab: Tab, focus = false): void {
  activeTab.value = tab;
  if (focus) void nextTick(() => tabElements.value[tabs.indexOf(tab)]?.focus());
}

function tabKey(event: KeyboardEvent, index: number): void {
  let target = index;
  if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") target = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") target = 0;
  else if (event.key === "End") target = tabs.length - 1;
  else return;
  event.preventDefault();
  selectTab(tabs[target], true);
}

function setTabElement(element: HTMLButtonElement | null, index: number): void {
  if (element) tabElements.value[index] = element;
}

onMounted(load);
onBeforeUnmount(() => {
  loadGeneration += 1;
  loadController?.abort();
  actionController?.abort();
});
</script>

<template>
  <section class="yarr-shell yarr-settings" aria-labelledby="yarr-settings-title" :aria-busy="loading || busy">
    <aside class="yarr-identity">
      <p class="yarr-shell__eyebrow">Unraid service</p>
      <h1 id="yarr-settings-title">Yarr</h1>
      <StatusBadge v-if="runtime" :state="runtime.ready ? 'success' : runtime.state === 'running' ? 'warning' : 'neutral'" :label="runtime.ready ? 'Ready' : runtime.state" />
      <p>Media service operations</p>
    </aside>

    <main class="yarr-workspace">
      <div v-if="loadError" class="yarr-error yarr-load-error" role="alert">
        <p>{{ loadError }}</p><button type="button" class="yarr-button" :disabled="loading" @click="load">Retry</button>
      </div>
      <p v-else-if="!loaded" class="yarr-shell__message" role="status">Loading Yarr operations...</p>
      <template v-else>
        <ol class="yarr-signal-rail" :class="{ 'is-refreshing': refreshing }" aria-label="Yarr lifecycle signals">
          <li><span>Process</span><strong>{{ runtime!.state }}</strong></li>
          <li><span>Ready</span><strong>{{ runtime!.ready ? "Yes" : "No" }}</strong></li>
          <li><span>Endpoint</span><strong>{{ runtime!.bindAddress }}:{{ runtime!.port }}</strong></li>
          <li><span>Version</span><strong>{{ runtime!.version ?? "Unavailable" }}</strong></li>
        </ol>

        <div class="yarr-tabs-wrap">
          <div class="yarr-tabs" role="tablist" aria-label="Yarr settings sections">
            <button
              v-for="(tab, index) in tabs"
              :id="`yarr-tab-${index}`"
              :key="tab"
              :ref="(element) => setTabElement(element as HTMLButtonElement | null, index)"
              type="button"
              role="tab"
              :aria-selected="activeTab === tab"
              :aria-controls="`yarr-panel-${index}`"
              :tabindex="activeTab === tab ? 0 : -1"
              :disabled="operationBusy"
              @click="selectTab(tab)"
              @keydown="tabKey($event, index)"
            >{{ tab }}</button>
          </div>
        </div>

        <div :id="`yarr-panel-${tabs.indexOf(activeTab)}`" role="tabpanel" :aria-labelledby="`yarr-tab-${tabs.indexOf(activeTab)}`" tabindex="0">
          <OverviewPanel v-if="activeTab === 'Overview'" :runtime="runtime!" :config="config!" :busy="operationBusy" @control="control" @import="importOpen = true" @discover="discoveryOpen = true" />
          <ServicesPanel v-else-if="activeTab === 'Services'" :services="services" :disabled="operationBusy" @update="services = $event" />
          <ServerAuthPanel v-else-if="activeTab === 'Server & Auth'" :plugin="plugin!" :auth="auth!" :bearer-configured="bearerConfigured" :google-secret-configured="googleSecretConfigured" :disabled="operationBusy" @plugin="plugin = $event" @auth="auth = $event" />
          <UpdatesPanel v-else-if="activeTab === 'Updates'" @busy="delegatedBusy = $event" />
          <LogsPanel v-else />
        </div>

        <div class="yarr-save-bar">
          <div aria-live="polite">
            <p v-if="actionError" class="yarr-error" role="alert">{{ actionError }}</p>
            <p v-else-if="resultMessage" class="yarr-result" role="status">{{ resultMessage }}</p>
            <p v-else>Changes are validated again by the Yarr service before they are applied.</p>
          </div>
          <button type="button" class="yarr-button" :disabled="operationBusy" @click="save">{{ busy ? "Saving..." : "Save changes" }}</button>
        </div>
      </template>
    </main>

    <ImportDialog :open="importOpen" @close="importOpen = false" @applied="applied" @busy="delegatedBusy = $event" />
    <DiscoveryDialog :open="discoveryOpen" @close="discoveryOpen = false" @applied="applied" @busy="delegatedBusy = $event" />
  </section>
</template>
