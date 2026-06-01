<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BEES } from '../data/bees.data'
import type { Bee, BeeSource } from '../domain/types'
import { useBeesStore, type InvFilter, type InvSort } from '../stores/useBeesStore'
import BeeIcon from './BeeIcon.vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { downloadJson, parseJsonFileText } from '@/shared/persistence/importExport'

const store = useBeesStore()
const query = ref('')
const confirmClear = ref(false)
const fileInput = ref<HTMLInputElement>()

const TOTAL = BEES.length

const SRC_LABEL: Record<BeeSource, string> = { F: 'FOR', E: 'EXB', M: 'MAG' }
const SRC_NAME: Record<BeeSource, string> = {
  F: 'Forestry',
  E: 'ExtraBees',
  M: 'MagicBees',
}
const SRC_ORDER: BeeSource[] = ['F', 'E', 'M']

const FILTERS: { value: InvFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'missing', label: 'Нет' },
  { value: 'owned', label: 'Есть' },
  { value: 'breedable', label: 'Готовы' },
  { value: 'wild', label: 'Дикие' },
]
const SORTS: { value: InvSort; label: string }[] = [
  { value: 'name', label: 'Имя' },
  { value: 'depth', label: 'Глубина' },
  { value: 'wild', label: 'Сначала дикие' },
]

const q = computed(() => query.value.trim().toLowerCase())
const searching = computed(() => q.value.length > 0)

/** Ширина заливки сегмента прогресса (страхуемся от деления на 0). */
function pct(owned: number, src: BeeSource): string {
  const total = store.TOTAL_BY_SOURCE[src]
  return total ? (owned / total) * 100 + '%' : '0%'
}

/** Статус не-имеющейся пчелы для чипа. */
function isWild(b: Bee): boolean {
  return b.parents.length === 0
}
function isBreedable(b: Bee): boolean {
  return !store.isHave(b.id) && b.parents.length > 0 && store.depthOf(b.id) === 0
}

// Деструктивное «Очистить склад» подтверждается инлайном (точно? да/нет). Снимаем
// взведённое подтверждение при любом переключении фильтра/сортировки/поиска, чтобы
// случайный поздний клик по «да» не стёр весь склад без отмены.
watch([q, () => store.invFilter, () => store.invSort], () => {
  confirmClear.value = false
})

/** Совпадение по поиску (id + en, без регистра). */
function matchesQuery(b: Bee): boolean {
  if (!q.value) return true
  return b.id.toLowerCase().includes(q.value) || b.en.toLowerCase().includes(q.value)
}

/** Совпадение по активному фильтру. */
function matchesFilter(b: Bee): boolean {
  switch (store.invFilter) {
    case 'owned':
      return store.isHave(b.id)
    case 'missing':
      return !store.isHave(b.id)
    case 'breedable':
      return isBreedable(b)
    case 'wild':
      return isWild(b)
    default:
      return true
  }
}

/** Native-tooltip: топ-3 продукта «имя pct%». */
function productTitle(b: Bee): string {
  return b.products
    .slice(0, 3)
    .map((p) => `${p.name} ${p.pct}%`)
    .join('\n')
}

function sortFn(a: Bee, b: Bee): number {
  const depth = store.depthOf
  switch (store.invSort) {
    case 'depth':
      return depth(a.id) - depth(b.id) || a.id.localeCompare(b.id, 'ru')
    case 'wild': {
      const aw = isWild(a) ? 0 : 1
      const bw = isWild(b) ? 0 : 1
      return aw - bw || depth(a.id) - depth(b.id) || a.id.localeCompare(b.id, 'ru')
    }
    default:
      return a.id.localeCompare(b.id, 'ru')
  }
}

interface Section {
  src: BeeSource
  owned: number
  total: number
  rows: Bee[]
}

/** Секции F→E→M с отфильтрованными+отсортированными внутри карточками. */
const sections = computed<Section[]>(() =>
  SRC_ORDER.map((src) => {
    const rows = BEES.filter((b) => b.source === src && matchesQuery(b) && matchesFilter(b)).sort(
      sortFn,
    )
    return {
      src,
      owned: store.ownedBySource[src],
      total: store.TOTAL_BY_SOURCE[src],
      rows,
    }
  }),
)

