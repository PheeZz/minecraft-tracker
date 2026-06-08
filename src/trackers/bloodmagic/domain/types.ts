// Доменные типы трекера Blood Magic (BM + BloodArsenal аддон).
// Сгенерированные данные в ../data/*.data.ts соответствуют этим контрактам.

export type RuneKind = 'water' | 'fire' | 'earth' | 'air' | 'dusk' | 'blank'

// уровень активационного кристалла из данных: 1=Weak, 2=Awakened, 10=Master/Transcendent
// (точные имена кристаллов выверить и маппить в панели; не угадывать здесь)
export type CrystalLevel = number

export interface BloodOrb {
  field: string
  name_en: string
  name_ru: string
  capacity_LP: number
  tier: number
  consumptionRate: number
}

export interface AltarBlock {
  x: number
  y: number
  z: number
  ref: string
  /** Числовой мета-вариант блока (0 по умолчанию) */
  meta: number
  name_ru: string
  isBloodRune: boolean
  isUpgradeSlot: boolean
  /** true когда исходный мета был 'placement' — позиция без конкретного варианта блока */
  isPlacement: boolean
}

export interface AltarTier {
  tier: number
  runeCount: number
  upgradeSlots: number
  note?: string
  components: readonly AltarBlock[]
}

export interface RitualRune {
  x: number
  y: number
  z: number
  rune: RuneKind
}

export interface Ritual {
  key: string
  name_en: string
  /** Локализованное название (fallback = name_en, оверрайд из i18n/rituals-ru.json) */
  name_ru: string
  /** Краткое описание назначения (оверрайд из i18n/rituals-ru.json, иначе '') */
  purpose_ru: string
  effect: string
  crystalLevel: CrystalLevel
  activation_LP: number
  upkeep_LP_per_tick: number
  /** Интервал обновления эффекта в тиках (дефолт 20, точная выверка — отдельная задача) */
  refreshTicks: number
  runeCount: number
  runeBreakdown: Partial<Record<RuneKind, number>>
  description_en: string
  guidebookKey: string
  layout: readonly RitualRune[]
}

export interface Sigil {
  field: string
  class: string
  name_en: string
  name_ru: string
  cost_LP_per_use: number | null
  kind: string
}

export type RecipeSource = 'altar' | 'alchemy' | 'crafting' | 'binding' | 'summoning'

export interface ItemRef {
  ref?: string
  vanilla?: string
  name_en: string
  name_ru: string
  icon?: string
}

export interface Recipe {
  source: RecipeSource
  addon?: 'bloodarsenal'
  output: ItemRef
  inputs: readonly ItemRef[]
  minTier?: number
  lp?: number
  /** Дополнительные поля специфичные для источника (consumptionRate, drainRate и т.д.) */
  meta?: Record<string, unknown>
}
