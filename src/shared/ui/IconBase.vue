<script setup lang="ts">
import { ICONS, type IconName } from '@/shared/icons/icons'

defineProps<{ name: IconName }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html — доверенный набор собственных inline-SVG -->
  <span class="icon" v-html="ICONS[name]" />
</template>
