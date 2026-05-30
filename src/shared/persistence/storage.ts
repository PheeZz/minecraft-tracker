/**
 * Абстракция хранилища ключ-значение. Единственное место в приложении,
 * где разрешён прямой доступ к Web Storage API (см. ESLint no-restricted-globals).
 * Остальной код работает только через интерфейс KeyValueStorage / экспорт `storage`.
 */
export interface KeyValueStorage {
  /** Прочитать значение; вернуть fallback при отсутствии/ошибке парсинга. */
  get<T>(key: string, fallback: T): T
  /** Записать значение (сериализуется в JSON). */
  set(key: string, value: unknown): void
  /** Удалить ключ. */
  remove(key: string): void
  /** Очистить всё хранилище. */
  clear(): void
}

/** In-memory реализация — для тестов и сред без Web Storage (SSR). */
export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    get<T>(key: string, fallback: T): T {
      const raw = map.get(key)
      if (raw === undefined) return fallback
      try {
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    set(key, value) {
      map.set(key, JSON.stringify(value))
    },
    remove(key) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
  }
}

/** Реализация поверх Web Storage (localStorage). Падения хранилища — молча безопасны. */
function createWebStorage(backend: Storage): KeyValueStorage {
  return {
    get<T>(key: string, fallback: T): T {
      try {
        const raw = backend.getItem(key)
        if (raw === null) return fallback
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    set(key, value) {
      try {
        backend.setItem(key, JSON.stringify(value))
      } catch {
        // переполнение/недоступность — игнорируем
      }
    },
    remove(key) {
      try {
        backend.removeItem(key)
      } catch {
        // ignore
      }
    },
    clear() {
      try {
        backend.clear()
      } catch {
        // ignore
      }
    },
  }
}

function resolveDefaultStorage(): KeyValueStorage {
  try {
    if (typeof localStorage !== 'undefined') return createWebStorage(localStorage)
  } catch {
    // доступ к localStorage может бросать (приватный режим и т.п.)
  }
  return createMemoryStorage()
}

/** Хранилище приложения по умолчанию (localStorage там, где доступен). */
export const storage: KeyValueStorage = resolveDefaultStorage()
