/** Тир дерева: 0 — из мира (без рецепта), 1..10 — выводятся скрещиванием. */
export type Tier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** Пара родителей для скрещивания. Первая пара — основной рецепт, остальные — альтернативы. */
export type ParentPair = readonly [string, string]

/** Сырое описание дерева в данных (до слияния плодов и стоимости посадки). */
export interface TreeSeed {
  id: string
  tier: Tier
  /** Рецепты скрещивания; отсутствует у базовых деревьев (tier 0). */
  parents?: readonly ParentPair[]
  /** Особое условие выращивания (биом, высота и т.п.). */
  cond?: string
}

/** Полное дерево после обогащения данными (плод, стоимость посадки). */
export interface Tree extends TreeSeed {
  /** Плод, если дерево его даёт. */
  fruit?: string
  /** Сколько саженцев нужно посадить рядом, чтобы дерево выросло (по умолчанию 1). */
  plant: number
}

/** Описание тира для легенды/заголовков. */
export interface TierInfo {
  id: Tier
  name: string
  color: string
}

/** Состояние прогресса по дереву: 0 — нет, 2 — получено/выведено. */
export type TreeState = 0 | 2

/** Карта прогресса: дерево → состояние. */
export type ProgressMap = Readonly<Record<string, TreeState>>

/** Инвентарь дерева как родителя: саженцы и пыльца (взаимозаменяемы при скрещивании). */
export interface Inventory {
  sap: number
  pol: number
}
