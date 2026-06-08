<script setup lang="ts">
// Компонент top-down схемы мультиблок-структуры алтаря BloodMagic.
// Режим large=true — для диалога (крупные клетки, до ~400px ширины).
import { computed } from 'vue'
import { altarFootprint } from '../domain/altarFootprint'
import type { FootCell } from '../domain/altarFootprint'

const props = defineProps<{ tier: number; large?: boolean }>()

const footprint = computed(() => altarFootprint(props.tier))

// В большом режиме (диалог) — вписываем в 400px; в маленьком (инлайн) — 220px
const GRID_MAX_PX = computed(() => (props.large ? 400 : 220))

// Размер клетки: вписываем всю сетку в максимальную ширину.
// Минимум 12px чтобы клетки не были невидимыми на T6.
const cellPx = computed(() =>
  Math.max(
    12,
    Math.floor(GRID_MAX_PX.value / Math.max(footprint.value.width, footprint.value.height)),
  ),
)

// CSS grid через inline-style; overflowX приведён к допустимому типу CSS-свойства
const gridStyle = computed(() => {
  const needsScroll = props.large && footprint.value.width * cellPx.value > GRID_MAX_PX.value
  return {
    gridTemplateColumns: `repeat(${footprint.value.width}, ${cellPx.value}px)`,
    width: `${footprint.value.width * cellPx.value}px`,
    maxWidth: `${GRID_MAX_PX.value}px`,
    overflowX: (needsScroll ? 'auto' : undefined) as 'auto' | undefined,
  }
})

// Метка многослойности: показываем «×N» когда ≥2 слоёв
function layerLabel(cell: FootCell): string {
  return cell.layers >= 2 ? `×${cell.layers}` : ''
}

// CSS-класс модификатора клетки
function cellMod(cell: FootCell): string {
  return `sc__cell--${cell.kind}`
}
</script>

<template>
  <!-- T1: упрощённое сообщение вместо пустой сетки -->
  <div v-if="tier <= 1" class="sc sc--empty">
    <span class="sc__hint">Тир 1 · только алтарь, структура не нужна</span>
  </div>

  <div v-else class="sc">
    <span class="sc__sublabel">вид сверху</span>

    <div class="sc__grid" :style="gridStyle" role="img" :aria-label="`Схема алтаря тир ${tier}`">
      <div
        v-for="(cell, i) in footprint.cells"
        :key="i"
        class="sc__cell"
        :class="cellMod(cell)"
        :style="{ width: `${cellPx}px`, height: `${cellPx}px` }"
        :title="
          cell.kind !== 'empty'
            ? `(${cell.x},${cell.z})${cell.layers > 1 ? ` ×${cell.layers}` : ''}`
            : undefined
        "
      >
        <!-- Алтарь: символ-акцент в центре -->
        <span v-if="cell.kind === 'altar'" class="sc__altar-icon" aria-hidden="true">✦</span>
        <!-- Маркер столбов: «×N» контрастным текстом в правом нижнем углу -->
        <span v-else-if="layerLabel(cell)" class="sc__layers" aria-hidden="true">{{
          layerLabel(cell)
        }}</span>
      </div>
    </div>

    <!-- Легенда: одна строка под схемой -->
    <div class="sc__legend" aria-hidden="true">
      <span class="sc__leg-item"> <span class="sc__leg-dot sc__leg-dot--altar" />алтарь </span>
      <span class="sc__leg-sep">·</span>
      <span class="sc__leg-item"> <span class="sc__leg-dot sc__leg-dot--rune" />руна </span>
      <span class="sc__leg-sep">·</span>
      <span class="sc__leg-item">
        <span class="sc__leg-dot sc__leg-dot--upgrade" />слот апгрейда
      </span>
      <span class="sc__leg-sep">·</span>
      <span class="sc__leg-item"> <span class="sc__leg-dot sc__leg-dot--placement" />маяк </span>
      <span class="sc__leg-sep">·</span>
      <span class="sc__leg-item sc__leg-item--stack">
        <span class="sc__leg-dot sc__leg-dot--rune" /><span class="sc__leg-stackmark">×N</span
        >&thinsp;столб
      </span>
    </div>
  </div>
</template>

<style scoped>
.sc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.sc--empty {
  padding: 6px 0;
}

.sc__hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--dim);
  font-style: italic;
}

.sc__sublabel {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sc__grid {
  display: grid;
  gap: 1px;
  line-height: 0;
}

/* ── Клетки ── */
.sc__cell {
  position: relative;
  border-radius: 1px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Пустая клетка — едва видимая сетка */
.sc__cell--empty {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* Руна — приглушённый кровавый квадрат БЕЗ золотой обводки */
.sc__cell--rune {
  background: rgba(138, 16, 32, 0.55);
  border: 1px solid rgba(224, 52, 74, 0.35);
}

/* Слот апгрейда — ТОЛЬКО эта клетка золотая */
.sc__cell--upgrade {
  background: rgba(80, 50, 0, 0.6);
  border: 2px solid var(--amber);
  box-shadow: inset 0 0 3px rgba(255, 207, 107, 0.18);
}

/* Placement (маяк/глоустоун) — приглушённый фиолет */
.sc__cell--placement {
  background: rgba(80, 40, 120, 0.6);
  border: 1px solid rgba(180, 100, 255, 0.45);
}

/* Алтарь — яркий центральный акцент: кровавый с подсветкой */
.sc__cell--altar {
  background: var(--solid);
  border: 1px solid var(--honey-dk);
  box-shadow: 0 0 5px rgba(224, 52, 74, 0.7);
}

/* Иконка алтаря */
.sc__altar-icon {
  font-size: 0.6em;
  color: var(--honey-dk);
  line-height: 1;
  display: block;
}

/* Маркер столбов: «×N» в нижнем правом углу, контрастный цвет */
.sc__layers {
  position: absolute;
  bottom: 0;
  right: 1px;
  font-size: 6px;
  font-family: var(--font-mono);
  font-weight: 900;
  /* Белый текст с тёмной тенью — читается на любом фоне клетки */
  color: #fff;
  text-shadow:
    0 0 2px #000,
    0 0 3px rgba(0, 0, 0, 0.8);
  line-height: 1;
  pointer-events: none;
  letter-spacing: -0.03em;
}

/* ── Легенда ── */
.sc__legend {
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--dim);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
  row-gap: 2px;
}

.sc__leg-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.sc__leg-item--stack {
  gap: 1px;
}

.sc__leg-stackmark {
  font-size: 7px;
  color: var(--amber);
  font-weight: 900;
}

.sc__leg-sep {
  color: var(--dim);
  opacity: 0.5;
}

.sc__leg-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 1px;
  flex: none;
}

.sc__leg-dot--altar {
  background: var(--solid);
  border: 1px solid var(--honey-dk);
}

.sc__leg-dot--rune {
  background: rgba(138, 16, 32, 0.55);
  border: 1px solid rgba(224, 52, 74, 0.35);
}

/* Слот апгрейда в легенде — тоже золотой */
.sc__leg-dot--upgrade {
  background: rgba(80, 50, 0, 0.6);
  border: 2px solid var(--amber);
}

.sc__leg-dot--placement {
  background: rgba(80, 40, 120, 0.6);
  border: 1px solid rgba(180, 100, 255, 0.45);
}
</style>
