import { beforeEach, describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { storage } from '@/shared/persistence/storage'
import { TREES } from '../data/trees.data'
import { useTreesStore } from './useTreesStore'
import { useTreesCelebration } from './useTreesCelebration'

beforeEach(() => {
  storage.clear()
  setActivePinia(createPinia())
})

/** Все плоды разблокированы: каждое дерево с плодом получено. */
function unlockAllFruits(s: ReturnType<typeof useTreesStore>): void {
  for (const t of TREES) if (t.fruit) s.setState(t.id, 2)
}

describe('празднование 100%', () => {
  it('не палит без достижения', () => {
    useTreesStore()
    const c = useTreesCelebration()
    expect(c.current).toBeNull()
  })

  it('срабатывает при первой загрузке с уже-100% плодов и помечает seen', () => {
    const s = useTreesStore()
    unlockAllFruits(s)
    expect(s.hero.fruitPct).toBe(100)
    const c = useTreesCelebration()
    expect(c.current?.id).toBe('fruits')
    expect(c.seen.fruits).toBe(true)
    expect(storage.get('trees.celebrate.seen', {})).toMatchObject({ fruits: true })
  })

  it('один раз навсегда: после dismiss и переинстанса не палит снова', () => {
    const s = useTreesStore()
    unlockAllFruits(s)
    const c = useTreesCelebration()
    expect(c.current?.id).toBe('fruits')
    c.dismiss()
    expect(c.current).toBeNull()

    // новая «сессия» (тот же storage): прогресс и seen читаются заново
    setActivePinia(createPinia())
    useTreesStore() // перечитает all-obtained из storage → плоды снова 100%
    const c2 = useTreesCelebration()
    expect(c2.current).toBeNull() // seen=true → праздника нет
  })

  it('двойной 100% за один тик показывает каждый праздник ровно один раз', async () => {
    const s = useTreesStore()
    const c = useTreesCelebration()
    // готовим состояние, где сразу завершаются и плоды, и саженцы
    const progress: Record<string, 0 | 2> = {}
    for (const t of TREES) if (t.fruit) progress[t.id] = 2
    const inventory: Record<string, { sap: number; pol: number }> = {}
    for (const t of TREES) inventory[t.id] = { sap: 999, pol: 999 }
    s.importData({ progress, inventory })
    await nextTick()
    expect(s.hero.fruitPct).toBe(100)
    expect(s.hero.haveSap).toBeGreaterThanOrEqual(s.hero.planSap)
    expect(s.hero.planSap).toBeGreaterThan(0)

    // прокручиваем всю очередь и собираем показанные id — каждый ровно один раз
    const shown: string[] = []
    let guard = 0
    while (c.current && guard++ < 10) {
      shown.push(c.current.id)
      c.dismiss()
    }
    expect(shown).toContain('fruits')
    expect(shown).toContain('saplings')
    expect(new Set(shown).size).toBe(shown.length) // без дублей
  })

  it('импорт конфига со 100% плодов запускает тот же хук', async () => {
    const s = useTreesStore()
    const c = useTreesCelebration()
    expect(c.current).toBeNull()
    // импортируем «готовый» конфиг — importData меняет progress → вотчер ловит
    const progress: Record<string, 0 | 2> = {}
    for (const t of TREES) if (t.fruit) progress[t.id] = 2
    s.importData({ progress, inventory: {} })
    await nextTick()
    expect(c.current?.id).toBe('fruits')
  })
})
