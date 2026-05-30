import { describe, it, expect } from 'vitest'
import { TREES } from '../data/trees.data'
import { fruitIconUrl } from './fruitIcon'

describe('иконки плодов', () => {
  it('известный плод → URL на PNG', () => {
    expect(fruitIconUrl('Манго')).toMatch(/trees\/fruits\/.*\.png$/)
    expect(fruitIconUrl('Банан')).toBeDefined()
  })

  it('алиасы расхождений названий разрешаются', () => {
    expect(fruitIconUrl('Финик')).toBeDefined() // → Финики
    expect(fruitIconUrl('Гвоздика')).toBeDefined() // → Гвоздика (пряность)
    expect(fruitIconUrl('Семена можжевельника')).toBeDefined() // → Семяна Можжевельника
  })

  it('ванильное яблоко и неизвестное → undefined (fallback на SVG)', () => {
    expect(fruitIconUrl('Яблоко')).toBeUndefined()
    expect(fruitIconUrl('нет такого плода')).toBeUndefined()
    expect(fruitIconUrl(undefined)).toBeUndefined()
  })

  it('пробелы в путях URL-кодируются', () => {
    // Bay Laurel / Bay Rum Berry и т.п. — имена с пробелами
    for (const t of TREES) {
      const url = fruitIconUrl(t.fruit)
      if (url) expect(url).not.toMatch(/ /) // нет «сырых» пробелов
    }
  })
})
