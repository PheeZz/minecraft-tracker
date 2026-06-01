<script setup lang="ts">
import { computed } from 'vue'
import { BEE_BY_ID } from '../data/bees.data'
import { buildSubgraph } from '../graph/subgraph'
import { useBeesStore } from '../stores/useBeesStore'
import { useBeesUiStore } from '../stores/useBeesUiStore'

/**
 * Визуально скрытая, но доступная скринридеру и клавиатуре альтернатива графу
 * цепочки выведения пчёл. Список узлов берётся из того же buildSubgraph, что и
 * граф (данные не дублируются). Выбор узла (Enter/Space/click) эмитит select(id)
 * — BeeChainGraph пробрасывает его в тот же путь, что и tap по ноде.
 */
const emit = defineEmits<{ select: [id: string] }>()

const store = useBeesStore()
const ui = useBeesUiStore()

type Status = 'цель' | 'есть' | 'дикая' | 'вывести'

interface A11yNode {
  id: string
  status: Status
  alt: boolean
  label: string
}

const nodes = computed<A11yNode[]>(() => {
  const target = ui.curTarget
  if (!target) return []
  const els = buildSubgraph(target, store.have, store.rc)
  return els
    .filter((e) => e.data.kind === 'bee' && typeof e.data.id === 'string')
    .map((e) => {
      const id = e.data.id as string
      const alt = !!e.data.alt
      const status: Status =
        id === target ? 'цель' : e.data.have ? 'есть' : e.data.wild ? 'дикая' : 'вывести'
      const recipes = BEE_BY_ID[id]?.parents.length ?? 0
      const altNote = alt ? `, ${recipes} рецепта (Enter — следующий)` : ''
      return { id, status, alt, label: `${id}, ${status}${altNote}` }
    })
})
</script>

<template>
  <div class="sr-only">
    <ul role="list" aria-label="Список узлов цепочки выведения">
      <li v-for="n in nodes" :key="n.id" role="listitem">
        <button
          type="button"
          :aria-label="n.label"
          :aria-current="ui.curTarget === n.id ? 'true' : undefined"
          @click="emit('select', n.id)"
        >
          {{ n.label }}
        </button>
      </li>
    </ul>
  </div>
</template>
