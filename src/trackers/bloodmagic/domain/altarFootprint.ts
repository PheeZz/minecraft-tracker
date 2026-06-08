// Доменная функция: top-down проекция структуры алтаря для заданного тира.
// Чистая функция без сайд-эффектов — легко тестируется.
import { ALTAR_TIERS } from '../data/altar.data'

export type CellKind = 'altar' | 'rune' | 'upgrade' | 'placement' | 'empty'

export interface FootCell {
  x: number
  z: number
  kind: CellKind
  // Количество y-слоёв, занятых в данной (x,z)-колонке (≥1 для непустых клеток)
  layers: number
}

export interface AltarFootprint {
  // Ширина и высота сетки в клетках (по осям x и z соответственно)
  width: number
  height: number
  // Смещение: клетка (0,0) расположена в индексе (-minX, -minZ) сетки
  minX: number
  minZ: number
  cells: FootCell[]
}

// Приоритет kind при нескольких блоках в одной (x,z)-колонке:
// upgrade-слот → placement → rune (чтобы важные позиции не терялись)
const KIND_PRIORITY: Record<CellKind, number> = {
  altar: 4,
  upgrade: 3,
  placement: 2,
  rune: 1,
  empty: 0,
}

// Строит top-down проекцию мультиблок-структуры алтаря для указанного тира.
// Возвращает полный прямоугольник cells (включая пустые клетки) — удобно
// для рендера через CSS-grid с фиксированным числом колонок.
export function altarFootprint(tier: number): AltarFootprint {
  const tierData = ALTAR_TIERS.find((t) => t.tier === tier)

  // Тир 1 — нет окружающей структуры, только алтарь в центре
  if (!tierData || tierData.components.length === 0) {
    return {
      width: 1,
      height: 1,
      minX: 0,
      minZ: 0,
      cells: [{ x: 0, z: 0, kind: 'altar', layers: 1 }],
    }
  }

  // Собираем проекцию: для каждой (x,z) — приоритетный kind и число слоёв
  const projection = new Map<string, { kind: CellKind; layers: number }>()

  for (const block of tierData.components) {
    const key = `${block.x},${block.z}`
    const existing = projection.get(key)

    const kind = blockKind(block)
    const layers = (existing?.layers ?? 0) + 1
    const mergedKind =
      existing && KIND_PRIORITY[existing.kind] >= KIND_PRIORITY[kind] ? existing.kind : kind

    projection.set(key, { kind: mergedKind, layers })
  }

  // Добавляем центр алтаря (0,0) — его нет в components по условию данных
  projection.set('0,0', { kind: 'altar', layers: 1 })

  // Вычисляем границы сетки
  const xs = [...projection.keys()].map((k) => parseInt(k.split(',')[0]!))
  const zs = [...projection.keys()].map((k) => parseInt(k.split(',')[1]!))
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const width = maxX - minX + 1
  const height = maxZ - minZ + 1

  // Разворачиваем в плоский массив, заполняя пустые позиции
  const cells: FootCell[] = []
  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      const entry = projection.get(`${x},${z}`)
      cells.push({
        x,
        z,
        kind: entry?.kind ?? 'empty',
        layers: entry?.layers ?? 0,
      })
    }
  }

  return { width, height, minX, minZ, cells }
}

// Определяет kind одного блока из данных
function blockKind(block: {
  isUpgradeSlot: boolean
  isPlacement: boolean
  isBloodRune: boolean
}): CellKind {
  if (block.isUpgradeSlot) return 'upgrade'
  if (block.isPlacement) return 'placement'
  if (block.isBloodRune) return 'rune'
  return 'rune' // остальные блоки структуры (булыжник и т.д.) — отображаем как рune
}
