<script setup lang="ts">
import { ref, useId, watch } from "vue";
import type { YarrSecretUpdate, YarrSecretUpdateKind } from "../types";

const props = withDefaults(defineProps<{
  name: string;
  label: string;
  configured: boolean;
  intent?: YarrSecretUpdateKind;
}>(), {
  intent: "PRESERVE",
});

const emit = defineEmits<{
  update: [value: YarrSecretUpdate];
}>();

const selectedIntent = ref<YarrSecretUpdateKind>(props.intent);
const newValue = ref("");
const inputId = `yarr-secret-${props.name}-${useId()}`;

watch(() => props.intent, (intent) => {
  selectedIntent.value = intent;
  if (intent !== "SET") newValue.value = "";
});

function updateIntent(intent: YarrSecretUpdateKind): void {
  selectedIntent.value = intent;
  if (intent === "SET") {
    emit("update", { kind: "SET", value: newValue.value });
    return;
  }
  newValue.value = "";
  emit("update", { kind: intent });
}

function updateValue(value: string): void {
  newValue.value = value;
  emit("update", { kind: "SET", value });
}
</script>

<template>
  <fieldset class="yarr-secret-field">
    <legend>{{ label }}</legend>
    <p class="yarr-secret-field__status">{{ configured ? "Configured" : "Not configured" }}</p>
    <label><input :name="`${name}-intent`" type="radio" :checked="selectedIntent === 'PRESERVE'" @change="updateIntent('PRESERVE')"> Keep current value</label>
    <label><input :name="`${name}-intent`" type="radio" :checked="selectedIntent === 'SET'" @change="updateIntent('SET')"> Set a new value</label>
    <label v-if="selectedIntent === 'SET'" :for="inputId">New {{ label }}</label>
    <input
      v-if="selectedIntent === 'SET'"
      :id="inputId"
      :name="`${name}-new-value`"
      type="password"
      :aria-label="`New ${label}`"
      autocomplete="new-password"
      placeholder="Enter a new value"
      :value="newValue"
      @input="updateValue(($event.target as HTMLInputElement).value)"
    >
    <label v-if="configured"><input :name="`${name}-intent`" type="radio" :checked="selectedIntent === 'CLEAR'" @change="updateIntent('CLEAR')"> Clear configured value</label>
  </fieldset>
</template>
