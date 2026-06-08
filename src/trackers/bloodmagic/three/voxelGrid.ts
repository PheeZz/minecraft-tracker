// Границы структуры и опорная сетка-пол для ориентации в координатах.
import type * as THREEType from 'three'
import type { VoxelBlock } from './voxelTypes'

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
  cx: number
  cy: number
  cz: number
}

/** Bounding-box набора вокселей + центр. Для пустого набора — всё в нуле. */
export function computeBounds(blocks: readonly VoxelBlock[]): Bounds {
  if (!blocks.length) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0, cx: 0, cy: 0, cz: 0 }
  }
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity
  for (const b of blocks) {
    minX = Math.min(minX, b.x)
    maxX = Math.max(maxX, b.x)
    minY = Math.min(minY, b.y)
    maxY = Math.max(maxY, b.y)
    minZ = Math.min(minZ, b.z)
    maxZ = Math.max(maxZ, b.z)
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    cz: (minZ + maxZ) / 2,
  }
}

/**
 * Опорная сетка на уровне пола структуры (под нижним слоем блоков).
 * Линии на границах блоков (полуцелые координаты) — как в Minecraft.
 * Центральные линии (через мастер-камень/алтарь) подсвечены ярче.
 */
export function buildGrid(THREE: typeof THREEType, bounds: Bounds): THREEType.GridHelper {
  const spanX = bounds.maxX - bounds.minX
  const spanZ = bounds.maxZ - bounds.minZ
  // Размер ОБЯЗАТЕЛЬНО чётный: блоки на целых координатах, грани — на полуцелых.
  // GridHelper рисует линии шагом 1; при чётном size и сдвиге центра на 0.5 линии
  // ложатся ровно на грани блоков (как сетка пола в Minecraft). Нечётный size сдвинул
  // бы линии на центры блоков — мимо. +6 — запас вокруг структуры.
  let size = Math.ceil(Math.max(spanX, spanZ)) + 6
  if (size % 2 !== 0) size += 1
  const grid = new THREE.GridHelper(size, size, 0xc04a4a, 0x44282a)
  // Центр сетки — ближайшая полуцелая к центру структуры (выравнивание линий на грани);
  // пол — на полблока ниже нижнего вокселя.
  grid.position.set(Math.floor(bounds.cx) + 0.5, bounds.minY - 0.5, Math.floor(bounds.cz) + 0.5)
  const mat = grid.material as THREEType.Material
  mat.transparent = true
  mat.opacity = 0.5
  return grid
}
