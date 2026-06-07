import type { TourStep } from '@/shared/ui/useTour'

/** Контракт для тура: переключение внутренней вкладки раздела. */
export interface GeneticsTourCtx {
  setPanel: (p: 'dashboard' | 'collection' | 'builder' | 'pipeline') => void
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Шаги обучения по разделу «Генетика». Перед панельными шагами переключаем
   активную вкладку и ждём анимацию перехода (mode out-in ~0.18s). Якорь
   genetics-body стабилен между панелями. */
export function buildGeneticsTour(ctx: GeneticsTourCtx): TourStep[] {
  return [
    {
      element: '[data-tour="genetics-nav"]',
      title: 'Раздел «Генетика»',
      text: 'Четыре вкладки: Обзор, Коллекция, Сборка и Пайплайн. Здесь собирают идеальную пчелу через генетические машины.',
      side: 'bottom',
      before: async () => {
        ctx.setPanel('dashboard')
        await delay(250)
      },
    },
    {
      element: '[data-tour="genetics-body"]',
      title: 'Коллекция генов',
      text: 'Отмечай собранные гены по каждому признаку. Кнопка ⓘ у значения открывает справку: что даёт, шкала, виды-носители.',
      side: 'top',
      before: async () => {
        ctx.setPanel('collection')
        await delay(250)
      },
    },
    {
      element: '[data-tour="genetics-body"]',
      title: 'Сборка генома',
      text: 'Конструируешь целевую пчелу: выбираешь желаемые аллели — раздел покажет, что осталось изолировать и из какого вида это вывести.',
      side: 'top',
      before: async () => {
        ctx.setPanel('builder')
        await delay(250)
      },
    },
    {
      element: '[data-tour="genetics-body"]',
      title: 'Пайплайн машин',
      text: 'Гайд по воркфлоу: цепочка машин Gendustry/Binnie — что за чем, какие ресурсы нужны и что получается.',
      side: 'top',
      before: async () => {
        ctx.setPanel('pipeline')
        await delay(250)
      },
    },
    {
      element: '[data-tour="genetics-data"]',
      title: 'Сохранение прогресса',
      text: 'Экспорт/импорт собранных генов и целей одним файлом — как в трекерах пчёл и деревьев.',
      side: 'bottom',
      before: async () => {
        ctx.setPanel('dashboard')
        await delay(250)
      },
    },
  ]
}
