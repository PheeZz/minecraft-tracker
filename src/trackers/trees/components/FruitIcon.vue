<script setup lang="ts">
import { computed } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { fruitIconUrl } from '../domain/fruitIcon'

const props = defineProps<{ fruit: string; size?: number }>()
const url = computed(() => fruitIconUrl(props.fruit))
const px = computed(() => props.size ?? 16)
</script>

<template>
  <img v-if="url" class="fruit-icon" :src="url" :width="px" :height="px" :alt="fruit" />
  <IconBase v-else name="fruit" />
</template>

<style scoped>
.fruit-icon {
  image-rendering: pixelated;
  vertical-align: -3px;
  flex: none;
}
</style>
