<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useBeesStore } from '../stores/useBeesStore'
import type { BeeTask } from '../domain/tasks'
import BeeTaskCard from './BeeTaskCard.vue'
import BeeTaskEditor from './BeeTaskEditor.vue'

const store = useBeesStore()

// null = форма закрыта; 'new' = создание; иначе редактируем задачу с этим id.
const editing = ref<'new' | string | null>(null)
const editingTask = ref<BeeTask | undefined>(undefined)

function startNew(): void {
  editingTask.value = undefined
  editing.value = 'new'
}
function startEdit(task: BeeTask): void {
  editingTask.value = task
  editing.value = task.id
}
function onSave(payload: { name: string; combs: string[] }): void {
  if (editing.value === 'new') store.addTask(payload.name, payload.combs)
  else if (editing.value) store.updateTask(editing.value, payload)
  editing.value = null
  editingTask.value = undefined
}
function onCancel(): void {
  editing.value = null
  editingTask.value = undefined
}
function jumpToGraph(bee: string): void {
  store.closeTasks()
  store.setView('graph')
  store.selectBee(bee)
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') store.closeTasks()
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="modal" @click.self="store.closeTasks()">
    <div class="modal__win" role="dialog" aria-modal="true" aria-labelledby="tasks-title">
      <header class="modal__head">
        <h2 id="tasks-title" class="modal__title">Задачи</h2>
        <button type="button" class="modal__close" title="Закрыть" @click="store.closeTasks()">
          ✕
        </button>
      </header>

      <div class="modal__body">
        <BeeTaskEditor
          v-if="editing === 'new'"
          :initial="undefined"
          @save="onSave"
          @cancel="onCancel"
        />
        <button v-else type="button" class="modal__new" @click="startNew">➕ Новая задача</button>

        <div v-if="!store.tasks.length && editing !== 'new'" class="modal__empty">
          Пока нет задач — создай первую.
        </div>

        <template v-for="task in store.tasks" :key="task.id">
          <BeeTaskEditor
            v-if="editing === task.id"
            :initial="editingTask"
            @save="onSave"
            @cancel="onCancel"
          />
          <BeeTaskCard
            v-else
            :task="task"
            @edit="startEdit(task)"
            @remove="store.removeTask(task.id)"
            @toggle="store.toggleTaskCollapsed(task.id)"
            @jump="jumpToGraph"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 24px;
  animation: modalFade 0.18s ease;
}
@keyframes modalFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.modal__win {
  width: min(900px, 100%);
  max-height: min(600px, 90vh);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid var(--cardln);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  animation: modalPop 0.18s ease;
}
@keyframes modalPop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.modal__head {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}
.modal__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  margin: 0;
}
.modal__close {
  margin-left: auto;
  font: inherit;
  font-size: 15px;
  background: var(--card);
  border: 1px solid var(--cardln);
  color: var(--ink2);
  width: 32px;
  height: 32px;
  border-radius: 9px;
  cursor: pointer;
}
.modal__close:hover {
  border-color: var(--honey-dk);
}
.modal__body {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal__new {
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  color: var(--honey-dk);
  background: var(--card);
  border: 1px dashed var(--cardln);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}
.modal__new:hover {
  border-color: var(--honey-dk);
}
.modal__empty {
  color: var(--dim);
  font-style: italic;
  padding: 30px;
  text-align: center;
}
</style>
