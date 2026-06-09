import type { AspectSolution } from './aspects'

/** Позиция на гекс-сетке (axial, pointy-top). */
export interface HexPos {
  q: number
  r: number
}

/** 6 соседей в axial-координатах (pointy-top). */
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
]

const keyOf = (q: number, r: number): string => `${q},${r}`

/**
 * Шаг укладки связанных аспектов = 1 ячейка: цепочка непрерывна (соседние по связи
 * аспекты стоят вплотную, как на столе). Разнос требуемых аспектов (≥3) обеспечивает
 * решатель — он вставляет ≥2 промежуточных аспекта между требуемыми (см. solveResearch).
 */
const SPACING = 1

/** Ближайшая свободная ячейка к точке p (BFS по сетке). */
function nearestFree(p: HexPos, used: ReadonlySet<string>): HexPos {
  const seen = new Set<string>([keyOf(p.q, p.r)])
  const queue: HexPos[] = [p]
  while (queue.length) {
    const c = queue.shift()!
    if (!used.has(keyOf(c.q, c.r))) return c
    for (const [dq, dr] of DIRS) {
      const n = { q: c.q + dq * SPACING, r: c.r + dr * SPACING }
      const k = keyOf(n.q, n.r)
      if (!seen.has(k)) {
        seen.add(k)
        queue.push(n)
      }
    }
  }
  return p
}

/**
 * Раскладывает решение мини-игры на гекс-сетку так, что связанные аспекты по
 * возможности стоят на соседних ячейках. Жадно: старт — самый «связный» узел в
 * (0,0), затем BFS размещает соседей в свободные смежные ячейки; если все 6
 * заняты — ближайшая свободная (связь покажется линией). Возвращает позицию
 * каждого аспекта; гарантирует уникальность ячеек.
 */
export function layoutSolution(solution: AspectSolution): Map<string, HexPos> {
  const { nodes, edges } = solution
  const pos = new Map<string, HexPos>()
  if (nodes.length === 0) return pos

  const adj = new Map<string, string[]>()
  for (const n of nodes) adj.set(n, [])
  for (const [a, b] of edges) {
    adj.get(a)?.push(b)
    adj.get(b)?.push(a)
  }

  const used = new Set<string>()
  const place = (tag: string, p: HexPos): void => {
    pos.set(tag, p)
    used.add(keyOf(p.q, p.r))
  }

  // старт — узел с наибольшей степенью (компактнее раскладка вокруг «хаба»)
  const start = [...nodes].sort((a, b) => (adj.get(b)?.length ?? 0) - (adj.get(a)?.length ?? 0))[0]!
  place(start, { q: 0, r: 0 })

  const queue: string[] = [start]
  while (queue.length) {
    const n = queue.shift()!
    const p = pos.get(n)!
    for (const m of adj.get(n) ?? []) {
      if (pos.has(m)) continue
      let cell: HexPos | null = null
      for (const [dq, dr] of DIRS) {
        const c = { q: p.q + dq * SPACING, r: p.r + dr * SPACING }
        if (!used.has(keyOf(c.q, c.r))) {
          cell = c
          break
        }
      }
      place(m, cell ?? nearestFree(p, used))
      queue.push(m)
    }
  }

  // узлы вне рёбер (на случай несвязного решения) — рядом с центром
  for (const n of nodes) {
    if (!pos.has(n)) place(n, nearestFree({ q: 0, r: 0 }, used))
  }
  return pos
}

/** Перевод axial-координат в пиксели (pointy-top, радиус size). */
export function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
  return { x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r }
}
