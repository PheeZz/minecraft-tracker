// Генерирует src/trackers/genetics/data/genomes.data.ts из genetics/data-src/species-genomes.json,
// доклеивая русские имена видов из bees.data. Запуск: node scripts/gen-genomes.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import prettier from 'prettier'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = JSON.parse(
  readFileSync(resolve(root, 'genetics/data-src/species-genomes.json'), 'utf8'),
)

// en→ru из bees.data (ключ mod+en для разрешения дублей en, плюс fallback по en).
const beesTs = readFileSync(resolve(root, 'src/trackers/bees/data/bees.data.ts'), 'utf8')
const modName = { F: 'Forestry', E: 'ExtraBees', M: 'MagicBees' }
const ruByModEn = {}
const ruByEn = {}
const re = /id:\s*'([^']+)'[\s\S]*?en:\s*'([^']+)'[\s\S]*?source:\s*'([FEM])'/g
let m
while ((m = re.exec(beesTs))) {
  ruByModEn[`${modName[m[3]]}|${m[2]}`] = m[1]
  ruByEn[m[2]] = m[1]
}

const TRAIT_KEYS = [
  'speed',
  'lifespan',
  'fertility',
  'tempTol',
  'humidTol',
  'nocturnal',
  'flyer',
  'cave',
  'flowering',
  'territory',
  'effect',
  'flowers',
]

const out = []
const skipped = []
for (const s of src.species) {
  const ru = ruByModEn[`${s.mod}|${s.en}`] ?? ruByEn[s.en]
  if (!ru) {
    skipped.push(`${s.mod}|${s.en}`) // вне whitelist (бонусные виды) — пропускаем
    continue
  }
  const genome = {}
  for (const k of TRAIT_KEYS) if (s.genome?.[k] != null) genome[k] = String(s.genome[k])
  out.push({ en: s.en, ru, mod: s.mod, genome })
}

const body = `// АВТОГЕНЕРАЦИЯ (scripts/gen-genomes.mjs) из genetics/data-src/species-genomes.json + bees.data. Не редактировать вручную.
import type { GeneMod } from '../domain/genetics'

/** Дефолтный геном вида: признак → значение аллеля (canonical EN). */
export interface SpeciesGenome {
  en: string
  ru: string
  mod: GeneMod
  genome: Record<string, string>
}

export const GENOMES: readonly SpeciesGenome[] = ${JSON.stringify(out)} as const
`

const formatted = await prettier.format(body, {
  parser: 'typescript',
  semi: false,
  singleQuote: true,
})
writeFileSync(resolve(root, 'src/trackers/genetics/data/genomes.data.ts'), formatted)
console.log(`genomes.data.ts: ${out.length} видов (пропущено вне whitelist: ${skipped.length})`)