/** Глобально нет результатов — заменяем стек секций пустым состоянием. */
const noResults = computed(() => sections.value.every((s) => s.rows.length === 0))

/** Видна ли карточная сетка секции (свёрнутость игнорируется при поиске). */
function isExpanded(src: BeeSource): boolean {
  if (searching.value) return true
  return !store.collapsedSources.has(src)
}

/** Класс источника owned-карточки и т.п. */
function srcClass(src: BeeSource): string {
  return `s-${src}`
}

function clearSearchAndFilter(): void {
  query.value = ''
  store.setInvFilter('all')
}

function bulkMark(rows: Bee[]): void {
  store.markAll(rows.map((b) => b.id))
}
function bulkUnmark(rows: Bee[]): void {
  store.unmarkAll(rows.map((b) => b.id))
}

function doClear(): void {
  store.clearHave()
  confirmClear.value = false
}

function onExport(): void {
  downloadJson(store.exportData(), 'bees-progress.json')
}
async function onImport(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const r = parseJsonFileText(await file.text())
  if (r.ok) store.importData(r.data)
  else alert('Ошибка импорта: ' + r.error)
  if (fileInput.value) fileInput.value.value = ''
}

const full = computed(() => store.haveCount === TOTAL)
</script>

<template>
  <section class="inv">
    <!-- ── Шапка: 2 ряда ── -->
    <header class="inv__head">
      <div class="inv__title">Инвентарь пчёл</div>
      <span class="inv__count">в наличии {{ store.haveCount }} / {{ TOTAL }}</span>

      <!-- сегментированный прогресс 44/96/117 -->
      <div class="inv__bar" aria-hidden="true">
        <span
          v-for="src in SRC_ORDER"
          :key="src"
          class="inv__seg"
          :class="srcClass(src)"
          :style="{ flexGrow: store.TOTAL_BY_SOURCE[src] }"
          :title="`${SRC_NAME[src]} ${store.ownedBySource[src]}/${store.TOTAL_BY_SOURCE[src]}`"
        >
          <span class="inv__seg-fill" :style="{ width: pct(store.ownedBySource[src], src) }" />
        </span>
      </div>

      <button
        v-if="full"
        type="button"
        class="inv__breed inv__breed--full"
        @click="store.setInvFilter('owned')"
      >
        склад полон <IconBase name="bee" /> {{ TOTAL }}/{{ TOTAL }}
      </button>
      <button v-else type="button" class="inv__breed" @click="store.setInvFilter('breedable')">
        готово к выведению: {{ store.breedableCount }}
      </button>

      <button class="inv__close" type="button" title="Закрыть" @click="store.setView('graph')">
        <IconBase name="close" />Закрыть
      </button>
    </header>

    <!-- ── Тулбар ── -->
    <div class="inv__tools">
      <label class="inv__search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="query" placeholder="найти пчелу…" />
      </label>

      <!-- панель-тумблеры: role=group + aria-pressed честнее, чем radiogroup,
           т.к. это обычные кнопки без стрелочной навигации -->
      <div class="seg" role="group" aria-label="Фильтр">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          type="button"
          class="seg__btn"
          :aria-pressed="store.invFilter === f.value"
          :class="{ on: store.invFilter === f.value }"
          @click="store.setInvFilter(f.value)"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="seg seg--sort" role="group" aria-label="Сортировка">
        <button
          v-for="s in SORTS"
          :key="s.value"
          type="button"
          class="seg__btn"
          :aria-pressed="store.invSort === s.value"
          :class="{ on: store.invSort === s.value }"
          @click="store.setInvSort(s.value)"
        >
          {{ s.label }}
        </button>
      </div>

      <div class="inv__data">
        <button
          type="button"
          class="inv__data-btn"
          title="Экспорт склада и задач"
          @click="onExport"
        >
          <IconBase name="download" />Экспорт
        </button>
        <button
          type="button"
          class="inv__data-btn"
          title="Импорт из файла (склад и задачи)"
          @click="fileInput?.click()"
        >
          <IconBase name="upload" />Импорт
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          hidden
          @change="onImport"
        />
      </div>

      <div class="inv__clear">
        <template v-if="confirmClear">
          <span class="inv__clear-q">точно?</span>
          <button type="button" class="inv__clear-yes" @click="doClear">да</button>
          <button type="button" class="inv__clear-no" @click="confirmClear = false">нет</button>
        </template>
        <button v-else type="button" class="inv__clear-btn" @click="confirmClear = true">
          Очистить склад
        </button>
      </div>
    </div>

    <!-- ── Контент ── -->
    <div class="inv__scroll">
      <!-- глобально пусто -->
      <div v-if="noResults" class="inv__none">
        <div class="inv__none-glyph"><IconBase name="bee" /></div>
        <p class="inv__none-text">
          {{ searching ? 'Ничего не найдено' : 'Нет пчёл в этом фильтре' }}
        </p>
        <button type="button" class="inv__none-reset" @click="clearSearchAndFilter">
          Сбросить
        </button>
      </div>

      <template v-else>
        <section
          v-for="sec in sections"
          :key="sec.src"
          class="sect"
          :class="{ 'sect--empty': sec.rows.length === 0 }"
        >
          <div class="sect__head" :class="srcClass(sec.src)">
            <span class="sect__bar" />
            <button
              type="button"
              class="sect__chev"
              :aria-expanded="isExpanded(sec.src)"
              :disabled="searching"
              :class="{ open: isExpanded(sec.src) }"
              :title="isExpanded(sec.src) ? 'Свернуть' : 'Развернуть'"
              @click="store.toggleCollapsed(sec.src)"
            >
              ▸
            </button>
            <span class="sect__name">{{ SRC_NAME[sec.src] }}</span>
            <span class="sect__count">{{ sec.owned }}/{{ sec.total }}</span>
            <span class="sect__prog" aria-hidden="true">
              <span
                class="sect__prog-fill"
                :style="{ width: sec.total ? (sec.owned / sec.total) * 100 + '%' : '0%' }"
              />
            </span>
            <span v-if="sec.rows.length" class="sect__bulk">
              <button type="button" @click="bulkMark(sec.rows)">всё</button>
              <span class="sect__bulk-sep">/</span>
              <button type="button" @click="bulkUnmark(sec.rows)">снять</button>
            </span>
          </div>

          <div v-if="sec.rows.length === 0" class="sect__stub">— ничего —</div>

          <div v-else class="sect__wrap" :class="{ collapsed: !isExpanded(sec.src) }">
            <div class="sect__inner">
              <div class="grid">
                <div
                  v-for="b in sec.rows"
                  :key="b.id"
                  class="card"
                  :class="[srcClass(b.source), { owned: store.isHave(b.id) }]"
                  role="checkbox"
                  :aria-checked="store.isHave(b.id)"
                  :aria-label="`${b.id}, ${b.en}, ${store.isHave(b.id) ? 'есть' : 'нет'}`"
                  :title="productTitle(b)"
                  tabindex="0"
                  @click="store.toggleHave(b.id)"
                  @keydown.enter.prevent="store.toggleHave(b.id)"
                  @keydown.space.prevent="store.toggleHave(b.id)"
                >
                  <span class="card__chk" :class="{ on: store.isHave(b.id) }">✓</span>
                  <BeeIcon :name="b.id" big />
                  <div class="card__body">
                    <div class="card__name">{{ b.id }}</div>
                    <div class="card__sub">{{ b.en }}</div>
                  </div>

                  <span v-if="!store.isHave(b.id)" class="card__chip">
                    <span v-if="isWild(b)" class="chip chip--wild">дикая</span>
                    <span v-else-if="isBreedable(b)" class="chip chip--ready">готова</span>
                    <span v-else class="chip chip--depth">d{{ store.depthOf(b.id) }}</span>
                  </span>

                  <span class="card__src" :class="srcClass(b.source)">{{
                    SRC_LABEL[b.source]
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>

<style scoped>
.inv {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

/* ── Шапка ── */
.inv__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--line);
  min-height: 56px;
  flex-wrap: wrap;
}
.inv__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
}
.inv__count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--honey-dk);
}
.inv__bar {
  display: flex;
  gap: 3px;
  flex: 1 1 160px;
  min-width: 120px;
  max-width: 280px;
  height: 6px;
}
.inv__seg {
  position: relative;
  height: 100%;
  border-radius: 3px;
  background: var(--cardln);
  overflow: hidden;
}
.inv__seg-fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  border-radius: 3px;
}
.inv__seg.s-F .inv__seg-fill {
  background: var(--src-f);
}
.inv__seg.s-E .inv__seg-fill {
  background: var(--src-e);
}
.inv__seg.s-M .inv__seg-fill {
  background: var(--src-m);
}
.inv__breed {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--amber);
  background: rgba(244, 196, 82, 0.08);
  border: 1px solid rgba(244, 196, 82, 0.4);
  box-shadow: 0 0 10px rgba(244, 196, 82, 0.18);
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}
.inv__breed:hover {
  border-color: var(--amber);
}
.inv__breed--full {
  color: var(--src-f);
  background: var(--src-f-soft);
  border-color: var(--src-f);
  box-shadow: 0 0 10px rgba(68, 184, 122, 0.2);
}
.inv__close {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  background: var(--card);
  border: 1px solid var(--cardln);
  color: var(--ink2);
  padding: 8px 12px;
  border-radius: 9px;
  cursor: pointer;
  margin-left: auto;
}
.inv__close:hover {
  border-color: var(--honey-dk);
}

