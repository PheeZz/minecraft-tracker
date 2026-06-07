import { escapeHtml } from '@/shared/ui/escapeHtml'
import type { ResearchState } from '../domain/research'

/** Данные рендера HTML-ноды исследования (из data() элемента Cytoscape). */
export interface ResearchNodeData {
  id: string
  /** RU-имя свитка (видимая подпись, полностью). */
  name: string
  /** RU-имя вкладки изучения (категории) — боковой ярлык. */
  cat: string
  /** Состояние прогресса. */
  st: ResearchState
  /** Это активная цель? */
  goal?: boolean
  /** Узел выбран (показывается в деталях). */
  sel?: boolean
}

/** HTML-шаблон видимой карточки-ноды (.rnode). Классы задают цвет по состоянию. */
export function researchNodeTemplate(d: ResearchNodeData): string {
  const cls = ['rnode', `rnode--${d.st}`]
  if (d.goal) cls.push('rnode--goal')
  if (d.sel) cls.push('rnode--sel')
  const CHECK_SVG =
    '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>'
  const STAR_SVG =
    '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9.6l6.9-.7z"/></svg>'
  const check =
    d.st === 'done' ? `<span class="rnode__ok" aria-hidden="true">${CHECK_SVG}</span>` : ''
  const ring = d.goal ? `<span class="rnode__star" aria-hidden="true">${STAR_SVG}</span>` : ''
  const cat = d.cat ? `<span class="rnode__cat">${escapeHtml(d.cat)}</span>` : ''
  return `<div class="${cls.join(' ')}" data-id="${escapeHtml(d.id)}">${cat}<span class="rnode__body">${ring}<span class="rnode__nm">${escapeHtml(d.name)}</span>${check}</span></div>`
}
