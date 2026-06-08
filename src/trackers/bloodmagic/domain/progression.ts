// Доменные расчёты прогрессии алтаря: состав структуры по тирам и что разблокируется.
// Чистые функции без сайд-эффектов — данные только из altar.data / orbs / recipes.
import { ALTAR_TIERS } from '../data/altar.data'
import { ORBS } from '../data/orbs.data'
import { RECIPES } from '../data/recipes.data'
import type { AltarBlock, BloodOrb, Recipe } from './types'

/** Агрегированный список строительных блоков для тира. */
export interface BuildList {
  /** Всего кровавых рун (isBloodRune) — физические блоки, которые ставит игрок. */
  bloodRunes: number
  /**
   * Из них апгрейдятся (isUpgradeSlot) — ПОДМНОЖЕСТВО bloodRunes, не отдельные блоки.
   * Любую руну-слот можно заменить на руну апгрейда. До T3 угловые руны не слоты
   * (данные: T2 = 4 из 8 — подтверждено исходником мода и вики Sanguine Scientium).
   */
  upgradeSlots: number
  /** Глоустоун-столбы (isPlacement). */
  glowstone: number
  /** Прочие структурные блоки, сгруппированные по ref. */
  structural: { ref: string; name_ru: string; count: number }[]
}

/** Пустой BuildList — возвращается для T1 и при расчёте дельты нулевых тиров. */
const EMPTY_BUILD_LIST: BuildList = {
  bloodRunes: 0,
  upgradeSlots: 0,
  glowstone: 0,
  structural: [],
}

/** Группирует структурные блоки (не рунные и не placement) по ref с суммарным счётчиком. */
function groupStructural(blocks: readonly AltarBlock[]): BuildList['structural'] {
  const counts = new Map<string, { name_ru: string; count: number }>()
  for (const b of blocks) {
    if (b.isBloodRune || b.isPlacement) continue
    const entry = counts.get(b.ref) ?? { name_ru: b.name_ru, count: 0 }
    entry.count += 1
    counts.set(b.ref, entry)
  }
  return [...counts.entries()].map(([ref, { name_ru, count }]) => ({ ref, name_ru, count }))
}

/** Агрегирует компоненты тира в BuildList. */
function aggregateComponents(blocks: readonly AltarBlock[]): BuildList {
  let bloodRunes = 0
  let upgradeSlots = 0
  let glowstone = 0

  for (const b of blocks) {
    if (b.isPlacement) {
      glowstone += 1
    } else if (b.isBloodRune) {
      bloodRunes += 1
      if (b.isUpgradeSlot) upgradeSlots += 1 // слот — подмножество рун, не отдельный блок
    }
  }

  return { bloodRunes, upgradeSlots, glowstone, structural: groupStructural(blocks) }
}

/** Вычитает BuildList prev из cur; счётчики не могут быть отрицательными. */
function subtractBuildList(cur: BuildList, prev: BuildList): BuildList {
  const structural: BuildList['structural'] = []

  // Объединяем все ref из обеих сторон
  const allRefs = new Set([
    ...cur.structural.map((s) => s.ref),
    ...prev.structural.map((s) => s.ref),
  ])

  for (const ref of allRefs) {
    const curEntry = cur.structural.find((s) => s.ref === ref)
    const prevEntry = prev.structural.find((s) => s.ref === ref)
    const count = (curEntry?.count ?? 0) - (prevEntry?.count ?? 0)
    if (count > 0) {
      structural.push({ ref, name_ru: curEntry?.name_ru ?? prevEntry!.name_ru, count })
    }
  }

  return {
    bloodRunes: Math.max(0, cur.bloodRunes - prev.bloodRunes),
    upgradeSlots: Math.max(0, cur.upgradeSlots - prev.upgradeSlots),
    glowstone: Math.max(0, cur.glowstone - prev.glowstone),
    structural,
  }
}

/**
 * Полный список строительных блоков тира N (кумулятивно — вся структура до тира N).
 * Для tier 1 возвращает пустой список (алтарь один, структуры нет).
 */
export function tierBuildList(tier: number): BuildList {
  const tierData = ALTAR_TIERS.find((t) => t.tier === tier)
  if (!tierData || tierData.components.length === 0) return EMPTY_BUILD_LIST
  return aggregateComponents(tierData.components)
}

/**
 * Разница между тиром N и тиром N−1 — что нужно ДОСТРОИТЬ.
 * Для tier 1 возвращает пустой список.
 */
export function tierDelta(tier: number): BuildList {
  if (tier <= 1) return EMPTY_BUILD_LIST
  const cur = tierBuildList(tier)
  const prev = tierBuildList(tier - 1)
  return subtractBuildList(cur, prev)
}

/** Что разблокируется на тире N: орб этого тира и алтарные рецепты с minTier === N. */
export function unlocksAtTier(tier: number): { orb: BloodOrb | null; recipes: Recipe[] } {
  const orb = ORBS.find((o) => o.tier === tier) ?? null
  const recipes = RECIPES.filter((r) => r.source === 'altar' && r.minTier === tier)
  return { orb, recipes }
}
