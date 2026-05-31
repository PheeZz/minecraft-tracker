import { describe, it, expect } from 'vitest'
import { combStatus, taskProgress, type CombProducerRanked } from './tasks'

// Фикстуры основаны на реальных данных:
// «Медовые соты» делают Обычная(depth0,35%), Развитая(depth1,40%), Хитрая(depth3).
const honeyProducers: CombProducerRanked[] = [
  { bee: 'Обычная', pct: 35, depth: 0 },
  { bee: 'Развитая', pct: 40, depth: 1 },
  { bee: 'Хитрая', pct: 40, depth: 3 },
]

describe('combStatus', () => {
  it('have: есть пчела-производитель на складе (берёт с макс. шансом)', () => {
    const s = combStatus('Медовые соты', honeyProducers, new Set(['Развитая']))
    expect(s).toEqual({ comb: 'Медовые соты', state: 'have', bee: 'Развитая', depth: 0 })
  })
  it('ready: производителя нет, но проще всего вывести с depth 0', () => {
    const s = combStatus('Медовые соты', honeyProducers, new Set())
    expect(s).toEqual({ comb: 'Медовые соты', state: 'ready', bee: 'Обычная', depth: 0 })
  })
  it('todo: проще всего вывести с depth > 0', () => {
    const diamond: CombProducerRanked[] = [{ bee: 'Алмазная', pct: 1, depth: 7 }]
    const s = combStatus('Алмазные соты', diamond, new Set())
    expect(s).toEqual({ comb: 'Алмазные соты', state: 'todo', bee: 'Алмазная', depth: 7 })
  })
  it('нет производителей → todo, bee=null', () => {
    const s = combStatus('Фантом соты', [], new Set())
    expect(s).toEqual({ comb: 'Фантом соты', state: 'todo', bee: null, depth: 0 })
  })
  it('сортирует defensively (вход в произвольном порядке)', () => {
    const shuffled: CombProducerRanked[] = [
      { bee: 'Хитрая', pct: 40, depth: 3 },
      { bee: 'Обычная', pct: 35, depth: 0 },
    ]
    expect(combStatus('Медовые соты', shuffled, new Set()).bee).toBe('Обычная')
  })
})

describe('taskProgress', () => {
  it('считает done = число have, ready при полном покрытии', () => {
    const statuses = [
      { comb: 'a', state: 'have' as const, bee: 'x', depth: 0 },
      { comb: 'b', state: 'ready' as const, bee: 'y', depth: 0 },
    ]
    expect(taskProgress(statuses)).toEqual({ done: 1, total: 2, ready: false })
  })
  it('ready=true только когда все соты have и их >0', () => {
    expect(taskProgress([{ comb: 'a', state: 'have', bee: 'x', depth: 0 }])).toEqual({
      done: 1,
      total: 1,
      ready: true,
    })
    expect(taskProgress([])).toEqual({ done: 0, total: 0, ready: false })
  })
})
