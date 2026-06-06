<script setup lang="ts">
import { onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BEE_BY_ID } from '../data/bees.data'
import { COMBS } from '../domain/combs'
import { useBeesStore } from '../stores/useBeesStore'
import { useBeesUiStore } from '../stores/useBeesUiStore'
import { useBeeChainGraph } from '../composables/useBeeChainGraph'
import { buildSubgraph } from '../graph/subgraph'
import BeeChainGraphA11y from './BeeChainGraphA11y.vue'
import { announce } from '@/shared/ui/useAnnouncer'
import '../graph/graph.css'

const store = useBeesStore()
const ui = useBeesUiStore()
const cyEl = ref<HTMLElement>()

// Единый путь выбора узла (мышь и клавиатура): производитель текущей соты →
// сделать целью; иначе многорецептурную пчелу — циклить рецепт. Озвучиваем для AT.
function tapBee(id: string): void {
  if (ui.curComb && COMBS[ui.curComb]?.some((p) => p.bee === id) && id !== ui.curTarget) {
    ui.setTarget(id)
    announce(`Цель выведения: ${id}`)
    return
  }
  if ((BEE_BY_ID[id]?.parents.length ?? 0) > 1) {
    store.cycleRecipe(id)
    announce(`Рецепт изменён: ${id}`)
  }
}

const graph = useBeeChainGraph({
  curComb: () => ui.curComb,
  curTarget: () => ui.curTarget,
  onTapBee: tapBee,
  onTapRecipe: (childId) => {
    if ((BEE_BY_ID[childId]?.parents.length ?? 0) > 1) store.cycleRecipe(childId)
  },
})

function rebuild() {
  if (!ui.curTarget) return
  graph.setHave(store.have)
  graph.rebuild(buildSubgraph(ui.curTarget, store.have, store.rc))
}

// have — ref<Set> (заменяется целиком → триггер по ссылке); смену рецептов
// отслеживаем через rcVersion (инкремент в setRecipe/cycleRecipe).
watch(() => [ui.curTarget, store.have, store.rcVersion] as const, rebuild)

onMounted(() => {
  if (cyEl.value) {
    graph.mount(cyEl.value)
    rebuild()
  }
})
onBeforeUnmount(() => graph.destroy())
// возврат на вкладку (KeepAlive): контейнер был detached → вернуть размер и вписать.
// fit нужен потому, что при переходе из генетики цель ставится, пока вьюха неактивна,
// и rebuild фитит граф на контейнере нулевого размера — здесь вписываем уже по факту.
// onDeactivated не нужен: граф пчёл не держит постоянных rAF-анимаций.
onActivated(() => {
  graph.resize()
  requestAnimationFrame(() => graph.fit())
})

defineExpose({ fit: () => graph.fit() })
</script>

<template>
  <div class="bee-graph">
    <p id="bees-graph-desc" class="sr-only">
      Интерактивный граф цепочки выведения пчёл. Доступный список узлов ниже — выберите узел, чтобы
      сменить цель или переключить рецепт.
    </p>
    <div
      ref="cyEl"
      class="bee-cy"
      role="application"
      aria-label="Цепочка выведения пчёл"
      aria-describedby="bees-graph-desc"
    />
    <BeeChainGraphA11y @select="tapBee" />
  </div>
</template>

<style scoped>
.bee-graph {
  display: flex;
  min-height: 0;
}
.bee-cy {
  flex: 1;
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
