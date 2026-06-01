import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { BEES, BEE_BY_ID } from '../data/bees.data'
import { type BeeSource } from '../domain/types'
import { COMBS, type CombProducer } from '../domain/combs'
import { makeDepth } from '../domain/graph'
import { combStatus, taskProgress, type BeeTask, type CombStatus } from '../domain/tasks'

const HAVE_KEY = 'bees.have'
const TASKS_KEY = 'bees.tasks'

/** Суммарное число видов по источникам (фиксировано данными). */
const TOTAL_BY_SOURCE: Record<BeeSource, number> = BEES.reduce(
  (acc, b) => {
    acc[b.source] += 1
    return acc
  },
  { F: 0, E: 0, M: 0 } as Record<BeeSource, number>,
)

/** Производитель соты с посчитанной глубиной выведения. */
export interface RankedProducer extends CombProducer {
  depth: number
}

/** Формат экспорта данных пчёл (склад + задачи). */
export interface BeeExport {
  v: 1
  exported: string
  have: string[]
  tasks: BeeTask[]
}

const COMB_NAMES_SET: ReadonlySet<string> = new Set(Object.keys(COMBS))

/** Уникальный id задачи. crypto.randomUUID есть только в secure context (https/
   localhost); на проде по http его нет → используем getRandomValues, иначе time+random. */
