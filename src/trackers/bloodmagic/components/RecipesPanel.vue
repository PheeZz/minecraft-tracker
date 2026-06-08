<script setup lang="ts">
// Панель рецептов BloodMagic.
// Фильтрация по источнику (мультивыбор), тиру, текстовому поиску.
// Карточки вынесены в RecipeCard.vue; логика фильтрации — в domain/filterRecipes.ts.
// Диалог схемы алтаря — один экземпляр на всю панель, открывается по событию от карточки.
import { computed, ref } from 'vue'
import { RECIPES } from '../data/recipes.data'
import type { RecipeSource } from '../domain/types'
import { filterRecipes, availableTiers, SOURCE_LABELS } from '../domain/filterRecipes'
import RecipeCard from './RecipeCard.vue'
import AltarSchematicDialog from './AltarSchematicDialog.vue'

const ALL_SOURCES = Object.keys(SOURCE_LABELS) as RecipeSource[]

const query = ref('')
const activeSources = ref<Set<RecipeSource>>(new Set())
const activeTier = ref<number | null>(null)

const tiers = availableTiers()

const filtered = computed(() =>
  filterRecipes({
    query: query.value,
    sources: activeSources.value,
    tier: activeTier.value,
  }),
)

// Порционная отрисовка: показываем по 60 карточек, не рендерим все 281 сразу
const STEP = 60
const shown = ref(STEP)
const visible = computed(() => filtered.value.slice(0, shown.value))
const remaining = computed(() => Math.max(0, filtered.value.length - shown.value))

// Тир открытого диалога схемы алтаря; null — диалог закрыт
const openTier = ref<number | null>(null)

const openAltarDialog = (tier: number): void => {
  openTier.value = tier
}

const closeAltarDialog = (): void => {
  openTier.value = null
}

const resetShown = (): void => {
  shown.value = STEP
}
const showMore = (): void => {
  shown.value += STEP
}

const toggleSource = (src: RecipeSource): void => {
  const next = new Set(activeSources.value)
  if (next.has(src)) next.delete(src)
  else next.add(src)
  activeSources.value = next
  resetShown()
}

const selectTier = (t: number | null): void => {
  activeTier.value = activeTier.value === t ? null : t
  resetShown()
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
      <div class="rp__chips" role="group" aria-label="Тип рецепта">
        <button
          v-for="src in ALL_SOURCES"
          :key="src"
          type="button"
          class="rp__chip"
          :class="{ on: activeSources.has(src) }"
          :aria-pressed="activeSources.has(src)"
          @click="toggleSource(src)"
        >
          {{ SOURCE_LABELS[src] }}
        </button>
      </div>
      <div class="rp__chips rp__chips--tier" role="group" aria-label="Тир алтаря">
        <button
          v-for="t in tiers"
          :key="t"
          type="button"
          class="rp__chip rp__chip--tier"
          :class="{ on: activeTier === t }"
          :aria-pressed="activeTier === t"
          @click="selectTier(t)"
        >
          Тир {{ t }}
        </button>
      </div>
      <span class="rp__count">{{ filtered.length }} / {{ RECIPES.length }}</span>
    </header>

    <div v-if="visible.length" class="rp__grid">
      <RecipeCard
        v-for="r in visible"
        :key="`${r.source}:${r.output.name_en}`"
        :recipe="r"
        @show-altar="openAltarDialog"
      />
    </div>
    <p v-else class="rp__empty">Ничего не найдено.</p>

    <div v-if="remaining" class="rp__more">
      <button type="button" class="rp__morebtn" @click="showMore">
        Показать ещё {{ Math.min(STEP, remaining) }}
      </button>
    </div>
  </section>

  <!-- Диалог схемы алтаря — один экземпляр на панель, монтируется только при openTier != null -->
  <AltarSchematicDialog v-if="openTier !== null" :tier="openTier" @close="closeAltarDialog" />
</template>

<style scoped>
.rp {
  padding: 14px 16px;
}

.rp__top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
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

.rp__search::placeholder {
  color: var(--muted);
}

.rp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rp__chip {
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted);
  background: var(--bg2);
  border: 1px solid var(--cardln);
  padding: 5px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition:
    color 0.12s ease,
    background 0.12s ease,
    border-color 0.12s ease;
}

.rp__chip:hover:not(.on) {
  color: var(--ink);
  border-color: var(--honey-dk);
}

.rp__chip.on {
  background: rgba(224, 52, 74, 0.18);
  border-color: var(--honey-dk);
  color: var(--honey-dk);
}

.rp__chip--tier {
  font-size: 10.5px;
  padding: 4px 8px;
}

.rp__chip--tier.on {
  background: rgba(255, 207, 107, 0.12);
  border-color: var(--amber);
  color: var(--amber);
}

.rp__chip:focus-visible,
.rp__morebtn:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}

.rp__count {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted);
  align-self: center;
  margin-left: auto;
}

.rp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
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
  margin-top: 14px;
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
  transition: background 0.12s ease;
}

.rp__morebtn:hover {
  background: rgba(224, 52, 74, 0.12);
}
</style>