/* ── Тулбар ── */
.inv__tools {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--line);
  min-height: 48px;
  flex-wrap: wrap;
}
.inv__search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 10px;
  padding: 0 12px;
  min-width: 200px;
}
.inv__search input {
  flex: 1;
  background: none;
  border: 0;
  font: inherit;
  font-size: 14px;
  padding: 7px 0;
  color: var(--ink);
  outline: none;
}
.inv__search svg {
  width: 16px;
  height: 16px;
  color: var(--honey-dk);
}

.seg {
  display: inline-flex;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 2px;
  gap: 2px;
}
.seg__btn {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 5px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: 0.13s;
}
.seg__btn:hover {
  color: var(--ink);
}
.seg__btn.on {
  background: var(--solid);
  color: var(--solid-ink);
}
.seg__btn:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}

.inv__data {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}
.inv__data-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
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
.inv__data-btn:hover {
  border-color: var(--honey-dk);
  color: var(--ink);
}
.inv__clear {
  display: flex;
  align-items: center;
  gap: 6px;
}
.inv__clear-btn,
.inv__clear-yes,
.inv__clear-no {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  background: none;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
.inv__clear-btn {
  color: var(--dim);
}
.inv__clear-btn:hover {
  color: var(--rust);
}
.inv__clear-q {
  font-size: 12px;
  color: var(--rust);
}
.inv__clear-yes {
  color: #fff1e8;
  background: var(--rust);
}
.inv__clear-no {
  color: var(--ink2);
  border-color: var(--cardln);
}

/* ── Контент ── */
.inv__scroll {
  flex: 1;
  overflow: auto;
  padding: 0 20px 20px;
}

.inv__none {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--dim);
  font-style: italic;
}
.inv__none-glyph {
  font-size: 40px;
  opacity: 0.6;
}
.inv__none-text {
  margin: 0;
  font-size: 15px;
}
.inv__none-reset {
  font: inherit;
  font-style: normal;
  font-size: 13px;
  font-weight: 600;
  color: var(--honey-dk);
  background: none;
  border: 0;
  cursor: pointer;
  text-decoration: underline;
}

