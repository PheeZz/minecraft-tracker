/** Скачать данные как JSON-файл (Blob + клик по временной ссылке). */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export type ParseResult = { ok: true; data: unknown } | { ok: false; error: string }

/** Безопасный парс текста файла в JSON (без исключений наружу). */
export function parseJsonFileText(text: string): ParseResult {
  try {
    return { ok: true, data: JSON.parse(text) }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
