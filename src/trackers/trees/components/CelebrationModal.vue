<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { useFocusTrap } from '@/shared/ui/useFocusTrap'
import { fireConfetti } from '@/shared/ui/confetti'
import { useTreesCelebration } from '../stores/useTreesCelebration'

const celebration = useTreesCelebration()
const boxEl = ref<HTMLElement>()
const open = computed(() => !!celebration.current)
useFocusTrap(boxEl, { active: open, onEscape: () => celebration.dismiss() })

// при появлении нового достижения — залп конфетти (после рендера, flush:'post')
watch(
  () => celebration.current?.id,
  (id) => id && void fireConfetti(),
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <div v-if="celebration.current" class="modal is-open" @click.self="celebration.dismiss()">
    <div
      ref="boxEl"
      class="modal__box"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebrate-title"
    >
      <div class="celebrate__badge"><IconBase name="fruit" /></div>
      <div id="celebrate-title" class="modal__title">{{ celebration.current.title }}</div>
      <p class="celebrate__text">{{ celebration.current.text }}</p>
      <button class="btn celebrate__btn" type="button" autofocus @click="celebration.dismiss()">
        Ура! 🎉
      </button>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(60% 60% at 50% 40%, rgba(6, 16, 11, 0.55), rgba(4, 9, 7, 0.82));
  backdrop-filter: blur(4px);
}
.modal__box {
  width: min(420px, 92vw);
  text-align: center;
  background: linear-gradient(180deg, rgba(28, 42, 33, 0.98), rgba(18, 27, 21, 0.98));
  border: 1px solid var(--amber, #e8a72c);
  border-radius: 18px;
  padding: 26px 24px 22px;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    0 0 50px rgba(232, 167, 44, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.celebrate__badge {
  width: 58px;
  height: 58px;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(232, 167, 44, 0.25), rgba(232, 167, 44, 0.05));
  border: 1.5px solid var(--amber, #e8a72c);
}
.celebrate__badge :deep(.icon) {
  font-size: 30px;
  color: var(--amber, #e8a72c);
}
.modal__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: var(--amber, #e8a72c);
  margin-bottom: 8px;
}
.celebrate__text {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0 0 18px;
}
.btn {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  color: var(--dark-ink, #0c1410);
  background: var(--amber, #e8a72c);
  border: 0;
  padding: 11px 22px;
  border-radius: 11px;
  cursor: pointer;
  transition: 0.15s;
}
.celebrate__btn {
  min-width: 140px;
}
.btn:hover {
  filter: brightness(1.08);
}
</style>
