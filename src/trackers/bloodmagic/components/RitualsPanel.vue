<script setup lang="ts">
// Панель ритуалов: список с фильтром по уровню кристалла, детальный вид выбранного.
import { ref, computed } from 'vue'
import { RITUALS } from '../data/rituals.data'
import type { Ritual } from '../domain/types'
import MultiblockView from './MultiblockView.vue'
import ItemIcon from './ItemIcon.vue'
import RitualDescription from './RitualDescription.vue'
import RitualLpCalc from './RitualLpCalc.vue'
import RitualRuneBreakdown from './RitualRuneBreakdown.vue'
import { ritualVoxels } from '../three/ritualVoxels'
import { useRitualProgressStore } from '../stores/useRitualProgressStore'

// Лейблы уровней кристаллов — из данных, не хардкод
const CRYSTAL_LABELS: Record<number, string> = { 1: 'Слабый', 2: 'Пробуждённый' }
function crystalLabel(level: number): string {
  return CRYSTAL_LABELS[level] ?? `Уровень ${level}`
}

// Маппинг уровня кристалла → путь к иконке в public/ (1=Weak, 2=Awakened, иное=Creative)
function crystalIcon(level: number): string {
  if (level === 1) return 'bloodmagic/items/alchemicalwizardry/activationCrystalWeak.png'
  if (level === 2) return 'bloodmagic/items/alchemicalwizardry/activationCrystalAwakened.png'
  return 'bloodmagic/items/alchemicalwizardry/activationCrystalCreative.png'
}

function crystalItemRef(level: number) {
  return { icon: crystalIcon(level), name_ru: crystalLabel(level), name_en: `Crystal L${level}` }
}

// Уровни из данных без дублирования, отсортированы
const crystalLevels = computed(() =>
  [...new Set(RITUALS.map((r) => r.crystalLevel))].sort((a, b) => a - b),
)

const filterLevel = ref<number | null>(null)
const selected = ref<Ritual | null>(null)

const filtered = computed(() =>
  filterLevel.value === null
    ? [...RITUALS]
    : RITUALS.filter((r) => r.crystalLevel === filterLevel.value),
)

const ritualStore = useRitualProgressStore()

function selectRitual(r: Ritual): void {
  selected.value = r
}

function voxels(r: Ritual) {
  return ritualVoxels(r, import.meta.env.BASE_URL)
}
</script>

<template>
  <section class="rp">
    <div class="rp__sidebar">
      <header class="rp__sidebar-header">
        <h2 class="rp__title">Ритуалы</h2>
        <span class="rp__count">{{ filtered.length }} / {{ RITUALS.length }}</span>
      </header>

      <!-- Фильтр по уровню кристалла -->
      <div class="rp__filters" role="group" aria-label="Фильтр по кристаллу">
        <button
          type="button"
          class="rp__filter-btn"
          :class="{ on: filterLevel === null }"
          @click="filterLevel = null"
        >
          Все
        </button>
        <button
          v-for="lvl in crystalLevels"
          :key="lvl"
          type="button"
          class="rp__filter-btn"
          :class="{ on: filterLevel === lvl }"
          @click="filterLevel = lvl"
        >
          <ItemIcon :item="crystalItemRef(lvl)" :size="14" class="rp__crystal-icon" />
          {{ crystalLabel(lvl) }}
        </button>
      </div>

      <!-- Список ритуалов -->
      <ul class="rp__list" role="list">
        <li
          v-for="r in filtered"
          :key="r.key"
          class="rp__item"
          :class="{ on: selected?.key === r.key, unlocked: ritualStore.isUnlocked(r.key) }"
          role="listitem"
          @click="selectRitual(r)"
        >
          <span class="rp__item-name">{{ r.name_ru }}</span>
          <span v-if="ritualStore.isUnlocked(r.key)" class="rp__item-check" aria-label="Построено"
            >✓</span
          >
        </li>
      </ul>
    </div>

    <!-- Детальный вид выбранного ритуала -->
    <div v-if="selected" class="rp__detail">
      <div class="rp__detail-header">
        <div class="rp__detail-titles">
          <div class="rp__detail-name-row">
            <ItemIcon
              :item="crystalItemRef(selected.crystalLevel)"
              :size="18"
              class="rp__crystal-detail"
            />
            <h3 class="rp__detail-name">{{ selected.name_ru }}</h3>
          </div>
          <span class="rp__detail-en">{{ selected.name_en }}</span>
        </div>
        <button
          type="button"
          class="rp__unlock-btn"
          :class="{ unlocked: ritualStore.isUnlocked(selected.key) }"
          :title="ritualStore.isUnlocked(selected.key) ? 'Снять отметку' : 'Отметить построенным'"
          @click="ritualStore.toggleRitual(selected.key)"
        >
          {{ ritualStore.isUnlocked(selected.key) ? 'Построено ✓' : 'Построено' }}
        </button>
      </div>

      <RitualDescription :ritual="selected" class="rp__section" />

      <div class="rp__section">
        <MultiblockView :blocks="voxels(selected)" :height="280" />
      </div>

      <RitualLpCalc :ritual="selected" class="rp__section" />
      <RitualRuneBreakdown :ritual="selected" class="rp__section" />
    </div>

    <!-- Заглушка если ничего не выбрано -->
    <div v-else class="rp__empty">
      <p>Выберите ритуал из списка слева</p>
    </div>
  </section>
