<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storage } from '@/shared/persistence/storage'
import { TRACKER_MODULES, type TrackerId } from '@/shared/registry/trackers'
import IconBase from '@/shared/ui/IconBase.vue'
import ErrorBoundary from '@/shared/ui/ErrorBoundary.vue'

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
  if (id !== activeTracker.value) router.push(`/${id}`)
}
</script>

<template>
  <div class="shell">
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

      <a
        class="copyright"
        href="https://github.com/PheeZz"
        target="_blank"
        rel="noopener noreferrer"
      >
        © {{ year }} PheeZz
      </a>
    </nav>

    <main class="shell__body">
      <!-- KeepAlive: вьюхи (и их Cytoscape-инстансы) не пересоздаются при переключении.
           Transition: настоящий crossfade (без out-in, чтобы не было провала в пустоту) —
           уходящая вьюха кладётся absolute поверх, обе плавно меняют opacity. -->
      <!-- ErrorBoundary снаружи RouterView, чтобы не вмешиваться в кеширование
           KeepAlive (он должен видеть сами вьюхи как прямых детей). -->
      <ErrorBoundary>
        <RouterView v-slot="{ Component }">
          <Transition name="tab">
            <KeepAlive>
              <component :is="Component" />
            </KeepAlive>
          </Transition>
        </RouterView>
      </ErrorBoundary>
    </main>
  </div>
</template>

<style scoped>
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

.copyright {
  margin-left: auto;
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
</style>
