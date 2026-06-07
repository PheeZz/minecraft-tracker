import { describe, it, expect, vi } from 'vitest'
import { buildGeneticsTour } from './geneticsTour'

describe('buildGeneticsTour', () => {
  it('строит шаги для всех вкладок раздела', () => {
    const steps = buildGeneticsTour({ setPanel: () => {} })
    expect(steps.length).toBe(5)
  })

  it('все шаги имеют element/title/text', () => {
    const steps = buildGeneticsTour({ setPanel: () => {} })
    for (const s of steps) {
      expect(s.element).toBeTruthy()
      expect(s.title.length).toBeGreaterThan(0)
      expect(s.text.length).toBeGreaterThan(0)
    }
  })

  it('before() панельных шагов переключает вкладку', async () => {
    const setPanel = vi.fn()
    const steps = buildGeneticsTour({ setPanel })
    await steps[1]!.before?.()
    await steps[2]!.before?.()
    await steps[3]!.before?.()
    expect(setPanel).toHaveBeenCalledWith('collection')
    expect(setPanel).toHaveBeenCalledWith('builder')
    expect(setPanel).toHaveBeenCalledWith('pipeline')
  })
})
