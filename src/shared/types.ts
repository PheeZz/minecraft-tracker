/** Идентификаторы трекеров приложения. */
export type TrackerId = 'trees' | 'bees'

/** Описание трекера для хост-каркаса (переключатель, маршрут, мета). */
export interface TrackerMeta {
  id: TrackerId
  /** Заголовок в переключателе. */
  title: string
  /** Короткий подзаголовок/кикер. */
  kicker: string
  /** Эмодзи-марка. */
  mark: string
  /** Путь маршрута. */
  path: string
}

export const TRACKERS: readonly TrackerMeta[] = [
  { id: 'trees', title: 'Деревья', kicker: 'Forestry · Селекция', mark: '🌳', path: '/trees' },
  { id: 'bees', title: 'Пчёлы', kicker: 'Forestry · ExtraBees', mark: '🐝', path: '/bees' },
] as const
