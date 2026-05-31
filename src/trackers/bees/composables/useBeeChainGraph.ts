import cytoscape, { type Core } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import nodeHtmlLabel from 'cytoscape-node-html-label'
import { BEE_BY_ID } from '../data/bees.data'
import { beeColor } from '../domain/colors'
import { beeIconHtml, combIconHtml } from '../graph/iconHtml'
import { paintIcons } from './useBeeTextures'

let extReady = false
function registerExtensions(): void {
  if (extReady) return
  cytoscape.use(dagre as Parameters<typeof cytoscape.use>[0])
  ;(nodeHtmlLabel as (cy: typeof cytoscape) => void)(cytoscape)
  extReady = true
}

interface NodeHtmlConfig {
  query: string
  halign?: string
  valign?: string
  halignBox?: string
  valignBox?: string
  tpl: (data: Record<string, unknown>) => string
}
type CoreWithHtmlLabel = Core & { nodeHtmlLabel(c: NodeHtmlConfig[]): void }

export interface BeeChainCallbacks {
  /** Текущая выбранная сота (для иконки-продукта на ноде). */
  curComb: () => string | null
  /** Текущая цель. */
  curTarget: () => string | null
  /** Тап по ноде-пчеле. */
  onTapBee: (id: string) => void
  /** Тап по ромбу-рецепту (циклирует рецепт потомка). */
  onTapRecipe: (childId: string) => void
}

