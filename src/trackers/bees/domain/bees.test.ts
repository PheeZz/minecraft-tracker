import { describe, it, expect } from 'vitest'
import { BEES, BEE_BY_ID } from '../data/bees.data'
import { beeColor, combColor, pale } from './colors'

describe('данные пчёл', () => {
  it('непустой список и корректный индекс', () => {
    expect(BEES.length).toBeGreaterThan(200)
    expect(BEE_BY_ID['Обычная']?.en).toBe('Common')
    expect(Object.keys(BEE_BY_ID).length).toBe(BEES.length)
  })

  it('источники только F/E/M', () => {
    for (const b of BEES) expect(['F', 'E', 'M']).toContain(b.source)
  })

  it('у продуктов валидный тип и проценты', () => {
    for (const b of BEES) {
      for (const p of b.products) {
        expect(['product', 'specialty']).toContain(p.kind)
        expect(p.pct).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('дикие виды без рецептов есть (база)', () => {
    const wild = BEES.filter((b) => b.parents.length === 0)
    expect(wild.length).toBeGreaterThan(0)
    expect(wild.some((b) => b.id === 'Лесная')).toBe(true)
  })

  it('включает MagicBees (src M)', () => {
    expect(BEES.some((b) => b.source === 'M')).toBe(true)
  })
})

describe('цвета', () => {
  it('combColor находит соту по ru и en', () => {
    expect(combColor('Медовые соты')?.p).toBeDefined()
    expect(combColor('Honey Comb')?.p).toBeDefined()
  })
  it('beeColor находит пчелу по ru и en', () => {
    expect(beeColor('Лесная')?.p).toBeDefined()
    expect(beeColor('Forest')?.p).toBeDefined()
  })
  it('неизвестное имя — undefined', () => {
    expect(combColor('нет такой соты')).toBeUndefined()
    expect(beeColor('нет такой пчелы')).toBeUndefined()
  })
  it('pale осветляет цвет в валидный rgb', () => {
    expect(pale('#000000')).toBe('rgb(204,204,204)')
    expect(pale('#ffffff')).toBe('rgb(255,255,255)')
  })
})
