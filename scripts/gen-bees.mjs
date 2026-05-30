// Генерирует типизированные TS-модули данных пчёл из мокап-источников
// (bees/mockups/*.js). Запуск: node scripts/gen-bees.mjs
// Источник правды для трекера пчёл — chain-макет (bees-5-chain.html).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { format } from 'prettier'

async function writeTs(path, source) {
  writeFileSync(
    path,
    await format(source, {
      parser: 'typescript',
      semi: false,
      singleQuote: true,
      printWidth: 100,
      trailingComma: 'all',
    }),
  )
}

const MOCK = 'bees/mockups'
const OUT = 'src/trackers/bees/data'
mkdirSync(OUT, { recursive: true })

function load(file, globalName) {
  const code = readFileSync(`${MOCK}/${file}`, 'utf8')
  const ctx = { window: {} }

  new Function('window', code)(ctx.window)
  return ctx.window[globalName]
}

const BEES_RAW = load('bees-data.js', 'BEES')
const COMB = load('combs-colors.js', 'COMBCOLORS')
const MBCOMB = load('mb-comb-colors.js', 'MBCOMBCOLORS')
const BEECOL = load('bees-colors.js', 'BEECOLORS')

// --- bees.data.ts ---
const bees = BEES_RAW.map((b) => ({
  id: b.id,
  en: b.en,
  source: b.src,
  parents: b.par.map(([p1, p2, chance]) => ({ p1, p2, chance })),
  products: b.prod.map(([name, pct, type]) => ({
    name,
    pct,
    kind: type === 1 ? 'specialty' : 'product',
  })),
}))

const beesTs = `// АВТОГЕНЕРАЦИЯ (scripts/gen-bees.mjs) из bees/mockups/bees-data.js. Не редактировать вручную.
import type { Bee } from '../domain/types'

export const BEES: Bee[] = ${JSON.stringify(bees, null, 2)}

export const BEE_BY_ID: Readonly<Record<string, Bee>> = Object.fromEntries(
  BEES.map((b) => [b.id, b]),
)
`
await writeTs(`${OUT}/bees.data.ts`, beesTs)

// --- combColors.ts: COMBCOLORS (массив, ключи ru+en) + MBCOMBCOLORS (объект, ключ=en) ---
const combMap = {}
for (const c of Array.isArray(COMB) ? COMB : []) {
  const entry = { p: c.p, s: c.s, ...(c.src ? { src: c.src } : {}) }
  if (c.ru) combMap[c.ru] = entry
  if (c.en) combMap[c.en] = entry
}
for (const [en, c] of Object.entries(MBCOMB ?? {})) {
  combMap[en] ??= { p: c.p, s: c.s, ...(c.src ? { src: c.src } : {}) }
}

// предупреждение: соты-продукты без цвета (видны в UI как пустая иконка)
const combNames = [...new Set(bees.flatMap((b) => b.products.map((p) => p.name)))].filter((n) =>
  /сот/i.test(n),
)
const missing = combNames.filter((n) => !combMap[n])
if (missing.length) console.warn('⚠ соты без цвета:', missing.join(', '))
const combTs = `// АВТОГЕНЕРАЦИЯ (scripts/gen-bees.mjs) из combs-colors.js + mb-comb-colors.js.
import type { TintColor } from '../domain/types'

export const COMB_COLOR: Readonly<Record<string, TintColor>> = ${JSON.stringify(combMap, null, 2)}
`
await writeTs(`${OUT}/combColors.ts`, combTs)

// --- beeColors.ts (ключи по ru и en) ---
const beeMap = {}
for (const v of Object.values(BEECOL)) {
  const entry = {
    p: v.p,
    s: v.s,
    ...(v.src ? { src: v.src } : {}),
    ...(v.body ? { body: v.body } : {}),
  }
  if (v.ru) beeMap[v.ru] = entry
  if (v.en) beeMap[v.en] = entry
}
const beeTs = `// АВТОГЕНЕРАЦИЯ (scripts/gen-bees.mjs) из bees-colors.js.
import type { TintColor } from '../domain/types'

export const BEE_COLOR: Readonly<Record<string, TintColor>> = ${JSON.stringify(beeMap, null, 2)}
`
await writeTs(`${OUT}/beeColors.ts`, beeTs)

console.log(
  `bees.data.ts: ${bees.length} пчёл | combColors: ${Object.keys(combMap).length} | beeColors: ${Object.keys(beeMap).length}`,
)
