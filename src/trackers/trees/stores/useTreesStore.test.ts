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
  it('списывает 1 саженец и 1 пыльцу и отмечает выведенным', () => {
    const s = useTreesStore()
    s.adjustInv('Яблочный дуб', 'sap', 2)
    s.adjustInv('Белая берёза', 'pol', 2)
    s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(s.progress['Бук европейский']).toBe(2)
    expect(s.inv('Яблочный дуб').sap).toBe(1)
    expect(s.inv('Белая берёза').pol).toBe(1)
  })

  it('не уходит в минус при нулевом инвентаре', () => {
    const s = useTreesStore()
    s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    expect(s.inv('Яблочный дуб').sap).toBe(0)
    expect(s.inv('Белая берёза').pol).toBe(0)
    expect(s.progress['Бук европейский']).toBe(2)
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
    s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    s.undo()
    expect(s.inv('Яблочный дуб').sap).toBe(1)
    expect(s.inv('Белая берёза').pol).toBe(1)
    expect(s.progress['Бук европейский']).toBe(0)
  })

  it('breed — один акт = один снапшот (одного undo достаточно)', () => {
    const s = useTreesStore()
    s.adjustInv('Яблочный дуб', 'sap', 1)
    s.adjustInv('Белая берёза', 'pol', 1)
    s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
    s.undo() // должен откатить всё списание+статус разом
    expect(s.progress['Бук европейский']).toBe(0)
    expect(s.inv('Яблочный дуб').sap).toBe(1)
    expect(s.inv('Белая берёза').pol).toBe(1)
  })

  it('breed сбрасывает redo-стек', () => {
    const s = useTreesStore()
    s.setState('Сакура', 2)
    s.undo()
    expect(s.canRedo).toBe(true)
    s.breed('Бук европейский', 'Яблочный дуб', 'Белая берёза')
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
