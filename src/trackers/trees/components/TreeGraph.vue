<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import AppLoader from '@/shared/ui/AppLoader.vue'
import TreeGraphA11y from './TreeGraphA11y.vue'
import { announce } from '@/shared/ui/useAnnouncer'
import { BY_ID, TREES } from '../data/trees.data'
import { isAvailable, unlockScore } from '../domain/graph'
import { FRUIT_CHAIN } from '../domain/plan'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'
import { useTreeActions } from '../composables/useTreeActions'
import { useTreeGraph } from '../composables/useTreeGraph'
import { treeTexturesReady } from '../composables/useTreeTextures'
import '../graph/graph.css'

const store = useTreesStore()
const ui = useTreesUiStore()
const actions = useTreeActions()

const stageEl = ref<HTMLElement>()
const cyEl = ref<HTMLElement>()
const headersEl = ref<HTMLElement>()
const tip = ref<{ id: string; x: number; y: number } | null>(null)
// лоадер поверх сцены, пока граф строится и раскладка не устаканилась (onReady)
const graphReady = ref(false)

const graph = useTreeGraph({
  onSelect: (id, shift) => {
    ui.selectedId = id
    graph.highlightLineage(id, shift ? 'descendants' : 'ancestors')
  },
  onBackground: () => {
    graph.clearHighlight()
    ui.selectedId = null
    stepIdx = 0
  },
  onInventory: (id, x, y) => actions.openInv(id, x, y),
  onHover: (id, box) => {
    if (id && box && stageEl.value) {
      const r = stageEl.value.getBoundingClientRect()
      tip.value = { id, x: r.left + box.x, y: r.top + box.y - 8 }
    } else {
      tip.value = null
    }
  },
})

// Клавиатурный выбор из доступной альтернативы: тот же эффект, что tap по ноде.
// focus() сам делает selectNode + highlightLineage(ancestors) + панораму к узлу.
function selectFromA11y(id: string) {
  ui.selectedId = id
  graph.focus(id)
  announce(`Выбрано: ${id}`)
}

const filterOpts = () => ({
  visibleTiers: ui.visibleTiers,
  onlyAvail: ui.onlyAvail,
  onlyFruit: ui.onlyFruit,
  onlyFruitful: ui.onlyFruitful,
})

function refresh() {
  graph.applyStates(store.progress)
  if (ui.filtersActive) graph.applyFilters(filterOpts())
}

// ---------- навбар ----------
let stepIdx = 0
// Кандидаты для кнопок «следующий доступный» / «лучший шаг» (и шага тура «лучший выбор»):
// доступные ноды, ВИДИМЫЕ при текущих фильтрах — иначе кнопка сфокусировалась бы на скрытой
// ноде и панорама уехала бы в пустоту. onlyAvail тут самоудовлетворён (кандидаты по определению
// доступны), поэтому учитываем onlyFruit, onlyFruitful и фильтр тиров — они скрывают доступные ноды.
function availSorted() {
  return TREES.filter(
    (t) =>
      t.tier > 0 &&
      (store.progress[t.id] ?? 0) === 0 &&
      isAvailable(store.progress, t.id) &&
      ui.visibleTiers.has(t.tier) &&
      (!ui.onlyFruit || FRUIT_CHAIN.has(t.id)) &&
      (!ui.onlyFruitful || !!t.fruit),
  )
}
function nextStep() {
  const av = availSorted().sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id, 'ru'))
  if (!av.length) return
  const t = av[stepIdx % av.length]!
  stepIdx++
  ui.selectedId = t.id
  graph.focus(t.id)
}
/** id лучшего доступного дерева (макс. разблокировка) или null. */
function bestAvailId(): string | null {
  const av = availSorted()
  if (!av.length) return null
  av.sort(
    (a, b) =>
      unlockScore(store.progress, b.id) - unlockScore(store.progress, a.id) ||
      a.tier - b.tier ||
      a.id.localeCompare(b.id, 'ru'),
  )
  return av[0]!.id
}
function bestStep() {
  const id = bestAvailId()
  if (!id) return
  ui.selectedId = id
  graph.focus(id)
}

const tipTree = () => (tip.value ? BY_ID[tip.value.id] : undefined)

// ---------- реакции на состояние ----------
watch(() => store.progress, refresh, { deep: true })
watch(
  () => [[...ui.visibleTiers], ui.onlyAvail, ui.onlyFruit, ui.onlyFruitful] as const,
  () => graph.applyFilters(filterOpts()),
  { deep: true },
)
watch(
  () => ui.showAllEdges,
  (on) => graph.toggleAllEdges(on),
)
watch(
  () => ui.layout,
  (l) => graph.runLayout(l),
)
watch(
  () => ui.selectedId,
  (id) => graph.selectNode(id),
)
// текстуры иконок догрузились → перекрасить
watch(treeTexturesReady, (ready) => ready && graph.repaintIcons())
watch(
  () => ui.searchQuery,
  (q) => {
    if (ui.filtersActive) graph.applyFilters(filterOpts())
    const ids = graph.search(q)
    if (ids.length === 1) {
      ui.selectedId = ids[0]!
      graph.focus(ids[0]!)
    }
  },
)

// ---------- жизненный цикл ----------
let resizeTimer: ReturnType<typeof setTimeout> | null = null
function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => graph.resize(), 150)
}

