<script setup lang="ts">
// Детали выбранного тира: орб, список постройки (delta/полный), схема, разблокировки.
// Расчёты только из domain; компонент — чистый вид.
import { ref, computed } from 'vue'
import { tierBuildList, tierDelta, unlocksAtTier } from '../domain/progression'
import { useProgressStore } from '../stores/useProgressStore'
import AltarSchematic from './AltarSchematic.vue'
import MultiblockView from './MultiblockView.vue'
import { altarVoxels } from '../three/altarVoxels'
import ItemIcon from './ItemIcon.vue'

// Маппинг ref структурного блока → путь к иконке в public/
const BLOCK_ICON: Record<string, string> = {
  largeBloodStoneBrick: 'bloodmagic/blocks/alchemicalwizardry/LargeBloodStoneBrick.png',
  blockCrystal: 'bloodmagic/blocks/alchemicalwizardry/ShardCluster.png',
}

function blockIcon(ref: string): string | undefined {
  return BLOCK_ICON[ref]
}

const props = defineProps<{ tier: number }>()

const store = useProgressStore()
const showFull = ref(false)
/** '3d' по умолчанию, '2d' — плоская схема. */
const viewMode = ref<'3d' | '2d'>('3d')

/** Вокселы текущего тира для 3D-вьюера. */
const currentVoxels = computed(() => altarVoxels(props.tier, import.meta.env.BASE_URL))

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
    <!--
      Текстовая часть (заголовок, орб, список постройки) оборачивается в keyed-Transition
      для плавной смены при переключении тира. MultiblockView/AltarSchematic
      ВЫВЕДЕНЫ за пределы этой обёртки — они не размонтируются при смене тира.
    -->
    <Transition name="tier-fade" mode="out-in">
      <div :key="tier" class="td__text-content">
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
          <div class="td__orb-row">
            <ItemIcon
              v-if="unlocks.orb.icon"
              :item="{
                icon: unlocks.orb.icon,
                name_ru: unlocks.orb.name_ru,
                name_en: unlocks.orb.name_en,
              }"
              :size="22"
            />
            <span class="td__orb-name">{{ unlocks.orb.name_ru }}</span>
          </div>
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
          <li v-if="buildData.bloodRunes > 0" class="td__build-item td__build-item--upgrade">
            <span class="td__build-label">
              <ItemIcon
                :item="{
                  icon: 'bloodmagic/blocks/alchemicalwizardry/BlankRune.png',
                  name_ru: 'Кровавая руна',
                  name_en: 'Blood Rune',
                }"
                :size="16"
                class="td__block-icon"
              />
              <span class="td__build-text">
                Кровавые руны
                <span v-if="showFull && buildData.upgradeSlots" class="td__build-sub">
                  из них апгрейдятся ★ {{ buildData.upgradeSlots }} (скорость/ёмкость/жертва)
                </span>
              </span>
            </span>
            <span class="td__build-count">×{{ buildData.bloodRunes }}</span>
          </li>
          <li v-if="buildData.glowstone > 0" class="td__build-item">
            <span class="td__build-label">
              <ItemIcon
                :item="{
                  icon: 'bloodmagic/vanilla/blocks/glowstone.png',
                  name_ru: 'Глоустоун',
                  name_en: 'Glowstone',
                }"
                :size="16"
                class="td__block-icon"
              />
              Глоустоун-столбы
            </span>
            <span class="td__build-count">×{{ buildData.glowstone }}</span>
          </li>
          <li v-for="s in buildData.structural" :key="s.ref" class="td__build-item">
            <span class="td__build-label">
              <ItemIcon
                v-if="blockIcon(s.ref)"
                :item="{ icon: blockIcon(s.ref), name_ru: s.name_ru, name_en: s.ref }"
                :size="16"
                class="td__block-icon"
              />
              {{ s.name_ru }}
            </span>
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
      </div>
    </Transition>

    <!-- Схема/3D структуры: вынесена ЗА keyed-обёртку, чтобы не ремаунтировалась при смене тира -->
    <div class="td__schematic">
      <div class="td__view-header">
        <p class="td__section-label">Структура</p>
        <div class="td__view-toggle">
          <button
            type="button"
            class="td__view-btn"
            :class="{ 'td__view-btn--active': viewMode === '3d' }"
            @click="viewMode = '3d'"
          >
            3D
          </button>
          <button
            type="button"
            class="td__view-btn"
            :class="{ 'td__view-btn--active': viewMode === '2d' }"
            @click="viewMode = '2d'"
          >
            2D схема
          </button>
        </div>
      </div>
      <!--
        v-show (не v-if): MultiblockView не размонтируется при 2D — 3D-сцена живёт.
        <Transition> поверх v-show даёт кроссфейд/появление БЕЗ размонтажа (нет пустоты).
        grid-stack (.td__views) — оба вида в одной ячейке: плавный кроссфейд без скачка.
        appear — анимация появления 3D при первом показе.
      -->
      <div class="td__views">
        <Transition name="view-fade" appear>
          <MultiblockView v-show="viewMode === '3d'" :blocks="currentVoxels" :height="360" />
        </Transition>
        <Transition name="view-fade">
          <AltarSchematic v-show="viewMode === '2d'" :tier="tier" />
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 2 колонки: слева текст (скроллится), справа структура (sticky — 3D всегда виден,
   длинный список постройки/рецептов больше не уводит его за экран). */
