import cytoscape, { type Core, type LayoutOptions, type NodeSingular } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import nodeHtmlLabel from 'cytoscape-node-html-label'
import { BY_ID, TIERS } from '../data/trees.data'
import { isAvailable, type ProgressMap } from '../domain/graph'
import { FRUIT_CHAIN } from '../domain/plan'
import { buildEdges, buildNodes } from '../graph/elements'
import { computeTiersLayout, LAYOUTS, type LayoutKey } from '../graph/layouts'
import { nodeTemplate, type NodeRenderData } from '../graph/nodeLabel'
import { GRAPH_STYLE } from '../graph/style'
import { ensureTreeTextures, paintTreeIcons, paintTreeIconsFor } from './useTreeTextures'

/** Сигнатура метода, добавляемого расширением node-html-label. */
interface NodeHtmlLabelConfig {
  query: string
  halign?: 'left' | 'center' | 'right'
  valign?: 'top' | 'center' | 'bottom'
  halignBox?: 'left' | 'center' | 'right'
  valignBox?: 'top' | 'center' | 'bottom'
  tpl: (data: Record<string, unknown>) => string
}
type CoreWithHtmlLabel = Core & { nodeHtmlLabel(configs: NodeHtmlLabelConfig[]): void }
type CytoscapeExt = Parameters<typeof cytoscape.use>[0]

// Расширения регистрируются один раз на модуль. ELK сюда НЕ входит — он тяжёлый
// (~1 МБ elkjs) и нужен только для elk-раскладок, поэтому грузится ленирно (ensureElk).
let extensionsRegistered = false
function registerExtensions(): void {
  if (extensionsRegistered) return
  cytoscape.use(dagre as CytoscapeExt)
  ;(nodeHtmlLabel as (cy: typeof cytoscape) => void)(cytoscape)
  extensionsRegistered = true
}

// Ленивая регистрация ELK: динамический import выносит elkjs в отдельный чанк,
// который качается только при первом выборе elk-раскладки. cytoscape.use идемпотентен.
let elkRegistered = false
async function ensureElk(): Promise<void> {
  if (elkRegistered) return
  const elk = (await import('cytoscape-elk')).default
  cytoscape.use(elk as CytoscapeExt)
  elkRegistered = true
}

export type LineageDir = 'ancestors' | 'descendants'

export interface TreeGraphCallbacks {
  /** Тап по ноде (id, удерживался ли shift — потомки вместо предков). */
  onSelect?: (id: string, shift: boolean) => void
  /** Тап по пустому месту. */
  onBackground?: () => void
  /** Клик по кнопке-коробке инвентаря на ноде. */
  onInventory?: (id: string, clientX: number, clientY: number) => void
  /** Наведение/уход — для тултипа (null = ушли). */
  onHover?: (id: string | null, box?: { x: number; y: number }) => void
}

export interface FilterOptions {
  visibleTiers: ReadonlySet<number>
  onlyAvail: boolean
  onlyFruit: boolean
  onlyFruitful: boolean
}

const COMFORT_ZOOM = 1.25

/** Детерминированный цвет ребра по id целевой ноды (для подсветки предков). */
function colorForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return `hsl(${h % 360}, 85%, 62%)`
}

/**
 * Оркестратор графа деревьев поверх Cytoscape. Граф — императивный слой;
 * источник правды (прогресс) живёт в сторе и синхронизируется через applyStates().
 */
