import { ICONS } from '@/shared/icons/icons'
import { treeIcon } from '../domain/icons'
import { fruitIconUrl } from '../domain/fruitIcon'
import { escapeHtml } from '@/shared/ui/escapeHtml'

/** HTML-строка canvas-иконки дерева для HTML-метки ноды графа (пусто, если нет ассета). */
export function treeIconHtml(id: string, size = 18): string {
  const ic = treeIcon(id)
  if (!ic) return ''
  if (ic.kind === 'forestry') {
    return `<canvas class="tic" width="${size}" height="${size}" data-kind="forestry" data-file="${escapeHtml(ic.file)}"></canvas>`
  }
  return `<canvas class="tic" width="${size}" height="${size}" data-kind="extratrees" data-tpl="${escapeHtml(ic.tpl)}" data-c="${escapeHtml(ic.c)}"></canvas>`
}

/** HTML иконки плода: готовый PNG, иначе общая SVG-иконка фрукта. */
export function fruitIconHtml(fruit: string): string {
  const url = fruitIconUrl(fruit)
  return url
    ? `<img class="fic" src="${escapeHtml(url)}" width="14" height="14" alt="">`
    : `<span class="icon">${ICONS.fruit}</span>`
}
