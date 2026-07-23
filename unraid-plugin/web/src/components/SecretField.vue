<script setup lang="ts">
import { ref, watch } from "vue";
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
    <input
      v-if="selectedIntent === 'SET'"
      :id="`${name}-new-value`"
      :name="`${name}-new-value`"
      type="password"
      autocomplete="new-password"
      placeholder="Enter a new value"
      :value="newValue"
      @input="updateValue(($event.target as HTMLInputElement).value)"
    >
    <label v-if="configured"><input :name="`${name}-intent`" type="radio" :checked="selectedIntent === 'CLEAR'" @change="updateIntent('CLEAR')"> Clear configured value</label>
  </fieldset>
</template>
