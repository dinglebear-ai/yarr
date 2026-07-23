<script setup lang="ts">
import AccessibleDialog from "./AccessibleDialog.vue";

withDefaults(defineProps<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  danger?: boolean;
}>(), {
  cancelLabel: "Cancel",
  busy: false,
  danger: false,
});

const emit = defineEmits<{ close: []; confirm: [] }>();
</script>

<template>
  <AccessibleDialog :open="open" :title="title" :busy="busy" @close="emit('close')">
    <p>{{ description }}</p>
    <template #footer>
      <button type="button" class="yarr-button is-quiet" data-autofocus :disabled="busy" @click="emit('close')">{{ cancelLabel }}</button>
      <button type="button" class="yarr-button" :class="{ 'is-danger': danger }" :disabled="busy" @click="emit('confirm')">
        {{ busy ? "Working..." : confirmLabel }}
      </button>
    </template>
  </AccessibleDialog>
</template>
