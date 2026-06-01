import { describe, it, expect } from 'vitest'
import { escapeHtml } from './escapeHtml'

describe('escapeHtml', () => {
  it('экранирует спецсимволы', () => {
    expect(escapeHtml('<b>"x" & \'y\'')).toBe('&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;')
  })
  it('пропускает обычный текст', () => {
    expect(escapeHtml('Дуб 2×2')).toBe('Дуб 2×2')
  })
  it('экранирует backtick', () => {
    expect(escapeHtml('a`b')).toBe('a&#96;b')
  })
})
