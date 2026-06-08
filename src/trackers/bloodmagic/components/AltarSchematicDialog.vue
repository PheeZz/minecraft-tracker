<script setup lang="ts">
// Диалог со схемой алтаря — открывается по клику на бейдж «Тир N» в карточке altar-рецепта.
// Один экземпляр на весь RecipesPanel; принимает tier через prop, закрывается через emit.
import { ref, computed } from 'vue'
import { useFocusTrap } from '@/shared/ui/useFocusTrap'
import AltarSchematic from './AltarSchematic.vue'

defineProps<{ tier: number }>()
const emit = defineEmits<{ close: [] }>()

const winEl = ref<HTMLElement>()
// Признак открытости — всегда true, т.к. диалог монтируется только когда нужен (v-if снаружи)
const isOpen = computed(() => true)
useFocusTrap(winEl, { onEscape: () => emit('close'), active: isOpen })

function onBackdrop(e: MouseEvent): void {
  // Закрываем только при клике точно по backdrop, не по содержимому
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <!-- Backdrop — перехватываем клик мимо окна -->
  <div class="dlg-backdrop" @click="onBackdrop" @keydown.esc="emit('close')">
    <div
      ref="winEl"
      class="dlg"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`dlg-title-${tier}`"
    >
      <header class="dlg__head">
        <h2 :id="`dlg-title-${tier}`" class="dlg__title">Структура алтаря · Тир {{ tier }}</h2>
        <button type="button" class="dlg__close" aria-label="Закрыть диалог" @click="emit('close')">
          ✕
        </button>
      </header>
      <div class="dlg__body">
        <AltarSchematic :tier="tier" :large="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dlg-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
  padding: 20px;
  animation: dlgFade 0.16s ease;
}

@keyframes dlgFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dlg {
  width: min(460px, 100%);
  max-height: min(560px, 90vh);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid var(--cardln);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  animation: dlgPop 0.16s ease;
  overflow: hidden;
}

@keyframes dlgPop {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.dlg__head {
  display: flex;
  align-items: center;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--line);
  flex: none;
}

.dlg__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  margin: 0;
  color: var(--ink);
  flex: 1;
}

.dlg__close {
  font: inherit;
  font-size: 14px;
  background: var(--card);
  border: 1px solid var(--cardln);
  color: var(--ink2);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-left: 8px;
}

.dlg__close:hover {
  border-color: var(--honey-dk);
  color: var(--honey-dk);
}

.dlg__close:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}

.dlg__body {
  flex: 1;
  overflow: auto;
  padding: 18px 20px 20px;
  display: flex;
  justify-content: center;
}
</style>
