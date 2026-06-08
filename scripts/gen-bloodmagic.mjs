// Генерирует данные трекера Blood Magic из bloodmagic/data-src/*.json и
// bloodarsenal/data-src/*.json в src/trackers/bloodmagic/data/*.data.ts.
// Запуск: node scripts/gen-bloodmagic.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import prettier from 'prettier'
import { parseLang, applyLangNames } from './lib/lang.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bmSrc = (f) => JSON.parse(readFileSync(resolve(root, 'bloodmagic/data-src', f), 'utf8'))
const baSrc = (f) => JSON.parse(readFileSync(resolve(root, 'bloodarsenal/data-src', f), 'utf8'))
const outDir = resolve(root, 'src/trackers/bloodmagic/data')
mkdirSync(outDir, { recursive: true })

const PRETTIER = (await prettier.resolveConfig(resolve(outDir, 'orbs.data.ts'))) ?? {}

async function emit(file, header, body) {
  const code = `// Сгенерировано scripts/gen-bloodmagic.mjs — не редактировать вручную.\n${header}\n${body}\n`
  writeFileSync(
    resolve(outDir, file),
    await prettier.format(code, { ...PRETTIER, parser: 'typescript' }),
  )
}

// ---- lang-файлы BloodMagic ----
const langDir = resolve(root, 'bloodmagic/_assets/lang')
const EN = parseLang(resolve(langDir, 'en_US.lang'))
const RU = parseLang(resolve(langDir, 'ru_RU.lang'))

// Кюрированные оверрайды (fluid sigil, entity-маппинг, и прочие неавтоматизируемые случаи)
let NAMES_RU = {}
try {
  NAMES_RU = JSON.parse(readFileSync(resolve(root, 'bloodmagic/i18n/names-ru.json'), 'utf8'))
} catch {
  NAMES_RU = {}
}

// Константы и логика обогащения имён вынесены в scripts/lib/lang.mjs

// ---- резолв иконок ----
const normName = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const TEX = new Map()
for (const kind of ['items', 'blocks']) {
  const base = resolve(root, 'bloodmagic/textures', kind)
  for (const mod of readdirSync(base)) {
    const dir = resolve(base, mod)
    if (!statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.png')) continue
      const key = normName(f.slice(0, -4))
      if (!TEX.has(key)) TEX.set(key, `bloodmagic/${kind}/${mod}/${f}`)
    }
  }
}

