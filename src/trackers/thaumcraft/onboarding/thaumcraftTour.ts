import type { TourStep } from '@/shared/ui/useTour'

/** Контракт для тура: переключение внутренней вкладки раздела. */
export interface ThaumcraftTourCtx {
  setPanel: (p: 'scrolls' | 'aspects' | 'recipes' | 'scans' | 'reference') => void
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Шаги обучения по разделу «Таумкрафт». Перед панельными шагами переключаем
   активную вкладку и ждём анимацию перехода; якорь thaumcraft-body стабилен. */
export function buildThaumcraftTour(ctx: ThaumcraftTourCtx): TourStep[] {
  return [
    {
      element: '[data-tour="thaumcraft-nav"]',
      title: 'Раздел «Таумкрафт»',
      text: 'Пять вкладок: Свитки, Аспекты, Рецепты, Сканы и Справочник — гайд и трекер по магии Thaumcraft 4 (с аддонами).',
      side: 'bottom',
      before: async () => {
        ctx.setPanel('scrolls')
        await delay(250)
      },
    },
    {
      element: '[data-tour="thaumcraft-body"]',
      title: 'Свитки',
      text: 'Авто-решение стола исследований: нужные аспекты сами соединяются цепочками по соседям. Слева — поиск и категории, сверху — Список и Граф, справа — отметка изучения и цель.',
      side: 'top',
      before: async () => {
        ctx.setPanel('scrolls')
        await delay(250)
      },
    },
    {
      element: '[data-tour="thaumcraft-body"]',
      title: 'Аспекты',
      text: '58 аспектов: из чего состоят и во что входят. Здесь же можно проложить цепочку от одного аспекта к другому — тем же способом, что связывает их на столе.',
      side: 'top',
      before: async () => {
        ctx.setPanel('aspects')
        await delay(250)
      },
    },
    {
      element: '[data-tour="thaumcraft-body"]',
      title: 'Рецепты',
      text: '402 рецепта (аркан/инфузия/тигель) с раскладкой и стоимостью вис. Фильтр по типу и моду, иконки предметов и аспектов.',
      side: 'top',
      before: async () => {
        ctx.setPanel('recipes')
        await delay(250)
      },
    },
    {
      element: '[data-tour="thaumcraft-body"]',
      title: 'Сканы',
      text: 'Где добыть аспект: обратный индекс «аспект → предметы и мобы для сканирования». Или наоборот — что даёт конкретный предмет.',
      side: 'top',
      before: async () => {
        ctx.setPanel('scans')
        await delay(250)
      },
    },
    {
      element: '[data-tour="thaumcraft-body"]',
      title: 'Справочник',
      text: 'Материалы инструментов и брони, навершия и стержни палочек с калькулятором, бонусы адской печи, таблицы лута.',
      side: 'top',
      before: async () => {
        ctx.setPanel('reference')
        await delay(250)
      },
    },
  ]
}
