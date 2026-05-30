import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { storage } from '@/shared/persistence/storage'
import { TRACKERS, type TrackerId } from '@/shared/types'

const TRACKER_IDS = new Set<string>(TRACKERS.map((t) => t.id))
/** Последний активный трекер из storage, с валидацией (битое значение → trees). */
function lastTrackerPath(): string {
  const saved = storage.get<unknown>('app.tracker', 'trees')
  return `/${typeof saved === 'string' && TRACKER_IDS.has(saved) ? (saved as TrackerId) : 'trees'}`
}

const routes: RouteRecordRaw[] = [
  // редирект на последний активный трекер
  { path: '/', redirect: lastTrackerPath },
  {
    path: '/trees',
    name: 'trees',
    component: () => import('@/trackers/trees/components/TreesView.vue'),
    meta: { tracker: 'trees' },
  },
  {
    path: '/bees',
    name: 'bees',
    component: () => import('@/trackers/bees/components/BeesView.vue'),
    meta: { tracker: 'bees' },
  },
  // неизвестные пути → на последний активный трекер
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
