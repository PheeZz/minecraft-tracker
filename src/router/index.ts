import { defineAsyncComponent } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { storage } from '@/shared/persistence/storage'
import { TRACKER_MODULES, type TrackerId } from '@/shared/registry/trackers'
import AppLoader from '@/shared/ui/AppLoader.vue'

const TRACKER_IDS = new Set<string>(TRACKER_MODULES.map((m) => m.id))
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

const trackerRoutes: RouteRecordRaw[] = TRACKER_MODULES.map((m) => ({
  path: m.path,
  name: m.id,
  component: lazyTracker(m.view),
  meta: { tracker: m.id as TrackerId },
}))

const routes: RouteRecordRaw[] = [
  // редирект на последний активный трекер
  { path: '/', redirect: lastTrackerPath },
  ...trackerRoutes,
  // неизвестные пути → на последний активный трекер
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
