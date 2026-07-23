<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  busy?: boolean;
}>(), { busy: false });

const emit = defineEmits<{ close: [] }>();
const panel = ref<HTMLElement>();
const titleId = `yarr-dialog-${useId()}`;
let restoreTarget: HTMLElement | null = null;

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && !props.busy) {
    event.preventDefault();
    emit("close");
  }
}

function removeListener(): void {
  document.removeEventListener("keydown", onKeydown);
}

watch(() => props.open, async (open) => {
  removeListener();
  if (!open) {
    restoreTarget?.focus();
    restoreTarget = null;
    return;
  }
  restoreTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.addEventListener("keydown", onKeydown);
  await nextTick();
  const target = panel.value?.querySelector<HTMLElement>("[data-autofocus], button, input, select, textarea, a[href]");
  target?.focus();
});

onBeforeUnmount(() => {
  removeListener();
  restoreTarget?.focus();
});
</script>

<template>
  <div v-if="open" class="yarr-dialog-backdrop">
    <section
      ref="panel"
      class="yarr-dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-busy="busy"
    >
      <header class="yarr-dialog__header">
        <h2 :id="titleId">{{ title }}</h2>
        <button type="button" class="yarr-button is-quiet" :disabled="busy" aria-label="Close dialog" @click="emit('close')">Close</button>
      </header>
      <div class="yarr-dialog__body"><slot /></div>
      <footer v-if="$slots.footer" class="yarr-dialog__footer"><slot name="footer" /></footer>
    </section>
  </div>
</template>
