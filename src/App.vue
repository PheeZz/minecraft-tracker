<script setup lang="ts">
import { computed, nextTick, onMounted, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storage } from '@/shared/persistence/storage'
import { TRACKER_MODULES, type TrackerId } from '@/shared/registry/trackers'
import IconBase from '@/shared/ui/IconBase.vue'
import ErrorBoundary from '@/shared/ui/ErrorBoundary.vue'
import SupportLink from '@/shared/ui/SupportLink.vue'
import { message as liveMessage } from '@/shared/ui/useAnnouncer'

const route = useRoute()
const router = useRouter()

const activeTracker = computed<TrackerId>(() => (route.meta.tracker ?? 'trees') as TrackerId)
const year = new Date().getFullYear()

// Тема трекера активируется атрибутом на корне документа; запоминаем последний.
watchEffect(() => {
  document.documentElement.dataset.tracker = activeTracker.value
  storage.set('app.tracker', activeTracker.value)
})

// Префетч чанков всех трекеров в простое — чтобы первое переключение не ждало
// загрузку/парс тяжёлого кода (cytoscape). Те же спецификаторы, что в роутере → dedupe.
onMounted(() => {
  const warm = () => {
    for (const m of TRACKER_MODULES) void m.view()
  }
  if ('requestIdleCallback' in window) requestIdleCallback(warm)
  else setTimeout(warm, 1000)
})

function switchTo(id: TrackerId) {
  if (id === activeTracker.value) return
  // Браузеры без View Transitions (Firefox без флага) — мгновенный свап.
  if (!document.startViewTransition) {
    router.push(`/${id}`)
    return
  }
  document.startViewTransition(async () => {
    router.push(`/${id}`)
    await nextTick() // дождаться смены вьюхи и watchEffect темы — снимок «нового» уже финальный
  })
}
</script>

<template>
  <div class="shell">
    <a class="skip-link" href="#main-content">К основному содержимому</a>
    <nav class="switcher" aria-label="Переключатель трекеров">
      <button
        v-for="t in TRACKER_MODULES"
        :key="t.id"
        class="switcher__btn"
        :class="{ 'is-active': t.id === activeTracker }"
        type="button"
        @click="switchTo(t.id)"
      >
        <span class="switcher__mark"><IconBase :name="t.mark" /></span>
        <span class="switcher__text">
          <span class="switcher__title">{{ t.title }}</span>
          <span class="switcher__kicker">{{ t.kicker }}</span>
        </span>
      </button>

      <SupportLink class="switcher__support" />

      <a
        class="copyright"
        href="https://github.com/PheeZz"
        target="_blank"
        rel="noopener noreferrer"
      >
        © {{ year }} PheeZz
      </a>
    </nav>

    <main
      id="main-content"
      tabindex="-1"
      class="shell__body"
      style="view-transition-name: tracker-body"
    >
      <!-- Переход между трекерами — через View Transitions API (см. switchTo).
           KeepAlive: вьюхи и их Cytoscape-инстансы не пересоздаются. -->
      <!-- ErrorBoundary снаружи RouterView, чтобы не вмешиваться в кеширование
           KeepAlive (он должен видеть сами вьюхи как прямых детей). -->
      <ErrorBoundary>
        <RouterView v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </ErrorBoundary>
    </main>
    <div class="sr-live" aria-live="polite" role="status" aria-atomic="true">{{ liveMessage }}</div>
  </div>
</template>

<style scoped>
.sr-live {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
  padding: 0;
  margin: -1px;
}

.shell {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
}

.switcher__support {
  margin-left: auto;
}
.copyright {
  padding-left: 12px;
  border-left: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--muted);
  text-decoration: none;
  opacity: 0.8;
  transition: 0.15s;
}
.copyright:hover {
  opacity: 1;
  color: var(--honey-dk, var(--leaf));
}

.switcher__btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid var(--edge, var(--cardln));
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  transition: 0.15s;
}
.switcher__btn:hover {
  border-color: var(--honey-dk, var(--leaf-dim));
}
.switcher__btn.is-active {
  border-color: var(--honey, var(--leaf));
  box-shadow: 0 0 0 1px var(--honey, var(--leaf));
}
.switcher__btn:active {
  transform: scale(0.97);
}

.switcher__mark {
  font-size: 22px;
  line-height: 1;
  display: inline-block;
}
/* «пружинка» значка активной вкладки — проигрывается один раз при активации */
.switcher__btn.is-active .switcher__mark {
  animation: markPop 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes markPop {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.22);
  }
  100% {
    transform: scale(1);
  }
}
.switcher__text {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.switcher__title {
  /* фиксируем шрифт переключателя независимо от темы трекера (как на вкладке пчёл) */
  font-family: 'Unbounded', sans-serif;
  font-weight: 800;
  font-size: 15px;
}
.switcher__kicker {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.shell__body {
  min-height: 0;
  position: relative; /* якорь для absolute-позиционирования уходящей вьюхи в crossfade */
}

.skip-link {
  position: absolute;
  left: 8px;
  top: -48px;
  z-index: 1000;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--card, #222);
  color: var(--ink, #fff);
  border: 1px solid var(--line);
  font: inherit;
  text-decoration: none;
  transition: top 0.15s;
}
.skip-link:focus-visible {
  top: 8px;
  outline: 2px solid var(--honey, #e8a72c);
}
</style>