export function useTreeGraph(callbacks: TreeGraphCallbacks = {}) {
  let cy: Core | null = null
  let currentLayout: LayoutKey = 'tiers'
  let tierColumns: { tier: number; x: number }[] = []
  let headersEl: HTMLElement | null = null
  let containerEl: HTMLElement | null = null
  let panTimer: ReturnType<typeof setTimeout> | null = null
  let introTimer: ReturnType<typeof setTimeout> | null = null
  let filterAnimTimer: ReturnType<typeof setTimeout> | null = null
  let invHandler: ((e: MouseEvent) => void) | null = null
  let iconFlushTimer: ReturnType<typeof setTimeout> | null = null
  // иконки перекрашиваем точечно: копим id нод, чьи карточки пересоздались
  // (флаг allIcons — полная перерисовка, например когда догрузились текстуры).
  const dirtyIcons = new Set<string>()
  let allIcons = false

  /**
   * Одноразовая анимация появления: проявляем контейнер (is-ready) и запускаем
   * ступенчатый вход нод (cy-intro). cy-intro снимаем после окна анимации —
   * иначе пересоздание карточки на data/style-событии (выбор/фильтр/поиск)
   * перезапустило бы вход и мигало бы. Вызывать ПОСЛЕ первого applyStates.
   */
  function playIntro(): void {
    if (!containerEl) return
    containerEl.classList.add('is-ready', 'cy-intro')
    introTimer = setTimeout(() => containerEl?.classList.remove('cy-intro'), 950)
  }

  function flushIconPaint(): void {
    iconFlushTimer = null
    if (!containerEl) return
    if (allIcons) paintTreeIcons(containerEl)
    else paintTreeIconsFor(containerEl, dirtyIcons)
    allIcons = false
    dirtyIcons.clear()
  }
  // ВАЖНО: flush через setTimeout(0), а НЕ requestAnimationFrame. node-html-label
  // пересоздаёт карточку (и обнуляет её canvas) тоже через setTimeout(0), а его обработчик
  // зарегистрирован раньше нашего. clear+reschedule на каждое событие гарантирует, что
  // наш flush встанет в очередь ПОСЛЕ всех пересозданий батча — иначе свежие canvas
  // остались бы непокрашенными и иконки пропадали бы (например при клике/подсветке).
  function scheduleFlush(): void {
    if (!containerEl) return
    if (iconFlushTimer) clearTimeout(iconFlushTimer)
    iconFlushTimer = setTimeout(flushIconPaint, 0)
  }
  /** Иконка одной ноды (её карточка пересоздалась) — перекрасить точечно. */
  function scheduleNodeIcon(id: string): void {
    dirtyIcons.add(id)
    scheduleFlush()
  }
  /** Полная перерисовка всех иконок (текстуры догрузились / первичная отрисовка). */
  function repaintAllIcons(): void {
    allIcons = true
    scheduleFlush()
  }

  const setData = (n: NodeSingular, key: string, val: unknown): void => {
    if (n.data(key) !== val) n.data(key, val)
  }

  function lockMinZoom(): void {
    if (!cy) return
    cy.minZoom(Math.min(cy.zoom() * 0.55, 1))
  }

  // ---------- tier-заголовки ----------
  function buildTierHeaders(): void {
    if (!headersEl) return
    if (currentLayout !== 'tiers' || !tierColumns.length) {
      headersEl.innerHTML = ''
      return
    }
    headersEl.innerHTML = tierColumns
      .map(
        (c) =>
          `<div class="tier-tab t--${c.tier}" data-tx="${c.x}">${c.tier === 0 ? 'T0 · из мира' : 'T' + c.tier}</div>`,
      )
      .join('')
  }
  function updateTierHeaders(): void {
    if (!headersEl || !cy) return
    if (currentLayout !== 'tiers') {
      if (headersEl.childElementCount) headersEl.innerHTML = ''
      return
    }
    const zoom = cy.zoom()
    const panX = cy.pan().x
    for (const el of Array.from(headersEl.children) as HTMLElement[]) {
      el.style.left = `${parseFloat(el.dataset.tx ?? '0') * zoom + panX}px`
    }
  }

  // ---------- раскладки ----------
  function tiersLayout(): void {
    if (!cy) return
    const { positions, columns } = computeTiersLayout(
      (id) => cy!.getElementById(id).width(),
      (id) => cy!.getElementById(id).height(),
    )
    tierColumns = columns
    cy.nodes().forEach((n) => {
      const p = positions[n.id()]
      if (p) n.position(p)
    })
    cy.minZoom(0.001)
    cy.fit(undefined, 50)
    lockMinZoom()
    buildTierHeaders()
    updateTierHeaders()
  }

  function runLayout(key?: LayoutKey): void {
    if (!cy) return
    currentLayout = key ?? currentLayout
    if (currentLayout === 'tiers') {
      tiersLayout()
      return
    }
    // elk грузится лениво; для остальных раскладок запускаем сразу
    if (currentLayout === 'elk-layered' || currentLayout === 'elk-layered-tb') {
      void ensureElk().then(runCyLayout)
      return
    }
    runCyLayout()
  }

  /** Запуск cytoscape-раскладки по currentLayout (после возможной догрузки elk). */
  function runCyLayout(): void {
    if (!cy) return
    // мог смениться, пока грузился elk; tiers — отдельной веткой
    if (currentLayout === 'tiers') {
      tiersLayout()
      return
    }
    const opts = LAYOUTS[currentLayout]
    if (!opts) return
    if (headersEl) headersEl.innerHTML = ''
    cy.minZoom(0.001)
    cy.one('layoutstop', lockMinZoom)
    cy.layout({ ...opts, fit: true, padding: 30, animate: false } as LayoutOptions).run()
  }

  // ---------- состояния нод ----------
  function applyStates(progress: ProgressMap): void {
    if (!cy) return
    cy.batch(() => {
      cy!.nodes().forEach((n) => {
        const id = n.id()
        const s = progress[id] ?? 0
        setData(n, 'st', s)
        setData(n, 'av', s === 0 && isAvailable(progress, id))
      })
    })
  }

  // ---------- «поток» по рёбрам родословной (marching ants) ----------
  // Гоним line-dash-offset у .hl-рёбер через rAF — пунктир «течёт» к потомку.
  // Цикл живёт ТОЛЬКО пока есть подсветка: сам останавливается, когда .hl пусто
  // (снятие выбора), и не запускается при prefers-reduced-motion.
  let flowRaf = 0
  let flowOffset = 0
  const motionOk = (): boolean => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  function startEdgeFlow(): void {
    if (flowRaf || !cy || !motionOk()) return
    const tick = (): void => {
      if (!cy) {
        flowRaf = 0
        return
      }
      const hl = cy.edges('.hl')
      if (hl.empty()) {
        flowRaf = 0
        return
      }
      flowOffset -= 0.55
      hl.style('line-dash-offset', flowOffset)
      flowRaf = requestAnimationFrame(tick)
    }
    flowRaf = requestAnimationFrame(tick)
  }
  function stopEdgeFlow(): void {
    if (flowRaf) cancelAnimationFrame(flowRaf)
    flowRaf = 0
  }

  // ---------- подсветка родословной ----------
  function clearHighlight(): void {
    if (!cy) return
    stopEdgeFlow()
    cy.batch(() => {
      cy!.nodes().forEach((n) => setData(n, 'faded', false))
      cy!.edges().removeClass('dim hl')
      cy!.edges().removeStyle('line-color target-arrow-color width opacity line-dash-offset')
    })
  }
  function highlightLineage(id: string, dir: LineageDir): void {
    if (!cy) return
    clearHighlight()
    const start = cy.getElementById(id)
    const keep = (dir === 'ancestors' ? start.predecessors() : start.successors()).union(start)
    const keepNodes = keep.nodes()
    cy.batch(() => {
      cy!.nodes().forEach((n) => setData(n, 'faded', !keepNodes.contains(n)))
      cy!.edges().addClass('dim')
      keep.edges().removeClass('dim').addClass('hl')
      keep.edges().forEach((e) => {
        const c = dir === 'descendants' ? '#c9a7f0' : colorForId(e.data('target'))
        e.style({ 'line-color': c, 'target-arrow-color': c, width: 3, opacity: 1 })
      })
    })
    startEdgeFlow()
  }

  function selectNode(id: string | null): void {
    if (!cy) return
    cy.batch(() => cy!.nodes().forEach((n) => setData(n, 'sel', n.id() === id)))
  }

  function focus(id: string): void {
    if (!cy) return
    selectNode(id)
    highlightLineage(id, 'ancestors')
    cy.animate(
      { center: { eles: cy.getElementById(id) }, zoom: COMFORT_ZOOM },
      { duration: 400, easing: 'ease-in-out-cubic' },
    )
  }

  /** Как focus, но возвращает промис, резолвящийся по завершении пан/зума
     (нужно туру, чтобы подсветить ноду уже на финальной позиции). */
  function tourFocus(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (!cy) return resolve()
      const node = cy.getElementById(id)
      if (node.empty()) return resolve()
      selectNode(id)
      highlightLineage(id, 'ancestors')
      // если граф уничтожат во время анимации (уход с вкладки) — промис всё равно
      // должен разрешиться, иначе шаг тура зависнет навсегда
      cy.one('destroy', () => resolve())
      cy.animate(
        { center: { eles: node }, zoom: COMFORT_ZOOM },
        { duration: motionOk() ? 400 : 0, easing: 'ease-in-out-cubic', complete: () => resolve() },
      )
    })
  }

  function fit(): void {
    // только видимые: при активных фильтрах скрытые ноды не должны влиять на вписывание
    cy?.animate({ fit: { eles: cy.elements(':visible'), padding: 30 } }, { duration: 300 })
  }

  /** Кратко подсветить ноды (эффект «новодоступных» при выведении). */
  function flash(ids: string[], ms = 1300): void {
    if (!cy || !ids.length) return
    ids.forEach((id) => setData(cy!.getElementById(id), 'flash', true))
    setTimeout(() => {
      if (!cy) return
      ids.forEach((id) => setData(cy!.getElementById(id), 'flash', false))
    }, ms)
  }

  function toggleAllEdges(on: boolean): void {
    cy?.batch(() => cy!.edges().toggleClass('show', on))
  }

  // ---------- поиск ----------
  /**
   * Возвращает id найденных нод. Опирается на актуальный data('hide'),
   * поэтому вызывающий обязан вызвать applyFilters() ДО search() (см. ragu.html).
   * Авто-фокус при единственном совпадении выполняет вызывающий: focus(ids[0]).
   */
  function search(query: string): string[] {
    if (!cy) return []
    const q = query.trim().toLowerCase()
    if (!q) {
      clearHighlight()
      return []
    }
    const matches = cy.nodes().filter(
      (n) =>
        !n.data('hide') &&
        (n.id().toLowerCase().includes(q) ||
          String(n.data('fruit') ?? '')
            .toLowerCase()
            .includes(q)),
    )
    cy.batch(() => {
      cy!.nodes().forEach((n) => setData(n, 'faded', !matches.contains(n)))
      cy!.edges().addClass('dim')
      matches.connectedEdges().removeClass('dim')
    })
    return matches.map((n) => n.id())
  }

  // ---------- фильтры ----------
  function applyFilters(opts: FilterOptions): void {
    if (!cy) return
    let availKeep: Set<string> | null = null
    if (opts.onlyAvail) {
      availKeep = new Set()
      cy.nodes().forEach((n) => {
        const id = n.id()
        const main = BY_ID[id]?.parents?.[0]
        if (main && (n.data('st') ?? 0) === 0 && n.data('av')) {
          availKeep!.add(id)
          for (const parent of main) availKeep!.add(parent)
        }
      })
    }
    let flipped = false
    cy.batch(() => {
      cy!.nodes().forEach((n) => {
        const id = n.id()
        const t = BY_ID[id]
        let visible = !!t && opts.visibleTiers.has(t.tier)
        if (opts.onlyFruit) visible = visible && FRUIT_CHAIN.has(id)
        if (opts.onlyFruitful) visible = visible && !!t?.fruit
        if (opts.onlyAvail) visible = visible && (availKeep!.has(id) || n.data('st') === 2)
        // Меняем данные/класс ТОЛЬКО при фактической смене видимости. Иначе на первом
        // вызове hide идёт undefined→false у всех нод, что шлёт 'data' по всем 131 →
        // node-html-label пересоздаёт все карточки и перекрашивает все иконки.
        // (!! приводит undefined к false.)
        if (!!n.data('hide') !== !visible) {
          setData(n, 'anim', visible ? 'in' : 'out') // плавный вход/выход карточки
          setData(n, 'hide', !visible)
          flipped = true
        }
        if (n.hasClass('filtered') !== !visible) n.toggleClass('filtered', !visible)
      })
      cy!.edges().forEach((e) => {
        const hide = e.source().hasClass('filtered') || e.target().hasClass('filtered')
        if (e.hasClass('hidden') !== hide) e.toggleClass('hidden', hide)
      })
    })
    // снять транзиентные anim-флаги после окна анимации (карточки перерисуются в
    // финальное состояние: показанные — без класса, скрытые — снова в '' пусто).
    if (flipped) {
      if (filterAnimTimer) clearTimeout(filterAnimTimer)
      filterAnimTimer = setTimeout(() => {
        cy?.batch(() => cy!.nodes().forEach((n) => n.data('anim') && n.removeData('anim')))
      }, 280)
    }
  }

  // ---------- инициализация ----------
  function mount(container: HTMLElement, tierHeaders: HTMLElement): void {
    registerExtensions()
    ensureTreeTextures()
    headersEl = tierHeaders
    containerEl = container
    cy = cytoscape({
      container,
      elements: [...buildNodes(), ...buildEdges()],
      wheelSensitivity: 2, // скорость зума колесом
      pixelRatio: 1, // не растрить canvas под devicePixelRatio (рёбра/якоря; ноды — DOM)
      minZoom: 0.001,
      maxZoom: 3,
      style: GRAPH_STYLE,
      layout: { name: 'preset' },
    })
    ;(cy as CoreWithHtmlLabel).nodeHtmlLabel([
      {
        query: 'node',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl: (d) => nodeTemplate(d as unknown as NodeRenderData),
      },
    ])

    cy.on('tap', 'node', (evt) => {
      const oe = evt.originalEvent as MouseEvent | undefined
      callbacks.onSelect?.(evt.target.id(), !!oe?.shiftKey)
    })
    cy.on('tap', (evt) => {
      if (evt.target === cy) callbacks.onBackground?.()
    })
    cy.on('mouseover', 'node', (evt) => {
      const bb = evt.target.renderedBoundingBox()
      callbacks.onHover?.(evt.target.id(), { x: (bb.x1 + bb.x2) / 2, y: bb.y1 })
    })
    cy.on('mouseout', 'node', () => callbacks.onHover?.(null))

    // клик по кнопке-коробке инвентаря: HTML-метки пересоздаются расширением,
    // поэтому слушаем делегированно на document (снимается в destroy).
    invHandler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-invk]')
      const id = el?.dataset.invk
      if (id) callbacks.onInventory?.(id, e.clientX, e.clientY)
    }
    document.addEventListener('click', invHandler)

    // лёгкий рендер при панораме/зуме + синхронизация заголовков
    cy.on('pan zoom', () => {
      updateTierHeaders()
      callbacks.onHover?.(null)
      if (!document.body.classList.contains('is-panning')) document.body.classList.add('is-panning')
      if (panTimer) clearTimeout(panTimer)
      panTimer = setTimeout(() => document.body.classList.remove('is-panning'), 160)
    })
    // node-html-label пересоздаёт canvas-иконку (заново гоняет tpl) ТОЛЬКО на add/data/style,
    // и только у изменившейся ноды (на pan/zoom лишь двигает CSS-transform обёртки). Поэтому
    // перекрашиваем точечно иконку этой ноды, а не все 131 — иначе изменение одной ноды
    // дёргало бы перерисовку иконок у всех (включая нетронутые).
    cy.on('add data style', 'node', (e) => scheduleNodeIcon(e.target.id()))
  }

  function onReady(cb: () => void): void {
    cy?.ready(cb)
  }

  function resize(): void {
    if (!cy) return
    cy.resize()
    updateTierHeaders()
    if (currentLayout === 'tiers') tiersLayout()
    else {
      cy.minZoom(0.001)
      cy.fit(undefined, 30)
      lockMinZoom()
    }
  }

  /** Лёгкая ресинхронизация размера без раскладки/fit — сохраняет пан/зум
   *  (для возврата на вкладку KeepAlive, где габариты контейнера те же). */
  function revalidateSize(): void {
    if (!cy) return
    cy.resize()
    updateTierHeaders()
  }

  function destroy(): void {
    if (panTimer) clearTimeout(panTimer)
    if (introTimer) clearTimeout(introTimer)
    if (filterAnimTimer) clearTimeout(filterAnimTimer)
    if (iconFlushTimer) clearTimeout(iconFlushTimer)
    stopEdgeFlow()
    if (invHandler) {
      document.removeEventListener('click', invHandler)
      invHandler = null
    }
    document.body.classList.remove('is-panning')
    cy?.destroy()
    cy = null
    headersEl = null
    containerEl = null
  }

  return {
    mount,
    onReady,
    playIntro,
    destroy,
    resize,
    revalidateSize,
    runLayout,
    applyStates,
    highlightLineage,
    clearHighlight,
    selectNode,
    focus,
    tourFocus,
    fit,
    flash,
    // пауза/возобновление «потока» рёбер — чтобы rAF не крутился, пока вкладка
    // деактивирована KeepAlive (граф не виден). На возврате стартует, если есть подсветка.
    pauseEdgeFlow: stopEdgeFlow,
    resumeEdgeFlow: startEdgeFlow,
    toggleAllEdges,
    search,
    applyFilters,
    updateTierHeaders,
    repaintIcons: repaintAllIcons,
    get currentLayout() {
      return currentLayout
    },
    /** Инфо о тире для рендера тултипа/заголовков. */
    tierInfo: (tier: number) => TIERS.find((t) => t.id === tier),
  }
}
