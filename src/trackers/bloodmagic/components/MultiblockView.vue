<script setup lang="ts">
// Ленивый мост между Vue и three.js-сценой.
// three грузится только при монтировании этого компонента,
// не попадая в общий бандл.
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { VoxelBlock } from '../three/voxelTypes'
import type { VoxelSceneHandle } from '../three/voxelScene'

const props = withDefaults(defineProps<{ blocks: VoxelBlock[]; height?: number }>(), {
  height: 360,
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

// Тултип
const tooltip = ref<{ label: string; x: number; y: number } | null>(null)

let sceneHandle: VoxelSceneHandle | null = null
let resizeObserver: ResizeObserver | null = null
// Токен поколения: сериализует перекрывающиеся initScene (быстрые смены тира),
// чтобы устаревший вызов не оставил осиротевший renderer (утечка WebGL-контекста).
let initGen = 0

function onHover(block: VoxelBlock | null, screenX: number, screenY: number) {
  if (!block) {
    tooltip.value = null
    return
  }
  const rect = canvasRef.value?.getBoundingClientRect()
  const offsetX = rect ? screenX - rect.left + 12 : screenX
  const offsetY = rect ? screenY - rect.top - 8 : screenY
  tooltip.value = { label: block.label, x: offsetX, y: offsetY }
}

async function initScene() {
  if (!canvasRef.value) return
  const gen = ++initGen
  loading.value = true
  loadError.value = null

  try {
    // Ленивая загрузка three.js — попадёт в отдельный чанк
    const [THREE, { OrbitControls }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
    ])

    const { createVoxelScene } = await import('../three/voxelScene')

    // Устарел (размонтирован или перекрыт более новым вызовом) — выходим, не создавая renderer
    if (!canvasRef.value || gen !== initGen) return

    sceneHandle?.dispose()
    sceneHandle = createVoxelScene(canvasRef.value, THREE, OrbitControls, props.blocks, { onHover })
  } catch (e) {
    if (gen === initGen) loadError.value = 'Не удалось загрузить 3D-рендерер'
    console.error('[MultiblockView]', e)
  } finally {
    if (gen === initGen) loading.value = false
  }
}

function setupResizeObserver() {
  if (!containerRef.value) return
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const { width, height: h } = entry.contentRect
    sceneHandle?.resize(width, h)
  })
  resizeObserver.observe(containerRef.value)
}

onMounted(async () => {
  await initScene()
  setupResizeObserver()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  sceneHandle?.dispose()
  sceneHandle = null
})

// При смене пропа blocks — обновляем содержимое сцены без пересоздания renderer.
// Полный initScene вызывается только при монтировании (первое создание).
watch(
  () => props.blocks,
  (newBlocks) => {
    if (sceneHandle) {
      sceneHandle.update(newBlocks)
    } else {
      // Сцена ещё не готова (initScene в процессе) — ждём onMounted
    }
  },
)
</script>

<template>
  <div ref="containerRef" class="mbv" :style="{ height: `${height}px` }">
    <!-- Состояние загрузки three.js -->
    <div v-if="loading" class="mbv__loading">
      <span class="mbv__loading-dot" />
      <span class="mbv__loading-dot" />
      <span class="mbv__loading-dot" />
      <span class="mbv__loading-text">Загрузка 3D…</span>
    </div>

    <!-- Ошибка инициализации -->
    <div v-else-if="loadError" class="mbv__error">{{ loadError }}</div>

    <!-- Холст сцены -->
    <canvas ref="canvasRef" class="mbv__canvas" />

    <!-- HTML-тултип над курсором -->
    <div
      v-if="tooltip"
      class="mbv__tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      {{ tooltip.label }}
    </div>
  </div>
</template>

<style scoped>
.mbv {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1010;
}

.mbv__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Оверлей загрузки */
.mbv__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #1a1010;
  z-index: 2;
}

.mbv__loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8a1020;
  animation: mbv-pulse 1s ease-in-out infinite;
}

.mbv__loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.mbv__loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes mbv-pulse {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.mbv__loading-text {
  font-size: 12px;
  color: #7a5050;
  margin-left: 4px;
}

.mbv__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #cc4444;
  background: #1a1010;
}

/* Тултип */
.mbv__tooltip {
  position: absolute;
  pointer-events: none;
  background: rgba(20, 8, 8, 0.92);
  border: 1px solid #8a1020;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 11px;
  color: #f0d8d8;
  white-space: nowrap;
  z-index: 10;
  transform: translateY(-50%);
}
</style>
