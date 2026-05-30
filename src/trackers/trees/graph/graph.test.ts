import { describe, it, expect } from 'vitest'
import { TREES } from '../data/trees.data'
import { plantGrid } from './format'
import { labelFor, nodeTemplate } from './nodeLabel'
import { buildEdges, buildNodes } from './elements'
import { computeTiersLayout } from './layouts'

describe('plantGrid', () => {
  it('маппит число саженцев в сетку', () => {
    expect(plantGrid(1)).toBe('1 шт')
    expect(plantGrid(4)).toBe('2×2')
    expect(plantGrid(9)).toBe('3×3')
    expect(plantGrid(16)).toBe('4×4')
    expect(plantGrid(7)).toBe('7 шт')
  })
})

describe('labelFor', () => {
  it('дерево без плода — только имя', () => {
    expect(labelFor({ id: 'Акация', tier: 0, plant: 1 })).toBe('Акация')
  })
  it('дерево с плодом — имя/разделитель/плод', () => {
    expect(labelFor({ id: 'Сакура', tier: 2, plant: 1, fruit: 'Вишня' })).toBe(
      'Сакура\n──────\nВишня',
    )
  })
  it('добавляет пометку посадки 2×2', () => {
    expect(labelFor({ id: 'Гинкго', tier: 8, plant: 4, fruit: 'Семена гинкго' })).toContain('⊞2×2')
  })
})

describe('nodeTemplate', () => {
  it('скрытая нода даёт пустую строку', () => {
    expect(nodeTemplate({ id: 'x', tier: 1, hide: true })).toBe('')
  })
  it('выведенное дерево получает класс node--have', () => {
    const html = nodeTemplate({ id: 'Сакура', tier: 2, st: 2 })
    expect(html).toContain('node--have')
    expect(html).toContain('data-id="Сакура"')
  })
  it('доступное дерево получает класс node--avail', () => {
    expect(nodeTemplate({ id: 'x', tier: 1, st: 0, av: true })).toContain('node--avail')
  })
  it('кнопка инвентаря несёт data-invk', () => {
    expect(nodeTemplate({ id: 'Сакура', tier: 2 })).toContain('data-invk="Сакура"')
  })
})

describe('buildNodes / buildEdges', () => {
  it('по ноде на дерево', () => {
    expect(buildNodes()).toHaveLength(TREES.length)
  })
  it('рёбра ссылаются на существующие ноды и помечают primary', () => {
    const ids = new Set(buildNodes().map((n) => n.data.id))
    const edges = buildEdges()
    expect(edges.length).toBeGreaterThan(0)
    for (const e of edges) {
      expect(ids.has(e.data.source as string)).toBe(true)
      expect(ids.has(e.data.target as string)).toBe(true)
    }
    // у дерева с альтернативами есть и primary, и не-primary рёбра
    const sakura = edges.filter((e) => e.data.target === 'Сакура')
    expect(sakura.some((e) => e.data.primary === true)).toBe(true)
    expect(sakura.some((e) => e.data.primary === false)).toBe(true)
  })
})

describe('computeTiersLayout', () => {
  it('колонки по возрастанию тира, ноды отсортированы по алфавиту', () => {
    const { positions, columns } = computeTiersLayout(
      () => 120,
      () => 40,
    )
    // у каждого дерева есть позиция
    for (const t of TREES) expect(positions[t.id]).toBeDefined()
    // колонки строго по возрастанию x и тира
    for (let i = 1; i < columns.length; i++) {
      expect(columns[i]!.tier).toBeGreaterThan(columns[i - 1]!.tier)
      expect(columns[i]!.x).toBeGreaterThan(columns[i - 1]!.x)
    }
    // все ноды тира делят одну колонку (один x)
    const tier0 = TREES.filter((t) => t.tier === 0).map((t) => positions[t.id]!.x)
    expect(new Set(tier0).size).toBe(1)
  })
})
