/**
 * Доменные помощники «задач по сотам». Чистые функции — без Pinia/Vue, чтобы
 * легко тестировались. Связь задача → сота → пчела строится поверх producersOf
 * (ранжированных производителей соты) и склада have. См. спецификацию
 * docs/superpowers/specs/2026-05-31-bee-comb-tasks-design.md.
 */

/** Задача: цель-предмет, требующая набор сот. Хранится в сторе/storage. */
export interface BeeTask {
  /** crypto.randomUUID() */
  id: string
  /** Имя предмета/цели, задаёт игрок. */
  name: string
  /** Имена требуемых сот (ключи COMBS), без дублей. */
  combs: string[]
  /** Свёрнута ли карточка (готовые удобно сворачивать). */
  collapsed?: boolean
}

/** Производитель соты с глубиной (подмножество полей RankedProducer стора). */
export interface CombProducerRanked {
  bee: string
  pct: number
  depth: number
}

/** Состояние требуемой соты: есть / можно вывести сейчас / нужно вывести (N шагов). */
export type CombState = 'have' | 'ready' | 'todo'

export interface CombStatus {
  comb: string
  state: CombState
  /** Пчела, что закрывает (have) или подсказана к выведению; null — нет производителей. */
  bee: string | null
  /** Шагов выведения подсказанной пчелы (0 для have/ready). */
  depth: number
}

/**
 * Статус соты при текущем складе:
 *  - есть владелец-производитель → have (берём с наибольшим шансом среди имеющихся);
 *  - иначе самый лёгкий производитель (depth↑, затем шанс↓): depth 0 → ready, иначе todo;
 *  - нет производителей → todo, bee=null.
 */
export function combStatus(
  comb: string,
  producers: readonly CombProducerRanked[],
  have: ReadonlySet<string>,
): CombStatus {
  if (!producers.length) return { comb, state: 'todo', bee: null, depth: 0 }
  const owned = producers.filter((p) => have.has(p.bee)).sort((a, b) => b.pct - a.pct)[0]
  if (owned) return { comb, state: 'have', bee: owned.bee, depth: 0 }
  const easiest = [...producers].sort((a, b) => a.depth - b.depth || b.pct - a.pct)[0]!
  return {
    comb,
    state: easiest.depth === 0 ? 'ready' : 'todo',
    bee: easiest.bee,
    depth: easiest.depth,
  }
}

export interface TaskProgress {
  done: number
  total: number
  ready: boolean
}

/** Прогресс задачи: done = число сот в состоянии have; ready при полном покрытии (>0). */
export function taskProgress(statuses: readonly CombStatus[]): TaskProgress {
  const total = statuses.length
  const done = statuses.filter((s) => s.state === 'have').length
  return { done, total, ready: total > 0 && done === total }
}
