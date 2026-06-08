<script setup lang="ts">
// Карточка описания ритуала: бейдж эффекта, назначение, сворачиваемый лор.
import { ref } from 'vue'
import type { Ritual } from '../domain/types'

const { ritual } = defineProps<{ ritual: Ritual }>()

// Убираем префикс «RitualEffect» для читаемого бейджа
function effectLabel(effect: string): string {
  return effect.replace(/^RitualEffect/, '')
}

const loreExpanded = ref(false)
</script>

<template>
  <div class="rd">
    <div class="rd__meta">
      <span class="rd__effect-badge">{{ effectLabel(ritual.effect) }}</span>
      <p v-if="ritual.purpose_ru" class="rd__purpose">{{ ritual.purpose_ru }}</p>
    </div>

    <div v-if="ritual.description_en" class="rd__lore">
      <button type="button" class="rd__lore-toggle" @click="loreExpanded = !loreExpanded">
        {{ loreExpanded ? 'Скрыть лор' : 'Из дневника мага' }}
        <span class="rd__lore-arrow" :class="{ open: loreExpanded }">▾</span>
      </button>
      <p v-if="loreExpanded" class="rd__lore-text">{{ ritual.description_en }}</p>
    </div>
  </div>
</template>

<style scoped>
.rd {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rd__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rd__effect-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 5px;
  background: rgba(138, 16, 32, 0.22);
  color: var(--alt);
  border: 1px solid var(--cardln);
  align-self: flex-start;
}

.rd__purpose {
  font-size: 13px;
  color: var(--ink);
  line-height: 1.5;
  margin: 0;
}

.rd__lore-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  font-size: 11px;
  color: var(--muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.15s;
}

.rd__lore-toggle:hover {
  color: var(--ink);
}

.rd__lore-arrow {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 12px;
}

.rd__lore-arrow.open {
  transform: rotate(180deg);
}

.rd__lore-text {
  margin: 8px 0 0;
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.6;
  font-style: italic;
  border-left: 2px solid var(--cardln);
  padding-left: 10px;
}
</style>
