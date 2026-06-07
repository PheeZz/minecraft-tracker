import { describe, it, expect } from 'vitest'
import {
  RESEARCH_BY_KEY,
  isUnlocked,
  researchState,
  prerequisiteClosure,
  searchResearch,
  researchCategories,
} from './research'

// FOCUSFROST зависит от FOCUSFIRE (реальные данные)
const FROST = 'FOCUSFROST'
const FIRE = 'FOCUSFIRE'

describe('isUnlocked / researchState', () => {
  it('свиток заблокирован без выполненных предпосылок', () => {
    expect(RESEARCH_BY_KEY.get(FROST)?.parents).toContain(FIRE)
    expect(isUnlocked(FROST, new Set())).toBe(false)
    expect(researchState(FROST, new Set())).toBe('locked')
  })
  it('предпосылка выполнена → доступен; сам изучен → done', () => {
    expect(isUnlocked(FROST, new Set([FIRE]))).toBe(true)
    expect(researchState(FROST, new Set([FIRE]))).toBe('available')
    expect(researchState(FROST, new Set([FIRE, FROST]))).toBe('done')
  })
})

describe('prerequisiteClosure', () => {
  it('включает предка FOCUSFIRE и не включает сам ключ', () => {
    const c = prerequisiteClosure(FROST)
    expect(c.has(FIRE)).toBe(true)
    expect(c.has(FROST)).toBe(false)
  })
})

describe('searchResearch', () => {
  it('пустой запрос возвращает всё', () => {
    expect(searchResearch('').length).toBe(RESEARCH_BY_KEY.size)
  })
  it('находит по ключу', () => {
    const r = searchResearch('FOCUSFROST')
    expect(r.some((x) => x.key === FROST)).toBe(true)
  })
})

describe('researchCategories', () => {
  it('возвращает непустой список уникальных категорий', () => {
    const cats = researchCategories()
    expect(cats.length).toBeGreaterThan(0)
    expect(new Set(cats).size).toBe(cats.length)
  })
})
