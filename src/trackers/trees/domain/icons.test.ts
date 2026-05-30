import { describe, it, expect } from 'vitest'
import { TREES, STARTING_SAPLINGS } from '../data/trees.data'
import { treeIcon } from './icons'

describe('иконки деревьев', () => {
  it('все деревья кроме ванильных (стартовых) имеют иконку', () => {
    for (const t of TREES) {
      if (STARTING_SAPLINGS.has(t.id)) continue // ванильные — без ассета
      expect(treeIcon(t.id), `нет иконки у «${t.id}»`).toBeDefined()
    }
  })

  it('ванильные стартовые деревья без иконки', () => {
    for (const id of STARTING_SAPLINGS) expect(treeIcon(id)).toBeUndefined()
  })

  it('forestry-иконка ссылается на PNG, extratrees — на шаблон+цвет', () => {
    const forestry = treeIcon('Сакура') // Hill Cherry — Forestry PNG
    expect(forestry?.kind).toBe('forestry')
    if (forestry?.kind === 'forestry') expect(forestry.file).toMatch(/\.png$/)

    const extra = treeIcon('Яблоня садовая') // ExtraTrees — тонирование
    expect(extra?.kind).toBe('extratrees')
    if (extra?.kind === 'extratrees') {
      expect(extra.tpl).toBeTruthy()
      expect(extra.c).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
