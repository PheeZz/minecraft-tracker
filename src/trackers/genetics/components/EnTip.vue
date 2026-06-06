<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ en: string }>()
const open = ref(false)
const x = ref(0)
const y = ref(0)

function show(e: MouseEvent | FocusEvent): void {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  x.value = r.left + r.width / 2
  y.value = r.top
  open.value = true
}
function hide(): void {
  open.value = false
}
</script>

<template>
  <span class="entip" tabindex="0" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    <Teleport to="body">
      <span v-if="open" class="entip__pop" :style="{ left: x + 'px', top: y + 'px' }">{{
        en
      }}</span>
    </Teleport>
  </span>
</template>

<style scoped>
.entip {
  border-bottom: 1px dotted color-mix(in srgb, var(--ink) 45%, transparent);
  cursor: help;
}
.entip__pop {
  position: fixed;
  transform: translate(-50%, calc(-100% - 7px));
  background: #0d0b08;
  color: #e8dcc0;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-style: italic;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
}
</style>
