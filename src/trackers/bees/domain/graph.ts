import { BEE_BY_ID } from '../data/bees.data'
import { REAL } from './combs'
import type { BeeRecipe } from './types'

/** Карта выбранного рецепта на пчелу (индекс в parents). */
export type RecipeChoice = Readonly<Record<string, number>>

/** Индекс выбранного рецепта в parents с клэмпом в границы (дефолт 0). */
export function recipeIndexOf(id: string, rc: RecipeChoice): number {
  const b = BEE_BY_ID[id]
  if (!b || !b.parents.length) return 0
  return Math.min(rc[id] ?? 0, b.parents.length - 1)
}

/** Выбранный рецепт пчелы (с учётом RecipeChoice); null у диких. */
export function recipeOf(id: string, rc: RecipeChoice): BeeRecipe | null {
  const b = BEE_BY_ID[id]
  if (!b || !b.parents.length) return null
  return b.parents[recipeIndexOf(id, rc)] ?? null
}

/**
 * Функция глубины выведения от диких/имеющихся. Зависит только от склада (have):
 * имеющаяся пчела — лист (0), дикая — 0, иначе 1 + max по реальным родителям всех рецептов.
 * Возвращает мемоизированную функцию (пересоздавать при изменении склада).
 */
export function makeDepth(have: ReadonlySet<string>): (id: string) => number {
  const memo = new Map<string, number>()
  // Порядок проверок 1:1 с chain-макетом: memo → have → dead-end → cycle.
  function depth(id: string, stack: Set<string> = new Set()): number {
    const cached = memo.get(id)
    if (cached != null) return cached
    if (have.has(id)) {
      memo.set(id, 0)
      return 0
    }
    const b = BEE_BY_ID[id]
    if (!b || !b.parents.length) {
      memo.set(id, 0)
      return 0
    }
    if (stack.has(id)) return 0 // цикл — не кэшируем
    stack.add(id)
    let mx = 0
    for (const r of b.parents) {
      for (const p of [r.p1, r.p2]) {
        if (REAL.has(p) && !have.has(p)) mx = Math.max(mx, depth(p, stack) + 1)
      }
    }
    stack.delete(id)
    memo.set(id, mx)
    return mx
  }
  return (id: string) => depth(id)
}

export interface PlanSteps {
  /** Виды, которые надо вывести (есть рецепт, нет на складе) — в порядке выведения. */
  bred: string[]
  /** Дикие, которых надо добыть из ульев. */
  wild: string[]
  /** Берутся готовыми со склада (дальше не разводим). */
  have: string[]
}

/**
 * Пошаговый план до target по ВЫБРАННЫМ рецептам: родители раньше потомков.
 * Имеющиеся на складе виды (кроме самой цели) — листья. Перенос из chain-макета.
 */
export function planSteps(target: string, have: ReadonlySet<string>, rc: RecipeChoice): PlanSteps {
  const order: string[] = []
  const visited = new Set<string>()
  const dfs = (id: string): void => {
    if (visited.has(id)) return
    visited.add(id)
    if (id !== target && have.has(id)) {
      order.push(id)
      return
    }
    const r = recipeOf(id, rc)
    if (r) for (const p of [r.p1, r.p2]) if (REAL.has(p)) dfs(p)
    order.push(id)
  }
  dfs(target)
  return {
    bred: order.filter((id) => BEE_BY_ID[id]?.parents.length && !have.has(id)),
    wild: order.filter((id) => BEE_BY_ID[id] && !BEE_BY_ID[id]!.parents.length && !have.has(id)),
    have: order.filter((id) => BEE_BY_ID[id] && have.has(id) && id !== target),
  }
}
