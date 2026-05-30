<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storage } from '@/shared/persistence/storage'
import { TRACKERS, type TrackerId } from '@/shared/types'

const route = useRoute()
const router = useRouter()

const activeTracker = computed<TrackerId>(() => (route.meta.tracker as TrackerId) ?? 'trees')

// Тема трекера активируется атрибутом на корне документа; запоминаем последний.
watchEffect(() => {
  document.documentElement.dataset.tracker = activeTracker.value
  storage.set('app.tracker', activeTracker.value)
})

function switchTo(id: TrackerId) {
  if (id !== activeTracker.value) router.push(`/${id}`)
}
</script>

<template>
  <div class="shell">
    <nav class="switcher" aria-label="Переключатель трекеров">
      <button
        v-for="t in TRACKERS"
        :key="t.id"
        class="switcher__btn"
        :class="{ 'is-active': t.id === activeTracker }"
        type="button"
        @click="switchTo(t.id)"
      >
        <span class="switcher__mark">{{ t.mark }}</span>
        <span class="switcher__text">
          <span class="switcher__title">{{ t.title }}</span>
          <span class="switcher__kicker">{{ t.kicker }}</span>
        </span>
      </button>
    </nav>

    <main class="shell__body">
      <RouterView />
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
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
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

.switcher__mark {
  font-size: 22px;
  line-height: 1;
}
.switcher__text {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.switcher__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
}
.switcher__kicker {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.shell__body {
  min-height: 0;
}
</style>
