<script setup lang="ts">
import { computed, ref } from 'vue'
import { ASPECT_BY_TAG } from '../domain/aspects'

const props = withDefaults(defineProps<{ tag: string; size?: number; muted?: boolean }>(), {
  size: 56,
  muted: false,
})

const aspect = computed(() => ASPECT_BY_TAG.get(props.tag))
const color = computed(() => aspect.value?.color ?? '#c9a3ff')
const broken = ref(false) // нет запечённой иконки → показываем только цветной гекс
const title = computed(() => {
  const a = aspect.value
  if (!a) return props.tag
  return a.nameRu && a.nameRu !== a.nameEn
    ? `${a.label} · ${a.nameRu} / ${a.nameEn}`
    : `${a.label} · ${a.nameEn}`
})
const iconUrl = computed(() => `${import.meta.env.BASE_URL}thaumcraft/aspects/${props.tag}.png`)
const iconSize = computed(() => Math.round(props.size * 0.56))
</script>

<template>
  <span
    class="ahex"
    :class="{ muted }"
    :style="{ '--c': color, '--w': size + 'px', '--ic': iconSize + 'px' }"
    :title="title"
  >
    <span class="ahex__frame"></span>
    <span class="ahex__inner"></span>
    <img
      v-show="!broken"
      class="ahex__img"
      :src="iconUrl"
      alt=""
      aria-hidden="true"
      @error="broken = true"
    />
  </span>
</template>

<style scoped>
.ahex {
  position: relative;
  display: inline-block;
  width: var(--w);
  height: calc(var(--w) * 1.1547); /* высота pointy-top гекса = ширина · 2/√3 */
  flex: none;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 50%, transparent));
}
.ahex.muted {
  filter: none;
  opacity: 0.85;
}
.ahex__frame,
.ahex__inner {
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
}
.ahex__frame {
  background: var(--c);
}
.ahex__inner {
  inset: 2px;
  background: #14101e;
}
.ahex__img {
  position: absolute;
  inset: 0;
  margin: auto;
  width: var(--ic);
  height: var(--ic);
  image-rendering: pixelated;
  z-index: 2;
}
</style>
