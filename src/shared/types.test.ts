import { describe, it, expect } from 'vitest'
import { TRACKERS } from './types'

describe('TRACKERS', () => {
  it('содержит трекеры с уникальными id и путями', () => {
    const ids = TRACKERS.map((t) => t.id)
    expect(ids).toEqual(['trees', 'bees', 'genetics', 'thaumcraft', 'bloodmagic'])
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of TRACKERS) {
      expect(t.path).toBe(`/${t.id}`)
    }
  })
})