function uid(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  if (c && typeof c.getRandomValues === 'function') {
    return [...c.getRandomValues(new Uint8Array(16))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** Склад из ненадёжного источника (localStorage/импорт): только известные id. */
function sanitizeHave(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set()
  return new Set(raw.filter((id): id is string => typeof id === 'string' && id in BEE_BY_ID))
}

/** Задачи из ненадёжного источника: валидируем форму, отбрасываем мусор. */
function sanitizeTasks(raw: unknown): BeeTask[] {
  if (!Array.isArray(raw)) return []
  const out: BeeTask[] = []
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue
    const o = t as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.name !== 'string' || !Array.isArray(o.combs)) continue
    const name = o.name.trim()
    if (!name) continue
    const combs = [
      ...new Set(
        o.combs.filter((c): c is string => typeof c === 'string' && COMB_NAMES_SET.has(c)),
      ),
    ]
    if (!combs.length) continue
    const task: BeeTask = { id: o.id, name, combs }
    if (typeof o.collapsed === 'boolean') task.collapsed = o.collapsed
    out.push(task)
  }
  return out
}

export const useBeesStore = defineStore('bees', () => {
  // склад выведенных видов
  const have = ref<Set<string>>(sanitizeHave(storage.get<unknown>(HAVE_KEY, [])))

  const invOnly = ref(false)
  /** Выбранный рецепт на пчелу (индекс в parents). */
  const rc = reactive<Record<string, number>>({})
  /** Версия выбора рецептов: инкремент при смене rc — дешёвый триггер для watch. */
  const rcVersion = ref(0)

  /** Список задач игрока (цель-предмет → требуемые соты). */
  const tasks = ref<BeeTask[]>(sanitizeTasks(storage.get<unknown>(TASKS_KEY, [])))

  function persist(): void {
    storage.set(HAVE_KEY, [...have.value])
  }

  /** Мемоизированная глубина, пересоздаётся при изменении склада. */
  const depthOf = computed(() => makeDepth(have.value))

  const haveCount = computed(() => have.value.size)
  const isHave = (id: string): boolean => have.value.has(id)

  function toggleHave(id: string): void {
    const next = new Set(have.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    have.value = next
    persist()
  }
  function clearHave(): void {
    have.value = new Set()
    persist()
  }
  /** Массово отметить виды как имеющиеся — одна пересборка Set и одно сохранение. */
  function markAll(ids: string[]): void {
    const next = new Set(have.value)
    for (const id of ids) if (id in BEE_BY_ID) next.add(id)
    have.value = next
    persist()
  }
  /** Массово снять отметку — одна пересборка Set и одно сохранение. */
  function unmarkAll(ids: string[]): void {
    const next = new Set(have.value)
    for (const id of ids) next.delete(id)
    have.value = next
    persist()
  }

  /** Кол-во имеющихся видов по источникам. */
  const ownedBySource = computed(() => {
    const out: Record<BeeSource, number> = { F: 0, E: 0, M: 0 }
    for (const id of have.value) {
      const b = BEE_BY_ID[id]
      if (b) out[b.source] += 1
    }
    return out
  })
  /** Сколько видов можно вывести прямо сейчас (родители уже есть/дикие). */
  const breedableCount = computed(() => {
    const depth = depthOf.value
    let n = 0
    for (const b of BEES) {
      if (!have.value.has(b.id) && b.parents.length > 0 && depth(b.id) === 0) n += 1
    }
    return n
  })

  // ВАЖНО: rc — reactive(Record). Потребители planSteps/subgraph должны вызывать их
  // внутри computed/шаблона (чтобы чтение rc[id] отслеживалось) — иначе смена рецепта
  // не пересчитает план. depth от rc не зависит (углубляется по всем рецептам).
  function setRecipe(id: string, idx: number): void {
    rc[id] = idx
    rcVersion.value++
  }
  function cycleRecipe(id: string): void {
    const b = BEE_BY_ID[id]
    if (!b || b.parents.length <= 1) return
    rc[id] = ((rc[id] ?? 0) + 1) % b.parents.length
    rcVersion.value++
  }

  /** Производители соты, отсортированные «проще всего» (глубина ↑, затем шанс ↓). */
  function producersOf(comb: string): RankedProducer[] {
    const depth = depthOf.value
    return (COMBS[comb] ?? [])
      .map((p) => ({ ...p, depth: depth(p.bee) }))
      .sort((a, b) => a.depth - b.depth || b.pct - a.pct)
  }

  function persistTasks(): void {
    storage.set(TASKS_KEY, tasks.value)
  }
  function dedupe(combs: string[]): string[] {
    return [...new Set(combs)]
  }
  function addTask(name: string, combs: string[]): void {
    tasks.value = [...tasks.value, { id: uid(), name, combs: dedupe(combs) }]
    persistTasks()
  }
  function updateTask(id: string, patch: { name?: string; combs?: string[] }): void {
    tasks.value = tasks.value.map((t) =>
      t.id === id
        ? {
            ...t,
            ...(patch.name != null ? { name: patch.name } : {}),
            ...(patch.combs != null ? { combs: dedupe(patch.combs) } : {}),
          }
        : t,
    )
    persistTasks()
  }
  function removeTask(id: string): void {
    tasks.value = tasks.value.filter((t) => t.id !== id)
    persistTasks()
  }
  function toggleTaskCollapsed(id: string): void {
    tasks.value = tasks.value.map((t) => (t.id === id ? { ...t, collapsed: !t.collapsed } : t))
    persistTasks()
  }

  /** Бэкап данных пчёл (склад + задачи) в сериализуемый объект. */
  function exportData(): BeeExport {
    return {
      v: 1,
      exported: new Date().toISOString(),
      have: [...have.value],
      // глубокая копия — не отдаём наружу живые ссылки на состояние стора
      tasks: tasks.value.map((t) => ({ ...t, combs: [...t.combs] })),
    }
  }
  /** Импорт бэкапа: валидируем форму, заменяем склад/задачи. */
  function importData(payload: unknown): void {
    if (!payload || typeof payload !== 'object') return
    const o = payload as Record<string, unknown>
    if ('have' in o) {
      have.value = sanitizeHave(o.have)
      persist()
    }
    if ('tasks' in o) {
      tasks.value = sanitizeTasks(o.tasks)
      persistTasks()
    }
  }

  // Единый источник статусов сот задачи (сота → проще всего вывести/есть на складе).
  // Используют и карточка задачи, и бейдж незакрытых — чтобы логика не двоилась.
  function statusesOf(task: BeeTask): CombStatus[] {
    return task.combs.map((c) => combStatus(c, producersOf(c), have.value))
  }
  /** Число незакрытых задач (есть незакрытая сота) — для бейджа на кнопке «Задачи». */
  const openTaskCount = computed(
    () => tasks.value.filter((t) => !taskProgress(statusesOf(t)).ready).length,
  )

  return {
    have,
    invOnly,
    rc,
    rcVersion,
    tasks,
    TOTAL_BY_SOURCE,
    ownedBySource,
    breedableCount,
    depthOf,
    haveCount,
    isHave,
    toggleHave,
    clearHave,
    markAll,
    unmarkAll,
    setRecipe,
    cycleRecipe,
    producersOf,
    addTask,
    updateTask,
    removeTask,
    toggleTaskCollapsed,
    statusesOf,
    openTaskCount,
    exportData,
    importData,
  }
})
