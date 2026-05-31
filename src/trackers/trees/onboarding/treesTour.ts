import type { TourStep } from '@/shared/ui/useTour'

/** Минимальный контракт графа деревьев, нужный туру. */
export interface TreesTourGraph {
  tourBestId: () => string | null
  tourSpotlight: (id: string) => Promise<void>
}

/** Экранирование id для CSS-селектора (кириллица/пробелы внутри кавычек ок;
   опасны кавычки и бэкслеши — их и экранируем). */
function cssEscape(s: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&')
}

/** Шаги тура деревьев. Шаг «лучший выбор» включается, только если есть доступная нода. */
export function buildTreesTour(graph: TreesTourGraph): TourStep[] {
  const steps: TourStep[] = [
    {
      element: '[data-tour="trees-sidebar"]',
      title: 'Боковая панель',
      text: 'Поиск дерева, фильтры по тирам, раскладки графа и инструменты — всё здесь.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-search"]',
      title: 'Поиск',
      text: 'Введи название дерева или плода — граф подсветит и сфокусируется на нём.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-tiers"]',
      title: 'Фильтр тиров',
      text: 'Скрывай и показывай тиры, чтобы граф не был перегружен.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-layout"]',
      title: 'Раскладка',
      text: 'Меняй раскладку графа: по тирам, ELK или dagre.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-navbar"]',
      title: 'Навигация по графу',
      text: 'Следующее доступное дерево, лучший шаг, вписать граф, показать все рёбра.',
      side: 'bottom',
    },
  ]

  const bestId = graph.tourBestId()
  if (bestId) {
    steps.push({
      element: () => document.querySelector(`.node[data-id="${cssEscape(bestId)}"]`),
      title: 'Лучший следующий выбор',
      text: 'Вот дерево, которое сейчас выгоднее всего вывести — оно открывает больше всего дальше. Клик по ноде в графе подсвечивает родословную.',
      side: 'top',
      before: () => graph.tourSpotlight(bestId),
    })
  }

  steps.push({
    element: '[data-tour="trees-legend"]',
    title: 'Легенда',
    text: 'Что значат цвета рамок, бейджи и обводки нод.',
    side: 'top',
  })

  return steps
}
