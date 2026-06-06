import { describe, it, expect } from 'vitest'
import { PIPELINES } from './pipelines'

describe('PIPELINES', () => {
  it('содержит оба тулчейна', () => {
    expect(PIPELINES.map((p) => p.id)).toEqual(['binnie', 'gendustry'])
  })

  it('у каждого шага заполнены машина, входы, продукт и гайд', () => {
    for (const p of PIPELINES) {
      expect(p.steps.length).toBeGreaterThan(0)
      for (const s of p.steps) {
        expect(s.machine.ru).toBeTruthy()
        expect(s.machine.en).toBeTruthy()
        expect(s.inputs.length).toBeGreaterThan(0)
        expect(s.outMain).toBeTruthy()
        expect(s.guide.length).toBeGreaterThan(10)
      }
    }
  })

  it('у каждой вспомогательной машины заполнены имя и заметка', () => {
    for (const p of PIPELINES) {
      expect(p.aux.length).toBeGreaterThan(0)
      for (const a of p.aux) {
        expect(a.machine.ru).toBeTruthy()
        expect(a.machine.en).toBeTruthy()
        expect(a.note).toBeTruthy()
      }
    }
  })

  it('у каждого входа есть ru и en', () => {
    for (const p of PIPELINES) {
      for (const s of p.steps) {
        for (const inp of s.inputs) {
          expect(inp.ru).toBeTruthy()
          expect(inp.en).toBeTruthy()
        }
      }
    }
  })
})
