// Атмосфера 3D-сцены: кровавые «угли» (THREE.Points) медленно поднимаются вокруг
// структуры, а под ней пульсирует свечение (additive-спрайт). Чистая three-логика;
// THREE передаётся снаружи (ленивый импорт в компоненте). Возвращает tick/dispose.
import type * as THREEType from 'three'
import type { Bounds } from './voxelGrid'

/** Мягкая радиальная текстура (белый центр → прозрачные края) для углей и свечения. */
function makeSoftTexture(THREE: typeof THREEType): THREEType.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

interface Ember {
  speed: number
  drift: number
  phase: number
}

/** Облако «углей»: точки в объёме над структурой, дрейфуют вверх с лёгким сносом. */
function createEmbers(
  THREE: typeof THREEType,
  bounds: Bounds,
  soft: THREEType.Texture,
): { points: THREEType.Points; tick: (dt: number, now: number) => void } {
  const COUNT = 54
  const padX = (bounds.maxX - bounds.minX) / 2 + 2.5
  const padZ = (bounds.maxZ - bounds.minZ) / 2 + 2.5
  const floor = bounds.minY - 0.5
  const ceiling = bounds.maxY + 5

  const positions = new Float32Array(COUNT * 3)
  const embers: Ember[] = []

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = bounds.cx + (Math.random() * 2 - 1) * padX
    positions[i * 3 + 1] = floor + Math.random() * (ceiling - floor)
    positions[i * 3 + 2] = bounds.cz + (Math.random() * 2 - 1) * padZ
    embers.push({
      speed: 0.35 + Math.random() * 0.6,
      drift: (Math.random() * 2 - 1) * 0.25,
      phase: Math.random() * Math.PI * 2,
    })
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    map: soft,
    color: 0xff5a6a,
    size: 0.45,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })

  const points = new THREE.Points(geom, material)
  const attr = geom.getAttribute('position') as THREEType.BufferAttribute

  function tick(dt: number, now: number): void {
    const t = now / 1000
    for (let i = 0; i < COUNT; i++) {
      const e = embers[i]!
      let y = attr.getY(i) + e.speed * dt
      if (y > ceiling) {
        // переродить уголёк у пола в новой точке
        y = floor
        attr.setX(i, bounds.cx + (Math.random() * 2 - 1) * padX)
        attr.setZ(i, bounds.cz + (Math.random() * 2 - 1) * padZ)
      }
      attr.setY(i, y)
      // лёгкий боковой снос синусоидой — угли «вьются»
      attr.setX(i, attr.getX(i) + Math.sin(t + e.phase) * e.drift * dt)
    }
    attr.needsUpdate = true
  }

  return { points, tick }
}

/** Ровное свечение под структурой — additive-спрайт, «чаша с LP светится».
   Без пульсации: на ярком пике структура хуже читается, поэтому держим постоянным. */
function createUnderGlow(
  THREE: typeof THREEType,
  bounds: Bounds,
  soft: THREEType.Texture,
): { sprite: THREEType.Sprite } {
  const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) + 4
  const material = new THREE.SpriteMaterial({
    map: soft,
    color: 0xe0344a,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.position.set(bounds.cx, bounds.minY - 0.35, bounds.cz)
  sprite.scale.set(span, span, 1)

  return { sprite }
}

export interface Ambience {
  group: THREEType.Group
  tick: (now: number) => void
  dispose: () => void
}

/**
 * Собирает атмосферу (угли + подсветка) для структуры в заданных границах.
 * Уважает prefers-reduced-motion: при включённой настройке угли статичны,
 * свечение не пульсирует (но присутствует — сцена не «мертва»).
 */
export function createAmbience(THREE: typeof THREEType, bounds: Bounds): Ambience {
  const reduce =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const soft = makeSoftTexture(THREE)
  const embers = createEmbers(THREE, bounds, soft)
  const glow = createUnderGlow(THREE, bounds, soft)

  const group = new THREE.Group()
  group.add(embers.points)
  group.add(glow.sprite)

  let last = 0

  function tick(now: number): void {
    if (last === 0) last = now
    const dt = Math.min((now - last) / 1000, 0.05) // клапан на лаг-спайки
    last = now
    if (reduce) return
    embers.tick(dt, now)
  }

  function dispose(): void {
    embers.points.geometry.dispose()
    ;(embers.points.material as THREEType.Material).dispose()
    ;(glow.sprite.material as THREEType.Material).dispose()
    soft.dispose()
  }

  return { group, tick, dispose }
}
