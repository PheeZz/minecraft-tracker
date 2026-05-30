import { BY_ID, TREES } from '../data/trees.data'
import { effort, type ProgressMap } from './graph'
import type { Inventory, Tree } from './types'

/** Плод → деревья, которые его дают. */
export const FRUIT_PRODUCERS: Readonly<Record<string, string[]>> = (() => {
  const out: Record<string, string[]> = {}
  for (const t of TREES) {
    if (t.fruit) (out[t.fruit] ??= []).push(t.id)
  }
  return out
})()

/** Уникальные плоды. */
export const UNIQUE_FRUITS: readonly string[] = Object.keys(FRUIT_PRODUCERS)

/**
 * Канонические (минимальные по усилию) производители каждого плода.
 * Один плод могут давать несколько деревьев — берём самое лёгкое.
 */
export const FRUIT_TARGETS: ReadonlySet<string> = (() => {
  const tierOf = (id: string): number => BY_ID[id]?.tier ?? 0
  const targets = new Set<string>()
  for (const producers of Object.values(FRUIT_PRODUCERS)) {
    const best = producers
      .slice()
      .sort((a, b) => effort(a) - effort(b) || tierOf(a) - tierOf(b) || a.localeCompare(b, 'ru'))[0]
    if (best) targets.add(best)
  }
  return targets
})()

/**
 * Цепочка к плодам = канонические производители + все их предки
 * (минимальный набор деревьев ради всех плодов).
 */
export const FRUIT_CHAIN: ReadonlySet<string> = (() => {
  const out = new Set<string>()
  const stack = [...FRUIT_TARGETS]
  while (stack.length) {
    const id = stack.pop()!
    if (out.has(id)) continue
    out.add(id)
    const t = BY_ID[id]
    if (t?.parents) {
      for (const pair of t.parents)
        for (const parent of pair) if (!out.has(parent)) stack.push(parent)
    }
  }
  return out
})()

/** Разблокирован ли плод (есть полученное дерево-производитель). */
export function fruitUnlocked(state: ProgressMap, fruit: string): boolean {
  return FRUIT_PRODUCERS[fruit]?.some((id) => state[id] === 2) ?? false
}

/** Спрос на каждое дерево как родителя (по основному рецепту) среди набора нужных деревьев. */
export function computeUsage(needTrees: readonly Tree[]): Record<string, number> {
  const usage: Record<string, number> = {}
  for (const t of needTrees) {
    const pair = t.parents?.[0]
    if (!pair) continue
    const [a, b] = pair
    usage[a] = (usage[a] ?? 0) + 1
    usage[b] = (usage[b] ?? 0) + 1
  }
  return usage
}

/**
 * Спрос на дерево `id` как родителя в цепочке плодов:
 * need — всего по плану, needRem — осталось (для ещё не полученных потомков).
 */
export function parentDemand(state: ProgressMap, id: string): { need: number; needRem: number } {
  const users = TREES.filter((x) => x.parents?.some((pair) => pair.includes(id)))
  let need = 0
  let needRem = 0
  for (const u of users) {
    const pair = u.parents?.[0]
    if (!FRUIT_CHAIN.has(u.id) || !pair) continue
    const [a, b] = pair
    const k = (a === id ? 1 : 0) + (b === id ? 1 : 0)
    need += k
    if (state[u.id] !== 2) needRem += k
  }
  return { need, needRem }
}

/** Сумма единиц инвентаря (саженцы + пыльца взаимозаменяемы). */
export function invTotal(inv: Inventory): number {
  return inv.sap + inv.pol
}
