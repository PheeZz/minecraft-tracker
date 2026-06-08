<script setup lang="ts">
// Разбивка рун ритуала по типам с цветовыми бейджами стихий.
import { computed } from 'vue'
import type { Ritual, RuneKind } from '../domain/types'

const { ritual } = defineProps<{ ritual: Ritual }>()

const RUNE_LABELS: Record<RuneKind, string> = {
  water: 'Вода',
  fire: 'Огонь',
  earth: 'Земля',
  air: 'Воздух',
  dusk: 'Сумрак',
  blank: 'Обычный',
}

const runeEntries = computed(() =>
  (Object.entries(ritual.runeBreakdown) as [RuneKind, number][]).filter(([, count]) => count > 0),
)

// Добавляем мастер-камень (+1) к общему runeCount
const masterStoneCount = 1
</script>

<template>
  <div class="rrb">
    <h4 class="rrb__title">Руны ({{ ritual.runeCount }} шт.)</h4>
    <div class="rrb__list">
      <!-- Мастер-камень всегда первым -->
      <div class="rrb__item rrb__item--master">
        <span class="rrb__badge" data-rune="master">Мастер</span>
        <span class="rrb__count">{{ masterStoneCount }}</span>
      </div>
      <div v-for="[rune, count] in runeEntries" :key="rune" class="rrb__item">
        <span class="rrb__badge" :data-rune="rune">{{ RUNE_LABELS[rune] }}</span>
        <span class="rrb__count">{{ count }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rrb {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--card2);
  border: 1px solid var(--cardln);
  border-radius: 10px;
}

.rrb__title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.rrb__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rrb__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rrb__badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid var(--cardln);
}

.rrb__badge[data-rune='master'] {
  background: rgba(138, 16, 32, 0.25);
  color: #f0d8d8;
  border-color: rgba(224, 52, 74, 0.35);
}

.rrb__badge[data-rune='water'] {
  background: rgba(30, 100, 200, 0.2);
  color: #90c8f8;
  border-color: rgba(30, 100, 200, 0.3);
}

.rrb__badge[data-rune='fire'] {
  background: rgba(220, 80, 20, 0.2);
  color: #f8a060;
  border-color: rgba(220, 80, 20, 0.3);
}

.rrb__badge[data-rune='earth'] {
  background: rgba(60, 140, 40, 0.2);
  color: #90d870;
  border-color: rgba(60, 140, 40, 0.3);
}

.rrb__badge[data-rune='air'] {
  background: rgba(180, 200, 220, 0.15);
  color: #c8dce8;
  border-color: rgba(180, 200, 220, 0.25);
}

.rrb__badge[data-rune='dusk'] {
  background: rgba(100, 50, 160, 0.22);
  color: #c0a0f0;
  border-color: rgba(100, 50, 160, 0.35);
}

.rrb__badge[data-rune='blank'] {
  background: rgba(100, 90, 80, 0.2);
  color: #c0b8a8;
  border-color: rgba(100, 90, 80, 0.3);
}

.rrb__count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}
</style>
