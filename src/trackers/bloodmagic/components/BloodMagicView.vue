<script setup lang="ts">
import { ref, watch } from 'vue'
import { storage } from '@/shared/persistence/storage'
import RecipesPanel from './RecipesPanel.vue'
import SigilsPanel from './SigilsPanel.vue'
import BloodPathPanel from './BloodPathPanel.vue'
import RitualsPanel from './RitualsPanel.vue'
import IconBase from '@/shared/ui/IconBase.vue'
import type { IconName } from '@/shared/icons/icons'

// ── Суб-табы трекера BloodMagic ──
type Panel = 'path' | 'rituals' | 'sigils' | 'recipes'
const PANELS: { id: Panel; label: string; icon: IconName }[] = [
  { id: 'path', label: 'Путь крови', icon: 'drop' },
  { id: 'rituals', label: 'Ритуалы', icon: 'ritual' },
  { id: 'sigils', label: 'Сигилы', icon: 'sigil' },
  { id: 'recipes', label: 'Рецепты', icon: 'grid' },
]

// активная вкладка сохраняется — при возврате открывается последняя
const PANEL_KEY = 'bloodmagic.panel'
const savedPanel = storage.get<string>(PANEL_KEY, 'path')
const panel = ref<Panel>(PANELS.some((p) => p.id === savedPanel) ? (savedPanel as Panel) : 'path')
watch(panel, (p) => storage.set(PANEL_KEY, p))
</script>

<template>
  <div class="bm">
    <nav class="bm__nav" aria-label="Разделы BloodMagic">
      <div class="bm__tabs" role="group">
        <button
          v-for="p in PANELS"
          :key="p.id"
          type="button"
          class="bm__tab"
          :class="{ on: panel === p.id }"
          :aria-pressed="panel === p.id"
          @click="panel = p.id"
        >
          <IconBase :name="p.icon" class="bm__tab-icon" />
          {{ p.label }}
        </button>
      </div>
    </nav>

    <div class="bm__body">
      <!--
        KeepAlive: панели не размонтируются при смене вкладки — 3D-сцена сохраняется
        (нет повторной инициализации и моргания). Без mode="out-in" Transition,
        который на тяжёлой 3D-панели зависал и оставлял пустой контент.
        MultiblockView гасит render-loop на скрытых вкладках (onDeactivated).
      -->
      <!--
        :duration форсирует таймер вместо transitionend — на тяжёлой 3D-панели
        transitionend срабатывал ненадёжно и оставлял пустой контент; с явным
        duration mode=out-in не зависает. KeepAlive сохраняет панели (3D без ремаунта).
      -->
      <Transition name="bmpanel" mode="out-in" :duration="200">
        <KeepAlive>
          <BloodPathPanel v-if="panel === 'path'" key="path" />
          <RitualsPanel v-else-if="panel === 'rituals'" key="rituals" />
          <RecipesPanel v-else-if="panel === 'recipes'" key="recipes" />
          <SigilsPanel v-else-if="panel === 'sigils'" key="sigils" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.bm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.bm__nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid var(--cardln);
  background: rgba(23, 12, 14, 0.5);
}

.bm__tabs {
  display: inline-flex;
  gap: 2px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 10px;
  padding: 3px;
}

.bm__tab {
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
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Иконка слева от текста таба — 14px, наследует цвет кнопки */
.bm__tab-icon {
  width: 14px;
  height: 14px;
  flex: none;
  opacity: 0.85;
}

.bm__tab:hover:not(.on) {
  color: var(--ink);
  background: rgba(224, 52, 74, 0.08);
}

.bm__tab.on {
  background: var(--accent-grad);
  color: var(--solid-ink);
  box-shadow: 0 0 16px var(--glow-violet);
}

.bm__tab:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}

.bm__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.bm__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 80px 20px;
  text-align: center;
}

.bm__placeholder-icon {
  font-size: 40px;
  line-height: 1;
  filter: grayscale(0.3);
}

.bm__placeholder-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
  margin: 0;
}

.bm__placeholder-sub {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

/* Переход между суб-вкладками (fade + лёгкий сдвиг). :duration на Transition
   гарантирует завершение даже если transitionend не сработает. */
.bmpanel-enter-active,
.bmpanel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.bmpanel-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.bmpanel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .bmpanel-enter-active,
  .bmpanel-leave-active {
    transition: opacity 0.1s ease;
  }

  .bmpanel-enter-from,
  .bmpanel-leave-to {
    transform: none;
  }
}
</style>
