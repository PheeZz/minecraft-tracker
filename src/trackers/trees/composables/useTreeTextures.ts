import { ref } from 'vue'
import { TREE_ICON } from '../data/treeIcons.data'

/**
 * Текстуры иконок деревьев. Forestry — готовый PNG (рисуется как есть);
 * ExtraTrees — ствол <tpl>.trunk.png + тонированная цветом вида крона <tpl>.leaves.png.
 * Модульный синглтон, грузим один раз.
 */
const BASE = `${import.meta.env.BASE_URL}trees`

type Img = HTMLImageElement | null
const forestryImg = new Map<string, Img>() // file → img
const trunkImg = new Map<string, Img>() // tpl → img
const leavesImg = new Map<string, Img>() // tpl → img

export const treeTexturesReady = ref(false)
let loadStarted = false

function loadImage(src: string): Promise<Img> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Запускает загрузку всех нужных текстур (идемпотентно). */
export async function ensureTreeTextures(): Promise<void> {
  if (loadStarted) return
  loadStarted = true
  const files = new Set<string>()
  const tpls = new Set<string>()
  for (const icon of Object.values(TREE_ICON)) {
    if (icon.kind === 'forestry') files.add(icon.file)
    else tpls.add(icon.tpl)
  }
  await Promise.all([
    ...[...files].map(async (f) => forestryImg.set(f, await loadImage(`${BASE}/${f}`))),
    ...[...tpls].map(async (t) =>
      trunkImg.set(t, await loadImage(`${BASE}/tree-templates/${t}.trunk.png`)),
    ),
    ...[...tpls].map(async (t) =>
      leavesImg.set(t, await loadImage(`${BASE}/tree-templates/${t}.leaves.png`)),
    ),
  ])
  treeTexturesReady.value = true
}

// Шаблоны ствола экспортированы серыми и в исходном демо рисовались как есть
// (светлый ствол). В игре ствол тёмно-коричневый — тонируем фиксированным bark-цветом
// (multiply поверх серого даёт ≈#4b2c19, как у готовых саженцев Forestry).
const TRUNK_COLOR = '#6b4327'

const tintCache = new Map<string, HTMLCanvasElement>()
function tint(label: string, img: HTMLImageElement, hex: string): HTMLCanvasElement {
  const key = `${label}|${hex}`
  const cached = tintCache.get(key)
  if (cached) return cached
  const cv = document.createElement('canvas')
  cv.width = img.width
  cv.height = img.height
  const x = cv.getContext('2d')!
  x.imageSmoothingEnabled = false
  x.drawImage(img, 0, 0)
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = hex
  x.fillRect(0, 0, cv.width, cv.height)
  x.globalCompositeOperation = 'destination-in'
  x.drawImage(img, 0, 0)
  tintCache.set(key, cv)
  return cv
}

/** Перерисовать одну canvas-иконку дерева по data-атрибутам (kind/file | tpl/c). */
export function paintTreeCanvas(cv: HTMLCanvasElement): void {
  const ctx = cv.getContext('2d')
  if (!ctx) return
  const W = cv.width
  const H = cv.height
  ctx.clearRect(0, 0, W, H)
  ctx.imageSmoothingEnabled = false
  if (cv.dataset.kind === 'forestry') {
    const img = forestryImg.get(cv.dataset.file ?? '')
    if (img) ctx.drawImage(img, 0, 0, W, H)
  } else {
    const tpl = cv.dataset.tpl ?? ''
    const trunk = trunkImg.get(tpl)
    const leaves = leavesImg.get(tpl)
    if (trunk) ctx.drawImage(tint(`trunk:${tpl}`, trunk, TRUNK_COLOR), 0, 0, W, H)
    if (leaves) ctx.drawImage(tint(`leaves:${tpl}`, leaves, cv.dataset.c ?? '#6d8f1e'), 0, 0, W, H)
  }
}

/** Перерисовать все .tic-иконки внутри root (для HTML-меток графа). */
export function paintTreeIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLCanvasElement>('canvas.tic').forEach(paintTreeCanvas)
}

/**
 * Перерисовать иконки только указанных нод (по data-id карточки .node).
 * Нужно, чтобы изменение одной ноды не перерисовывало иконки всех остальных —
 * node-html-label пересоздаёт DOM (и обнуляет canvas) лишь у изменившихся нод.
 */
export function paintTreeIconsFor(root: ParentNode, ids: ReadonlySet<string>): void {
  if (!ids.size) return
  root.querySelectorAll<HTMLCanvasElement>('canvas.tic').forEach((cv) => {
    const id = cv.closest<HTMLElement>('.node')?.dataset.id
    if (id && ids.has(id)) paintTreeCanvas(cv)
  })
}
