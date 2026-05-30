import { TREE_ICON } from '../data/treeIcons.data'
import type { TreeIcon } from './types'

/** Иконка дерева по id (nominative), если есть ассет (ванильные — без иконки). */
export function treeIcon(id: string): TreeIcon | undefined {
  return TREE_ICON[id]
}
