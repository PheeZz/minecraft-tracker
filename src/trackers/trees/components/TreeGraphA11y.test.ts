import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import TreeGraphA11y from './TreeGraphA11y.vue'

describe('TreeGraphA11y', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('рендерит доступный список узлов с aria-label у каждого', () => {
    const w = mount(TreeGraphA11y)
    const buttons = w.findAll('li[role="listitem"] button')
    expect(buttons.length).toBeGreaterThan(0)
    for (const b of buttons.slice(0, 5)) {
      expect(b.attributes('aria-label')).toBeTruthy()
    }
    // список помечен ролью и именем
    expect(w.find('ul[role="list"]').attributes('aria-label')).toContain('узлов')
  })

  it('эмитит select(id) при клике по узлу', async () => {
    const w = mount(TreeGraphA11y)
    const btn = w.find('li[role="listitem"] button')
    await btn.trigger('click')
    const ev = w.emitted('select')
    expect(ev).toBeTruthy()
    expect(typeof ev![0]![0]).toBe('string')
    expect((ev![0]![0] as string).length).toBeGreaterThan(0)
  })
})
