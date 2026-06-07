// Генерирует данные трекера Thaumcraft из thaumcraft/data-src/*.json в
// src/trackers/thaumcraft/data/*.data.ts. Запуск: node scripts/gen-thaumcraft.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import prettier from 'prettier'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = (f) => JSON.parse(readFileSync(resolve(root, 'thaumcraft/data-src', f), 'utf8'))
const outDir = resolve(root, 'src/trackers/thaumcraft/data')
mkdirSync(outDir, { recursive: true })

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const FALLBACK_COLOR = '#c9a3ff'

// Ручная локализация «кривых» имён (без RU в данных): EN/ключ → RU.
// Временная карта, пока имена не выверены из JAR. Файл thaumcraft/i18n/name-overrides.json.
let OVERRIDES = {}
try {
  OVERRIDES = JSON.parse(readFileSync(resolve(root, 'thaumcraft/i18n/name-overrides.json'), 'utf8'))
} catch {
  OVERRIDES = {}
}
const localized = (en) => (en && OVERRIDES[en]) || null
const needsLoc = new Map() // EN/ключ → тип ('research'|'item') для адресного перевода
const garbage = new Set() // декомпил-выражения без перевода (стали «?») — для разбора

async function emit(file, header, body) {
  const code = `// АВТОГЕНЕРАЦИЯ (scripts/gen-thaumcraft.mjs). Не редактировать вручную.\n${header}\n${body}\n`
  writeFileSync(
    resolve(outDir, file),
    await prettier.format(code, { parser: 'typescript', semi: false, singleQuote: true }),
  )
}

// ---- аспекты ----
const aspects = src('aspects.json').aspects.map((a) => {
  const components = Array.isArray(a.components) ? a.components : []
  return {
    tag: a.tag,
    mod: a.mod,
    label: cap(a.tag),
    nameRu: a.name_ru ?? a.name_en ?? cap(a.tag),
    nameEn: a.name_en ?? cap(a.tag),
    color: a.color ?? FALLBACK_COLOR,
    rainbow: !!a.rainbow,
    // нет компонентов ⇒ праймал (правит несостыковку: tincturem помечен non-primal без состава)
    primal: !!a.primal || components.length === 0,
    components,
  }
})

// ---- исследования ----
const researchRaw = (() => {
  const r = src('research.json')
  return Array.isArray(r) ? r : r.research || Object.values(r).find(Array.isArray)
})()
const research = researchRaw.map((x) => {
  const en = x.name_en || x.key
  let name
  if (x.name_ru) name = x.name_ru
  else {
    name = localized(en) || en
    if (!localized(en)) needsLoc.set(en, 'research')
  }
  return {
    key: x.key,
    mod: x.mod,
    category: x.category,
    name,
    nameRu: x.name_ru ?? null,
    nameEn: x.name_en ?? null,
    aspects: x.aspects ?? {},
    parents: Array.isArray(x.parents) ? x.parents : [],
    displayColumn: x.displayColumn ?? 0,
    displayRow: x.displayRow ?? 0,
    complexity: x.complexity ?? 1,
    flags: Array.isArray(x.flags) ? x.flags : [],
    description: x.description ?? null,
  }
})

// Индекс текстур предметов/блоков: нормализованное имя файла → 'kind/mod/file.png'.
// Карты id→текстура в моде нет, поэтому матчим эвристикой по имени файла.
const normName = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
const TEX = new Map()
for (const kind of ['items', 'blocks']) {
  const base = resolve(root, 'thaumcraft/textures', kind)
  for (const mod of readdirSync(base)) {
    const dir = resolve(base, mod)
    if (!statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.png')) continue
      const key = normName(f.slice(0, -4))
      if (!TEX.has(key)) TEX.set(key, `${kind}/${mod}/${f}`)
    }
  }
}
// Ручная карта `name_en → 'kind/mod/file.png'` (приоритет, точное сопоставление).
let MANMAP = {}
try {
  MANMAP = JSON.parse(readFileSync(resolve(root, 'thaumcraft/textures/item-icon-map.json'), 'utf8'))
} catch {
  MANMAP = {}
}
const unmatched = new Map() // name_en → {ref, name_ru} (для адресной ручной разметки)

// Путь текстуры: ручная карта → ТОЧНЫЙ матч имени файла по EN. ref-эвристику НЕ
// используем — она конфликтит мета-варианты с общим ref (шарды/сердца големов и т.п.
// → одна текстура на всех). Несматченное → текст (точность важнее охвата).
function iconFor(o) {
  if (!o || typeof o !== 'object') return undefined
  if (o.name_en && MANMAP[o.name_en]) return MANMAP[o.name_en]
  if (o.name_en) {
    const h = TEX.get(normName(o.name_en))
    if (h) return h
  }
  if (o.name_en && !unmatched.has(o.name_en))
    unmatched.set(o.name_en, { ref: o.ref ?? o.oredict ?? null, name_ru: o.name_ru ?? null })
  return undefined
}

