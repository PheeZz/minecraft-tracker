<script setup lang="ts">
import { computed } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { BY_ID, TREES } from '../data/trees.data'
import { isAvailable } from '../domain/graph'
import { FRUIT_CHAIN, UNIQUE_FRUITS, computeUsage, fruitUnlocked, invTotal } from '../domain/plan'
import { plantGrid } from '../graph/format'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'
import { useTreeActions } from '../composables/useTreeActions'
import InvCounters from './InvCounters.vue'
import FruitIcon from './FruitIcon.vue'

const store = useTreesStore()
const ui = useTreesUiStore()
const actions = useTreeActions()

const need = computed(() => [...FRUIT_CHAIN].map((id) => BY_ID[id]!).filter((t) => t.tier > 0))
const usage = computed(() => computeUsage(need.value))
const remaining = computed(() => need.value.filter((t) => store.progress[t.id] !== 2))
const usageRemain = computed(() => computeUsage(remaining.value))
const M = computed(() => remaining.value.length)

const doneNeed = computed(() => need.value.filter((t) => store.progress[t.id] === 2).length)
const fruitsDone = computed(
  () => UNIQUE_FRUITS.filter((f) => fruitUnlocked(store.progress, f)).length,
)

const totals = computed(() => {
  let sap = 0
  let pol = 0
  for (const id of Object.keys(store.inventory)) {
    if ((usageRemain.value[id] ?? 0) <= 0) continue
    sap += store.inventory[id]?.sap ?? 0
    pol += store.inventory[id]?.pol ?? 0
  }
  return { sap, pol }
})

function rank(id: string): number {
  const s = store.progress[id] ?? 0
  if (s === 2) return 2
  if (isAvailable(store.progress, id)) return 0
  return 1
}

const byTier = computed(() => {
  const groups = new Map<number, typeof TREES>()
  for (const t of need.value) {
    const list = (groups.get(t.tier) ?? []) as typeof TREES
    groups.set(t.tier, [...list, t])
  }
  const tiers = [...groups.keys()].sort((a, b) => a - b)
  return tiers.map((tier) => {
    let trees = [...groups.get(tier)!].sort(
      (a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id, 'ru'),
    )
    if (ui.planHideObtained) trees = trees.filter((t) => store.progress[t.id] !== 2)
    return { tier, trees }
  })
})

const wildUsed = computed(() =>
  TREES.filter((t) => t.tier === 0 && (usage.value[t.id] || usageRemain.value[t.id])),
)

function rowMod(id: string): string {
  const s = store.progress[id] ?? 0
  if (s === 2) return 'plan__row--bred'
  if (isAvailable(store.progress, id)) return 'plan__row--avail'
  return 'plan__row--locked'
}
const haveOf = (id: string) => invTotal(store.inv(id))
</script>

