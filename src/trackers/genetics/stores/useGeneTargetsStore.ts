import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import type { TargetAlleles } from '../domain/genetics'

const KEY = 'genetics.targets'

/** Целевой геном: имя + карта признак→аллель (en). */
export interface GeneTarget {
  id: string
  name: string
  alleles: TargetAlleles
}

interface TargetsExport {
  v: 1
  targets: GeneTarget[]
  activeId: string | null
}

/** Уникальный id цели (с фолбэком, если нет secure-context crypto). */
function uid(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }
}

/** Санитизация недоверенного ввода (storage/import) до валидных целей. */
function sanitize(raw: unknown): { targets: GeneTarget[]; activeId: string | null } {
  const obj = (raw ?? {}) as Partial<TargetsExport>
  const list = Array.isArray(obj.targets) ? obj.targets : []
  const targets: GeneTarget[] = []
  for (const t of list) {
    if (!t || typeof t.id !== 'string' || typeof t.name !== 'string') continue
    const alleles: TargetAlleles = {}
    if (t.alleles && typeof t.alleles === 'object') {
      for (const [k, v] of Object.entries(t.alleles)) {
        if (typeof v === 'string' && v) alleles[k] = v
      }
    }
    targets.push({ id: t.id, name: t.name, alleles })
  }
  const activeId =
    typeof obj.activeId === 'string' && targets.some((t) => t.id === obj.activeId)
      ? obj.activeId
      : (targets[0]?.id ?? null)
  return { targets, activeId }
}

/** Целевые геномы («лоадауты») для сборки — учёт желаемых аллелей по признакам. */
export const useGeneTargetsStore = defineStore('genetics-targets', () => {
  const init = sanitize(storage.get<unknown>(KEY, null))
  const targets = ref<GeneTarget[]>(init.targets)
  const activeId = ref<string | null>(init.activeId)

  const active = computed<GeneTarget | null>(
    () => targets.value.find((t) => t.id === activeId.value) ?? null,
  )

  function persist(): void {
    storage.set(KEY, {
      v: 1,
      targets: targets.value,
      activeId: activeId.value,
    } satisfies TargetsExport)
  }

  function addTarget(name: string): string {
    const id = uid()
    targets.value = [...targets.value, { id, name: name.trim() || 'Новая цель', alleles: {} }]
    activeId.value = id
    persist()
    return id
  }
  function removeTarget(id: string): void {
    targets.value = targets.value.filter((t) => t.id !== id)
    if (activeId.value === id) activeId.value = targets.value[0]?.id ?? null
    persist()
  }
  function renameTarget(id: string, name: string): void {
    const t = targets.value.find((x) => x.id === id)
    if (t) {
      t.name = name.trim() || t.name
      persist()
    }
  }
  function setActive(id: string): void {
    if (targets.value.some((t) => t.id === id)) {
      activeId.value = id
      persist()
    }
  }
  /** Задать/снять желаемый аллель признака у цели (en пустой/null → «не важно»). */
  function setAllele(id: string, trait: string, en: string | null): void {
    const t = targets.value.find((x) => x.id === id)
    if (!t) return
    if (en) t.alleles[trait] = en
    else delete t.alleles[trait]
    persist()
  }

  function exportData(): TargetsExport {
    return { v: 1, targets: targets.value, activeId: activeId.value }
  }
  function importData(data: unknown): void {
    const s = sanitize(data)
    targets.value = s.targets
    activeId.value = s.activeId
    persist()
  }

  return {
    targets,
    activeId,
    active,
    addTarget,
    removeTarget,
    renameTarget,
    setActive,
    setAllele,
    exportData,
    importData,
  }
})
