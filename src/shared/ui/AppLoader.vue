<script setup lang="ts">
// Универсальный лоадер: для загрузки чанка вьюхи (loadingComponent роутера) и
// для фазы построения графа (оверлей до onReady). Тема-агностичен (CSS-переменные
// с фолбэками), уважает prefers-reduced-motion.
defineProps<{ label?: string }>()
</script>

<template>
  <div class="loader" role="status" aria-live="polite">
    <div class="loader__mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <polygon
          class="loader__hex loader__hex--bg"
          points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5"
        />
        <polygon
          class="loader__hex loader__hex--fg"
          points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5"
        />
      </svg>
    </div>
    <div class="loader__bar"><span class="loader__bar-fill" /></div>
    <div class="loader__label">{{ label ?? 'Загрузка…' }}</div>
  </div>
</template>

<style scoped>
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  min-height: 220px;
  padding: 32px;
  color: var(--muted, #9a8868);
}
.loader__mark {
  width: 56px;
  height: 56px;
}
.loader__mark svg {
  width: 100%;
  height: 100%;
}
.loader__hex {
  fill: none;
  stroke-width: 2.5;
  stroke-linejoin: round;
}
.loader__hex--bg {
  stroke: var(--cardln, #3b3225);
}
.loader__hex--fg {
  stroke: var(--honey, var(--leaf, #e8a72c));
  stroke-dasharray: 120;
  stroke-dashoffset: 120;
  transform-origin: center;
  animation: loaderTrace 1.4s ease-in-out infinite;
}
@keyframes loaderTrace {
  0% {
    stroke-dashoffset: 120;
    opacity: 0.4;
  }
  50% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -120;
    opacity: 0.4;
  }
}
.loader__bar {
  position: relative;
  width: 160px;
  height: 4px;
  border-radius: 2px;
  background: var(--cardln, #3b3225);
  overflow: hidden;
}
.loader__bar-fill {
  position: absolute;
  inset: 0;
  width: 40%;
  border-radius: 2px;
  background: var(--honey, var(--leaf, #e8a72c));
  animation: loaderSlide 1.2s ease-in-out infinite;
}
@keyframes loaderSlide {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(320%);
  }
}
.loader__label {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  letter-spacing: 0.08em;
}

@media (prefers-reduced-motion: reduce) {
  .loader__hex--fg {
    animation: none;
    stroke-dashoffset: 0;
    opacity: 1;
  }
  .loader__bar-fill {
    animation: none;
    width: 100%;
    opacity: 0.6;
  }
}
</style>
