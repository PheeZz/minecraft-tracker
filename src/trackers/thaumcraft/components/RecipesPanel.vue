<script setup lang="ts">
import { computed, ref } from 'vue'
import { RECIPES } from '../data/recipes.data'
import type { Recipe } from '../domain/types'
import {
  filterRecipes,
  recipeMods,
  recipeTypeGroup,
  GROUP_RU,
  type RecipeGroup,
} from '../domain/recipes'
import { ASPECT_BY_TAG } from '../domain/aspects'
import { RESEARCH_BY_KEY } from '../domain/research'
import AspectHex from './AspectHex.vue'
import ItemIcon from './ItemIcon.vue'

const query = ref('')
const group = ref<RecipeGroup | 'all'>('all')
const mod = ref<string | 'all'>('all')

const GROUP_TABS: { id: RecipeGroup | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'arcane', label: 'Аркан' },
  { id: 'infusion', label: 'Инфузия' },
  { id: 'crucible', label: 'Тигель' },
]
const mods = recipeMods()

const filtered = computed(() =>
  filterRecipes({ query: query.value, group: group.value, mod: mod.value }),
)

// порционная отрисовка: не вешаем сразу 402 карточки
const STEP = 60
const shown = ref(STEP)
const visible = computed(() => filtered.value.slice(0, shown.value))
const remaining = computed(() => Math.max(0, filtered.value.length - shown.value))
const showMore = (): void => {
  shown.value += STEP
}
// сброс лимита при смене фильтра
const resetShown = (): void => {
  shown.value = STEP
}
const selectGroup = (g: RecipeGroup | 'all'): void => {
  group.value = g
  resetShown()
}

const groupLabel = (r: Recipe): string => GROUP_RU[recipeTypeGroup(r.type)]
const researchName = (r: Recipe): string | null =>
  r.research ? (RESEARCH_BY_KEY.get(r.research)?.name ?? r.research) : null

const costEntries = (r: Recipe): [string, number][] => (r.aspects ? Object.entries(r.aspects) : [])

// ячейки сетки 3×3 для аркан-рецептов: символ → ItemRef (пробел = пусто)
const gridCells = (r: Recipe): { sym: string; ru: string; en: string; icon?: string }[] => {
  const cells: { sym: string; ru: string; en: string; icon?: string }[] = []
  for (const row of r.shape ?? []) {
    for (const sym of row) {
      const ref = sym === ' ' ? undefined : r.key?.[sym]
      cells.push({ sym, ru: ref?.ru ?? '', en: ref?.en ?? '', icon: ref?.icon })
    }
  }
  return cells
}

// Раскладка инфузии как на Рунической матрице: компоненты по кругу вокруг центра.
const RING_R = 76
const infComps = (
  r: Recipe,
): { c: NonNullable<Recipe['components']>[number]; x: number; y: number }[] => {
  const comps = r.components ?? []
  const n = comps.length || 1
  return comps.map((c, i) => {
    const a = ((-90 + (360 / n) * i) * Math.PI) / 180
    return { c, x: Math.round(RING_R * Math.cos(a)), y: Math.round(RING_R * Math.sin(a)) }
  })
}
</script>

