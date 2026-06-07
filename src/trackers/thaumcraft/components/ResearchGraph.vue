<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResearchGraph } from '../graph/useResearchGraph'
import { buildGoalElements } from '../graph/elements'
import '../graph/graph.css'

const props = defineProps<{
  selectedKey: string | null
  done: ReadonlySet<string>
  goal: string | null
}>()

const emit = defineEmits<{ select: [key: string] }>()

const cyEl = ref<HTMLElement>()

const graph = useResearchGraph({ onTap: (key) => emit('select', key) })

function rebuild(): void {
  if (!props.goal) return // граф без цели не строим — показываем подсказку
  const ctx = { done: props.done, goal: props.goal, selected: props.selectedKey }
  graph.rebuild(buildGoalElements(props.goal, ctx), 'dagre')
}

const hasGoal = computed(() => !!props.goal)

// смена цели → полная пересборка с релэйаутом
watch(() => props.goal, rebuild)
// смена прогресса/выбора → только перекраска нод (без пересборки, не сбивает пан/зум)
watch(
  () => [props.selectedKey, props.done] as const,
  () => graph.restyle({ done: props.done, goal: props.goal, selected: props.selectedKey }),
)

onMounted(() => {
  if (cyEl.value) {
    graph.mount(cyEl.value)
    rebuild()
  }
})
onBeforeUnmount(() => graph.destroy())
// возврат на вкладку (KeepAlive): контейнер мог быть detached → вернуть размер и вписать
onActivated(() => {
  graph.resize()
  requestAnimationFrame(() => graph.fit())
})
</script>

<template>
  <div class="rg">
    <div class="rg__bar">
      <span class="rg__lab">Что нужно изучить до цели</span>
      <button v-if="hasGoal" type="button" class="rg__fit" @click="graph.fit()">Вписать</button>
    </div>

    <div v-if="!hasGoal" class="rg__hint">
      <p>Выберите свиток-цель в Списке — здесь покажем всю цепочку предпосылок до него.</p>
    </div>
    <div
      v-show="hasGoal"
      ref="cyEl"
      class="rg__cy"
      role="application"
      aria-label="Граф предпосылок исследования"
    />
  </div>
</template>

<style scoped>
.rg {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.rg__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--cardln);
}
.rg__lab {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--honey-dk);
}
.rg__fit {
  margin-left: auto;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  color: var(--alt);
  background: var(--bg2);
  border: 1px solid var(--solid);
  border-radius: 8px;
  padding: 5px 12px;
  cursor: pointer;
}
.rg__fit:hover {
  background: rgba(160, 107, 255, 0.12);
}
.rg__fit:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 2px;
}
.rg__cy {
  flex: 1;
  width: 100%;
  min-height: 0;
  opacity: 0;
}
.rg__cy.is-ready {
  opacity: 1;
  transition: opacity 0.28s ease;
}
.rg__hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}
</style>
