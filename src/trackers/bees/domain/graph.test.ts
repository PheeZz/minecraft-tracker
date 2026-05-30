import { describe, it, expect } from 'vitest'
import { makeDepth, planSteps, recipeOf } from './graph'
import { COMBS, REAL } from './combs'

describe('recipeOf', () => {
  it('возвращает первый рецепт по умолчанию, null у диких', () => {
    expect(recipeOf('Развитая', {})).toEqual({
      p1: 'Обычная',
      p2: 'дикая пчела (из улья)',
      chance: 12,
    })
    expect(recipeOf('Лесная', {})).toBeNull()
  })
  it('учитывает выбранный индекс рецепта (с клампом)', () => {
    // у «Бережливая» два рецепта
    expect(recipeOf('Бережливая', { Бережливая: 1 })?.p2).toBe('Жестокая')
    expect(recipeOf('Бережливая', { Бережливая: 99 })?.p2).toBe('Жестокая') // кламп к последнему
  })
})

describe('makeDepth', () => {
  it('дикая и имеющаяся пчела = 0', () => {
    const depth = makeDepth(new Set())
    expect(depth('Лесная')).toBe(0) // дикая
    const depthHave = makeDepth(new Set(['Развитая']))
    expect(depthHave('Развитая')).toBe(0) // на складе
  })
  it('глубина растёт по цепочке', () => {
    const depth = makeDepth(new Set())
    expect(depth('Обычная')).toBe(0) // оба родителя дикие
    expect(depth('Развитая')).toBe(1) // Обычная(0) + дикая
    expect(depth('Знатная')).toBe(2) // Обычная(0) + Развитая(1)
  })
  it('склад укорачивает глубину', () => {
    const depth = makeDepth(new Set(['Развитая']))
    expect(depth('Знатная')).toBe(1) // Развитая готова → 1
  })

  it('берёт max по ВСЕМ рецептам, не по выбранному (depth не зависит от rc)', () => {
    // «Бережливая»: рецепты [Скромная(дикая,0)+Зловещая] и [Скромная+Жестокая].
    // depth = 1 + max глубины среди всех родителей всех рецептов.
    const depth = makeDepth(new Set())
    const d = depth('Бережливая')
    expect(d).toBeGreaterThanOrEqual(1 + depth('Зловещая'))
    expect(d).toBeGreaterThanOrEqual(1 + depth('Жестокая'))
  })

  it('cycle guard: искусственный цикл не приводит к переполнению стека', () => {
    // makeDepth работает с реальными данными (ацикличны); здесь проверяем,
    // что повторный вход по уже посещённому узлу не зацикливается на реальной
    // глубокой цепочке (косвенная проверка guard через мемоизацию).
    const depth = makeDepth(new Set())
    expect(() => depth('Карательная')).not.toThrow()
    expect(depth('Карательная')).toBeGreaterThan(0)
  })
})

describe('planSteps', () => {
  it('родители раньше потомков; дикие и склад разделены', () => {
    const { bred, wild, have } = planSteps('Знатная', new Set(), {})
    expect(bred).toContain('Знатная')
    expect(bred).toContain('Обычная')
    expect(bred).toContain('Развитая')
    expect(bred.indexOf('Обычная')).toBeLessThan(bred.indexOf('Развитая'))
    expect(bred.indexOf('Развитая')).toBeLessThan(bred.indexOf('Знатная'))
    expect(have).toEqual([])
    expect(wild).toEqual([]) // дикие-родители у Обычной не REAL (из улья), в wild не попадают
  })
  it('имеющиеся берутся готовыми и не углубляются', () => {
    const { bred, have } = planSteps('Знатная', new Set(['Развитая']), {})
    expect(have).toContain('Развитая')
    expect(bred).not.toContain('Развитая')
    expect(bred).toContain('Знатная')
  })
})

describe('COMBS/REAL', () => {
  it('индекс сот непустой и производители реальны', () => {
    expect(COMBS['Медовые соты']?.length).toBeGreaterThan(1)
    for (const list of Object.values(COMBS))
      for (const p of list) expect(REAL.has(p.bee)).toBe(true)
  })
})
