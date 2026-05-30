import { beforeEach, describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { storage } from '@/shared/persistence/storage'
import { useBeesStore } from './useBeesStore'

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
    s.selectComb('Медовые соты')
    expect(s.mode).toBe('comb')
    expect(s.curComb).toBe('Медовые соты')
    expect(s.curTarget).toBe(s.producersOf('Медовые соты')[0]!.bee)
  })
  it('producersOf несуществующей соты — пустой массив, selectComb → curTarget null', () => {
    const s = useBeesStore()
    expect(s.producersOf('нет такой соты')).toEqual([])
    s.selectComb('нет такой соты')
    expect(s.curTarget).toBeNull()
  })
  it('selectBee переключает режим', () => {
    const s = useBeesStore()
    s.selectBee('Знатная')
    expect(s.mode).toBe('bee')
    expect(s.curComb).toBeNull()
    expect(s.curTarget).toBe('Знатная')
  })
})
