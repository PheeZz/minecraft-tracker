import { describe, it, expect } from 'vitest'
import { altarFootprint } from './altarFootprint'

describe('altarFootprint', () => {
  describe('T1 — только алтарь, нет окружающей структуры', () => {
    it('возвращает сетку 1×1', () => {
      const fp = altarFootprint(1)
      expect(fp.width).toBe(1)
      expect(fp.height).toBe(1)
    })

    it('единственная клетка — kind altar в центре', () => {
      const fp = altarFootprint(1)
      expect(fp.cells).toHaveLength(1)
      expect(fp.cells[0]).toMatchObject({ x: 0, z: 0, kind: 'altar' })
    })
  })

  describe('T2 — кольцо 3×3 вокруг алтаря', () => {
    it('сетка 3×3 = 9 клеток', () => {
      const fp = altarFootprint(2)
      expect(fp.width).toBe(3)
      expect(fp.height).toBe(3)
      expect(fp.cells).toHaveLength(9)
    })

    it('центр — алтарь', () => {
      const fp = altarFootprint(2)
      const center = fp.cells.find((c) => c.x === 0 && c.z === 0)
      expect(center?.kind).toBe('altar')
    })

    it('8 клеток кольца — rune или upgrade (не empty)', () => {
      const fp = altarFootprint(2)
      const ring = fp.cells.filter((c) => !(c.x === 0 && c.z === 0))
      expect(ring).toHaveLength(8)
      for (const cell of ring) {
        expect(cell.kind).not.toBe('empty')
      }
    })

    it('все 8 рун — один слой (y=-1, плоская структура T2)', () => {
      const fp = altarFootprint(2)
      const ring = fp.cells.filter((c) => !(c.x === 0 && c.z === 0))
      for (const cell of ring) {
        expect(cell.layers).toBe(1)
      }
    })
  })

  describe('T3 — углы (±3,±3) имеют столбы (layers > 1)', () => {
    it('сетка шире 3×3 (охватывает x,z до ±3)', () => {
      const fp = altarFootprint(3)
      expect(fp.width).toBeGreaterThan(3)
      expect(fp.minX).toBeLessThanOrEqual(-3)
    })

    it('угловые позиции (±3,±3) — layers > 1 (столбы из булыжника 3 слоя)', () => {
      const fp = altarFootprint(3)
      const corners = [
        { x: -3, z: -3 },
        { x: 3, z: -3 },
        { x: -3, z: 3 },
        { x: 3, z: 3 },
      ]
      for (const { x, z } of corners) {
        const cell = fp.cells.find((c) => c.x === x && c.z === z)
        expect(cell, `угол (${x},${z}) должен существовать`).toBeDefined()
        expect(cell!.layers, `угол (${x},${z}) должен иметь >1 слоя`).toBeGreaterThan(1)
      }
    })
  })

  describe('общие инварианты', () => {
    it('клетка алтаря всегда присутствует в центре для всех тиров', () => {
      for (const tier of [1, 2, 3, 4, 5, 6]) {
        const fp = altarFootprint(tier)
        const altar = fp.cells.find((c) => c.x === 0 && c.z === 0)
        expect(altar?.kind, `tier ${tier}`).toBe('altar')
      }
    })

    it('число клеток = width × height', () => {
      for (const tier of [1, 2, 3, 4, 5, 6]) {
        const fp = altarFootprint(tier)
        expect(fp.cells).toHaveLength(fp.width * fp.height)
      }
    })

    it('неизвестный тир → возвращает T1 (только алтарь)', () => {
      const fp = altarFootprint(99)
      expect(fp.cells).toHaveLength(1)
      expect(fp.cells[0]?.kind).toBe('altar')
    })
  })
})