.td {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  gap: 16px;
  padding: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .td {
    grid-template-columns: 1fr;
  }
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

.td__orb-row {
  display: flex;
  align-items: center;
  gap: 6px;
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
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

/* Иконка блока в строке постройки */
.td__block-icon {
  flex: none;
}

/* Обёртка текстового содержимого (имя + подпись апгрейда) */
.td__build-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.td__build-sub {
  font-size: 10px;
  color: var(--amber);
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

/* Схема / 3D */
.td__schematic {
  display: flex;
  flex-direction: column;
  gap: 6px;
  grid-column: 2; /* правая колонка; закреплена, чтобы не прыгать при смене текста */
  position: sticky;
  top: 0;
  align-self: start;
}

@media (max-width: 900px) {
  .td__schematic {
    grid-column: 1;
    position: static;
  }
}

/* Стек видов 2D/3D в одной ячейке — кроссфейд без скачка высоты при переключении */
.td__views {
  display: grid;
}

.td__views > * {
  grid-area: 1 / 1;
}

/* Переход/появление 3D и 2D: fade + лёгкий зум */
.view-fade-enter-active,
.view-fade-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .view-fade-enter-active,
  .view-fade-leave-active {
    transition: opacity 0.12s ease;
  }

  .view-fade-enter-from,
  .view-fade-leave-to {
    transform: none;
  }
}

.td__view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.td__view-toggle {
  display: flex;
  gap: 3px;
}

.td__view-btn {
  font: inherit;
  font-size: 10px;
  padding: 3px 8px;
  border: 1px solid var(--cardln);
  border-radius: 5px;
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
  transition:
    border-color 0.1s,
    color 0.1s,
    background 0.1s;
}

.td__view-btn:hover:not(.td__view-btn--active) {
  border-color: var(--honey);
  color: var(--ink);
}

.td__view-btn--active {
  background: rgba(138, 16, 32, 0.2);
  border-color: var(--solid);
  color: var(--ink);
  font-weight: 700;
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

/* Переход при смене тира: fade + лёгкий сдвиг по Y (ранее был в BloodPathPanel) */
.tier-fade-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tier-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.tier-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tier-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Обёртка текстовой части — display:flex для сохранения layout */
/* Реальный flex-box (НЕ display:contents): на contents-элементе CSS-переходы
   не работают — tier-fade не анимировался. Повторяем колонку с gap как у .td. */
.td__text-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  grid-column: 1; /* левая колонка */
  min-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tier-fade-enter-active,
  .tier-fade-leave-active {
    transition: opacity 0.1s ease;
  }

  .tier-fade-enter-from,
  .tier-fade-leave-to {
    transform: none;
  }
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
  /* Кап высоты: длинный список рецептов не растягивает страницу и не уводит 3D вниз */
  max-height: 168px;
  overflow-y: auto;
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
