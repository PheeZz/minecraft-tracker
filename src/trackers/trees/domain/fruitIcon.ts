import { FRUIT_ICON } from '../data/fruitIcons.data'

const BASE = `${import.meta.env.BASE_URL}trees/fruits/`

/**
 * URL готовой иконки плода по его названию (RU), либо undefined.
 * Плоды — цветные 16×16 спрайты, рисуются как есть (без тонирования).
 */
export function fruitIconUrl(fruit: string | undefined): string | undefined {
  if (!fruit) return undefined
  const path = FRUIT_ICON[fruit]
  return path ? BASE + encodeURI(path) : undefined
}