<template>
  <section class="rp">
    <header class="rp__top">
      <input
        v-model="query"
        class="rp__search"
        placeholder="Поиск по названию…"
        aria-label="Поиск рецепта"
        @input="resetShown"
      />
      <div class="rp__tabs" role="group" aria-label="Тип рецепта">
        <button
          v-for="t in GROUP_TABS"
          :key="t.id"
          type="button"
          class="rp__tab"
          :class="{ on: group === t.id }"
          :aria-pressed="group === t.id"
          @click="selectGroup(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
      <select v-model="mod" class="rp__mod" aria-label="Мод" @change="resetShown">
        <option value="all">Все моды</option>
        <option v-for="m in mods" :key="m" :value="m">{{ m }}</option>
      </select>
      <span class="rp__count">{{ filtered.length }} из {{ RECIPES.length }}</span>
    </header>

    <div v-if="visible.length" class="rp__grid">
      <article v-for="(r, i) in visible" :key="i" class="rcard">
        <div class="rcard__head">
          <h3 class="rcard__name" :title="r.output.en">
            <ItemIcon :item="r.output" :size="20" />{{ r.output.ru }}
          </h3>
          <div class="rcard__badges">
            <span class="badge badge--type" :data-g="recipeTypeGroup(r.type)">{{
              groupLabel(r)
            }}</span>
            <span class="badge badge--mod">{{ r.mod }}</span>
          </div>
        </div>
        <div v-if="researchName(r)" class="rcard__res">Свиток: {{ researchName(r) }}</div>

        <!-- Аркан с сеткой -->
        <div v-if="r.shape && r.shape.length" class="craft">
          <div class="craft__grid">
            <span
              v-for="(c, ci) in gridCells(r)"
              :key="ci"
              class="cell"
              :class="{ empty: !c.ru }"
              :title="c.ru"
            >
              <ItemIcon :item="c" :size="20" />
              <span class="cell__t">{{ c.ru }}</span>
            </span>
          </div>
        </div>
        <!-- Аркан без формы / shapeless -->
        <ul v-else-if="r.inputs && r.inputs.length" class="ilist">
          <li v-for="(it, ii) in r.inputs" :key="ii" :title="it.en">
            <ItemIcon :item="it" /><span>{{ it.ru }}</span>
          </li>
        </ul>
        <!-- Тигель: вход → выход -->
        <div v-else-if="r.input" class="cruc">
          <span class="cruc__in" :title="r.input.en">
            <ItemIcon :item="r.input" />{{ r.input.ru }}
          </span>
          <span class="cruc__arr" aria-hidden="true">→</span>
          <span class="cruc__out"> <ItemIcon :item="r.output" />{{ r.output.ru }} </span>
        </div>

        <!-- Инфузия — Руническая матрица: центр + компоненты по кругу -->
        <div v-if="r.central" class="matrix">
          <div class="matrix__field">
            <span class="matrix__ring" aria-hidden="true"></span>
            <span class="matrix__c matrix__center" :title="r.central.en">
              <ItemIcon :item="r.central" :size="30" />
              <span class="matrix__nm">{{ r.central.ru }}</span>
            </span>
            <span
              v-for="(p, ci) in infComps(r)"
              :key="ci"
              class="matrix__c"
              :style="{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }"
              :title="p.c.en"
            >
              <ItemIcon :item="p.c" :size="26" />
            </span>
          </div>
          <div class="matrix__meta">
            <span class="matrix__lab">Руническая матрица</span>
            <span v-if="r.instability != null" class="matrix__inst"
              >нестабильность: {{ r.instability }}</span
            >
          </div>
        </div>

        <!-- Стоимость аспектов -->
        <div class="rcard__cost">
          <template v-if="costEntries(r).length">
            <span v-for="[tag, amt] in costEntries(r)" :key="tag" class="chip">
              <AspectHex :tag="tag" :size="20" />
              <span class="chip__t">{{ ASPECT_BY_TAG.get(tag)?.label ?? tag }} {{ amt }}</span>
            </span>
          </template>
          <span v-else class="rcard__nocost">стоимость считается</span>
        </div>
      </article>
    </div>
    <p v-else class="rp__empty">Ничего не найдено.</p>

    <div v-if="remaining" class="rp__more">
      <button type="button" class="rp__morebtn" @click="showMore">
        Показать ещё {{ Math.min(STEP, remaining) }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.rp {
  padding: 16px 18px;
}
.rp__top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.rp__search {
  flex: 1;
  min-width: 180px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 8px 11px;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
}
.rp__tabs {
  display: inline-flex;
  gap: 2px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 3px;
}
.rp__tab {
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.rp__tab:hover:not(.on) {
  color: var(--ink);
  background: rgba(160, 107, 255, 0.08);
}
.rp__tab.on {
  background: linear-gradient(180deg, #a06bff, var(--solid));
  color: var(--solid-ink);
}
.rp__tab:focus-visible,
.rp__morebtn:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.rp__mod {
  font: inherit;
  font-size: 12.5px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 7px 10px;
  color: var(--ink);
}
.rp__count {
  font-size: 12px;
  color: var(--muted);
  margin-left: auto;
}
.rp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}
.rcard {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rcard__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.rcard__name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14.5px;
  margin: 0;
  line-height: 1.25;
  display: flex;
  align-items: center;
  gap: 6px;
  /* занимаем доступную ширину и сжимаемся, чтобы длинный заголовок переносился,
     а не выпихивал бейджи за край карточки */
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.rcard__badges {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-end;
  flex: none;
}
.badge {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 7px;
  white-space: nowrap;
}
.badge--type {
  color: var(--solid-ink);
  background: var(--solid);
}
.badge--type[data-g='infusion'] {
  background: var(--rust);
}
.badge--type[data-g='crucible'] {
  background: var(--honey-dk);
  color: #1a1206;
}
.badge--mod {
  color: var(--alt);
  border: 1px solid var(--solid);
}
.rcard__res {
  font-size: 11.5px;
  color: var(--honey-dk);
}
.craft__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 4px;
}
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
  min-height: 42px;
  border-radius: 5px;
  background: var(--card);
  border: 1px solid var(--cardln);
  padding: 2px;
}
.cell.empty {
  background: transparent;
  border-style: dashed;
  opacity: 0.4;
}
.cell__t {
  font-size: 9.5px;
  line-height: 1.15;
  color: var(--ink2);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}
.ilist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.ilist li {
  font-size: 11.5px;
  color: var(--ink2);
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 6px;
  padding: 3px 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.cruc {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12.5px;
}
.cruc__in,
.cruc__out {
  color: var(--ink2);
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 6px;
  padding: 3px 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.cruc__arr {
  color: var(--honey-dk);
  font-weight: 700;
}
.matrix {
  border-top: 1px dashed var(--cardln);
  padding-top: 10px;
}
.matrix__field {
  position: relative;
  width: 100%;
  height: 180px;
}
.matrix__ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 152px;
  height: 152px;
  transform: translate(-50%, -50%);
  border: 1px dashed rgba(160, 107, 255, 0.32);
  border-radius: 50%;
  box-shadow: 0 0 24px rgba(160, 107, 255, 0.12) inset;
}
.matrix__c {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.matrix__center {
  left: 50%;
  top: 50%;
  z-index: 2;
}
.matrix__nm {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--ink);
  text-align: center;
  max-width: 100px;
  line-height: 1.15;
}
.matrix__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
}
.matrix__lab {
  font-family: var(--font-mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--honey-dk);
}
.matrix__inst {
  font-size: 11px;
  color: var(--rust);
  font-weight: 600;
}
.rcard__cost {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: auto;
  padding-top: 4px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 20px;
  padding: 2px 9px 2px 3px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink2);
}
.rcard__nocost {
  font-size: 11px;
  color: var(--muted);
  font-style: italic;
}
.rp__empty {
  color: var(--muted);
  font-size: 13px;
  padding: 40px 0;
  text-align: center;
}
.rp__more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.rp__morebtn {
  font: inherit;
  font-weight: 700;
  font-size: 12.5px;
  color: var(--alt);
  background: var(--bg2);
  border: 1px solid var(--solid);
  border-radius: 9px;
  padding: 8px 18px;
  cursor: pointer;
}
.rp__morebtn:hover {
  background: rgba(160, 107, 255, 0.12);
}
</style>
