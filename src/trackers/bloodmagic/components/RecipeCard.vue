<script setup lang="ts">
// Карточка одного рецепта BloodMagic. Принимает готовый объект Recipe.
// Вынесено из RecipesPanel для соблюдения лимита строк компонента.
// Схема алтаря НЕ рендерится инлайн — открывается через emit('show-altar', tier).
import { computed } from 'vue'
import type { Recipe, ItemRef } from '../domain/types'
import { SOURCE_LABELS } from '../domain/filterRecipes'
import ItemIcon from './ItemIcon.vue'
import IconBase from '@/shared/ui/IconBase.vue'

const props = defineProps<{ recipe: Recipe }>()

// Клик по бейджу тира altar-рецепта открывает диалог структуры алтаря в родителе
const emit = defineEmits<{ 'show-altar': [tier: number] }>()

// Извлекаем tier2/tier3 ингредиенты из meta один раз — каждый v-if и v-for читает cached computed
const tier2Inputs = computed<ItemRef[]>(() => {
  const raw = props.recipe.meta?.tier2
  return Array.isArray(raw) ? (raw as ItemRef[]) : []
})

const tier3Inputs = computed<ItemRef[]>(() => {
  const raw = props.recipe.meta?.tier3
  return Array.isArray(raw) ? (raw as ItemRef[]) : []
})
</script>

<template>
  <article class="rc">
    <!-- Шапка: иконка + имя output + бейджи -->
    <div class="rc__head">
      <h3 class="rc__name" :title="recipe.output.name_en">
        <ItemIcon :item="recipe.output" :size="20" />
        {{ recipe.output.name_ru }}
      </h3>
      <div class="rc__badges">
        <span class="badge badge--src" :data-src="recipe.source">
          {{ SOURCE_LABELS[recipe.source] }}
        </span>
        <span v-if="recipe.addon === 'bloodarsenal'" class="badge badge--addon">BloodArsenal</span>
        <span v-if="recipe.creativeOnly" class="badge badge--creative">только креатив</span>
        <!-- Для altar-рецептов бейдж тира — кликабельная кнопка, открывает схему в диалоге -->
        <button
          v-if="recipe.source === 'altar' && recipe.minTier != null"
          type="button"
          class="badge badge--tier badge--tier-btn"
          :aria-label="`Показать структуру алтаря тира ${recipe.minTier}`"
          @click="emit('show-altar', recipe.minTier!)"
        >
          Тир {{ recipe.minTier }}
        </button>
        <!-- Для прочих источников тир — обычный некликабельный бейдж -->
        <span
          v-else-if="recipe.source !== 'altar' && recipe.minTier != null"
          class="badge badge--tier"
          >Тир {{ recipe.minTier }}</span
        >
        <span v-if="recipe.lp != null" class="badge badge--lp">
          <IconBase name="lp" class="badge-lp-ic" />
          {{ recipe.lp.toLocaleString() }} LP
        </span>
      </div>
    </div>

    <!-- Ингредиенты основного тира -->
    <div v-if="recipe.inputs.length" class="rc__row">
      <span class="rc__arr" aria-hidden="true">←</span>
      <ul class="rc__inputs">
        <li v-for="(it, i) in recipe.inputs" :key="i" class="rc__chip" :title="it.name_en">
          <ItemIcon :item="it" :size="16" />
          <span>{{ it.name_ru }}</span>
        </li>
      </ul>
    </div>

    <!-- Ингредиенты Тира 2 для summoning (если есть) -->
    <div v-if="tier2Inputs.length" class="rc__row rc__row--tier">
      <span class="rc__tier-label">Тир 2:</span>
      <ul class="rc__inputs">
        <li v-for="(it, i) in tier2Inputs" :key="i" class="rc__chip" :title="it.name_en">
          <ItemIcon :item="it" :size="16" />
          <span>{{ it.name_ru }}</span>
        </li>
      </ul>
    </div>

    <!-- Ингредиенты Тира 3 для summoning (если есть) -->
    <div v-if="tier3Inputs.length" class="rc__row rc__row--tier">
      <span class="rc__tier-label">Тир 3:</span>
      <ul class="rc__inputs">
        <li v-for="(it, i) in tier3Inputs" :key="i" class="rc__chip" :title="it.name_en">
          <ItemIcon :item="it" :size="16" />
          <span>{{ it.name_ru }}</span>
        </li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
.rc {
  content-visibility: auto;
  contain-intrinsic-size: auto 140px;
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 12px;
  padding: 11px 13px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 7px;
  transition:
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

/* Лёгкий hover-glow — еле заметная кровавая аура при наведении */
.rc:hover {
  box-shadow:
    var(--shadow-card),
    0 0 14px rgba(138, 16, 32, 0.18);
  border-color: rgba(138, 16, 32, 0.45);
}

.rc__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.rc__name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13.5px;
  margin: 0;
  line-height: 1.25;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--ink);
}

/* Бейджи — горизонтальный ряд с переносом, единая высота и выравнивание */
.rc__badges {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  flex: none;
  max-width: 160px;
}

/* Единая база для всех бейджей: одинаковая высота, центровка, отступы */
.badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  border-radius: 5px;
  padding: 3px 7px;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  line-height: 1;
}

.badge--src {
  background: var(--solid);
  color: var(--solid-ink);
}
/* цвета по типу источника */
.badge--src[data-src='alchemy'] {
  background: #4a1c6a;
  color: #e8c4ff;
}
.badge--src[data-src='crafting'] {
  background: #1a3a1a;
  color: #a0e0a0;
}
.badge--src[data-src='binding'] {
  background: #2a1a3a;
  color: #c0a0e0;
}
.badge--src[data-src='summoning'] {
  background: #3a1010;
  color: #ff9090;
}
.badge--src[data-src='altar'] {
  background: var(--solid);
  color: var(--solid-ink);
}

.badge--addon {
  background: #1a2240;
  color: #80aaff;
  border: 1px solid #304080;
}

.badge--creative {
  background: rgba(120, 120, 120, 0.12);
  color: var(--ink2);
  border: 1px solid rgba(120, 120, 120, 0.24);
}

.badge--tier {
  background: rgba(255, 207, 107, 0.12);
  color: var(--amber);
  border: 1px solid rgba(255, 207, 107, 0.24);
}

/* Кнопка-бейдж тира для altar-рецептов: такие же визуальные параметры + курсор + hover */
.badge--tier-btn {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.1s ease,
    border-color 0.1s ease;
}

.badge--tier-btn:hover {
  background: rgba(255, 207, 107, 0.24);
  border-color: var(--amber);
}

.badge--tier-btn:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 1px;
}

.badge--lp {
  background: rgba(224, 52, 74, 0.14);
  color: var(--honey-dk);
  border: 1px solid rgba(224, 52, 74, 0.28);
}

/* LP-иконка внутри бейджа */
.badge-lp-ic {
  color: var(--honey-dk);
  opacity: 0.8;
  display: inline-flex;
  align-items: center;
}

.badge-lp-ic :deep(svg) {
  width: 9px;
  height: 9px;
}

.rc__row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.rc__arr {
  color: var(--honey-dk);
  font-weight: 700;
  font-size: 14px;
  line-height: 1.5;
  flex: none;
}

.rc__row--tier {
  padding-top: 4px;
  border-top: 1px dashed var(--cardln);
}

.rc__tier-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--amber);
  flex: none;
  line-height: 1.8;
}

.rc__inputs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.rc__chip {
  font-size: 11px;
  color: var(--ink2);
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 5px;
  padding: 2px 7px 2px 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
