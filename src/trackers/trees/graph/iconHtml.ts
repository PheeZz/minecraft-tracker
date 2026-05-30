import { treeIcon } from '../domain/icons'

/** HTML-строка canvas-иконки дерева для HTML-метки ноды графа (пусто, если нет ассета). */
export function treeIconHtml(id: string, size = 18): string {
  const ic = treeIcon(id)
  if (!ic) return ''
  if (ic.kind === 'forestry') {
    return `<canvas class="tic" width="${size}" height="${size}" data-kind="forestry" data-file="${ic.file}"></canvas>`
  }
  return `<canvas class="tic" width="${size}" height="${size}" data-kind="extratrees" data-tpl="${ic.tpl}" data-c="${ic.c}"></canvas>`
}
