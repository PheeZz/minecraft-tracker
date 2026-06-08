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
  ['genetics/textures/items', 'public/genetics/items'],
  ['genetics/textures/blocks', 'public/genetics/blocks'],
  ['thaumcraft/textures/items', 'public/thaumcraft/tex/items'],
  ['thaumcraft/textures/blocks', 'public/thaumcraft/tex/blocks'],
  // ванильные предметы/блоки 1.7.10 — иконки ингредиентов в рецептах/сканах/плавке
  ['vanilla/textures/items', 'public/thaumcraft/tex/vanilla/items'],
  ['vanilla/textures/blocks', 'public/thaumcraft/tex/vanilla/blocks'],
  // BloodMagic — иконки предметов и блоков
  ['bloodmagic/textures/items', 'public/bloodmagic/items'],
  ['bloodmagic/textures/blocks', 'public/bloodmagic/blocks'],
  // BloodMagic — ванильные иконки ингредиентов (рецепты используют bloodmagic/vanilla/...)
  ['vanilla/textures/items', 'public/bloodmagic/vanilla/items'],
  ['vanilla/textures/blocks', 'public/bloodmagic/vanilla/blocks'],
  // OBJ-модель Кровавого алтаря из мода (точная геометрия, не куб)
  ['bloodmagic/models', 'public/bloodmagic/models'],
  // BloodArsenal — иконки предметов и блоков (хранятся рядом с Thaumcraft для удобства)
  ['thaumcraft/textures/items/bloodarsenal', 'public/bloodmagic/items/bloodarsenal'],
  ['thaumcraft/textures/blocks/bloodarsenal', 'public/bloodmagic/blocks/bloodarsenal'],
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