/** Цепочка-граф пчёл поверх Cytoscape. cy пересоздаётся при каждом rebuild. */
export function useBeeChainGraph(cb: BeeChainCallbacks) {
  let cy: Core | null = null
  let container: HTMLElement | null = null
  let rafId = 0
  let panTimer: ReturnType<typeof setTimeout> | null = null
  let introTimer: ReturnType<typeof setTimeout> | null = null

  function repaint(): void {
    if (rafId || !container) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      if (container) paintIcons(container)
    })
  }

  function mount(el: HTMLElement): void {
    registerExtensions()
    container = el
  }

  function rebuild(elements: cytoscape.ElementDefinition[]): void {
    if (!container) return
    // снимаем вход, чтобы при новом графе он проигрался заново (is-ready оставляем —
    // граф уже видим, не моргаем; вход нод проигрывается поверх).
    container.classList.remove('cy-intro')
    if (introTimer) clearTimeout(introTimer)
    cy?.destroy()
    cy = cytoscape({
      container,
      elements,
      wheelSensitivity: 2, // скорость зума колесом
      pixelRatio: 1, // не растрить canvas под devicePixelRatio (касается только рёбер/ромбов)
      minZoom: 0.2,
      maxZoom: 2.4,
      style: [
        {
          selector: 'node[kind="bee"]',
          style: {
            label: 'data(label)',
            'text-opacity': 0,
            'background-opacity': 0,
            'border-width': 0,
            width: 'label',
            height: 'label',
            padding: '16px',
            shape: 'round-rectangle',
            'font-size': 13,
            'font-weight': 700,
            'text-wrap': 'wrap',
            'text-max-width': 120,
            'text-valign': 'center',
            'text-halign': 'center',
          },
        },
        {
          selector: 'node[kind="recipe"]',
          style: {
            shape: 'diamond',
            'background-color': '#f4c452',
            'border-width': 1.5,
            'border-color': '#bf821a',
            label: 'data(label)',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': 10,
            'font-weight': 700,
            color: '#3a2a08',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 36,
            height: 36,
          },
        },
        {
          selector: 'edge',
          style: { width: 1.8, 'line-color': '#cbb78f', 'curve-style': 'bezier' },
        },
        {
          selector: 'edge[kind="out"]',
          style: {
            'line-color': '#b89a64',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#b89a64',
            'arrow-scale': 1,
          },
        },
        {
          selector: 'edge[kind="in"]',
          style: { 'line-color': '#cbb78f', width: 1.5, 'target-arrow-shape': 'none' },
        },
      ] as cytoscape.StylesheetStyle[],
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 22,
        rankSep: 70,
        edgeSep: 8,
      } as cytoscape.LayoutOptions,
    })
    ;(cy as CoreWithHtmlLabel).nodeHtmlLabel([
      {
        query: 'node[kind="bee"]',
        valign: 'center',
        halign: 'center',
        valignBox: 'center',
        halignBox: 'center',
        tpl: (d) => beeNodeTemplate(d as unknown as BeeNodeData),
      },
    ])

    cy.on('tap', 'node', (e) => {
      const id = e.target.id()
      if (id.startsWith('rec::')) cb.onTapRecipe(id.slice(5))
      else cb.onTapBee(id)
    })
    // canvas-иконки расширение пересоздаёт только на add/data/style (на pan/zoom — лишь
    // CSS-transform обёртки), поэтому перекрашиваем здесь, а не на каждом кадре панорамы.
    cy.on('add data style', repaint)
    // «лёгкий рендер» при панораме/зуме (как у графа деревьев): на время движения снимаем
    // тени с карточек, чтобы браузер не композил их каждый кадр.
    cy.on('pan zoom', () => {
      if (!document.body.classList.contains('is-panning')) document.body.classList.add('is-panning')
      if (panTimer) clearTimeout(panTimer)
      panTimer = setTimeout(() => document.body.classList.remove('is-panning'), 160)
    })
    cy.ready(() => {
      cy?.fit(undefined, 45)
      setTimeout(() => container && paintIcons(container), 60)
      // проявить контейнер + запустить вход нод (снимаем cy-intro после окна анимации,
      // чтобы пересоздание карточек на data/style не перезапускало вход)
      container?.classList.add('is-ready', 'cy-intro')
      introTimer = setTimeout(() => container?.classList.remove('cy-intro'), 600)
    })
  }

  interface BeeNodeData {
    id: string
    src: string
    wild: number
    alt: number
  }
  function beeNodeTemplate(d: BeeNodeData): string {
    const target = cb.curTarget()
    const comb = cb.curComb()
    const b = BEE_BY_ID[d.id]
    const has = haveSet.has(d.id)
    const cls = ['gnode', `g-${d.src}`]
    if (d.wild) cls.push('g-wild')
    if (d.alt) cls.push('g-alt')
    if (has && d.id !== target) cls.push('g-have')
    if (d.id === target) cls.push('g-target')
    const ci =
      comb && b && b.products.some((p) => p.name === comb)
        ? `<span class="gcomb" title="${comb}">${combIconHtml(comb)}</span>`
        : ''
    const pc = has ? '#2f7d5e' : (beeColor(d.id)?.p ?? '#cdbb95')
    const hv = has && d.id !== target ? '<span class="ghav" title="есть на складе">✓</span>' : ''
    return `<div class="${cls.join(' ')}" style="--pc:${pc}">${beeIconHtml(d.id)}<span class="gn">${d.id}</span>${hv}${d.alt ? '<span class="gflag">⇄</span>' : ''}${ci}</div>`
  }

  // склад выставляется снаружи перед rebuild (используется в шаблоне ноды)
  let haveSet: ReadonlySet<string> = new Set()
  function setHave(s: ReadonlySet<string>): void {
    haveSet = s
  }

  function fit(): void {
    cy?.fit(undefined, 45)
  }
  /** Ресинхронизация размера после повторного показа (KeepAlive) без сброса пан/зума. */
  function resize(): void {
    cy?.resize()
  }
  function destroy(): void {
    if (rafId) cancelAnimationFrame(rafId)
    if (panTimer) clearTimeout(panTimer)
    if (introTimer) clearTimeout(introTimer)
    document.body.classList.remove('is-panning')
    cy?.destroy()
    cy = null
    container = null
  }

  return { mount, rebuild, fit, resize, destroy, setHave }
}
