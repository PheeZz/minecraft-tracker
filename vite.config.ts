/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // cytoscape + elk вместе ~2МБ — неизбежно для граф-движка; для локального
    // инструмента приемлемо. Ручной manualChunks не используем: он ломает резолв
    // зависимости elkjs ('web-worker'). Только поднимаем порог предупреждения.
    chunkSizeWarningLimit: 2600,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
