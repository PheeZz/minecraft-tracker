// Вся three.js-логика сцены вынесена сюда; THREE и OrbitControls передаются
// снаружи — компонент грузит их лениво и передаёт в эту функцию.
import type * as THREEType from 'three'
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js'
import type { VoxelBlock } from './voxelTypes'
import { computeBounds, buildGrid } from './voxelGrid'

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

  // Без emissive: блоки выглядят как в игре (руна — серый камень, не жёлтая).
  // Различие слотов апгрейда показано в 2D-схеме (золотая рамка + легенда).
  const makeMat = (tex: THREEType.Texture) => new THREE.MeshLambertMaterial({ map: tex })

  // Порядок граней BoxGeometry: +X,-X,+Y,-Y,+Z,-Z
  return [makeMat(side), makeMat(side), makeMat(top), makeMat(bottom), makeMat(side), makeMat(side)]
}

/** Создаёт Mesh для одного вокселя. */
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
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500)
  return camera
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

// --- Raycast / hover ---

function buildRaycaster(THREE: typeof THREEType) {
  return new THREE.Raycaster()
}

// --- Главная функция ---

/**
 * Строит воксельную сцену на canvas.
 * THREE и OrbitControls передаются снаружи — это позволяет компоненту
 * грузить их лениво через динамический import().
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

  const { load: loadTex, disposeAll: disposeTextures } = makeTextureCache(THREE)

  // Добавляем все вокселы в сцену
  const meshes: THREEType.Mesh[] = blocks.map((b) => {
    const mesh = buildVoxelMesh(THREE, b, loadTex)
    scene.add(mesh)
    return mesh
  })

  // Опорная сетка-пол для ориентации в координатах
  const grid = blocks.length ? buildGrid(THREE, computeBounds(blocks)) : null
  if (grid) scene.add(grid)

  centerCamera(camera, controls, blocks)

  // --- Raycast hover ---
  const raycaster = buildRaycaster(THREE)
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
    renderer.render(scene, camera)
  }
  renderLoop()

  // --- Handle ---

  function resize(w: number, h: number) {
    if (w === 0 || h === 0) return // контейнер скрыт (display:none при переключении) — пропускаем
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  function dispose() {
    cancelAnimationFrame(rafId)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)

    // Освобождаем геометрию, материалы, текстуры каждого меша
    for (const mesh of meshes) {
      mesh.geometry.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        mat.dispose()
      }
    }

    if (grid) {
      grid.geometry.dispose()
      ;(grid.material as THREEType.Material).dispose()
    }

    disposeTextures()
    controls.dispose()
    renderer.dispose()
    // dispose() освобождает GPU-ресурсы, но НЕ отпускает WebGL-контекст; форсируем,
    // иначе контексты копятся при смене тира и браузер убивает старые (~16 лимит).
    renderer.forceContextLoss()
  }

  return { resize, dispose }
}
