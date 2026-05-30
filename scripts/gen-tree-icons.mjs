// Генерирует src/trackers/trees/data/treeIcons.data.ts из trees/tree-icons-export/*.js.
// Ключи приводятся к nominative-id (как в trees.data.ts) через ALIAS genitive→nominative.
// Запуск: node scripts/gen-tree-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'trees/tree-icons-export'
const OUT = 'src/trackers/trees/data'

// genitive/иное → nominative (синхронно с scripts/verify-trees-data.py).
const ALIAS = {
  'липы пушистой': 'Липа пушистая',
  'обычного орехового дерева': 'Обычное ореховое дерево',
  'каштана посевного': 'Каштан посевной',
  сакуры: 'Сакура',
  'лимонного дерева': 'Лимонное дерево',
  'сливового дерева': 'Сливовое дерево',
  'сахарного клёна': 'Сахарный клён',
  'мировой лиственницы': 'Мировая лиственница',
  'жёлтой сосны': 'Жёлтая сосна',
  'береговой секвойи': 'Береговая секвойя',
  'тикового дерева': 'Тиковое дерево',
  'муравьиного дерева': 'Муравьиное дерево',
  'хлопкового дерева': 'Хлопковое дерево',
  мирта: 'Мирт',
  зебрано: 'Зебрано',
  'белого тополя': 'Тополь',
  'жёлтого меранти': 'Жёлтый меранти',
  'пустынной акации': 'Пустынная акация',
  падука: 'Падук',
  бальзы: 'Бальза',
  кокоболо: 'Кокоболо',
  'дерева Венге': 'Венге',
  'Адансонии Грандидье': 'Адансония Грандидье',
  'синего гибискуса': 'Синий гибискус',
  'белой ивы': 'Белая ива',
  Сипири: 'Сипири',
  'дынного дерева': 'Дынное дерево',
  'финиковой пальмы': 'Финиковая пальма',
  'Вяз обыкновенный': 'Вяз',
  'Ясень обыкновенный': 'Ясень',
  'Боярышник однопестичный': 'Боярышник',
  'Гинкго двулопастный': 'Гинкго',
  'Ликвидамбар смолоносный': 'Ликвидамбар',
  'Робиния ложноакациевая': 'Робиния',
  'Умнини (розовая кость)': 'Умнини',
  'Лумбанг (свечное дерево)': 'Лумбанг',
}
const norm = (k) => ALIAS[k] ?? k
const isCyrillic = (s) => /[а-яё]/i.test(s)

function load(file, g) {
  const ctx = { window: {} }

  new Function('window', readFileSync(`${SRC}/${file}`, 'utf8'))(ctx.window)
  return ctx.window[g]
}
const TREEICONS = load('tree-icons.js', 'TREEICONS')
const TREECOLORS = load('tree-colors.js', 'TREECOLORS')

const map = {}
// ExtraTrees (тонирование) — сначала, чтобы Forestry-PNG имел приоритет и перезаписал при коллизии
for (const [k, v] of Object.entries(TREECOLORS)) {
  if (isCyrillic(k)) map[norm(k)] = { kind: 'extratrees', tpl: v.tpl, c: v.c }
}
for (const [k, file] of Object.entries(TREEICONS)) {
  if (isCyrillic(k)) map[norm(k)] = { kind: 'forestry', file }
}

// валидация покрытия против trees.data.ts
const treesTs = readFileSync(`${OUT}/trees.data.ts`, 'utf8').replace(/\s+/g, ' ')
const ids = [...treesTs.matchAll(/\{ id: '([^']+)'/g)].map((m) => m[1])
const VANILLA = new Set([
  'Яблочный дуб',
  'Белая берёза',
  'Красная ель',
  'Тёмный дуб',
  'Акация',
  'Дерево джунглей',
])
const uncovered = ids.filter((id) => !map[id] && !VANILLA.has(id))
if (uncovered.length) console.warn('⚠ деревья без иконки:', uncovered.join(', '))

const ts = `// АВТОГЕНЕРАЦИЯ (scripts/gen-tree-icons.mjs) из trees/tree-icons-export. Не редактировать.
import type { TreeIcon } from '../domain/types'

export const TREE_ICON: Readonly<Record<string, TreeIcon>> = ${JSON.stringify(map, null, 2)}
`
writeFileSync(`${OUT}/treeIcons.data.ts`, ts)
console.log(
  `treeIcons: ${Object.keys(map).length} (forestry ${Object.values(map).filter((v) => v.kind === 'forestry').length}, extratrees ${Object.values(map).filter((v) => v.kind === 'extratrees').length}); деревьев ${ids.length}, vanilla ${VANILLA.size}, без иконки ${uncovered.length}`,
)
