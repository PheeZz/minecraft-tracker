// Логика фильтрации рецептов вынесена из компонента для соблюдения лимита строк.
import { RECIPES } from '../data/recipes.data'
import type { Recipe, RecipeSource, ItemRef } from './types'

export const SOURCE_LABELS: Record<RecipeSource, string> = {
  altar: 'Алтарь',
  alchemy: 'Алхимия',
  crafting: 'Крафт',
  binding: 'Привязка',
  summoning: 'Призыв',
}

/** Нормализует строку для поиска: нижний регистр, убирает лишние пробелы. */
const normalize = (s: string): string => s.toLowerCase().trim()

/** Совпадает ли ItemRef с поисковым запросом (RU + EN имена). */
const itemMatches = (name_ru: string, name_en: string, q: string): boolean =>
  normalize(name_ru).includes(q) || normalize(name_en).includes(q)

/** Возвращает отфильтрованный массив рецептов. Вычисляется через computed — не мутирует. */
export function filterRecipes(params: {
  query: string
  sources: Set<RecipeSource>
  tier: number | null
}): readonly Recipe[] {
  const q = normalize(params.query)
  return RECIPES.filter((r) => {
    // фильтр по источнику
    if (params.sources.size > 0 && !params.sources.has(r.source)) return false
    // фильтр по тиру
    if (params.tier !== null && r.minTier !== params.tier) return false
    // текстовый поиск по output, inputs и tier2-ингредиентам summoning-рецептов
    if (q) {
      const inOutput = itemMatches(r.output.name_ru, r.output.name_en, q)
      const inInputs = r.inputs.some((it) => itemMatches(it.name_ru, it.name_en, q))
      const tier2 = (r.meta?.tier2 as ItemRef[] | undefined) ?? []
      const inTier2 = tier2.some((it) => itemMatches(it.name_ru, it.name_en, q))
      if (!inOutput && !inInputs && !inTier2) return false
    }
    return true
  })
}

/** Список уникальных тиров для фильтра (отсортирован). */
export function availableTiers(): number[] {
  const tiers = new Set<number>()
  for (const r of RECIPES) {
    if (r.minTier != null) tiers.add(r.minTier)
  }
  return [...tiers].sort((a, b) => a - b)
}
