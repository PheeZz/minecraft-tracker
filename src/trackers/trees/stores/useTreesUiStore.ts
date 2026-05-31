import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { BY_ID, TIERS } from '../data/trees.data'
import type { LayoutKey } from '../graph/layouts'

const UI_KEY = 'trees.ui'

interface UiSnapshot {
  layout: LayoutKey
  onlyAvail: boolean
  onlyFruit: boolean
  onlyFruitful: boolean
  showAllEdges: boolean
  bypass: boolean
  planOpen: boolean
  planHideObtained: boolean
  selectedId: string | null
  tiers: number[]
}

const ALL_TIERS = TIERS.map((t) => t.id)

/** Состояние интерфейса трекера деревьев (persist в trees.ui). */
export const useTreesUiStore = defineStore('trees-ui', () => {
  const saved = storage.get<Partial<UiSnapshot>>(UI_KEY, {})

  const layout = ref<LayoutKey>(saved.layout ?? 'tiers')
  const onlyAvail = ref(saved.onlyAvail ?? false)
  const onlyFruit = ref(saved.onlyFruit ?? false)
  const onlyFruitful = ref(saved.onlyFruitful ?? false)
  const showAllEdges = ref(saved.showAllEdges ?? false)
  const bypass = ref(saved.bypass ?? false)
  const planOpen = ref(saved.planOpen ?? false)
  const planHideObtained = ref(saved.planHideObtained ?? false)
  // санитизация: битый (несуществующий) id из persist отбрасываем
  const selectedId = ref<string | null>(
    saved.selectedId && saved.selectedId in BY_ID ? saved.selectedId : null,
  )
  /** Поисковый запрос — не персистится. */
  const searchQuery = ref('')
  const visibleTiers = reactive(
    new Set<number>(Array.isArray(saved.tiers) && saved.tiers.length ? saved.tiers : ALL_TIERS),
  )

  function toggleTier(id: number): void {
    if (visibleTiers.has(id)) visibleTiers.delete(id)
    else visibleTiers.add(id)
  }

  const filtersActive = computed(
    () =>
      onlyAvail.value ||
      onlyFruit.value ||
      onlyFruitful.value ||
      visibleTiers.size < ALL_TIERS.length,
  )

  // персистентность — единым снимком при любом изменении
  watch(
    [
      layout,
      onlyAvail,
      onlyFruit,
      onlyFruitful,
      showAllEdges,
      bypass,
      planOpen,
      planHideObtained,
      selectedId,
      () => [...visibleTiers],
    ],
    () => {
      const snap: UiSnapshot = {
        layout: layout.value,
        onlyAvail: onlyAvail.value,
        onlyFruit: onlyFruit.value,
        onlyFruitful: onlyFruitful.value,
        showAllEdges: showAllEdges.value,
        bypass: bypass.value,
        planOpen: planOpen.value,
        planHideObtained: planHideObtained.value,
        selectedId: selectedId.value,
        tiers: [...visibleTiers],
      }
      storage.set(UI_KEY, snap)
    },
    { deep: true },
  )

  return {
    layout,
    onlyAvail,
    onlyFruit,
    onlyFruitful,
    showAllEdges,
    bypass,
    planOpen,
    planHideObtained,
    selectedId,
    searchQuery,
    visibleTiers,
    filtersActive,
    toggleTier,
  }
})
