import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { BY_ID, STARTING_SAPLINGS, TREES } from '../data/trees.data'
import { isAvailable, type ProgressMap } from '../domain/graph'
import { FRUIT_CHAIN, UNIQUE_FRUITS, computeUsage, fruitUnlocked, invTotal } from '../domain/plan'
import type { Inventory, TreeState } from '../domain/types'
import { parseTreesImport } from '../domain/migrate'

const PROGRESS_KEY = 'trees.progress'
const INVENTORY_KEY = 'trees.inventory'
const HISTORY_LIMIT = 200

type ProgressState = Record<string, TreeState>
type InventoryState = Record<string, Inventory>
type InvKind = keyof Inventory // 'sap' | 'pol'

interface Snapshot {
  progress: ProgressState
  inventory: InventoryState
}

interface ExportPayload {
  v: 3
  exported: string
  progress: ProgressState
  inventory: InventoryState
}

/** Глубокая копия инвентаря (без structuredClone — он не клонирует Vue-прокси). */
function cloneInventory(inv: InventoryState): InventoryState {
  const out: InventoryState = {}
  for (const id of Object.keys(inv)) {
    const v = inv[id]!
    out[id] = { sap: v.sap, pol: v.pol }
  }
  return out
}

/** Состояние прогресса по умолчанию: стартовые саженцы получены, остальное — нет. */
function defaultProgress(): ProgressState {
  const s: ProgressState = {}
  for (const t of TREES) s[t.id] = STARTING_SAPLINGS.has(t.id) ? 2 : 0
  return s
}

function loadProgress(): ProgressState {
  const saved = storage.get<Partial<ProgressState>>(PROGRESS_KEY, {})
  const s = defaultProgress()
  for (const id of Object.keys(saved)) {
    if (id in BY_ID && (saved[id] === 0 || saved[id] === 2)) s[id] = saved[id]
  }
  return s
}

function loadInventory(): InventoryState {
  const saved = storage.get<Record<string, Partial<Inventory>>>(INVENTORY_KEY, {})
  const inv: InventoryState = {}
  for (const id of Object.keys(saved)) {
    if (!(id in BY_ID)) continue
    const v = saved[id] ?? {}
    inv[id] = { sap: Math.max(0, v.sap ?? 0), pol: Math.max(0, v.pol ?? 0) }
  }
  return inv
}

