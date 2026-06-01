import { nextTick, ref } from 'vue'

// Глобальный live-region для скринридеров. message — модульный singleton,
// один на всё приложение (рендерится один раз в App.vue).
const message = ref('')

/**
 * Озвучить сообщение через aria-live. Скринридер реагирует на ИЗМЕНЕНИЕ текста
 * в регионе; при повторе того же текста изменения нет → ничего не озвучится.
 * Поэтому сначала очищаем регион синхронно, а на следующем тике выставляем текст —
 * так смена «'' → текст» гарантированно отрабатывает даже для одинаковых подряд
 * сообщений. nextTick (а не requestAnimationFrame) выбран ради детерминизма
 * в тестах и привязки к циклу обновления Vue.
 */
function announce(text: string): void {
  message.value = ''
  void nextTick(() => {
    message.value = text
  })
}

export { announce, message }

export function useAnnouncer(): { message: typeof message; announce: typeof announce } {
  return { message, announce }
}
