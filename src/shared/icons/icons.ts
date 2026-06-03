/**
 * Реестр иконок. SVG лежат отдельными файлами в src/assets/icons/ и подгружаются
 * как строки через `?raw` — никакого inline-SVG в коде. Значения пригодны для
 * вставки в innerHTML (в т.ч. в HTML-метки нод Cytoscape); во Vue используйте
 * IconBase.vue, который рендерит эти строки. Чтобы добавить иконку — положите
 * `<name>.svg` в src/assets/icons/ и допишите импорт + поле ниже.
 */
import leaf from '@/assets/icons/leaf.svg?raw'
import fruit from '@/assets/icons/fruit.svg?raw'
import sprout from '@/assets/icons/sprout.svg?raw'
import pollen from '@/assets/icons/pollen.svg?raw'
import bolt from '@/assets/icons/bolt.svg?raw'
import list from '@/assets/icons/list.svg?raw'
import check from '@/assets/icons/check.svg?raw'
import checkPlain from '@/assets/icons/checkPlain.svg?raw'
import ban from '@/assets/icons/ban.svg?raw'
import plus from '@/assets/icons/plus.svg?raw'
import minus from '@/assets/icons/minus.svg?raw'
import close from '@/assets/icons/close.svg?raw'
import search from '@/assets/icons/search.svg?raw'
import target from '@/assets/icons/target.svg?raw'
import fit from '@/assets/icons/fit.svg?raw'
import branch from '@/assets/icons/branch.svg?raw'
import box from '@/assets/icons/box.svg?raw'
import download from '@/assets/icons/download.svg?raw'
import upload from '@/assets/icons/upload.svg?raw'
import reset from '@/assets/icons/reset.svg?raw'
import warn from '@/assets/icons/warn.svg?raw'
import undo from '@/assets/icons/undo.svg?raw'
import redo from '@/assets/icons/redo.svg?raw'
import trash from '@/assets/icons/trash.svg?raw'
import pencil from '@/assets/icons/pencil.svg?raw'
import bee from '@/assets/icons/bee.svg?raw'
import grid from '@/assets/icons/grid.svg?raw'
import heart from '@/assets/icons/heart.svg?raw'

export const ICONS = {
  leaf,
  fruit,
  sprout,
  pollen,
  bolt,
  list,
  check,
  checkPlain,
  ban,
  plus,
  minus,
  close,
  search,
  target,
  fit,
  branch,
  box,
  download,
  upload,
  reset,
  warn,
  undo,
  redo,
  trash,
  pencil,
  bee,
  grid,
  heart,
} as const

export type IconName = keyof typeof ICONS
