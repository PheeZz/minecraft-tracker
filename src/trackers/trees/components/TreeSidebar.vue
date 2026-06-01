<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'
import type { LayoutKey } from '../graph/layouts'
import TreeCard from './TreeCard.vue'
import PlanPanel from './PlanPanel.vue'
import TierFilter from './TierFilter.vue'
import HintSpot from '@/shared/ui/HintSpot.vue'
import { downloadJson, parseJsonFileText } from '@/shared/persistence/importExport'

const store = useTreesStore()
const ui = useTreesUiStore()
const fileInput = ref<HTMLInputElement>()
const confirmReset = ref(false)
const importError = ref<string | null>(null)
const importOk = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | null = null

const LAYOUT_OPTIONS: { value: LayoutKey; label: string }[] = [
  { value: 'tiers', label: 'Раскладка: по тирам' },
  { value: 'dagre-lr', label: 'dagre ▸ LR' },
  { value: 'dagre-tb', label: 'dagre ▾ TB' },
  { value: 'breadthfirst', label: 'breadthfirst' },
]

function exportData() {
  downloadJson(store.exportData(), 'ragu-progress.json')
}
async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const r = parseJsonFileText(await file.text())
  if (r.ok) {
    store.importData(r.data)
    importOk.value = true
    setTimeout(() => (importOk.value = false), 4000)
  } else {
    importError.value = r.error
    setTimeout(() => (importError.value = null), 4000)
  }
  if (fileInput.value) fileInput.value.value = ''
}
function reset() {
  if (!confirmReset.value) {
    confirmReset.value = true
    resetTimer = setTimeout(() => (confirmReset.value = false), 3000)
    return
  }
  if (resetTimer) clearTimeout(resetTimer)
  confirmReset.value = false
  store.reset()
}

