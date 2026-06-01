import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { announce, message } from './useAnnouncer'

describe('useAnnouncer', () => {
  it('озвучивает текст после тика', async () => {
    announce('Привет')
    await nextTick()
    expect(message.value).toBe('Привет')
  })

  it('повторный одинаковый текст проходит цикл очистки → установки', async () => {
    announce('Дуб выведено')
    await nextTick()
    expect(message.value).toBe('Дуб выведено')

    // Повтор того же текста: сначала регион очищается синхронно,
    // затем на следующем тике текст выставляется снова — это и заставляет
    // скринридер озвучить повторно.
    announce('Дуб выведено')
    expect(message.value).toBe('')
    await nextTick()
    expect(message.value).toBe('Дуб выведено')
  })
})
