import { describe, it, expect } from 'vitest'
import { TRACKERS } from './types'

describe('TRACKERS', () => {
  it('содержит оба трекера с уникальными id и путями', () => {
    const ids = TRACKERS.map((t) => t.id)
    expect(ids).toEqual(['trees', 'bees'])
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of TRACKERS) {
      expect(t.path).toBe(`/${t.id}`)
    }
  })
})
