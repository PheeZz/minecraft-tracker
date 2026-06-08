// Вспомогательные строительные примитивы для voxelScene: меши, текстуры, сцена, камера.
// Вынесены сюда для соблюдения лимита строк основного модуля.
import type * as THREEType from 'three'
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js'
import type { VoxelBlock } from './voxelTypes'
import { computeBounds, buildGrid } from './voxelGrid'
import { loadAltarModel, startEntranceTween } from './altarModel'

// --- Текстурный кеш ---

/** Создаёт кеш текстур — один TextureLoader на всю сцену. */
export function makeTextureCache(THREE: typeof THREEType) {
  const cache = new Map<string, THREEType.Texture>()
  const loader = new THREE.TextureLoader()

  function load(path: string): THREEType.Texture {
    if (cache.has(path)) return cache.get(path)!
    const tex = loader.load(path)
    // Пиксель-арт: никакой фильтрации
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter
    tex.colorSpace = THREE.SRGBColorSpace
    cache.set(path, tex)
    return tex
  }

  function disposeAll() {
    cache.forEach((tex) => tex.dispose())
    cache.clear()
  }

  return { load, disposeAll }
}

// --- Меши вокселей ---

/** Материалы по 6 граням: +X,-X,+Y,-Y,+Z,-Z. */
function buildFaceMaterials(
  THREE: typeof THREEType,
  block: VoxelBlock,
  loadTex: (p: string) => THREEType.Texture,
): THREEType.MeshLambertMaterial[] {
  const top = loadTex(block.textures.top)
  const bottom = loadTex(block.textures.bottom ?? block.textures.sides)
  const side = loadTex(block.textures.sides)

  const makeMat = (tex: THREEType.Texture) => new THREE.MeshLambertMaterial({ map: tex })
  // Порядок граней BoxGeometry: +X,-X,+Y,-Y,+Z,-Z
  return [makeMat(side), makeMat(side), makeMat(top), makeMat(bottom), makeMat(side), makeMat(side)]
}

/** Создаёт Mesh для одного вокселя-куба. */
export function buildVoxelMesh(
  THREE: typeof THREEType,
  block: VoxelBlock,
  loadTex: (p: string) => THREEType.Texture,
): THREEType.Mesh {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const materials = buildFaceMaterials(THREE, block, loadTex)
  const mesh = new THREE.Mesh(geometry, materials)
  mesh.position.set(block.x, block.y, block.z)
  mesh.userData = { block }
  return mesh
}

// --- Освобождение ресурсов OBJ-модели ---

/** Освобождает геометрию и материалы всех мешей Object3D (рекурсивно). */
export function disposeObject3D(obj: THREEType.Object3D) {
  obj.traverse((child) => {
    if (!('geometry' in child)) return
    const mesh = child as THREEType.Mesh
    mesh.geometry?.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) {
      if (!mat) continue
      // Освобождаем текстуру, если она есть на материале
      const mapMat = mat as THREEType.MeshLambertMaterial
      mapMat.map?.dispose()
      mat.dispose()
    }
  })
}

// --- Освещение и сцена ---

export function buildScene(THREE: typeof THREEType): THREEType.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1010)

  const ambient = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambient)

  const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.2)
  dirLight.position.set(10, 20, 15)
  scene.add(dirLight)

  return scene
}

// --- Камера ---

export function buildCamera(THREE: typeof THREEType, width: number, height: number) {
  return new THREE.PerspectiveCamera(45, width / height, 0.1, 500)
}

/** Позиционирует камеру по bounding-box так, чтобы вся структура была видна. */
export function centerCamera(
  camera: THREEType.PerspectiveCamera,
  controls: OrbitControlsType,
  blocks: VoxelBlock[],
) {
  if (!blocks.length) return
  const { cx, cy, cz, minX, maxX, minY, maxY, minZ, maxZ } = computeBounds(blocks)
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
  const dist = span * 1.6 + 8

  controls.target.set(cx, cy, cz)
  camera.position.set(cx + dist * 0.6, cy + dist * 0.5, cz + dist * 0.8)
  controls.update()
}

// --- Тип изменяемого контента сцены ---

