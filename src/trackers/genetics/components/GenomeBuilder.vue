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
import IconBase from '@/shared/ui/IconBase.vue'
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
              <template v-if="statuses[t.key] === 'have'"><IconBase name="check" /> есть</template>
              <template v-else-if="statuses[t.key] === 'need'">нужен</template>
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
                  ← {{ carrier(g.trait, g.en)!.ru }} <IconBase name="check" />
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
          <p v-else class="need__done">Всё нужное собрано <IconBase name="check" /></p>
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
  font-size: 19px;
  letter-spacing: -0.01em;
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
  padding: 6px 13px;
  border-radius: 9px;
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  color: var(--ink2);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.tg:hover:not(.on) {
  color: var(--ink);
  border-color: var(--honey-dk);
}
.tg.on {
  background: linear-gradient(180deg, #38d4de, var(--solid));
  color: var(--solid-ink);
  border-color: transparent;
  box-shadow:
    0 0 0 1px rgba(95, 224, 234, 0.5),
    0 4px 14px var(--glow-cyan);
}
.tg--add {
  border-style: dashed;
  color: var(--muted);
}
.tg--add:hover {
  color: var(--honey-dk);
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
  background: rgba(6, 13, 18, 0.5);
  color: var(--ink);
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.bld__create {
  margin-top: 12px;
  border-color: transparent;
  background: linear-gradient(180deg, #38d4de, var(--solid));
  color: var(--solid-ink);
  box-shadow: 0 4px 16px var(--glow-cyan);
}
.bld__create:hover {
  box-shadow: 0 6px 22px var(--glow-cyan);
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
  background: rgba(6, 13, 18, 0.6);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 8px 11px;
  color: var(--ink);
}
.bld__name:focus-visible {
  outline: none;
  border-color: var(--honey-dk);
  box-shadow: 0 0 0 3px rgba(95, 224, 234, 0.18);
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
  font-weight: 700;
  color: var(--ink);
}
.row__st {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}
.row__st.have,
.row__st.need {
  padding: 4px 11px;
  border-radius: 20px;
}
.row__st.have {
  color: var(--src-f);
  background: var(--src-f-soft);
  border: 1px solid rgba(70, 215, 155, 0.35);
}
.row__st.need {
  color: var(--amber);
  background: rgba(240, 203, 99, 0.12);
  border: 1px solid rgba(240, 203, 99, 0.32);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.chip {
  position: relative;
  font: inherit;
  font-size: 11.5px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--cardln);
  background: linear-gradient(180deg, var(--card2), var(--card));
  color: var(--ink2);
  cursor: pointer;
  transition:
    color 0.14s ease,
    border-color 0.14s ease,
    box-shadow 0.14s ease;
}
.chip:hover:not(.on) {
  border-color: var(--honey-dk);
  color: var(--ink);
}
.chip.got {
  color: var(--ink);
  border-color: rgba(70, 215, 155, 0.5);
}
/* Маркер «ген уже собран» — зелёная точка слева. */
.chip.got::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--src-f);
  box-shadow: 0 0 6px var(--glow-green);
}
.chip.got {
  padding-left: 14px;
}
.chip.on {
  background: linear-gradient(180deg, #38d4de, var(--solid));
  color: var(--solid-ink);
  border-color: transparent;
  font-weight: 700;
  box-shadow:
    0 0 0 1px rgba(95, 224, 234, 0.5),
    0 3px 12px var(--glow-cyan);
}
.chip.on.got::before {
  background: var(--solid-ink);
  box-shadow: none;
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
  text-shadow: 0 0 8px var(--glow-violet);
}
.chip.on .chip__star {
  color: var(--solid-ink);
  text-shadow: none;
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
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 14px;
  padding: 14px;
  box-shadow: var(--shadow-card);
}
.lab {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin-bottom: 8px;
}
.big__n {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 800;
  color: var(--src-f);
  text-shadow: 0 0 16px var(--glow-green);
}
.big__t {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}
.bar {
  height: 7px;
  background: rgba(6, 13, 18, 0.7);
  border: 1px solid var(--cardln);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 9px;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--bar-grad);
  box-shadow: 0 0 10px var(--glow-green);
  transition: width 0.4s ease;
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
  color: var(--ink2);
}
.need li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  border-top: 1px solid var(--line);
}
.need li:first-child {
  border-top: 0;
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
