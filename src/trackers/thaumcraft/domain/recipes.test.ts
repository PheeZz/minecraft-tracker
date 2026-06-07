import { describe, it, expect } from 'vitest'
import { RECIPES } from '../data/recipes.data'
import { recipeTypeGroup, filterRecipes, recipeMods } from './recipes'

describe('recipeTypeGroup', () => {
  it('сводит подтипы к укрупнённой группе', () => {
    expect(recipeTypeGroup('arcane')).toBe('arcane')
    expect(recipeTypeGroup('arcane_shapeless')).toBe('arcane')
    expect(recipeTypeGroup('infusion')).toBe('infusion')
    expect(recipeTypeGroup('infusion_enchantment')).toBe('infusion')
    expect(recipeTypeGroup('crucible')).toBe('crucible')
  })
})

describe('filterRecipes', () => {
  it('пустой фильтр возвращает всё', () => {
    const r = filterRecipes({ query: '', group: 'all', mod: 'all' })
    expect(r.length).toBe(RECIPES.length)
  })
  it('фильтрует по группе', () => {
    const r = filterRecipes({ query: '', group: 'crucible', mod: 'all' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((x) => recipeTypeGroup(x.type) === 'crucible')).toBe(true)
  })
  it('находит по имени вывода (RU/EN)', () => {
    const r = filterRecipes({ query: 'thaumium', group: 'all', mod: 'all' })
    expect(r.some((x) => x.output.en.toLowerCase().includes('thaumium'))).toBe(true)
  })
})

describe('recipeMods', () => {
  it('возвращает уникальные моды', () => {
    const mods = recipeMods()
    expect(mods.length).toBeGreaterThan(0)
    expect(new Set(mods).size).toBe(mods.length)
  })
})
