<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { combColor } from '../domain/colors'
import { ensureTextures, paintCanvas, texturesReady } from '../composables/useBeeTextures'

const props = defineProps<{ name: string; big?: boolean }>()
const el = ref<HTMLCanvasElement>()
const color = computed(() => combColor(props.name))

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
    class="cic"
    :class="{ big, 'ico-skel': !texturesReady }"
    width="16"
    height="16"
    :data-p="color.p"
    :data-s="color.s"
  />
</template>

<style scoped>
.cic {
  width: 18px;
  height: 18px;
  image-rendering: pixelated;
  vertical-align: -4px;
  margin-right: 6px;
  flex: none;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.28));
}
.cic.big {
  width: 26px;
  height: 26px;
  vertical-align: -6px;
}
</style>
