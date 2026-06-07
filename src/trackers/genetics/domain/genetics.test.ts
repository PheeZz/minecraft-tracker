import { describe, it, expect } from 'vitest'
import {
  geneKey,
  geneUniverse,
  traitCompletion,
  collectionTotals,
  targetGeneState,
  targetSummary,
  buildCarrierIndex,
  carriersOf,
} from './genetics'
import type { TraitDef, SpeciesGenomeLike } from './genetics'

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

describe('targetGeneState', () => {
  const have = new Set([geneKey('speed', 'Fast')])
  it('unset когда значение не выбрано', () => {
    expect(targetGeneState('speed', undefined, have)).toBe('unset')
  })
  it('have когда выбранный аллель собран', () => {
    expect(targetGeneState('speed', 'Fast', have)).toBe('have')
  })
  it('need когда выбран, но не собран', () => {
    expect(targetGeneState('speed', 'Slow', have)).toBe('need')
  })
})

describe('targetSummary', () => {
  it('считает заполнено/собрано и собирает список «нужно»', () => {
    const have = new Set([geneKey('speed', 'Fast')])
    const target = { speed: 'Fast', nocturnal: 'Yes' } // species не задан
    const r = targetSummary(TRAITS, target, have)
    expect(r.filled).toBe(2)
    expect(r.have).toBe(1)
    expect(r.need).toEqual([{ trait: 'nocturnal', en: 'Yes', ru: 'Да' }])
  })
  it('сохраняет mod в need для аддонных аллелей', () => {
    const r = targetSummary(TRAITS, { speed: 'Blinding' }, new Set())
    expect(r.need[0]).toEqual({
      trait: 'speed',
      en: 'Blinding',
      ru: 'Молниеносная',
      mod: 'MagicBees',
    })
  })
})

describe('buildCarrierIndex / carriersOf', () => {
  const GENOMES: SpeciesGenomeLike[] = [
    {
      en: 'Industrious',
      ru: 'Трудолюбивая',
      mod: 'Forestry',
      genome: { speed: 'Fast', fertility: '2' },
    },
    { en: 'Imperial', ru: 'Имперская', mod: 'Forestry', genome: { speed: 'Fast', fertility: '4' } },
    { en: 'Common', ru: 'Обычная', mod: 'Forestry', genome: { speed: 'Slow' } },
  ]
  const idx = buildCarrierIndex(GENOMES)

  it('находит всех носителей аллеля', () => {
    expect(carriersOf(idx, 'speed', 'Fast').map((s) => s.ru)).toEqual(['Трудолюбивая', 'Имперская'])
  })
  it('один носитель', () => {
    expect(carriersOf(idx, 'fertility', '4').map((s) => s.en)).toEqual(['Imperial'])
  })
  it('пусто, если никто не несёт', () => {
    expect(carriersOf(idx, 'speed', 'Fastest')).toEqual([])
  })
})
