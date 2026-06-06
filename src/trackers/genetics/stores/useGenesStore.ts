import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { geneKey } from '../domain/genetics'

const KEY = 'genetics.genes'

interface GenesExport {
  v: 1
  genes: string[]
}

/** Собранные (изолированные) гены: множество ключей `trait|allele`. */
export const useGenesStore = defineStore('genetics-genes', () => {
  const saved = storage.get<string[]>(KEY, [])
  const genes = ref<Set<string>>(
    new Set(Array.isArray(saved) ? saved.filter((x) => typeof x === 'string') : []),
  )

  const count = computed(() => genes.value.size)

  function persist(): void {
    storage.set(KEY, [...genes.value])
  }

  function has(trait: string, en: string): boolean {
    return genes.value.has(geneKey(trait, en))
  }

  function toggle(trait: string, en: string): void {
    const k = geneKey(trait, en)
    const next = new Set(genes.value)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    genes.value = next
    persist()
  }

  function clear(): void {
    genes.value = new Set()
    persist()
  }

  function exportData(): GenesExport {
    return { v: 1, genes: [...genes.value] }
  }

  function importData(data: GenesExport): void {
    const list = Array.isArray(data?.genes)
      ? data.genes.filter((x): x is string => typeof x === 'string')
      : []
    genes.value = new Set(list)
    persist()
  }

  return { genes, count, has, toggle, clear, exportData, importData }
})
