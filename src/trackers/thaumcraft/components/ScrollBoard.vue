<script setup lang="ts">
import { computed } from 'vue'
import type { Research } from '../domain/types'
import { ASPECT_BY_TAG, solveResearch } from '../domain/aspects'
import { layoutSolution, axialToPixel } from '../domain/hexLayout'
import AspectHex from './AspectHex.vue'

const props = defineProps<{ research: Research }>()

const SIZE = 44 // радиус гекса (axial)
const HEXW = Math.sqrt(3) * SIZE
const HEXH = 2 * SIZE
const PAD = HEXW / 2 + 12

const requiredTags = computed(() => Object.keys(props.research.aspects))

const solution = computed(() => solveResearch(requiredTags.value))

// перезапуск анимации появления при смене свитка: меняем ключ → Vue
// пересоздаёт узлы, CSS-анимации стартуют заново
const runKey = computed(() => props.research.key)

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

const board = computed(() => {
  const sol = solution.value
  const pos = layoutSolution(sol)
  if (pos.size === 0) return null

  // заполним поле пустыми ячейками в ограничивающем регионе (±1 кольцо)
  let minQ = Infinity,
    maxQ = -Infinity,
    minR = Infinity,
    maxR = -Infinity
  for (const { q, r } of pos.values()) {
    minQ = Math.min(minQ, q)
    maxQ = Math.max(maxQ, q)
    minR = Math.min(minR, r)
    maxR = Math.max(maxR, r)
  }
  const field: Array<{ q: number; r: number }> = []
  for (let r = minR - 1; r <= maxR + 1; r++)
    for (let q = minQ - 1; q <= maxQ + 1; q++) field.push({ q, r })

  // границы в пикселях
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const { q, r } of field) {
    const { x, y } = axialToPixel(q, r, SIZE)
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  const W = Math.round(maxX - minX + PAD * 2)
  const H = Math.round(maxY - minY + PAD * 2)
  const center = (q: number, r: number): { cx: number; cy: number } => {
    const { x, y } = axialToPixel(q, r, SIZE)
    return { cx: x - minX + PAD, cy: y - minY + PAD }
  }

  const required = new Set(requiredTags.value)
  const cells = [...pos.entries()].map(([tag, { q, r }], i) => {
    const { cx, cy } = center(q, r)
    return {
      tag,
      order: i,
      left: cx - HEXW / 2,
      top: cy - HEXH / 2,
      required: required.has(tag),
      amount: required.has(tag) ? props.research.aspects[tag] : undefined,
      label: ASPECT_BY_TAG.get(tag)?.label ?? tag,
    }
  })
  const taken = new Set([...pos.values()].map((p) => `${p.q},${p.r}`))
  const empties = field
    .filter(({ q, r }) => !taken.has(`${q},${r}`))
    .map(({ q, r }) => {
      const { cx, cy } = center(q, r)
      return { left: cx - HEXW / 2, top: cy - HEXH / 2 }
    })

  const orderOf = new Map(cells.map((c) => [c.tag, c.order]))
  const links = sol.edges.map(([a, b]) => {
    const A = pos.get(a)!,
      B = pos.get(b)!
    const pa = center(A.q, A.r),
      pb = center(B.q, B.r)
    // связь «протягивается» после того, как появились оба её аспекта
    const order = Math.max(orderOf.get(a) ?? 0, orderOf.get(b) ?? 0)
    return { x1: pa.cx, y1: pa.cy, x2: pb.cx, y2: pb.cy, order }
  })

  const hexPts = (cx: number, cy: number, R: number): string =>
    Array.from({ length: 6 }, (_, i) => {
      const a = ((-90 + 60 * i) * Math.PI) / 180
      return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`
    }).join(' ')
  const outlines = [...pos.entries()]
    .filter(([tag]) => required.has(tag))
    .map(([, { q, r }]) => {
      const { cx, cy } = center(q, r)
      return hexPts(cx, cy, SIZE + 3)
    })

  return { W, H, cells, empties, links, outlines }
})
</script>

<template>
  <div class="sb">
    <div v-if="requiredTags.length === 0" class="sb__note">
      У этого свитка нет аспектов — он открывается сам, связывать нечего.
    </div>
    <div
      v-else-if="board"
      :key="runKey"
      class="sb__board"
      :class="{ 'sb--solving': !reduceMotion }"
      :style="{ width: board.W + 'px', height: board.H + 'px' }"
    >
      <svg class="sb__svg" :viewBox="`0 0 ${board.W} ${board.H}`" preserveAspectRatio="none">
        <line
          v-for="(l, i) in board.links"
          :key="'l' + i"
          class="sb__link"
          :style="{ '--i': l.order }"
          :x1="l.x1"
          :y1="l.y1"
          :x2="l.x2"
          :y2="l.y2"
        />
        <polygon v-for="(pts, i) in board.outlines" :key="'o' + i" class="sb__req" :points="pts" />
      </svg>
      <span
        v-for="(e, i) in board.empties"
        :key="'e' + i"
        class="sb__empty"
        :style="{ left: e.left + 'px', top: e.top + 'px', width: HEXW + 'px', height: HEXH + 'px' }"
      >
        <span class="sb__eframe"></span><span class="sb__ehex"></span>
      </span>
      <span
        v-for="c in board.cells"
        :key="c.tag"
        class="sb__cell"
        :class="{ req: c.required, inter: !c.required }"
        :style="{ left: c.left + 'px', top: c.top + 'px', width: HEXW + 'px', '--i': c.order }"
      >
        <span v-if="c.required" class="sb__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
            <path
              d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9.6l6.9-.7z"
            />
          </svg>
        </span>
        <AspectHex :tag="c.tag" :size="HEXW" />
        <span v-if="c.amount != null" class="sb__amt">{{ c.amount }}</span>
        <span v-if="c.required" class="sb__cap">{{ c.label }}</span>
      </span>
    </div>

    <p v-if="board" class="sb__hint">
      Связи и аспекты точные. А вот форму поля и расстановку ячеек игра каждый раз раскидывает
      по-своему — на самом столе сверяйтесь по аспектам, не по картинке.
    </p>
    <p v-if="solution.unreachable.length" class="sb__warn">
      Не удалось связать:
      {{ solution.unreachable.map((t) => ASPECT_BY_TAG.get(t)?.label ?? t).join(', ') }}
    </p>
  </div>
</template>

<style scoped>
.sb {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}
.sb__note {
  color: var(--muted);
  font-size: 13px;
  padding: 40px 16px;
  text-align: center;
}
.sb__board {
  position: relative;
  margin: 0 auto;
  background:
    radial-gradient(80% 60% at 50% 38%, rgba(138, 92, 240, 0.16), transparent 70%),
    radial-gradient(120% 130% at 50% 0%, #161029, #0c0a14 70%);
  border: 1px solid var(--cardln);
  border-radius: 14px;
  box-shadow:
    0 0 0 1px rgba(160, 107, 255, 0.08),
    0 0 34px rgba(138, 92, 240, 0.18),
    inset 0 0 40px rgba(138, 92, 240, 0.06);
}
/* медленное «дыхание» ауры стола — лёгкая жизнь без отвлечения */
.sb--solving {
  animation: sbBreathe 4.5s ease-in-out infinite;
}
@keyframes sbBreathe {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(160, 107, 255, 0.08),
      0 0 28px rgba(138, 92, 240, 0.14),
      inset 0 0 40px rgba(138, 92, 240, 0.05);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(160, 107, 255, 0.14),
      0 0 44px rgba(138, 92, 240, 0.26),
      inset 0 0 50px rgba(138, 92, 240, 0.09);
  }
}
.sb__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.sb__link {
  stroke: #86b0ff;
  stroke-width: 3;
  opacity: 0.5;
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px #86b0ff);
}
/* связь «протягивается»: рисуем штрих от одного аспекта к другому,
   затем держим устойчивое свечение */
.sb--solving .sb__link {
  stroke-dasharray: 240;
  stroke-dashoffset: 240;
  opacity: 0;
  animation: sbDraw 0.42s ease-out forwards;
  animation-delay: calc(var(--i, 0) * 0.13s + 0.28s);
}
@keyframes sbDraw {
  from {
    stroke-dashoffset: 240;
    opacity: 0;
    filter: drop-shadow(0 0 9px #c9a3ff);
  }
  60% {
    opacity: 0.85;
  }
  to {
    stroke-dashoffset: 0;
    opacity: 0.5;
    filter: drop-shadow(0 0 4px #86b0ff);
  }
}
/* контур требуемого аспекта — яркое золото с двойным свечением */
.sb__req {
  fill: rgba(255, 215, 107, 0.07);
  stroke: #ffe488;
  stroke-width: 3.5;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 4px #ffd76b) drop-shadow(0 0 11px rgba(255, 215, 107, 0.85));
}
/* мягкая золотая пульсация контуров (только при разрешённом движении — см. ниже) */
.sb--solving .sb__req {
  animation: sbReqPulse 2.4s ease-in-out infinite;
}
@keyframes sbReqPulse {
  0%,
  100% {
    filter: drop-shadow(0 0 4px #ffd76b) drop-shadow(0 0 10px rgba(255, 215, 107, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 6px #ffe488) drop-shadow(0 0 20px rgba(255, 215, 107, 1));
  }
}
.sb__empty {
  position: absolute;
}
.sb__eframe,
.sb__ehex {
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
}
.sb__eframe {
  background: rgba(130, 110, 180, 0.1);
}
.sb__ehex {
  inset: 1.5px;
  background: #0d0a16;
}
.sb__cell {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* промежуточные (подставленные решателем) — заметно приглушены, фон для требуемых */
.sb__cell.inter {
  filter: grayscale(0.8) brightness(0.5) opacity(0.8);
}
/* требуемые — в фокусе: золотой ореол за гексом */
.sb__cell.req {
  isolation: isolate;
}
.sb__cell.req::before {
  content: '';
  position: absolute;
  inset: -9px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 215, 107, 0.42),
    rgba(255, 215, 107, 0.1) 52%,
    transparent 72%
  );
  z-index: -1;
  pointer-events: none;
}
/* золотой маркер-звезда в углу требуемого аспекта */
.sb__mark {
  position: absolute;
  left: -5px;
  top: -4px;
  z-index: 4;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--amber);
  color: #3a2706;
  box-shadow: 0 0 10px rgba(255, 215, 107, 0.95);
}
/* золотая подпись названия под требуемым аспектом (у промежуточных её нет) */
.sb__cap {
  position: absolute;
  left: 50%;
  bottom: -15px;
  transform: translateX(-50%);
  z-index: 4;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: #ffe488;
  text-shadow: 0 0 7px rgba(255, 215, 107, 0.55);
}
/* аспекты «загораются» один за другим — порядок задаёт решатель */
.sb--solving .sb__cell {
  opacity: 0;
  animation: sbCellIn 0.4s cubic-bezier(0.18, 0.7, 0.28, 1.3) forwards;
  animation-delay: calc(var(--i, 0) * 0.13s);
}
@keyframes sbCellIn {
  0% {
    opacity: 0;
    transform: scale(0.4) rotate(-12deg);
    filter: brightness(2.4) drop-shadow(0 0 16px #c9a3ff);
  }
  55% {
    opacity: 1;
    transform: scale(1.12) rotate(0deg);
    filter: brightness(1.5) drop-shadow(0 0 14px #c9a3ff);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
    filter: none;
  }
}
.sb__amt {
  position: absolute;
  right: -4px;
  top: -4px;
  background: #1a1430;
  color: var(--amber);
  border: 1px solid var(--solid);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  padding: 0 5px;
  z-index: 3;
}
.sb__hint {
  margin-top: 12px;
  max-width: 460px;
  text-align: center;
  font-size: 11px;
  line-height: 1.45;
  color: var(--muted);
}
.sb__warn {
  margin-top: 10px;
  font-size: 11.5px;
  color: var(--rust);
}

@media (prefers-reduced-motion: reduce) {
  .sb--solving,
  .sb--solving .sb__cell,
  .sb--solving .sb__link,
  .sb--solving .sb__req {
    animation: none;
  }
}
</style>
