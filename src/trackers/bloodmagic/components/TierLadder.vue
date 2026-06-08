<script setup lang="ts">
// Лестница тиров 1→6: краткая сводка каждого тира с отметкой «построено».
// Клик по тиру — выбор для детального просмотра; текущий выделен.
import { computed } from 'vue'
import { ALTAR_TIERS } from '../data/altar.data'
import { unlocksAtTier } from '../domain/progression'
import { useProgressStore } from '../stores/useProgressStore'

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [tier: number] }>()

const store = useProgressStore()

interface TierRow {
  tier: number
  runeCount: number
  orbName: string | null
  orbCapacity: number | null
}

const rows = computed<TierRow[]>(() =>
  ALTAR_TIERS.map((t) => {
    const { orb } = unlocksAtTier(t.tier)
    return {
      tier: t.tier,
      runeCount: t.runeCount,
      orbName: orb?.name_ru ?? null,
      orbCapacity: orb?.capacity_LP ?? null,
    }
  }),
)

/** Форматирует LP в читаемый вид: 1 000 000 → «1M», 150 000 → «150k» и т.д. */
function formatLP(lp: number): string {
  if (lp >= 1_000_000) return `${lp / 1_000_000}M`
  if (lp >= 1_000) return `${lp / 1_000}k`
  return String(lp)
}
</script>

<template>
  <nav class="tl" aria-label="Лестница тиров алтаря">
    <button
      v-for="row in rows"
      :key="row.tier"
      type="button"
      class="tl__row"
      :class="{
        'tl__row--active': props.modelValue === row.tier,
        'tl__row--built': store.isBuilt(row.tier),
      }"
      :aria-pressed="props.modelValue === row.tier"
      @click="emit('update:modelValue', row.tier)"
    >
      <span class="tl__tier">T{{ row.tier }}</span>
      <span class="tl__body">
        <span v-if="row.orbName" class="tl__orb">{{ row.orbName }}</span>
        <span v-if="row.orbCapacity" class="tl__cap">{{ formatLP(row.orbCapacity) }} LP</span>
      </span>
      <span class="tl__runes">{{ row.runeCount }} рун</span>
      <span v-if="store.isBuilt(row.tier)" class="tl__built" aria-label="Построено">✓</span>
    </button>
  </nav>
</template>

<style scoped>
.tl {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 180px;
}

.tl__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  font: inherit;
  font-size: 12px;
  color: var(--ink2);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.12s,
    background 0.12s,
    color 0.12s;
}

.tl__row:hover:not(.tl__row--active) {
  border-color: var(--honey);
  color: var(--ink);
}

.tl__row:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}

.tl__row--active {
  background: rgba(138, 16, 32, 0.22);
  border-color: var(--solid);
  color: var(--ink);
}

.tl__row--built {
  border-left: 3px solid var(--src-f);
}

.tl__tier {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 800;
  color: var(--honey-dk);
  min-width: 22px;
}

.tl__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}

.tl__orb {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tl__cap {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
}

.tl__runes {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--dim);
  white-space: nowrap;
}

.tl__built {
  font-size: 13px;
  color: var(--src-f);
  font-weight: 800;
  flex: none;
}
</style>
