/** Источник вида: Forestry, ExtraBees, MagicBees. */
export type BeeSource = 'F' | 'E' | 'M'

/** Рецепт скрещивания: два родителя (RU-имена) и базовый шанс мутации, %. */
export interface BeeRecipe {
  p1: string
  p2: string
  chance: number
}

/** Продукт пчелы: сота/предмет, шанс выпадения (%), тип. */
export interface BeeProduct {
  name: string
  pct: number
  kind: 'product' | 'specialty'
}

/** Пчела. id — RU-имя (ключ), en — английское. parents пуст у диких видов. */
export interface Bee {
  id: string
  en: string
  source: BeeSource
  parents: BeeRecipe[]
  products: BeeProduct[]
}

/** Цвета для тинтинга текстуры (primary/secondary) + опц. вариант тела пчелы. */
export interface TintColor {
  p: string
  s: string
  src?: string
  /** Вариант набора текстур тела (например, 'skulking', 'doctoral'). */
  body?: string
}
