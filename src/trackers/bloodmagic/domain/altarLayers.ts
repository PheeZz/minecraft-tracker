// Доменная функция: послойная (по Y) разбивка мультиблок-структуры алтаря.
// Чистая, без сайд-эффектов — легко тестируется.
// Заменяет altarFootprint (top-down проекция с ×N), которая была непонятна игрокам.
import { ALTAR_TIERS } from '../data/altar.data'

export type LayerCellKind = 'altar' | 'rune' | 'upgrade' | 'placement' | 'empty'

export interface LayerCell {
  x: number
  z: number
  kind: LayerCellKind
  // Русское название блока для title-подсказки
  name_ru: string
}

export interface AltarLayer {
  y: number
  // «Уровень алтаря» / «Верх +N» / «Низ −N»
  label: string
  // Число непустых клеток (без altar-клетки на y=0 — она структурная, не считается)
  count: number
  width: number
  height: number
  minX: number
  minZ: number
  cells: LayerCell[]
}

// Приоритет kind при наложении нескольких блоков (на случай будущих изменений данных)
const KIND_PRIORITY: Record<LayerCellKind, number> = {
  altar: 5,
  upgrade: 4,
  placement: 3,
  rune: 2,
  empty: 0,
}

// Строит человекочитаемую метку для слоя
function layerLabel(y: number): string {
  if (y === 0) return 'Уровень алтаря'
  if (y > 0) return `Верх +${y}`
  return `Низ −${Math.abs(y)}`
}

// Определяет kind блока по его флагам (upgrade приоритетнее rune)
function blockKind(block: { isUpgradeSlot: boolean; isPlacement: boolean }): LayerCellKind {
  if (block.isUpgradeSlot) return 'upgrade'
  if (block.isPlacement) return 'placement'
  return 'rune'
}

// Из набора блоков одного Y-слоя строит прямоугольную сетку LayerCell[].
// Добавляет altar-клетку в (0,0) только если y === 0.
function buildLayerGrid(
  y: number,
  blocks: (typeof ALTAR_TIERS)[0]['components'],
): Omit<AltarLayer, 'y' | 'label' | 'count'> {
  // Собираем клетки по позиции (x,z): приоритетный kind и название
  const map = new Map<string, { kind: LayerCellKind; name_ru: string }>()

  for (const b of blocks) {
    const key = `${b.x},${b.z}`
    const kind = blockKind(b)
    const existing = map.get(key)
    if (!existing || KIND_PRIORITY[kind] > KIND_PRIORITY[existing.kind]) {
      map.set(key, { kind, name_ru: b.name_ru })
    }
  }

  // На слое y=0 всегда добавляем алтарь в центре (0,0)
  if (y === 0) {
    map.set('0,0', { kind: 'altar', name_ru: 'Алтарь крови' })
  }

  // Вычисляем границы
  const xs = [...map.keys()].map((k) => parseInt(k.split(',')[0]!))
  const zs = [...map.keys()].map((k) => parseInt(k.split(',')[1]!))
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const width = maxX - minX + 1
  const height = maxZ - minZ + 1

  // Разворачиваем в полный прямоугольник (включая пустые клетки)
  const cells: LayerCell[] = []
  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      const entry = map.get(`${x},${z}`)
      cells.push({
        x,
        z,
        kind: entry?.kind ?? 'empty',
        name_ru: entry?.name_ru ?? '',
      })
    }
  }

  return { width, height, minX, minZ, cells }
}

// Разбивает структуру алтаря заданного тира по уровням Y.
// Слои отсортированы сверху вниз (больший Y первым — как смотрим сквозь структуру).
// T1: возвращает пустой массив (алтарь не требует окружающей структуры).
export function altarLayers(tier: number): AltarLayer[] {
  const tierData = ALTAR_TIERS.find((t) => t.tier === tier)

  // Тир 1 или неизвестный тир — нет многоблочной структуры
  if (!tierData || tierData.components.length === 0) return []

  // Группируем компоненты по Y
  const byY = new Map<number, (typeof tierData.components)[0][]>()
  for (const block of tierData.components) {
    const arr = byY.get(block.y) ?? []
    arr.push(block)
    byY.set(block.y, arr)
  }

  // На y=0 может не быть компонентов из данных, но алтарь туда добавится в buildLayerGrid.
  // Убеждаемся, что y=0 включён в карту (даже если пустой).
  if (!byY.has(0)) byY.set(0, [])

  // Строим слои и сортируем сверху вниз
  const layers: AltarLayer[] = []
  for (const [y, blocks] of byY.entries()) {
    const grid = buildLayerGrid(y, blocks)
    // Считаем непустые клетки (altar не считается — он всегда присутствует)
    const count = grid.cells.filter((c) => c.kind !== 'empty' && c.kind !== 'altar').length
    layers.push({ y, label: layerLabel(y), count, ...grid })
  }

  // Сортировка: больший Y (выше в мире) — первым
  layers.sort((a, b) => b.y - a.y)

  return layers
}
