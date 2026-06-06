<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { beeColor } from '../domain/colors'
import { ensureTextures, paintCanvas, texturesReady } from '../composables/useBeeTextures'

const props = defineProps<{ name: string; big?: boolean }>()
const el = ref<HTMLCanvasElement>()
const color = computed(() => beeColor(props.name))

function paint() {
  if (el.value) paintCanvas(el.value)
}
onMounted(() => {
  ensureTextures()
  if (texturesReady.value) paint()
})
watch(texturesReady, (ready) => ready && paint())
watch(color, paint)
</script>

<template>
  <canvas
    v-if="color"
    ref="el"
    class="bic"
    :class="{ big, 'ico-skel': !texturesReady }"
    width="16"
    height="16"
    :data-p="color.p"
    :data-s="color.s"
    :data-body="color.body ?? ''"
  />
</template>

<style scoped>
.bic {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  vertical-align: -5px;
  margin-right: 6px;
  flex: none;
}
.bic.big {
  width: 30px;
  height: 30px;
  vertical-align: -8px;
}
</style>
