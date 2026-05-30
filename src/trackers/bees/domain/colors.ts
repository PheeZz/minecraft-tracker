import { BEE_COLOR } from '../data/beeColors'
import { COMB_COLOR } from '../data/combColors'
import type { TintColor } from './types'

/** Цвет тинтинга соты по её имени (ru/en), если известен. */
export function combColor(name: string): TintColor | undefined {
  return COMB_COLOR[name]
}

/** Цвет тинтинга пчелы по имени (ru/en), если известен. */
export function beeColor(name: string): TintColor | undefined {
  return BEE_COLOR[name]
}

/** Осветлённый вариант hex-цвета (для фона ноды графа). Перенос из chain-макета. */
export function pale(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const r = n >> 16
  const g = (n >> 8) & 255
  const b = n & 255
  const m = (c: number): number => Math.round(c + (255 - c) * 0.8)
  return `rgb(${m(r)},${m(g)},${m(b)})`
}
