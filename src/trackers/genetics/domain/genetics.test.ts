import { describe, it, expect } from 'vitest'
import { geneKey, geneUniverse, traitCompletion, collectionTotals } from './genetics'
import type { TraitDef } from './genetics'

const TRAITS: TraitDef[] = [
  {
    key: 'speed',
    en: 'Speed',
    ru: 'Скорость',
    desc: '',
    alleles: [
      { en: 'Slow', ru: 'Медленная' },
      { en: 'Fast', ru: 'Быстрая' },
      { en: 'Blinding', ru: 'Молниеносная', mod: 'MagicBees' },
    ],
  },
  {
    key: 'nocturnal',
    en: 'Nocturnal',
    ru: 'Ночная',
    desc: '',
    alleles: [
      { en: 'Yes', ru: 'Да' },
      { en: 'No', ru: 'Нет' },
    ],
  },
  { key: 'species', en: 'Species', ru: 'Вид', desc: '', alleles: [] },
]

describe('geneKey', () => {
  it('строит стабильный ключ trait|en', () => {
    expect(geneKey('speed', 'Fast')).toBe('speed|Fast')
  })
})

describe('geneUniverse', () => {
  it('перечисляет все аллели кроме пустых признаков (species)', () => {
    expect(geneUniverse(TRAITS).length).toBe(5)
  })
  it('фильтрует аддонные аллели по разрешённым модам', () => {
    const base = geneUniverse(TRAITS, new Set(['Forestry']))
    expect(base.some((g) => g.en === 'Blinding')).toBe(false)
    expect(base.length).toBe(4)
  })
})

describe('traitCompletion', () => {
  it('считает собранные/всего по признаку', () => {
    const have = new Set([geneKey('speed', 'Fast')])
    expect(traitCompletion(TRAITS[0]!, have)).toEqual({ have: 1, total: 3, pct: 33 })
  })
})

describe('collectionTotals', () => {
  it('суммирует по универсуму', () => {
    const have = new Set([geneKey('speed', 'Fast'), geneKey('nocturnal', 'Yes')])
    expect(collectionTotals(TRAITS, have)).toEqual({ have: 2, total: 5 })
  })
})
