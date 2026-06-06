import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGenesStore } from './useGenesStore'
import { storage } from '@/shared/persistence/storage'

describe('useGenesStore', () => {
  beforeEach(() => {
    storage.remove('genetics.genes')
    setActivePinia(createPinia())
  })

  it('toggle добавляет и убирает ген', () => {
    const s = useGenesStore()
    expect(s.has('speed', 'Fast')).toBe(false)
    s.toggle('speed', 'Fast')
    expect(s.has('speed', 'Fast')).toBe(true)
    s.toggle('speed', 'Fast')
    expect(s.has('speed', 'Fast')).toBe(false)
  })

  it('count отражает число собранных', () => {
    const s = useGenesStore()
    s.toggle('speed', 'Fast')
    s.toggle('lifespan', 'Shortest')
    expect(s.count).toBe(2)
  })

  it('export/import восстанавливают набор', () => {
    const s = useGenesStore()
    s.toggle('speed', 'Fast')
    const data = s.exportData()
    s.clear()
    expect(s.count).toBe(0)
    s.importData(data)
    expect(s.has('speed', 'Fast')).toBe(true)
  })

  it('import отбрасывает мусор', () => {
    const s = useGenesStore()
    s.importData({ v: 1, genes: ['speed|Fast', 42, null, 'bad'] as unknown as string[] })
    expect(s.count).toBe(2)
  })
})
