<script setup lang="ts">
import { onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BEE_BY_ID } from '../data/bees.data'
import { COMBS } from '../domain/combs'
import { useBeesStore } from '../stores/useBeesStore'
import { useBeeChainGraph } from '../composables/useBeeChainGraph'
import { buildSubgraph } from '../graph/subgraph'

const store = useBeesStore()
const cyEl = ref<HTMLElement>()

const graph = useBeeChainGraph({
  curComb: () => store.curComb,
  curTarget: () => store.curTarget,
  onTapBee: (id) => {
    // производитель текущей соты → сделать целью; иначе многорецептурную — циклить
    if (
      store.curComb &&
      COMBS[store.curComb]?.some((p) => p.bee === id) &&
      id !== store.curTarget
    ) {
      store.setTarget(id)
      return
    }
    if ((BEE_BY_ID[id]?.parents.length ?? 0) > 1) store.cycleRecipe(id)
  },
  onTapRecipe: (childId) => {
    if ((BEE_BY_ID[childId]?.parents.length ?? 0) > 1) store.cycleRecipe(childId)
  },
})

function rebuild() {
  if (!store.curTarget) return
  graph.setHave(store.have)
  graph.rebuild(buildSubgraph(store.curTarget, store.have, store.rc))
}

// have — ref<Set> (заменяется целиком → триггер по ссылке); смену рецептов
// отслеживаем через rcVersion (инкремент в setRecipe/cycleRecipe).
watch(() => [store.curTarget, store.have, store.rcVersion] as const, rebuild)

onMounted(() => {
  if (cyEl.value) {
    graph.mount(cyEl.value)
    rebuild()
  }
})
onBeforeUnmount(() => graph.destroy())
// возврат на вкладку (KeepAlive): контейнер был detached → вернуть размер
// onDeactivated не нужен: граф пчёл не держит постоянных rAF-анимаций (в отличие
// от потока рёбер графа деревьев). Если такая анимация появится — добавить паузу здесь.
onActivated(() => graph.resize())

defineExpose({ fit: () => graph.fit() })
</script>

<template>
  <div ref="cyEl" class="bee-cy" />
</template>

<style scoped>
.bee-cy {
  width: 100%;
  height: 100%;
  min-height: 0;
  opacity: 0; /* проявляется после готовности графа (класс is-ready) */
}
.bee-cy.is-ready {
  opacity: 1;
  transition: opacity 0.28s ease;
}
</style>
