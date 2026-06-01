import { beforeEach, describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { storage } from '@/shared/persistence/storage'
import { useBeesStore } from './useBeesStore'
import { useBeesUiStore } from './useBeesUiStore'

beforeEach(() => {
  storage.clear()
  setActivePinia(createPinia())
})

describe('склад', () => {
  it('toggleHave добавляет/убирает и персистит', () => {
    const s = useBeesStore()
    s.toggleHave('Развитая')
    expect(s.isHave('Развитая')).toBe(true)
    expect(storage.get<string[]>('bees.have', [])).toContain('Развитая')
    s.toggleHave('Развитая')
    expect(s.isHave('Развитая')).toBe(false)
  })
  it('clearHave очищает', () => {
    const s = useBeesStore()
    s.toggleHave('Обычная')
    s.clearHave()
    expect(s.haveCount).toBe(0)
  })

  it('toggleHave инвалидирует мемо глубины (depthOf пересчитывается)', () => {
    const s = useBeesStore()
    expect(s.depthOf('Знатная')).toBe(2) // Обычная(0)+Развитая(1)
    s.toggleHave('Развитая')
    expect(s.depthOf('Знатная')).toBe(1) // Развитая на складе → короче
  })
  it('перезагрузка читает склад, отбрасывая неизвестные id', () => {
    storage.set('bees.have', ['Развитая', 'нет такой'])
    setActivePinia(createPinia())
    const s = useBeesStore()
    expect(s.isHave('Развитая')).toBe(true)
    expect(s.haveCount).toBe(1)
  })
})

describe('рецепты', () => {
  it('cycleRecipe циклирует у многорецептурных, игнорит однорецептурные', () => {
    const s = useBeesStore()
    s.cycleRecipe('Бережливая') // 2 рецепта
    expect(s.rc['Бережливая']).toBe(1)
    s.cycleRecipe('Бережливая')
    expect(s.rc['Бережливая']).toBe(0)
    s.cycleRecipe('Развитая') // 1 рецепт — без эффекта
    expect(s.rc['Развитая']).toBeUndefined()
  })
})

describe('producersOf / выбор', () => {
  it('сортирует производителей по глубине (проще всего — первым)', () => {
    const s = useBeesStore()
    const prod = s.producersOf('Медовые соты')
    expect(prod.length).toBeGreaterThan(1)
    expect(prod[0]!.depth).toBe(0) // есть дикий/базовый производитель
    for (let i = 1; i < prod.length; i++)
      expect(prod[i]!.depth).toBeGreaterThanOrEqual(prod[i - 1]!.depth)
  })
  it('selectComb выбирает самого простого производителя как цель', () => {
    const s = useBeesStore()
    const ui = useBeesUiStore()
    ui.selectComb('Медовые соты')
    expect(ui.mode).toBe('comb')
    expect(ui.curComb).toBe('Медовые соты')
    expect(ui.curTarget).toBe(s.producersOf('Медовые соты')[0]!.bee)
  })
  it('producersOf несуществующей соты — пустой массив, selectComb → curTarget null', () => {
    const s = useBeesStore()
    const ui = useBeesUiStore()
    expect(s.producersOf('нет такой соты')).toEqual([])
    ui.selectComb('нет такой соты')
    expect(ui.curTarget).toBeNull()
  })
  it('selectBee переключает режим', () => {
    const ui = useBeesUiStore()
    ui.selectBee('Знатная')
    expect(ui.mode).toBe('bee')
    expect(ui.curComb).toBeNull()
    expect(ui.curTarget).toBe('Знатная')
  })
})

describe('навигация view/tasksOpen', () => {
  it('view по умолчанию graph, setView переключает', () => {
    const ui = useBeesUiStore()
    expect(ui.view).toBe('graph')
    ui.setView('inventory')
    expect(ui.view).toBe('inventory')
  })
  it('tasksOpen независим, open/close/toggle', () => {
    const ui = useBeesUiStore()
    expect(ui.tasksOpen).toBe(false)
    ui.openTasks()
    expect(ui.tasksOpen).toBe(true)
    ui.closeTasks()
    expect(ui.tasksOpen).toBe(false)
    ui.toggleTasks()
    expect(ui.tasksOpen).toBe(true)
  })
})

describe('CRUD задач', () => {
  it('addTask создаёт задачу с id и дедупом сот', () => {
    const s = useBeesStore()
    s.addTask('Предмет №1', ['Медовые соты', 'Медовые соты', 'Фруктовые соты'])
    expect(s.tasks).toHaveLength(1)
    expect(s.tasks[0]!.name).toBe('Предмет №1')
    expect(s.tasks[0]!.combs).toEqual(['Медовые соты', 'Фруктовые соты'])
    expect(typeof s.tasks[0]!.id).toBe('string')
    expect(s.tasks[0]!.id.length).toBeGreaterThan(0)
  })
  it('updateTask меняет name/combs (с дедупом)', () => {
    const s = useBeesStore()
    s.addTask('A', ['Медовые соты'])
    const id = s.tasks[0]!.id
    s.updateTask(id, { name: 'B', combs: ['Фруктовые соты', 'Фруктовые соты'] })
    expect(s.tasks[0]!.name).toBe('B')
    expect(s.tasks[0]!.combs).toEqual(['Фруктовые соты'])
  })
  it('removeTask удаляет', () => {
    const s = useBeesStore()
    s.addTask('A', ['Медовые соты'])
    s.removeTask(s.tasks[0]!.id)
    expect(s.tasks).toHaveLength(0)
  })
  it('toggleTaskCollapsed переключает флаг', () => {
    const s = useBeesStore()
    s.addTask('A', ['Медовые соты'])
    const id = s.tasks[0]!.id
    s.toggleTaskCollapsed(id)
    expect(s.tasks[0]!.collapsed).toBe(true)
    s.toggleTaskCollapsed(id)
    expect(s.tasks[0]!.collapsed).toBe(false)
  })
  it('генерит разные id и персистит — перезагрузка читает задачи', () => {
    const s = useBeesStore()
    s.addTask('A', ['Медовые соты'])
    s.addTask('B', ['Фруктовые соты'])
    expect(s.tasks[0]!.id).not.toBe(s.tasks[1]!.id)
    // лёг ли список в storage
    expect(storage.get('bees.tasks', []).length).toBe(2)
    // новый стор после «перезагрузки» читает сохранённое
    setActivePinia(createPinia())
    const s2 = useBeesStore()
    expect(s2.tasks.map((t) => t.name)).toEqual(['A', 'B'])
  })
})

describe('экспорт/импорт + валидация', () => {
  it('exportData отдаёт склад и задачи', () => {
    const s = useBeesStore()
    s.toggleHave('Развитая')
    s.addTask('A', ['Медовые соты'])
    const e = s.exportData()
    expect(e.v).toBe(1)
    expect(e.have).toContain('Развитая')
    expect(e.tasks[0]!.name).toBe('A')
  })
  it('importData заменяет склад/задачи и отбрасывает мусор', () => {
    const s = useBeesStore()
    s.importData({
      have: ['Развитая', 'НесуществующаяПчела', 123],
      tasks: [
        { id: 'x', name: 'ok', combs: ['Медовые соты', 'НетТакойСоты'] },
        { id: 'bad', name: 'нет валидных сот', combs: ['НетТакойСоты'] },
        { nope: true },
      ],
    })
    expect([...s.have]).toEqual(['Развитая']) // мусорные id отброшены
    expect(s.tasks).toHaveLength(1)
    expect(s.tasks[0]!.combs).toEqual(['Медовые соты']) // неизвестная сота отброшена
  })
  it('битые задачи в localStorage не валят загрузку', () => {
    storage.set('bees.tasks', [
      { id: 'x' },
      'мусор',
      { id: 'y', name: 'n', combs: ['Медовые соты'] },
    ])
    setActivePinia(createPinia())
    const s = useBeesStore()
    expect(s.tasks).toHaveLength(1)
    expect(s.tasks[0]!.id).toBe('y')
  })
  it('битые invPrefs откатываются к дефолту', () => {
    storage.set('bees.invPrefs', { sort: 'ерунда', filter: 'чушь', collapsed: 'нея' })
    setActivePinia(createPinia())
    const ui = useBeesUiStore()
    expect(ui.invSort).toBe('name')
    expect(ui.invFilter).toBe('all')
    expect(ui.collapsedSources.size).toBe(0)
  })
})
