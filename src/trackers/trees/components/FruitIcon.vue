<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { fruitIconUrl } from '../domain/fruitIcon'

const props = defineProps<{ fruit: string; size?: number }>()
const url = computed(() => fruitIconUrl(props.fruit))
const px = computed(() => props.size ?? 16)

// скелетон до загрузки картинки; при смене url снова показываем скелетон
const loaded = ref(false)
watch(url, () => (loaded.value = false))
</script>

<template>
  <img
    v-if="url"
    class="fruit-icon"
    :class="{ 'ico-skel': !loaded }"
    :src="url"
    :width="px"
    :height="px"
    :alt="fruit"
    @load="loaded = true"
    @error="loaded = true"
  />
  <IconBase v-else name="fruit" />
</template>

<style scoped>
.fruit-icon {
  image-rendering: pixelated;
  vertical-align: -3px;
  flex: none;
}
</style>
