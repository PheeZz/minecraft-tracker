import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { BEE_BY_ID } from '../data/bees.data'
import { COMBS, type CombProducer } from '../domain/combs'
import { makeDepth } from '../domain/graph'

const HAVE_KEY = 'bees.have'

export type BeeMode = 'comb' | 'bee'

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
    depthOf,
    haveCount,
    isHave,
    toggleHave,
    clearHave,
    setRecipe,
    cycleRecipe,
    producersOf,
    selectComb,
    selectBee,
    setTarget,
    toggleInventory,
  }
})
