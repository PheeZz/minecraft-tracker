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

/** Запас клеток сетки вокруг структуры с каждой стороны. */
const GRID_MARGIN = 3

/**
 * Опорная сетка на уровне пола структуры (под нижним слоем блоков).
 * Своя сетка из LineSegments (не GridHelper): линии ставятся ровно на грани блоков
 * (полуцелые координаты) и симметрично покрывают структуру — поэтому она и выровнена
 * по блокам, и отцентрована относительно постройки одновременно.
 */
export function buildGrid(THREE: typeof THREEType, bounds: Bounds): THREEType.LineSegments {
  // Грани блоков — на полуцелых координатах; шаг 1 сохраняет их на гранях.
  const y = bounds.minY - 0.5
  const x0 = bounds.minX - 0.5 - GRID_MARGIN
  const x1 = bounds.maxX + 0.5 + GRID_MARGIN
  const z0 = bounds.minZ - 0.5 - GRID_MARGIN
  const z1 = bounds.maxZ + 0.5 + GRID_MARGIN

  const pts: number[] = []
  for (let x = x0; x <= x1 + 0.001; x += 1) pts.push(x, y, z0, x, y, z1) // линии вдоль Z
  for (let z = z0; z <= z1 + 0.001; z += 1) pts.push(x0, y, z, x1, y, z) // линии вдоль X

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  const mat = new THREE.LineBasicMaterial({ color: 0x6a3636, transparent: true, opacity: 0.45 })
  return new THREE.LineSegments(geom, mat)
}
