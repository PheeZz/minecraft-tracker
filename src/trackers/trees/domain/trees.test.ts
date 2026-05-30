import { describe, it, expect } from 'vitest'
import { BY_ID, STARTING_SAPLINGS, TREES } from '../data/trees.data'
import {
  ancestorsOf,
  breedPath,
  effort,
  isAvailable,
  parentReady,
  unlockScore,
  type ProgressMap,
} from './graph'
import {
  FRUIT_CHAIN,
  FRUIT_PRODUCERS,
  FRUIT_TARGETS,
  computeUsage,
  fruitUnlocked,
  parentDemand,
} from './plan'

/** Стартовое состояние: стартовые саженцы получены, остальное — нет. */
function initialState(): ProgressMap {
  const s: Record<string, 0 | 2> = {}
  for (const t of TREES) s[t.id] = STARTING_SAPLINGS.has(t.id) ? 2 : 0
  return s
}

describe('целостность данных', () => {
  it('все родители ссылаются на существующие деревья', () => {
    for (const t of TREES) {
      for (const pair of t.parents ?? []) {
        for (const parent of pair) {
          expect(BY_ID[parent], `родитель «${parent}» дерева «${t.id}» не найден`).toBeDefined()
        }
      }
    }
  })

  it('tier 0 не имеет рецептов, tier > 0 имеет', () => {
    for (const t of TREES) {
      if (t.tier === 0) expect(t.parents).toBeUndefined()
      else expect(t.parents?.length).toBeGreaterThan(0)
    }
  })

  it('каждый плод указывает на дерево-производитель', () => {
    for (const [fruit, producers] of Object.entries(FRUIT_PRODUCERS)) {
      expect(producers.length).toBeGreaterThan(0)
      for (const id of producers) expect(BY_ID[id]?.fruit).toBe(fruit)
    }
  })

  it('сентинел «—» не используется (отсутствие плода = нет ключа)', () => {
    for (const t of TREES) expect(t.fruit).not.toBe('—')
  })

  it('граф ацикличен (нет дерева среди своих предков)', () => {
    for (const t of TREES) {
      expect(ancestorsOf(t.id).has(t.id), `${t.id} — собственный предок`).toBe(false)
    }
  })
})

describe('parentReady / isAvailable', () => {
  const state = initialState()

  it('стартовые деревья доступны как родители', () => {
    expect(parentReady(state, 'Яблочный дуб')).toBe(true)
    expect(parentReady(state, 'Бук европейский')).toBe(false)
  })

  it('дерево доступно, когда оба родителя готовы', () => {
    // Бук европейский = Яблочный дуб + Белая берёза (оба стартовые)
    expect(isAvailable(state, 'Бук европейский')).toBe(true)
    // Бальза = Акация + Тиковое дерево (Тиковое ещё не выведено)
    expect(isAvailable(state, 'Бальза')).toBe(false)
  })

  it('базовое дерево недоступно к выведению', () => {
    expect(isAvailable(state, 'Яблочный дуб')).toBe(false)
  })
})

describe('breedPath', () => {
  it('родители идут раньше потомков и без уже полученных', () => {
    const state = initialState()
    const path = breedPath(state, 'Бальза') // нужен Тиковое дерево
    expect(path).toContain('Тиковое дерево')
    expect(path).toContain('Бальза')
    expect(path.indexOf('Тиковое дерево')).toBeLessThan(path.indexOf('Бальза'))
  })

  it('для полученного дерева путь пуст', () => {
    const state = initialState()
    expect(breedPath(state, 'Яблочный дуб')).toEqual([])
  })
})

describe('effort / ancestorsOf', () => {
  it('усилие базового дерева = 0', () => {
    expect(effort('Яблочный дуб')).toBe(0)
  })
  it('усилие потомка больше усилия родителя', () => {
    expect(effort('Бальза')).toBeGreaterThan(effort('Тиковое дерево'))
  })
})

describe('unlockScore', () => {
  it('выведение «Тиковое дерево» разблокирует ровно 4 дерева', () => {
    const state = initialState()
    // Тиковое + стартовый родитель: Бальза(+Акация), Кешью(+Яблочный дуб),
    // Муравьиное дерево(+Тёмный дуб), Хлопковое дерево(+Дерево джунглей).
    // Остальные потребители Тикового требуют ещё не готовых родителей.
    expect(unlockScore(state, 'Тиковое дерево')).toBe(4)
  })
})

describe('план плодов', () => {
  it('FRUIT_TARGETS — подмножество FRUIT_CHAIN', () => {
    for (const target of FRUIT_TARGETS) expect(FRUIT_CHAIN.has(target)).toBe(true)
  })

  it('канонический производитель плода — минимальный по усилию', () => {
    // «Яблоко» дают Яблочный дуб (tier 0) и Яблоня садовая (tier 3).
    expect(FRUIT_PRODUCERS['Яблоко']).toEqual(
      expect.arrayContaining(['Яблочный дуб', 'Яблоня садовая']),
    )
    expect(FRUIT_TARGETS.has('Яблочный дуб')).toBe(true)
    expect(FRUIT_TARGETS.has('Яблоня садовая')).toBe(false)
  })

  it('FRUIT_CHAIN замкнут по предкам', () => {
    for (const id of FRUIT_CHAIN) {
      for (const parent of BY_ID[id]?.parents?.[0] ?? []) {
        expect(FRUIT_CHAIN.has(parent), `${parent} (предок ${id}) вне цепочки`).toBe(true)
      }
    }
  })

  it('fruitUnlocked реагирует на состояние', () => {
    const state = initialState()
    const fruit = 'Яблоко' // даёт стартовый «Яблочный дуб»
    expect(fruitUnlocked(state, fruit)).toBe(true)
  })

  it('computeUsage считает спрос на родителей', () => {
    const buk = BY_ID['Бук европейский']!
    const usage = computeUsage([buk])
    expect(usage['Яблочный дуб']).toBe(1)
    expect(usage['Белая берёза']).toBe(1)
  })

  it('parentDemand учитывает только цепочку плодов', () => {
    const state = initialState()
    const { need, needRem } = parentDemand(state, 'Сакура')
    expect(need).toBeGreaterThanOrEqual(needRem)
    expect(needRem).toBeGreaterThanOrEqual(0)
  })
})
