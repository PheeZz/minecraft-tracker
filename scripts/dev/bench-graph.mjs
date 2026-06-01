// Бенч плавности графа: меряет wheel-zoom-всплеск на графе деревьев (самый тяжёлый, ~131 нода).
// Требует поднятый preview (BASE_PATH=/ npm run build && npm run preview).
//   node scripts/bench-graph.mjs > after.json
// Метрики: кадры (avg/p95/длинные >20мс/FPS) во время непрерывного зума + число вызовов
// drawImage за окно жеста — прямой индикатор лишних перерисовок иконок на кадр.
import { chromium } from 'playwright'

const base = process.env.BASE || 'http://localhost:4173'
const throttle = Number(process.env.THROTTLE || 1)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

if (throttle > 1) {
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: throttle })
}

await page.goto(`${base}/trees`, { waitUntil: 'networkidle' })
await page.waitForSelector('.node')
await page.waitForTimeout(1500) // иконки догрузились/покрасились
const nodes = await page.locator('.node').count()

// патчим drawImage (счётчик) и ставим рекордер кадров
await page.evaluate(() => {
  const proto = CanvasRenderingContext2D.prototype
  const orig = proto.drawImage
  // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
  window.__draw = 0
  proto.drawImage = function (...a) {
    // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
    window.__draw++
    return orig.apply(this, a)
  }
})

async function burst() {
  await page.evaluate(() => {
    // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
    window.__frames = []
    // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
    window.__rec = true
    // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
    window.__draw = 0
    let last = performance.now()
    function loop(t) {
      // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
      if (!window.__rec) return
      // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
      window.__frames.push(t - last)
      last = t
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  })

  // непрерывный wheel-зум туда-сюда над центром графа (держит зум в диапазоне)
  const cx = 720
  const cy = 460
  await page.mouse.move(cx, cy)
  for (let i = 0; i < 90; i++) {
    await page.mouse.wheel(0, i % 2 === 0 ? -80 : 80)
    await page.waitForTimeout(16)
  }

  return await page.evaluate(() => {
    // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
    window.__rec = false
    // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
    const f = window.__frames.filter((d) => d > 0).sort((a, b) => a - b)
    const sum = f.reduce((s, d) => s + d, 0)
    const q = (x) => f[Math.min(f.length - 1, Math.floor(x * f.length))]
    return {
      // @ts-expect-error бенч-скрипт: окружение браузера/cytoscape без типов
      draws: window.__draw,
      frames: f.length,
      avgMs: +(sum / f.length).toFixed(2),
      p95Ms: +q(0.95).toFixed(2),
      maxMs: +f[f.length - 1].toFixed(2),
      longFrames: f.filter((d) => d > 20).length,
      fps: +(1000 / (sum / f.length)).toFixed(1),
    }
  })
}

// прогрев + замер (берём второй прогон, чтобы исключить первичные затраты)
await burst()
const r = await burst()
r.nodes = nodes
console.log(JSON.stringify(r, null, 2))
await browser.close()
