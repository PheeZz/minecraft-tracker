import { beeColor, combColor } from '../domain/colors'
import { escapeHtml } from '@/shared/ui/escapeHtml'

/** HTML-строка canvas-иконки пчелы для вставки в HTML-метку ноды графа. */
export function beeIconHtml(name: string, extraClass = ''): string {
  const c = beeColor(name)
  if (!c) return ''
  // цвета берутся из статичной таблицы colors; escapeHtml = defense-in-depth.
  return `<canvas class="bic ${extraClass}" width="16" height="16" data-p="${escapeHtml(c.p)}" data-s="${escapeHtml(c.s)}" data-body="${escapeHtml(c.body ?? '')}"></canvas>`
}

/** HTML-строка canvas-иконки соты. */
export function combIconHtml(name: string, extraClass = ''): string {
  const c = combColor(name)
  if (!c) return ''
  return `<canvas class="cic ${extraClass}" width="16" height="16" data-p="${escapeHtml(c.p)}" data-s="${escapeHtml(c.s)}"></canvas>`
}
