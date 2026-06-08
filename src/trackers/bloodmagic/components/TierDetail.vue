<script setup lang="ts">
// Детали выбранного тира: орб, список постройки (delta/полный), схема, разблокировки.
// Расчёты только из domain; компонент — чистый вид.
import { ref, computed } from 'vue'
import { tierBuildList, tierDelta, unlocksAtTier } from '../domain/progression'
import { useProgressStore } from '../stores/useProgressStore'
import AltarSchematic from './AltarSchematic.vue'

const props = defineProps<{ tier: number }>()

const store = useProgressStore()
const showFull = ref(false)

const buildData = computed(() =>
  showFull.value ? tierBuildList(props.tier) : tierDelta(props.tier),
)
const unlocks = computed(() => unlocksAtTier(props.tier))

/** LP → «150 000» с пробелами-разделителями тысяч. */
function formatLP(lp: number): string {
  return lp.toLocaleString('ru-RU')
}

const isBuilt = computed(() => store.isBuilt(props.tier))
</script>

<template>
  <section class="td">
    <!-- Заголовок тира + чекбокс «построено» -->
    <header class="td__head">
      <h2 class="td__title">Тир {{ tier }}</h2>
      <label class="td__built-label">
        <input
          type="checkbox"
          :checked="isBuilt"
          class="td__built-check"
          @change="store.toggleTier(tier)"
        />
        <span class="td__built-text">{{ isBuilt ? 'Построено' : 'Отметить построенным' }}</span>
      </label>
    </header>

    <!-- Орб этого тира -->
    <div v-if="unlocks.orb" class="td__orb">
      <span class="td__orb-name">{{ unlocks.orb.name_ru }}</span>
      <span class="td__orb-stats">
        {{ formatLP(unlocks.orb.capacity_LP) }} LP · расход
        {{ unlocks.orb.consumptionRate }} LP/операцию
      </span>
    </div>
    <div v-else class="td__orb td__orb--none">Орб этого тира не найден</div>

    <!-- Переключатель полный/дельта -->
    <div class="td__mode-row">
      <button
        type="button"
        class="td__mode-btn"
        :class="{ 'td__mode-btn--active': !showFull }"
        @click="showFull = false"
      >
        Только прирост (Т{{ tier }} − Т{{ tier - 1 }})
      </button>
      <button
        type="button"
        class="td__mode-btn"
        :class="{ 'td__mode-btn--active': showFull }"
        @click="showFull = true"
      >
        Вся структура
      </button>
    </div>

    <!-- Список строительных блоков -->
    <ul class="td__build-list">
      <li v-if="buildData.bloodRunes > 0" class="td__build-item">
        <span class="td__build-label">Кровавые руны</span>
        <span class="td__build-count">×{{ buildData.bloodRunes }}</span>
      </li>
      <li v-if="buildData.upgradeSlots > 0" class="td__build-item td__build-item--upgrade">
        <span class="td__build-label">Слоты апгрейда ★</span>
        <span class="td__build-count">×{{ buildData.upgradeSlots }}</span>
      </li>
      <li v-if="buildData.glowstone > 0" class="td__build-item">
        <span class="td__build-label">Глоустоун-столбы</span>
        <span class="td__build-count">×{{ buildData.glowstone }}</span>
      </li>
      <li v-for="s in buildData.structural" :key="s.ref" class="td__build-item">
        <span class="td__build-label">{{ s.name_ru }}</span>
        <span class="td__build-count">×{{ s.count }}</span>
      </li>
      <li
        v-if="
          !buildData.bloodRunes &&
          !buildData.upgradeSlots &&
          !buildData.glowstone &&
          !buildData.structural.length
        "
        class="td__build-empty"
      >
        {{ showFull ? 'Только алтарь' : 'Нет изменений к предыдущему тиру' }}
      </li>
    </ul>

    <!-- Схема структуры -->
    <div class="td__schematic">
      <p class="td__section-label">Схема структуры</p>
      <AltarSchematic :tier="tier" />
    </div>

    <!-- Разблокировки: рецепты -->
    <div v-if="unlocks.recipes.length" class="td__unlocks">
      <p class="td__section-label">Разблокирует рецептов: {{ unlocks.recipes.length }}</p>
      <ul class="td__recipe-list">
        <li v-for="r in unlocks.recipes" :key="r.output.name_en" class="td__recipe-item">
          {{ r.output.name_ru }}
          <span v-if="r.lp" class="td__recipe-lp">{{ formatLP(r.lp) }} LP</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.td {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

/* Заголовок */
.td__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.td__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  color: var(--honey-dk);
}

.td__built-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--muted);
}

.td__built-check {
  accent-color: var(--src-f);
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.td__built-text {
  user-select: none;
}

/* Орб */
.td__orb {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: rgba(138, 16, 32, 0.12);
  border: 1px solid var(--cardln);
  border-radius: 8px;
}

.td__orb--none {
  color: var(--dim);
  font-size: 12px;
}

.td__orb-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--ink);
}

.td__orb-stats {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

/* Переключатель режима */
.td__mode-row {
  display: flex;
  gap: 4px;
}

.td__mode-btn {
  font: inherit;
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid var(--cardln);
  border-radius: 6px;
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
  transition:
    border-color 0.1s,
    color 0.1s,
    background 0.1s;
}

.td__mode-btn:hover:not(.td__mode-btn--active) {
  border-color: var(--honey);
  color: var(--ink);
}

.td__mode-btn--active {
  background: rgba(138, 16, 32, 0.2);
  border-color: var(--solid);
  color: var(--ink);
  font-weight: 700;
}

/* Список блоков */
.td__build-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.td__build-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 6px;
  font-size: 12px;
}

.td__build-item--upgrade {
  border-left: 3px solid var(--amber);
}

.td__build-label {
  color: var(--ink2);
}

.td__build-count {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--honey-dk);
}

.td__build-empty {
  font-size: 12px;
  color: var(--dim);
  font-style: italic;
  padding: 4px 0;
}

/* Схема */
.td__schematic {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.td__section-label {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Разблокировки */
.td__unlocks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.td__recipe-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.td__recipe-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 6px;
  font-size: 12px;
  color: var(--ink2);
}

.td__recipe-lp {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
}
</style>
