import type { Ritual, RuneKind } from '../domain/types'
import type { VoxelBlock, VoxelTextures } from './voxelTypes'

const BM = 'bloodmagic/blocks/alchemicalwizardry/'

/** Русские имена типов рунных камней для тултипов. */
const RUNE_LABELS: Record<RuneKind, string> = {
  water: 'Камень воды',
  fire: 'Камень огня',
  earth: 'Камень земли',
  air: 'Камень воздуха',
  dusk: 'Камень сумрака',
  blank: 'Ритуальный камень',
}

/** Имена файлов текстур для каждого типа руны. */
const RUNE_TEXTURES: Record<RuneKind, string> = {
  water: 'WaterRitualStone.png',
  fire: 'FireRitualStone.png',
  earth: 'EarthRitualStone.png',
  air: 'AirRitualStone.png',
  dusk: 'DuskRitualStone.png',
  blank: 'RitualStone.png',
}

function runeTextures(rune: RuneKind, baseUrl: string): VoxelTextures {
  const path = `${baseUrl}${BM}${RUNE_TEXTURES[rune]}`
  return { top: path, sides: path }
}

function masterStoneTextures(baseUrl: string): VoxelTextures {
  const path = `${baseUrl}${BM}MasterStone.png`
  return { top: path, sides: path }
}

/**
 * Чистая функция: возвращает массив вокселей для отображения ритуала.
 * layout → VoxelBlock с текстурой по типу руны.
 * Если в layout нет блока на (0,0,0) — добавляется центральный мастер-камень.
 */
export function ritualVoxels(ritual: Ritual, baseUrl = '/'): VoxelBlock[] {
  const hasMasterInLayout = ritual.layout.some((r) => r.x === 0 && r.y === 0 && r.z === 0)

  const runeBlocks: VoxelBlock[] = ritual.layout.map((r) => ({
    x: r.x,
    y: r.y,
    z: r.z,
    textures: runeTextures(r.rune, baseUrl),
    label: RUNE_LABELS[r.rune],
  }))

  if (hasMasterInLayout) return runeBlocks

  const master: VoxelBlock = {
    x: 0,
    y: 0,
    z: 0,
    textures: masterStoneTextures(baseUrl),
    label: 'Мастер-камень',
  }

  return [master, ...runeBlocks]
}
