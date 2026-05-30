<script setup lang="ts">
import { computed } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { useTreesStore } from '../stores/useTreesStore'

const store = useTreesStore()
const C = 163.4
const dashOffset = computed(() => C * (1 - store.hero.pct / 100))
</script>

<template>
  <div class="hero">
    <div class="hero__ring">
      <svg class="hero__ring-svg" width="58" height="58">
        <circle
          cx="29"
          cy="29"
          r="26"
          fill="none"
          stroke="rgba(255,255,255,.08)"
          stroke-width="6"
        />
        <circle
          class="hero__ring-fg"
          cx="29"
          cy="29"
          r="26"
          fill="none"
          stroke="var(--leaf)"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="C"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <div class="hero__pct">{{ store.hero.pct }}%</div>
    </div>
    <div class="hero__stats">
      <div class="hero__stat">
        <span class="hero__val"
          >{{ store.hero.bred }}<small> / {{ store.hero.breedableTotal }}</small></span
        >
        <span class="hero__lbl">Выведено</span>
      </div>
      <div class="hero__stat">
        <span class="hero__val" :class="{ 'is-active': store.hero.available }">{{
          store.hero.available
        }}</span>
        <span class="hero__lbl"><IconBase name="bolt" />Доступно</span>
      </div>
      <div class="hero__stat hero__stat--fruit">
        <span class="hero__val"
          >{{ store.hero.fruitsUnlocked }}<small> / {{ store.hero.fruitsTotal }}</small></span
        >
        <span class="hero__lbl"><IconBase name="fruit" />Плодов</span>
      </div>
      <div class="hero__stat hero__stat--sap">
        <span class="hero__val"
          >{{ store.hero.haveSap }}<small> / {{ store.hero.planSap }}</small></span
        >
        <span class="hero__lbl"><IconBase name="sprout" />Саженцы</span>
      </div>
      <div class="hero__stat hero__stat--pol">
        <span class="hero__val"
          >{{ store.hero.havePol }}<small> / {{ store.hero.planPol }}</small></span
        >
        <span class="hero__lbl"><IconBase name="pollen" />Пыльца</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 22px;
}
.hero__ring {
  position: relative;
  width: 58px;
  height: 58px;
  flex: none;
}
.hero__ring-svg {
  transform: rotate(-90deg);
  overflow: visible;
}
.hero__ring-fg {
  filter: drop-shadow(0 0 6px rgba(143, 209, 79, 0.6));
  transition: stroke-dashoffset 0.4s;
}
.hero__pct {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 14px;
  color: var(--leaf);
}
.hero__stats {
  display: flex;
  gap: 18px;
}
.hero__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.hero__val {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1;
}
.hero__val small {
  font-size: 11px;
  color: var(--muted);
  font-weight: 500;
}
.hero__val.is-active {
  color: var(--avail);
}
.hero__lbl {
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 5px;
}
.hero__lbl :deep(.icon) {
  width: 12px;
  height: 12px;
}
.hero__stat--sap .hero__val,
.hero__stat--sap .hero__lbl {
  color: var(--sap);
}
.hero__stat--pol .hero__val,
.hero__stat--pol .hero__lbl {
  color: var(--amber);
}
.hero__stat--fruit .hero__lbl {
  color: var(--amber);
}
</style>
