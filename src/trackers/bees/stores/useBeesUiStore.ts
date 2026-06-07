import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { useBeesStore } from './useBeesStore'
import type { BeeSource } from '../domain/types'

const INV_PREFS_KEY = 'bees.invPrefs'
const VIEW_KEY = 'bees.view'

export type BeeMode = 'comb' | 'bee'

/** Сортировка инвентаря: имя / глубина выведения / сначала дикие. */
export type InvSort = 'name' | 'depth' | 'wild'
/** Фильтр инвентаря: все / нет / есть / готовы к выведению / дикие. */
export type InvFilter = 'all' | 'missing' | 'owned' | 'breedable' | 'wild'

/** Сохраняемые настройки экрана инвентаря. */
export interface InvPrefs {
  sort: InvSort
  filter: InvFilter
  collapsed: BeeSource[]
}

const VALID_SORT: readonly InvSort[] = ['name', 'depth', 'wild']
const VALID_FILTER: readonly InvFilter[] = ['all', 'missing', 'owned', 'breedable', 'wild']

/** UI-состояние трекера пчёл (вид, режим, выбор, настройки инвентаря). */
export const useBeesUiStore = defineStore('bees-ui', () => {
  // настройки инвентаря (сорт/фильтр/свёрнутые секции) — один сохраняемый ключ
  const savedPrefs = storage.get<InvPrefs>(INV_PREFS_KEY, {
    sort: 'name',
    filter: 'all',
    collapsed: [],
  })
  const invSort = ref<InvSort>(VALID_SORT.includes(savedPrefs.sort) ? savedPrefs.sort : 'name')
  const invFilter = ref<InvFilter>(
    VALID_FILTER.includes(savedPrefs.filter) ? savedPrefs.filter : 'all',
  )
  const collapsedSources = ref<Set<BeeSource>>(
    new Set(
      (Array.isArray(savedPrefs.collapsed) ? savedPrefs.collapsed : []).filter(
        (s): s is BeeSource => s === 'F' || s === 'E' || s === 'M',
      ),
    ),
  )

  const mode = ref<BeeMode>('comb')
  const curComb = ref<string | null>(null)
  const curTarget = ref<string | null>(null)
  /** Текущий основной экран области пчёл (сохраняется между визитами). */
  const view = ref<'graph' | 'inventory'>(
    storage.get<string>(VIEW_KEY, 'graph') === 'inventory' ? 'inventory' : 'graph',
  )
  /** Открыта ли модалка задач (независима от view, рисуется поверх). */
  const tasksOpen = ref(false)

  function persistPrefs(): void {
    storage.set(INV_PREFS_KEY, {
      sort: invSort.value,
      filter: invFilter.value,
      collapsed: [...collapsedSources.value],
    } satisfies InvPrefs)
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

  function selectComb(name: string): void {
    const data = useBeesStore()
    mode.value = 'comb'
    curComb.value = name
    curTarget.value = data.producersOf(name)[0]?.bee ?? null
  }
  function selectBee(id: string): void {
    mode.value = 'bee'
    curComb.value = null
    curTarget.value = id
  }
  function setTarget(id: string): void {
    curTarget.value = id
  }
  function setView(v: 'graph' | 'inventory'): void {
    view.value = v
    storage.set(VIEW_KEY, v)
  }
  function openTasks(): void {
    tasksOpen.value = true
  }
  function closeTasks(): void {
    tasksOpen.value = false
  }
  function toggleTasks(): void {
    tasksOpen.value = !tasksOpen.value
  }

  return {
    mode,
    curComb,
    curTarget,
    view,
    tasksOpen,
    invSort,
    invFilter,
    collapsedSources,
    setInvSort,
    setInvFilter,
    toggleCollapsed,
    selectComb,
    selectBee,
    setTarget,
    setView,
    openTasks,
    closeTasks,
    toggleTasks,
  }
})
