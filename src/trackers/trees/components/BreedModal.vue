<script setup lang="ts">
import { computed, ref } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { useFocusTrap } from '@/shared/ui/useFocusTrap'
import { BY_ID } from '../data/trees.data'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreeActions } from '../composables/useTreeActions'

const store = useTreesStore()
const actions = useTreeActions()

const id = computed(() => actions.breedModalId.value)
const tree = computed(() => (id.value ? BY_ID[id.value] : undefined))
const pair = computed(() => tree.value?.parents?.[0])

// Фокус-трап: компонент всегда смонтирован, открыт по флагу (id && tree).
const boxEl = ref<HTMLElement>()
const open = computed(() => !!id.value && !!tree.value)
useFocusTrap(boxEl, { active: open, onEscape: actions.breedCancel })

/** Варианты пары (саженец/пыльца взаимозаменяемы): [A-саженец+B-пыльца], [B-саженец+A-пыльца]. */
const options = computed(() => {
  const p = pair.value
  if (!p) return []
  return [
    { sap: p[0], pol: p[1] },
    { sap: p[1], pol: p[0] },
  ]
})
</script>

<template>
  <div v-if="id && tree" class="modal is-open" @click.self="actions.breedCancel()">
    <div
      ref="boxEl"
      class="modal__box"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breed-title"
    >
      <div id="breed-title" class="modal__title">
        <IconBase name="check" />Выведено: {{ tree.id }}
      </div>
      <div class="hint modal__hint">
        Какие ингредиенты потратил? Саженцы и пыльца взаимозаменяемы — выбери комбинацию, счётчики
        уменьшатся на 1.
      </div>

      <button
        v-for="opt in options"
        :key="opt.sap + '|' + opt.pol"
        class="breed-opt"
        :class="{ 'is-ready': store.inv(opt.sap).sap > 0 && store.inv(opt.pol).pol > 0 }"
        type="button"
        @click="actions.breedConfirm(id, opt.sap, opt.pol)"
      >
        <span class="breed-opt__icons">
          <IconBase name="sprout" class="icon--sap" /><IconBase name="pollen" class="icon--pol" />
        </span>
        <span class="breed-opt__body">
          <div class="breed-opt__name">
            {{ opt.sap }} <span class="accent-sap">саженец</span> + {{ opt.pol }}
            <span class="accent-pol">пыльца</span>
          </div>
          <div class="breed-opt__avail">
            <span :class="store.inv(opt.sap).sap > 0 ? 'is-ok' : 'is-low'"
              >{{ opt.sap }}: {{ store.inv(opt.sap).sap }}</span
            >
            ·
            <span :class="store.inv(opt.pol).pol > 0 ? 'is-ok' : 'is-low'"
              >{{ opt.pol }}: {{ store.inv(opt.pol).pol }}</span
            >
          </div>
        </span>
      </button>

      <div class="modal__foot">
        <button class="btn" type="button" @click="actions.breedSkip(id)">Без списания</button>
        <button class="btn" type="button" @click="actions.breedCancel()">Отмена</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(60% 60% at 50% 40%, rgba(6, 16, 11, 0.55), rgba(4, 9, 7, 0.82));
  backdrop-filter: blur(4px);
}
.modal__box {
  width: min(470px, 92vw);
  background: linear-gradient(180deg, rgba(28, 42, 33, 0.98), rgba(18, 27, 21, 0.98));
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.modal__title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 800;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 9px;
}
.modal__title :deep(.icon) {
  color: var(--leaf);
  font-size: 20px;
}
.modal__hint {
  margin-bottom: 14px;
}
.hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
.modal__foot {
  display: flex;
  gap: 9px;
  margin-top: 6px;
}
.modal__foot .btn {
  flex: 1;
  justify-content: center;
}
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 12.5px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--edge);
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.btn:hover {
  background: rgba(143, 209, 79, 0.12);
  border-color: var(--leaf-dim);
}
.breed-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.22);
  border: 1.5px solid var(--edge);
  border-radius: 13px;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
}
.breed-opt:hover {
  border-color: var(--leaf-dim);
}
.breed-opt.is-ready {
  border-color: rgba(143, 209, 79, 0.5);
}
.breed-opt__icons {
  display: flex;
  gap: 4px;
  flex: none;
}
.breed-opt__icons :deep(.icon) {
  font-size: 20px;
}
.breed-opt__icons :deep(.icon--sap) {
  color: var(--sap);
}
.breed-opt__icons :deep(.icon--pol) {
  color: var(--amber);
}
.breed-opt__body {
  flex: 1;
}
.breed-opt__name {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 3px;
}
.breed-opt__name .accent-sap {
  color: var(--sap);
}
.breed-opt__name .accent-pol {
  color: var(--amber);
}
.breed-opt__avail {
  font-size: 11.5px;
  font-family: var(--font-mono);
}
.is-ok {
  color: var(--ok);
}
.is-low {
  color: var(--bad);
}
</style>
