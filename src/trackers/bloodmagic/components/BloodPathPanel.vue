<script setup lang="ts">
// Панель «Путь крови»: лестница тиров слева, детали тира справа.
// Состояние выбранного тира локальное — нет смысла персистировать.
import { ref } from 'vue'
import TierLadder from './TierLadder.vue'
import TierDetail from './TierDetail.vue'

// Начинаем с тира 1 — первого элемента прогрессии
const selectedTier = ref(1)
</script>

<template>
  <div class="bpp">
    <aside class="bpp__ladder">
      <p class="bpp__ladder-title">Тиры алтаря</p>
      <TierLadder v-model="selectedTier" />
    </aside>
    <main class="bpp__detail">
      <!-- Плавная смена деталей тира: fade + лёгкий сдвиг по Y, 200мс -->
      <Transition name="tier-fade" mode="out-in">
        <TierDetail :key="selectedTier" :tier="selectedTier" />
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.bpp {
  display: flex;
  gap: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.bpp__ladder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 12px;
  min-width: 200px;
  max-width: 220px;
  border-right: 1px solid var(--cardln);
  overflow-y: auto;
  flex: none;
}

.bpp__ladder-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.bpp__detail {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

/* Переход при смене тира: fade + сдвиг по Y */
.tier-fade-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tier-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.tier-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tier-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* При prefers-reduced-motion убираем сдвиг, оставляем только fade */
@media (prefers-reduced-motion: reduce) {
  .tier-fade-enter-active,
  .tier-fade-leave-active {
    transition: opacity 0.1s ease;
  }

  .tier-fade-enter-from,
  .tier-fade-leave-to {
    transform: none;
  }
}

/* Адаптив: на узких экранах лестница сверху */
@media (max-width: 640px) {
  .bpp {
    flex-direction: column;
  }

  .bpp__ladder {
    max-width: none;
    border-right: none;
    border-bottom: 1px solid var(--cardln);
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 10px 12px;
    gap: 4px;
  }

  .bpp__ladder-title {
    display: none;
  }
}
</style>
