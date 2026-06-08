<script setup lang="ts">
// Модалка с крупным 3D-видом алтаря. Открывается из TierDetail по кнопке «развернуть».
// Отдельный экземпляр MultiblockView — свой three.js-контекст; удаляется при закрытии (v-if).
import { ref, computed } from 'vue'
import { useFocusTrap } from '@/shared/ui/useFocusTrap'
import MultiblockView from './MultiblockView.vue'
import type { VoxelBlock } from '../three/voxelTypes'

defineProps<{ tier: number; blocks: VoxelBlock[] }>()
const emit = defineEmits<{ close: [] }>()

const winEl = ref<HTMLElement>()
// Диалог всегда «открыт» пока смонтирован (v-if снаружи контролирует монтаж)
const isOpen = computed(() => true)
useFocusTrap(winEl, { onEscape: () => emit('close'), active: isOpen })

function onBackdrop(e: MouseEvent): void {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <!-- Backdrop: клик мимо окна → закрыть -->
  <div class="mbd-backdrop" @click="onBackdrop" @keydown.esc="emit('close')">
    <div
      ref="winEl"
      class="mbd"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`mbd-title-${tier}`"
    >
      <header class="mbd__head">
        <h2 :id="`mbd-title-${tier}`" class="mbd__title">Структура алтаря · Тир {{ tier }}</h2>
        <button type="button" class="mbd__close" aria-label="Закрыть диалог" @click="emit('close')">
          ✕
        </button>
      </header>
      <div class="mbd__body">
        <!-- Отдельный экземпляр: свой three.js-контекст; dispose происходит в onBeforeUnmount MultiblockView -->
        <MultiblockView :blocks="blocks" :height="560" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mbd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  animation: mbdFade 0.16s ease;
}

@keyframes mbdFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.mbd {
  width: min(900px, 100%);
  max-height: min(800px, 90vh);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid var(--cardln);
  border-radius: 16px;
  /* Тонкая кровавая аура вокруг модалки 3D */
  box-shadow:
    0 0 0 1px rgba(224, 52, 74, 0.12),
    0 24px 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(138, 16, 32, 0.14);
  animation: mbdPop 0.16s ease;
  overflow: hidden;
}

@keyframes mbdPop {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.mbd__head {
  display: flex;
  align-items: center;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--line);
  flex: none;
}

.mbd__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  margin: 0;
  color: var(--ink);
  flex: 1;
}

.mbd__close {
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
  transition:
    border-color 0.12s,
    color 0.12s;
}

.mbd__close:hover {
  border-color: var(--honey-dk);
  color: var(--honey-dk);
}

.mbd__close:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}

.mbd__body {
  flex: 1;
  overflow: hidden;
  padding: 16px;
  /* ~70vh за вычетом заголовка */
  min-height: 0;
}
</style>
