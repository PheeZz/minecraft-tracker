<script setup lang="ts">
import { reactive, ref } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { TIERS } from '../data/trees.data'
import { useTreesStore } from '../stores/useTreesStore'
import TreeGraph from './TreeGraph.vue'
import type { LayoutKey } from '../graph/layouts'

const store = useTreesStore()

// Временное UI-состояние Этапа 4 (в Этапе 5 переедет в useTreesUiStore).
const layout = ref<LayoutKey>('tiers')
const showAllEdges = ref(false)
const onlyAvail = ref(false)
const onlyFruit = ref(false)
const visibleTiers = reactive(new Set<number>(TIERS.map((t) => t.id)))
const selectedId = ref<string | null>(null)

function toggleTier(id: number) {
  if (visibleTiers.has(id)) visibleTiers.delete(id)
  else visibleTiers.add(id)
}
</script>

<template>
  <div class="trees">
    <header class="topbar">
      <div class="brand">
        <IconBase name="leaf" class="brand__mark" />
        <div>
          <h1 class="brand__title">Селекция деревьев</h1>
          <div class="brand__sub">Forestry · Вселенское рагу</div>
        </div>
      </div>
      <div class="hero">
        <div class="hero__stat">
          <span class="hero__val"
            >{{ store.hero.bred }}<small> / {{ store.hero.breedableTotal }}</small></span
          >
          <span class="hero__lbl">Выведено</span>
        </div>
        <div class="hero__stat">
          <span class="hero__val">{{ store.hero.available }}</span>
          <span class="hero__lbl">Доступно</span>
        </div>
        <div class="hero__stat">
          <span class="hero__val"
            >{{ store.hero.fruitsUnlocked }}<small> / {{ store.hero.fruitsTotal }}</small></span
          >
          <span class="hero__lbl">Плодов</span>
        </div>
        <div class="hero__pct">{{ store.hero.pct }}%</div>
      </div>
    </header>

    <div class="workspace">
      <TreeGraph
        :layout="layout"
        :show-all-edges="showAllEdges"
        :visible-tiers="visibleTiers"
        :only-avail="onlyAvail"
        :only-fruit="onlyFruit"
        :selected-id="selectedId"
        @select="selectedId = $event"
      />
      <aside class="sidebar">
        <h2 class="side-title">Выбрано</h2>
        <p class="side-sel">{{ selectedId ?? '— клик по ноде —' }}</p>

        <h2 class="side-title">Раскладка</h2>
        <select v-model="layout" class="select">
          <option value="tiers">По тирам</option>
          <option value="elk-layered">ELK ▸ LR</option>
          <option value="elk-layered-tb">ELK ▾ TB</option>
          <option value="dagre-lr">dagre ▸ LR</option>
          <option value="dagre-tb">dagre ▾ TB</option>
          <option value="breadthfirst">breadthfirst</option>
        </select>

        <h2 class="side-title">Вид</h2>
        <label class="chk"><input v-model="showAllEdges" type="checkbox" /> Все рёбра</label>
        <label class="chk"><input v-model="onlyAvail" type="checkbox" /> Только доступные</label>
        <label class="chk"
          ><input v-model="onlyFruit" type="checkbox" /> Только цепочки к плодам</label
        >

        <h2 class="side-title">Тиры</h2>
        <div class="tiers">
          <label v-for="t in TIERS" :key="t.id" class="chk">
            <input type="checkbox" :checked="visibleTiers.has(t.id)" @change="toggleTier(t.id)" />
            <span class="dot" :style="{ background: t.color }" /> T{{ t.id }}
          </label>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.trees {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 13px 22px;
  border-bottom: 1px solid var(--line);
}
.brand__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 22px;
  margin: 0;
  color: #cfe0c2;
}
.brand__sub {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--leaf-dim);
}
.hero {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}
.hero__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.hero__val {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}
.hero__val small {
  font-size: 11px;
  color: var(--muted);
}
.hero__lbl {
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.hero__pct {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 20px;
  color: var(--leaf);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  min-height: 0;
}
.sidebar {
  border-left: 1px solid var(--line);
  padding: 16px;
  overflow-y: auto;
}
.side-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13px;
  margin: 16px 0 8px;
  color: #cfe0c2;
}
.side-title:first-child {
  margin-top: 0;
}
.side-sel {
  margin: 0;
  color: var(--avail);
  font-weight: 600;
}
.select {
  width: 100%;
  background: var(--inset);
  border: 1px solid var(--edge);
  color: var(--ink);
  padding: 8px 9px;
  border-radius: 9px;
  font: inherit;
}
.chk {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 4px 0;
  cursor: pointer;
}
.tiers {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px 10px;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}
</style>
