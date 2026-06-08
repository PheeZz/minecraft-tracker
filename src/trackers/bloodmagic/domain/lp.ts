// Доменные расчёты LP для ритуалов Blood Magic.
// Все функции чистые, без сайд-эффектов.
//
// ВАЖНО: upkeep_LP_per_tick — расход за ИГРОВОЙ тик (20 тиков/сек).
// Точное время работы ритуала непредсказуемо (зависит от нагрузки сервера).
// Все расчёты — worst-case: непрерывная работа без пауз.

/**
 * Максимальный расход LP в секунду при непрерывной работе ритуала.
 * Worst-case: ритуал работает каждый тик без пауз.
 */
export function maxDrainPerSecond(upkeepPerTick: number): number {
  return upkeepPerTick * 20
}

/**
 * Минимальное время работы ритуала (секунды) при заданной ёмкости шара.
 * Это нижняя граница — реальное время может быть больше при паузах эффекта.
 * Возвращает Infinity если upkeep = 0.
 */
export function minOrbDurationSeconds(capacityLP: number, upkeepPerTick: number): number {
  if (upkeepPerTick <= 0) return Infinity
  return capacityLP / maxDrainPerSecond(upkeepPerTick)
}

/**
 * Форматирует число секунд в читаемую строку.
 * Infinity → «∞», иначе «X ч Y мин» / «Y мин» / «Z сек».
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '∞'
  const totalSec = Math.floor(seconds)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0 && m > 0) return `${h} ч ${m} мин`
  if (h > 0) return `${h} ч`
  if (m > 0) return `${m} мин`
  return `${s} сек`
}

/**
 * Форматирует LP через ru-RU разделители тысяч.
 * Пример: 1500000 → «1 500 000».
 */
export function formatLP(lp: number): string {
  return lp.toLocaleString('ru-RU')
}
