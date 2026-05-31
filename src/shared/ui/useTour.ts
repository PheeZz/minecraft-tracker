import { onBeforeUnmount } from 'vue'
import type { Driver } from 'driver.js'

/** Шаг тура. element — селектор или функция (для динамических нод графа). */
export interface TourStep {
  element: string | (() => Element | null | undefined)
  title: string
  text: string
  side?: 'top' | 'right' | 'bottom' | 'left' | 'over'
  /** Действие ДО показа шага (зум к ноде, демо-выбор). Ждём резолва промиса. */
  before?: () => void | Promise<void>
}

export interface TourController {
  /** Лениво грузит driver.js и запускает тур. Повторный вызов во время тура — no-op. */
  start: () => Promise<void>
  destroy: () => void
}

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Привести element шага к типу driver.js. driver требует `() => Element`, а мы
 * допускаем undefined (ноды может не быть на экране — driver центрирует поповер).
 * Каст безопасен; параметр-биндинг сохраняет сужение типа внутри замыкания.
 */
function toDriverElement(el: TourStep['element']): string | (() => Element) {
  if (typeof el === 'string') return el
  return (() => el() ?? undefined) as () => Element
}

/**
 * Обёртка над driver.js. Шаги передаются фабрикой getSteps() (вычисляются на
 * момент start, т.к. зависят от состояния — напр. «лучшая нода»). before() шага
 * выполняется до его показа: переходы перехвачены (onNextClick/onPrevClick), мы
 * ждём before() и затем двигаем driver вручную (moveTo).
 */
export function useTour(
  getSteps: () => TourStep[],
  opts: { onDone?: () => void } = {},
): TourController {
  let drv: Driver | null = null

  async function start(): Promise<void> {
    if (drv?.isActive()) return
    const steps = getSteps()
    if (!steps.length) return

    const { driver } = await import('driver.js')
    await import('driver.js/dist/driver.css')
    await import('./tour.css') // наша тема поверх дефолтов driver (тот же ленивый чанк)
    const reduce = reducedMotion()

    const driveSteps = steps.map((s) => ({
      element: toDriverElement(s.element),
      popover: { title: s.title, description: s.text, side: s.side ?? ('bottom' as const) },
    }))

    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      opts.onDone?.()
    }

    // before() шага может быть долгим (зум к ноде); пока он выполняется, кнопка
    // «Далее» остаётся кликабельной → защищаемся от повторных переходов.
    let advancing = false
    async function runBefore(step: TourStep | undefined): Promise<void> {
      if (!step?.before) return
      try {
        await step.before()
      } catch (e) {
        console.error('[tour before]', e)
      }
    }

    async function advance(dir: 1 | -1): Promise<void> {
      if (!drv || advancing) return
      advancing = true
      try {
        const i = drv.getActiveIndex() ?? 0
        const targetIdx = i + dir
        if (targetIdx < 0) return
        if (targetIdx >= steps.length) {
          drv.destroy()
          return
        }
        await runBefore(steps[targetIdx])
        drv.moveTo(targetIdx)
      } finally {
        advancing = false
      }
    }

    drv = driver({
      animate: !reduce,
      smoothScroll: !reduce,
      allowClose: true,
      showProgress: true,
      popoverClass: 'mc-tour', // наша тема (см. tour.css)
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      nextBtnText: 'Далее',
      prevBtnText: 'Назад',
      doneBtnText: 'Готово',
      progressText: '{{current}} из {{total}}',
      steps: driveSteps,
      // переходы контролируем сами (ждём before перед показом шага)
      onNextClick: () => {
        void advance(1)
      },
      onPrevClick: () => {
        void advance(-1)
      },
      onCloseClick: () => drv?.destroy(),
      onDestroyed: finish,
    })

    if (steps[0]?.before) {
      try {
        await steps[0].before()
      } catch (e) {
        console.error('[tour before]', e)
      }
    }
    drv.drive()
  }

  function destroy(): void {
    drv?.destroy()
    drv = null
  }

  onBeforeUnmount(destroy)
  return { start, destroy }
}
