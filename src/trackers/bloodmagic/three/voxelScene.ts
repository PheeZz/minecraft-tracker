// Вся three.js-логика сцены вынесена сюда; THREE и OrbitControls передаются
// снаружи — компонент грузит их лениво и передаёт в эту функцию.
import type * as THREEType from 'three'
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js'
import type { VoxelBlock } from './voxelTypes'
import { computeBounds, buildGrid } from './voxelGrid'
import { loadAltarModel, startEntranceTween } from './altarModel'

export interface VoxelSceneOptions {
  onHover: (block: VoxelBlock | null, screenX: number, screenY: number) => void
}

export interface VoxelSceneHandle {
  resize: (width: number, height: number) => void
  dispose: () => void
}

// --- Построение меша вокселя ---

/** Создаёт кеш текстур — один TextureLoader на всю сцену. */
function makeTextureCache(THREE: typeof THREEType) {
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
function buildVoxelMesh(
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
function disposeObject3D(obj: THREEType.Object3D) {
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

function buildScene(THREE: typeof THREEType): THREEType.Scene {
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

function buildCamera(THREE: typeof THREEType, width: number, height: number) {
  return new THREE.PerspectiveCamera(45, width / height, 0.1, 500)
}

/** Позиционирует камеру по bounding-box так, чтобы вся структура была видна. */
function centerCamera(
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

// --- Главная функция ---

/**
 * Строит воксельную сцену на canvas.
 * THREE и OrbitControls передаются снаружи — это позволяет компоненту
 * грузить их лениво через динамический import().
 *
 * Блоки с block.model === 'altar' рисуются OBJ-моделью (loadAltarModel);
 * остальные — кубами (BoxGeometry) как прежде.
 */
export function createVoxelScene(
  canvas: HTMLCanvasElement,
  THREE: typeof THREEType,
  OrbitControls: new (camera: THREEType.Camera, domElement: HTMLElement) => OrbitControlsType,
  blocks: VoxelBlock[],
  opts: VoxelSceneOptions,
): VoxelSceneHandle {
  const width = canvas.clientWidth || 600
  const height = canvas.clientHeight || 360

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = buildScene(THREE)
  const camera = buildCamera(THREE, width, height)
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08

  // Медленное авто-вращение для оживления сцены; выключается при первом взаимодействии
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.6

  // Одноразовый стоп авто-вращения при первом жесте пользователя
  function stopAutoRotate() {
    controls.autoRotate = false
    controls.removeEventListener('start', stopAutoRotate)
  }
  controls.addEventListener('start', stopAutoRotate)

  const { load: loadTex, disposeAll: disposeTextures } = makeTextureCache(THREE)

  // Меши для raycast (кубы); OBJ-меши добавляются асинхронно
  const meshes: THREEType.Mesh[] = []
  // OBJ-группы для dispose
  const modelObjects: THREEType.Object3D[] = []

  // Флаг защиты от добавления в сцену после dispose
  let disposed = false

  // Активные entrance-твины: каждый — функция tick(now), no-op после завершения
  const entranceTicks: Array<(now: number) => void> = []

  // Разделяем блоки: обычные кубы vs. модельные
  const cubeBlocks = blocks.filter((b) => b.model !== 'altar')
  const modelBlocks = blocks.filter((b) => b.model === 'altar')

  // Кубы — синхронно
  for (const b of cubeBlocks) {
    const mesh = buildVoxelMesh(THREE, b, loadTex)
    scene.add(mesh)
    meshes.push(mesh)
  }

  // Опорная сетка-пол для ориентации в координатах
  const grid = blocks.length ? buildGrid(THREE, computeBounds(blocks)) : null
  if (grid) scene.add(grid)

  centerCamera(camera, controls, blocks)

  // OBJ-модели — асинхронно (OBJLoader грузится отдельным чанком)
  const baseUrl: string = import.meta.env?.BASE_URL ?? '/'
  for (const voxel of modelBlocks) {
    loadAltarModel(THREE, baseUrl, voxel)
      .then((obj) => {
        // Сцена уже задиспоужена пока шла загрузка — освобождаем и уходим
        if (disposed) {
          disposeObject3D(obj)
          return
        }
        scene.add(obj)
        modelObjects.push(obj)
        // Добавляем меши модели в пул raycast-а
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) meshes.push(child)
        })
        // Запускаем entrance-анимацию появления модели
        entranceTicks.push(startEntranceTween(THREE, obj))
      })
      .catch((err) => {
        console.warn('[altarModel] не удалось загрузить OBJ-модель алтаря:', err)
      })
  }

  // --- Raycast hover ---
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let rafId = 0
  let lastHoveredBlock: VoxelBlock | null = null

  function onMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObjects(meshes)
    const hit = hits[0]?.object?.userData?.block as VoxelBlock | undefined

    if (hit !== lastHoveredBlock) {
      lastHoveredBlock = hit ?? null
      opts.onHover(lastHoveredBlock, e.clientX, e.clientY)
    } else if (hit) {
      // Обновляем позицию тултипа при движении над тем же блоком
      opts.onHover(hit, e.clientX, e.clientY)
    }
  }

  function onMouseLeave() {
    if (lastHoveredBlock !== null) {
      lastHoveredBlock = null
      opts.onHover(null, 0, 0)
    }
  }

  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseleave', onMouseLeave)

  // --- Render loop ---
  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop)
    controls.update()
    // Прогоняем активные entrance-твины (no-op после завершения каждого)
    const now = performance.now()
    for (const tick of entranceTicks) tick(now)
    renderer.render(scene, camera)
  }
  renderLoop()

  // --- Handle ---

  function resize(w: number, h: number) {
    if (w === 0 || h === 0) return // контейнер скрыт — пропускаем
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  function dispose() {
    disposed = true
    cancelAnimationFrame(rafId)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
    // Снимаем stop-слушатель autoRotate, если пользователь не взаимодействовал
    controls.removeEventListener('start', stopAutoRotate)

    // Освобождаем кубы
    for (const mesh of meshes) {
      // OBJ-меши будут освобождены через modelObjects — пропускаем дубли
      if (
        modelObjects.some((obj) => {
          let found = false
          obj.traverse((c) => {
            if (c === mesh) found = true
          })
          return found
        })
      )
        continue
      mesh.geometry.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) mat.dispose()
    }

    // Освобождаем OBJ-модели
    for (const obj of modelObjects) disposeObject3D(obj)

    if (grid) {
      grid.geometry.dispose()
      ;(grid.material as THREEType.Material).dispose()
    }

    disposeTextures()
    controls.dispose()
    renderer.dispose()
    // Форсируем освобождение WebGL-контекста (браузер лимитирует ~16 контекстов)
    renderer.forceContextLoss()
  }

  return { resize, dispose }
}
