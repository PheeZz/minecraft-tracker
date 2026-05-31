<script setup lang="ts">
import { computed } from 'vue'
import { useBeesStore } from '../stores/useBeesStore'
import { taskProgress, type BeeTask, type CombStatus } from '../domain/tasks'
import CombIcon from './CombIcon.vue'

const props = defineProps<{ task: BeeTask }>()
const emit = defineEmits<{
  edit: []
  remove: []
  toggle: []
  jump: [bee: string]
}>()

const store = useBeesStore()

const statuses = computed<CombStatus[]>(() => store.statusesOf(props.task))
const progress = computed(() => taskProgress(statuses.value))
const pct = computed(() =>
  progress.value.total ? Math.round((progress.value.done / progress.value.total) * 100) : 0,
)

const LABEL: Record<CombStatus['state'], string> = {
  have: 'есть',
  ready: 'готова',
  todo: 'нужно вывести',
}
</script>

<template>
  <div class="tcard" :class="{ done: progress.ready }">
    <div class="tcard__head">
      <button
        type="button"
        class="tcard__title"
        :aria-expanded="!task.collapsed"
        @click="emit('toggle')"
      >
        <span class="tcard__chev" :class="{ open: !task.collapsed }">▸</span>
        {{ task.name }}
        <span v-if="progress.ready" class="tcard__done">✅ готово</span>
      </button>
      <span class="tcard__count">{{ progress.done }} / {{ progress.total }}</span>
      <button type="button" class="tcard__icon" title="Изменить" @click="emit('edit')">✎</button>
      <button type="button" class="tcard__icon" title="Удалить" @click="emit('remove')">🗑</button>
    </div>

    <div class="tcard__bar" aria-hidden="true">
      <span class="tcard__bar-fill" :style="{ width: pct + '%' }" />
    </div>

    <ul v-if="!task.collapsed" class="tcard__combs">
      <li v-for="s in statuses" :key="s.comb" class="combrow" :class="`is-${s.state}`">
        <CombIcon :name="s.comb" />
        <span class="combrow__name">{{ s.comb }}</span>
        <span class="combrow__state">
          {{ LABEL[s.state]
          }}<template v-if="s.bee">
            — {{ s.state === 'todo' ? `${s.bee}, ${s.depth} шаг.` : s.bee }}</template
          ><template v-else> (нет известного производителя)</template>
        </span>
        <button
          v-if="s.state !== 'have' && s.bee"
          type="button"
          class="combrow__jump"
          @click="emit('jump', s.bee)"
        >
          в граф ▸
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tcard {
  border: 1px solid var(--cardln);
  border-radius: 12px;
  background: var(--card);
  padding: 12px 14px;
}
.tcard.done {
  border-color: var(--src-f);
  background: var(--src-f-soft);
}
.tcard__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tcard__title {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font: inherit;
  font-weight: 700;
  font-size: 15px;
  color: var(--ink);
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
  padding: 0;
}
.tcard__chev {
  font-size: 11px;
  color: var(--muted);
  transition: transform 0.18s ease;
}
.tcard__chev.open {
  transform: rotate(90deg);
}
.tcard__done {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--src-f);
}
.tcard__count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
}
.tcard__icon {
  font: inherit;
  font-size: 13px;
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--muted);
  padding: 4px;
}
.tcard__icon:hover {
  color: var(--honey-dk);
}
.tcard__bar {
  position: relative;
  height: 5px;
  border-radius: 3px;
  background: var(--bg2);
  overflow: hidden;
  margin: 8px 0;
}
.tcard__bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: var(--honey);
  transition: width 0.25s ease;
}
.tcard.done .tcard__bar-fill {
  background: var(--src-f);
}
.tcard__combs {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.combrow {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}
.combrow__name {
  font-weight: 600;
  color: var(--ink);
}
.combrow__state {
  color: var(--muted);
  font-size: 12px;
}
.combrow.is-have .combrow__state {
  color: var(--src-f);
}
.combrow.is-ready .combrow__state {
  color: var(--amber);
}
.combrow__jump {
  margin-left: auto;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  color: var(--honey-dk);
  background: none;
  border: 1px solid var(--cardln);
  border-radius: 7px;
  padding: 3px 8px;
  cursor: pointer;
}
.combrow__jump:hover {
  border-color: var(--honey-dk);
}
</style>
