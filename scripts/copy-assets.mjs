// Копирует исходные PNG-ассеты (source-of-truth в bees/ и trees/) в public/,
// откуда их грузит рантайм (import.meta.env.BASE_URL + 'bees'/'trees').
// Копии в public/ генерируемы и не хранятся в git (см. .gitignore). Запуск: node scripts/copy-assets.mjs
import { cpSync, mkdirSync } from 'node:fs'

const DIRS = [
  ['bees/mockups/beebody', 'public/bees/beebody'],
  ['bees/mockups/beebody-skulking', 'public/bees/beebody-skulking'],
  ['bees/mockups/beebody-doctoral', 'public/bees/beebody-doctoral'],
  ['trees/tree-icons-export/tree-icons', 'public/trees/tree-icons'],
  ['trees/tree-icons-export/tree-templates', 'public/trees/tree-templates'],
  ['trees/fruit-assets/extratrees-food', 'public/trees/fruits/extratrees-food'],
  ['trees/fruit-assets/forestry-fruits', 'public/trees/fruits/forestry-fruits'],
]
const FILES = [
  ['bees/mockups/beeCombs.0.png', 'public/bees/beeCombs.0.png'],
  ['bees/mockups/beeCombs.1.png', 'public/bees/beeCombs.1.png'],
]

for (const [src, dest] of DIRS) {
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
}
for (const [src, dest] of FILES) cpSync(src, dest)
console.log(`✔ ассеты скопированы в public/ (${DIRS.length} каталогов, ${FILES.length} файла)`)
