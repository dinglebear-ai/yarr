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

const focusableSelector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

function isEnabledVisible(element: HTMLElement): boolean {
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") return false;
  if (element.hidden || element.closest("[hidden]")) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function focusables(): HTMLElement[] {
  return [...(panel.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])].filter(isEnabledVisible);
}

function preferredFocus(): HTMLElement | undefined {
  const preferred = panel.value?.querySelector<HTMLElement>("[data-autofocus]");
  if (preferred && isEnabledVisible(preferred)) return preferred;
  return focusables()[0];
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && !props.busy) {
    event.preventDefault();
    emit("close");
    return;
  }
  if (event.key !== "Tab" || !props.open) return;
  const available = focusables();
  if (available.length === 0) return;
  const current = document.activeElement instanceof HTMLElement ? available.indexOf(document.activeElement) : -1;
  if (event.shiftKey && current <= 0) {
    event.preventDefault();
    available.at(-1)?.focus();
  } else if (!event.shiftKey && (current === -1 || current === available.length - 1)) {
    event.preventDefault();
    available[0].focus();
  }
}

function onFocusIn(event: FocusEvent): void {
  if (!props.open || !panel.value || panel.value.contains(event.target as Node)) return;
  preferredFocus()?.focus();
}

function removeListeners(): void {
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener("focusin", onFocusIn);
}

watch(() => props.open, async (open) => {
  removeListeners();
  if (!open) {
    restoreTarget?.focus();
    restoreTarget = null;
    return;
  }
  restoreTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("focusin", onFocusIn);
  await nextTick();
  preferredFocus()?.focus();
}, { immediate: true });

onBeforeUnmount(() => {
  removeListeners();
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
