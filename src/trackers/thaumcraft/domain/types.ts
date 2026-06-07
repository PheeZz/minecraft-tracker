/** Аспект Thaumcraft. Подпись в UI — латинский тег (label); RU/EN — в тултипе. */
export interface Aspect {
  tag: string
  mod: string
  label: string // латинский тег с заглавной (как в игре): Aqua, Praecantatio…
  nameRu: string
  nameEn: string
  color: string // #RRGGBB (для радужного — фолбэк-цвет)
  rainbow: boolean
  primal: boolean
  /** Два родительских аспекта (для составных) либо пусто (для праймалов). */
  components: readonly string[]
}

/** Исследование («свиток») Thaumcraft. */
export interface Research {
  key: string
  mod: string
  category: string
  /** Отображаемое имя: RU, иначе EN, иначе ключ. */
  name: string
  nameRu: string | null
  nameEn: string | null
  /** Требуемые аспекты для покупки свитка: тег → количество. */
  aspects: Readonly<Record<string, number>>
  /** Предпосылки в дереве исследований (ключи). */
  parents: readonly string[]
  displayColumn: number
  displayRow: number
  complexity: number
  flags: readonly string[]
  description: string | null
}

/** Ссылка на предмет/ингредиент: отображаемые имена (RU с фолбэком на EN/raw). */
export interface ItemRef {
  ru: string
  en: string
  /** Путь к текстуре под public/thaumcraft/tex/ (если нашлась по имени/ref). */
  icon?: string
}

export type RecipeType =
  | 'crucible'
  | 'arcane'
  | 'arcane_shapeless'
  | 'infusion'
  | 'infusion_enchantment'

/** Рецепт Thaumcraft (тигель/аркан/инфузия). aspects — стоимость вис/эссенции. */
export interface Recipe {
  research: string | null
  type: RecipeType
  mod: string
  output: ItemRef
  /** Стоимость аспектов (вис) или null, если считается в рантайме. */
  aspects: Readonly<Record<string, number>> | null
  // arcane / arcane_shapeless
  shape?: readonly string[]
  key?: Readonly<Record<string, ItemRef>>
  inputs?: readonly ItemRef[]
  // crucible
  input?: ItemRef
  // infusion
  central?: ItemRef
  components?: readonly ItemRef[]
  instability?: number
}

/** Источник аспектов при сканировании: предмет/блок (object) или сущность. */
export interface AspectSource {
  /** Отображаемое имя субъекта (предмет/руда/моб). */
  name: string
  mod: string
  kind: 'object' | 'entity'
  aspects: Readonly<Record<string, number>>
  /** Путь к текстуре под public/thaumcraft/tex/ (если нашлась). */
  icon?: string
}

/** Справочники. */
export interface SmeltingBonus {
  input: string
  output: ItemRef
  mod: string
}
export interface LootBag {
  item: ItemRef
  weight: number
  rarities: readonly string[]
  mod: string
}
export interface ToolMaterial {
  name: string
  mod: string
  harvestLevel: number
  durability: number
  efficiency: number
  damage: number
  enchantability: number
}
export interface ArmorMaterial {
  name: string
  mod: string
  durabilityFactor: number
  /** Снижение урона по слотам: шлем, нагрудник, поножи, ботинки. */
  damageReduction: readonly number[]
  enchantability: number
}
export interface WandCap {
  tag: string
  visDiscount: number
  craftCost: number
}
export interface WandRod {
  tag: string
  visCapacity: number
  craftCost: number
}
