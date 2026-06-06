// scripts/gen-genetics.mjs
// Генерирует src/trackers/genetics/data/genetics.data.ts из bees/i18n/genetics-i18n.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import prettier from 'prettier'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = JSON.parse(readFileSync(resolve(root, 'bees/i18n/genetics-i18n.json'), 'utf8'))

const TRAIT_ORDER = [
  ['species', 'Species', 'База пчелы: продукты и исходные характеристики'],
  ['speed', 'Speed', 'Как часто пчела производит продукт'],
  ['lifespan', 'Lifespan', 'Сколько циклов живёт пчела'],
  ['fertility', 'Fertility', 'Сколько трутней-потомков за цикл'],
  ['tempTol', 'Temperature Tolerance', 'Расширяет диапазон температур работы'],
  ['humidTol', 'Humidity Tolerance', 'Расширяет диапазон влажности работы'],
  ['nocturnal', 'Nocturnal', 'Работает ли ночью'],
  ['flyer', 'Tolerant Flyer', 'Работает ли в дождь'],
  ['cave', 'Cave Dwelling', 'Работает ли без открытого неба'],
  ['flowering', 'Flowering', 'Как быстро опыляет и распространяет цветы'],
  ['territory', 'Territory', 'Размер рабочей зоны улья'],
  ['effect', 'Effect', 'Особое действие в радиусе улья'],
  ['flowers', 'Flower Provider', 'Какие цветы/блоки нужны пчеле'],
]

const ALLELE_KEY = {
  speed: 'speed',
  lifespan: 'lifespan',
  fertility: 'fertility',
  tempTol: 'tolerance',
  humidTol: 'tolerance',
  flowering: 'flowering',
  territory: 'territory',
  effect: 'effect',
  flowers: 'flowers',
}
const BOOL = { nocturnal: 1, flyer: 1, cave: 1 }

function allelesFor(key) {
  if (BOOL[key])
    return [
      { en: 'Yes', ru: 'Да' },
      { en: 'No', ru: 'Нет' },
    ]
  if (key === 'species') return []
  const arr = src.alleles[ALLELE_KEY[key]] ?? []
  return arr.map((a) =>
    typeof a === 'string'
      ? { en: a, ru: a }
      : { en: a.en, ru: a.ru, ...(a.mod ? { mod: a.mod } : {}) },
  )
}

const traits = TRAIT_ORDER.map(([key, en, desc]) => ({
  key,
  en,
  ru: src.traits[en] ?? en,
  desc,
  alleles: allelesFor(key),
}))

const body = `// АВТОГЕНЕРАЦИЯ (scripts/gen-genetics.mjs) из bees/i18n/genetics-i18n.json. Не редактировать вручную.
import type { TraitDef } from '../domain/genetics'

export const TRAITS: readonly TraitDef[] = ${JSON.stringify(traits)} as const

export const MACHINES = ${JSON.stringify(src.machines)} as const
export const RESOURCES = ${JSON.stringify(src.resources)} as const
`

const out = await prettier.format(body, { parser: 'typescript', semi: false, singleQuote: true })
writeFileSync(resolve(root, 'src/trackers/genetics/data/genetics.data.ts'), out)
console.log('genetics.data.ts: traits', traits.length)
