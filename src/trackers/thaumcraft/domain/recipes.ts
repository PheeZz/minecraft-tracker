import { RECIPES } from '../data/recipes.data'
import type { Recipe, RecipeType } from './types'

/** Укрупнённая группа рецепта для фильтра: Аркан / Инфузия / Тигель. */
export type RecipeGroup = 'arcane' | 'infusion' | 'crucible'

const GROUP_BY_TYPE: Readonly<Record<RecipeType, RecipeGroup>> = {
  arcane: 'arcane',
  arcane_shapeless: 'arcane',
  infusion: 'infusion',
  infusion_enchantment: 'infusion',
  crucible: 'crucible',
}

/** Укрупнённая группа рецепта по его типу. */
export const recipeTypeGroup = (type: RecipeType): RecipeGroup => GROUP_BY_TYPE[type]

/** RU-подпись группы для бейджа/фильтра. */
export const GROUP_RU: Readonly<Record<RecipeGroup, string>> = {
  arcane: 'Аркан',
  infusion: 'Инфузия',
  crucible: 'Тигель',
}

/** Уникальные моды среди рецептов, в порядке первого появления. */
export function recipeMods(list: readonly Recipe[] = RECIPES): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of list) {
    if (!seen.has(r.mod)) {
      seen.add(r.mod)
      out.push(r.mod)
    }
  }
  return out
}

export interface RecipeFilter {
  query: string
  group: RecipeGroup | 'all'
  mod: string | 'all'
}

/** Фильтр рецептов по имени вывода (RU/EN), группе и моду. */
export function filterRecipes(filter: RecipeFilter, list: readonly Recipe[] = RECIPES): Recipe[] {
  const q = filter.query.trim().toLowerCase()
  return list.filter((r) => {
    if (filter.group !== 'all' && recipeTypeGroup(r.type) !== filter.group) return false
    if (filter.mod !== 'all' && r.mod !== filter.mod) return false
    if (!q) return true
    return r.output.ru.toLowerCase().includes(q) || r.output.en.toLowerCase().includes(q)
  })
}
