import { BY_ID, TREES } from '../data/trees.data'
import type { ProgressMap } from './types'

export type { ProgressMap }

/** Готов ли родитель к использованию в скрещивании (есть хоть какой-то прогресс). */
export function parentReady(state: ProgressMap, id: string): boolean {
  return (state[id] ?? 0) >= 1
}

/** Доступно ли дерево к выведению прямо сейчас (есть рецепт, чьи оба родителя готовы). */
export function isAvailable(state: ProgressMap, id: string): boolean {
  const t = BY_ID[id]
  if (!t?.parents) return false
  return t.parents.some((pair) => pair.every((parent) => parentReady(state, parent)))
}

/**
 * Все предки дерева (по основному рецепту) — статично, для оценки «усилия».
 * Мемоизация безопасна: данные деревьев неизменяемы.
 */
const ancestorCache = new Map<string, ReadonlySet<string>>()
export function ancestorsOf(id: string): ReadonlySet<string> {
  const cached = ancestorCache.get(id)
  if (cached) return cached
  const set = new Set<string>()
  const main = BY_ID[id]?.parents?.[0]
  if (main) {
    for (const parent of main) {
      set.add(parent)
      for (const a of ancestorsOf(parent)) set.add(a)
    }
  }
  ancestorCache.set(id, set)
  return set
}

/** Усилие выведения: меньше предков → легче вывести. */
export function effort(id: string): number {
  return ancestorsOf(id).size
}

/**
 * Упорядоченный список скрещиваний до дерева id (родители раньше потомков,
 * только ещё не полученные узлы).
 */
export function breedPath(state: ProgressMap, id: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const visit = (tid: string): void => {
    if (seen.has(tid)) return
    seen.add(tid)
    const main = BY_ID[tid]?.parents?.[0]
    if (!main || state[tid] === 2) return // базовое или уже получено — выводить нечего
    for (const parent of main) visit(parent)
    out.push(tid)
  }
  visit(id)
  return out
}

/** Множество деревьев (tier>0), доступных к выведению прямо сейчас и ещё не полученных. */
export function availableSet(state: ProgressMap): Set<string> {
  const set = new Set<string>()
  for (const t of TREES) {
    if (t.tier > 0 && (state[t.id] ?? 0) === 0 && isAvailable(state, t.id)) set.add(t.id)
  }
  return set
}

/** Сколько новых деревьев станет доступно к выведению, если вывести `id`. */
export function unlockScore(state: ProgressMap, id: string): number {
  let count = 0
  for (const t of TREES) {
    if (!t.parents || state[t.id] === 2 || isAvailable(state, t.id)) continue
    if (
      t.parents.some((pair) => pair.every((parent) => parent === id || parentReady(state, parent)))
    ) {
      count++
    }
  }
  return count
}
