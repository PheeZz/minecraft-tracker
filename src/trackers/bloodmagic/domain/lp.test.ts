import { describe, it, expect } from 'vitest'
import { maxDrainPerSecond, minOrbDurationSeconds, formatDuration, formatLP } from './lp'

describe('maxDrainPerSecond', () => {
  it('upkeep 20 тиков → 400 LP/сек', () => {
    expect(maxDrainPerSecond(20)).toBe(400)
  })

  it('upkeep 25 тиков → 500 LP/сек', () => {
    expect(maxDrainPerSecond(25)).toBe(500)
  })

  it('upkeep 0 → 0 LP/сек', () => {
    expect(maxDrainPerSecond(0)).toBe(0)
  })
})

describe('minOrbDurationSeconds', () => {
  it('орб 1 000 000 LP при upkeep 50 тиков → 1 000 000 / (50×20) = 1000 сек', () => {
    expect(minOrbDurationSeconds(1_000_000, 50)).toBe(1000)
  })

  it('upkeep 0 → Infinity', () => {
    expect(minOrbDurationSeconds(150_000, 0)).toBe(Infinity)
  })

  it('шар мага (150 000 LP) при upkeep 20 тиков → 150 000 / 400 = 375 сек', () => {
    expect(minOrbDurationSeconds(150_000, 20)).toBe(375)
  })
})

describe('formatDuration', () => {
  it('Infinity → «∞»', () => {
    expect(formatDuration(Infinity)).toBe('∞')
  })

  it('2500 сек → «41 мин» (41×60=2460, 2500-2460=40сек → «41 мин»)', () => {
    // 2500 / 60 = 41.67 → 41 мин
    expect(formatDuration(2500)).toBe('41 мин')
  })

  it('45 сек → «45 сек»', () => {
    expect(formatDuration(45)).toBe('45 сек')
  })

  it('3900 сек → «1 ч 5 мин»', () => {
    expect(formatDuration(3900)).toBe('1 ч 5 мин')
  })

  it('3600 сек → «1 ч»', () => {
    expect(formatDuration(3600)).toBe('1 ч')
  })

  it('0 сек → «0 сек»', () => {
    expect(formatDuration(0)).toBe('0 сек')
  })
})

describe('formatLP', () => {
  it('1 500 000 → строка с разделителями тысяч', () => {
    const result = formatLP(1_500_000)
    // ru-RU использует неразрывный пробел или обычный как разделитель тысяч
    expect(result.replace(/\s/g, ' ')).toBe('1 500 000')
  })

  it('500 → «500» без разделителей', () => {
    expect(formatLP(500)).toBe('500')
  })
})
