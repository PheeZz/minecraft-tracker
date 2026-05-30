import { ref } from 'vue'

/**
 * Загрузка и тинтинг 16×16 пиксельных текстур Minecraft (соты/тела пчёл).
 * Текстуры красятся в цвет вида/соты через canvas (multiply + destination-in).
 * Модульный синглтон: грузим один раз на всё приложение.
 */
const BASE = `${import.meta.env.BASE_URL}bees`

type Img = HTMLImageElement | null
type BodySet = [Img, Img, Img] // [body1, drone.body2, drone.outline]

let combPrimary: Img = null
let combSecondary: Img = null
const bodies: Record<string, BodySet> = {}

/** Готовность текстур (реактивно — компоненты перерисуются и покрасятся). */
export const texturesReady = ref(false)
let loadStarted = false

function loadImage(src: string): Promise<Img> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function loadBodySet(dir: string): Promise<BodySet> {
  return Promise.all([
    loadImage(`${dir}/body1.png`),
    loadImage(`${dir}/drone.body2.png`),
    loadImage(`${dir}/drone.outline.png`),
  ]) as Promise<BodySet>
}

/** Запускает загрузку текстур (идемпотентно). */
export async function ensureTextures(): Promise<void> {
  if (loadStarted) return
  loadStarted = true
  combPrimary = await loadImage(`${BASE}/beeCombs.0.png`)
  combSecondary = await loadImage(`${BASE}/beeCombs.1.png`)
  bodies[''] = await loadBodySet(`${BASE}/beebody`)
  bodies['skulking'] = await loadBodySet(`${BASE}/beebody-skulking`)
  bodies['doctoral'] = await loadBodySet(`${BASE}/beebody-doctoral`)
  texturesReady.value = true
}

// Кэш тинтованных слоёв: вход ограничен (≈немного текстур × палитра), память мала.
const tintCache = new Map<string, HTMLCanvasElement>()

/**
 * Тинт текстуры в hex-цвет (16×16), с мемоизацией по (label,hex).
 * Контекст canvas всегда есть (createElement в браузере); в jsdom этот путь
 * не вызывается, т.к. paintCanvas проверяет getContext до тинта.
 */
function tint(label: string, img: HTMLImageElement, hex: string): HTMLCanvasElement {
  const key = `${label}|${hex}`
  const cached = tintCache.get(key)
  if (cached) return cached
  const cv = document.createElement('canvas')
  cv.width = 16
  cv.height = 16
  const x = cv.getContext('2d')!
  x.imageSmoothingEnabled = false
  x.drawImage(img, 0, 0, 16, 16, 0, 0, 16, 16)
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = hex
  x.fillRect(0, 0, 16, 16)
  x.globalCompositeOperation = 'destination-in'
  x.drawImage(img, 0, 0, 16, 16, 0, 0, 16, 16)
  tintCache.set(key, cv)
  return cv
}

/** Перерисовать одну canvas-иконку (.cic — сота, .bic — пчела) по её data-атрибутам. */
export function paintCanvas(cv: HTMLCanvasElement): void {
  const ctx = cv.getContext('2d')
  if (!ctx) return
  if (cv.classList.contains('cic')) {
    if (!combPrimary) return
    ctx.clearRect(0, 0, 16, 16)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tint('comb0', combPrimary, cv.dataset.p ?? '#fff'), 0, 0)
    if (combSecondary && cv.dataset.s)
      ctx.drawImage(tint('comb1', combSecondary, cv.dataset.s), 0, 0)
  } else if (cv.classList.contains('bic')) {
    const variant = cv.dataset.body || ''
    const set = bodies[variant] ?? bodies['']
    if (!set?.[0]) return
    ctx.clearRect(0, 0, 16, 16)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tint(`body0:${variant}`, set[0], cv.dataset.p ?? '#fff'), 0, 0)
    if (set[1] && cv.dataset.s) ctx.drawImage(tint(`body1:${variant}`, set[1], cv.dataset.s), 0, 0)
    if (set[2]) ctx.drawImage(set[2], 0, 0, 16, 16, 0, 0, 16, 16)
  }
}

/** Перерисовать все canvas-иконки внутри root (для HTML-меток графа, Этап 8). */
export function paintIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLCanvasElement>('canvas.cic, canvas.bic').forEach(paintCanvas)
}
