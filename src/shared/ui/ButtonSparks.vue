<script setup lang="ts">
// Бёрст частиц при активации кнопки трекера: из центра разлетается горстка
// маленьких копий иконки домена (вверх веером, с вращением и затуханием).
// Срабатывает только в момент false→true (переключение), уважает reduce-motion.
import { ref, watch, onUnmounted } from 'vue'
import IconBase from './IconBase.vue'
import type { IconName } from '@/shared/icons/icons'

const props = defineProps<{ icon: IconName; active: boolean }>()

interface Spark {
  id: number
  dx: string
  dy: string
  rot: string
  delay: string
  scale: string
}

const sparks = ref<Spark[]>([])
let seq = 0
let clearTimer = 0

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function burst(): void {
  if (prefersReduced()) return
  const COUNT = 8
  const batch: Spark[] = []
  for (let i = 0; i < COUNT; i++) {
    // веер вверх: угол около −90° (вверх) с разбросом ±78°
    const angle = (-90 + (Math.random() * 156 - 78)) * (Math.PI / 180)
    const dist = 30 + Math.random() * 36
    batch.push({
      id: ++seq,
      dx: `${(Math.cos(angle) * dist).toFixed(1)}px`,
      dy: `${(Math.sin(angle) * dist).toFixed(1)}px`,
      rot: `${Math.round(Math.random() * 160 - 80)}deg`,
      delay: `${Math.round(Math.random() * 90)}ms`,
      scale: `${(0.6 + Math.random() * 0.5).toFixed(2)}`,
    })
  }
  sparks.value = batch
  window.clearTimeout(clearTimer)
  clearTimer = window.setTimeout(() => {
    sparks.value = []
  }, 1000)
}

watch(
  () => props.active,
  (now, prev) => {
    if (now && !prev) burst()
  },
)

onUnmounted(() => window.clearTimeout(clearTimer))
</script>

<template>
  <span class="bsp" aria-hidden="true">
    <span
      v-for="s in sparks"
      :key="s.id"
      class="bsp__p"
      :style="{
        '--dx': s.dx,
        '--dy': s.dy,
        '--rot': s.rot,
        '--sc': s.scale,
        animationDelay: s.delay,
      }"
    >
      <IconBase :name="icon" />
    </span>
  </span>
</template>

<style scoped>
.bsp {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}

.bsp__p {
  position: absolute;
  top: 38%;
  left: 22px;
  width: 12px;
  height: 12px;
  color: var(--honey, var(--leaf, var(--accent)));
  opacity: 0;
  will-change: transform, opacity;
  animation: bsp-fly 0.85s ease-out forwards;
}

.bsp__p :deep(svg) {
  width: 12px;
  height: 12px;
  display: block;
}

@keyframes bsp-fly {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0;
  }
  18% {
    opacity: 0.95;
  }
  100% {
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(var(--sc))
      rotate(var(--rot));
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bsp__p {
    display: none;
  }
}
</style>
