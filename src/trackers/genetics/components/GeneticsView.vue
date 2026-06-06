<script setup lang="ts">
import { ref } from 'vue'
import GeneCollection from './GeneCollection.vue'
import GeneCard from './GeneCard.vue'
import type { AlleleDef, TraitDef } from '../domain/genetics'

const card = ref<{ trait: TraitDef; allele: AlleleDef } | null>(null)
function pick(trait: TraitDef, allele: AlleleDef): void {
  card.value = { trait, allele }
}
</script>

<template>
  <div class="genetics">
    <GeneCollection @pick="pick" />
    <GeneCard v-if="card" :trait="card.trait" :allele="card.allele" @close="card = null" />
  </div>
</template>

<style scoped>
.genetics {
  height: 100%;
  overflow: auto;
}
</style>
