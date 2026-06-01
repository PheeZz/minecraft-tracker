import { beforeEach, describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { storage } from '@/shared/persistence/storage'
import { useTreesStore } from './useTreesStore'
import { STARTING_SAPLINGS, TREES } from '../data/trees.data'

beforeEach(() => {
  storage.clear()
  setActivePinia(createPinia())
})

describe('инициализация', () => {
  it('стартовые саженцы = 2, остальные = 0', () => {
    const s = useTreesStore()
    expect(s.progress['Яблочный дуб']).toBe(2)
    expect(s.progress['Бук европейский']).toBe(0)
    const startingBred = TREES.filter((t) => s.progress[t.id] === 2).map((t) => t.id)
    expect(new Set(startingBred)).toEqual(new Set(STARTING_SAPLINGS))
  })
})

describe('setState + persist', () => {
  it('меняет состояние и пишет в localStorage', () => {
    const s = useTreesStore()
    s.setState('Бук европейский', 2)
    expect(s.progress['Бук европейский']).toBe(2)
    const raw = storage.get<Record<string, number>>('trees.progress', {})
    expect(raw['Бук европейский']).toBe(2)
  })

  it('игнорирует неизвестные id', () => {
    const s = useTreesStore()
    s.setState('Нет такого', 2)
    expect(s.progress['Нет такого']).toBeUndefined()
  })
})

describe('инвентарь', () => {
  it('adjustInv не уходит ниже нуля', () => {
    const s = useTreesStore()
    s.adjustInv('Сакура', 'sap', 3)
    expect(s.inv('Сакура').sap).toBe(3)
    s.adjustInv('Сакура', 'sap', -10)
    expect(s.inv('Сакура').sap).toBe(0)
  })
})

describe('breed со списанием', () => {
  it('возвращает true и списывает 1 саженец и 1 пыльцу, отмечает выведенным', () => {
    const s = useTreesStore()
    s.adjustInv('Яблочный дуб', 'sap', 2)
    s.adjustInv('Белая берёза', 'pol', 2)
    const result = s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(result).toBe(true)
    expect(s.progress['Бук европейский']).toBe(2)
    expect(s.inv('Яблочный дуб').sap).toBe(1)
    expect(s.inv('Белая берёза').pol).toBe(1)
  })

  it('возвращает false и не меняет прогресс, если саженца не хватает', () => {
    const s = useTreesStore()
    const result = s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(result).toBe(false)
    expect(s.progress['Бук европейский']).toBe(0)
    expect(s.inv('Яблочный дуб').sap).toBe(0)
    expect(s.inv('Белая берёза').pol).toBe(0)
  })

  it('возвращает false и не меняет прогресс, если пыльцы не хватает', () => {
    const s = useTreesStore()
    s.adjustInv('Яблочный дуб', 'sap', 1)
    const result = s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(result).toBe(false)
    expect(s.progress['Бук европейский']).toBe(0)
    expect(s.inv('Яблочный дуб').sap).toBe(1) // не изменился
  })
})

describe('авто-саженец при получении', () => {
  it('setState(→2) проставляет 1 саженец полученного дерева', () => {
    const s = useTreesStore()
    expect(s.inv('Бук европейский').sap).toBe(0)
    s.setState('Бук европейский', 2)
    expect(s.inv('Бук европейский').sap).toBe(1)
  })

  it('breed тоже даёт 1 саженец выведенного дерева (помимо списания родителей)', () => {
    const s = useTreesStore()
    s.adjustInv('Яблочный дуб', 'sap', 1)
    s.adjustInv('Белая берёза', 'pol', 1)
    const result = s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(result).toBe(true)
    expect(s.inv('Бук европейский').sap).toBe(1)
  })

  it('не понижает, если саженцев уже больше', () => {
    const s = useTreesStore()
    s.adjustInv('Бук европейский', 'sap', 5)
    s.setState('Бук европейский', 2)
    expect(s.inv('Бук европейский').sap).toBe(5)
  })

  it('снятие отметки (→0) не добавляет и не удаляет саженцы', () => {
    const s = useTreesStore()
    s.setState('Бук европейский', 2)
    expect(s.inv('Бук европейский').sap).toBe(1)
    s.setState('Бук европейский', 0)
    expect(s.inv('Бук европейский').sap).toBe(1) // остаётся, не трогаем
  })

  it('undo откатывает и авто-саженец вместе со статусом', () => {
    const s = useTreesStore()
    s.setState('Бук европейский', 2)
    s.undo()
    expect(s.progress['Бук европейский']).toBe(0)
    expect(s.inv('Бук европейский').sap).toBe(0)
  })
})

describe('undo / redo', () => {
  it('откатывает и повторяет изменение состояния', () => {
    const s = useTreesStore()
    expect(s.canUndo).toBe(false)
    s.setState('Бук европейский', 2)
    expect(s.canUndo).toBe(true)
    s.undo()
    expect(s.progress['Бук европейский']).toBe(0)
    expect(s.canRedo).toBe(true)
    s.redo()
    expect(s.progress['Бук европейский']).toBe(2)
  })

  it('новое действие сбрасывает redo-стек', () => {
    const s = useTreesStore()
    s.setState('Бук европейский', 2)
    s.undo()
    expect(s.canRedo).toBe(true)
    s.setState('Сакура', 2)
    expect(s.canRedo).toBe(false)
  })

  it('undo восстанавливает инвентарь после breed', () => {
    const s = useTreesStore()
    s.adjustInv('Яблочный дуб', 'sap', 1)
    s.adjustInv('Белая берёза', 'pol', 1)
    const result = s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(result).toBe(true)
    s.undo()
    expect(s.inv('Яблочный дуб').sap).toBe(1)
    expect(s.inv('Белая берёза').pol).toBe(1)
    expect(s.progress['Бук европейский']).toBe(0)
  })

  it('breed — один акт = один снапшот (одного undo достаточно)', () => {
    const s = useTreesStore()
    s.adjustInv('Яблочный дуб', 'sap', 1)
    s.adjustInv('Белая берёза', 'pol', 1)
    const result = s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(result).toBe(true)
    s.undo() // должен откатить всё списание+статус разом
    expect(s.progress['Бук европейский']).toBe(0)
    expect(s.inv('Яблочный дуб').sap).toBe(1)
    expect(s.inv('Белая берёза').pol).toBe(1)
  })

  it('breed сбрасывает redo-стек (если ресурс достаточен)', () => {
    const s = useTreesStore()
    s.setState('Сакура', 2)
    s.undo()
    expect(s.canRedo).toBe(true)
    s.adjustInv('Яблочный дуб', 'sap', 1)
    s.adjustInv('Белая берёза', 'pol', 1)
    const result = s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(result).toBe(true)
    expect(s.canRedo).toBe(false)
  })

  it('persist после undo пишет откатанное состояние в localStorage', () => {
    const s = useTreesStore()
    s.setState('Бук европейский', 2)
    s.undo()
    const raw = storage.get<Record<string, number>>('trees.progress', {})
    expect(raw['Бук европейский']).toBe(0)
  })

  it('история ограничена 200 снапшотами', () => {
    const s = useTreesStore()
    for (let i = 0; i < 250; i++) s.setState('Бук европейский', i % 2 === 0 ? 2 : 0)
    let depth = 0
    while (s.canUndo) {
      s.undo()
      depth++
      if (depth > 1000) break // страховка от зацикливания
    }
    expect(depth).toBe(200)
  })
})

describe('reset', () => {
  it('возвращает стартовое состояние и чистит инвентарь', () => {
    const s = useTreesStore()
    s.setState('Бук европейский', 2)
    s.adjustInv('Сакура', 'sap', 5)
    s.reset()
    expect(s.progress['Бук европейский']).toBe(0)
    expect(s.inv('Сакура').sap).toBe(0)
    expect(s.progress['Яблочный дуб']).toBe(2)
  })

  it('пишет стартовое состояние в localStorage', () => {
    const s = useTreesStore()
    s.setState('Бук европейский', 2)
    s.reset()
    const raw = storage.get<Record<string, number>>('trees.progress', {})
    expect(raw['Бук европейский']).toBe(0)
    expect(raw['Яблочный дуб']).toBe(2)
    expect(storage.get('trees.inventory', null)).toEqual({})
  })
})

describe('export / import', () => {
  it('round-trip сохраняет прогресс и инвентарь', () => {
    const a = useTreesStore()
    a.setState('Бук европейский', 2)
    a.adjustInv('Сакура', 'pol', 4)
    const payload = a.exportData()
    expect(payload.v).toBe(3)

    storage.clear()
    setActivePinia(createPinia())
    const b = useTreesStore()
    b.importData(payload)
    expect(b.progress['Бук европейский']).toBe(2)
    expect(b.inv('Сакура').pol).toBe(4)
  })

  it('импорт игнорирует неизвестные id и кривые значения', () => {
    const s = useTreesStore()
    s.importData({
      progress: { 'Нет дерева': 2, Сакура: 2 },
      inventory: { Сакура: { sap: -5, pol: 3 } },
    })
    expect(s.progress['Нет дерева']).toBeUndefined()
    expect(s.progress['Сакура']).toBe(2)
    expect(s.inv('Сакура')).toEqual({ sap: 0, pol: 3 })
  })
})

describe('hero-метрики', () => {
  it('в стартовом состоянии 0 выведено и есть доступные', () => {
    const s = useTreesStore()
    expect(s.hero.bred).toBe(0)
    expect(s.hero.pct).toBe(0)
    expect(s.hero.available).toBeGreaterThan(0)
    expect(s.hero.fruitsTotal).toBeGreaterThan(0)
  })

  it('пересчитывается после выведения', () => {
    const s = useTreesStore()
    const before = s.hero.bred
    s.setState('Бук европейский', 2)
    expect(s.hero.bred).toBe(before + 1)
  })

  it('fruitPct = округлённая доля собранных плодов и растёт при разблокировке', () => {
    const s = useTreesStore()
    const ratio = (h: typeof s.hero) => Math.round((h.fruitsUnlocked / h.fruitsTotal) * 100)
    expect(s.hero.fruitPct).toBe(ratio(s.hero))
    expect(s.hero.fruitPct).toBeGreaterThanOrEqual(0)
    expect(s.hero.fruitPct).toBeLessThanOrEqual(100)
    const before = s.hero.fruitsUnlocked
    s.setState('Сакура', 2) // единственный производитель «Вишни»
    expect(s.hero.fruitsUnlocked).toBe(before + 1)
    expect(s.hero.fruitPct).toBe(ratio(s.hero))
  })
})

describe('персистентность между сессиями', () => {
  it('перезагрузка стора читает сохранённое состояние', () => {
    const a = useTreesStore()
    a.setState('Сакура', 2)
    setActivePinia(createPinia())
    const b = useTreesStore()
    expect(b.progress['Сакура']).toBe(2)
  })
})
