<script setup lang="ts">
import { ref } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'
import type { LayoutKey } from '../graph/layouts'
import TreeCard from './TreeCard.vue'
import PlanPanel from './PlanPanel.vue'
import TierFilter from './TierFilter.vue'
import HintSpot from '@/shared/ui/HintSpot.vue'

const store = useTreesStore()
const ui = useTreesUiStore()
const fileInput = ref<HTMLInputElement>()

const LAYOUT_OPTIONS: { value: LayoutKey; label: string }[] = [
  { value: 'tiers', label: 'Раскладка: по тирам' },
  { value: 'elk-layered', label: 'ELK layered ▸ LR' },
  { value: 'elk-layered-tb', label: 'ELK layered ▾ TB' },
  { value: 'dagre-lr', label: 'dagre ▸ LR' },
  { value: 'dagre-tb', label: 'dagre ▾ TB' },
  { value: 'breadthfirst', label: 'breadthfirst' },
]

function exportData() {
  const blob = new Blob([JSON.stringify(store.exportData(), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'ragu-progress.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    store.importData(JSON.parse(await file.text()))
  } catch (err) {
    alert('Ошибка импорта: ' + (err as Error).message)
  }
  if (fileInput.value) fileInput.value.value = ''
}
function reset() {
  if (confirm('Сбросить весь прогресс? Останутся только стартовые саженцы.')) store.reset()
}
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
      />
    </div>

    <h2 class="sidebar__title">Выбранное дерево</h2>
    <TreeCard />

    <h2 class="sidebar__title">
      Планирование
      <HintSpot
        text="«Только доступные» прячет ещё не открытые деревья. «Только цепочки к плодам» оставляет ветки, ведущие к плодам."
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
      <select v-model="ui.layout" class="select" data-tour="trees-layout">
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
      <button class="btn" type="button" title="Сбросить весь прогресс" @click="reset">
        <IconBase name="reset" />Сброс
      </button>
    </div>

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
</style>
