import { inject, provide, ref, type InjectionKey } from 'vue'
import { BY_ID } from '../data/trees.data'
import { availableSet } from '../domain/graph'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'

/** Часть графа, нужная действиям (центрирование и вспышка новодоступных). */
export interface GraphHandle {
  focus(id: string): void
  flash(ids: string[]): void
}

export interface InvPopupState {
  id: string
  x: number
  y: number
}

export type TreeActions = ReturnType<typeof createTreeActions>

const KEY: InjectionKey<TreeActions> = Symbol('tree-actions')

function createTreeActions(graph: () => GraphHandle | undefined) {
  const store = useTreesStore()
  const ui = useTreesUiStore()

  const breedModalId = ref<string | null>(null)
  const invPopup = ref<InvPopupState | null>(null)

  /** Выполнить мутацию выведения и подсветить ставшие доступными деревья. */
  function withFlash(mutate: () => boolean): boolean {
    const before = availableSet(store.progress)
    const success = mutate()
    if (!success) return false
    const after = availableSet(store.progress)
    const fresh = [...after].filter((x) => !before.has(x))
    if (fresh.length) graph()?.flash(fresh)
    return true
  }

  function select(id: string | null): void {
    ui.selectedId = id
  }
  /** Перейти к дереву: выбрать, центрировать, подсветить предков. */
  function jump(id: string): void {
    ui.selectedId = id
    graph()?.focus(id)
  }

  /** Отметить выведенным: с рецептом и без bypass — открыть модалку списания. */
  function markBred(id: string): void {
    const t = BY_ID[id]
    if (t?.parents && !ui.bypass && store.progress[id] !== 2) {
      breedModalId.value = id
      return
    }
    withFlash(() => store.setState(id, 2))
  }
  function unmark(id: string): void {
    store.setState(id, 0)
  }
  function toggleBred(id: string): void {
    if (store.progress[id] === 2) unmark(id)
    else markBred(id)
  }

  // --- breed-модалка ---
  function breedConfirm(id: string, sapTree: string, polTree: string): void {
    const success = withFlash(() => store.breed(id, sapTree, polTree))
    if (!success) return
    breedModalId.value = null
  }
  function breedSkip(id: string): void {
    withFlash(() => store.setState(id, 2))
    breedModalId.value = null
  }
  function breedCancel(): void {
    breedModalId.value = null
  }

  // --- попап инвентаря ---
  function openInv(id: string, clientX: number, clientY: number): void {
    invPopup.value = {
      id,
      x: Math.min(clientX, window.innerWidth - 320),
      y: Math.min(clientY, window.innerHeight - 200),
    }
  }
  function closeInv(): void {
    invPopup.value = null
  }

  return {
    breedModalId,
    invPopup,
    select,
    jump,
    markBred,
    unmark,
    toggleBred,
    breedConfirm,
    breedSkip,
    breedCancel,
    openInv,
    closeInv,
  }
}

/** Создаёт и предоставляет действия (вызывать в корневом компоненте трекера). */
export function provideTreeActions(graph: () => GraphHandle | undefined): TreeActions {
  const actions = createTreeActions(graph)
  provide(KEY, actions)
  return actions
}

/** Получает действия в дочерних компонентах. */
export function useTreeActions(): TreeActions {
  const actions = inject(KEY)
  if (!actions) throw new Error('useTreeActions: provideTreeActions не вызван выше по дереву')
  return actions
}
