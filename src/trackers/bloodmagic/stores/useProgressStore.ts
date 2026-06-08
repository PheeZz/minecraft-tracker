// Стор прогрессии алтаря: какие тиры уже построены.
// Только состояние + мутации; доменные расчёты — в domain/progression.ts.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/shared/persistence/storage'

const STORAGE_KEY = 'bloodmagic.builtTiers'

/** Загружает множество построенных тиров из localStorage. */
function loadBuiltTiers(): Set<number> {
  const saved = storage.get<number[]>(STORAGE_KEY, [])
  const valid = Array.isArray(saved) ? saved.filter((n) => typeof n === 'number') : []
  return new Set(valid)
}

export const useProgressStore = defineStore('bloodmagic-progress', () => {
  const builtTiers = ref<Set<number>>(loadBuiltTiers())

  function persist(): void {
    storage.set(STORAGE_KEY, [...builtTiers.value])
  }

  /** Переключает отметку «построено» для тира n. */
  function toggleTier(n: number): void {
    const next = new Set(builtTiers.value)
    if (next.has(n)) next.delete(n)
    else next.add(n)
    builtTiers.value = next
    persist()
  }

  /** Возвращает true если тир n отмечен как построенный. */
  function isBuilt(n: number): boolean {
    return builtTiers.value.has(n)
  }

  return { builtTiers, toggleTier, isBuilt }
})
