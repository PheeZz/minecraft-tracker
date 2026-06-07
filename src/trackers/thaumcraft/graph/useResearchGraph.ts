import cytoscape, { type Core, type ElementDefinition, type LayoutOptions } from 'cytoscape'
import {
  registerCytoscapeBase,
  type CoreWithHtmlLabel,
} from '@/shared/cytoscape/registerExtensions'
import { RESEARCH_GRAPH_STYLE } from './style'
import { researchNodeTemplate, type ResearchNodeData } from './nodeLabel'
import { researchState } from '../domain/research'

export type GraphLayout = 'preset' | 'dagre'

/** Контекст состояния нод (прогресс/цель/выбор) для перекраски без пересборки. */
export interface GraphStyleContext {
  done: ReadonlySet<string>
  goal: string | null
  selected: string | null
}

export interface ResearchGraphCallbacks {
  /** Тап по ноде-свитку. */
  onTap: (key: string) => void
}

const motionOk = (): boolean => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Граф исследований поверх Cytoscape. cy пересоздаётся при каждом rebuild
 * (наборы элементов малы: дерево — одна категория, граф — замыкание цели).
 * preset — позиции из элементов (Thaumonomicon-сетка); dagre — сверху вниз.
 */
export function useResearchGraph(cb: ResearchGraphCallbacks) {
  let cy: Core | null = null
  let container: HTMLElement | null = null
  let panTimer: ReturnType<typeof setTimeout> | null = null
  let introTimer: ReturnType<typeof setTimeout> | null = null

  function mount(el: HTMLElement): void {
    registerCytoscapeBase()
    container = el
  }

  function layoutOptions(layout: GraphLayout): LayoutOptions {
    if (layout === 'dagre') {
      return {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 26,
        rankSep: 64,
        edgeSep: 10,
        animate: false,
      } as LayoutOptions
    }
    return { name: 'preset' }
  }

  function rebuild(elements: ElementDefinition[], layout: GraphLayout): void {
    if (!container) return
    container.classList.remove('cy-intro')
    if (introTimer) clearTimeout(introTimer)
    cy?.destroy()
    cy = cytoscape({
      container,
      elements,
      wheelSensitivity: 2,
      pixelRatio: 1,
      minZoom: 0.15,
      maxZoom: 2.4,
      style: RESEARCH_GRAPH_STYLE,
      layout: layoutOptions(layout),
    })
    ;(cy as CoreWithHtmlLabel).nodeHtmlLabel([
      {
        query: 'node',
        valign: 'center',
        halign: 'center',
        valignBox: 'center',
        halignBox: 'center',
        tpl: (d) => researchNodeTemplate(d as unknown as ResearchNodeData),
      },
    ])

    cy.on('tap', 'node', (e) => cb.onTap(e.target.id()))

    // «лёгкий рендер» при панораме/зуме: на время движения снимаем тени карточек.
    cy.on('pan zoom', () => {
      if (!document.body.classList.contains('is-panning')) document.body.classList.add('is-panning')
      if (panTimer) clearTimeout(panTimer)
      panTimer = setTimeout(() => document.body.classList.remove('is-panning'), 160)
    })

    cy.ready(() => {
      cy?.fit(undefined, 40)
      container?.classList.add('is-ready')
      // вход нод проигрываем только если движение разрешено
      if (motionOk()) {
        container?.classList.add('cy-intro')
        introTimer = setTimeout(() => container?.classList.remove('cy-intro'), 600)
      }
    })
  }

  /** Обновить состояние нод (прогресс/цель/выбор) без пересборки и релэйаута. */
  function restyle(ctx: GraphStyleContext): void {
    if (!cy) return
    cy.batch(() => {
      cy?.nodes().forEach((n) => {
        const key = n.id()
        n.data('st', researchState(key, ctx.done))
        n.data('goal', key === ctx.goal)
        n.data('sel', key === ctx.selected)
      })
    })
  }

  function fit(): void {
    cy?.fit(undefined, 40)
  }
  /** Ресинхронизация размера после повторного показа (KeepAlive). */
  function resize(): void {
    cy?.resize()
  }
  function destroy(): void {
    if (panTimer) clearTimeout(panTimer)
    if (introTimer) clearTimeout(introTimer)
    document.body.classList.remove('is-panning')
    cy?.destroy()
    cy = null
    container = null
  }

  return { mount, rebuild, restyle, fit, resize, destroy }
}
