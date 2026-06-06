/** Мод-источник аллеля (для пометки/фильтра по области). */
export type GeneMod = 'Forestry' | 'ExtraBees' | 'MagicBees'

/** Значение гена (аллель). mod задан только у аддонных аллелей. */
export interface AlleleDef {
  en: string
  ru: string
  mod?: GeneMod
}

/** Описание признака (хромосомы) и его шкалы значений. */
export interface TraitDef {
  key: string
  en: string
  ru: string
  /** Короткое «что даёт». */
  desc: string
  alleles: AlleleDef[]
}

/** Один ген коллекции = признак + значение. */
export interface Gene {
  trait: string
  en: string
  ru: string
  mod?: GeneMod
}

/** Стабильный ключ гена для множеств/персиста. */
export function geneKey(trait: string, en: string): string {
  return `${trait}|${en}`
}

/**
 * Полный набор генов (универсум) по признакам.
 * allowMods — если задан, аддонные аллели вне набора отсекаются (базовые без mod всегда видны).
 */
export function geneUniverse(
  traits: readonly TraitDef[],
  allowMods?: ReadonlySet<GeneMod>,
): Gene[] {
  const out: Gene[] = []
  for (const t of traits) {
    for (const a of t.alleles) {
      if (a.mod && allowMods && !allowMods.has(a.mod)) continue
      out.push({ trait: t.key, en: a.en, ru: a.ru, ...(a.mod ? { mod: a.mod } : {}) })
    }
  }
  return out
}

/** Полнота по признаку относительно собранных ключей. */
export function traitCompletion(
  trait: TraitDef,
  have: ReadonlySet<string>,
): { have: number; total: number; pct: number } {
  const total = trait.alleles.length
  let h = 0
  for (const a of trait.alleles) if (have.has(geneKey(trait.key, a.en))) h++
  return { have: h, total, pct: total ? Math.round((h / total) * 100) : 0 }
}

/** Суммарная полнота коллекции по универсуму. */
export function collectionTotals(
  traits: readonly TraitDef[],
  have: ReadonlySet<string>,
): { have: number; total: number } {
  const uni = geneUniverse(traits)
  let h = 0
  for (const g of uni) if (have.has(geneKey(g.trait, g.en))) h++
  return { have: h, total: uni.length }
}
