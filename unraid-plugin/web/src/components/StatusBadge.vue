<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  state: "success" | "warning" | "danger" | "neutral";
  label?: string;
}>(), {
  label: undefined,
});

const text = computed(() => props.label ?? ({
  success: "Available",
  warning: "Needs attention",
  danger: "Unavailable",
  neutral: "Unknown",
}[props.state]));
</script>

<template>
  <span class="yarr-status-badge" :class="`is-${state}`" :aria-label="`Status: ${text}`">
    <span class="yarr-status-badge__symbol" aria-hidden="true">{{ state === "success" ? "OK" : state === "danger" ? "!" : "-" }}</span>
    <span>{{ text }}</span>
  </span>
</template>
