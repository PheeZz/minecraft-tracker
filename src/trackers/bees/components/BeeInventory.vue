<script setup lang="ts">
import { computed, ref } from 'vue'
import { BEES } from '../data/bees.data'
import { useBeesStore } from '../stores/useBeesStore'
import BeeIcon from './BeeIcon.vue'

const store = useBeesStore()
const query = ref('')

const SRC_LABEL: Record<string, string> = { F: 'FOR', E: 'EXB', M: 'MAG' }

const q = computed(() => query.value.trim().toLowerCase())
const rows = computed(() =>
  BEES.filter(
    (b) => !q.value || b.id.toLowerCase().includes(q.value) || b.en.toLowerCase().includes(q.value),
  )
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id, 'ru')),
)
</script>

<template>
  <section class="inv">
    <header class="inv__head">
      <div class="inv__title">
        Инвентарь пчёл
        <span class="inv__count">в наличии {{ store.haveCount }} / {{ BEES.length }}</span>
      </div>
      <label class="inv__search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="query" placeholder="найти пчелу…" />
      </label>
      <button class="inv__close" type="button" title="Закрыть" @click="store.toggleInventory()">
        ✕ Закрыть
      </button>
    </header>

    <div class="inv__grid">
      <div
        v-for="b in rows"
        :key="b.id"
        class="card"
        :class="{ owned: store.isHave(b.id) }"
        role="checkbox"
        :aria-checked="store.isHave(b.id)"
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
        <span class="card__src" :class="`src-${b.source}`">{{
          SRC_LABEL[b.source] ?? b.source
        }}</span>
      </div>
      <div v-if="!rows.length" class="inv__empty">Ничего не найдено</div>
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
.inv__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  min-height: 56px;
  flex-wrap: wrap;
}
.inv__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.inv__count {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--honey-dk);
}
.inv__search {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 10px;
  padding: 0 12px;
  min-width: 220px;
}
.inv__search input {
  flex: 1;
  background: none;
  border: 0;
  font: inherit;
  font-size: 14px;
  padding: 9px 0;
  color: var(--ink);
  outline: none;
}
.inv__search svg {
  width: 16px;
  height: 16px;
  color: var(--honey-dk);
}
.inv__close {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  background: var(--card);
  border: 1px solid var(--cardln);
  color: var(--ink2);
  padding: 8px 12px;
  border-radius: 9px;
  cursor: pointer;
}
.inv__close:hover {
  border-color: var(--honey-dk);
}

.inv__grid {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 10px;
  align-content: start;
}
.card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border: 1px solid var(--cardln);
  border-radius: 12px;
  background: var(--card);
  cursor: pointer;
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
.card.owned {
  border-color: var(--src-f);
  background: var(--src-f-soft);
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
.card__chk.on {
  background: var(--src-f);
  border-color: var(--src-f);
  color: #eafff5;
}
.card__body {
  flex: 1;
  min-width: 0;
}
.card__name {
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card.owned .card__name {
  color: var(--src-f);
}
.card__sub {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card__src {
  flex: none;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}
.src-F {
  background: var(--src-f);
  color: #eafff5;
}
.src-E {
  background: var(--src-e);
  color: #fff1e8;
}
.src-M {
  background: #7a59b8;
  color: #f3e9ff;
}
.inv__empty {
  color: var(--dim);
  font-style: italic;
  padding: 30px;
}
</style>
