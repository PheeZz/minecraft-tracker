<script setup lang="ts">
import { computed } from 'vue'
import { TRAITS } from '../data/genetics.data'
import { targetGeneState, targetSummary, type TargetGeneState } from '../domain/genetics'
import { useGenesStore } from '../stores/useGenesStore'
import { useGeneTargetsStore } from '../stores/useGeneTargetsStore'
import EnTip from './EnTip.vue'

const genes = useGenesStore()
const targets = useGeneTargetsStore()

const rows = computed(() => TRAITS.filter((t) => t.alleles.length > 0))
const summary = computed(() =>
  targets.active ? targetSummary(TRAITS, targets.active.alleles, genes.genes) : null,
)
/** Статус каждого признака в активной цели — единый источник для строк. */
const statuses = computed<Record<string, TargetGeneState>>(() => {
  const m: Record<string, TargetGeneState> = {}
  for (const t of rows.value) {
    m[t.key] = targetGeneState(t.key, targets.active?.alleles[t.key], genes.genes)
  }
  return m
})

function onSelect(trait: string, e: Event): void {
  const v = (e.target as HTMLSelectElement).value
  if (targets.active) targets.setAllele(targets.active.id, trait, v || null)
}
</script>

<template>
  <section class="bld">
    <header class="bld__head">
      <h2 class="bld__title">Сборка генома</h2>
      <div class="bld__targets" role="group" aria-label="Цели">
        <button
          v-for="t in targets.targets"
          :key="t.id"
          type="button"
          class="tg"
          :class="{ on: targets.activeId === t.id }"
          :aria-pressed="targets.activeId === t.id"
          @click="targets.setActive(t.id)"
        >
          {{ t.name }}
        </button>
        <button type="button" class="tg tg--add" @click="targets.addTarget('Новая цель')">
          + цель
        </button>
      </div>
    </header>

    <div v-if="!targets.active" class="bld__empty">
      <p>Целей пока нет. Создай целевой геном, чтобы собрать идеальную пчелу.</p>
      <button type="button" class="bld__create" @click="targets.addTarget('Производственная')">
        Создать цель
      </button>
    </div>

    <div v-else class="bld__wrap">
      <div class="bld__grid">
        <div class="bld__tools">
          <input
            class="bld__name"
            :value="targets.active.name"
            aria-label="Имя цели"
            @change="
              targets.renameTarget(targets.active.id, ($event.target as HTMLInputElement).value)
            "
          />
          <button
            type="button"
            class="bld__del"
            title="Удалить цель"
            @click="targets.removeTarget(targets.active.id)"
          >
            Удалить
          </button>
        </div>

        <div v-for="t in rows" :key="t.key" class="row">
          <label class="row__name" :for="`sel-${t.key}`">
            <EnTip :en="t.en">{{ t.ru }}</EnTip>
          </label>
          <select
            :id="`sel-${t.key}`"
            class="row__sel"
            :value="targets.active.alleles[t.key] ?? ''"
            @change="onSelect(t.key, $event)"
          >
            <option value="">— не важно —</option>
            <option v-for="a in t.alleles" :key="a.en" :value="a.en">
              {{ a.ru }}{{ a.mod ? ' ★' : '' }}
            </option>
          </select>
          <span class="row__st" :class="statuses[t.key]">
            {{ statuses[t.key] === 'have' ? '✓ есть' : statuses[t.key] === 'need' ? 'нужен' : '—' }}
          </span>
        </div>
      </div>

      <aside v-if="summary" class="bld__side">
        <div class="card">
          <div class="lab">Готовность шаблона</div>
          <div class="big">
            <span class="big__n">{{ summary.have }}</span
            ><span class="big__t"> / {{ summary.filled }} выбрано</span>
          </div>
          <div class="bar">
            <i
              :style="{
                width: summary.filled ? (summary.have / summary.filled) * 100 + '%' : '0%',
              }"
            />
          </div>
        </div>
        <div class="card">
          <div class="lab">Осталось изолировать · {{ summary.need.length }}</div>
          <ul v-if="summary.need.length" class="need">
            <li v-for="g in summary.need" :key="g.trait">
              <EnTip :en="g.en">{{ g.ru }}</EnTip>
            </li>
          </ul>
          <p v-else class="need__done">Всё нужное собрано ✓</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.bld {
  padding: 14px 18px;
}
.bld__head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.bld__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
}
.bld__targets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tg {
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--cardln);
  color: var(--ink2);
  cursor: pointer;
}
.tg.on {
  background: var(--solid);
  color: var(--solid-ink);
  border-color: transparent;
}
.tg--add {
  border-style: dashed;
  color: var(--muted);
}
.tg:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.bld__empty {
  text-align: center;
  color: var(--muted);
  padding: 50px 20px;
}
.bld__create,
.bld__del {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid var(--cardln);
  background: var(--bg2);
  color: var(--ink);
  cursor: pointer;
}
.bld__create {
  margin-top: 10px;
  border-color: var(--honey-dk);
}
.bld__wrap {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;
}
.bld__grid {
  flex: 2;
  min-width: 300px;
}
.bld__tools {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.bld__name {
  flex: 1;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 7px 11px;
  color: var(--ink);
}
.bld__del {
  color: var(--muted);
}
.bld__del:hover {
  color: var(--rust);
}
.row {
  display: grid;
  grid-template-columns: 150px 1fr 76px;
  gap: 10px;
  align-items: center;
  padding: 7px 0;
  border-top: 1px solid var(--line);
}
.row__name {
  font-size: 13px;
  font-weight: 600;
}
.row__sel {
  font: inherit;
  font-size: 12.5px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 6px 9px;
  color: var(--ink);
}
.row__sel:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.row__st {
  font-size: 11.5px;
  text-align: center;
}
.row__st.have {
  color: var(--src-f);
}
.row__st.need {
  color: var(--honey-dk);
}
.row__st.unset {
  color: var(--dim);
}
.bld__side {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 12px;
  padding: 13px;
}
.lab {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 7px;
}
.big__n {
  font-size: 24px;
  font-weight: 800;
  color: var(--src-f);
}
.big__t {
  font-size: 14px;
  color: var(--muted);
}
.bar {
  height: 6px;
  background: var(--bg2);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 7px;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--src-f);
}
.need {
  margin: 0;
  padding-left: 18px;
  font-size: 12.5px;
  line-height: 1.7;
}
.need__done {
  margin: 0;
  font-size: 12.5px;
  color: var(--src-f);
}
</style>
