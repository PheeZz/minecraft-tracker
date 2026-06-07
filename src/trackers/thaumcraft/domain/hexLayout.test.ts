import { describe, it, expect } from 'vitest'
import { layoutSolution, type HexPos } from './hexLayout'
import type { AspectSolution } from './aspects'

const hexDist = (a: HexPos, b: HexPos): number =>
  (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2

describe('layoutSolution', () => {
  it('даёт уникальные ячейки и ставит связанные узлы рядом (цепочка)', () => {
    const sol: AspectSolution = {
      nodes: ['a', 'b', 'c', 'd'],
      edges: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
      ],
      unreachable: [],
    }
    const pos = layoutSolution(sol)
    expect(pos.size).toBe(4)
    // уникальность координат
    const keys = new Set([...pos.values()].map((p) => `${p.q},${p.r}`))
    expect(keys.size).toBe(4)
    // соседние по ребру — на расстоянии 1 (цепочка без коллизий укладывается смежно)
    for (const [x, y] of sol.edges) expect(hexDist(pos.get(x)!, pos.get(y)!)).toBe(1)
  })

  it('пустое решение → пустая раскладка', () => {
    expect(layoutSolution({ nodes: [], edges: [], unreachable: [] }).size).toBe(0)
  })

  it('размещает все узлы даже при ветвлении (хаб со многими соседями)', () => {
    const sol: AspectSolution = {
      nodes: ['h', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
      edges: [
        ['h', 'a'],
        ['h', 'b'],
        ['h', 'c'],
        ['h', 'd'],
        ['h', 'e'],
        ['h', 'f'],
        ['h', 'g'], // 7 соседей у хаба — больше 6, один уйдёт в ближайшую свободную
      ],
      unreachable: [],
    }
    const pos = layoutSolution(sol)
    expect(pos.size).toBe(8)
    expect(new Set([...pos.values()].map((p) => `${p.q},${p.r}`)).size).toBe(8)
  })
})
