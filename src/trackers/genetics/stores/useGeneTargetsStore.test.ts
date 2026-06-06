import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { storage } from '@/shared/persistence/storage'
import { useGeneTargetsStore } from './useGeneTargetsStore'

describe('useGeneTargetsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    storage.remove('genetics.targets')
  })

  it('addTarget создаёт цель и делает её активной', () => {
    const s = useGeneTargetsStore()
    const id = s.addTarget('Производственная')
    expect(s.targets.length).toBe(1)
    expect(s.activeId).toBe(id)
    expect(s.active?.name).toBe('Производственная')
  })

  it('setAllele задаёт и снимает значение', () => {
    const s = useGeneTargetsStore()
    const id = s.addTarget('Цель')
    s.setAllele(id, 'speed', 'Fast')
    expect(s.active?.alleles.speed).toBe('Fast')
    s.setAllele(id, 'speed', null)
    expect(s.active?.alleles.speed).toBeUndefined()
  })

  it('removeTarget удаляет и переназначает активную', () => {
    const s = useGeneTargetsStore()
    const a = s.addTarget('A')
    const b = s.addTarget('B')
    s.removeTarget(b)
    expect(s.targets.map((t) => t.id)).toEqual([a])
    expect(s.activeId).toBe(a)
  })

  it('import санитизирует мусор', () => {
    const s = useGeneTargetsStore()
    s.importData({
      v: 1,
      targets: [
        { id: 'x', name: 'Ok', alleles: { speed: 'Fast', bad: 42 } },
        { id: 5, name: 'нет id' },
        null,
      ],
      activeId: 'missing',
    })
    expect(s.targets.length).toBe(1)
    expect(s.active?.id).toBe('x')
    expect(s.active?.alleles).toEqual({ speed: 'Fast' })
  })
})
