import { describe, it, expect } from 'vitest'
import { ASPECT_SOURCES } from '../data/sources.data'
import { sourcesForAspect, aspectSourceIndex, searchSources, aspectsWithSources } from './sources'

describe('aspectSourceIndex', () => {
  it('мемоизирован: повторный вызов возвращает тот же объект', () => {
    expect(aspectSourceIndex()).toBe(aspectSourceIndex())
  })
  it('каждый источник попал в индекс по всем своим аспектам', () => {
    const idx = aspectSourceIndex()
    const sample = ASPECT_SOURCES[0]!
    for (const tag of Object.keys(sample.aspects)) {
      expect(idx.get(tag)?.some((h) => h.source === sample)).toBe(true)
    }
  })
})

describe('sourcesForAspect', () => {
  it('отсортировано по количеству по убыванию', () => {
    const tag = [...aspectsWithSources()][0]!
    const hits = sourcesForAspect(tag)
    expect(hits.length).toBeGreaterThan(0)
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1]!.amount).toBeGreaterThanOrEqual(hits[i]!.amount)
    }
  })
  it('неизвестный тег → пусто', () => {
    expect(sourcesForAspect('__нет__')).toEqual([])
  })
})

describe('searchSources', () => {
  it('пустой запрос → пусто', () => {
    expect(searchSources('  ')).toEqual([])
  })
  it('находит по подстроке имени', () => {
    const name = ASPECT_SOURCES[0]!.name
    const found = searchSources(name)
    expect(found.length).toBeGreaterThan(0)
  })
})
