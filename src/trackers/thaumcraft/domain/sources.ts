import { ASPECT_SOURCES } from '../data/sources.data'
import type { AspectSource } from './types'

/** Источник с количеством искомого аспекта (для сортировки по убыванию). */
export interface SourceHit {
  source: AspectSource
  amount: number
}

let reverseIndex: Map<string, SourceHit[]> | null = null

/**
 * Обратный индекс «тег аспекта → источники, его содержащие», отсортированные
 * по количеству этого аспекта по убыванию. Строится один раз (мемоизация).
 */
export function aspectSourceIndex(
  list: readonly AspectSource[] = ASPECT_SOURCES,
): ReadonlyMap<string, readonly SourceHit[]> {
  if (reverseIndex && list === ASPECT_SOURCES) return reverseIndex
  const idx = new Map<string, SourceHit[]>()
  for (const source of list) {
    for (const [tag, amount] of Object.entries(source.aspects)) {
      const arr = idx.get(tag) ?? idx.set(tag, []).get(tag)!
      arr.push({ source, amount })
    }
  }
  for (const arr of idx.values()) arr.sort((a, b) => b.amount - a.amount)
  if (list === ASPECT_SOURCES) reverseIndex = idx
  return idx
}

/** Источники, содержащие данный аспект, по убыванию количества. */
export function sourcesForAspect(tag: string): readonly SourceHit[] {
  return aspectSourceIndex().get(tag) ?? []
}

/** Теги аспектов, у которых есть хотя бы один источник. */
export function aspectsWithSources(): Set<string> {
  return new Set(aspectSourceIndex().keys())
}

/** Поиск источников по имени (регистронезависимо). Пустой запрос → пусто. */
export function searchSources(
  query: string,
  list: readonly AspectSource[] = ASPECT_SOURCES,
): AspectSource[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return list.filter((s) => s.name.toLowerCase().includes(q))
}
