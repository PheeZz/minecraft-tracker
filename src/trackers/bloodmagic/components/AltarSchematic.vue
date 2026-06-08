<script setup lang="ts">
// Компонент послойной схемы мультиблок-структуры алтаря BloodMagic.
// Режим large=true — для диалога (крупные клетки, повышенное разрешение).
// Режим overview (по умолчанию) — top-down проекция всех слоёв без разделения.
import { ref, computed } from 'vue'
import { altarLayers, altarOverview } from '../domain/altarLayers'
import { ALTAR_TIERS } from '../data/altar.data'
import AltarLayerGrid from './AltarLayerGrid.vue'

const props = defineProps<{ tier: number; large?: boolean }>()

const base = import.meta.env.BASE_URL

const layers = computed(() => altarLayers(props.tier))
const overview = computed(() => altarOverview(props.tier))

// Данные тира для сводки
const tierData = computed(() => ALTAR_TIERS.find((t) => t.tier === props.tier))

// Доступная ширина для сетки: 580px в large (диалог 620 − 2×20px паддинга), 256px inline
const AVAILABLE_PX = computed(() => (props.large ? 580 : 256))
const MIN_CELL = 14
const MAX_CELL = 40

// Размер клетки: вписываем весь grid в доступную ширину без горизонтального скролла.
// Формула учитывает gap 2px между клетками: total = dim*cell + (dim-1)*2
// => cell = floor((available - (dim-1)*2) / dim), затем clamp(MIN, ..., MAX)
const cellPx = computed(() => {
  const dim = Math.max(overview.value?.width ?? 1, overview.value?.height ?? 1)
  const fitCell = Math.floor((AVAILABLE_PX.value - (dim - 1) * 2) / dim)
  return Math.min(MAX_CELL, Math.max(MIN_CELL, fitCell))
})

// null = режим overview, число = индекс слоя
const activeLayerIndex = ref<number | null>(null)

const isOverview = computed(() => activeLayerIndex.value === null)

const currentLayer = computed(() =>
  isOverview.value ? overview.value : (layers.value[activeLayerIndex.value!] ?? null),
)

// Подпись под сеткой
const gridCaption = computed(() =>
  isOverview.value
    ? `Вид сверху · все ${layers.value.length} слоёв`
    : (currentLayer.value?.label ?? ''),
)

// Сводка по тиру
const summary = computed(() => {
  const td = tierData.value
  if (!td) return ''
  const n = layers.value.length
  return `Тир ${props.tier} · ${td.runeCount} рун · ${td.upgradeSlots} слотов апгрейда · ${n} слоёв`
})

function selectOverview(): void {
  activeLayerIndex.value = null
}

function selectLayer(i: number): void {
  activeLayerIndex.value = i
}

// Клавиатурная навигация по степперу (−1 = кнопка overview)
function onStepperKey(e: KeyboardEvent, i: number): void {
  const lastIdx = layers.value.length - 1
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (i === -1) selectLayer(0)
    else selectLayer(Math.min(i + 1, lastIdx))
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (i === 0) selectOverview()
    else if (i > 0) selectLayer(i - 1)
  }
}
</script>

