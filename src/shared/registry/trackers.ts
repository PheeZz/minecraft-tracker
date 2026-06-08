import type { IconName } from '@/shared/icons/icons'

export interface TrackerModule {
  id: string
  title: string
  kicker: string
  mark: IconName
  path: string
  /** Ленивый импорт View-компонента трекера. */
  view: () => Promise<unknown>
}

export const TRACKER_MODULES = [
  {
    id: 'trees',
    title: 'Деревья',
    kicker: 'Forestry · Селекция',
    mark: 'sprout',
    path: '/trees',
    view: () => import('@/trackers/trees/components/TreesView.vue'),
  },
  {
    id: 'bees',
    title: 'Пчёлы',
    kicker: 'Forestry · ExtraBees',
    mark: 'bee',
    path: '/bees',
    view: () => import('@/trackers/bees/components/BeesView.vue'),
  },
  {
    id: 'genetics',
    title: 'Генетика',
    kicker: 'Binnie · Gendustry',
    mark: 'pollen',
    path: '/genetics',
    view: () => import('@/trackers/genetics/components/GeneticsView.vue'),
  },
  {
    id: 'thaumcraft',
    title: 'Таумкрафт',
    kicker: 'Thaumcraft · Аспекты',
    mark: 'aspect',
    path: '/thaumcraft',
    view: () => import('@/trackers/thaumcraft/components/ThaumcraftView.vue'),
  },
  {
    id: 'bloodmagic',
    title: 'Кровавая магия',
    kicker: 'BloodMagic · Ритуалы',
    mark: 'drop',
    path: '/bloodmagic',
    view: () => import('@/trackers/bloodmagic/components/BloodMagicView.vue'),
  },
] as const satisfies readonly TrackerModule[]

export type TrackerId = (typeof TRACKER_MODULES)[number]['id']

import 'vue-router'
declare module 'vue-router' {
  interface RouteMeta {
    tracker?: TrackerId
  }
}
