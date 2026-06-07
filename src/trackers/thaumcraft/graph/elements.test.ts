import type { ElementDefinition } from 'cytoscape'
import { describe, expect, it } from 'vitest'
import { RESEARCH } from '../data/research.data'
import { RESEARCH_BY_KEY, prerequisiteClosure } from '../domain/research'
import { GX, GY, buildCategoryElements, buildGoalElements } from './elements'

const EMPTY = { done: new Set<string>(), goal: null, selected: null }

const isNode = (e: ElementDefinition): boolean =>
  (e.data as { source?: string }).source === undefined

describe('buildCategoryElements', () => {
  const cat = RESEARCH[0]!.category

  it('включает только свитки своей категории и расставляет их по сетке', () => {
    const els = buildCategoryElements(cat, EMPTY)
    const nodes = els.filter(isNode)
    const expected = RESEARCH.filter((r) => r.category === cat)
    expect(nodes).toHaveLength(expected.length)
    const first = expected[0]!
    const node = nodes.find((n) => n.data.id === first.key)!
    expect(node.position).toEqual({ x: first.displayColumn * GX, y: first.displayRow * GY })
  })

  it('строит рёбра родитель→потомок только внутри категории', () => {
    const els = buildCategoryElements(cat, EMPTY)
    const inCat = new Set(RESEARCH.filter((r) => r.category === cat).map((r) => r.key))
    for (const e of els.filter((x) => !isNode(x))) {
      const d = e.data as { source: string; target: string }
      expect(inCat.has(d.source)).toBe(true)
      expect(inCat.has(d.target)).toBe(true)
    }
  })
})

describe('buildGoalElements', () => {
  // берём свиток с непустым замыканием предпосылок
  const goal = RESEARCH.find((r) => prerequisiteClosure(r.key).size > 0)!.key

  it('содержит цель и все её предпосылки', () => {
    const els = buildGoalElements(goal, { ...EMPTY, goal })
    const ids = new Set(els.filter(isNode).map((n) => n.data.id))
    expect(ids.has(goal)).toBe(true)
    for (const k of prerequisiteClosure(goal)) expect(ids.has(k)).toBe(true)
  })

  it('помечает узел цели флагом goal', () => {
    const els = buildGoalElements(goal, { ...EMPTY, goal })
    const node = els.filter(isNode).find((n) => n.data.id === goal)!
    expect((node.data as { goal: boolean }).goal).toBe(true)
  })

  it('пустой результат для несуществующего ключа', () => {
    expect(buildGoalElements('__NOPE__', EMPTY)).toEqual([])
    expect(RESEARCH_BY_KEY.has('__NOPE__')).toBe(false)
  })
})
