import type { TourStep } from '@/shared/ui/useTour'

/** Демо-сота: тяжелее тривиальной, цепочка чистая (см. спеку). */
export const SAMPLE_COMB = 'Древние соты'

/** Минимальный контракт стора, нужный туру пчёл. */
export interface BeesTourStore {
  selectComb: (name: string) => void
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Шаги тура пчёл. Перед графовыми шагами демонстрационно выбираем соту, чтобы
   появились граф и план; ждём, пока BeeChainGraph смонтируется и построится.
   Якоря rail/graph/panel живут в граф-режиме (view==='graph' — дефолт); тур
   рассчитан на него. При ручном запуске в режиме «Инвентарь» эти шаги
   отцентрируются (driver покажет поповер по центру) — не падает. */
export function buildBeesTour(store: BeesTourStore): TourStep[] {
  return [
    {
      element: '[data-tour="bees-modebar"]',
      title: 'Режимы',
      text: 'Три режима: Граф (цепочка выведения), Инвентарь (склад пчёл) и Задачи (что нужно для крафта).',
      side: 'bottom',
    },
    {
      element: '[data-tour="bees-rail"]',
      title: 'Выбор цели',
      text: 'Слева выбираешь соту или пчелу. Переключатель Соты/Пчёлы и поиск — здесь же.',
      side: 'right',
    },
    {
      element: '[data-tour="bees-graph"]',
      title: 'Дерево скрещивания',
      text: 'По центру — дерево «что с чем скрестить», чтобы получить выбранную цель.',
      side: 'top',
      before: async () => {
        store.selectComb(SAMPLE_COMB)
        await delay(650)
      },
    },
    {
      element: '[data-tour="bees-panel"]',
      title: 'Пошаговый план',
      text: 'Справа — пошаговый план: кого с кем скрестить, шансы, альтернативные рецепты.',
      side: 'left',
    },
    {
      element: '[data-tour="bees-tasks"]',
      title: 'Задачи по сотам',
      text: 'Заводи задачи под крафт: какие соты нужны, а приложение покажет прогресс и подскажет, кого вывести.',
      side: 'bottom',
    },
  ]
}
