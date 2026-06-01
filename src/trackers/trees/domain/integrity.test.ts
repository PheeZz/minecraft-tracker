/**
 * Сверка src/trackers/trees/data/trees.data.ts с каноном trees/recipes_output/recipes.js
 * (данные, извлечённые из jar мода). Запуск: `npm run verify:trees`.
 *
 * Проверяет: совпадение деревьев и рецептов (родительские пары без учёта порядка),
 * полноту покрытия канонических рецептов и наличие пометок об условиях (cond).
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { TREES } from '../data/trees.data'

// --- алиасы canonical(genitive/иное) -> nominative (как в моих данных) ---
const ALIAS: Record<string, string> = {
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
  'белого тополя': 'Тополь',
  'белой берёзы': 'Белая берёза',
  'яблочного дуба': 'Яблочный дуб',
  'красной ели': 'Красная ель',
  'тёмного дуба': 'Тёмный дуб',
  'дерева джунглей': 'Дерево джунглей',
  акации: 'Акация',
  'Вяз обыкновенный': 'Вяз',
  'Ясень обыкновенный': 'Ясень',
  'Боярышник однопестичный': 'Боярышник',
  'Гинкго двулопастный': 'Гинкго',
  'Ликвидамбар смолоносный': 'Ликвидамбар',
  'Робиния ложноакациевая': 'Робиния',
  'Умнини (розовая кость)': 'Умнини',
  'Лумбанг (свечное дерево)': 'Лумбанг',
}

function norm(n: string): string {
  return ALIAS[n] ?? n
}

// --- канонические рецепты из recipes.js ---
const js = readFileSync('trees/recipes_output/recipes.js', 'utf8')

// Map<tree, Set<pairKey>>  где pairKey = [norm(p1),norm(p2)].sort().join('|')
const canon = new Map<string, Set<string>>()
// Map<tree, Set<cond>>
const canonCond = new Map<string, Set<string>>()

const recipeRe =
  /\{\s*id:"([^"]+)",\s*parents:\[\["([^"]+)",\s*"([^"]+)"\]\],\s*chance:(\d+),\s*source:"[^"]+"(?:,\s*cond:"([^"]+)")?\s*\}/g

let m: RegExpExecArray | null
while ((m = recipeRe.exec(js)) !== null) {
  const tid = m[1]!
  const p1 = m[2]!
  const p2 = m[3]!
  const cond = m[5]

  const t = norm(tid)
  const pairKey = [norm(p1), norm(p2)].sort().join('|')

  if (!canon.has(t)) canon.set(t, new Set())
  canon.get(t)!.add(pairKey)

  if (cond) {
    if (!canonCond.has(t)) canonCond.set(t, new Set())
    canonCond.get(t)!.add(cond)
  }
}

// --- мои данные из TREES (прямой импорт) ---
const mineTier: Record<string, number> = {}
const mine = new Map<string, Set<string>>()
const mineCond: Record<string, string> = {}

for (const tree of TREES) {
  mineTier[tree.id] = tree.tier
  if (tree.parents) {
    for (const [a, b] of tree.parents) {
      const pairKey = [a, b].sort().join('|')
      if (!mine.has(tree.id)) mine.set(tree.id, new Set())
      mine.get(tree.id)!.add(pairKey)
    }
  }
  if (tree.cond) {
    mineCond[tree.id] = tree.cond
  }
}

describe('целостность данных деревьев', () => {
  it('нет недостающих деревьев (есть в каноне, нет у меня)', () => {
    const missing = [...canon.keys()].filter((t) => !(t in mineTier)).sort()
    expect(missing.length, `В каноне есть, у меня НЕТ дерева: [${missing.join(', ')}]`).toBe(0)
  })

  it('нет лишних рецептов (есть у меня, нет в каноне)', () => {
    const extra = [...mine.keys()].filter((t) => !canon.has(t)).sort()
    expect(extra.length, `У меня есть рецепт, в каноне НЕТ дерева: [${extra.join(', ')}]`).toBe(0)
  })

  it('все мои рецепты входят в канон', () => {
    const violations: string[] = []
    for (const [t, pairs] of mine) {
      if (!canon.has(t)) continue
      const canonPairs = canon.get(t)!
      for (const pairKey of pairs) {
        if (!canonPairs.has(pairKey)) {
          violations.push(`${t}: мой [${pairKey.split('|').join(', ')}] ∉ канон`)
        }
      }
    }
    violations.sort()
    expect(violations.length, `Мои рецепты вне канона:\n${violations.join('\n')}`).toBe(0)
  })

  it('полное покрытие канона (все канон-рецепты есть у меня)', () => {
    const missing: string[] = []
    for (const [t, canonPairs] of canon) {
      if (!mine.has(t)) continue
      const myPairs = mine.get(t)!
      for (const pairKey of canonPairs) {
        if (!myPairs.has(pairKey)) {
          missing.push(`${t}: не хватает [${pairKey.split('|').join(', ')}]`)
        }
      }
    }
    missing.sort()
    expect(
      missing.length,
      `Канонические рецепты отсутствующие у меня:\n${missing.join('\n')}`,
    ).toBe(0)
  })

  it('условия помечены (cond у меня для каждого дерева с канон-условием)', () => {
    const unchecked: string[] = []
    for (const t of canonCond.keys()) {
      if (!(t in mineCond)) {
        unchecked.push(t)
      }
    }
    unchecked.sort()
    expect(
      unchecked.length,
      `Деревья с канон-условием, у которых нет cond у меня: [${unchecked.join(', ')}]`,
    ).toBe(0)
  })
})
