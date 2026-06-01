import cytoscape, { type Core } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import nodeHtmlLabel from 'cytoscape-node-html-label'

type CytoscapeExt = Parameters<typeof cytoscape.use>[0]

/** Конфиг одной html-метки узла (cytoscape-node-html-label). */
export interface NodeHtmlLabelConfig {
  query: string
  halign?: 'left' | 'center' | 'right'
  valign?: 'top' | 'center' | 'bottom'
  halignBox?: 'left' | 'center' | 'right'
  valignBox?: 'top' | 'center' | 'bottom'
  tpl: (data: Record<string, unknown>) => string
}

/** Core с методом, добавляемым расширением node-html-label. */
export type CoreWithHtmlLabel = Core & { nodeHtmlLabel(configs: NodeHtmlLabelConfig[]): void }

let registered = false
/** Идемпотентная регистрация dagre + node-html-label (вызывать перед первым cytoscape()). */
export function registerCytoscapeBase(): void {
  if (registered) return
  registered = true
  cytoscape.use(dagre as CytoscapeExt)
  ;(nodeHtmlLabel as (cy: typeof cytoscape) => void)(cytoscape)
}
