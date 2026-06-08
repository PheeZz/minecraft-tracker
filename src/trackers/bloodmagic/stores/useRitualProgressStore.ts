// Стор прогресса ритуалов: какие ритуалы уже построены/разблокированы.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/shared/persistence/storage'

const STORAGE_KEY = 'bloodmagic.unlockedRituals'

function loadUnlockedRituals(): Set<string> {
  const saved = storage.get<string[]>(STORAGE_KEY, [])
  const valid = Array.isArray(saved) ? saved.filter((k) => typeof k === 'string') : []
  return new Set(valid)
}

export const useRitualProgressStore = defineStore('bloodmagic-ritual-progress', () => {
  const unlockedKeys = ref<Set<string>>(loadUnlockedRituals())

  function persist(): void {
    storage.set(STORAGE_KEY, [...unlockedKeys.value])
  }

  /** Переключает отметку «разблокирован» для ритуала с ключом key. */
  function toggleRitual(key: string): void {
    const next = new Set(unlockedKeys.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    unlockedKeys.value = next
    persist()
  }

  /** true если ритуал key отмечен как разблокированный. */
  function isUnlocked(key: string): boolean {
    return unlockedKeys.value.has(key)
  }

  return { unlockedKeys, toggleRitual, isUnlocked }
})
