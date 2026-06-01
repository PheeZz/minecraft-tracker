import { describe, it, expect } from 'vitest'
import { parseTreesImport, TREES_SCHEMA_VERSION } from './migrate'

describe('parseTreesImport', () => {
  it('принимает текущую версию', () => {
    const payload = { v: TREES_SCHEMA_VERSION, progress: { a: 2 }, inventory: {} }
    const r = parseTreesImport(payload)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.progress).toEqual({ a: 2 })
  })
  it('отклоняет более новую версию', () => {
    expect(parseTreesImport({ v: 999, progress: {}, inventory: {} }).ok).toBe(false)
  })
  it('отклоняет не-объект', () => {
    expect(parseTreesImport(null).ok).toBe(false)
    expect(parseTreesImport('x').ok).toBe(false)
  })
  it('версия отсутствует → legacy, принимаем', () => {
    expect(parseTreesImport({ progress: { a: 2 }, inventory: {} }).ok).toBe(true)
  })
})
