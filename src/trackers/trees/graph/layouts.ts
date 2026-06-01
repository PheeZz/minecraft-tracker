import type { LayoutOptions } from 'cytoscape'
import { TREES } from '../data/trees.data'

export type LayoutKey = 'tiers' | 'dagre-lr' | 'dagre-tb' | 'breadthfirst'

/** Все валидные ключи раскладок (для валидации persisted-значений и UI). */
export const LAYOUT_KEYS: readonly LayoutKey[] = ['tiers', 'dagre-lr', 'dagre-tb', 'breadthfirst']

/** Конфиги раскладок (кроме 'tiers' — она считается вручную). Перенос из ragu.html. */
export const LAYOUTS: Record<Exclude<LayoutKey, 'tiers'>, LayoutOptions> = {
  'dagre-lr': {
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 28,
    edgeSep: 12,
    rankSep: 140,
  } as LayoutOptions,
  'dagre-tb': {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 28,
    edgeSep: 12,
    rankSep: 140,
  } as LayoutOptions,
  breadthfirst: { name: 'breadthfirst', directed: true, padding: 20, spacingFactor: 2 },
}

export const TIERS_GAP_X = 160
export const TIERS_GAP_Y = 60
export const TIERS_EXTRA_W = 22
export const TIERS_EXTRA_H = 18

export interface TierColumn {
  tier: number
  x: number
}
export interface TiersLayoutResult {
  positions: Record<string, { x: number; y: number }>
  columns: TierColumn[]
}

/**
 * Раскладка «по тирам»: колонки по тиру, ноды в колонке по алфавиту.
 * width/height — аксессоры фактических размеров нод (из живого cy);
 * вынесены параметрами, чтобы расчёт был тестируемым без рендера.
 * Логика 1:1 с ragu.html tiersLayout.
 */
export function computeTiersLayout(
  width: (id: string) => number,
  height: (id: string) => number,
): TiersLayoutResult {
  const byTier = new Map<number, string[]>()
  for (const t of TREES) {
    const list = byTier.get(t.tier) ?? []
    list.push(t.id)
    byTier.set(t.tier, list)
  }
  for (const list of byTier.values()) list.sort((a, b) => a.localeCompare(b, 'ru'))

  const tiers = [...byTier.keys()].sort((a, b) => a - b)
  const W = (id: string): number => width(id) + TIERS_EXTRA_W
  const H = (id: string): number => height(id) + TIERS_EXTRA_H

  const positions: Record<string, { x: number; y: number }> = {}
  const columns: TierColumn[] = []
  let cx = 0
  let prevColW = 0

  tiers.forEach((tier, ci) => {
    const ids = byTier.get(tier)!
    const colW = Math.max(...ids.map(W))
    cx = ci === 0 ? colW / 2 : cx + prevColW / 2 + TIERS_GAP_X + colW / 2
    const totalH = ids.reduce((s, id) => s + H(id), 0) + TIERS_GAP_Y * (ids.length - 1)
    let y = -totalH / 2
    for (const id of ids) {
      const h = H(id)
      positions[id] = { x: cx, y: y + h / 2 }
      y += h + TIERS_GAP_Y
    }
    columns.push({ tier, x: cx })
    prevColW = colW
  })

  return { positions, columns }
}
