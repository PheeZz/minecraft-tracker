<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storage } from '@/shared/persistence/storage'
import GeneticsDashboard from './GeneticsDashboard.vue'
import GeneCollection from './GeneCollection.vue'
import GeneCard from './GeneCard.vue'
import GenomeBuilder from './GenomeBuilder.vue'
import MachinePipeline from './MachinePipeline.vue'
import type { AlleleDef, TraitDef } from '../domain/genetics'
import { useGenesStore } from '../stores/useGenesStore'
import { useGeneTargetsStore } from '../stores/useGeneTargetsStore'
import { downloadJson, parseJsonFileText } from '@/shared/persistence/importExport'
import { useTour } from '@/shared/ui/useTour'
import { useOnboardingSeen } from '@/shared/composables/useOnboardingSeen'
import { buildGeneticsTour } from '../onboarding/geneticsTour'

type Panel = 'dashboard' | 'collection' | 'builder' | 'pipeline'
const PANELS: { id: Panel; label: string }[] = [
  { id: 'dashboard', label: 'Обзор' },
  { id: 'collection', label: 'Коллекция' },
  { id: 'builder', label: 'Сборка' },
  { id: 'pipeline', label: 'Пайплайн' },
]
// активная вкладка сохраняется — при возврате открывается она же
const PANEL_KEY = 'genetics.panel'
const savedPanel = storage.get<string>(PANEL_KEY, 'dashboard')
const panel = ref<Panel>(
  PANELS.some((p) => p.id === savedPanel) ? (savedPanel as Panel) : 'dashboard',
)
watch(panel, (p) => storage.set(PANEL_KEY, p))

const card = ref<{ trait: TraitDef; allele: AlleleDef } | null>(null)
function pick(trait: TraitDef, allele: AlleleDef): void {
  card.value = { trait, allele }
}

// ── Обучение (как в пчёлах/деревьях): авто-старт при первом визите ──
const onboarding = useOnboardingSeen('genetics')
const tour = useTour(() => buildGeneticsTour({ setPanel: (p) => (panel.value = p) }), {
  onDone: () => onboarding.markSeen(),
})
let autoStartTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (!onboarding.seen()) autoStartTimer = setTimeout(() => void tour.start(), 500)
})
onBeforeUnmount(() => {
  clearTimeout(autoStartTimer)
  tour.destroy()
})

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
    <nav class="genetics__nav" data-tour="genetics-nav" aria-label="Разделы генетики">
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
      <div class="genetics__data" data-tour="genetics-data">
        <button
          type="button"
          class="genetics__databtn"
          title="Запустить обучение по разделу"
          @click="tour.start()"
        >
          Обзор
        </button>
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

    <div class="genetics__body" data-tour="genetics-body">
      <Transition name="gpanel" mode="out-in">
        <GeneticsDashboard v-if="panel === 'dashboard'" key="dashboard" @goto="panel = $event" />
        <GeneCollection v-else-if="panel === 'collection'" key="collection" @pick="pick" />
        <GenomeBuilder v-else-if="panel === 'builder'" key="builder" />
        <MachinePipeline v-else-if="panel === 'pipeline'" key="pipeline" />
      </Transition>
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
  padding: 9px 18px;
  border-bottom: 1px solid var(--line);
  flex: none;
}
.genetics__tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: rgba(6, 13, 18, 0.55);
  border: 1px solid var(--cardln);
  border-radius: 11px;
}
.genetics__tab {
  position: relative;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;
}
.genetics__tab.on {
  background: linear-gradient(180deg, #38d4de, var(--solid));
  color: var(--solid-ink);
  box-shadow:
    0 0 0 1px rgba(95, 224, 234, 0.5),
    0 4px 14px var(--glow-cyan);
}
.genetics__tab:hover:not(.on) {
  color: var(--ink);
  background: rgba(95, 224, 234, 0.08);
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
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 6px 11px;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}
.genetics__databtn:hover {
  border-color: var(--honey-dk);
  color: var(--ink);
  box-shadow: 0 0 0 1px var(--ring-cyan);
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

/* Переход между внутренними вкладками раздела (в духе inv-перехода пчёл).
   Длительности гасятся глобальным prefers-reduced-motion фолбэком. */
.gpanel-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.gpanel-leave-active {
  transition: opacity 0.12s ease;
}
.gpanel-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.gpanel-leave-to {
  opacity: 0;
}
</style>
