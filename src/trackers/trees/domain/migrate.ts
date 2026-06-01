export const TREES_SCHEMA_VERSION = 3

export interface TreesImportData {
  progress: Record<string, unknown>
  inventory: Record<string, unknown>
}
export type TreesImportResult = { ok: true; data: TreesImportData } | { ok: false; reason: string }

/**
 * Версионный контракт импорта деревьев: отсекает будущий формат, пропускает
 * текущий/legacy. Семантическая валидация id/значений остаётся в store.importData.
 */
export function parseTreesImport(payload: unknown): TreesImportResult {
  if (typeof payload !== 'object' || payload === null) return { ok: false, reason: 'not-object' }
  const o = payload as Record<string, unknown>
  if (typeof o.v === 'number' && o.v > TREES_SCHEMA_VERSION) {
    return { ok: false, reason: `unsupported-version:${o.v}` }
  }
  return {
    ok: true,
    data: {
      progress: (o.progress as Record<string, unknown>) ?? {},
      inventory: (o.inventory as Record<string, unknown>) ?? {},
    },
  }
}