// «Мусор» — неразрешённые выражения из декомпиляции (вызовы методов, NBT,
// конструкторы, ссылки на поля). Это не имена предметов — показываем заглушку.
const GARBAGE =
  /[{}[\]]|new |NBTTag|func_|::|\(\)|\.makeStack|OreDictionary|ItemStack\)|Config\.|getStackForType|\.instance\(|\.getField/

// Имя предмета/ингредиента из разных форм ссылки → {ru, en, icon?}.
// RU: настоящее name_ru → ручная локализация → EN/raw как фолбэк (и в needsLoc).
// Декомпил-мусор → «?» (исходное выражение остаётся в en для тултипа).
function nameOf(o) {
  if (!o || typeof o !== 'object') return { ru: String(o ?? '?'), en: String(o ?? '?') }
  const en = o.name_en || o.oredict || o.reg || o.raw || o.ref || o.vanilla || '?'
  // ручной перевод (в т.ч. инферированный из кода) имеет приоритет над мусор-фильтром
  if (o.name_ru) return attachIcon({ ru: o.name_ru, en }, o)
  if (localized(en)) return attachIcon({ ru: localized(en), en }, o)
  if (GARBAGE.test(en)) {
    garbage.add(en)
    return { ru: '?', en } // неразрешённый код без перевода → заглушка
  }
  if (en !== '?') needsLoc.set(en, 'item')
  return attachIcon({ ru: en, en }, o)
}
function attachIcon(base, o) {
  const icon = iconFor(o)
  return icon ? { ...base, icon } : base
}
const refs = (arr) => (Array.isArray(arr) ? arr.map(nameOf) : undefined)

// ---- рецепты ----
const recipesRaw = (() => {
  const r = src('recipes.json')
  return Array.isArray(r) ? r : r.recipes || Object.values(r).find(Array.isArray)
})()
const recipes = recipesRaw.map((x) => {
  const out = {
    research: x.research ?? null,
    type: x.type,
    mod: x.mod,
    output: nameOf(x.output),
    // стоимость известна только если карта непуста, не «вычисляемая» и все значения числовые
    aspects:
      x.aspects &&
      !x.aspectsComputed &&
      Object.keys(x.aspects).length &&
      Object.values(x.aspects).every((v) => typeof v === 'number')
        ? x.aspects
        : null,
  }
  if (Array.isArray(x.shape)) out.shape = x.shape
  if (x.key && typeof x.key === 'object') {
    out.key = Object.fromEntries(Object.entries(x.key).map(([k, v]) => [k, nameOf(v)]))
  }
  if (Array.isArray(x.inputs)) out.inputs = refs(x.inputs)
  if (x.input) out.input = nameOf(x.input)
  if (x.central) out.central = nameOf(x.central)
  if (Array.isArray(x.components)) out.components = refs(x.components)
  if (typeof x.instability === 'number') out.instability = x.instability
  return out
})

// ---- источники аспектов (сканирование) ----
const srcRaw = src('aspect-sources.json')
const sources = [
  ...(srcRaw.objectTags ?? []).map((o) => {
    const n = nameOf(o.subject)
    return {
      name: n.ru,
      mod: o.mod,
      kind: 'object',
      aspects: o.aspects ?? {},
      ...(n.icon ? { icon: n.icon } : {}),
    }
  }),
  ...(srcRaw.entityTags ?? []).map((e) => ({
    name: e.entity,
    mod: e.mod,
    kind: 'entity',
    aspects: e.aspects ?? {},
  })),
].filter((s) => s.name && Object.keys(s.aspects).length)

// ---- справочники ----
const smelting = (src('smelting-bonus.json').smeltingBonus ?? []).map((s) => ({
  input: nameOf(s.input).ru,
  output: nameOf(s.output),
  mod: s.mod,
}))
const loot = (src('loot-bags.json').lootBags ?? []).map((l) => ({
  item: nameOf(l.item),
  weight: l.weight ?? 0,
  rarities: Array.isArray(l.rarities) ? l.rarities : [],
  mod: l.mod,
}))
const mat = src('materials.json')
const toolMats = (mat.toolMaterials ?? []).map((m) => ({
  name: m.name,
  mod: m.mod,
  harvestLevel: m.harvestLevel ?? 0,
  durability: m.durability ?? 0,
  efficiency: m.efficiency ?? 0,
  damage: m.damage ?? 0,
  enchantability: m.enchantability ?? 0,
}))
const armorMats = (mat.armorMaterials ?? []).map((m) => ({
  name: m.name,
  mod: m.mod,
  durabilityFactor: m.durabilityFactor ?? 0,
  damageReduction: Array.isArray(m.damageReduction) ? m.damageReduction : [],
  enchantability: m.enchantability ?? 0,
}))
const wandCaps = (mat.wandCaps ?? []).map((m) => ({
  tag: m.tag,
  visDiscount: m.visDiscount ?? 0,
  craftCost: m.craftCost ?? 0,
}))
const wandRods = (mat.wandRods ?? []).map((m) => ({
  tag: m.tag,
  visCapacity: m.visCapacity ?? 0,
  craftCost: m.craftCost ?? 0,
}))

await emit(
  'aspects.data.ts',
  `import type { Aspect } from '../domain/types'`,
  `export const ASPECTS: readonly Aspect[] = ${JSON.stringify(aspects)}`,
)
await emit(
  'research.data.ts',
  `import type { Research } from '../domain/types'`,
  `export const RESEARCH: readonly Research[] = ${JSON.stringify(research)}`,
)
await emit(
  'recipes.data.ts',
  `import type { Recipe } from '../domain/types'`,
  `export const RECIPES: readonly Recipe[] = ${JSON.stringify(recipes)}`,
)
await emit(
  'sources.data.ts',
  `import type { AspectSource } from '../domain/types'`,
  `export const ASPECT_SOURCES: readonly AspectSource[] = ${JSON.stringify(sources)}`,
)
await emit(
  'reference.data.ts',
  `import type { SmeltingBonus, LootBag, ToolMaterial, ArmorMaterial, WandCap, WandRod } from '../domain/types'`,
  `export const SMELTING: readonly SmeltingBonus[] = ${JSON.stringify(smelting)}
export const LOOT: readonly LootBag[] = ${JSON.stringify(loot)}
export const TOOL_MATERIALS: readonly ToolMaterial[] = ${JSON.stringify(toolMats)}
export const ARMOR_MATERIALS: readonly ArmorMaterial[] = ${JSON.stringify(armorMats)}
export const WAND_CAPS: readonly WandCap[] = ${JSON.stringify(wandCaps)}
export const WAND_RODS: readonly WandRod[] = ${JSON.stringify(wandRods)}`,
)

// Список несматченных предметов — артефакт для ручной разметки item-icon-map.json.
const unmatchedList = [...unmatched.entries()]
  .map(([en, v]) => ({ name_en: en, name_ru: v.name_ru, ref: v.ref }))
  .sort((a, b) => a.name_en.localeCompare(b.name_en))
writeFileSync(
  resolve(root, 'thaumcraft/textures/_unmatched-items.json'),
  JSON.stringify(unmatchedList, null, 2),
)

// Список имён без RU (нужна ручная локализация) — артефакт для name-overrides.json.
mkdirSync(resolve(root, 'thaumcraft/i18n'), { recursive: true })
const needsList = [...needsLoc.entries()]
  .map(([en, type]) => ({ en, type }))
  .sort((a, b) => a.en.localeCompare(b.en))
writeFileSync(
  resolve(root, 'thaumcraft/i18n/_needs-localization.json'),
  JSON.stringify(needsList, null, 2),
)
// Список декомпил-выражений, ставших «?» — для разбора (инферируемые перевести в overrides).
writeFileSync(
  resolve(root, 'thaumcraft/i18n/_garbage-names.json'),
  JSON.stringify([...garbage].sort(), null, 2),
)

const withIcon = (arr, get) => arr.filter((x) => get(x)?.icon).length
const iconCount =
  withIcon(recipes, (r) => r.output) +
  sources.filter((s) => s.icon).length +
  loot.filter((l) => l.item.icon).length
console.log(
  `thaumcraft data: ${aspects.length} аспектов, ${research.length} исследований, ` +
    `${recipes.length} рецептов, ${sources.length} источников, ${smelting.length} плавок, ${loot.length} лута`,
)
console.log(
  `иконки предметов: ручная карта ${Object.keys(MANMAP).length}, c иконкой ${iconCount}, ` +
    `несматчено ${unmatchedList.length} (см. textures/_unmatched-items.json)`,
)
console.log(
  `локализация: переопределений ${Object.keys(OVERRIDES).length}, без RU ${needsList.length} (см. i18n/_needs-localization.json)`,
)
