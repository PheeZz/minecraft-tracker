import { describe, it, expect } from 'vitest'
import { buildAspectGraph, aspectPath, solveResearch, ASPECT_BY_TAG } from './aspects'
import type { Aspect } from './types'

// мини-вселенная: aqua/ignis/perditio — праймалы, venenum=aqua+perditio,
// gelum=ignis+perditio, solo — изолированный праймал без связей.
const A = (tag: string, components: string[] = []): Aspect => ({
  tag,
  mod: 'Test',
  label: tag,
  nameRu: tag,
  nameEn: tag,
  color: '#fff',
  rainbow: false,
  primal: components.length === 0,
  components,
})
const UNIVERSE: Aspect[] = [
  A('aqua'),
  A('ignis'),
  A('perditio'),
  A('venenum', ['aqua', 'perditio']),
  A('gelum', ['ignis', 'perditio']),
  A('solo'),
]
const g = buildAspectGraph(UNIVERSE)

describe('buildAspectGraph', () => {
  it('соединяет аспект с его прямыми компонентами в обе стороны', () => {
    expect(g.get('venenum')).toEqual(new Set(['aqua', 'perditio']))
    expect(g.get('aqua')?.has('venenum')).toBe(true)
    expect(g.get('perditio')?.has('venenum')).toBe(true)
  })
  it('изолированный аспект без компонентов не имеет связей', () => {
    expect(g.get('solo')?.size).toBe(0)
  })
})

describe('aspectPath', () => {
  it('строит путь, где соседи связаны (компонент-оф)', () => {
    const p = aspectPath('aqua', 'gelum', g)
    expect(p).not.toBeNull()
    expect(p![0]).toBe('aqua')
    expect(p![p!.length - 1]).toBe('gelum')
    for (let i = 1; i < p!.length; i++) expect(g.get(p![i - 1]!)?.has(p![i]!)).toBe(true)
  })
  it('возвращает [from] для одинаковых концов и null для недостижимого', () => {
    expect(aspectPath('aqua', 'aqua', g)).toEqual(['aqua'])
    expect(aspectPath('aqua', 'solo', g)).toBeNull()
  })
})

describe('solveResearch', () => {
  it('связывает все требуемые аспекты в одну сеть', () => {
    const s = solveResearch(['aqua', 'gelum'], g)
    expect(s.unreachable).toEqual([])
    expect(s.nodes).toEqual(expect.arrayContaining(['aqua', 'gelum']))
    // каждое ребро — реальная связь графа
    for (const [a, b] of s.edges) expect(g.get(a)?.has(b)).toBe(true)
    // сеть связна: из aqua по edges достижим gelum
    const adj = new Map<string, string[]>()
    for (const [a, b] of s.edges) {
      ;(adj.get(a) ?? adj.set(a, []).get(a)!).push(b)
      ;(adj.get(b) ?? adj.set(b, []).get(b)!).push(a)
    }
    const seen = new Set(['aqua'])
    const q = ['aqua']
    while (q.length) {
      for (const m of adj.get(q.shift()!) ?? []) {
        if (!seen.has(m)) {
          seen.add(m)
          q.push(m)
        }
      }
    }
    expect(seen.has('gelum')).toBe(true)
  })
  it('помечает недостижимые требуемые аспекты', () => {
    const s = solveResearch(['aqua', 'solo'], g)
    expect(s.unreachable).toContain('solo')
  })
  it('неизвестные графу теги попадают в unreachable, а не отбрасываются молча', () => {
    const s = solveResearch(['aqua', 'нет_такого'], g)
    expect(s.unreachable).toContain('нет_такого')
    expect(s.nodes).toContain('aqua')
  })
})

describe('реальные данные', () => {
  it('решает свиток с праймалами + составными без недостижимых', () => {
    const s = solveResearch(['aqua', 'praecantatio', 'gelum'])
    expect(s.unreachable).toEqual([])
    expect(s.nodes.length).toBeGreaterThanOrEqual(3)
    expect(ASPECT_BY_TAG.get('aqua')?.primal).toBe(true)
  })
})