/* ── Секция ── */
.sect {
  margin-top: 6px;
}
.sect__head {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 4px;
  background: var(--bg2);
  border-bottom: 1px solid var(--line);
}
.sect--empty .sect__head {
  opacity: 0.5;
}
.sect__bar {
  width: 4px;
  height: 22px;
  border-radius: 2px;
  flex: none;
}
.sect__head.s-F .sect__bar {
  background: var(--src-f);
}
.sect__head.s-E .sect__bar {
  background: var(--src-e);
}
.sect__head.s-M .sect__bar {
  background: var(--src-m);
}
.sect__chev {
  font-size: 12px;
  line-height: 1;
  color: var(--muted);
  background: none;
  border: 0;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s ease;
}
.sect__chev.open {
  transform: rotate(90deg);
}
.sect__chev:disabled {
  opacity: 0.4;
  cursor: default;
}
.sect__chev:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.sect__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13px;
}
.sect__head.s-F .sect__name {
  color: var(--src-f);
}
.sect__head.s-E .sect__name {
  color: var(--src-e);
}
.sect__head.s-M .sect__name {
  color: var(--src-m);
}
.sect__count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}
.sect__prog {
  position: relative;
  flex: 1 1 60px;
  max-width: 160px;
  height: 3px;
  border-radius: 2px;
  background: var(--cardln);
  overflow: hidden;
}
.sect__prog-fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
}
.sect__head.s-F .sect__prog-fill {
  background: var(--src-f);
}
.sect__head.s-E .sect__prog-fill {
  background: var(--src-e);
}
.sect__head.s-M .sect__prog-fill {
  background: var(--src-m);
}
.sect__bulk {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
}
.sect__bulk button {
  font: inherit;
  color: var(--muted);
  background: none;
  border: 0;
  cursor: pointer;
  padding: 2px 4px;
}
.sect__bulk button:hover {
  color: var(--honey-dk);
}
.sect__bulk-sep {
  color: var(--dim);
}
.sect__stub {
  padding: 16px 8px;
  color: var(--dim);
  font-style: italic;
  font-size: 13px;
}