<template>
  <div class="plan">
    <div class="plan__head">
      <span class="plan__title"><IconBase name="list" /> План выведения всех плодов</span>
      <button class="btn--xs" type="button" @click="ui.planHideObtained = !ui.planHideObtained">
        {{ ui.planHideObtained ? 'Показать всё' : 'Скрыть полученные' }}
      </button>
    </div>
    <div class="hint">
      Минимум: <b>{{ need.length }}</b> деревьев ({{ doneNeed }} готово). Плодов:
      <b>{{ UNIQUE_FRUITS.length }}</b> ({{ fruitsDone }} готово).
    </div>
    <div class="plan__summary">
      <div><b>Скрещиваний осталось:</b> {{ M }}</div>
      <div class="hint">
        Саженцы и пыльца взаимозаменяемы. Глобально нужно ≥{{ M }} саженцев и ≥{{ M }} пыльцы.
      </div>
      <div class="plan__totals">
        <span class="counter-sum counter-sum--sap"
          ><IconBase name="sprout" />
          <b :class="{ 'is-ok': totals.sap >= M }">{{ totals.sap }}/{{ M }}</b></span
        >
        <span class="counter-sum counter-sum--pol"
          ><IconBase name="pollen" />
          <b :class="{ 'is-ok': totals.pol >= M }">{{ totals.pol }}/{{ M }}</b></span
        >
      </div>
    </div>

    <template v-for="group in byTier" :key="group.tier">
      <div v-if="group.trees.length" class="plan__tier">
        <span class="pill pill--tier" :class="`t--${group.tier}`">T{{ group.tier }}</span>
        <span class="hint">{{ group.trees.length }} шт</span>
      </div>
      <div v-for="t in group.trees" :key="t.id" class="plan__row" :class="rowMod(t.id)">
        <div class="plan__row-head" @click="actions.jump(t.id)">
          <IconBase
            :name="
              store.progress[t.id] === 2
                ? 'check'
                : isAvailable(store.progress, t.id)
                  ? 'bolt'
                  : 'ban'
            "
          />
          <b class="plan__name">{{ t.id }}</b>
          <span v-if="t.fruit" class="plan__fruit"
            ><FruitIcon :fruit="t.fruit" :size="14" />{{ t.fruit }}</span
          >
          <span v-if="t.plant > 1" class="plan__fruit"
            >⊞{{ plantGrid(t.plant) }}·{{ t.plant }}</span
          >
          <span class="hint"> ← {{ t.parents?.[0]?.join(' + ') }}</span>
        </div>

        <div v-for="parent in t.parents?.[0] ?? []" :key="parent" class="pinv">
          <span class="pinv__name"
            ><b>{{ parent }}</b>
            <span class="hint"
              >— нужно {{ usageRemain[parent] ?? 0
              }}<span v-if="(usage[parent] ?? 0) !== (usageRemain[parent] ?? 0)">
                (из {{ usage[parent] ?? 0 }} всего)</span
              ></span
            ></span
          >
          <InvCounters :id="parent" />
          <span
            class="pinv__total"
            :class="{ 'is-ok': haveOf(parent) >= (usageRemain[parent] ?? 0) }"
            >{{ haveOf(parent) }}/{{ usageRemain[parent] ?? 0 }}</span
          >
        </div>

        <div class="plan__action">
          <button
            class="action action--sm"
            :class="store.progress[t.id] === 2 ? 'action--unget' : 'action--get'"
            type="button"
            @click.stop="actions.toggleBred(t.id)"
          >
            <IconBase :name="store.progress[t.id] === 2 ? 'check' : 'plus'" />{{
              store.progress[t.id] === 2 ? 'получено' : 'отметить полученным'
            }}
          </button>
        </div>
      </div>
    </template>

    <template v-if="wildUsed.length">
      <div class="plan__tier"><span class="pill pill--tier t--0">T0 · база</span></div>
      <div v-for="t in wildUsed" :key="t.id" class="plan__row plan__row--locked">
        <div class="plan__row-head" @click="actions.jump(t.id)">
          <b class="plan__name">{{ t.id }}</b>
        </div>
        <div class="pinv">
          <span class="pinv__name"
            ><b>{{ t.id }}</b> <span class="hint">— нужно {{ usageRemain[t.id] ?? 0 }}</span></span
          >
          <InvCounters :id="t.id" />
          <span class="pinv__total" :class="{ 'is-ok': haveOf(t.id) >= (usageRemain[t.id] ?? 0) }"
            >{{ haveOf(t.id) }}/{{ usageRemain[t.id] ?? 0 }}</span
          >
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.plan {
  background: var(--inset);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 11px;
  margin-bottom: 8px;
  font-size: 12px;
  max-height: 46vh;
  overflow: auto;
}
.plan__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.plan__title {
  font-weight: 700;
  color: #cfe0c2;
  display: flex;
  align-items: center;
  gap: 6px;
}
.plan__summary {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  padding: 7px 9px;
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1.5;
}
.plan__totals {
  margin-top: 3px;
  display: flex;
  gap: 12px;
}
.counter-sum {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.counter-sum--sap {
  color: var(--sap);
}
.counter-sum--pol {
  color: var(--amber);
}
.counter-sum b {
  font-family: var(--font-mono);
}
.counter-sum b.is-ok {
  color: var(--ok);
}
.plan__tier {
  margin: 7px 0 3px;
}
.plan__tier .hint {
  display: inline;
}
.plan__row {
  padding: 5px 0 5px 7px;
  border-left: 2px solid #8aa394;
  margin: 2px 0 2px 4px;
}
.plan__row--bred {
  border-left-color: var(--leaf);
  opacity: 0.55;
}
.plan__row--avail {
  border-left-color: var(--avail);
}
.plan__row-head {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.plan__row--bred .plan__row-head,
.plan__row--bred .plan__name {
  color: var(--leaf);
}
.plan__row--avail .plan__row-head,
.plan__row--avail .plan__name {
  color: var(--avail);
}
.plan__row--locked .plan__row-head,
.plan__row--locked .plan__name {
  color: #8aa394;
}
.plan__fruit {
  color: var(--amber);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.plan__action {
  margin-top: 5px;
}
.pinv {
  margin: 4px 0 0 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
.pinv__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pinv :deep(.counter-group) {
  margin-top: 0;
  flex: none;
}
.pinv :deep(.counter__val) {
  width: 18px;
  min-width: 18px;
}
.pinv__total {
  flex: none;
  width: 46px;
  text-align: right;
  font-family: var(--font-mono);
}
.hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
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
.action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 12.5px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
}
.action :deep(.icon) {
  width: 15px;
  height: 15px;
  vertical-align: 0;
}
.action--sm {
  width: auto;
  padding: 5px 10px;
  font-size: 11px;
}
.action--get {
  background: linear-gradient(180deg, #9bda5d, #73b23c);
  color: var(--dark-ink);
}
.action--unget {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--edge);
  color: var(--muted);
}
.btn--xs {
  padding: 5px 9px;
  font-size: 11px;
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--edge);
  border-radius: 10px;
  cursor: pointer;
}
</style>
