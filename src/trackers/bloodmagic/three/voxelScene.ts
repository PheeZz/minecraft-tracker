// Главная точка входа three.js-сцены; THREE и OrbitControls передаются
// снаружи — компонент грузит их лениво и передаёт в эту функцию.
import type * as THREEType from 'three'
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js'
import type { VoxelBlock } from './voxelTypes'
import {
  makeTextureCache,
  buildScene,
  buildCamera,
  buildSceneContent,
  clearSceneContent,
  type SceneContent,
} from './voxelSceneBuild'

export interface VoxelSceneOptions {
  onHover: (block: VoxelBlock | null, screenX: number, screenY: number) => void
}

export interface VoxelSceneHandle {
  resize: (width: number, height: number) => void
  /** Обновляет содержимое сцены без пересоздания renderer/camera/controls. */
  update: (blocks: VoxelBlock[]) => void
  /** Пауза/возобновление render-loop (для скрытых вкладок под KeepAlive). */
  setActive: (active: boolean) => void
  dispose: () => void
}

/**
 * Строит воксельную сцену на canvas.
 * THREE и OrbitControls передаются снаружи — это позволяет компоненту
 * грузить их лениво через динамический import().
 *
 * Блоки с block.model === 'altar' рисуются OBJ-моделью (loadAltarModel);
 * остальные — кубами (BoxGeometry).
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

  // Медленное авто-вращение; выключается при первом взаимодействии пользователя
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.6

  function stopAutoRotate() {
    controls.autoRotate = false
    controls.removeEventListener('start', stopAutoRotate)
  }
  controls.addEventListener('start', stopAutoRotate)

  const { load: loadTex, disposeAll: disposeTextures } = makeTextureCache(THREE)

  // Флаг защиты от добавления в сцену после dispose
  let disposed = false

  // Мутабельный контент сцены (кубы, модели, сетка, твины)
  let content: SceneContent = {
    meshes: [],
    modelObjects: [],
    grid: null,
    ambience: null,
    entranceTicks: [],
  }

  // Замыкания для передачи в buildSceneContent без прямого захвата переменной
  const buildParams = {
    THREE,
    scene,
    camera,
    controls,
    loadTex,
    getContent: () => content,
    isDisposed: () => disposed,
  }

  // Первоначальное построение — с entrance-анимацией появления модели
  content = buildSceneContent(blocks, true, buildParams)

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
    const hits = raycaster.intersectObjects(content.meshes)
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
  let running = true
  function renderLoop() {
    if (!running || disposed) return
    rafId = requestAnimationFrame(renderLoop)
    controls.update()
    // Прогоняем активные entrance-твины (no-op после завершения каждого)
    const now = performance.now()
    for (const tick of content.entranceTicks) tick(now)
    renderer.render(scene, camera)
  }
  renderLoop()

  /** Пауза (скрытая вкладка) / возобновление render-loop без потери сцены. */
  function setActive(active: boolean) {
    if (disposed || active === running) return
    running = active
    if (active) renderLoop()
    else cancelAnimationFrame(rafId)
  }

  // --- Handle ---

  function resize(w: number, h: number) {
    if (w === 0 || h === 0) return // контейнер скрыт — пропускаем
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  /**
   * Обновляет содержимое сцены новыми блоками БЕЗ пересоздания renderer/camera/controls.
   * При смене тира: нет entrance-анимации, нет моргания от контекстного пересоздания.
   */
  function update(newBlocks: VoxelBlock[]) {
    if (disposed) return
    // Сбрасываем hover-тултип при смене контента
    lastHoveredBlock = null
    opts.onHover(null, 0, 0)

    const old = content
    // Строим новый контент с анимацией появления (структура «собирается»), затем
    // убираем старый. Моргания нет — панель не ремаунтится (KeepAlive), сцена живёт.
    content = buildSceneContent(newBlocks, true, buildParams)
    clearSceneContent(scene, old)
  }

  function dispose() {
    disposed = true
    running = false
    cancelAnimationFrame(rafId)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
    controls.removeEventListener('start', stopAutoRotate)

    clearSceneContent(scene, content)
    disposeTextures()
    controls.dispose()
    renderer.dispose()
    // Форсируем освобождение WebGL-контекста (браузер лимитирует ~16 контекстов)
    renderer.forceContextLoss()
  }

  return { resize, update, setActive, dispose }
}
