import { describe, it, expect } from 'vitest'
import { tierBuildList, tierDelta, unlocksAtTier } from './progression'

describe('tierBuildList', () => {
  it('tier 1 — всё по нулям (только алтарь, структуры нет)', () => {
    const result = tierBuildList(1)
    expect(result.bloodRunes).toBe(0)
    expect(result.upgradeSlots).toBe(0)
    expect(result.glowstone).toBe(0)
    expect(result.structural).toHaveLength(0)
  })

  it('tier 2 — 8 кровавых рун, 4 из них слоты апгрейда (угловые не слоты до T3)', () => {
    const result = tierBuildList(2)
    // bloodRunes = все позиции isBloodRune; upgradeSlots ⊂ bloodRunes
    expect(result.bloodRunes).toBe(8)
    expect(result.upgradeSlots).toBe(4)
  })

  it('tier 3 — 28 кровавых рун, все 28 апгрейдятся (угловые тоже стали слотами)', () => {
    const result = tierBuildList(3)
    expect(result.bloodRunes).toBe(28)
    expect(result.upgradeSlots).toBe(28)
  })

  it('tier 3 — кумулятивно содержит глоустоун-столбы', () => {
    const result = tierBuildList(3)
    expect(result.glowstone).toBeGreaterThan(0)
  })

  it('structural группирует прочие блоки по ref', () => {
    const result = tierBuildList(3)
    // В T3 есть булыжник (ref='') — должен быть в structural
    expect(result.structural.length).toBeGreaterThan(0)
    // Каждая группа имеет name_ru, ref, count > 0
    for (const s of result.structural) {
      expect(s.count).toBeGreaterThan(0)
      expect(typeof s.name_ru).toBe('string')
    }
  })

  it('tier 4 — содержит Большой кровавый кирпич в structural', () => {
    const result = tierBuildList(4)
    const bricks = result.structural.find((s) => s.ref === 'largeBloodStoneBrick')
    expect(bricks).toBeDefined()
    expect(bricks!.count).toBe(4)
  })
})

describe('tierDelta', () => {
  it('tier 1 — пустой список (ничего достраивать не нужно)', () => {
    const delta = tierDelta(1)
    expect(delta.bloodRunes).toBe(0)
    expect(delta.upgradeSlots).toBe(0)
    expect(delta.glowstone).toBe(0)
    expect(delta.structural).toHaveLength(0)
  })

  it('tier 2 = tierBuildList(2) - tierBuildList(1) (T1 всё нули)', () => {
    const delta = tierDelta(2)
    const full = tierBuildList(2)
    expect(delta.bloodRunes).toBe(full.bloodRunes)
    expect(delta.upgradeSlots).toBe(full.upgradeSlots)
  })

  it('tierDelta(3) = T3 − T2: +20 рун (28−8), +4 глоустоуна', () => {
    const d = tierDelta(3)
    // bloodRunes: T3=28, T2=8 → достроить 20 рун
    expect(d.bloodRunes).toBe(20)
    // glowstone: T3=4, T2=0 → +4
    expect(d.glowstone).toBe(4)
  })

  it('tierDelta(3): добавляются блоки к T2 (руны + глоустоун > 0)', () => {
    const d = tierDelta(3)
    expect(d.bloodRunes + d.glowstone).toBeGreaterThan(0)
  })

  it('структурные блоки в delta: count может быть 0 (нет новых), не должно быть отрицательных', () => {
    for (let tier = 2; tier <= 6; tier++) {
      const d = tierDelta(tier)
      expect(d.bloodRunes).toBeGreaterThanOrEqual(0)
      expect(d.upgradeSlots).toBeGreaterThanOrEqual(0)
      expect(d.glowstone).toBeGreaterThanOrEqual(0)
      for (const s of d.structural) {
        expect(s.count).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('unlocksAtTier', () => {
  it('tier 1 — орб Слабый кровавый шар', () => {
    const u = unlocksAtTier(1)
    expect(u.orb).not.toBeNull()
    expect(u.orb!.tier).toBe(1)
    expect(u.orb!.field).toBe('weakBloodOrb')
  })

  it('tier 3 — орб Кровавый шар мага', () => {
    const u = unlocksAtTier(3)
    expect(u.orb).not.toBeNull()
    expect(u.orb!.name_ru).toBe('Кровавый шар мага')
  })

  it('unlocksAtTier(3).recipes — содержит только алтарные рецепты с minTier === 3', () => {
    const u = unlocksAtTier(3)
    expect(u.recipes.length).toBeGreaterThan(0)
    for (const r of u.recipes) {
      expect(r.minTier).toBe(3)
      expect(r.source).toBe('altar')
    }
  })

  it('tier 7 (несуществующий) — orb null, recipes пусто', () => {
    const u = unlocksAtTier(7)
    expect(u.orb).toBeNull()
    expect(u.recipes).toHaveLength(0)
  })
})
