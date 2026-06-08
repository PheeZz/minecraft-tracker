import { ALTAR_TIERS } from '../data/altar.data'
import type { AltarBlock } from '../domain/types'
import type { VoxelBlock, VoxelTextures } from './voxelTypes'

// Базовый путь к текстурам BloodMagic (без import.meta.env.BASE_URL,
// чтобы функция оставалась чистой и тестируемой).
const BM = 'bloodmagic/blocks/alchemicalwizardry/'
const VAN = 'bloodmagic/vanilla/blocks/'

/** Возвращает путь с опциональным базовым URL (в браузере — import.meta.env.BASE_URL). */
function tex(base: string, file: string, baseUrl = '/'): string {
  return `${baseUrl}${base}${file}`
}

/** Текстуры алтаря — мультигранный блок. */
function altarTextures(baseUrl: string): VoxelTextures {
  return {
    top: tex(BM, 'BloodAltar_Top.png', baseUrl),
    bottom: tex(BM, 'BloodAltar_Bottom.png', baseUrl),
    sides: tex(BM, 'BloodAltar_SideType1.png', baseUrl),
  }
}

/** Текстуры кровавой руны. */
function bloodRuneTextures(baseUrl: string): VoxelTextures {
  return { top: tex(BM, 'BlankRune.png', baseUrl), sides: tex(BM, 'BlankRune.png', baseUrl) }
}

/** Текстуры блока по ref / флагам из AltarBlock. */
function texturesForBlock(block: AltarBlock, baseUrl: string): VoxelTextures {
  if (block.isBloodRune) return bloodRuneTextures(baseUrl)
  if (block.isPlacement) {
    const glow = tex(VAN, 'glowstone.png', baseUrl)
    return { top: glow, sides: glow }
  }
  if (block.ref === 'largeBloodStoneBrick') {
    const brick = tex(BM, 'LargeBloodStoneBrick.png', baseUrl)
    return { top: brick, sides: brick }
  }
  if (block.ref === 'blockCrystal') {
    const shard = tex(BM, 'ShardCluster.png', baseUrl)
    return { top: shard, sides: shard }
  }
  // Структурные блоки без ref (name_ru='Булыжник') → cobblestone
  const cob = tex(VAN, 'cobblestone.png', baseUrl)
  return { top: cob, sides: cob }
}

/** Центральный алтарь — всегда в центре (0,0,0). */
function centralAltarVoxel(baseUrl: string): VoxelBlock {
  return {
    x: 0,
    y: 0,
    z: 0,
    textures: altarTextures(baseUrl),
    label: 'Алтарь крови',
    upgrade: false,
  }
}

/**
 * Чистая функция: возвращает массив вокселей для заданного тира алтаря.
 * Принимает опциональный baseUrl для построения путей к текстурам
 * (дефолт '/' — корень, удобен в тестах; в браузере передавать import.meta.env.BASE_URL).
 */
export function altarVoxels(tier: number, baseUrl = '/'): VoxelBlock[] {
  const tierData = ALTAR_TIERS.find((t) => t.tier === tier)
  if (!tierData) return [centralAltarVoxel(baseUrl)]

  const fromComponents: VoxelBlock[] = tierData.components.map((block) => ({
    x: block.x,
    y: block.y,
    z: block.z,
    textures: texturesForBlock(block, baseUrl),
    label: block.name_ru,
    upgrade: block.isUpgradeSlot,
  }))

  return [centralAltarVoxel(baseUrl), ...fromComponents]
}
