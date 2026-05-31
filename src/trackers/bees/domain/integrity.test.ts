/**
 * Проверка целостности данных пчёл (аналог verify:trees для деревьев).
 * Запуск: `npm run verify:bees`. Ловит структурные/ссылочные дефекты в
 * сгенерированном bees.data.ts, которые молча «маскируются» рантаймом
 * (например, makeDepth трактует неизвестного родителя как дикого).
 */
import { describe, it, expect } from 'vitest'
import { BEES, BEE_BY_ID } from '../data/bees.data'
import { COMBS, isComb } from './combs'
import { makeDepth } from './graph'

// Плейсхолдеры-родители, которые НЕ являются видами (берутся из мира/конфига).
const WILD_PARENTS = new Set(['дикая пчела (из улья)', 'особый вид (задаётся конфигом)'])

// ИЗВЕСТНЫЕ ПРОБЕЛЫ: эти родители упомянуты в рецептах, но отсутствуют в наборе
// видов (вероятно, недокачаны из исходных данных мода). makeDepth считает их
// «дикими», из-за чего план выведения для зависящих видов занижен. Чинить —
// в источнике bees/mockups/bees-data.js (добавить виды или поправить имена).
// Тест разрешает их как известные, но упадёт на ЛЮБОМ НОВОМ висячем родителе.
const KNOWN_MISSING_PARENTS = new Set([
  'Прорастающая', // ← Окаменелая, Испачканная, Созревающая
  'Процветающая', // ← Испачканная, Фруктовая
  'Влажная', // ← Кофейная
  'Грибная', // ← Кофейная
  'Бесстрастная', // ← Исступлённая
  'Золотоносная', // ← Алмазная ✦, TeElectrum
])

describe('целостность данных пчёл', () => {
  it('id уникальны, индекс полон', () => {
    expect(Object.keys(BEE_BY_ID).length).toBe(BEES.length)
    expect(new Set(BEES.map((b) => b.id)).size).toBe(BEES.length)
  })

  it('рецепты валидны (непустые родители, шанс 0<ch≤100)', () => {
    for (const b of BEES) {
      for (const r of b.parents) {
        expect(typeof r.p1, `${b.id}: p1`).toBe('string')
        expect(r.p1.length, `${b.id}: p1 непустой`).toBeGreaterThan(0)
        expect(r.p2.length, `${b.id}: p2 непустой`).toBeGreaterThan(0)
        expect(r.chance, `${b.id}: шанс>0`).toBeGreaterThan(0)
        expect(r.chance, `${b.id}: шанс≤100`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('ссылочная целостность: каждый родитель — известный вид, дикий плейсхолдер или известный пробел', () => {
    const offenders: string[] = []
    for (const b of BEES) {
      for (const r of b.parents) {
        for (const p of [r.p1, r.p2]) {
          const ok = p in BEE_BY_ID || WILD_PARENTS.has(p) || KNOWN_MISSING_PARENTS.has(p)
          if (!ok) offenders.push(`${b.id} → ${p}`)
        }
      }
    }
    // Любой НОВЫЙ висячий родитель (не из KNOWN_MISSING) — провал.
    expect(offenders, `новые висячие родители: ${offenders.join('; ')}`).toEqual([])
  })

  it('продукты валидны (имя непустое, 0≤pct≤100, тип product|specialty)', () => {
    for (const b of BEES) {
      for (const p of b.products) {
        expect(p.name.length, `${b.id}: имя продукта`).toBeGreaterThan(0)
        expect(p.pct, `${b.id}/${p.name}: pct≥0`).toBeGreaterThanOrEqual(0)
        expect(p.pct, `${b.id}/${p.name}: pct≤100`).toBeLessThanOrEqual(100)
        expect(['product', 'specialty']).toContain(p.kind)
      }
    }
  })

  it('индекс сот COMBS консистентен (ключи — соты, производители существуют)', () => {
    for (const [comb, producers] of Object.entries(COMBS)) {
      expect(isComb(comb), `${comb} — сота`).toBe(true)
      expect(producers.length, `${comb}: есть производитель`).toBeGreaterThan(0)
      for (const p of producers) {
        expect(p.bee in BEE_BY_ID, `${comb}: производитель ${p.bee} существует`).toBe(true)
      }
    }
  })

  it('глубина выведения конечна для всех видов (нет битых циклов)', () => {
    const depth = makeDepth(new Set())
    for (const b of BEES) {
      const d = depth(b.id)
      expect(Number.isFinite(d), `${b.id}: depth конечна`).toBe(true)
      expect(d, `${b.id}: depth≥0`).toBeGreaterThanOrEqual(0)
    }
  })
})
