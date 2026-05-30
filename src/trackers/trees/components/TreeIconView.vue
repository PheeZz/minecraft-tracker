<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { treeIcon } from '../domain/icons'
import {
  ensureTreeTextures,
  paintTreeCanvas,
  treeTexturesReady,
} from '../composables/useTreeTextures'

const props = defineProps<{ name: string; size?: number }>()
const el = ref<HTMLCanvasElement>()
const icon = computed(() => treeIcon(props.name))
const px = computed(() => props.size ?? 22)

function paint() {
  if (el.value) paintTreeCanvas(el.value)
}
onMounted(() => {
  ensureTreeTextures()
  if (treeTexturesReady.value) paint()
})
watch(treeTexturesReady, (ready) => ready && paint())
watch(icon, paint)
</script>

<template>
  <canvas
    v-if="icon"
    ref="el"
    class="tree-icon"
    :width="px"
    :height="px"
    :data-kind="icon.kind"
    :data-file="icon.kind === 'forestry' ? icon.file : undefined"
    :data-tpl="icon.kind === 'extratrees' ? icon.tpl : undefined"
    :data-c="icon.kind === 'extratrees' ? icon.c : undefined"
  />
</template>

<style scoped>
.tree-icon {
  image-rendering: pixelated;
  flex: none;
  vertical-align: -4px;
}
</style>
