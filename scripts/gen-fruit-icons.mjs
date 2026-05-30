// Генерирует src/trackers/trees/data/fruitIcons.data.ts из trees/fruit-assets/fruits.json.
// Ключи — названия плодов (RU), как в FRUITS трекера деревьев. Значение — путь к иконке.
// Запуск: node scripts/gen-fruit-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { format } from 'prettier'

/** Запись TS-файла в стиле проекта (идемпотентно — повторный запуск даёт тот же файл). */
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

const OUT = 'src/trackers/trees/data'
const data = JSON.parse(readFileSync('trees/fruit-assets/fruits.json', 'utf8'))

// индекс плодов по ru (регистронезависимо — в данных мода встречается «Гинкго»/«Семяна»)
const byRu = {}
for (const f of Object.values(data.fruits)) {
  if (f.ru && f.icon) byRu[f.ru.toLowerCase()] = f.icon
}
// точечные алиасы расхождений названий (мой FRUITS → ru в fruits.json)
const ALIAS = {
  финик: 'финики',
  гвоздика: 'гвоздика (пряность)',
  'семена можжевельника': 'семяна можжевельника', // опечатка «семяна» в данных мода
}

// FRUITS трекера деревьев (дерево → плод RU) из trees.data.ts
const ts = readFileSync(`${OUT}/trees.data.ts`, 'utf8')
const block = ts.slice(ts.indexOf('export const FRUITS'))
const body = block.slice(block.indexOf('{') + 1, block.indexOf('}'))
const fruitNames = new Set()
for (const m of body.matchAll(/'?([^':,{}]+?)'?\s*:\s*'([^']+)'/g)) fruitNames.add(m[2])
if (fruitNames.size < 60)
  throw new Error(`распарсено мало плодов (${fruitNames.size}) — проверь FRUITS`)

const map = {}
const missing = []
for (const name of fruitNames) {
  const key = name.toLowerCase()
  const icon = byRu[key] ?? byRu[ALIAS[key]]
  if (icon) map[name] = icon
  else missing.push(name)
}

if (missing.length) console.warn('⚠ плоды без иконки (fallback на SVG):', missing.join(', '))

const out = `// АВТОГЕНЕРАЦИЯ (scripts/gen-fruit-icons.mjs) из trees/fruit-assets/fruits.json. Не редактировать.
// Ключ — название плода (RU) из FRUITS; значение — путь к готовой иконке-предмету.
export const FRUIT_ICON: Readonly<Record<string, string>> = ${JSON.stringify(map, null, 2)}
`
await writeTs(`${OUT}/fruitIcons.data.ts`, out)
console.log(`fruitIcons: ${Object.keys(map).length} плодов с иконкой, ${missing.length} без`)
