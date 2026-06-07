import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storage } from '@/shared/persistence/storage'
import { RESEARCH_BY_KEY } from '../domain/research'

const KEY = 'thaumcraft.research'
const GOAL_KEY = 'thaumcraft.goal'

interface ResearchExport {
  v: 1
  research: string[]
  goal?: string | null
}

/** Прогресс изучения свитков: множество ключей исследований + активная цель. */
export const useResearchStore = defineStore('thaumcraft-research', () => {
  const saved = storage.get<string[]>(KEY, [])
  const done = ref<Set<string>>(
    new Set(Array.isArray(saved) ? saved.filter((x) => typeof x === 'string') : []),
  )
  const savedGoal = storage.get<string | null>(GOAL_KEY, null)
  // отбрасываем «висячую» цель на удалённый/переименованный ключ
  const goal = ref<string | null>(
    typeof savedGoal === 'string' && RESEARCH_BY_KEY.has(savedGoal) ? savedGoal : null,
  )

  const count = computed(() => done.value.size)

  function persist(): void {
    storage.set(KEY, [...done.value])
  }

  function isDone(key: string): boolean {
    return done.value.has(key)
  }

  function toggle(key: string): void {
    const next = new Set(done.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    done.value = next
    persist()
  }

  function setGoal(key: string | null): void {
    goal.value = key
    storage.set(GOAL_KEY, key)
  }

  function clear(): void {
    done.value = new Set()
    persist()
  }

  function exportData(): ResearchExport {
    return { v: 1, research: [...done.value], goal: goal.value }
  }

  function importData(data: ResearchExport): void {
    const list = Array.isArray(data?.research)
      ? data.research.filter((x): x is string => typeof x === 'string')
      : []
    done.value = new Set(list)
    persist()
    const g = data?.goal
    setGoal(typeof g === 'string' && RESEARCH_BY_KEY.has(g) ? g : null)
  }

  return { done, goal, count, isDone, toggle, setGoal, clear, exportData, importData }
})
