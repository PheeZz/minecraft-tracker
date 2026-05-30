<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { useTreesStore } from '../stores/useTreesStore'
import { provideTreeActions, type GraphHandle } from '../composables/useTreeActions'
import TreeGraph from './TreeGraph.vue'
import TreeSidebar from './TreeSidebar.vue'
import HeroStats from './HeroStats.vue'
import BreedModal from './BreedModal.vue'
import InventoryPopup from './InventoryPopup.vue'

const store = useTreesStore()
const graphRef = ref<InstanceType<typeof TreeGraph>>()

// Действия предоставляются с ленивым доступом к графу (заполнится после mount).
provideTreeActions(() => graphRef.value as GraphHandle | undefined)

function onKey(e: KeyboardEvent) {
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
    </header>

    <div class="workspace">
      <TreeGraph ref="graphRef" />
      <TreeSidebar />
    </div>

    <BreedModal />
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
</style>
