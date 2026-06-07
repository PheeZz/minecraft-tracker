<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RESEARCH } from '../data/research.data'
import type { Research } from '../domain/types'
import {
  RESEARCH_BY_KEY,
  researchCategories,
  researchState,
  searchResearch,
  catName,
} from '../domain/research'
import { ASPECT_BY_TAG } from '../domain/aspects'
import { useResearchStore } from '../stores/useResearchStore'
import { storage } from '@/shared/persistence/storage'
import AspectHex from './AspectHex.vue'
import ScrollBoard from './ScrollBoard.vue'
import ResearchGraph from './ResearchGraph.vue'

const store = useResearchStore()
const search = ref('')

// режим отображения свитков: список / граф предпосылок цели (сохраняется)
type ViewMode = 'list' | 'graph'
const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'list', label: 'Список' },
  { id: 'graph', label: 'Граф' },
]
const VIEW_KEY = 'thaumcraft.scrolls.view'
const view = ref<ViewMode>(storage.get<string>(VIEW_KEY, 'list') === 'graph' ? 'graph' : 'list')
watch(view, (v) => storage.set(VIEW_KEY, v))

const grouped = computed(() => {
  const filtered = searchResearch(search.value)
  const byCat = new Map<string, Research[]>()
  for (const r of filtered) {
    const arr = byCat.get(r.category) ?? byCat.set(r.category, []).get(r.category)!
    arr.push(r)
  }
  return researchCategories()
    .filter((c) => byCat.has(c))
    .map((c) => ({ cat: c, items: byCat.get(c)! }))
})

const selectedKey = ref<string | null>(
  RESEARCH.find((r) => Object.keys(r.aspects).length > 0)?.key ?? RESEARCH[0]?.key ?? null,
)
const selected = computed(() => (selectedKey.value ? RESEARCH_BY_KEY.get(selectedKey.value) : null))

// клик по узлу графа → прыжок в Список с авто-решением выбранного свитка
const onGraphSelect = (key: string): void => {
  selectedKey.value = key
  view.value = 'list'
}

// «Сделать целью»: ставим цель и перекидываем в Граф предпосылок; повтор — снимаем цель
const toggleGoal = (): void => {
  if (!selected.value) return
  const key = selected.value.key
  if (store.goal === key) {
    store.setGoal(null)
  } else {
    store.setGoal(key)
    view.value = 'graph'
  }
}

const stateOf = (key: string) => researchState(key, store.done)
const costList = computed(() => (selected.value ? Object.entries(selected.value.aspects) : []))
const prereqs = computed(() => selected.value?.parents ?? [])

// описание сворачиваемое — панель всегда без прокрутки; сброс при смене свитка
const descOpen = ref(false)
const descLong = computed(() => (selected.value?.description?.length ?? 0) > 140)
watch(selectedKey, () => (descOpen.value = false))
</script>

<template>
  <section class="sp">
    <header class="sp__top">
      <div class="sp__views" role="group" aria-label="Вид свитков">
        <button
          v-for="v in VIEWS"
          :key="v.id"
          type="button"
          class="sp__view"
          :class="{ on: view === v.id }"
          :aria-pressed="view === v.id"
          @click="view = v.id"
        >
          {{ v.label }}
        </button>
      </div>
      <span class="sp__prog">изучено {{ store.count }} / {{ RESEARCH.length }}</span>
    </header>

    <div v-show="view === 'list'" class="sp__grid">
      <!-- Навигация -->
      <div class="sp__list">
        <input
          v-model="search"
          class="sp__search"
          placeholder="Поиск свитка…"
          aria-label="Поиск свитка"
        />
        <div v-for="g in grouped" :key="g.cat" class="grp">
          <div class="grp__cat">{{ catName(g.cat) }}</div>
          <button
            v-for="r in g.items"
            :key="r.key"
            type="button"
            class="ri"
            :class="[stateOf(r.key), { on: selectedKey === r.key }]"
            @click="selectedKey = r.key"
          >
            <span class="ri__dot" aria-hidden="true"></span>
            <span class="ri__nm">{{ r.name }}</span>
          </button>
        </div>
      </div>

      <!-- Стол с авто-решением -->
      <div class="sp__board">
        <div v-if="selected" class="sp__boardhd">Авто-решение — связать аспекты свитка</div>
        <ScrollBoard v-if="selected" :research="selected" />
      </div>

      <!-- Детали + трекинг -->
      <aside v-if="selected" class="sp__det">
        <div class="det__head">
          <div class="lab">Свиток</div>
          <span class="det__mod">{{ selected.mod }}</span>
        </div>
        <h3 class="det__name">{{ selected.name }}</h3>
        <div class="det__en">{{ selected.nameEn ?? selected.key }} · {{ selected.key }}</div>
        <p v-if="selected.description" class="det__desc" :class="{ open: descOpen }">
          {{ selected.description }}
        </p>
        <button v-if="descLong" type="button" class="det__more" @click="descOpen = !descOpen">
          {{ descOpen ? 'Свернуть' : 'Показать полностью' }}
        </button>

        <div class="lab">Стоимость аспектов</div>
        <div v-if="costList.length" class="costs">
          <span v-for="[tag, amt] in costList" :key="tag" class="cost">
            <AspectHex :tag="tag" :size="22" /><span class="cost__t"
              >{{ ASPECT_BY_TAG.get(tag)?.label }} {{ amt }}</span
            >
          </span>
        </div>
        <p v-else class="det__muted">Без аспектов (изучается автоматически).</p>

        <div class="lab" style="margin-top: 12px">Предпосылки</div>
        <ul v-if="prereqs.length" class="pre">
          <li v-for="p in prereqs" :key="p" class="pre__item">
            <span class="ri__dot" :class="stateOf(p)" aria-hidden="true"></span>
            <button type="button" class="pre__lk" @click="selectedKey = p">
              {{ RESEARCH_BY_KEY.get(p)?.name ?? p }}
            </button>
            <span v-if="store.isDone(p)" class="pre__ok">изучено</span>
          </li>
        </ul>
        <p v-else class="det__muted">Базовый свиток — без предпосылок.</p>

        <div class="det__foot">
          <button type="button" class="btn btn--done" @click="store.toggle(selected.key)">
            {{ store.isDone(selected.key) ? 'Снять отметку' : 'Отметить изученным' }}
          </button>
          <button
            type="button"
            class="btn btn--goal"
            :class="{ active: store.goal === selected.key }"
            @click="toggleGoal"
          >
            {{ store.goal === selected.key ? 'Цель снята' : 'Сделать целью → Граф' }}
          </button>
        </div>
      </aside>
    </div>

    <div v-if="view === 'graph'" class="sp__view-wrap">
      <ResearchGraph
        :selected-key="selectedKey"
        :done="store.done"
        :goal="store.goal"
        @select="onGraphSelect"
      />
    </div>
  </section>
