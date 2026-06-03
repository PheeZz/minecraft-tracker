import { describe, it, expect } from 'vitest'
import { ICONS } from './icons'

describe('реестр иконок', () => {
  it('содержит heart как валидный inline-SVG', () => {
    expect(ICONS).toHaveProperty('heart')
    expect(ICONS.heart).toContain('<svg')
    expect(ICONS.heart).toContain('</svg>')
  })
})
