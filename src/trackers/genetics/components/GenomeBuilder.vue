<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { TRAITS } from '../data/genetics.data'
import {
  carriersOf,
  targetGeneState,
  targetSummary,
  type TargetGeneState,
} from '../domain/genetics'
import { CARRIERS } from '../data/carriers'
import { useGenesStore } from '../stores/useGenesStore'
import { useGeneTargetsStore } from '../stores/useGeneTargetsStore'
import { useBeesStore } from '@/trackers/bees/stores/useBeesStore'
import { useBeesUiStore } from '@/trackers/bees/stores/useBeesUiStore'
import EnTip from './EnTip.vue'

const genes = useGenesStore()
const targets = useGeneTargetsStore()
const bees = useBeesStore()
const beesUi = useBeesUiStore()
const router = useRouter()

const rows = computed(() => TRAITS.filter((t) => t.alleles.length > 0))
const summary = computed(() =>
  targets.active ? targetSummary(TRAITS, targets.active.alleles, genes.genes) : null,
)
const statuses = computed<Record<string, TargetGeneState>>(() => {
  const m: Record<string, TargetGeneState> = {}
  for (const t of rows.value) {
    m[t.key] = targetGeneState(t.key, targets.active?.alleles[t.key], genes.genes)
  }
  return m
})

function pick(trait: string, en: string | null): void {
  if (targets.active) targets.setAllele(targets.active.id, trait, en)
}
/** Первый вид-носитель гена. */
function carrier(trait: string, en: string) {
  return carriersOf(CARRIERS, trait, en)[0] ?? null
}
/** Открыть вид-носитель в графе скрещивания. */
function breed(ru: string): void {
  beesUi.selectBee(ru)
  beesUi.setView('graph')
  router.push('/bees')
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
          <div class="row__head">
            <span class="row__name"
              ><EnTip :en="t.en">{{ t.ru }}</EnTip></span
            >
            <span class="row__st" :class="statuses[t.key]">
              {{
                statuses[t.key] === 'have' ? '✓ есть' : statuses[t.key] === 'need' ? 'нужен' : ''
              }}
            </span>
          </div>
          <div class="chips" role="group" :aria-label="t.ru">
            <button
              type="button"
              class="chip chip--any"
              :class="{ on: !targets.active.alleles[t.key] }"
              :aria-pressed="!targets.active.alleles[t.key]"
              @click="pick(t.key, null)"
            >
              любой
            </button>
            <button
              v-for="a in t.alleles"
              :key="a.en"
              type="button"
              class="chip"
              :class="{
                on: targets.active.alleles[t.key] === a.en,
                got: genes.has(t.key, a.en),
                add: !!a.mod,
              }"
              :aria-pressed="targets.active.alleles[t.key] === a.en"
              :title="a.en"
              @click="pick(t.key, a.en)"
            >
              {{ a.ru }}<span v-if="a.mod" class="chip__star">★</span>
            </button>
          </div>
        </div>
      </div>

      <aside v-if="summary" class="bld__side">
        <div class="card">
          <div class="lab">Готовность шаблона</div>
          <template v-if="summary.filled">
            <div class="big">
              <span class="big__n">{{ summary.have }}</span
              ><span class="big__t"> / {{ summary.filled }} выбрано</span>
            </div>
            <div class="bar">
              <i :style="{ width: (summary.have / summary.filled) * 100 + '%' }" />
            </div>
          </template>
          <p v-else class="muted">Выбери желаемые аллели по признакам слева.</p>
        </div>
        <div v-if="summary.filled" class="card">
          <div class="lab">Осталось изолировать · {{ summary.need.length }}</div>
          <ul v-if="summary.need.length" class="need">
            <li v-for="g in summary.need" :key="g.trait">
              <span
                ><EnTip :en="g.en">{{ g.ru }}</EnTip></span
              >
              <template v-if="carrier(g.trait, g.en)">
                <span v-if="bees.isHave(carrier(g.trait, g.en)!.ru)" class="need__own">
                  ← {{ carrier(g.trait, g.en)!.ru }} ✓
                </span>
                <button
                  v-else
                  type="button"
                  class="need__breed"
                  @click="breed(carrier(g.trait, g.en)!.ru)"
                >
                  → вывести {{ carrier(g.trait, g.en)!.ru }}
                </button>
              </template>
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
  margin-bottom: 10px;
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
  padding: 9px 0;
  border-top: 1px solid var(--line);
}
.row__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}
.row__name {
  font-size: 13px;
  font-weight: 600;
}
.row__st {
  font-size: 11px;
}
.row__st.have {
  color: var(--src-f);
}
.row__st.need {
  color: var(--amber);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.chip {
  font: inherit;
  font-size: 11.5px;
  padding: 4px 9px;
  border-radius: 7px;
  border: 1px solid var(--cardln);
  background: var(--card);
  color: var(--muted);
  cursor: pointer;
}
.chip.got {
  color: var(--ink2);
  border-color: color-mix(in srgb, var(--src-f) 45%, var(--cardln));
}
.chip.on {
  background: var(--solid);
  color: var(--solid-ink);
  border-color: transparent;
  font-weight: 700;
}
.chip--any {
  font-style: italic;
}
.chip.add {
  border-style: dashed;
}
.chip__star {
  color: var(--alt);
  margin-left: 3px;
}
.chip.on .chip__star {
  color: var(--solid-ink);
}
.chip:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.bld__side {
  flex: 1;
  min-width: 210px;
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
.muted {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
}
.need {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12.5px;
}
.need li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 3px 0;
}
.need__own {
  color: var(--src-f);
  font-size: 11px;
}
.need__breed {
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  background: none;
  border: 0;
  color: var(--honey-dk);
  cursor: pointer;
  padding: 0;
}
.need__breed:hover {
  text-decoration: underline;
}
.need__done {
  margin: 0;
  font-size: 12.5px;
  color: var(--src-f);
}
</style>
