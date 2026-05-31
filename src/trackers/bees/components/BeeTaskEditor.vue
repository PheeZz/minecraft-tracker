<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { COMB_NAMES, shortComb } from '../domain/combs'
import type { BeeTask } from '../domain/tasks'
import CombIcon from './CombIcon.vue'

const props = defineProps<{ initial?: BeeTask }>()
const emit = defineEmits<{
  save: [payload: { name: string; combs: string[] }]
  cancel: []
}>()

const name = ref(props.initial?.name ?? '')
const picked = ref<Set<string>>(new Set(props.initial?.combs ?? []))
const query = ref('')

// Родитель монтирует форму через v-if на задачу, но на случай переиспользования
// инстанса синхронизируем поля при смене initial — иначе показались бы старые данные.
watch(
  () => props.initial,
  (t) => {
    name.value = t?.name ?? ''
    picked.value = new Set(t?.combs ?? [])
  },
)

const q = computed(() => query.value.trim().toLowerCase())
const rows = computed(() => COMB_NAMES.filter((n) => !q.value || n.toLowerCase().includes(q.value)))
const canSave = computed(() => name.value.trim().length > 0 && picked.value.size > 0)

function toggle(comb: string): void {
  const next = new Set(picked.value)
  if (next.has(comb)) next.delete(comb)
  else next.add(comb)
  picked.value = next
}
function submit(): void {
  if (!canSave.value) return
  emit('save', { name: name.value.trim(), combs: [...picked.value] })
}
</script>

<template>
  <form class="editor" @submit.prevent="submit">
    <input
      v-model="name"
      class="editor__name"
      type="text"
      placeholder="Название задачи (например, Предмет №1)"
      aria-label="Название задачи"
    />

    <label class="editor__search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input v-model="query" type="text" placeholder="найти соту…" aria-label="найти соту" />
    </label>

    <div class="editor__combs">
      <button
        v-for="comb in rows"
        :key="comb"
        type="button"
        class="combchip"
        :class="{ on: picked.has(comb) }"
        :aria-pressed="picked.has(comb)"
        @click="toggle(comb)"
      >
        <CombIcon :name="comb" />
        {{ shortComb(comb) }}
      </button>
      <span v-if="!rows.length" class="editor__none">ничего не найдено</span>
    </div>

    <div class="editor__actions">
      <span class="editor__count">выбрано: {{ picked.size }}</span>
      <button type="button" class="editor__cancel" @click="emit('cancel')">Отмена</button>
      <button type="submit" class="editor__save" :disabled="!canSave">Сохранить</button>
    </div>
  </form>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--honey-dk);
  border-radius: 12px;
  background: var(--bg2);
}
.editor__name {
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 9px 12px;
  outline: none;
}
.editor__name:focus {
  border-color: var(--honey-dk);
}
.editor__search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 0 10px;
}
.editor__search input {
  flex: 1;
  font: inherit;
  font-size: 13px;
  background: none;
  border: 0;
  padding: 8px 0;
  color: var(--ink);
  outline: none;
}
.editor__search svg {
  width: 15px;
  height: 15px;
  color: var(--honey-dk);
}
.editor__combs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  max-height: 220px;
  overflow: auto;
  padding: 2px;
}
.combchip {
  display: inline-flex;
  align-items: center;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink2);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 5px 9px;
  cursor: pointer;
  transition: 0.12s;
}
.combchip:hover {
  border-color: var(--honey-dk);
}
.combchip:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.combchip.on {
  background: var(--src-f-soft);
  border-color: var(--src-f);
  color: var(--ink);
}
.editor__none {
  font-size: 12px;
  font-style: italic;
  color: var(--dim);
  padding: 6px 2px;
}
.editor__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.editor__count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-right: auto;
}
.editor__cancel,
.editor__save {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  border-radius: 9px;
  padding: 8px 14px;
  cursor: pointer;
  border: 1px solid var(--cardln);
}
.editor__cancel {
  background: none;
  color: var(--ink2);
}
.editor__save {
  background: var(--solid);
  color: var(--solid-ink);
  border-color: var(--solid);
}
.editor__save:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