</template>

<style scoped>
.rp {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.rp__sidebar {
  width: 220px;
  flex: none;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--cardln);
  overflow: hidden;
}

.rp__sidebar-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 14px 8px;
}

.rp__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 800;
  color: var(--ink);
  margin: 0;
}

.rp__count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

.rp__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 10px 8px;
}

.rp__filter-btn {
  font: inherit;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 5px;
  border: 1px solid var(--cardln);
  background: var(--card2);
  color: var(--muted);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Иконка кристалла в кнопке фильтра */
.rp__crystal-icon {
  flex: none;
}

/* Кристалл-артефакт в шапке выбранного ритуала — тлеет алым, как угли. */
.rp__crystal-detail {
  flex: none;
  animation: bm-ember 5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .rp__crystal-detail {
    animation: none;
    filter: drop-shadow(0 0 4px rgba(224, 52, 74, 0.6));
  }
}

.rp__filter-btn.on,
.rp__filter-btn:hover {
  background: rgba(138, 16, 32, 0.2);
  color: var(--ink);
  border-color: rgba(224, 52, 74, 0.3);
}

.rp__list {
  list-style: none;
  margin: 0;
  padding: 0 6px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.rp__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 2px;
}

.rp__item {
  transition:
    background 0.12s,
    box-shadow 0.15s;
}

.rp__item:hover {
  background: rgba(138, 16, 32, 0.1);
  box-shadow: var(--glow-card-hover);
}

/* Выбранный ритуал — тонкая боковая черта + лёгкое свечение */
.rp__item.on {
  background: rgba(138, 16, 32, 0.22);
  color: var(--ink);
  box-shadow:
    inset 2px 0 0 var(--honey-dk),
    var(--glow-arcane-soft);
}

.rp__item-name {
  font-size: 12.5px;
  color: var(--ink);
  line-height: 1.4;
  flex: 1;
}

.rp__item-check {
  font-size: 10px;
  color: var(--src-f);
  flex: none;
}

.rp__detail {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.rp__detail-header {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

/* Руническая печать — медленно вращающийся арканный глиф, «вытравленный» в панели.
   Ритуалы в игре и есть наземные глифы — печать за шапкой задаёт ритуальный тон. */
.rp__detail-header::before {
  content: '';
  position: absolute;
  top: 50%;
  right: -34px;
  width: 156px;
  height: 156px;
  margin-top: -78px;
  background: url('../assets/runic-seal.svg') center / contain no-repeat;
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
  animation: bm-rotate 60s linear infinite;
}

/* Контент шапки — поверх печати */
.rp__detail-titles,
.rp__unlock-btn {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .rp__detail-header::before {
    animation: none;
  }
}

.rp__detail-titles {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rp__detail-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Иконка кристалла в заголовке детального вида */
.rp__crystal-detail {
  flex: none;
}

.rp__detail-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
  margin: 0;
}

.rp__detail-en {
  font-size: 11px;
  color: var(--muted);
  font-style: italic;
}

.rp__unlock-btn {
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid var(--cardln);
  background: var(--card2);
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
  flex: none;
  transition:
    color 0.15s,
    background 0.15s;
}

.rp__unlock-btn.unlocked {
  background: rgba(82, 224, 160, 0.12);
  color: var(--src-f);
  border-color: rgba(82, 224, 160, 0.3);
}

.rp__unlock-btn:hover {
  background: rgba(138, 16, 32, 0.18);
  color: var(--ink);
}

.rp__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 600px) {
  .rp {
    flex-direction: column;
  }

  .rp__sidebar {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--cardln);
  }
}
</style>
