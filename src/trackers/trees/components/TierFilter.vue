<script setup lang="ts">
import { computed } from 'vue'
import { TIERS, TREES } from '../data/trees.data'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'

const store = useTreesStore()
const ui = useTreesUiStore()

const counts = computed(() => {
  const map = new Map<number, { got: number; total: number }>()
  for (const t of TIERS) {
    const trees = TREES.filter((x) => x.tier === t.id)
    const got = trees.filter((x) => store.progress[x.id] === 2).length
    map.set(t.id, { got, total: trees.length })
  }
  return map
})
</script>

<template>
  <div class="tier-filter">
    <label v-for="t in TIERS" :key="t.id" class="tier-filter__item">
      <input type="checkbox" :checked="ui.visibleTiers.has(t.id)" @change="ui.toggleTier(t.id)" />
      <span class="tier-filter__dot" :class="`t--${t.id}`" />
      {{ t.id === 0 ? 'T0 · из мира' : 'T' + t.id }}
      <span
        class="tier-filter__count"
        :class="{ 'is-complete': counts.get(t.id)!.got === counts.get(t.id)!.total }"
      >
        <template v-if="t.id === 0">{{ counts.get(t.id)!.total }}</template>
        <template v-else>{{ counts.get(t.id)!.got }}/{{ counts.get(t.id)!.total }}</template>
      </span>
    </label>
  </div>
</template>

<style scoped>
.tier-filter {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px 10px;
}
.tier-filter__item {
  font-size: 11.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--muted);
}
.tier-filter__dot {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  flex: none;
  background: var(--tc);
}
.tier-filter__count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  margin-left: auto;
}
.tier-filter__count.is-complete {
  color: var(--ok);
}
</style>
