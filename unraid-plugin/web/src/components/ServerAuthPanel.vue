<script setup lang="ts">
import type { YarrAuthDraft, YarrPluginConfig, YarrSecretUpdate } from "../types";
import SecretField from "./SecretField.vue";

const props = defineProps<{
  plugin: YarrPluginConfig;
  auth: YarrAuthDraft;
  bearerConfigured: boolean;
  googleSecretConfigured: boolean;
  disabled: boolean;
}>();

const emit = defineEmits<{
  plugin: [value: YarrPluginConfig];
  auth: [value: YarrAuthDraft];
}>();

function patchPlugin(update: Partial<YarrPluginConfig>): void {
  emit("plugin", { ...props.plugin, ...update });
}

function patchAuth(update: Partial<YarrAuthDraft>): void {
  emit("auth", { ...props.auth, ...update });
}

function authSecret(key: "bearerToken" | "googleClientSecret", value: YarrSecretUpdate): void {
  patchAuth({ [key]: value });
}
</script>

<template>
  <section class="yarr-panel" aria-labelledby="server-heading">
    <div class="yarr-section-heading"><div><h2 id="server-heading">Server &amp; Auth</h2><p>Keep Yarr on loopback unless authentication is fully configured.</p></div></div>
    <div class="yarr-form-rows">
      <label class="yarr-setting-row"><span><strong>Run Yarr</strong><small>Start Yarr with the array lifecycle.</small></span><input type="checkbox" :checked="plugin.enabled" :disabled="disabled" @change="patchPlugin({ enabled: ($event.target as HTMLInputElement).checked })"></label>
      <label class="yarr-setting-row"><span><strong>Bind mode</strong><small>Choose which interfaces accept connections.</small></span><select :value="plugin.bindMode" :disabled="disabled" @change="patchPlugin({ bindMode: ($event.target as HTMLSelectElement).value as YarrPluginConfig['bindMode'] })"><option value="LOOPBACK">Loopback only</option><option value="LAN">LAN interfaces</option><option value="CUSTOM">Custom address</option></select></label>
      <label v-if="plugin.bindMode === 'CUSTOM'" class="yarr-setting-row"><span><strong>Custom bind address</strong><small>Use an IP address owned by this server.</small></span><input type="text" :value="plugin.customHost" :disabled="disabled" @input="patchPlugin({ customHost: ($event.target as HTMLInputElement).value })"></label>
      <label class="yarr-setting-row"><span><strong>Port</strong><small>Yarr API and MCP listener port.</small></span><input type="number" min="1" max="65535" :value="plugin.port" :disabled="disabled" @input="patchPlugin({ port: Number(($event.target as HTMLInputElement).value) })"></label>
      <label class="yarr-setting-row"><span><strong>Authentication mode</strong><small>LAN, custom, and Tailscale exposure require bearer or Google OAuth.</small></span><select :value="plugin.authMode" :disabled="disabled" @change="patchPlugin({ authMode: ($event.target as HTMLSelectElement).value as YarrPluginConfig['authMode'] })"><option value="BEARER">Bearer token</option><option value="GOOGLE_OAUTH">Google OAuth</option><option value="TRUSTED_GATEWAY" :disabled="plugin.bindMode !== 'LOOPBACK' || plugin.tailscaleServe">Trusted gateway (same-host loopback only)</option></select></label>
    </div>

    <div class="yarr-auth-section">
      <SecretField v-if="plugin.authMode === 'BEARER'" name="bearer-token" label="Bearer token" :configured="bearerConfigured" :intent="auth.bearerToken.kind" :disabled="disabled" @update="authSecret('bearerToken', $event)" />
      <template v-else-if="plugin.authMode === 'GOOGLE_OAUTH'">
        <label>Google client ID<input type="text" :value="auth.googleClientId" :disabled="disabled" autocomplete="off" @input="patchAuth({ googleClientId: ($event.target as HTMLInputElement).value })"></label>
        <SecretField name="google-client-secret" label="Google client secret" :configured="googleSecretConfigured" :intent="auth.googleClientSecret.kind" :disabled="disabled" @update="authSecret('googleClientSecret', $event)" />
      </template>
      <div v-else class="yarr-form-grid">
        <p>Trusted gateway accepts provenance only from a same-host proxy while Yarr is bound to loopback. Direct-client Host and Origin headers are not authentication.</p>
        <label>Trusted gateway hosts<textarea :value="auth.trustedGatewayHosts" :disabled="disabled" rows="3" @input="patchAuth({ trustedGatewayHosts: ($event.target as HTMLTextAreaElement).value })" /></label>
        <label>Trusted gateway origins<textarea :value="auth.trustedGatewayOrigins" :disabled="disabled" rows="3" @input="patchAuth({ trustedGatewayOrigins: ($event.target as HTMLTextAreaElement).value })" /></label>
      </div>
    </div>

    <div class="yarr-form-rows">
      <label class="yarr-setting-row"><span><strong>Tailscale Serve</strong><small>Publishes the endpoint and therefore requires bearer or Google OAuth.</small></span><input type="checkbox" :checked="plugin.tailscaleServe" :disabled="disabled" @change="patchPlugin({ tailscaleServe: ($event.target as HTMLInputElement).checked })"></label>
      <label v-if="plugin.tailscaleServe" class="yarr-setting-row"><span><strong>Tailscale hostname</strong><small>DNS-label service name.</small></span><input type="text" :value="plugin.tailscaleHostname" :disabled="disabled" @input="patchPlugin({ tailscaleHostname: ($event.target as HTMLInputElement).value })"></label>
      <label class="yarr-setting-row"><span><strong>Log level</strong><small>Increase verbosity only while diagnosing an issue.</small></span><select :value="plugin.logLevel" :disabled="disabled" @change="patchPlugin({ logLevel: ($event.target as HTMLSelectElement).value as YarrPluginConfig['logLevel'] })"><option v-for="level in ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']" :key="level" :value="level">{{ level }}</option></select></label>
    </div>
  </section>
</template>
