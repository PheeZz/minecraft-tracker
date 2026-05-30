import { BEES } from '../data/bees.data'
import type { BeeSource } from './types'

/** Сота ли это (по имени). Перенос из chain-макета. */
export const isComb = (name: string): boolean => /сот/i.test(name)

/** Множество реальных (выводимых/диких) видов — для отсечения «диких родителей». */
export const REAL: ReadonlySet<string> = new Set(BEES.map((b) => b.id))

/** Производитель соты. */
export interface CombProducer {
  bee: string
  pct: number
  kind: 'product' | 'specialty'
  src: BeeSource
}

/** Индекс: сота → её производители. */
export const COMBS: Readonly<Record<string, CombProducer[]>> = (() => {
  const out: Record<string, CombProducer[]> = {}
  for (const b of BEES) {
    for (const p of b.products) {
      if (!isComb(p.name)) continue
      ;(out[p.name] ??= []).push({ bee: b.id, pct: p.pct, kind: p.kind, src: b.source })
    }
  }
  return out
})()

/** Имена сот, отсортированные: сначала редкие (меньше источников), потом по алфавиту. */
export const COMB_NAMES: readonly string[] = Object.keys(COMBS).sort(
  (a, b) => COMBS[a]!.length - COMBS[b]!.length || a.localeCompare(b, 'ru'),
)

/** Короткое имя соты (без хвоста « соты»). */
export const shortComb = (name: string): string => name.replace(/ соты$/, '')
