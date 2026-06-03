<script setup lang="ts">
import IconBase from '@/shared/ui/IconBase.vue'

const HREF = 'https://www.donationalerts.com/r/pheezz'
</script>

<template>
  <a
    class="support"
    :href="HREF"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Поддержать проект на DonationAlerts (откроется в новой вкладке)"
  >
    <span class="support__icon"><IconBase name="heart" /></span>
    <span class="support__text">Поддержать</span>
  </a>
</template>

<style scoped>
.support {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent, #8fd14f) 55%, transparent);
  color: var(--accent, #8fd14f);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: 0.15s;
}
.support:hover {
  background: color-mix(in srgb, var(--accent, #8fd14f) 14%, transparent);
  border-color: var(--accent, #8fd14f);
}
.support__icon {
  display: inline-flex;
  width: 15px;
  height: 15px;
}
.support__icon :deep(svg) {
  width: 100%;
  height: 100%;
}
.support:hover .support__icon {
  animation: heartbeat 0.9s ease-in-out;
}
@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.25);
  }
  30% {
    transform: scale(1.05);
  }
  45% {
    transform: scale(1.18);
  }
  60% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .support:hover .support__icon {
    animation: none;
  }
}
</style>
