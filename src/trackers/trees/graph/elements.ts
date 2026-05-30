import type { ElementDefinition } from 'cytoscape'
import { TIERS, TREES } from '../data/trees.data'
import { labelFor } from './nodeLabel'

const tierColor = (tier: number): string => TIERS.find((t) => t.id === tier)?.color ?? '#888'

/** Ноды графа: невидимый canvas-якорь (метка задаёт размер), data для HTML-метки. */
export function buildNodes(): ElementDefinition[] {
  return TREES.map((t) => ({
    data: {
      id: t.id,
      label: labelFor(t),
      fruit: t.fruit ?? '—',
      frt: t.fruit ?? '',
      plant: t.plant,
      tier: t.tier,
    },
  }))
}

/**
 * Рёбра: для каждого рецепта (включая альтернативы) — ребро от каждого родителя
 * к потомку. primary=первый рецепт, col — цвет тира потомка.
 */
export function buildEdges(): ElementDefinition[] {
  const edges: ElementDefinition[] = []
  for (const t of TREES) {
    if (!t.parents) continue
    t.parents.forEach((pair, idx) => {
      for (const parent of pair) {
        edges.push({
          data: {
            id: `${parent}>${t.id}#${idx}`,
            source: parent,
            target: t.id,
            primary: idx === 0,
            col: tierColor(t.tier),
          },
        })
      }
    })
  }
  return edges
}
