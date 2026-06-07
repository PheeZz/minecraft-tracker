import type { ElementDefinition } from 'cytoscape'
import { RESEARCH } from '../data/research.data'
import { RESEARCH_BY_KEY, prerequisiteClosure, researchState, catName } from '../domain/research'
import type { Research } from '../domain/types'

/** Шаг сетки Thaumonomicon для preset-раскладки дерева категории. */
export const GX = 250
export const GY = 150

interface NodeContext {
  done: ReadonlySet<string>
  goal: string | null
  selected: string | null
}

function nodeData(r: Research, ctx: NodeContext): ElementDefinition {
  return {
    data: {
      id: r.key,
      label: r.name,
      name: r.name,
      cat: catName(r.category),
      st: researchState(r.key, ctx.done),
      goal: r.key === ctx.goal,
      sel: r.key === ctx.selected,
    },
  }
}

/** Ребро родитель→потомок. */
function edge(parent: string, child: string, hl: boolean): ElementDefinition {
  return {
    data: { id: `${parent}>${child}`, source: parent, target: child },
    classes: hl ? 'hl' : undefined,
  }
}

/**
 * Элементы дерева ОДНОЙ категории с preset-позициями (displayColumn/Row).
 * Рёбра — только между свитками той же категории (оба конца показаны).
 */
export function buildCategoryElements(category: string, ctx: NodeContext): ElementDefinition[] {
  const items = RESEARCH.filter((r) => r.category === category)
  const inCat = new Set(items.map((r) => r.key))
  const els: ElementDefinition[] = items.map((r) => ({
    ...nodeData(r, ctx),
    position: { x: r.displayColumn * GX, y: r.displayRow * GY },
  }))
  for (const r of items) {
    for (const p of r.parents) {
      if (inCat.has(p)) els.push(edge(p, r.key, false))
    }
  }
  return els
}

/**
 * Элементы графа предпосылок цели: цель ∪ её транзитивные предки; рёбра
 * родитель→потомок среди этого множества. Раскладку (dagre) задаёт композабл.
 */
export function buildGoalElements(goal: string, ctx: NodeContext): ElementDefinition[] {
  if (!RESEARCH_BY_KEY.has(goal)) return []
  const keys = prerequisiteClosure(goal)
  keys.add(goal)
  const els: ElementDefinition[] = []
  for (const key of keys) {
    const r = RESEARCH_BY_KEY.get(key)
    if (r) els.push(nodeData(r, ctx))
  }
  for (const key of keys) {
    for (const p of RESEARCH_BY_KEY.get(key)?.parents ?? []) {
      if (keys.has(p)) els.push(edge(p, key, true))
    }
  }
  return els
}
