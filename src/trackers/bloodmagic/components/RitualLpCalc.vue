<script setup lang="ts">
// LP-калькулятор ритуала: активация, поддержание, расход в худшем случае, длительность орба мага.
// Все расчёты — domain/lp.ts; тут только отображение.
import { computed } from 'vue'
import type { Ritual } from '../domain/types'
import { ORBS } from '../data/orbs.data'
import { maxDrainPerSecond, minOrbDurationSeconds, formatLP, formatDuration } from '../domain/lp'
import IconBase from '@/shared/ui/IconBase.vue'

const { ritual } = defineProps<{ ritual: Ritual }>()

// Орб мага — tier 3, capacity 150 000 LP
const MAGICIAN_ORB = ORBS.find((o) => o.tier === 3)!

const drainPerSec = computed(() => maxDrainPerSecond(ritual.upkeep_LP_per_tick))
const magicianDuration = computed(() =>
  minOrbDurationSeconds(MAGICIAN_ORB.capacity_LP, ritual.upkeep_LP_per_tick),
)

const hasUpkeep = computed(() => ritual.upkeep_LP_per_tick > 0)
</script>

<template>
  <div class="rlc">
    <h4 class="rlc__title">LP-калькулятор</h4>

    <dl class="rlc__grid">
      <dt class="rlc__dt">Активация</dt>
      <dd class="rlc__dd rlc__dd--accent">
        <IconBase name="lp" class="rlc__lp-ic" />
        {{ formatLP(ritual.activation_LP) }} LP
      </dd>

      <template v-if="hasUpkeep">
        <dt class="rlc__dt">Расход (поддержание)</dt>
        <dd class="rlc__dd">
          <IconBase name="lp" class="rlc__lp-ic" />
          {{ formatLP(ritual.upkeep_LP_per_tick) }} LP / тик
        </dd>

        <dt class="rlc__dt">Макс. слив (худший случай)</dt>
        <dd class="rlc__dd rlc__dd--warn">
          <IconBase name="lp" class="rlc__lp-ic" />
          {{ formatLP(drainPerSec) }} LP/сек
          <span class="rlc__caveat">при непрерывной работе</span>
        </dd>

        <dt class="rlc__dt">{{ MAGICIAN_ORB.name_ru }}</dt>
        <dd class="rlc__dd">
          мин. {{ formatDuration(magicianDuration) }}
          <span class="rlc__caveat">нижняя граница, худший случай</span>
        </dd>
      </template>

      <template v-else>
        <dt class="rlc__dt">Расход</dt>
        <dd class="rlc__dd rlc__dd--free">Без расхода</dd>
      </template>
    </dl>

    <p class="rlc__note">
      Точное время работы зависит от нагрузки сервера. Данные — худший сценарий (непрерывная
      работа).
    </p>
  </div>
</template>

<style scoped>
.rlc {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--card2);
  border: 1px solid var(--cardln);
  border-radius: 10px;
}

.rlc__title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.rlc__grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 12px;
  align-items: baseline;
}

.rlc__dt {
  font-size: 11.5px;
  color: var(--muted);
  white-space: nowrap;
}

.rlc__dd {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

/* Миниатюрная LP-иконка в строках калькулятора */
.rlc__lp-ic {
  color: var(--honey-dk);
  opacity: 0.75;
  display: inline-flex;
  align-items: center;
  flex: none;
}

.rlc__lp-ic :deep(svg) {
  width: 11px;
  height: 11px;
}

.rlc__dd--accent {
  color: var(--honey-dk);
  font-weight: 700;
}

.rlc__dd--warn {
  color: #e0344a;
}

.rlc__dd--free {
  color: var(--src-f);
  font-style: italic;
}

.rlc__caveat {
  font-family: var(--font-body, inherit);
  font-size: 10px;
  color: var(--muted);
  font-style: italic;
  font-weight: 400;
}

.rlc__note {
  font-size: 10px;
  color: var(--muted);
  font-style: italic;
  margin: 4px 0 0;
  line-height: 1.5;
}
</style>
