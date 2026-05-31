import { defineAsyncComponent } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { storage } from '@/shared/persistence/storage'
import { TRACKERS, type TrackerId } from '@/shared/types'
import AppLoader from '@/shared/ui/AppLoader.vue'

const TRACKER_IDS = new Set<string>(TRACKERS.map((t) => t.id))
/** Последний активный трекер из storage, с валидацией (битое значение → trees). */
function lastTrackerPath(): string {
  const saved = storage.get<unknown>('app.tracker', 'trees')
  return `/${typeof saved === 'string' && TRACKER_IDS.has(saved) ? (saved as TrackerId) : 'trees'}`
}

// Лениво грузим вьюху трекера; пока качается её чанк — показываем лоадер.
// delay 150мс гасит мелькание на быстрых/кешированных загрузках (KeepAlive +
// прогрев чанков в App.vue делают повторные открытия мгновенными).
function lazyTracker(loader: () => Promise<unknown>) {
  return defineAsyncComponent({
    loader: loader as () => Promise<{ default: unknown }>,
    loadingComponent: AppLoader,
    delay: 150,
  })
}

const routes: RouteRecordRaw[] = [
  // редирект на последний активный трекер
  { path: '/', redirect: lastTrackerPath },
  {
    path: '/trees',
    name: 'trees',
    component: lazyTracker(() => import('@/trackers/trees/components/TreesView.vue')),
    meta: { tracker: 'trees' },
  },
  {
    path: '/bees',
    name: 'bees',
    component: lazyTracker(() => import('@/trackers/bees/components/BeesView.vue')),
    meta: { tracker: 'bees' },
  },
  // неизвестные пути → на последний активный трекер
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
