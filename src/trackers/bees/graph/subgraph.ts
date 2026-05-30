import type { ElementDefinition } from 'cytoscape'
import { BEE_BY_ID } from '../data/bees.data'
import { beeColor } from '../domain/colors'
import { pale } from '../domain/colors'
import { REAL } from '../domain/combs'
import { recipeOf, type RecipeChoice } from '../domain/graph'

/**
 * Подграф выведения цели по ВЫБРАННЫМ рецептам: пары родителей → ромб-рецепт
 * (с шансом) → потомок. Имеющиеся на складе виды не раскрываются. Перенос chain-макета.
 */
export function buildSubgraph(
  target: string,
  have: ReadonlySet<string>,
  rc: RecipeChoice,
): ElementDefinition[] {
  const nodes = new Set<string>([target])
  const stack = [target]
  while (stack.length) {
    const id = stack.pop()!
    if (id !== target && have.has(id)) continue // имеющуюся не раскрываем
    const r = recipeOf(id, rc)
    if (!r) continue
    for (const p of [r.p1, r.p2]) {
      if (REAL.has(p) && !nodes.has(p)) {
        nodes.add(p)
        stack.push(p)
      }
    }
  }

  const els: ElementDefinition[] = []
  for (const id of nodes) {
    const b = BEE_BY_ID[id]
    if (!b) continue
    const alt = b.parents.length > 1
    const bc = beeColor(id)
    els.push({
      data: {
        id,
        label: id + (alt ? '  ⇄' : ''),
        src: b.source,
        wild: b.parents.length ? 0 : 1,
        alt: alt ? 1 : 0,
        have: have.has(id) ? 1 : 0,
        kind: 'bee',
        bg: bc ? pale(bc.p) : '#fffaf0',
      },
    })
  }
  for (const id of nodes) {
    if (id !== target && have.has(id)) continue // у имеющейся рецепт не рисуем
    const r = recipeOf(id, rc)
    if (!r) continue
    const real = [r.p1, r.p2].filter((p) => REAL.has(p))
    if (!real.length) continue // выведена от диких — без ромба
    const rid = `rec::${id}`
    els.push({ data: { id: rid, label: `${r.chance}%`, kind: 'recipe', forBee: id } })
    els.push({ data: { id: `${rid}>out`, source: rid, target: id, kind: 'out' } })
    real.forEach((p, i) => {
      els.push({ data: { id: `${p}>${rid}#${i}`, source: p, target: rid, kind: 'in' } })
    })
  }
  return els
}
