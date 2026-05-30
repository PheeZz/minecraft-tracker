// Визуальная проверка приложения: поднимать preview (npm run preview) и затем
//   node scripts/screenshot.mjs
// Снимает /trees и /bees в screenshots/ и печатает ошибки консоли (none = ок).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.env.BASE || 'http://localhost:4173'
mkdirSync('screenshots', { recursive: true })

const errors = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console.error: ' + m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

async function shot(path, file) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `screenshots/${file}` })
  console.log(`shot ${path} -> screenshots/${file}`)
}

await shot('/trees', 'trees.png')
console.log('nodes rendered:', await page.locator('.node').count())
await shot('/bees', 'bees.png')

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
await browser.close()
process.exit(errors.length ? 1 : 0)