onUnmounted(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <aside class="sidebar" data-tour="trees-sidebar">
    <div class="search" data-tour="trees-search">
      <IconBase name="search" />
      <input
        v-model="ui.searchQuery"
        class="search__input"
        type="search"
        placeholder="Поиск дерева или плода…"
        aria-label="Поиск дерева или плода"
      />
    </div>

    <h2 class="sidebar__title">Выбранное дерево</h2>
    <TreeCard />

    <h2 class="sidebar__title">
      Планирование
      <HintSpot
        text="«Только доступные» прячет ещё не открытые деревья. «Только цепочки к плодам» оставляет ветки, ведущие к плодам. «Только плодовитые» — лишь деревья, дающие плод."
      />
    </h2>
    <div class="row">
      <button
        class="btn btn--wide"
        :class="{ 'btn--on': ui.onlyAvail }"
        type="button"
        @click="ui.onlyAvail = !ui.onlyAvail"
      >
        <IconBase name="bolt" />Только доступные к выведению
      </button>
    </div>
    <div class="row">
      <button
        class="btn btn--wide"
        :class="{ 'btn--on': ui.onlyFruit }"
        type="button"
        @click="ui.onlyFruit = !ui.onlyFruit"
      >
        <IconBase name="fruit" />Только цепочки к плодам
      </button>
    </div>
    <div class="row">
      <button
        class="btn btn--wide"
        :class="{ 'btn--on': ui.onlyFruitful }"
        type="button"
        @click="ui.onlyFruitful = !ui.onlyFruitful"
      >
        <IconBase name="fruit" />Только плодовитые деревья
      </button>
    </div>
    <div class="row">
      <button
        class="btn btn--wide"
        :class="{ 'btn--on': ui.planOpen }"
        type="button"
        @click="ui.planOpen = !ui.planOpen"
      >
        <IconBase name="list" />План выведения всех плодов
      </button>
    </div>
    <PlanPanel v-if="ui.planOpen" />

    <h2 class="sidebar__title">
      Инструменты
      <HintSpot text="Отмена/повтор действий, выбор раскладки, экспорт/импорт прогресса в JSON." />
    </h2>
    <div class="row">
      <button class="btn" type="button" :disabled="!store.canUndo" @click="store.undo()">
        <IconBase name="undo" />Отменить
      </button>
      <button class="btn" type="button" :disabled="!store.canRedo" @click="store.redo()">
        <IconBase name="redo" />Повторить
      </button>
    </div>
    <div class="row">
      <select
        v-model="ui.layout"
        class="select"
        data-tour="trees-layout"
        aria-label="Раскладка графа"
      >
        <option v-for="o in LAYOUT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
    <div class="row">
      <button
        class="btn btn--wide"
        :class="{ 'btn--amber': ui.bypass }"
        type="button"
        title="Когда включено — отметка «получено» не списывает ингредиенты"
        @click="ui.bypass = !ui.bypass"
      >
        <IconBase name="bolt" />Без списания
      </button>
    </div>
    <div class="row">
      <button class="btn" type="button" @click="exportData">
        <IconBase name="download" />Экспорт
      </button>
      <button class="btn" type="button" @click="fileInput?.click()">
        <IconBase name="upload" />Импорт
      </button>
      <input
        ref="fileInput"
        class="file-input"
        type="file"
        accept="application/json"
        @change="onImport"
      />
      <button
        class="btn"
        :class="{ 'btn--amber': confirmReset }"
        type="button"
        title="Сбросить весь прогресс"
        @click="reset"
      >
        <IconBase name="reset" />{{ confirmReset ? 'Точно?' : 'Сброс' }}
      </button>
    </div>
    <p v-if="importError" class="hint" role="alert">Ошибка импорта: {{ importError }}</p>
    <p v-if="importOk" class="hint hint--ok" role="status">Импортировано</p>

    <h2 class="sidebar__title">Фильтр по тирам</h2>
    <div data-tour="trees-tiers"><TierFilter /></div>

    <h2 class="sidebar__title">Легенда</h2>
    <div class="legend" data-tour="trees-legend">
      <div class="legend__item">
        <span class="legend__swatch legend__swatch--tier" />Рамка, бейдж и точка = цвет тира
      </div>
      <div class="legend__item">
        <span class="legend__swatch legend__swatch--avail" />Доступно к выведению
      </div>
      <div class="legend__item">
        <span class="legend__swatch legend__swatch--bred" />Получено / выведено
        <IconBase name="check" class="legend__check" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  border-left: 1px solid var(--line);
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(180deg, rgba(143, 209, 79, 0.03), transparent 30%);
}
.sidebar__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.2px;
  margin: 18px 0 9px;
  color: #cfe0c2;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sidebar__title:first-of-type {
  margin-top: 2px;
}
.sidebar__title::before {
  content: '';
  width: 14px;
  height: 1.5px;
  background: var(--leaf-dim);
}
.row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--edge);
  border-radius: 10px;
  padding: 0 11px;
  margin-bottom: 12px;
}
.search :deep(.icon) {
  color: var(--leaf-dim);
  font-size: 16px;
}
.search__input {
  flex: 1;
  background: none;
  border: 0;
  color: var(--ink);
  font: inherit;
  padding: 9px 0;
  outline: none;
}
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 12.5px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--edge);
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.15s;
}
.btn :deep(.icon) {
  font-size: 15px;
  color: var(--leaf);
}
.btn:hover {
  background: rgba(143, 209, 79, 0.12);
  border-color: var(--leaf-dim);
}
.btn--on {
  background: rgba(143, 209, 79, 0.16);
  border-color: var(--leaf-dim);
  color: var(--leaf);
}
.btn--amber {
  background: rgba(230, 184, 100, 0.18);
  border-color: var(--amber);
  color: var(--amber);
}
.btn--wide {
  flex: 1 1 100%;
  text-align: left;
  justify-content: flex-start;
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.btn:disabled:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--edge);
}
.select {
  flex: 1;
  background: var(--inset);
  border: 1px solid var(--edge);
  color: var(--ink);
  padding: 8px 9px;
  border-radius: 9px;
  font: inherit;
  cursor: pointer;
}
.file-input {
  display: none;
}
.legend {
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 13px;
}
.legend__item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.legend__swatch {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  flex: none;
  background: #16221b;
}
.legend__swatch--tier {
  border: 2.5px solid var(--t6);
}
.legend__swatch--avail {
  background: #2c3a30;
  border: 2px dashed var(--avail);
}
.legend__swatch--bred {
  background: #2c3a30;
  border: 2.5px solid var(--leaf);
  box-shadow: 0 0 10px rgba(143, 209, 79, 0.4);
}
.legend__check {
  color: var(--leaf);
}
.hint {
  font-size: 12px;
  color: #e07070;
  margin: 8px 0 0;
  padding: 8px 12px;
  background: rgba(224, 112, 112, 0.1);
  border: 1px solid rgba(224, 112, 112, 0.3);
  border-radius: 8px;
}
.hint--ok {
  color: var(--leaf);
  background: rgba(143, 209, 79, 0.1);
  border-color: rgba(143, 209, 79, 0.3);
}
</style>
