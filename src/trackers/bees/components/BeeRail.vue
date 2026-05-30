<script setup lang="ts">
import { computed, ref } from 'vue'
import { BEES } from '../data/bees.data'
import { COMBS, COMB_NAMES, shortComb } from '../domain/combs'
import { useBeesStore } from '../stores/useBeesStore'
import BeeIcon from './BeeIcon.vue'
import CombIcon from './CombIcon.vue'

const store = useBeesStore()
const query = ref('')

const q = computed(() => query.value.trim().toLowerCase())

const combRows = computed(() =>
  COMB_NAMES.filter((n) => !q.value || n.toLowerCase().includes(q.value))
    .filter((n) => !store.invOnly || COMBS[n]!.some((p) => store.isHave(p.bee)))
    .map((name) => {
      const producers = COMBS[name]!
      return {
        name,
        total: producers.length,
        own: producers.filter((p) => store.isHave(p.bee)).length,
        rare: producers.length <= 1,
      }
    }),
)

const beeRows = computed(() =>
  BEES.filter(
    (b) => !q.value || b.id.toLowerCase().includes(q.value) || b.en.toLowerCase().includes(q.value),
  )
    .filter((b) => !store.invOnly || store.isHave(b.id))
    .slice()
    .sort(
      (a, b) =>
        Number(store.isHave(b.id)) - Number(store.isHave(a.id)) || a.id.localeCompare(b.id, 'ru'),
    )
    .map((b) => ({ id: b.id, depth: store.depthOf(b.id), recipes: b.parents.length })),
)

function clearHave() {
  if (store.haveCount && confirm('Очистить весь склад?')) store.clearHave()
}
</script>

<template>
  <nav class="rail">
    <div class="rail__h">
      <div class="t">Цепочка выведения</div>
      <div class="s">соты → пчела → план</div>
    </div>

    <div class="seg">
      <button :class="{ on: store.mode === 'comb' }" type="button" @click="store.mode = 'comb'">
        Соты
      </button>
      <button :class="{ on: store.mode === 'bee' }" type="button" @click="store.mode = 'bee'">
        Пчёлы
      </button>
    </div>

    <label class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input v-model="query" placeholder="что ищем…" />
    </label>

    <div class="invbar">
      <span
        >в наличии <span class="cnt">{{ store.haveCount }}</span></span
      >
      <button :class="{ on: store.invOnly }" type="button" @click="store.invOnly = !store.invOnly">
        только мои
      </button>
      <button type="button" @click="clearHave">сбросить</button>
    </div>

    <div class="list">
      <template v-if="store.mode === 'comb'">
        <div
          v-for="row in combRows"
          :key="row.name"
          class="row"
          :class="{ rare: row.rare, on: row.name === store.curComb, owned: row.own > 0 }"
          @click="store.selectComb(row.name)"
        >
          <CombIcon :name="row.name" />
          <span class="nm">{{ shortComb(row.name) }}</span>
          <span class="ct">{{ row.own ? row.own + '/' : '' }}{{ row.total }} ист.</span>
        </div>
      </template>
      <template v-else>
        <div
          v-for="row in beeRows"
          :key="row.id"
          class="row"
          :class="{ on: row.id === store.curTarget, owned: store.isHave(row.id) }"
          @click="store.selectBee(row.id)"
        >
          <span
            class="havchk"
            :class="{ on: store.isHave(row.id) }"
            title="есть на складе"
            @click.stop="store.toggleHave(row.id)"
            >✓</span
          >
          <span class="nm"><BeeIcon :name="row.id" />{{ row.id }}</span>
          <span class="ct"
            >гл.{{ row.depth }}{{ row.recipes > 1 ? ' · ⇄' + row.recipes : '' }}</span
          >
        </div>
      </template>
      <div
        v-if="(store.mode === 'comb' ? combRows.length : beeRows.length) === 0"
        class="empty-row"
      >
        Ничего не найдено
      </div>
    </div>
  </nav>
</template>

<style scoped>
.rail {
  border-right: 1px solid var(--line);
  background: rgba(255, 250, 240, 0.55);
  display: flex;
  flex-direction: column;
  min-height: 0;
  backdrop-filter: blur(3px);
}
.rail__h {
  padding: 18px 18px 8px;
}
.rail__h .t {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.3px;
}
.rail__h .s {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin-top: 5px;
}
.seg {
  display: flex;
  gap: 5px;
  margin: 10px 14px 8px;
}
.seg button {
  flex: 1;
  font: inherit;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px;
  border: 1px solid var(--cardln);
  background: var(--card);
  color: var(--muted);
  border-radius: 9px;
  cursor: pointer;
  transition: 0.13s;
}
.seg button.on {
  background: var(--ink);
  color: #f6efe2;
  border-color: var(--ink);
}
.search {
  margin: 0 14px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 10px;
  padding: 0 12px;
}
.search input {
  flex: 1;
  background: none;
  border: 0;
  font: inherit;
  font-size: 14px;
  padding: 10px 0;
  color: var(--ink);
  outline: none;
}
.search svg {
  width: 16px;
  height: 16px;
  color: var(--honey-dk);
}
.invbar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 14px 8px;
  font-size: 11.5px;
  color: var(--muted);
  flex-wrap: wrap;
}
.invbar .cnt {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--src-f);
}
.invbar button {
  font: inherit;
  font-size: 10.5px;
  background: var(--card);
  border: 1px solid var(--cardln);
  color: var(--ink2);
  padding: 4px 8px;
  border-radius: 7px;
  cursor: pointer;
}
.invbar button.on {
  background: var(--src-f);
  color: #eafff5;
  border-color: var(--src-f);
}
.list {
  flex: 1;
  overflow: auto;
  padding: 0 10px 18px;
}
.row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.12s;
}
.row:hover {
  background: rgba(232, 167, 44, 0.12);
}
.row.on {
  background: rgba(232, 167, 44, 0.2);
  box-shadow: inset 2px 0 0 var(--honey);
}
.row .nm {
  flex: 1;
  font-weight: 600;
  font-size: 14.5px;
  display: inline-flex;
  align-items: center;
}
.row .ct {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted);
}
.row.rare .ct {
  color: var(--rust);
  font-weight: 700;
}
.row.owned {
  opacity: 0.85;
}
.row.owned .nm {
  color: var(--src-f);
}
.havchk {
  flex: none;
  width: 19px;
  height: 19px;
  border-radius: 6px;
  border: 1.6px solid var(--cardln);
  background: var(--card);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  line-height: 1;
  color: transparent;
  transition: 0.12s;
}
.havchk:hover {
  border-color: var(--src-f);
}
.havchk.on {
  background: var(--src-f);
  border-color: var(--src-f);
  color: #eafff5;
}
.empty-row {
  padding: 18px;
  color: var(--dim);
  font-style: italic;
}
</style>
