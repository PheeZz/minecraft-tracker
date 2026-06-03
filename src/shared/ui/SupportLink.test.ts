import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SupportLink from './SupportLink.vue'

describe('SupportLink', () => {
  it('ведёт на DonationAlerts, открывается в новой вкладке безопасно', () => {
    const w = mount(SupportLink)
    const a = w.get('a')
    expect(a.attributes('href')).toBe('https://www.donationalerts.com/r/pheezz')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toContain('noopener')
    expect(a.attributes('rel')).toContain('noreferrer')
  })

  it('имеет понятную текстовую альтернативу и иконку-сердце', () => {
    const w = mount(SupportLink)
    const a = w.get('a')
    expect(a.attributes('aria-label')).toContain('DonationAlerts')
    expect(a.text()).toContain('Поддержать')
    expect(a.html()).toContain('<svg')
  })
})
