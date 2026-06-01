import { describe, it, expect } from 'vitest'
import { parseJsonFileText } from './importExport'

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
