<script setup lang="ts">
import { computed } from 'vue'
import { TIERS, TREES } from '../data/trees.data'
import { isAvailable } from '../domain/graph'
import { FRUIT_CHAIN } from '../domain/plan'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'

/**
 * Визуально скрытая, но доступная скринридеру и клавиатуре альтернатива графу
 * деревьев. Список узлов сгруппирован по тирам; выбор узла (Enter/Space/click)
 * эмитит select(id) — TreeGraph пробрасывает его в тот же путь, что и tap по ноде.
 * Данные не дублируются: те же TREES/TIERS + прогресс из стора, с учётом фильтров UI.
 */
const emit = defineEmits<{ select: [id: string] }>()

const store = useTreesStore()
const ui = useTreesUiStore()

type Status = 'получено' | 'доступно' | 'недоступно'

function statusOf(id: string): Status {
  const s = store.progress[id] ?? 0
  if (s === 2) return 'получено'
  return isAvailable(store.progress, id) ? 'доступно' : 'недоступно'
}

interface A11yNode {
  id: string
  tier: number
  status: Status
  label: string
}

/** Видимые узлы с учётом тех же фильтров, что применяет граф. */
const nodes = computed<A11yNode[]>(() =>
  TREES.filter(
    (t) =>
      ui.visibleTiers.has(t.tier) &&
      (!ui.onlyFruit || FRUIT_CHAIN.has(t.id)) &&
      (!ui.onlyFruitful || !!t.fruit) &&
      (!ui.onlyAvail || statusOf(t.id) !== 'недоступно'),
  ).map((t) => {
    const status = statusOf(t.id)
    const tierName = TIERS.find((ti) => ti.id === t.tier)?.name ?? `Tier ${t.tier}`
    return {
      id: t.id,
      tier: t.tier,
      status,
      label: `${t.id}, ${tierName}, ${status}`,
    }
  }),
)
</script>

<template>
  <div class="sr-only">
    <ul role="list" aria-label="Список узлов графа деревьев">
      <li v-for="n in nodes" :key="n.id" role="listitem">
        <button
          type="button"
          :aria-label="n.label"
          :aria-current="ui.selectedId === n.id ? 'true' : undefined"
          @click="emit('select', n.id)"
        >
          {{ n.label }}
        </button>
      </li>
    </ul>
  </div>
</template>
