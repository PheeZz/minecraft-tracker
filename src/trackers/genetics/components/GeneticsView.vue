<script setup lang="ts">
import { ref } from 'vue'
import GeneticsDashboard from './GeneticsDashboard.vue'
import GeneCollection from './GeneCollection.vue'
import GeneCard from './GeneCard.vue'
import GenomeBuilder from './GenomeBuilder.vue'
import MachinePipeline from './MachinePipeline.vue'
import type { AlleleDef, TraitDef } from '../domain/genetics'
import { useGenesStore } from '../stores/useGenesStore'
import { useGeneTargetsStore } from '../stores/useGeneTargetsStore'
import { downloadJson, parseJsonFileText } from '@/shared/persistence/importExport'

type Panel = 'dashboard' | 'collection' | 'builder' | 'pipeline'
const PANELS: { id: Panel; label: string }[] = [
  { id: 'dashboard', label: 'Обзор' },
  { id: 'collection', label: 'Коллекция' },
  { id: 'builder', label: 'Сборка' },
  { id: 'pipeline', label: 'Пайплайн' },
]
const panel = ref<Panel>('dashboard')

const card = ref<{ trait: TraitDef; allele: AlleleDef } | null>(null)
function pick(trait: TraitDef, allele: AlleleDef): void {
  card.value = { trait, allele }
}

// ── Экспорт/импорт прогресса генетики (собранные гены + цели) ──
const genes = useGenesStore()
const targets = useGeneTargetsStore()
const fileInput = ref<HTMLInputElement>()
const msg = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

function flash(kind: 'ok' | 'err', text: string): void {
  msg.value = { kind, text }
  setTimeout(() => (msg.value = null), 4000)
}

function onExport(): void {
  downloadJson(
    { v: 1, genes: genes.exportData().genes, targets: targets.exportData() },
    'genetics-progress.json',
  )
}
async function onImport(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const r = parseJsonFileText(await file.text())
  if (r.ok) {
    const data = r.data as { genes?: unknown; targets?: unknown }
    genes.importData({ v: 1, genes: Array.isArray(data.genes) ? (data.genes as string[]) : [] })
    targets.importData(data.targets)
    flash('ok', 'Импортировано')
  } else {
    flash('err', `Ошибка импорта: ${r.error}`)
  }
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="genetics">
    <nav class="genetics__nav" aria-label="Разделы генетики">
      <div class="genetics__tabs" role="group">
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
      </div>
      <div class="genetics__data">
        <button type="button" class="genetics__databtn" title="Экспорт прогресса" @click="onExport">
          Экспорт
        </button>
        <button
          type="button"
          class="genetics__databtn"
          title="Импорт прогресса из файла"
          @click="fileInput?.click()"
        >
          Импорт
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          hidden
          @change="onImport"
        />
      </div>
    </nav>

    <p v-if="msg" class="genetics__msg" :class="`genetics__msg--${msg.kind}`" role="status">
      {{ msg.text }}
    </p>

    <div class="genetics__body">
      <GeneticsDashboard v-if="panel === 'dashboard'" @goto="panel = $event" />
      <GeneCollection v-else-if="panel === 'collection'" @pick="pick" />
      <GenomeBuilder v-else-if="panel === 'builder'" />
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
  align-items: center;
  gap: 12px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--line);
  flex: none;
}
.genetics__tabs {
  display: flex;
  gap: 4px;
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
.genetics__tab:focus-visible,
.genetics__databtn:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.genetics__data {
  margin-left: auto;
  display: flex;
  gap: 6px;
}
.genetics__databtn {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink2);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
.genetics__databtn:hover {
  border-color: var(--honey-dk);
  color: var(--ink);
}
.genetics__msg {
  margin: 8px 18px 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid;
}
.genetics__msg--ok {
  color: var(--src-f);
  background: var(--src-f-soft);
  border-color: var(--src-f);
}
.genetics__msg--err {
  color: #e07070;
  background: rgba(224, 112, 112, 0.1);
  border-color: rgba(224, 112, 112, 0.3);
}
.genetics__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
