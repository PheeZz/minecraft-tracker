import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { useTreesStore } from './useTreesStore'

const SEEN_KEY = 'trees.celebrate.seen'

/** Идентификаторы достижений, которые празднуем. */
export type MilestoneId = 'fruits' | 'saplings'

type SeenMap = Record<MilestoneId, boolean>

export interface Milestone {
  id: MilestoneId
  title: string
  text: string
}

const MILESTONES: Record<MilestoneId, Omit<Milestone, 'id'>> = {
  fruits: {
    title: 'Все плоды собраны!',
    text: 'Ты разблокировал каждый уникальный плод в игре. Полная корзина — поздравляем!',
  },
  saplings: {
    title: 'Саженцы собраны!',
    text: 'У тебя достаточно саженцев на весь план выведения. Можно засаживать рощу!',
  },
}

function loadSeen(): SeenMap {
  const saved = storage.get<Partial<SeenMap>>(SEEN_KEY, {})
  return { fruits: !!saved.fruits, saplings: !!saved.saplings }
}

/**
 * Празднование достижения 100%. Срабатывает один раз НАВСЕГДА на каждое достижение
 * (флаг seen в localStorage). Вотчер на производной метрике ловит и живой переход,
 * и импорт конфига (importData меняет progress/inventory → hero пересчитывается),
 * и первую загрузку при уже-100% (если пользователь ещё не видел праздник).
 */
export const useTreesCelebration = defineStore('trees-celebration', () => {
  const store = useTreesStore()
  const seen = ref<SeenMap>(loadSeen())

  // текущее показываемое достижение + очередь (если несколько дойдут до 100% разом)
  const current = ref<Milestone | null>(null)
  const queue = ref<MilestoneId[]>([])

  function persist(): void {
    storage.set(SEEN_KEY, seen.value)
  }
  function enqueue(id: MilestoneId): void {
    if (current.value) queue.value.push(id)
    else current.value = { id, ...MILESTONES[id] }
  }
  function maybeCelebrate(id: MilestoneId, complete: boolean): void {
    if (!complete || seen.value[id]) return
    seen.value[id] = true
    persist()
    enqueue(id)
  }
  function dismiss(): void {
    const next = queue.value.shift()
    current.value = next ? { id: next, ...MILESTONES[next] } : null
  }

  const fruitsComplete = (): boolean => store.hero.fruitsTotal > 0 && store.hero.fruitPct >= 100
  // «собраны все нужные саженцы»: planSap>0 (есть что собирать) и собрано не меньше плана
  const saplingsComplete = (): boolean =>
    store.hero.planSap > 0 && store.hero.haveSap >= store.hero.planSap

  watch(fruitsComplete, (c) => maybeCelebrate('fruits', c), { immediate: true })
  watch(saplingsComplete, (c) => maybeCelebrate('saplings', c), { immediate: true })

  return { current, dismiss, seen }
})
