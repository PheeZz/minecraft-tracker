<script setup lang="ts">
import { onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { useTreesStore } from '../stores/useTreesStore'
import { provideTreeActions, type GraphHandle } from '../composables/useTreeActions'
import TreeGraph from './TreeGraph.vue'
import TreeSidebar from './TreeSidebar.vue'
import HeroStats from './HeroStats.vue'
import BreedModal from './BreedModal.vue'
import CelebrationModal from './CelebrationModal.vue'
import InventoryPopup from './InventoryPopup.vue'
import { useTreesCelebration } from '../stores/useTreesCelebration'
import { useOnboardingSeen } from '@/shared/composables/useOnboardingSeen'
import { useTour } from '@/shared/ui/useTour'
import { buildTreesTour } from '../onboarding/treesTour'

const store = useTreesStore()
const graphRef = ref<InstanceType<typeof TreeGraph>>()
// инстанцируем стор празднования: его вотчеры ловят 100% (живой переход / импорт / загрузку)
useTreesCelebration()

const onboarding = useOnboardingSeen('trees')

const tour = useTour(
  () =>
    buildTreesTour({
      tourBestId: () => graphRef.value?.tourBestId() ?? null,
      tourSpotlight: (id) => graphRef.value?.tourSpotlight(id) ?? Promise.resolve(),
    }),
  { onDone: () => onboarding.markSeen() },
)

// авто-старт один раз, когда граф готов (ноды отрисованы → можно якориться)
let autoStarted = false
watch(
  () => graphRef.value?.isReady?.(),
  (ready) => {
    if (ready && !autoStarted && !onboarding.seen()) {
      autoStarted = true
      void tour.start()
    }
  },
  { immediate: true },
)

// Действия предоставляются с ленивым доступом к графу (заполнится после mount).
provideTreeActions(() => graphRef.value as GraphHandle | undefined)

// под KeepAlive вьюха не размонтируется при switch — хоткеи не должны
// срабатывать, когда трекер в фоне (например Ctrl+Z с вкладки пчёл)
const active = ref(true)
onActivated(() => (active.value = true))
onDeactivated(() => (active.value = false))

function onKey(e: KeyboardEvent) {
  if (!active.value) return
  const meta = e.ctrlKey || e.metaKey
  if (meta && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) store.redo()
    else store.undo()
  } else if (meta && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    store.redo()
  }
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="trees">
    <header class="topbar">
      <div class="brand">
        <IconBase name="leaf" class="brand__mark" />
        <div>
          <h1 class="brand__title">Селекция деревьев</h1>
          <div class="brand__sub">Forestry · Вселенское рагу</div>
        </div>
      </div>
      <HeroStats />
      <button class="topbar__tour" type="button" title="Запустить обзор" @click="tour.start()">
        ? Обзор
      </button>
    </header>

    <div class="workspace">
      <TreeGraph ref="graphRef" />
      <TreeSidebar />
    </div>

    <BreedModal />
    <CelebrationModal />
    <InventoryPopup />
  </div>
</template>

<style scoped>
.trees {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 13px 22px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(143, 209, 79, 0.04), transparent);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}
.brand__mark {
  font-size: 26px;
  color: var(--leaf);
  filter: drop-shadow(0 0 10px rgba(143, 209, 79, 0.45));
  display: flex;
}
.brand__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 23px;
  letter-spacing: -0.5px;
  margin: 0;
  color: #cfe0c2;
}
.brand__sub {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 10.5px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--leaf-dim);
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 480px;
  min-height: 0;
}
.topbar__tour {
  margin-left: auto;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink2, #cdbb98);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 7px 12px;
  cursor: pointer;
  white-space: nowrap;
}
.topbar__tour:hover {
  border-color: var(--leaf, var(--honey-dk));
  color: var(--leaf, var(--honey-dk));
}
</style>
