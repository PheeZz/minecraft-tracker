<script setup lang="ts">
// Фоновый эмбиент частиц, своя «подпись» у каждого трекера: угли поднимаются
// (кровь/таумкрафт/генетика), листья/пыльца опадают (деревья), пыльца дрейфует (пчёлы).
// Цвет берётся из темы (--honey/--leaf). Слой поверх контента, но прозрачный и редкий —
// читаемость не страдает. Полностью отключается при prefers-reduced-motion.
import { computed } from 'vue'
import type { TrackerId } from '@/shared/registry/trackers'

const props = defineProps<{ tracker: TrackerId }>()

type Drift = 'rise' | 'fall'
interface AmbientConfig {
  count: number
  drift: Drift
  opacity: number
  sizeMin: number
  sizeMax: number
  durMin: number
  durMax: number
}

// Параметры эмбиента по трекеру (цвет — из CSS-темы, не здесь).
const CONFIGS: Record<string, AmbientConfig> = {
  trees: { count: 16, drift: 'fall', opacity: 0.5, sizeMin: 4, sizeMax: 9, durMin: 13, durMax: 22 },
  bees: { count: 16, drift: 'rise', opacity: 0.45, sizeMin: 3, sizeMax: 6, durMin: 12, durMax: 20 },
  genetics: {
    count: 13,
    drift: 'rise',
    opacity: 0.4,
    sizeMin: 3,
    sizeMax: 6,
    durMin: 14,
    durMax: 24,
  },
  thaumcraft: {
    count: 15,
    drift: 'rise',
    opacity: 0.5,
    sizeMin: 3,
    sizeMax: 7,
    durMin: 12,
    durMax: 22,
  },
  bloodmagic: {
    count: 18,
    drift: 'rise',
    opacity: 0.55,
    sizeMin: 3,
    sizeMax: 7,
    durMin: 10,
    durMax: 18,
  },
}

const prefersReduced =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Детерминированный ПСЧ (без Math.random в шаблоне) — стабильные частицы на ре-рендер.
function rng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

interface Particle {
  id: number
  left: number
  size: number
  dur: number
  delay: number
  sway: number
  drift: Drift
  opacity: number
}

// Частицы пересобираются при смене трекера (ключ во v-for включает tracker).
const particles = computed<Particle[]>(() => {
  if (prefersReduced) return []
  const cfg = CONFIGS[props.tracker] ?? CONFIGS.bloodmagic!
  const rand = rng(props.tracker.length * 9973 + cfg.count * 31)
  const out: Particle[] = []
  for (let i = 0; i < cfg.count; i++) {
    out.push({
      id: i,
      left: rand() * 100,
      size: cfg.sizeMin + rand() * (cfg.sizeMax - cfg.sizeMin),
      dur: cfg.durMin + rand() * (cfg.durMax - cfg.durMin),
      delay: -rand() * cfg.durMax, // отрицательный — поле сразу «населено», не пустует на старте
      sway: (rand() * 2 - 1) * 40,
      drift: cfg.drift,
      opacity: cfg.opacity * (0.6 + rand() * 0.4),
    })
  }
  return out
})
</script>

<template>
  <div class="amb" aria-hidden="true">
    <span
      v-for="p in particles"
      :key="`${tracker}-${p.id}`"
      class="amb__p"
      :class="`amb__p--${p.drift}`"
      :style="{
        left: `${p.left}%`,
        width: `${p.size}px`,
        height: `${p.size}px`,
        opacity: p.opacity,
        '--dur': `${p.dur}s`,
        '--sway': `${p.sway}px`,
        animationDelay: `${p.delay}s`,
      }"
    />
  </div>
</template>

<style scoped>
.amb {
  position: fixed;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  overflow: hidden;
}

.amb__p {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, var(--honey, var(--leaf)) 0%, transparent 70%);
  filter: blur(0.4px);
  will-change: transform, opacity;
}

.amb__p--rise {
  bottom: -5vh;
  animation: amb-rise var(--dur) linear infinite;
}

.amb__p--fall {
  top: -5vh;
  animation: amb-fall var(--dur) linear infinite;
}

@keyframes amb-rise {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(var(--sway), -110vh, 0);
  }
}

@keyframes amb-fall {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(var(--sway), 110vh, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .amb {
    display: none;
  }
}
</style>
