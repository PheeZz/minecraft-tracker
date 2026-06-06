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
  font-size: 19px;
  letter-spacing: -0.01em;
}
.gcol__count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--honey-dk);
  padding: 3px 9px;
  border-radius: 20px;
  background: rgba(95, 224, 234, 0.1);
  border: 1px solid rgba(95, 224, 234, 0.22);
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
  font-weight: 700;
  font-size: 13.5px;
  color: var(--ink);
}
.grow__desc {
  font-size: 11px;
  color: var(--muted);
  margin-top: 3px;
  line-height: 1.4;
}
.grow__bar {
  height: 6px;
  border-radius: 4px;
  background: rgba(6, 13, 18, 0.7);
  border: 1px solid var(--cardln);
  overflow: hidden;
  margin-top: 7px;
}
.grow__bar i {
  display: block;
  height: 100%;
  background: var(--bar-grad);
  box-shadow: 0 0 8px var(--glow-green);
  transition: width 0.4s ease;
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
  font-weight: 500;
  padding: 5px 9px;
  border-radius: 7px 0 0 7px;
  border: 1px solid var(--cardln);
  border-right: 0;
  background: linear-gradient(180deg, var(--card2), var(--card));
  color: var(--ink2);
  cursor: pointer;
  transition:
    border-color 0.14s ease,
    color 0.14s ease,
    box-shadow 0.14s ease,
    background 0.14s ease;
}
.cell:hover:not(.on) {
  border-color: var(--honey-dk);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ring-cyan);
}
.cell.on {
  background: linear-gradient(180deg, rgba(70, 215, 155, 0.22), var(--src-f-soft));
  border-color: var(--src-f);
  color: var(--ink);
  font-weight: 700;
  box-shadow:
    inset 0 0 0 1px rgba(70, 215, 155, 0.4),
    0 0 12px var(--glow-green);
}
.cell.add {
  border-style: dashed;
  border-right: 0;
}
.cell__star {
  color: var(--alt);
  margin-left: 4px;
  text-shadow: 0 0 8px var(--glow-violet);
}
.cellinfo {
  font: inherit;
  font-size: 10px;
  padding: 0 7px;
  border-radius: 0 7px 7px 0;
  border: 1px solid var(--cardln);
  background: rgba(6, 13, 18, 0.6);
  color: var(--muted);
  cursor: pointer;
  transition:
    color 0.14s ease,
    border-color 0.14s ease;
}
.cellinfo:hover {
  color: var(--honey-dk);
  border-color: var(--honey-dk);
}
.cell:focus-visible,
.cellinfo:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
  position: relative;
  z-index: 1;
}
.gcol__hint {
  margin-top: 14px;
  font-size: 11.5px;
  color: var(--muted);
}
</style>
