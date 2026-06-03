import { describe, it, expect } from 'vitest'
import { titleFor } from './index'

describe('titleFor', () => {
  it('деревья — ключевик впереди, бренд в хвосте', () => {
    expect(titleFor('trees')).toBe(
      'Деревья Forestry — схемы скрещивания · Катализатор бесконечности',
    )
  })
  it('пчёлы', () => {
    expect(titleFor('bees')).toBe(
      'Пчёлы Forestry — схемы скрещивания · Катализатор бесконечности',
    )
  })
  it('без трекера — общий фолбэк', () => {
    expect(titleFor(undefined)).toBe(
      'Селекция Forestry: пчёлы и деревья · Катализатор бесконечности',
    )
  })
})
