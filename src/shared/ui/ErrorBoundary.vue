<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

// Ловим ошибки рендера/жизненного цикла/вотчеров в дочерних компонентах и
// показываем fallback вместо белого экрана. Сам слот при ошибке убирается
// (v-else), поэтому сломанное поддерево размонтируется и не рендерится в цикле.
const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  console.error('[ErrorBoundary]', err)
  return false // не пробрасываем дальше
})

function reload(): void {
  location.reload()
}
function dismiss(): void {
  error.value = null
}
</script>

<template>
  <div v-if="error" class="errbound" role="alert">
    <div class="errbound__box">
      <h1 class="errbound__title">Что-то сломалось</h1>
      <p class="errbound__msg">{{ error.message }}</p>
      <div class="errbound__actions">
        <button type="button" class="errbound__btn errbound__btn--primary" @click="reload">
          Перезагрузить
        </button>
        <button type="button" class="errbound__btn" @click="dismiss">Попробовать снова</button>
      </div>
      <p class="errbound__hint">
        Данные сохранены локально и не потеряны. Если повторяется — перезагрузи страницу.
      </p>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.errbound {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
  padding: 24px;
  color: var(--ink, #f1e7d4);
}
.errbound__box {
  max-width: 460px;
  text-align: center;
  background: var(--card, #261f16);
  border: 1px solid var(--cardln, #3b3225);
  border-radius: 16px;
  padding: 28px 26px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}
.errbound__title {
  font-family: var(--font-display, sans-serif);
  font-weight: 800;
  font-size: 20px;
  margin: 0 0 10px;
}
.errbound__msg {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--rust, #e0813c);
  background: var(--bg2, #14110c);
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0 0 16px;
  overflow-wrap: anywhere;
}
.errbound__actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.errbound__btn {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid var(--cardln, #3b3225);
  background: none;
  color: var(--ink2, #cdbb98);
  cursor: pointer;
}
.errbound__btn--primary {
  background: var(--honey, #e8a72c);
  border-color: var(--honey, #e8a72c);
  color: #1a1510;
}
.errbound__hint {
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--muted, #9a8868);
}
</style>
