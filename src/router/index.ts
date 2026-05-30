import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/trees' },
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
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
