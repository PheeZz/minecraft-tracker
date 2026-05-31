import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

interface FocusTrapOptions {
  /** Колбэк на Escape (обычно закрытие модалки). */
  onEscape?: () => void
  /**
   * Реактивный флаг «открыто». Передавай для модалок, которые ВСЕГДА смонтированы
   * и показываются через v-if внутри (тогда трап включается по флагу). Если не
   * задан — трап живёт на mount/unmount компонента (для модалок, монтируемых по требованию).
   */
  active?: Ref<boolean>
}

/**
 * Фокус-трап для модальных диалогов: при открытии запоминает активный элемент и
 * переводит фокус внутрь контейнера; Tab/Shift+Tab зациклены внутри; при закрытии
 * фокус возвращается на элемент-триггер. Опционально — Escape. Обеспечивает
 * изоляцию фокуса, которую обещает `aria-modal="true"`.
 */
export function useFocusTrap(
  container: Ref<HTMLElement | undefined>,
  opts: FocusTrapOptions = {},
): void {
  let prevFocus: HTMLElement | null = null

  function focusables(): HTMLElement[] {
    const el = container.value
    if (!el) return []
    return Array.from(
      el.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((n) => n.offsetParent !== null)
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && opts.onEscape) {
      opts.onEscape()
      return
    }
    if (e.key !== 'Tab') return
    const f = focusables()
    if (!f.length) return
    const first = f[0]!
    const last = f[f.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (active && container.value && !container.value.contains(active)) {
      e.preventDefault()
      first.focus()
    } else if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function activate(): void {
    prevFocus = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', onKey)
    void nextTick(() => focusables()[0]?.focus())
  }
  function deactivate(): void {
    document.removeEventListener('keydown', onKey)
    prevFocus?.focus?.()
    prevFocus = null
  }

  const activeRef = opts.active
  if (activeRef) {
    watch(activeRef, (on, was) => {
      if (on && !was) activate()
      else if (!on && was) deactivate()
    })
    onMounted(() => {
      if (activeRef.value) activate()
    })
    onBeforeUnmount(() => {
      if (activeRef.value) deactivate()
    })
  } else {
    onMounted(activate)
    onBeforeUnmount(deactivate)
  }
}
