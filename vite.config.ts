/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
// base: при сборке — '/minecraft-tracker/' (project GitHub Pages), в dev — '/'.
// Переопределяется переменной BASE_PATH (для других хостингов/форков).
export default defineConfig(({ command }) => ({
  base: process.env.BASE_PATH ?? (command === 'build' ? '/minecraft-tracker/' : '/'),
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // cytoscape — основной вес граф-движка; для локального инструмента приемлемо.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Выделяем cytoscape и его расширения в отдельный vendor-чанк, чтобы
        // код приложения и тур не тянули его в свои чанки (elk удалён — ограничение
        // web-worker, мешавшее manualChunks, снято).
        manualChunks: {
          cytoscape: ['cytoscape', 'cytoscape-dagre', 'cytoscape-node-html-label', 'dagre'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
}))
