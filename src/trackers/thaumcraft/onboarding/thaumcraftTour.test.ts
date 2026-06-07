import { describe, it, expect, vi } from 'vitest'
import { buildThaumcraftTour } from './thaumcraftTour'

describe('buildThaumcraftTour', () => {
  it('строит шаги по всем вкладкам раздела', () => {
    const steps = buildThaumcraftTour({ setPanel: () => {} })
    expect(steps.length).toBe(6)
  })

  it('все шаги имеют element/title/text', () => {
    const steps = buildThaumcraftTour({ setPanel: () => {} })
    for (const s of steps) {
      expect(s.element).toBeTruthy()
      expect(s.title.length).toBeGreaterThan(0)
      expect(s.text.length).toBeGreaterThan(0)
    }
  })

  it('before() панельных шагов переключает вкладки', async () => {
    const setPanel = vi.fn()
    const steps = buildThaumcraftTour({ setPanel })
    for (const s of steps) await s.before?.()
    for (const p of ['scrolls', 'aspects', 'recipes', 'scans', 'reference']) {
      expect(setPanel).toHaveBeenCalledWith(p)
    }
  })
})
