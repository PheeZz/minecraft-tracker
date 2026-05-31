// Полноэкранное конфетти. canvas-confetti грузится лениво (отдельный чанк),
// чтобы не утяжелять основной бандл. При prefers-reduced-motion — no-op.
const motionOk = (): boolean => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Праздничный залп конфетти на весь экран (несколько волн). Безопасно при отсутствии поддержки. */
export async function fireConfetti(): Promise<void> {
  if (!motionOk()) return
  try {
    const confetti = (await import('canvas-confetti')).default
    const end = Date.now() + 1100
    const colors = ['#e8a72c', '#8fd14f', '#5285d6', '#e36f9b', '#ffffff']
    confetti({ particleCount: 140, spread: 80, startVelocity: 55, origin: { y: 0.6 }, colors })
    const frame = (): void => {
      confetti({ particleCount: 6, angle: 60, spread: 65, origin: { x: 0 }, colors })
      confetti({ particleCount: 6, angle: 120, spread: 65, origin: { x: 1 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  } catch {
    // конфетти — украшение; молча игнорируем сбой загрузки чанка
  }
}
