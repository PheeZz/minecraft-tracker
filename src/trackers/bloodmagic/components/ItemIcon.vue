<script setup lang="ts">
// Иконка предмета BloodMagic. Путь icon — относительный под public/
// (напр. `bloodmagic/items/alchemicalwizardry/AirSigil.png`).
// При отсутствии icon или ошибке загрузки — текстовый fallback: инициалы имени.
import { ref, computed } from 'vue'
import type { ItemRef } from '../domain/types'

const props = withDefaults(
  defineProps<{
    /** Предмет с опциональным полем icon (путь от public/). */
    item: Pick<ItemRef, 'icon' | 'name_ru' | 'name_en'>
    /** Размер стороны в px (по умолчанию 20). */
    size?: number
  }>(),
  { size: 20 },
)

const broken = ref(false)
const base = import.meta.env.BASE_URL

const showImg = computed(() => !!props.item.icon && !broken.value)
const title = computed(() => props.item.name_ru || props.item.name_en)

// Инициалы из первого слова имени для текстового fallback
const initials = computed(() => {
  const word = (props.item.name_ru || props.item.name_en).trim().split(/\s+/)[0] ?? '?'
  return word.slice(0, 2).toUpperCase()
})

const onError = (): void => {
  broken.value = true
}
</script>

<template>
  <img
    v-if="showImg"
    :src="`${base}${item.icon}`"
    class="bm-icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :alt="title"
    :title="title"
    @error="onError"
  />
  <span
    v-else
    class="bm-icon bm-icon--fallback"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.42)}px` }"
    :title="title"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>

<style scoped>
.bm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  vertical-align: middle;
  image-rendering: pixelated;
  object-fit: cover;
  object-position: top;
  border-radius: 2px;
}

.bm-icon--fallback {
  background: rgba(138, 16, 32, 0.28);
  border: 1px solid var(--cardln);
  color: var(--alt);
  font-family: var(--font-mono);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}
</style>