// Нормализуем пути из item-icon-map.json: textures/{kind}/... → bloodmagic/{kind}/...
// (copy-assets.mjs кладёт bloodmagic/textures/items → public/bloodmagic/items, без сегмента textures/)
const normalizeManmapPath = (p) =>
  typeof p === 'string' ? p.replace(/^textures\//, 'bloodmagic/') : p

let MANMAP = {}
try {
  const raw = JSON.parse(
    readFileSync(resolve(root, 'bloodmagic/textures/item-icon-map.json'), 'utf8'),
  )
  for (const [name, p] of Object.entries(raw)) MANMAP[name] = normalizeManmapPath(p)
} catch {
  MANMAP = {}
}

let VANILLA_MAP = {}
try {
  const vm = JSON.parse(readFileSync(resolve(root, 'vanilla/item-icon-map.json'), 'utf8')).map ?? {}
  for (const [name, p] of Object.entries(vm)) VANILLA_MAP[name] = `bloodmagic/vanilla/${p}`
} catch (e) {
  console.warn(`bloodmagic: vanilla/item-icon-map.json не прочитан (${e.message})`)
}

const VTEX = new Map()
for (const kind of ['items', 'blocks']) {
  let entries = []
  try {
    entries = readdirSync(resolve(root, 'vanilla/textures', kind))
  } catch {
    continue
  }
  for (const f of entries) {
    if (!f.endsWith('.png')) continue
    const key = normName(f.slice(0, -4))
    if (!VTEX.has(key)) VTEX.set(key, `bloodmagic/vanilla/${kind}/${f}`)
  }
}

const unmatched = new Map()

function iconFor(o) {
  if (!o || typeof o !== 'object') return undefined
  if (o.name_en && MANMAP[o.name_en]) return MANMAP[o.name_en]
  if (o.vanilla) {
    if (o.name_en && VANILLA_MAP[o.name_en]) return VANILLA_MAP[o.name_en]
    if (o.name_en) {
      const h = VTEX.get(normName(o.name_en))
      if (h) return h
    }
  }
  if (o.name_en) {
    const h = TEX.get(normName(o.name_en))
    if (h) return h
  }
  if (o.name_en && !unmatched.has(o.name_en))
    unmatched.set(o.name_en, { ref: o.ref ?? null, name_ru: o.name_ru ?? null })
  return undefined
}

function toItemRef(o) {
  if (!o || typeof o !== 'object') return { name_en: String(o ?? '?'), name_ru: String(o ?? '?') }
  // Применяем имена из lang до резолва иконки
  applyLangNames(o, EN, RU, NAMES_RU)
  const icon = iconFor(o)
  return {
    ...(o.ref ? { ref: o.ref } : {}),
    ...(o.vanilla ? { vanilla: o.vanilla } : {}),
    name_en: o.name_en ?? '?',
    name_ru: o.name_ru ?? o.name_en ?? '?',
    ...(icon ? { icon } : {}),
  }
}

// ---- кровавые шары ----
const orbs = bmSrc('blood-orbs.json').orbs.map((o) => ({
  field: o.field,
  name_en: o.name_en,
  name_ru: o.name_ru,
  capacity_LP: o.capacity_LP,
  tier: o.tier,
  consumptionRate: o.consumptionRate,
}))

// ---- структура алтаря ----
function normalizeAltarBlock(c) {
  // 'placement' = маркер позиции без конкретного варианта; остальное — числовой мета
  const isPlacement = c.meta === 'placement'
  // Добавляем числовой meta в block для корректного резолва bloodRune-суффикса
  const block = { ...(c.block ?? {}), meta: isPlacement ? 0 : (c.meta ?? 0) }
  applyLangNames(block, EN, RU, NAMES_RU)
  return {
    x: c.x,
    y: c.y,
    z: c.z,
    ref: block.ref ?? '',
    meta: isPlacement ? 0 : (c.meta ?? 0),
    name_ru: block.name_ru ?? block.name_en ?? '',
    isBloodRune: c.isBloodRune ?? false,
    isUpgradeSlot: c.isUpgradeSlot ?? false,
    isPlacement,
  }
}

const altarTiers = bmSrc('altar-structure.json').tiers.map((t) => ({
  tier: t.tier,
  runeCount: t.runeCount ?? 0,
  upgradeSlots: t.upgradeSlots ?? 0,
  ...(t.note ? { note: t.note } : {}),
  components: (t.components ?? []).map(normalizeAltarBlock),
}))

// ---- ритуалы ----
// Разрешённые значения RuneKind (данные содержат также 'dawn' — фильтруем как 'blank')
const VALID_RUNE_KINDS = new Set(['water', 'fire', 'earth', 'air', 'dusk', 'blank'])

function safeRuneKind(r) {
  return VALID_RUNE_KINDS.has(r) ? r : 'blank'
}

let RITUALS_RU = {}
try {
  RITUALS_RU = JSON.parse(readFileSync(resolve(root, 'bloodmagic/i18n/rituals-ru.json'), 'utf8'))
} catch {
  RITUALS_RU = {}
}

const rituals = bmSrc('rituals.json').rituals.map((r) => {
  const i18n = RITUALS_RU[r.key] ?? {}
  return {
    key: r.key,
    name_en: r.name_en,
    name_ru: i18n.name_ru ?? r.name_en,
    purpose_ru: i18n.purpose_ru ?? '',
    effect: r.effect ?? '',
    // Сохраняем сырое значение из данных: 1=Weak, 2=Awakened, 10=Master/Transcendent
    crystalLevel: r.crystalLevel ?? 1,
    activation_LP: r.cost?.activation_LP ?? 0,
    upkeep_LP_per_tick: r.cost?.upkeep_LP_per_tick ?? 0,
    refreshTicks: 20,
    runeCount: r.runeCount ?? 0,
    runeBreakdown: Object.fromEntries(
      Object.entries(r.runeBreakdown ?? {}).filter(([k]) => VALID_RUNE_KINDS.has(k)),
    ),
    description_en: r.description_en ?? '',
    guidebookKey: r.guidebookKey ?? '',
    layout: (r.layout ?? []).map((l) => ({ x: l.x, y: l.y, z: l.z, rune: safeRuneKind(l.rune) })),
  }
})

// ---- сигилы ----
const sigils = bmSrc('sigils.json').sigils.map((s) => ({
  field: s.field,
  class: s.class,
  name_en: s.name_en,
  name_ru: s.name_ru,
  cost_LP_per_use: s.cost_LP_per_use ?? null,
  kind: s.kind,
}))

// ---- рецепты ----

// Рецепты, результат которых может быть получен только в творческом режиме
const CREATIVE_ONLY_OUTPUTS = new Set(['transcendentBloodOrb'])

// altar (altar-recipes.json): result/input/minTier/liquidRequired_LP + consumptionRate/drainRate
function fromAltarRecipe(r, addon) {
  const output = toItemRef(r.result)
  return {
    source: 'altar',
    ...(addon ? { addon } : {}),
    output,
    inputs: [toItemRef(r.input)],
    minTier: r.minTier,
    lp: r.liquidRequired_LP,
    ...(CREATIVE_ONLY_OUTPUTS.has(r.result?.ref) ? { creativeOnly: true } : {}),
    meta: {
      consumptionRate: r.consumptionRate,
      drainRate: r.drainRate,
      canBeFilled: r.canBeFilled ?? false,
    },
  }
}

// alchemy (alchemy-recipes.json): output/inputs[]/amountNeeded_LP/minOrbTier
function fromAlchemyRecipe(r) {
  return {
    source: 'alchemy',
    output: toItemRef(r.output),
    inputs: (r.inputs ?? []).map(toItemRef),
    lp: r.amountNeeded_LP,
    ...(r.minOrbTier != null ? { minTier: r.minOrbTier } : {}),
  }
}

// crafting: inputs из массива r.inputs (shapeless*) или из значений r.key (shaped*)
function craftingInputs(r) {
  if (Array.isArray(r.inputs)) return r.inputs.map(toItemRef)
  if (r.key && typeof r.key === 'object') return Object.values(r.key).map(toItemRef)
  return []
}

function fromCraftingRecipe(r, addon) {
  return {
    source: 'crafting',
    ...(addon ? { addon } : {}),
    output: toItemRef(r.result),
    inputs: craftingInputs(r),
    meta: { type: r.type, shape: r.shape ?? null },
  }
}

// binding (binding-recipes.json): output/input
function fromBindingRecipe(r, addon) {
  return {
    source: 'binding',
    ...(addon ? { addon } : {}),
    output: toItemRef(r.output),
    inputs: [toItemRef(r.input)],
    ...(r.seasonal ? { meta: { seasonal: r.seasonal } } : {}),
  }
}

// summoning: entityIdVar → человекочитаемое имя из NAMES_RU.
// tier2/tier3 (если непусты) кладём в meta, чтобы панель могла их показать отдельно.
function fromSummoningRecipe(r) {
  const tier2 = (r.ingredients_tier2 ?? []).map(toItemRef)
  const tier3 = (r.ingredients_tier3 ?? []).map(toItemRef)
  const tierMeta = {
    ...(tier2.length ? { tier2 } : {}),
    ...(tier3.length ? { tier3 } : {}),
  }
  // Резолвим имя существа через кюрированный маппинг entity:<idVar>
  const entityOverride = NAMES_RU[`entity:${r.entityIdVar}`]
  const entityNameEn = entityOverride?.name_en ?? r.entityIdVar
  const entityNameRu = entityOverride?.name_ru ?? r.entityIdVar
  return {
    source: 'summoning',
    output: { name_en: entityNameEn, name_ru: entityNameRu },
    inputs: (r.ingredients_main ?? []).map(toItemRef),
    minTier: r.altarTier,
    ...(Object.keys(tierMeta).length ? { meta: tierMeta } : {}),
  }
}

const recipes = [
  ...bmSrc('altar-recipes.json').recipes.map((r) => fromAltarRecipe(r, undefined)),
  ...bmSrc('alchemy-recipes.json').recipes.map(fromAlchemyRecipe),
  ...bmSrc('crafting-recipes.json').recipes.map((r) => fromCraftingRecipe(r, undefined)),
  ...bmSrc('binding-recipes.json').recipes.map((r) => fromBindingRecipe(r, undefined)),
  ...bmSrc('summoning.json').summoning.map(fromSummoningRecipe),
  ...baSrc('altar-recipes.json').recipes.map((r) => fromAltarRecipe(r, 'bloodarsenal')),
  ...baSrc('crafting-recipes.json').recipes.map((r) => fromCraftingRecipe(r, 'bloodarsenal')),
  ...baSrc('binding-recipes.json').recipes.map((r) => fromBindingRecipe(r, 'bloodarsenal')),
]

// ---- запись файлов ----
await emit(
  'orbs.data.ts',
  `import type { BloodOrb } from '../domain/types'`,
  `export const ORBS: readonly BloodOrb[] = ${JSON.stringify(orbs)}`,
)
await emit(
  'altar.data.ts',
  `import type { AltarTier } from '../domain/types'`,
  `export const ALTAR_TIERS: readonly AltarTier[] = ${JSON.stringify(altarTiers)}`,
)
await emit(
  'rituals.data.ts',
  `import type { Ritual } from '../domain/types'`,
  `export const RITUALS: readonly Ritual[] = ${JSON.stringify(rituals)}`,
)
await emit(
  'sigils.data.ts',
  `import type { Sigil } from '../domain/types'`,
  `export const SIGILS: readonly Sigil[] = ${JSON.stringify(sigils)}`,
)
await emit(
  'recipes.data.ts',
  `import type { Recipe } from '../domain/types'`,
  `export const RECIPES: readonly Recipe[] = ${JSON.stringify(recipes)}`,
)

// ---- артефакт несматченных иконок ----
const unmatchedList = [...unmatched.entries()]
  .map(([name_en, v]) => ({ name_en, name_ru: v.name_ru, ref: v.ref }))
  .sort((a, b) => a.name_en.localeCompare(b.name_en))
writeFileSync(
  resolve(root, 'bloodmagic/_unmatched-items.json'),
  JSON.stringify(unmatchedList, null, 2),
)

// ---- сводка ----
const bmAltarCount = bmSrc('altar-recipes.json').recipes.length
const bmAlchemyCount = bmSrc('alchemy-recipes.json').recipes.length
const bmCraftingCount = bmSrc('crafting-recipes.json').recipes.length
const bmBindingCount = bmSrc('binding-recipes.json').recipes.length
const bmSummoningCount = bmSrc('summoning.json').summoning.length
const baAltarCount = baSrc('altar-recipes.json').recipes.length
const baCraftingCount = baSrc('crafting-recipes.json').recipes.length
const baBindingCount = baSrc('binding-recipes.json').recipes.length

console.log(
  `bloodmagic data: ${orbs.length} шаров, ${altarTiers.length} тиров алтаря, ` +
    `${rituals.length} ритуалов, ${sigils.length} сигилов`,
)
console.log(
  `рецепты: altar(bm)=${bmAltarCount} alchemy=${bmAlchemyCount} crafting=${bmCraftingCount} ` +
    `binding=${bmBindingCount} summoning=${bmSummoningCount} | ` +
    `altar(ba)=${baAltarCount} crafting(ba)=${baCraftingCount} binding(ba)=${baBindingCount} ` +
    `→ итого ${recipes.length}`,
)
console.log(
  `иконки: ручная карта ${Object.keys(MANMAP).length}, несматчено ${unmatchedList.length} ` +
    `(см. bloodmagic/_unmatched-items.json)`,
)
