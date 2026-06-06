// Генерирует src/trackers/genetics/data/textures.data.ts из genetics/textures/manifest.json:
// карта «нормализованный EN предмета → имя файла». Запуск: node scripts/gen-textures.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import prettier from 'prettier'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const man = JSON.parse(readFileSync(resolve(root, 'genetics/textures/manifest.json'), 'utf8'))

const tex = {}
for (const [en, path] of Object.entries(man.items ?? {})) {
  tex[en.toLowerCase()] = String(path).replace(/^items\//, '')
}
// алиасы под формулировки входов пайплайна (мн.ч./варианты названий)
const ALIAS = {
  'serum vial': 'serum',
  serum: 'serum',
  'genetic samples': 'genetic sample',
  'gene from gene database': 'gene database',
  'genetic template': 'genetic template',
}
for (const [a, target] of Object.entries(ALIAS)) if (tex[target]) tex[a] = tex[target]

const body = `// АВТОГЕНЕРАЦИЯ (scripts/gen-textures.mjs) из genetics/textures/manifest.json. Не редактировать вручную.
/** Имя файла иконки предмета по нормализованному (lowercase) EN. Путь: BASE_URL + 'genetics/items/<file>'. */
export const ITEM_TEX: Readonly<Record<string, string>> = ${JSON.stringify(tex)}
`
const out = await prettier.format(body, { parser: 'typescript', semi: false, singleQuote: true })
writeFileSync(resolve(root, 'src/trackers/genetics/data/textures.data.ts'), out)
console.log(`textures.data.ts: ${Object.keys(tex).length} ключей`)
