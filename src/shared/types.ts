import type { IconName } from '@/shared/icons/icons'

/** Идентификаторы трекеров приложения. */
export type TrackerId = 'trees' | 'bees'

/** Описание трекера для хост-каркаса (переключатель, маршрут, мета). */
export interface TrackerMeta {
  id: TrackerId
  /** Заголовок в переключателе. */
  title: string
  /** Короткий подзаголовок/кикер. */
  kicker: string
  /** Иконка-марка (имя из набора ICONS). */
  mark: IconName
  /** Путь маршрута. */
  path: string
}

export const TRACKERS: readonly TrackerMeta[] = [
  { id: 'trees', title: 'Деревья', kicker: 'Forestry · Селекция', mark: 'sprout', path: '/trees' },
  { id: 'bees', title: 'Пчёлы', kicker: 'Forestry · ExtraBees', mark: 'bee', path: '/bees' },
] as const
