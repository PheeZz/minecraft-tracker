import { ICONS } from '@/shared/icons/icons'
import type { Tree } from '../domain/types'
import { plantGrid } from './format'
import { fruitIconHtml, treeIconHtml } from './iconHtml'

/**
 * Невидимая многострочная метка для canvas-ноды — служит ТОЛЬКО для расчёта
 * размера бокса (по нему раскладка считает зазоры). Совпадает с ragu.html labelFor.
 */
export function labelFor(t: Tree): string {
  const mark = t.plant > 1 ? ` ⊞${plantGrid(t.plant)}` : ''
  if (!t.fruit) return t.id + mark
  return `${t.id}${mark}\n──────\n${t.fruit}`
}

/** Данные рендера HTML-ноды (из data() элемента Cytoscape). */
export interface NodeRenderData {
  id: string
  tier: number
  /** Состояние прогресса (0/2). */
  st?: number
  /** Доступно к выведению. */
  av?: boolean
  sel?: boolean
  faded?: boolean
  flash?: boolean
  hide?: boolean
  /** Транзиентная анимация фильтра: 'in' | 'out' (выставляется applyFilters). */
  anim?: 'in' | 'out'
  /** Плод (пусто, если нет). */
  frt?: string
  /** Стоимость посадки (саженцев). */
  plant?: number
}

/** HTML-шаблон видимой ноды (.node). Перенос tpl из ragu.html nodeHtmlLabel. */
export function nodeTemplate(d: NodeRenderData): string {
  // Скрытая нода без анимации — карточки нет вовсе (как раньше). Во время fade-out
  // (anim==='out') карточку рендерим, чтобы было что анимировать.
  if (d.hide && d.anim !== 'out') return ''
  let cls = `node t--${d.tier}`
  if (d.st === 2) cls += ' node--have'
  else if (d.av) cls += ' node--avail'
  if (d.sel) cls += ' node--sel'
  if (d.faded) cls += ' node--faded'
  if (d.flash) cls += ' node--flash'
  if (d.anim === 'in') cls += ' node--in'
  else if (d.anim === 'out') cls += ' node--out'

  const fruit = d.frt ? `<div class="node__fruit">${fruitIconHtml(d.frt)}${d.frt}</div>` : ''
  const plant =
    d.plant && d.plant > 1
      ? `<span class="node__plant" title="Посадка ${plantGrid(d.plant)} (${d.plant} саженцев)">⊞${plantGrid(d.plant)}</span>`
      : ''

  return `<div class="${cls}" data-id="${d.id}">
      <span class="node__badge">T${d.tier}</span>
      ${plant}
      <span class="node__check"><span class="icon">${ICONS.checkPlain}</span></span>
      <div class="node__head">${treeIconHtml(d.id) || '<span class="node__dot"></span>'}<span class="node__name">${d.id}</span></div>
      ${fruit}
      <span class="node__inv" data-invk="${d.id}" title="Инвентарь саженцев/пыльцы"><span class="icon">${ICONS.box}</span></span>
    </div>`
}
