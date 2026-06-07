<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AspectsPanel from './AspectsPanel.vue'
import ScrollsPanel from './ScrollsPanel.vue'
import RecipesPanel from './RecipesPanel.vue'
import ScansPanel from './ScansPanel.vue'
import ReferencePanel from './ReferencePanel.vue'
import { useTour } from '@/shared/ui/useTour'
import { useOnboardingSeen } from '@/shared/composables/useOnboardingSeen'
import { buildThaumcraftTour } from '../onboarding/thaumcraftTour'
import { storage } from '@/shared/persistence/storage'

type Panel = 'scrolls' | 'aspects' | 'recipes' | 'scans' | 'reference'
const PANELS: { id: Panel; label: string }[] = [
  { id: 'scrolls', label: 'Свитки' },
  { id: 'aspects', label: 'Аспекты' },
  { id: 'recipes', label: 'Рецепты' },
  { id: 'scans', label: 'Сканы' },
  { id: 'reference', label: 'Справочник' },
]
// активная вкладка сохраняется — при возврате в раздел открывается она же
const PANEL_KEY = 'thaumcraft.panel'
const savedPanel = storage.get<string>(PANEL_KEY, 'scrolls')
const panel = ref<Panel>(
  PANELS.some((p) => p.id === savedPanel) ? (savedPanel as Panel) : 'scrolls',
)
watch(panel, (p) => storage.set(PANEL_KEY, p))

// ── Обучение (как в пчёлах/генетике): авто-старт при первом визите ──
const onboarding = useOnboardingSeen('thaumcraft')
const tour = useTour(() => buildThaumcraftTour({ setPanel: (p) => (panel.value = p) }), {
  onDone: () => {
    onboarding.markSeen()
    panel.value = 'scrolls'
  },
})
let autoStartTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (!onboarding.seen()) autoStartTimer = setTimeout(() => void tour.start(), 500)
})
onBeforeUnmount(() => {
  clearTimeout(autoStartTimer)
  tour.destroy()
})
</script>

<template>
  <div class="thaum">
    <nav class="thaum__nav" data-tour="thaumcraft-nav" aria-label="Разделы Thaumcraft">
      <div class="thaum__tabs" role="group">
        <button
          v-for="p in PANELS"
          :key="p.id"
          type="button"
          class="thaum__tab"
          :class="{ on: panel === p.id }"
          :aria-pressed="panel === p.id"
          @click="panel = p.id"
        >
          {{ p.label }}
        </button>
      </div>
      <button
        type="button"
        class="thaum__tour"
        title="Запустить обучение по разделу"
        @click="tour.start()"
      >
        Обзор
      </button>
    </nav>

    <div class="thaum__body" data-tour="thaumcraft-body">
      <Transition name="tpanel" mode="out-in">
        <ScrollsPanel v-if="panel === 'scrolls'" key="scrolls" />
        <AspectsPanel v-else-if="panel === 'aspects'" key="aspects" />
        <RecipesPanel v-else-if="panel === 'recipes'" key="recipes" />
        <ScansPanel v-else-if="panel === 'scans'" key="scans" />
        <ReferencePanel v-else-if="panel === 'reference'" key="reference" />
        <section v-else :key="panel" class="thaum__placeholder">
          <p>Раздел «{{ PANELS.find((p) => p.id === panel)?.label }}» — в разработке.</p>
        </section>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.thaum {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.thaum__nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid var(--cardln);
  background: rgba(20, 16, 34, 0.5);
}
.thaum__tabs {
  display: inline-flex;
  gap: 2px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 10px;
  padding: 3px;
}
.thaum__tab {
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 7px 14px;
  border-radius: 7px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.thaum__tab:hover:not(.on) {
  color: var(--ink);
  background: rgba(160, 107, 255, 0.08);
}
.thaum__tab.on {
  background: linear-gradient(180deg, #a06bff, var(--solid));
  color: var(--solid-ink);
  box-shadow: 0 0 16px var(--glow-violet);
}
.thaum__tab:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.thaum__tour {
  margin-left: auto;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  color: var(--alt);
  background: var(--bg2);
  border: 1px solid var(--solid);
  border-radius: 8px;
  padding: 6px 13px;
  cursor: pointer;
}
.thaum__tour:hover {
  background: rgba(160, 107, 255, 0.12);
}
.thaum__tour:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.thaum__body {
  flex: 1;
}
.thaum__placeholder {
  padding: 60px 20px;
  text-align: center;
  color: var(--muted);
}
.tpanel-enter-active,
.tpanel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.tpanel-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tpanel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
