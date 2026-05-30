<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { BY_ID } from '../data/trees.data'
import { parentDemand, invTotal } from '../domain/plan'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreeActions } from '../composables/useTreeActions'
import InvCounters from './InvCounters.vue'

const store = useTreesStore()
const actions = useTreeActions()
const root = ref<HTMLElement>()

const popup = computed(() => actions.invPopup.value)
const tree = computed(() => (popup.value ? BY_ID[popup.value.id] : undefined))
const demand = computed(() =>
  popup.value ? parentDemand(store.progress, popup.value.id) : { need: 0, needRem: 0 },
)
const have = computed(() => (popup.value ? invTotal(store.inv(popup.value.id)) : 0))

function onDown(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (root.value && !root.value.contains(target) && !target?.closest('.node__inv')) {
    actions.closeInv()
  }
}
onMounted(() => document.addEventListener('mousedown', onDown))
onUnmounted(() => document.removeEventListener('mousedown', onDown))
</script>

<template>
  <div
    v-if="popup && tree"
    ref="root"
    class="popup is-open"
    :style="{ left: `${popup.x}px`, top: `${popup.y}px` }"
  >
    <div class="popup__head">
      <div class="popup__title">{{ tree.id }}</div>
      <div class="popup__tools">
        <span class="pill pill--tier" :class="`t--${tree.tier}`">T{{ tree.tier }}</span>
        <button class="counter__btn" type="button" @click="actions.closeInv()">
          <IconBase name="close" />
        </button>
      </div>
    </div>

    <div class="hint popup__need">
      <template v-if="demand.need">
        Нужно как родитель:
        <b class="u-mono" :class="{ 'is-ok': have >= demand.needRem }">{{ demand.needRem }}</b>
        ед.<template v-if="demand.need !== demand.needRem">
          (всего по плану {{ demand.need }})</template
        >
        · саженцы/пыльца взаимозаменяемы
      </template>
      <template v-else>В цепочке плодов не требуется как родитель.</template>
    </div>

    <div class="popup__counters"><InvCounters :id="popup.id" /></div>
    <div class="popup__total">
      Итого: <b class="u-mono" :class="{ 'is-ok': have >= demand.needRem }">{{ have }}</b
      ><template v-if="demand.need"> / {{ demand.needRem }}</template>
    </div>
  </div>
</template>

<style scoped>
.popup {
  position: fixed;
  z-index: 150;
  width: 300px;
  background: linear-gradient(180deg, rgba(28, 42, 33, 0.99), rgba(18, 27, 21, 0.99));
  border: 1px solid var(--line);
  border-radius: 15px;
  padding: 15px 16px;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.popup__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.popup__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 16px;
}
.popup__tools {
  display: flex;
  gap: 6px;
  align-items: center;
}
.popup__need {
  margin-bottom: 10px;
}
.popup__counters {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 14px;
}
.popup__counters :deep(.counter__val) {
  font-size: 16px;
  min-width: 22px;
}
.popup__total {
  margin-top: 10px;
  font-size: 13px;
}
.hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
.u-mono {
  font-family: var(--font-mono);
}
.is-ok {
  color: var(--ok);
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}
.pill--tier {
  background: var(--tc);
  color: var(--dark-ink);
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
}
.counter__btn :deep(.icon) {
  width: 13px;
  height: 13px;
}
</style>
