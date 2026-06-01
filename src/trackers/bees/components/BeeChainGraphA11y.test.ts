import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import BeeChainGraphA11y from './BeeChainGraphA11y.vue'
import { useBeesUiStore } from '../stores/useBeesUiStore'

describe('BeeChainGraphA11y', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('без выбранной цели — список пуст', () => {
    const w = mount(BeeChainGraphA11y)
    expect(w.findAll('li[role="listitem"] button').length).toBe(0)
  })

  it('с целью — рендерит узлы цепочки и эмитит select при клике', async () => {
    const ui = useBeesUiStore()
    ui.setTarget('Развитая') // у «Развитой» есть рецепт-родители
    const w = mount(BeeChainGraphA11y)
    const buttons = w.findAll('li[role="listitem"] button')
    expect(buttons.length).toBeGreaterThan(0)
    // цель присутствует и помечена aria-current
    const current = w.find('button[aria-current="true"]')
    expect(current.exists()).toBe(true)
    await buttons[0]!.trigger('click')
    const ev = w.emitted('select')
    expect(ev).toBeTruthy()
    expect(typeof ev![0]![0]).toBe('string')
  })
})
