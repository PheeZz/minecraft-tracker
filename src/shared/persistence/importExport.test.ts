import { describe, it, expect } from 'vitest'
import { parseJsonFileText, safeKeys } from './importExport'

describe('parseJsonFileText', () => {
  it('парсит валидный JSON', () => {
    expect(parseJsonFileText('{"a":1}')).toEqual({ ok: true, data: { a: 1 } })
  })
  it('возвращает ошибку на битом JSON', () => {
    const r = parseJsonFileText('{не json')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(typeof r.error).toBe('string')
  })
})

describe('safeKeys', () => {
  it('отбрасывает опасные ключи и не загрязняет Object.prototype', () => {
    const obj = JSON.parse('{"__proto__":{"polluted":1},"constructor":1,"prototype":1,"ok":1}')
    expect(safeKeys(obj)).toEqual(['ok'])
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype.hasOwnProperty('polluted')).toBe(false)
  })
  it('возвращает обычные ключи как есть', () => {
    expect(safeKeys({ a: 1, b: 2 })).toEqual(['a', 'b'])
  })
})
