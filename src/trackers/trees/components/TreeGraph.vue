<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { BY_ID, TIERS, TREES } from '../data/trees.data'
import { isAvailable, unlockScore } from '../domain/graph'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreeGraph, type LineageDir } from '../composables/useTreeGraph'
import type { LayoutKey } from '../graph/layouts'

const props = defineProps<{
  layout: LayoutKey
  showAllEdges: boolean
  visibleTiers: ReadonlySet<number>
  onlyAvail: boolean
  onlyFruit: boolean
  selectedId: string | null
}>()
const emit = defineEmits<{ select: [id: string | null]; jumpDir: [dir: LineageDir] }>()

const store = useTreesStore()
const stageEl = ref<HTMLElement>()
const cyEl = ref<HTMLElement>()
const headersEl = ref<HTMLElement>()

// тултип
const tip = ref<{ id: string; x: number; y: number } | null>(null)

const graph = useTreeGraph({
  onSelect: (id, shift) => {
    emit('select', id)
    graph.highlightLineage(id, shift ? 'descendants' : 'ancestors')
  },
  onBackground: () => {
    graph.clearHighlight()
    emit('select', null)
    stepIdx = 0
  },
  onHover: (id, box) => {
    if (id && box && stageEl.value) {
      const r = stageEl.value.getBoundingClientRect()
      tip.value = { id, x: r.left + box.x, y: r.top + box.y - 8 }
    } else {
      tip.value = null
    }
  },
})

function filterOpts() {
  return {
    visibleTiers: props.visibleTiers,
    onlyAvail: props.onlyAvail,
    onlyFruit: props.onlyFruit,
  }
}
const filtersActive = () =>
  props.onlyAvail || props.onlyFruit || props.visibleTiers.size < TIERS.length

function refresh() {
  graph.applyStates(store.progress)
  if (filtersActive()) graph.applyFilters(filterOpts())
}

// ---------- навбар ----------
let stepIdx = 0
function nextStep() {
  const av = TREES.filter(
    (t) => t.tier > 0 && (store.progress[t.id] ?? 0) === 0 && isAvailable(store.progress, t.id),
  ).sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id, 'ru'))
  if (!av.length) return
  const t = av[stepIdx % av.length]!
  stepIdx++
  emit('select', t.id)
  graph.focus(t.id)
}
function bestStep() {
  const av = TREES.filter(
    (t) => t.tier > 0 && (store.progress[t.id] ?? 0) === 0 && isAvailable(store.progress, t.id),
  )
  if (!av.length) return
  av.sort(
    (a, b) =>
      unlockScore(store.progress, b.id) - unlockScore(store.progress, a.id) ||
      a.tier - b.tier ||
      a.id.localeCompare(b.id, 'ru'),
  )
  emit('select', av[0]!.id)
  graph.focus(av[0]!.id)
}

const tipTree = () => (tip.value ? BY_ID[tip.value.id] : undefined)

// ---------- реакции на пропсы ----------
watch(() => store.progress, refresh, { deep: true })
watch(
  () => [props.visibleTiers, props.onlyAvail, props.onlyFruit] as const,
  () => graph.applyFilters(filterOpts()),
  { deep: true },
)
watch(
  () => props.showAllEdges,
  (on) => graph.toggleAllEdges(on),
)
watch(
  () => props.layout,
  (l) => graph.runLayout(l),
)
watch(
  () => props.selectedId,
  (id) => {
    graph.selectNode(id)
    if (id) graph.highlightLineage(id, 'ancestors')
    else graph.clearHighlight()
  },
)

// ---------- жизненный цикл ----------
let resizeTimer: ReturnType<typeof setTimeout> | null = null
function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => graph.resize(), 150)
}

onMounted(() => {
  if (!cyEl.value || !headersEl.value) return
  graph.mount(cyEl.value, headersEl.value)
  graph.onReady(() => {
    graph.runLayout(props.layout)
    refresh()
    graph.toggleAllEdges(props.showAllEdges)
    if (props.selectedId) {
      graph.selectNode(props.selectedId)
      graph.highlightLineage(props.selectedId, 'ancestors')
    }
  })
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (resizeTimer) clearTimeout(resizeTimer)
  graph.destroy()
})

defineExpose({ focus: (id: string) => graph.focus(id), search: (q: string) => graph.search(q) })
</script>

<template>
  <div ref="stageEl" class="stage">
    <div class="stage__navbar">
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
    </div>
    <div ref="headersEl" class="stage__tiers" />
    <div ref="cyEl" class="stage__cy" />

    <div
      v-if="tip && tipTree()"
      class="tooltip is-open"
      :class="`t--${tipTree()!.tier}`"
      :style="{ left: `${Math.min(Math.max(tip.x, 130), 100000)}px`, top: `${tip.y}px` }"
    >
      <div class="tooltip__name">
        {{ tip.id }} <span class="tooltip__tier">T{{ tipTree()!.tier }}</span>
      </div>
      <div v-if="tipTree()!.fruit" class="tooltip__fruit">{{ tipTree()!.fruit }}</div>
      <div class="tooltip__recipe">
        {{ tipTree()!.parents?.[0]?.join(' + ') ?? 'из мира' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  overflow: hidden;
}
.stage__cy {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
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
