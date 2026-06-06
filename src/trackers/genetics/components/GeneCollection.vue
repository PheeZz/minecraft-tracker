<script setup lang="ts">
import { computed } from 'vue'
import { TRAITS } from '../data/genetics.data'
import {
  traitCompletion,
  collectionTotals,
  geneKey,
  type AlleleDef,
  type TraitDef,
} from '../domain/genetics'
import { useGenesStore } from '../stores/useGenesStore'
import EnTip from './EnTip.vue'

const emit = defineEmits<{ pick: [trait: TraitDef, allele: AlleleDef] }>()
const genes = useGenesStore()

// Признаки с непустой шкалой (species в Фазе 1 без значений — скрыт).
const rows = computed(() => TRAITS.filter((t) => t.alleles.length > 0))
const totals = computed(() => collectionTotals(TRAITS, genes.genes))
</script>

<template>
  <section class="gcol">
    <header class="gcol__head">
      <h2 class="gcol__title">Коллекция генов</h2>
      <span class="gcol__count">собрано {{ totals.have }} / {{ totals.total }}</span>
    </header>

    <div class="gcol__rows">
      <div v-for="t in rows" :key="t.key" class="grow">
        <div class="grow__name">
          <EnTip :en="t.en">{{ t.ru }}</EnTip>
          <div class="grow__desc">{{ t.desc }}</div>
          <div class="grow__bar">
            <i :style="{ width: traitCompletion(t, genes.genes).pct + '%' }" />
          </div>
        </div>
        <div class="grow__cells">
          <span v-for="a in t.alleles" :key="geneKey(t.key, a.en)" class="cellwrap">
            <button
              type="button"
              class="cell"
              :class="{ on: genes.has(t.key, a.en), add: !!a.mod }"
              :title="a.en"
              :aria-pressed="genes.has(t.key, a.en)"
              :aria-label="`${a.ru}${a.mod ? ', ' + a.mod : ''} (${a.en})`"
              @click="genes.toggle(t.key, a.en)"
              @click.right.prevent="emit('pick', t, a)"
            >
              {{ a.ru }}<span v-if="a.mod" class="cell__star" :title="a.mod">★</span>
            </button>
            <button
              type="button"
              class="cellinfo"
              :aria-label="`Справка: ${a.ru}`"
              @click="emit('pick', t, a)"
            >
              ⓘ
            </button>
          </span>
        </div>
      </div>
    </div>
    <p class="gcol__hint">Клик — отметить собранным · ⓘ — открыть справку</p>
  </section>
</template>

<style scoped>
.gcol {
  padding: 14px 18px;
}
.gcol__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}
.gcol__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
}
.gcol__count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--honey-dk);
}
.gcol__rows {
  display: flex;
  flex-direction: column;
}
.grow {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 12px;
  align-items: start;
  padding: 10px 0;
  border-top: 1px solid var(--line);
}
.grow__name {
  font-weight: 600;
  font-size: 13px;
}
.grow__desc {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
  line-height: 1.35;
}
.grow__bar {
  height: 5px;
  border-radius: 3px;
  background: var(--bg2);
  overflow: hidden;
  margin-top: 5px;
}
.grow__bar i {
  display: block;
  height: 100%;
  background: var(--src-f);
}
.grow__cells {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.cellwrap {
  display: inline-flex;
  align-items: stretch;
}
.cell {
  font: inherit;
  font-size: 11.5px;
  padding: 4px 8px;
  border-radius: 6px 0 0 6px;
  border: 1px solid var(--cardln);
  border-right: 0;
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
}
.cell.on {
  background: var(--src-f-soft);
  border-color: var(--src-f);
  color: var(--ink);
}
.cell.add {
  border-style: dashed;
  border-right: 0;
}
.cell__star {
  color: var(--alt);
  margin-left: 4px;
}
.cellinfo {
  font: inherit;
  font-size: 10px;
  padding: 0 6px;
  border-radius: 0 6px 6px 0;
  border: 1px solid var(--cardln);
  background: var(--bg2);
  color: var(--muted);
  cursor: pointer;
}
.cellinfo:hover {
  color: var(--honey-dk);
}
.cell:focus-visible,
.cellinfo:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
  position: relative;
  z-index: 1;
}
.gcol__hint {
  margin-top: 12px;
  font-size: 11.5px;
  color: var(--dim);
}
</style>