export interface SceneContent {
  /** Меши кубов и OBJ для raycast */
  meshes: THREEType.Mesh[]
  /** Загруженные OBJ-группы для dispose */
  modelObjects: THREEType.Object3D[]
  /** Сеточный пол */
  grid: THREEType.LineSegments | null
  /** Активные entrance-твины (no-op после завершения) */
  entranceTicks: Array<(now: number) => void>
}

// --- Построение и очистка контента сцены ---

/**
 * Параметры для buildSceneContent: доступ к живым объектам сцены
 * передаётся ссылками, чтобы не дублировать логику camera/scene между create и update.
 */
export interface BuildContentParams {
  THREE: typeof THREEType
  scene: THREEType.Scene
  camera: THREEType.PerspectiveCamera
  controls: OrbitControlsType
  loadTex: (p: string) => THREEType.Texture
  /** Getter текущего активного контента — нужен для защиты устаревших async-загрузок. */
  getContent: () => SceneContent
  /** Флаг: true если сцена задиспоужена — async-загрузки должны освобождать модели. */
  isDisposed: () => boolean
}

/**
 * Строит содержимое сцены из переданных блоков.
 * animateEntrance=true — OBJ появляется с fade (только при первом создании сцены).
 * animateEntrance=false — без анимации (при update смены тира, чтобы не моргало).
 */
export function buildSceneContent(
  newBlocks: VoxelBlock[],
  animateEntrance: boolean,
  params: BuildContentParams,
): SceneContent {
  const { THREE, scene, camera, controls, loadTex, getContent, isDisposed } = params

  const meshes: THREEType.Mesh[] = []
  const modelObjects: THREEType.Object3D[] = []
  const entranceTicks: Array<(now: number) => void> = []

  const cubeBlocks = newBlocks.filter((b) => b.model !== 'altar')
  const modelBlocks = newBlocks.filter((b) => b.model === 'altar')

  // Кубы — синхронно
  for (const b of cubeBlocks) {
    const mesh = buildVoxelMesh(THREE, b, loadTex)
    scene.add(mesh)
    meshes.push(mesh)
  }

  // Опорная сетка-пол для ориентации в координатах
  const grid = newBlocks.length ? buildGrid(THREE, computeBounds(newBlocks)) : null
  if (grid) scene.add(grid)

  centerCamera(camera, controls, newBlocks)

  // OBJ-модели — асинхронно (OBJLoader грузится отдельным чанком)
  const baseUrl: string = import.meta.env?.BASE_URL ?? '/'
  for (const voxel of modelBlocks) {
    loadAltarModel(THREE, baseUrl, voxel)
      .then((obj) => {
        if (isDisposed()) {
          // Сцена задиспоужена пока шла загрузка
          disposeObject3D(obj)
          return
        }
        // Контент сменился (update вызван повторно) — объект устарел
        if (getContent().modelObjects !== modelObjects) {
          disposeObject3D(obj)
          return
        }
        scene.add(obj)
        modelObjects.push(obj)
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) meshes.push(child)
        })
        // Entrance-анимация только при первом создании, не при update
        if (animateEntrance) {
          entranceTicks.push(startEntranceTween(THREE, obj))
        }
      })
      .catch((err) => {
        console.warn('[altarModel] не удалось загрузить OBJ-модель алтаря:', err)
      })
  }

  return { meshes, modelObjects, grid, entranceTicks }
}

/** Удаляет из сцены и освобождает контент (кубы, сетку, OBJ). */
export function clearSceneContent(scene: THREEType.Scene, old: SceneContent) {
  const objMeshSet = new Set<THREEType.Object3D>()
  for (const obj of old.modelObjects) {
    obj.traverse((c) => objMeshSet.add(c))
  }

  for (const mesh of old.meshes) {
    if (objMeshSet.has(mesh)) continue // OBJ-меш — освобождается через modelObjects
    scene.remove(mesh)
    mesh.geometry.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) mat.dispose()
  }

  for (const obj of old.modelObjects) {
    scene.remove(obj)
    disposeObject3D(obj)
  }

  if (old.grid) {
    scene.remove(old.grid)
    old.grid.geometry.dispose()
    ;(old.grid.material as THREEType.Material).dispose()
  }
}