</template>

<style scoped>
.sp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px 0;
}
.sp__prog {
  font-size: 12px;
  color: var(--muted);
}
.sp__views {
  display: inline-flex;
  gap: 2px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 3px;
}
.sp__view {
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.sp__view:hover:not(.on) {
  color: var(--ink);
  background: rgba(160, 107, 255, 0.08);
}
.sp__view.on {
  background: linear-gradient(180deg, #a06bff, var(--solid));
  color: var(--solid-ink);
  box-shadow: 0 0 14px var(--glow-violet);
}
.sp__view:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.sp__view-wrap {
  height: 78vh;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.sp__grid {
  display: grid;
  grid-template-columns: 230px 1fr 250px;
  gap: 0;
  align-items: stretch;
  /* фиксируем высоту: список скроллится внутри своей колонки, стол центрируется,
     правая панель помещается без прокрутки (а не растягивает строку под 420 items) */
  height: 78vh;
}
@media (max-width: 900px) {
  .sp__grid {
    grid-template-columns: 1fr;
  }
}
.sp__list {
  border-right: 1px solid var(--cardln);
  padding: 12px;
  min-height: 0;
  overflow-y: auto;
}
.sp__search {
  width: 100%;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 7px 10px;
  color: var(--ink);
  font: inherit;
  font-size: 12.5px;
  margin-bottom: 10px;
}
.grp__cat {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dim);
  margin: 11px 0 4px;
}
.ri {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  font: inherit;
  font-size: 12.5px;
  color: var(--ink2);
  background: none;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 5px 8px;
  cursor: pointer;
}
.ri:hover {
  background: rgba(160, 107, 255, 0.08);
}
.ri.on {
  background: rgba(160, 107, 255, 0.16);
  border-color: var(--solid);
}
.ri.locked {
  color: var(--dim);
}
.ri__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
  background: var(--dim);
}
.ri__dot.done,
.done > .ri__dot {
  background: var(--src-f);
}
.ri__dot.available,
.available > .ri__dot {
  background: var(--honey-dk);
}
.ri__dot.locked,
.locked > .ri__dot {
  background: transparent;
  border: 1.5px solid var(--dim);
}
.ri__nm {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sp__board {
  padding: 12px;
  border-right: 1px solid var(--cardln);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
}
.sp__boardhd {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin-bottom: 4px;
}
.sp__det {
  padding: 13px 15px;
  background: rgba(16, 12, 26, 0.45);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.det__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lab {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin-bottom: 8px;
}
.det__mod {
  font-size: 10px;
  font-weight: 700;
  color: var(--alt);
  border: 1px solid var(--solid);
  border-radius: 6px;
  padding: 2px 7px;
}
.det__name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 16px;
  margin: 8px 0 2px;
}
.det__en {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--honey-dk);
  margin-bottom: 9px;
}
.det__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink2);
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.det__desc.open {
  -webkit-line-clamp: unset;
  line-clamp: unset;
  display: block;
  overflow: visible;
}
.det__more {
  font: inherit;
  font-size: 11.5px;
  font-weight: 600;
  background: none;
  border: 0;
  color: var(--honey-dk);
  cursor: pointer;
  padding: 0;
  margin: 0 0 12px;
  align-self: flex-start;
}
.det__more:hover {
  text-decoration: underline;
}
.det__muted {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}
.costs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.cost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 20px;
  padding: 2px 9px 2px 3px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink2);
}
.pre {
  list-style: none;
  margin: 0;
  padding: 0;
}
.pre__item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  padding: 2px 0;
}
.pre__lk {
  font: inherit;
  font-size: 12.5px;
  background: none;
  border: 0;
  color: var(--ink2);
  cursor: pointer;
  padding: 0;
}
.pre__lk:hover {
  color: var(--honey-dk);
}
.pre__ok {
  font-size: 10px;
  color: var(--src-f);
}
.det__foot {
  margin-top: auto;
  padding-top: 12px;
}
.btn {
  width: 100%;
  font: inherit;
  font-weight: 700;
  font-size: 12.5px;
  padding: 8px;
  border-radius: 9px;
  border: 0;
  cursor: pointer;
  margin-top: 8px;
}
.btn--done {
  background: linear-gradient(180deg, #52e0a0, #2bb87f);
  color: #062018;
}
.btn--goal {
  background: var(--bg2);
  color: var(--alt);
  border: 1px solid var(--solid);
  margin-top: 7px;
}
.btn--goal.active {
  background: var(--src-m-soft);
}
.btn:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 2px;
}
</style>