export const useTreesStore = defineStore('trees', () => {
  const progress = ref<ProgressState>(loadProgress())
  const inventory = ref<InventoryState>(loadInventory())

  const undoStack = ref<Snapshot[]>([])
  const redoStack = ref<Snapshot[]>([])

  // ---------- персистентность ----------
  function persist(): void {
    storage.set(PROGRESS_KEY, progress.value)
    storage.set(INVENTORY_KEY, inventory.value)
  }

  // ---------- история (undo/redo) ----------
  function snapshot(): Snapshot {
    return {
      progress: { ...progress.value },
      inventory: cloneInventory(inventory.value),
    }
  }
  function pushHistory(): void {
    undoStack.value.push(snapshot())
    if (undoStack.value.length > HISTORY_LIMIT) undoStack.value.shift()
    redoStack.value = []
  }
  function applySnapshot(s: Snapshot): void {
    progress.value = { ...s.progress }
    inventory.value = cloneInventory(s.inventory)
    persist()
  }
  function undo(): void {
    const prev = undoStack.value.pop()
    if (!prev) return
    redoStack.value.push(snapshot())
    applySnapshot(prev)
  }
  function redo(): void {
    const next = redoStack.value.pop()
    if (!next) return
    undoStack.value.push(snapshot())
    applySnapshot(next)
  }
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  // ---------- инвентарь ----------
  function inv(id: string): Inventory {
    return inventory.value[id] ?? { sap: 0, pol: 0 }
  }
  /** Атомарная мутация инвентаря без истории/persist — для составных действий. */
  function setInvRaw(id: string, kind: InvKind, value: number): void {
    const cur = inventory.value[id] ?? { sap: 0, pol: 0 }
    inventory.value[id] = { ...cur, [kind]: Math.max(0, Math.trunc(value)) }
  }
  /** Устанавливает абсолютное значение саженцев/пыльцы (один пользовательский акт = один снапшот). */
  function setInv(id: string, kind: InvKind, value: number): void {
    pushHistory()
    setInvRaw(id, kind, value)
    persist()
  }
  /** Изменяет счётчик на delta (кнопки +/-). */
  function adjustInv(id: string, kind: InvKind, delta: number): void {
    setInv(id, kind, inv(id)[kind] + delta)
  }
  /**
   * При получении дерева у игрока автоматически есть 1 его саженец.
   * Не понижаем, если саженцев уже больше; на снятие отметки (→0) не трогаем.
   * Без истории/persist — вызывается внутри breed()/setState() под одним снапшотом.
   */
  function ensureOwnSapling(id: string): void {
    setInvRaw(id, 'sap', Math.max(inventory.value[id]?.sap ?? 0, 1))
  }

  // ---------- прогресс ----------
  /**
   * Прямая установка состояния дерева БЕЗ списания ингредиентов.
   * Это «bypass»-путь оригинала (ragu.html: bypassBreed) и снятие отметки (→ 0).
   * Решение «спросить списание» (askBreed) принимает UI-слой: для выведения
   * с рецептом он вызывает breed(), иначе — setState().
   */
  function setState(id: string, state: TreeState): boolean {
    if (!(id in BY_ID)) return false
    pushHistory()
    progress.value[id] = state
    if (state === 2) ensureOwnSapling(id)
    persist()
    return true
  }
  /**
   * Отметить дерево выведенным со списанием 1 саженца у sapTree и 1 пыльцы у polTree.
   * Возвращает false без изменений, если ресурса не хватает.
   */
  function breed(id: string, sapTree: string, polTree: string): boolean {
    if (!(id in BY_ID)) return false
    const haveSap = inventory.value[sapTree]?.sap ?? 0
    const havePol = inventory.value[polTree]?.pol ?? 0
    if (haveSap < 1 || havePol < 1) return false
    pushHistory()
    setInvRaw(sapTree, 'sap', haveSap - 1)
    setInvRaw(polTree, 'pol', havePol - 1)
    progress.value[id] = 2
    ensureOwnSapling(id)
    persist()
    return true
  }

  // ---------- сброс / экспорт / импорт ----------
  function reset(): void {
    pushHistory()
    progress.value = defaultProgress()
    inventory.value = {}
    for (const id of STARTING_SAPLINGS) ensureOwnSapling(id)
    persist()
  }

  function exportData(): ExportPayload {
    return {
      v: 3,
      exported: new Date().toISOString(),
      progress: { ...progress.value },
      inventory: cloneInventory(inventory.value),
    }
  }
  /** Импорт с версионной проверкой. Неизвестные id игнорируются. */
  function importData(payload: unknown): void {
    const parsed = parseTreesImport(payload)
    if (!parsed.ok) {
      console.warn('[trees] импорт отклонён:', parsed.reason)
      return
    }
    const { progress: pIn, inventory: iIn } = parsed.data
    pushHistory()
    for (const id of Object.keys(pIn)) {
      const v = pIn[id]
      if (id in BY_ID && (v === 0 || v === 2)) progress.value[id] = v as TreeState
    }
    for (const id of Object.keys(iIn)) {
      if (!(id in BY_ID)) continue
      const v = (iIn[id] as Partial<Inventory>) ?? { sap: 0, pol: 0 }
      inventory.value[id] = { sap: Math.max(0, v.sap ?? 0), pol: Math.max(0, v.pol ?? 0) }
    }
    persist()
  }

  // ---------- производные метрики (hero) ----------
  const hero = computed(() => {
    const breedable = TREES.filter((t) => t.tier > 0)
    const bred = breedable.filter((t) => progress.value[t.id] === 2).length
    const available = breedable.filter(
      (t) => (progress.value[t.id] ?? 0) === 0 && isAvailable(progress.value, t.id),
    ).length
    const fruitsTotal = UNIQUE_FRUITS.length
    const fruitsUnlockedCount = UNIQUE_FRUITS.filter((f) => fruitUnlocked(progress.value, f)).length
    const pct = breedable.length ? Math.round((bred / breedable.length) * 100) : 0
    const fruitPct = fruitsTotal ? Math.round((fruitsUnlockedCount / fruitsTotal) * 100) : 0

    // Саженцы и пыльца взаимозаменяемы: полезный вклад делим поровну между трекерами
    // (ceil → саженцы, floor → пыльца), капаем числом оставшихся скрещиваний.
    const remaining = [...FRUIT_CHAIN]
      .map((id) => BY_ID[id])
      .filter((t): t is NonNullable<typeof t> => !!t && t.tier > 0 && progress.value[t.id] !== 2)
    const planSap = remaining.length
    const planPol = remaining.length
    const usageRemain = computeUsage(remaining)
    let haveSap = 0
    let havePol = 0
    for (const id of Object.keys(inventory.value)) {
      const need = usageRemain[id] ?? 0
      if (!need) continue
      const useful = Math.min(invTotal(inv(id)), need)
      haveSap += Math.ceil(useful / 2)
      havePol += Math.floor(useful / 2)
    }
    haveSap = Math.min(haveSap, planSap)
    havePol = Math.min(havePol, planPol)

    return {
      bred,
      breedableTotal: breedable.length,
      available,
      fruitsUnlocked: fruitsUnlockedCount,
      fruitsTotal,
      pct,
      fruitPct,
      haveSap,
      planSap,
      havePol,
      planPol,
    }
  })

  /** Прогресс как ProgressMap (для передачи в домен-функции). */
  const progressMap = computed<ProgressMap>(() => progress.value)

  return {
    progress,
    inventory,
    progressMap,
    canUndo,
    canRedo,
    hero,
    inv,
    setInv,
    adjustInv,
    setState,
    breed,
    reset,
    exportData,
    importData,
    undo,
    redo,
  }
})
