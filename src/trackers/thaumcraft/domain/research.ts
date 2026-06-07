import { RESEARCH } from '../data/research.data'
import type { Research } from './types'

/** Исследование по ключу. */
export const RESEARCH_BY_KEY: ReadonlyMap<string, Research> = new Map(
  RESEARCH.map((r) => [r.key, r]),
)

/** RU-имена основных категорий Thaumcraft; прочие (аддоны) — как есть. */
export const CATEGORY_RU: Readonly<Record<string, string>> = {
  THAUMATURGY: 'Тауматургия',
  ARTIFICE: 'Артифактика',
  ALCHEMY: 'Алхимия',
  GOLEMANCY: 'Големантия',
  ELDRITCH: 'Древнее',
  ASPECTS: 'Аспекты',
}
/** Человекочитаемое имя вкладки изучения (категории). */
export const catName = (c: string): string => CATEGORY_RU[c] ?? c

/** Категории в порядке первого появления. */
export function researchCategories(list: readonly Research[] = RESEARCH): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of list) {
    if (r.category && !seen.has(r.category)) {
      seen.add(r.category)
      out.push(r.category)
    }
  }
  return out
}

/** Предпосылки выполнены (все родители изучены)? Свиток без родителей — всегда открыт. */
export function isUnlocked(key: string, done: ReadonlySet<string>): boolean {
  const r = RESEARCH_BY_KEY.get(key)
  if (!r) return false
  return r.parents.every((p) => done.has(p))
}

export type ResearchState = 'done' | 'available' | 'locked'

/** Состояние свитка: изучен / доступен сейчас / заблокирован предпосылками. */
export function researchState(key: string, done: ReadonlySet<string>): ResearchState {
  if (done.has(key)) return 'done'
  return isUnlocked(key, done) ? 'available' : 'locked'
}

/**
 * Транзитивное замыкание предпосылок свитка (все предки в дереве, без самого
 * ключа). Для построения графа «что изучить, чтобы открыть цель».
 */
export function prerequisiteClosure(key: string): Set<string> {
  const out = new Set<string>()
  const stack = [...(RESEARCH_BY_KEY.get(key)?.parents ?? [])]
  while (stack.length) {
    const k = stack.pop()!
    if (out.has(k)) continue
    out.add(k)
    for (const p of RESEARCH_BY_KEY.get(k)?.parents ?? []) stack.push(p)
  }
  return out
}

/** Поиск по RU/EN-имени, ключу и категории (регистронезависимо). */
export function searchResearch(query: string, list: readonly Research[] = RESEARCH): Research[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...list]
  return list.filter((r) => {
    return (
      r.name.toLowerCase().includes(q) ||
      r.key.toLowerCase().includes(q) ||
      (r.nameEn?.toLowerCase().includes(q) ?? false) ||
      r.category.toLowerCase().includes(q)
    )
  })
}
