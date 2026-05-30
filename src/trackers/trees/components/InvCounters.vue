<script setup lang="ts">
import IconBase from '@/shared/ui/IconBase.vue'
import { useTreesStore } from '../stores/useTreesStore'

const props = defineProps<{ id: string }>()
const store = useTreesStore()
</script>

<template>
  <div class="counter-group">
    <span class="counter counter--sap">
      <IconBase name="sprout" />
      <button class="counter__btn" type="button" @click="store.adjustInv(props.id, 'sap', -1)">
        <IconBase name="minus" />
      </button>
      <b class="counter__val">{{ store.inv(props.id).sap }}</b>
      <button class="counter__btn" type="button" @click="store.adjustInv(props.id, 'sap', 1)">
        <IconBase name="plus" />
      </button>
    </span>
    <span class="counter counter--pol">
      <IconBase name="pollen" />
      <button class="counter__btn" type="button" @click="store.adjustInv(props.id, 'pol', -1)">
        <IconBase name="minus" />
      </button>
      <b class="counter__val">{{ store.inv(props.id).pol }}</b>
      <button class="counter__btn" type="button" @click="store.adjustInv(props.id, 'pol', 1)">
        <IconBase name="plus" />
      </button>
    </span>
  </div>
</template>

<style scoped>
.counter-group {
  margin-top: 6px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.counter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.counter--sap {
  color: var(--sap);
}
.counter--pol {
  color: var(--amber);
}
.counter__btn {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid var(--edge);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 0;
}
.counter__btn:hover {
  background: rgba(143, 209, 79, 0.14);
  border-color: var(--leaf-dim);
}
.counter__btn :deep(.icon) {
  width: 13px;
  height: 13px;
  vertical-align: 0;
}
.counter__val {
  min-width: 18px;
  text-align: center;
  font-family: var(--font-mono);
  font-weight: 700;
}
</style>