<template>
  <!-- T1: только алтарь, схема не нужна -->
  <div v-if="tier <= 1" class="sc sc--t1">
    <div class="sc__t1-wrap">
      <img
        :src="`${base}bloodmagic/blocks/alchemicalwizardry/BloodAltar_Top.png`"
        class="sc__t1-img"
        alt="Алтарь крови"
      />
      <span class="sc__t1-hint">Тир 1 · только алтарь, окружающая структура не нужна</span>
    </div>
  </div>

  <div v-else class="sc">
    <!-- Сводка тира -->
    <p class="sc__summary">{{ summary }}</p>

    <!-- Крупная легенда сверху -->
    <div class="sc__legend" aria-label="Обозначения блоков">
      <div class="sc__leg-item">
        <img
          :src="`${base}bloodmagic/blocks/alchemicalwizardry/BloodAltar_Top.png`"
          class="sc__leg-tex"
          alt=""
          aria-hidden="true"
        />
        <span>Алтарь</span>
      </div>
      <div class="sc__leg-item">
        <img
          :src="`${base}bloodmagic/blocks/alchemicalwizardry/BlankRune.png`"
          class="sc__leg-tex"
          alt=""
          aria-hidden="true"
        />
        <span>Кровавая руна</span>
      </div>
      <div class="sc__leg-item">
        <div class="sc__leg-tex sc__leg-upgrade-wrap">
          <img
            :src="`${base}bloodmagic/blocks/alchemicalwizardry/BlankRune.png`"
            class="sc__leg-tex-inner"
            alt=""
            aria-hidden="true"
          />
          <span class="sc__leg-star" aria-hidden="true">★</span>
        </div>
        <span>Слот апгрейда</span>
      </div>
      <div class="sc__leg-item">
        <img
          :src="`${base}bloodmagic/vanilla/blocks/glowstone.png`"
          class="sc__leg-tex"
          alt=""
          aria-hidden="true"
        />
        <span>Глоустоун-столб</span>
      </div>
    </div>

    <!-- Степпер слоёв: кнопка «Вся компоновка» + послойные кнопки -->
    <div class="sc__stepper" role="tablist" aria-label="Слои структуры алтаря">
      <!-- Кнопка overview — активна по умолчанию при открытии -->
      <button
        type="button"
        class="sc__step sc__step--overview"
        :class="{ 'sc__step--active': isOverview }"
        role="tab"
        :aria-selected="isOverview"
        :aria-current="isOverview ? 'true' : undefined"
        :tabindex="isOverview ? 0 : -1"
        @click="selectOverview"
        @keydown="onStepperKey($event, -1)"
      >
        <span class="sc__step-label">Вся компоновка</span>
      </button>

      <button
        v-for="(layer, i) in layers"
        :key="layer.y"
        type="button"
        class="sc__step"
        :class="{ 'sc__step--active': !isOverview && i === activeLayerIndex }"
        role="tab"
        :aria-selected="!isOverview && i === activeLayerIndex"
        :aria-current="!isOverview && i === activeLayerIndex ? 'true' : undefined"
        :tabindex="!isOverview && i === activeLayerIndex ? 0 : -1"
        @click="selectLayer(i)"
        @keydown="onStepperKey($event, i)"
      >
        <span class="sc__step-label">{{ layer.label }}</span>
        <span class="sc__step-count">{{ layer.count }}</span>
      </button>
    </div>

    <!-- Сетка активного режима (overview или конкретный слой) -->
    <div v-if="currentLayer" class="sc__grid-wrap" role="tabpanel" :aria-label="gridCaption">
      <p class="sc__grid-caption">{{ gridCaption }}</p>
      <AltarLayerGrid :layer="currentLayer" :cell-px="cellPx" />
    </div>
  </div>
</template>

<style scoped>
.sc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

/* ── T1 ── */
.sc--t1 {
  padding: 4px 0;
}

.sc__t1-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sc__t1-img {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  border-radius: 4px;
}

.sc__t1-hint {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--dim);
  font-style: italic;
}

/* ── Сводка ── */
.sc__summary {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--ink2);
  letter-spacing: 0.01em;
}

/* ── Легенда ── */
.sc__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding: 8px 10px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
}

.sc__leg-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink2);
}

/* Квадрат текстуры в легенде */
.sc__leg-tex {
  width: 22px;
  height: 22px;
  image-rendering: pixelated;
  border-radius: 2px;
  flex: none;
  display: block;
}

/* Слот апгрейда в легенде: текстура + gold outline + звезда */
.sc__leg-upgrade-wrap {
  position: relative;
  width: 22px;
  height: 22px;
  outline: 2px solid var(--amber);
  outline-offset: -1px;
  border-radius: 2px;
  overflow: hidden;
  flex: none;
}

.sc__leg-tex-inner {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  display: block;
}

.sc__leg-star {
  position: absolute;
  top: 0;
  right: 1px;
  font-size: 9px;
  line-height: 1;
  color: var(--amber);
  text-shadow: 0 0 3px #000;
  pointer-events: none;
}

/* ── Степпер ── */
.sc__stepper {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sc__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 4px 8px;
  font: inherit;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink2);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.2;
  transition:
    border-color 0.1s,
    color 0.1s;
}

.sc__step:hover {
  border-color: var(--honey-dk);
  color: var(--ink);
}

.sc__step:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}

/* Активный слой в степпере */
.sc__step--active {
  background: rgba(138, 16, 32, 0.18);
  border-color: var(--solid);
  color: var(--ink);
  font-weight: 700;
}

.sc__step-label {
  font-size: 11px;
}

/* Счётчик блоков в степпере — маленький dim-текст */
.sc__step-count {
  font-size: 9px;
  color: var(--dim);
  font-weight: 400;
}

/* Кнопка «Вся компоновка» чуть шире и с отделяющим отступом справа */
.sc__step--overview {
  padding-inline: 12px;
  margin-right: 4px;
  border-right: 1px solid var(--cardln);
}

/* ── Сетка ── */
.sc__grid-wrap {
  overflow-x: auto;
}

/* Подпись над сеткой (вид сверху / название слоя) */
.sc__grid-caption {
  margin: 0 0 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--dim);
}
</style>
