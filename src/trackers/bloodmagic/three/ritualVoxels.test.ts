import { describe, it, expect } from 'vitest'
import { ritualVoxels } from './ritualVoxels'
import type { Ritual } from '../domain/types'

/** Минимальный мок-ритуал для тестов. */
function makeRitual(overrides: Partial<Ritual> = {}): Ritual {
  return {
    key: 'test',
    name_en: 'Test Ritual',
    name_ru: 'Тестовый ритуал',
    purpose_ru: '',
    effect: 'TestEffect',
    crystalLevel: 1,
    activation_LP: 1000,
    upkeep_LP_per_tick: 10,
    refreshTicks: 20,
    runeCount: 5,
    runeBreakdown: { water: 4 },
    description_en: '',
    guidebookKey: '',
    layout: [
      { x: -1, y: 0, z: 1, rune: 'water' },
      { x: -1, y: 0, z: -1, rune: 'water' },
      { x: 1, y: 0, z: -1, rune: 'water' },
      { x: 1, y: 0, z: 1, rune: 'water' },
    ],
    ...overrides,
  }
}

describe('ritualVoxels', () => {
  it('добавляет мастер-камень если (0,0,0) не в layout', () => {
    const voxels = ritualVoxels(makeRitual())
    const master = voxels.find((v) => v.x === 0 && v.y === 0 && v.z === 0)
    expect(master).toBeDefined()
    expect(master!.label).toBe('Мастер-камень')
  })

  it('число вокселей = layout.length + 1 (мастер) когда (0,0,0) не в layout', () => {
    const ritual = makeRitual()
    const voxels = ritualVoxels(ritual)
    expect(voxels).toHaveLength(ritual.layout.length + 1)
  })

  it('не добавляет лишний мастер-камень если (0,0,0) уже есть в layout', () => {
    const ritual = makeRitual({
      layout: [
        { x: 0, y: 0, z: 0, rune: 'blank' },
        { x: 1, y: 0, z: 0, rune: 'water' },
      ],
    })
    const voxels = ritualVoxels(ritual)
    expect(voxels).toHaveLength(2)
  })

  it('текстура рунного камня воды содержит WaterRitualStone.png', () => {
    const voxels = ritualVoxels(makeRitual())
    const waterBlock = voxels.find((v) => v.label === 'Камень воды')
    expect(waterBlock).toBeDefined()
    expect(waterBlock!.textures.top).toContain('WaterRitualStone.png')
  })

  it('все типы рун получают корректные текстуры', () => {
    const ritual = makeRitual({
      layout: [
        { x: 1, y: 0, z: 0, rune: 'water' },
        { x: 2, y: 0, z: 0, rune: 'fire' },
        { x: 3, y: 0, z: 0, rune: 'earth' },
        { x: 4, y: 0, z: 0, rune: 'air' },
        { x: 5, y: 0, z: 0, rune: 'dusk' },
        { x: 6, y: 0, z: 0, rune: 'blank' },
      ],
    })
    const voxels = ritualVoxels(ritual)
    const byLabel = (label: string) => voxels.find((v) => v.label === label)

    expect(byLabel('Камень воды')!.textures.top).toContain('WaterRitualStone.png')
    expect(byLabel('Камень огня')!.textures.top).toContain('FireRitualStone.png')
    expect(byLabel('Камень земли')!.textures.top).toContain('EarthRitualStone.png')
    expect(byLabel('Камень воздуха')!.textures.top).toContain('AirRitualStone.png')
    expect(byLabel('Камень сумрака')!.textures.top).toContain('DuskRitualStone.png')
    expect(byLabel('Ритуальный камень')!.textures.top).toContain('RitualStone.png')
  })

  it('baseUrl прокидывается в пути текстур', () => {
    const voxels = ritualVoxels(makeRitual(), '/minecraft-tracker/')
    const master = voxels.find((v) => v.label === 'Мастер-камень')
    expect(master!.textures.top).toContain('/minecraft-tracker/')
  })

  it('пустой layout — только мастер-камень', () => {
    const ritual = makeRitual({ layout: [] })
    const voxels = ritualVoxels(ritual)
    expect(voxels).toHaveLength(1)
    expect(voxels[0]!.label).toBe('Мастер-камень')
  })
})