/* свёртка: grid-template-rows 1fr↔0fr + opacity */
.sect__wrap {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition:
    grid-template-rows 0.2s ease,
    opacity 0.2s ease;
}
.sect__wrap.collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
}
.sect__inner {
  min-height: 0;
  overflow: hidden;
}
.sect__wrap.collapsed .sect__inner {
  visibility: hidden;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(212px, 1fr));
  gap: 10px;
  padding: 12px 0;
  align-content: start;
}

/* ── Карточка ── */
.card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 12px;
  border: 1px solid var(--cardln);
  border-radius: 12px;
  background: var(--card);
  cursor: pointer;
  min-height: 58px;
  transition: 0.13s;
}
.card:hover {
  border-color: var(--honey);
  transform: translateY(-1px);
}
.card:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 2px;
}

/* owned per-source */
.card.owned.s-F {
  border-color: var(--src-f);
  background: var(--src-f-soft);
}
.card.owned.s-E {
  border-color: var(--src-e);
  background: var(--src-e-soft);
}
.card.owned.s-M {
  border-color: var(--src-m);
  background: var(--src-m-soft);
}
.card.owned.s-F .card__name {
  color: var(--src-f);
}
.card.owned.s-E .card__name {
  color: var(--src-e);
}
.card.owned.s-M .card__name {
  color: var(--src-m);
}

.card__chk {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1.6px solid var(--cardln);
  background: var(--bg2);
  display: inline-grid;
  place-items: center;
  font-size: 13px;
  line-height: 1;
  color: transparent;
}
.card.owned .card__chk.on {
  animation: chkPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #fff;
}
.card.owned.s-F .card__chk.on {
  background: var(--src-f);
  border-color: var(--src-f);
  color: #eafff5;
}
.card.owned.s-E .card__chk.on {
  background: var(--src-e);
  border-color: var(--src-e);
  color: #fff1e8;
}
.card.owned.s-M .card__chk.on {
  background: var(--src-m);
  border-color: var(--src-m);
  color: #f3e9ff;
}
@keyframes chkPop {
  0% {
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.card__body {
  flex: 1;
  min-width: 0;
  padding-right: 36px;
}
.card__name {
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card__sub {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__chip {
  position: absolute;
  top: 6px;
  right: 8px;
}
.chip {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  line-height: 1;
}
.chip--wild {
  color: var(--amber);
  background: rgba(244, 196, 82, 0.14);
  border: 1px solid rgba(244, 196, 82, 0.4);
}
.chip--ready {
  color: var(--src-f);
  background: var(--src-f-soft);
  border: 1px solid var(--src-f);
}
.chip--depth {
  color: var(--muted);
  background: var(--bg2);
  border: 1px solid var(--cardln);
}

.card__src {
  flex: none;
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 5px;
}
.card__src.s-F {
  background: var(--src-f);
  color: #eafff5;
}
.card__src.s-E {
  background: var(--src-e);
  color: #fff1e8;
}
.card__src.s-M {
  background: var(--src-m);
  color: #f3e9ff;
}
</style>
