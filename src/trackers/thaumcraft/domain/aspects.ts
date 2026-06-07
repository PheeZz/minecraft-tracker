import { ASPECTS } from '../data/aspects.data'
import type { Aspect } from './types'

/** Аспект по тегу. */
export const ASPECT_BY_TAG: ReadonlyMap<string, Aspect> = new Map(ASPECTS.map((a) => [a.tag, a]))

/**
 * Граф связей аспектов для мини-игры исследования: два аспекта соединимы, только
 * если один — ПРЯМОЙ компонент другого (на один тир). Рёбра неориентированные.
 */
export function buildAspectGraph(aspects: readonly Aspect[] = ASPECTS): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  for (const a of aspects) adj.set(a.tag, new Set())
  for (const a of aspects) {
    for (const c of a.components) {
      adj.get(a.tag)?.add(c)
      adj.get(c)?.add(a.tag)
    }
  }
  return adj
}

/** Граф связей по всем аспектам (готовый, переиспользуемый). */
export const ASPECT_GRAPH: ReadonlyMap<string, ReadonlySet<string>> = buildAspectGraph()

/** Кратчайший путь между аспектами (включая концы) по графу связей, либо null. */
export function aspectPath(
  from: string,
  to: string,
  adj: ReadonlyMap<string, ReadonlySet<string>> = ASPECT_GRAPH,
): string[] | null {
  if (!adj.has(from) || !adj.has(to)) return null
  if (from === to) return [from]
  const prev = new Map<string, string | null>([[from, null]])
  const queue = [from]
  while (queue.length) {
    const node = queue.shift()!
    if (node === to) break
    for (const next of adj.get(node) ?? []) {
      if (!prev.has(next)) {
        prev.set(next, node)
        queue.push(next)
      }
    }
  }
  if (!prev.has(to)) return null
  const path: string[] = []
  for (let n: string | null = to; n !== null; n = prev.get(n) ?? null) path.unshift(n)
  return path
}

/** Решение мини-игры: какие аспекты лежат на поле и какие пары соединены. */
export interface AspectSolution {
  /** Все аспекты решения (требуемые + промежуточные). */
  nodes: string[]
  /** Связи между соседними аспектами (тег, тег). */
  edges: Array<[string, string]>
  /** Требуемые аспекты, до которых не удалось дотянуться (изолированные). */
  unreachable: string[]
}

/**
 * Связывает требуемые аспекты свитка в одну сеть жадным MST: каждый шаг
 * подключает ближайший ещё не связанный требуемый аспект кратчайшим путём,
 * заполняя промежуточные аспекты. Недостижимые требуемые попадают в unreachable.
 */
export function solveResearch(
  required: readonly string[],
  adj: ReadonlyMap<string, ReadonlySet<string>> = ASPECT_GRAPH,
): AspectSolution {
  const uniq = [...new Set(required)]
  const req = uniq.filter((t) => adj.has(t))
  // неизвестные графу теги тоже считаем недостижимыми (а не молча отбрасываем)
  const unreachable: string[] = uniq.filter((t) => !adj.has(t))
  if (req.length === 0) return { nodes: [], edges: [], unreachable }

  const inNet = new Set<string>([req[0]!])
  const edgeKeys = new Set<string>()
  const edges: Array<[string, string]> = []
  const addEdge = (a: string, b: string): void => {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`
    if (edgeKeys.has(key)) return
    edgeKeys.add(key)
    edges.push([a, b])
  }

  const need = new Set(req.slice(1))
  while (need.size) {
    let best: { target: string; path: string[] } | null = null
    for (const a of inNet) {
      for (const b of need) {
        const path = aspectPath(a, b, adj)
        if (path && (!best || path.length < best.path.length)) best = { target: b, path }
      }
    }
    if (!best) {
      // оставшиеся требуемые недостижимы из текущей сети
      for (const b of need) unreachable.push(b)
      break
    }
    need.delete(best.target)
    for (let i = 0; i < best.path.length; i++) {
      inNet.add(best.path[i]!)
      if (i > 0) addEdge(best.path[i - 1]!, best.path[i]!)
    }
  }
  return { nodes: [...inNet], edges, unreachable }
}
