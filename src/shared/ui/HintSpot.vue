<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  text: string
  title?: string
  side?: 'top' | 'bottom' | 'bottom-end' | 'left' | 'right'
}>()

const open = ref(false)
const root = ref<HTMLElement>()

function toggle(): void {
  open.value = !open.value
}
function onDocClick(e: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <span ref="root" class="hint">
    <button
      type="button"
      class="hint__btn"
      :class="{ on: open }"
      :aria-expanded="open"
      aria-label="Подсказка"
      @click.stop="toggle"
    >
      ?
    </button>
    <span v-if="open" class="hint__pop" :class="`hint__pop--${side ?? 'bottom'}`" role="note">
      <span v-if="title" class="hint__title">{{ title }}</span>
      <span class="hint__text">{{ text }}</span>
    </span>
  </span>
</template>

<style scoped>
.hint {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}
.hint__btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--cardln, #3b3225);
  background: var(--card, #261f16);
  color: var(--muted, #9a8868);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  padding: 0;
}
.hint__btn:hover,
.hint__btn.on {
  border-color: var(--honey-dk, var(--leaf, #e8a72c));
  color: var(--honey-dk, var(--leaf, #e8a72c));
}
.hint__btn:focus-visible {
  outline: 2px solid var(--honey-dk, var(--leaf, #e8a72c));
  outline-offset: 1px;
}
.hint__pop {
  position: absolute;
  z-index: 120;
  width: max-content;
  max-width: 240px;
  background: var(--panel, #15201a);
  border: 1px solid var(--line, rgba(232, 167, 44, 0.3));
  border-radius: 10px;
  padding: 9px 11px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink, #f1e7d4);
  text-align: left;
  white-space: normal;
}
.hint__pop--bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}
/* правый край popover привязан к триггеру — растёт влево, не переполняя вьюпорт справа
   (для «?»-хинтов у правого края панелей/тулбаров) */
.hint__pop--bottom-end {
  top: calc(100% + 8px);
  right: 0;
}
.hint__pop--top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}
.hint__pop--right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}
.hint__pop--left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}
.hint__title {
  display: block;
  font-weight: 700;
  margin-bottom: 3px;
}
</style>
