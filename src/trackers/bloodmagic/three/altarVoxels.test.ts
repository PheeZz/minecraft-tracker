import { describe, it, expect } from 'vitest'
import { altarVoxels } from './altarVoxels'

describe('altarVoxels', () => {
  it('тир 1 содержит ровно 1 воксель — только алтарь в центре', () => {
    const voxels = altarVoxels(1)
    expect(voxels).toHaveLength(1)
    const altar = voxels[0]!
    expect(altar.x).toBe(0)
    expect(altar.y).toBe(0)
    expect(altar.z).toBe(0)
    expect(altar.label).toBe('Алтарь крови')
  })

  it('тир 2 содержит ровно 9 вокселей (8 рун + алтарь)', () => {
    const voxels = altarVoxels(2)
    expect(voxels).toHaveLength(9)
  })

  it('у рун-слотов апгрейда флаг upgrade=true, у обычных рун — false', () => {
    const voxels = altarVoxels(2)

    // Тир 2: руны с isUpgradeSlot=true — (0,-1,-1), (-1,-1,0), (1,-1,0), (0,-1,1)
    const upgradeVoxels = voxels.filter((v) => v.upgrade === true)
    const plainRunes = voxels.filter((v) => v.label === 'Кровавая руна' && v.upgrade === false)

    expect(upgradeVoxels.length).toBe(4)
    expect(plainRunes.length).toBe(4)
  })

  it('алтарь всегда присутствует в любом тире', () => {
    for (const tier of [1, 2, 3, 4, 5]) {
      const voxels = altarVoxels(tier)
      const altar = voxels.find((v) => v.label === 'Алтарь крови')
      expect(altar, `тир ${tier}: алтарь не найден`).toBeDefined()
    }
  })

  it('baseUrl корректно подставляется в пути текстур', () => {
    const voxels = altarVoxels(1, '/minecraft-tracker/')
    const altar = voxels[0]!
    expect(altar.textures.top).toContain('/minecraft-tracker/')
    expect(altar.textures.top).toContain('BloodAltar_Top.png')
  })
})
