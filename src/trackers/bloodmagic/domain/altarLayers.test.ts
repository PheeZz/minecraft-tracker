import { describe, it, expect } from 'vitest'
import { altarLayers, altarOverview } from './altarLayers'

describe('altarLayers', () => {
  describe('T1 — только алтарь, структуры нет', () => {
    it('возвращает пустой массив', () => {
      expect(altarLayers(1)).toHaveLength(0)
    })
  })

  describe('неизвестный тир', () => {
    it('возвращает пустой массив', () => {
      expect(altarLayers(99)).toHaveLength(0)
    })
  })

  describe('T2 — один слой y=-1 с 8 рунами', () => {
    it('возвращает ровно один слой (плюс y=0 с алтарём)', () => {
      const layers = altarLayers(2)
      // y=-1 (руны) и y=0 (алтарь добавляется принудительно)
      expect(layers.length).toBe(2)
    })

    it('слой y=-1 содержит 8 непустых клеток', () => {
      const layers = altarLayers(2)
      const runeLayer = layers.find((l) => l.y === -1)
      expect(runeLayer).toBeDefined()
      expect(runeLayer!.count).toBe(8)
    })

    it('слой y=0 содержит altar в позиции (0,0)', () => {
      const layers = altarLayers(2)
      const altarLayer = layers.find((l) => l.y === 0)
      expect(altarLayer).toBeDefined()
      const altarCell = altarLayer!.cells.find((c) => c.x === 0 && c.z === 0)
      expect(altarCell?.kind).toBe('altar')
    })

    it('число клеток каждого слоя = width × height', () => {
      for (const layer of altarLayers(2)) {
        expect(layer.cells).toHaveLength(layer.width * layer.height)
      }
    })
  })

  describe('T3 — несколько слоёв', () => {
    it('содержит y=0 с altar в центре', () => {
      const layers = altarLayers(3)
      const altarLayer = layers.find((l) => l.y === 0)
      expect(altarLayer).toBeDefined()
      const altarCell = altarLayer!.cells.find((c) => c.x === 0 && c.z === 0)
      expect(altarCell?.kind).toBe('altar')
    })

    it('содержит отрицательные Y-слои', () => {
      const layers = altarLayers(3)
      const negLayers = layers.filter((l) => l.y < 0)
      expect(negLayers.length).toBeGreaterThanOrEqual(2)
    })

    it('слои отсортированы по убыванию Y (сверху вниз)', () => {
      const layers = altarLayers(3)
      for (let i = 1; i < layers.length; i++) {
        expect(layers[i]!.y).toBeLessThan(layers[i - 1]!.y)
      }
    })

    it('слой y=1 содержит placement-блоки (Светящийся камень)', () => {
      const layers = altarLayers(3)
      const topLayer = layers.find((l) => l.y === 1)
      expect(topLayer).toBeDefined()
      const placements = topLayer!.cells.filter((c) => c.kind === 'placement')
      expect(placements.length).toBeGreaterThan(0)
    })
  })

  describe('метки слоёв', () => {
    it('y=0 → «Уровень алтаря»', () => {
      const layers = altarLayers(2)
      const l = layers.find((l) => l.y === 0)
      expect(l?.label).toBe('Уровень алтаря')
    })

    it('y>0 → «Верх +N»', () => {
      const layers = altarLayers(3)
      const l = layers.find((l) => l.y === 1)
      expect(l?.label).toBe('Верх +1')
    })

    it('y<0 → «Низ −N»', () => {
      const layers = altarLayers(2)
      const l = layers.find((l) => l.y === -1)
      expect(l?.label).toBe('Низ −1')
    })
  })

  describe('altarOverview — top-down проекция', () => {
    it('T1 → null (нет структуры)', () => {
      expect(altarOverview(1)).toBeNull()
    })

    it('неизвестный тир → null', () => {
      expect(altarOverview(99)).toBeNull()
    })

    it('label = «Вся компоновка»', () => {
      const ov = altarOverview(2)
      expect(ov?.label).toBe('Вся компоновка')
    })

    it('число клеток overview = width × height', () => {
      for (const tier of [2, 3, 4, 5, 6]) {
        const ov = altarOverview(tier)
        expect(ov, `tier ${tier}`).not.toBeNull()
        expect(ov!.cells, `tier ${tier}`).toHaveLength(ov!.width * ov!.height)
      }
    })

    it('алтарь в (0,0) присутствует в overview', () => {
      for (const tier of [2, 3, 4, 5, 6]) {
        const ov = altarOverview(tier)
        const altarCell = ov!.cells.find((c) => c.x === 0 && c.z === 0)
        expect(altarCell?.kind, `tier ${tier}`).toBe('altar')
      }
    })

    it('приоритет kind: altar > upgrade > rune > placement — нет ячейки с более низким приоритетом, если есть более высокий', () => {
      // В T3+ должны присутствовать placement-блоки в overview
      const ov3 = altarOverview(3)
      expect(ov3).not.toBeNull()
      // Ни одна ячейка overview не должна быть пустой там, где слои имеют блок
      const layers3 = altarLayers(3)
      const allNonEmpty = new Set(
        layers3.flatMap((l) =>
          l.cells.filter((c) => c.kind !== 'empty').map((c) => `${c.x},${c.z}`),
        ),
      )
      for (const key of allNonEmpty) {
        const [x, z] = key.split(',').map(Number)
        const cell = ov3!.cells.find((c) => c.x === x && c.z === z)
        expect(cell?.kind, `pos ${key} в T3 overview должна быть непустой`).not.toBe('empty')
      }
    })

    it('overview для T6 имеет ту же ширину/высоту, что и отдельные слои T6', () => {
      const layers = altarLayers(6)
      const maxW = layers.reduce((m, l) => Math.max(m, l.width), 0)
      const maxH = layers.reduce((m, l) => Math.max(m, l.height), 0)
      const ov = altarOverview(6)
      expect(ov!.width).toBe(maxW)
      expect(ov!.height).toBe(maxH)
    })
  })

  describe('общие инварианты для T2–T6', () => {
    it('каждый тир имеет слой y=0 с altar', () => {
      for (const tier of [2, 3, 4, 5, 6]) {
        const layers = altarLayers(tier)
        const altarLayer = layers.find((l) => l.y === 0)
        expect(altarLayer, `tier ${tier}: y=0 должен существовать`).toBeDefined()
        const cell = altarLayer!.cells.find((c) => c.x === 0 && c.z === 0)
        expect(cell?.kind, `tier ${tier}`).toBe('altar')
      }
    })

    it('число клеток = width × height для каждого слоя каждого тира', () => {
      for (const tier of [2, 3, 4, 5, 6]) {
        for (const layer of altarLayers(tier)) {
          expect(layer.cells, `tier ${tier} y=${layer.y}`).toHaveLength(layer.width * layer.height)
        }
      }
    })
  })
})
