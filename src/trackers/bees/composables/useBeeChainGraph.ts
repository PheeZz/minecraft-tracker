import cytoscape, { type Core } from 'cytoscape'
import { BEE_BY_ID } from '../data/bees.data'
import { beeColor } from '../domain/colors'
import { beeIconHtml, combIconHtml } from '../graph/iconHtml'
import { paintIcons } from './useBeeTextures'
import { BEE_GRAPH_STYLE } from '../graph/style'
import { escapeHtml } from '@/shared/ui/escapeHtml'
import {
  registerCytoscapeBase,
  type CoreWithHtmlLabel,
} from '@/shared/cytoscape/registerExtensions'

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
  let paintTimer: ReturnType<typeof setTimeout> | null = null
  let panTimer: ReturnType<typeof setTimeout> | null = null
  let introTimer: ReturnType<typeof setTimeout> | null = null

  function repaint(): void {
    if (!container) return
    // node-html-label пересоздаёт карточки (и обнуляет внутренний canvas-иконок)
    // через setTimeout(0). Наш обработчик зарегистрирован ПОСЛЕ него, поэтому
    // планируем перекраску тоже через setTimeout(0) — она выполнится УЖЕ ПОСЛЕ
    // пересоздания. На requestAnimationFrame была гонка: rAF мог сработать ДО
    // пересоздания, красил устаревший canvas, и иконки моргали/пропадали.
    if (paintTimer) clearTimeout(paintTimer)
    paintTimer = setTimeout(() => {
      paintTimer = null
      if (container) paintIcons(container)
    }, 0)
  }

  function mount(el: HTMLElement): void {
    registerCytoscapeBase()
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
      style: BEE_GRAPH_STYLE,
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
        ? `<span class="gcomb" title="${escapeHtml(comb)}">${combIconHtml(comb)}</span>`
        : ''
    const pc = has ? '#2f7d5e' : (beeColor(d.id)?.p ?? '#cdbb95')
    const hv = has && d.id !== target ? '<span class="ghav" title="есть на складе">✓</span>' : ''
    return `<div class="${cls.join(' ')}" data-id="${escapeHtml(d.id)}" style="--pc:${pc}">${beeIconHtml(d.id)}<span class="gn">${escapeHtml(d.id)}</span>${hv}${d.alt ? '<span class="gflag">⇄</span>' : ''}${ci}</div>`
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
    if (paintTimer) clearTimeout(paintTimer)
    if (panTimer) clearTimeout(panTimer)
    if (introTimer) clearTimeout(introTimer)
    document.body.classList.remove('is-panning')
    cy?.destroy()
    cy = null
    container = null
  }

  return { mount, rebuild, fit, resize, destroy, setHave }
}
