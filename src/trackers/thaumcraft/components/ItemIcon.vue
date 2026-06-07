<script setup lang="ts">
// Иконка предмета/блока слева от названия. Путь icon — относительный
// под public/thaumcraft/tex/ (см. item-icon-map.json и автогенерацию).
// Нет иконки или ошибка загрузки — ничего не рисуем, остаётся текст.
import { ref } from 'vue'

defineProps<{
  /** Предмет с опциональной текстурой; рисуется только при наличии icon. */
  item: { ru?: string; en?: string; icon?: string }
  /** Размер стороны в px (по умолчанию 18). */
  size?: number
}>()

const broken = ref(false)
const hide = (): void => {
  broken.value = true
}
const base = import.meta.env.BASE_URL
</script>

<template>
  <img
    v-if="item.icon && !broken"
    :src="`${base}thaumcraft/tex/${item.icon}`"
    class="iicon"
    :style="{ width: `${size ?? 18}px`, height: `${size ?? 18}px` }"
    alt=""
    aria-hidden="true"
    :title="item.en"
    @error="hide"
  />
</template>

<style scoped>
.iicon {
  image-rendering: pixelated;
  flex: none;
  vertical-align: middle;
  /* многие текстуры TC — анимационные спрайт-ленты (кадры по вертикали);
     cover + top показывает первый кадр, заполняя квадрат (а не сжимает ленту в полоску) */
  object-fit: cover;
  object-position: top;
}
</style>
