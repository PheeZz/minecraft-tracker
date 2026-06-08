// Асинхронная загрузка OBJ-модели Кровавого алтаря.
// OBJLoader импортируется динамически — попадает в отдельный ленивый чанк.
import type * as THREEType from 'three'
import type { VoxelBlock } from './voxelTypes'

// Геометрия модели в 16-юнитном пространстве блока → масштаб в мир-юниты
const MODEL_SCALE = 1 / 16

/**
 * Загружает OBJ-модель алтаря и настраивает позицию/материал.
 * Возвращает Object3D (группу) готовую к добавлению в сцену.
 *
 * @param THREE     — экземпляр three (уже загружен снаружи)
 * @param baseUrl   — import.meta.env.BASE_URL (путь к /public)
 * @param voxel     — воксель алтаря (x, y, z в мир-координатах)
 */
export async function loadAltarModel(
  THREE: typeof THREEType,
  baseUrl: string,
  voxel: VoxelBlock,
): Promise<THREEType.Object3D> {
  // Динамический import — OBJLoader не попадает в стартовый бандл
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')

  const [group, texture] = await Promise.all([
    loadObj(new OBJLoader(), `${baseUrl}bloodmagic/models/bloodaltar.obj`),
    loadTexture(THREE, `${baseUrl}bloodmagic/models/altar.png`),
  ])

  applyMaterial(THREE, group, texture, voxel)
  positionGroup(group, voxel)

  return group
}

// --- Вспомогательные функции ---

/** Промис-обёртка над OBJLoader.load (loadAsync недоступен в некоторых сборках). */
function loadObj(
  loader: InstanceType<typeof import('three/examples/jsm/loaders/OBJLoader.js').OBJLoader>,
  url: string,
): Promise<THREEType.Group> {
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject))
}

/** Загружает текстуру с пиксельной фильтрацией (Nearest). */
function loadTexture(THREE: typeof THREEType, url: string): Promise<THREEType.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        tex.colorSpace = THREE.SRGBColorSpace
        // flipY=true (дефолт TextureLoader) — стандарт для OBJ из большинства 3D-пакетов;
        // если UV окажутся перевёрнутыми, поменять на tex.flipY = false
        resolve(tex)
      },
      undefined,
      reject,
    )
  })
}

/**
 * Назначает всем мешам модели MeshLambertMaterial с текстурой алтаря,
 * перезаписывая дефолтные OBJ-материалы.
 * Также записывает userData.block для raycast-тултипа.
 */
function applyMaterial(
  THREE: typeof THREEType,
  group: THREEType.Group,
  texture: THREEType.Texture,
  voxel: VoxelBlock,
): void {
  const material = new THREE.MeshLambertMaterial({ map: texture })
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.material = material
    child.userData = { block: voxel }
  })
}

/**
 * Масштабирует и позиционирует группу:
 * - масштаб 1/16 (блок = 16 юнитов модели → 1 мир-юнит)
 * - X/Z: центр модели совпадает с центром вокселя
 * - Y: основание модели (y=0 в пространстве модели) — на полу клетки вокселя
 *   Клетка воксель занимает [voxel.y - 0.5 .. voxel.y + 0.5],
 *   поэтому group.position.y = voxel.y - 0.5
 */
function positionGroup(group: THREEType.Group, voxel: VoxelBlock): void {
  group.scale.setScalar(MODEL_SCALE)
  group.position.set(voxel.x, voxel.y - 0.5, voxel.z)
}
