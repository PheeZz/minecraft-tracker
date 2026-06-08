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
      <TierDetail :key="selectedTier" :tier="selectedTier" />
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
