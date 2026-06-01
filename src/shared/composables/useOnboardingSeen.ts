import { storage } from '@/shared/persistence/storage'

/** Флаг «онбординг пройден» для трекера. Инкапсулирует ключ и доступ к storage. */
export function useOnboardingSeen(trackerId: string) {
  const key = `onboard.${trackerId}`
  return {
    seen: (): boolean => storage.get<boolean>(key, false),
    markSeen: (): void => storage.set(key, true),
  }
}
