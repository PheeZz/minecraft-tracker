<script setup lang="ts">
// Сетка одного Y-слоя алтаря с реальными текстурами блоков.
// Вынесен из AltarSchematic.vue для соблюдения лимита размера компонента.
import { computed } from 'vue'
import type { AltarLayer } from '../domain/altarLayers'

const props = defineProps<{
  layer: AltarLayer
  // Размер одной клетки в пикселях
  cellPx: number
}>()

// BASE_URL из Vite — учитывает base-путь при сборке (GitHub Pages и т.д.)
const base = import.meta.env.BASE_URL

// Путь к текстуре по виду блока
function textureSrc(kind: string): string | null {
  switch (kind) {
    case 'altar':
      return `${base}bloodmagic/blocks/alchemicalwizardry/BloodAltar_Top.png`
    case 'rune':
    case 'upgrade':
      return `${base}bloodmagic/blocks/alchemicalwizardry/BlankRune.png`
    case 'placement':
      return `${base}bloodmagic/vanilla/blocks/glowstone.png`
    default:
      return null
  }
}

// Русское название вида блока для title-подсказки
const KIND_LABELS: Record<string, string> = {
  altar: 'Алтарь крови',
  rune: 'Кровавая руна',
  upgrade: 'Слот апгрейда',
  placement: 'Глоустоун-столб',
  empty: '',
}

function cellTitle(kind: string, nameRu: string): string {
  return nameRu || KIND_LABELS[kind] || ''
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.layer.width}, ${props.cellPx}px)`,
}))

const cellSize = computed(() => `${props.cellPx}px`)
</script>

<template>
  <div class="alg__grid" :style="gridStyle" role="img" :aria-label="`Слой ${layer.label}`">
    <div
      v-for="(cell, i) in layer.cells"
      :key="i"
      class="alg__cell"
      :class="`alg__cell--${cell.kind}`"
      :style="{ width: cellSize, height: cellSize }"
      :title="cell.kind !== 'empty' ? cellTitle(cell.kind, cell.name_ru) : undefined"
    >
      <!-- Реальная текстура блока (pixelated — стиль MC) -->
      <img
        v-if="textureSrc(cell.kind)"
        :src="textureSrc(cell.kind)!"
        class="alg__tex"
        :class="{ 'alg__tex--upgrade': cell.kind === 'upgrade' }"
        alt=""
        aria-hidden="true"
      />
      <!-- Пустая клетка — едва видимая сетка, без img -->
    </div>
  </div>
</template>

<style scoped>
.alg__grid {
  display: grid;
  gap: 2px;
  line-height: 0;
}

/* Базовая клетка */
.alg__cell {
  position: relative;
  box-sizing: border-box;
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Пустая клетка — еле заметная сетка */
.alg__cell--empty {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Руна — кровавый оттенок под текстуру */
.alg__cell--rune {
  background: rgba(80, 10, 20, 0.4);
}

/* Слот апгрейда — золотая рамка поверх текстуры руны */
.alg__cell--upgrade {
  background: rgba(80, 10, 20, 0.4);
  /* Заметная золотая рамка 2px */
  outline: 2px solid var(--amber);
  outline-offset: -2px;
}

/* Placement (глоустоун) */
.alg__cell--placement {
  background: rgba(40, 30, 10, 0.4);
}

/* Алтарь — акцентный фон */
.alg__cell--altar {
  background: rgba(30, 0, 0, 0.5);
}

/* Текстура: pixelated-рендер в стиле MC, заполняет клетку */
.alg__tex {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  display: block;
}

/* Слот апгрейда: золотая звезда в верхнем правом углу */
.alg__tex--upgrade::after {
  /* pseudo не работает на img — звезда реализована через outline + box-shadow */
  content: '';
}

/* Звезда для upgrade-слота через before на родительской клетке */
.alg__cell--upgrade::after {
  content: '★';
  position: absolute;
  top: 1px;
  right: 2px;
  font-size: 8px;
  line-height: 1;
  color: var(--amber);
  /* Тёмная тень для читаемости на любом фоне */
  text-shadow:
    0 0 3px #000,
    0 0 2px rgba(0, 0, 0, 0.9);
  pointer-events: none;
}
</style>