onMounted(() => {
  // Отложенная сборка: даём шапке/сайдбару отрисоваться, тяжёлый cy строим в след. кадре.
  requestAnimationFrame(() => {
    if (!cyEl.value || !headersEl.value) return
    graph.mount(cyEl.value, headersEl.value)
    graph.onReady(() => {
      graph.runLayout(ui.layout)
      refresh()
      graph.toggleAllEdges(ui.showAllEdges)
      if (ui.selectedId) {
        graph.selectNode(ui.selectedId)
        graph.highlightLineage(ui.selectedId, 'ancestors')
      }
      // запускаем вход ПОСЛЕ применения состояний — иначе пересоздание карточек
      // (data-события от applyStates) перезапустило бы анимацию входа.
      graph.playIntro()
      graphReady.value = true
    })
  })
  window.addEventListener('resize', onResize)
})

// Возврат на вкладку (KeepAlive): ресинхронизировать размер; возобновить поток рёбер,
// если есть активная подсветка.
onActivated(() => {
  graph.revalidateSize()
  graph.resumeEdgeFlow()
})
// Уход с вкладки: остановить rAF потока, чтобы не крутился на скрытом графе.
onDeactivated(() => graph.pauseEdgeFlow())
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (resizeTimer) clearTimeout(resizeTimer)
  graph.destroy()
})

defineExpose({
  focus: (id: string) => graph.focus(id),
  flash: (ids: string[]) => graph.flash(ids),
  // для онбординг-тура:
  tourBestId: (): string | null => bestAvailId(),
  tourSpotlight: async (id: string): Promise<void> => {
    ui.selectedId = id
    await graph.tourFocus(id)
  },
  isReady: (): boolean => graphReady.value,
})
</script>

<template>
  <div ref="stageEl" class="stage">
    <div class="stage__navbar" data-tour="trees-navbar">
      <button class="btn" type="button" title="К ближайшему доступному дереву" @click="nextStep">
        <IconBase name="target" />К следующему доступному
      </button>
      <button
        class="btn"
        type="button"
        title="Доступное дерево с макс. разблокировкой"
        @click="bestStep"
      >
        <IconBase name="bolt" />Лучший шаг
      </button>
      <button class="btn" type="button" title="Вписать весь граф" @click="graph.fit()">
        <IconBase name="fit" />Вписать
      </button>
      <button
        class="btn"
        type="button"
        :class="{ 'btn--on': ui.showAllEdges }"
        title="Показывать все рёбра или только родословную"
        @click="ui.showAllEdges = !ui.showAllEdges"
      >
        <IconBase name="branch" />Все рёбра
      </button>
    </div>
    <div ref="headersEl" class="stage__tiers" />
    <p id="trees-graph-desc" class="sr-only">
      Интерактивный граф селекции деревьев. Доступный список узлов ниже — выберите узел, чтобы
      подсветить его родословную.
    </p>
    <div
      ref="cyEl"
      class="stage__cy"
      role="application"
      aria-label="Граф селекции деревьев"
      aria-describedby="trees-graph-desc"
    />
    <TreeGraphA11y @select="selectFromA11y" />

    <Transition name="stage-load">
      <div v-if="!graphReady" class="stage__loading">
        <AppLoader label="Строим граф…" />
      </div>
    </Transition>

    <div
      v-if="tip && tipTree()"
      class="tooltip is-open"
      :class="`t--${tipTree()!.tier}`"
      :style="{ left: `${Math.max(tip.x, 130)}px`, top: `${tip.y}px` }"
    >
      <div class="tooltip__name">
        {{ tip.id }} <span class="tooltip__tier">T{{ tipTree()!.tier }}</span>
      </div>
      <div v-if="tipTree()!.fruit" class="tooltip__fruit">{{ tipTree()!.fruit }}</div>
      <div class="tooltip__recipe">{{ tipTree()!.parents?.[0]?.join(' + ') ?? 'из мира' }}</div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  overflow: hidden;
}
/* оверлей-лоадер поверх сцены, пока граф строится (до onReady) */
.stage__loading {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  background: var(--bg, #12190f);
}
.stage-load-leave-active {
  transition: opacity 0.3s ease;
}
.stage-load-leave-to {
  opacity: 0;
}
.stage__cy {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  /* проявляется один раз после того, как лейаут устаканится (класс is-ready) —
     прячет «прыжок» нод из preset-позиций в раскладку */
  opacity: 0;
}
.stage__cy.is-ready {
  opacity: 1;
  transition: opacity 0.3s ease;
}
.stage__navbar {
  position: absolute;
  left: 14px;
  top: 46px;
  z-index: 20;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.stage__navbar .btn {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  background: rgba(18, 27, 21, 0.85);
}
.stage__tiers {
  position: absolute;
  left: 0;
  top: 0;
  height: 30px;
  right: 0;
  pointer-events: none;
  z-index: 15;
  overflow: hidden;
}
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 12.5px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--edge);
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.15s;
}
.btn :deep(.icon) {
  font-size: 15px;
  color: var(--leaf);
}
.btn:hover {
  background: rgba(143, 209, 79, 0.12);
  border-color: var(--leaf-dim);
}
.btn--on {
  background: rgba(143, 209, 79, 0.16);
  border-color: var(--leaf-dim);
  color: var(--leaf);
}
.tooltip {
  position: fixed;
  z-index: 160;
  max-width: 240px;
  pointer-events: none;
  background: #15201a;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  transform: translate(-50%, -100%);
}
.tooltip__name {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tooltip__tier {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--dark-ink);
  background: var(--tc);
  padding: 1px 6px;
  border-radius: 8px;
}
.tooltip__fruit {
  color: var(--amber);
  margin-top: 3px;
}
.tooltip__recipe {
  color: var(--muted);
  margin-top: 3px;
}
</style>
