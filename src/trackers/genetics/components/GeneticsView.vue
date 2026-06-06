<script setup lang="ts">
import { ref } from 'vue'
import GeneCollection from './GeneCollection.vue'
import GeneCard from './GeneCard.vue'
import MachinePipeline from './MachinePipeline.vue'
import type { AlleleDef, TraitDef } from '../domain/genetics'

type Panel = 'collection' | 'pipeline'
const PANELS: { id: Panel; label: string }[] = [
  { id: 'collection', label: 'Коллекция' },
  { id: 'pipeline', label: 'Пайплайн' },
]
const panel = ref<Panel>('collection')

const card = ref<{ trait: TraitDef; allele: AlleleDef } | null>(null)
function pick(trait: TraitDef, allele: AlleleDef): void {
  card.value = { trait, allele }
}
</script>

<template>
  <div class="genetics">
    <nav class="genetics__nav" role="group" aria-label="Разделы генетики">
      <button
        v-for="p in PANELS"
        :key="p.id"
        type="button"
        class="genetics__tab"
        :class="{ on: panel === p.id }"
        :aria-pressed="panel === p.id"
        @click="panel = p.id"
      >
        {{ p.label }}
      </button>
    </nav>

    <div class="genetics__body">
      <GeneCollection v-if="panel === 'collection'" @pick="pick" />
      <MachinePipeline v-else-if="panel === 'pipeline'" />
    </div>

    <GeneCard v-if="card" :trait="card.trait" :allele="card.allele" @close="card = null" />
  </div>
</template>

<style scoped>
.genetics {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.genetics__nav {
  display: flex;
  gap: 4px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--line);
  flex: none;
}
.genetics__tab {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
}
.genetics__tab.on {
  background: var(--solid);
  color: var(--solid-ink);
}
.genetics__tab:hover:not(.on) {
  color: var(--ink);
}
.genetics__tab:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.genetics__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
