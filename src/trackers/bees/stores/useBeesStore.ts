import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { BEES, BEE_BY_ID } from '../data/bees.data'
import { type BeeSource } from '../domain/types'
import { COMBS, type CombProducer } from '../domain/combs'
import { makeDepth } from '../domain/graph'

const HAVE_KEY = 'bees.have'
const INV_PREFS_KEY = 'bees.invPrefs'

export type BeeMode = 'comb' | 'bee'

/** Сортировка инвентаря: имя / глубина выведения / сначала дикие. */
export type InvSort = 'name' | 'depth' | 'wild'
/** Фильтр инвентаря: все / нет / есть / готовы к выведению / дикие. */
export type InvFilter = 'all' | 'missing' | 'owned' | 'breedable' | 'wild'

/** Сохраняемые настройки экрана инвентаря. */
interface InvPrefs {
  sort: InvSort
  filter: InvFilter
  collapsed: BeeSource[]
}

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

export const useBeesStore = defineStore('bees', () => {
  // склад выведенных видов
  const savedHave = storage.get<string[]>(HAVE_KEY, [])
  const have = ref<Set<string>>(new Set(savedHave.filter((id) => id in BEE_BY_ID)))

  const invOnly = ref(false)
  /** Выбранный рецепт на пчелу (индекс в parents). */
  const rc = reactive<Record<string, number>>({})

  const mode = ref<BeeMode>('comb')
  const curComb = ref<string | null>(null)
  const curTarget = ref<string | null>(null)
  /** Открыт ли раздел инвентаря (замещает канвас-цепочку). */
  const inventoryOpen = ref(false)

  // настройки инвентаря (сорт/фильтр/свёрнутые секции) — один сохраняемый ключ
  const savedPrefs = storage.get<InvPrefs>(INV_PREFS_KEY, {
    sort: 'name',
    filter: 'all',
    collapsed: [],
  })
  const invSort = ref<InvSort>(savedPrefs.sort)
  const invFilter = ref<InvFilter>(savedPrefs.filter)
  const collapsedSources = ref<Set<BeeSource>>(new Set(savedPrefs.collapsed))

  function persist(): void {
    storage.set(HAVE_KEY, [...have.value])
  }
  function persistPrefs(): void {
    storage.set(INV_PREFS_KEY, {
      sort: invSort.value,
      filter: invFilter.value,
      collapsed: [...collapsedSources.value],
    } satisfies InvPrefs)
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

  // ── настройки инвентаря ──
  function setInvSort(sort: InvSort): void {
    invSort.value = sort
    persistPrefs()
  }
  function setInvFilter(filter: InvFilter): void {
    invFilter.value = filter
    persistPrefs()
  }
  function toggleCollapsed(src: BeeSource): void {
    const next = new Set(collapsedSources.value)
    if (next.has(src)) next.delete(src)
    else next.add(src)
    collapsedSources.value = next
    persistPrefs()
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
  }
  function cycleRecipe(id: string): void {
    const b = BEE_BY_ID[id]
    if (!b || b.parents.length <= 1) return
    rc[id] = ((rc[id] ?? 0) + 1) % b.parents.length
  }

  /** Производители соты, отсортированные «проще всего» (глубина ↑, затем шанс ↓). */
  function producersOf(comb: string): RankedProducer[] {
    const depth = depthOf.value
    return (COMBS[comb] ?? [])
      .map((p) => ({ ...p, depth: depth(p.bee) }))
      .sort((a, b) => a.depth - b.depth || b.pct - a.pct)
  }

  function selectComb(name: string): void {
    mode.value = 'comb'
    curComb.value = name
    curTarget.value = producersOf(name)[0]?.bee ?? null
  }
  function selectBee(id: string): void {
    mode.value = 'bee'
    curComb.value = null
    curTarget.value = id
  }
  function setTarget(id: string): void {
    curTarget.value = id
  }
  function toggleInventory(): void {
    inventoryOpen.value = !inventoryOpen.value
  }

  return {
    have,
    invOnly,
    rc,
    mode,
    curComb,
    curTarget,
    inventoryOpen,
    invSort,
    invFilter,
    collapsedSources,
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
    setInvSort,
    setInvFilter,
    toggleCollapsed,
    setRecipe,
    cycleRecipe,
    producersOf,
    selectComb,
    selectBee,
    setTarget,
    toggleInventory,
  }
})
