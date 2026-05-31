import { describe, it, expect } from 'vitest'
import { buildTreesTour } from './treesTour'

const graphStub = {
  tourBestId: () => null as string | null,
  tourSpotlight: async () => {},
}

describe('buildTreesTour', () => {
  it('без доступной ноды шаг «лучший выбор» пропускается', () => {
    const steps = buildTreesTour({ ...graphStub, tourBestId: () => null })
    expect(steps.some((s) => s.title.includes('Лучший'))).toBe(false)
  })
  it('с доступной нодой шаг «лучший выбор» присутствует', () => {
    const steps = buildTreesTour({ ...graphStub, tourBestId: () => 'Дуб' })
    expect(steps.some((s) => s.title.includes('Лучший'))).toBe(true)
  })
  it('все шаги имеют element/title/text', () => {
    const steps = buildTreesTour({ ...graphStub, tourBestId: () => 'Дуб' })
    for (const s of steps) {
      expect(s.element).toBeTruthy()
      expect(s.title.length).toBeGreaterThan(0)
      expect(s.text.length).toBeGreaterThan(0)
    }
  })
})
