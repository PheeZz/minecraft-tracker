<script setup lang="ts">
import { computed } from 'vue'
import { BEE_BY_ID } from '../data/bees.data'
import { isComb, shortComb } from '../domain/combs'
import { planSteps, recipeIndexOf } from '../domain/graph'
import { useBeesStore } from '../stores/useBeesStore'
import { useBeesUiStore } from '../stores/useBeesUiStore'
import BeeIcon from './BeeIcon.vue'
import CombIcon from './CombIcon.vue'
import IconBase from '@/shared/ui/IconBase.vue'

const store = useBeesStore()
const ui = useBeesUiStore()

const SRC_LABEL: Record<string, string> = { F: 'FOR', E: 'EXB', M: 'MAG' }
const SRC_FULL: Record<string, string> = { F: 'Forestry', E: 'ExtraBees', M: 'MagicBees' }

const target = computed(() => ui.curTarget)
const targetBee = computed(() => (target.value ? BEE_BY_ID[target.value] : undefined))

const producers = computed(() => (ui.curComb ? store.producersOf(ui.curComb) : []))

const plan = computed(() =>
  target.value ? planSteps(target.value, store.have, store.rc) : { bred: [], wild: [], have: [] },
)

interface StepView {
  id: string
  a: string
  c: string
  chance: number
  recipeIdx: number
  recipeCount: number
  yields: { name: string; pct: number; hl: boolean }[]
  alts: { idx: number; label: string }[]
}
const steps = computed<StepView[]>(() =>
  plan.value.bred.map((id) => {
    const b = BEE_BY_ID[id]!
    const idx = recipeIndexOf(id, store.rc)
    const r = b.parents[idx]!
    return {
      id,
      a: r.p1,
      c: r.p2,
      chance: r.chance,
      recipeIdx: idx,
      recipeCount: b.parents.length,
      yields: b.products
        .filter((p) => isComb(p.name))
        .map((p) => ({ name: p.name, pct: p.pct, hl: p.name === ui.curComb })),
      alts: b.parents
        .map((rec, ri) => ({ idx: ri, label: `${rec.p1} × ${rec.p2} @${rec.chance}%` }))
        .filter((_, ri) => ri !== idx),
    }
  }),
)

const beeProducts = computed(() => targetBee.value?.products ?? [])
</script>

<template>
  <aside class="panel">
    <div v-if="!target" class="empty">
      <span class="o"><IconBase name="bee" /></span>Выбери соту или пчелу слева.
    </div>

    <template v-else>
      <!-- режим соты: список производителей -->
      <template v-if="ui.mode === 'comb' && ui.curComb">
        <div class="sect">соту дают ({{ producers.length }})</div>
        <div class="hint-line">нажми пчелу — построю дерево под неё (проще = меньше глубина).</div>
        <div
          v-for="(p, i) in producers"
          :key="`${p.bee}|${i}`"
          class="prod"
          :class="{ on: p.bee === target, owned: store.isHave(p.bee) }"
          role="button"
          tabindex="0"
          @click="ui.setTarget(p.bee)"
          @keydown.enter.prevent="ui.setTarget(p.bee)"
          @keydown.space.prevent="ui.setTarget(p.bee)"
        >
          <span
            class="havchk"
            :class="{ on: store.isHave(p.bee) }"
            title="есть на складе"
            @click.stop="store.toggleHave(p.bee)"
            >✓</span
          >
          <span class="prod__src" :class="`src-${p.src}`">{{ SRC_LABEL[p.src] ?? p.src }}</span>
          <BeeIcon :name="p.bee" /><span class="prod__nm">{{ p.bee }}</span>
          <span v-if="store.isHave(p.bee)" class="prod__easy have">есть ✓</span>
          <span v-else-if="i === 0" class="prod__easy">проще всего</span>
          <span class="prod__pct">{{ p.pct }}%</span>
        </div>
      </template>

      <!-- режим пчелы: карточка -->
      <template v-else-if="ui.mode === 'bee' && targetBee">
        <div class="sect">пчела</div>
        <div class="bee-title"><BeeIcon :name="targetBee.id" big />{{ targetBee.id }}</div>
        <div class="bee-meta">
          {{ targetBee.en }} · {{ SRC_FULL[targetBee.source] ?? targetBee.source }} · глубина
          {{ store.depthOf(targetBee.id) }}
        </div>
        <button
          class="havbtn"
          :class="{ on: store.isHave(targetBee.id) }"
          type="button"
          @click="store.toggleHave(targetBee.id)"
        >
          <span class="havchk" :class="{ on: store.isHave(targetBee.id) }">✓</span>
          {{ store.isHave(targetBee.id) ? 'есть на складе' : 'отметить как «есть»' }}
        </button>
        <div class="sect">даёт</div>
        <div class="prods-line">
          <span v-for="p in beeProducts" :key="p.name" class="prod-chip">
            <CombIcon v-if="isComb(p.name)" :name="p.name" />{{ p.name }} {{ p.pct }}%{{
              p.kind === 'specialty' ? '✦' : ''
            }}
          </span>
          <span v-if="!beeProducts.length">—</span>
        </div>
      </template>

      <!-- пошаговый план (оба режима) -->
      <div class="sect" style="margin-top: 20px">пошаговый план</div>
      <div v-if="store.isHave(target!)" class="note note--ok">
        <b>{{ target }}</b> уже есть на складе ✓
      </div>
      <div v-if="plan.have.length" class="note note--ok">
        Со склада берём готовыми: <b>{{ plan.have.join(', ') }}</b
        >.
      </div>
      <div v-if="plan.wild.length" class="note">
        Сначала добудь диких пчёл из ульев: <b>{{ plan.wild.join(', ') }}</b
        >.
      </div>
      <div v-if="!plan.bred.length && !store.isHave(target!)" class="note">
        Скрещивать нечего — всё нужное уже на складе.
      </div>

      <div class="plan">
        <div v-for="step in steps" :key="step.id" class="step">
          <div class="step__n" />
          <div class="step__b">
            <BeeIcon :name="step.a" /><b>{{ step.a }}</b
            ><span v-if="store.isHave(step.a)" class="ghav">✓</span>
            <span class="step__cross">×</span>
            <BeeIcon :name="step.c" /><b>{{ step.c }}</b
            ><span v-if="store.isHave(step.c)" class="ghav">✓</span> → <BeeIcon :name="step.id" /><b
              class="step__res"
              >{{ step.id }}</b
            >
            <span class="step__ch">@{{ step.chance }}%</span>
            <span v-if="step.recipeCount > 1" class="step__tag">
              · рецепт {{ step.recipeIdx + 1 }}/{{ step.recipeCount }}</span
            >
            <span v-if="step.yields.length" class="step__yield">
              даёт:
              <span v-for="(y, yi) in step.yields" :key="y.name" :class="{ hl: y.hl }">
                <CombIcon :name="y.name" />{{ shortComb(y.name) }} {{ y.pct }}%{{
                  yi < step.yields.length - 1 ? ',' : ''
                }}
              </span>
            </span>
            <span v-if="step.alts.length" class="alts">
              <span class="lbl">⇄ ещё:</span>
              <button
                v-for="alt in step.alts"
                :key="alt.idx"
                class="altchip"
                type="button"
                @click="store.setRecipe(step.id, alt.idx)"
              >
                {{ alt.label }}
              </button>
            </span>
          </div>
        </div>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.panel {
  border-left: 1px solid var(--line);
  background: var(--panel);
  overflow-y: auto;
  padding: 18px;
  backdrop-filter: blur(3px);
}
.empty {
  color: var(--muted);
  text-align: center;
  padding: 60px 14px;
}
.empty .o {
  font-size: 38px;
  display: block;
  margin-bottom: 10px;
}
.sect {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin: 6px 0 10px;
  display: flex;
  align-items: center;
  gap: 9px;
}
.sect::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}
.hint-line {
  font-size: 12.5px;
  color: var(--muted);
  margin: -4px 0 10px;
}
.prod {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--cardln);
  border-radius: 11px;
  margin-bottom: 8px;
  cursor: pointer;
  background: var(--card);
  transition: 0.13s;
}
.prod:hover {
  border-color: var(--honey);
  transform: translateX(-2px);
}
.prod:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 2px;
}
.prod.on {
  border-color: var(--honey);
  box-shadow: 0 0 0 2px rgba(232, 167, 44, 0.3);
}
.prod.owned {
  border-color: var(--src-f);
  background: var(--src-f-soft);
}
.prod__src {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  flex: none;
}
.src-F {
  background: var(--src-f);
  color: #eafff5;
}
.src-E {
  background: var(--src-e);
  color: #fff1e8;
}
.src-M {
  background: #7a59b8;
  color: #f3e9ff;
}
.prod__nm {
  flex: 1;
  font-weight: 700;
  font-size: 14px;
}
.prod__pct {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 14px;
  color: var(--honey-dk);
}
.prod__easy {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--src-f);
}
.prod__easy.have {
  font-weight: 700;
}
.havchk {
  flex: none;
  width: 19px;
  height: 19px;
  border-radius: 6px;
  border: 1.6px solid var(--cardln);
  background: var(--card);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  line-height: 1;
  color: transparent;
}
.havchk.on {
  background: var(--src-f);
  border-color: var(--src-f);
  color: #eafff5;
}
.bee-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  display: flex;
  align-items: center;
}
.bee-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 10px;
}
.havbtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 9px;
  border: 1.5px solid var(--cardln);
  background: var(--card);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink2);
  cursor: pointer;
}
.havbtn.on {
  border-color: var(--src-f);
  background: var(--src-f-soft);
  color: var(--src-f);
}
.prods-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.prod-chip {
  font-family: var(--font-mono);
  font-size: 11px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}
.note {
  font-size: 12.5px;
  color: var(--muted);
  background: rgba(47, 125, 94, 0.08);
  border: 1px solid var(--src-f-soft);
  border-radius: 10px;
  padding: 9px 12px;
  margin-top: 8px;
}
.note--ok {
  background: var(--src-f-soft);
  border-color: var(--src-f);
}
.plan {
  counter-reset: step;
  margin-top: 6px;
}
.step {
  display: flex;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px dashed var(--line);
}
.step__n {
  counter-increment: step;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--solid);
  color: var(--solid-ink);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 12px;
  display: grid;
  place-items: center;
}
.step__n::before {
  content: counter(step);
}
.step__b {
  flex: 1;
  font-size: 13.5px;
  line-height: 1.45;
}
.step__cross {
  color: var(--rust);
  font-weight: 700;
}
.step__res {
  color: var(--honey-dk);
  font-weight: 700;
}
.step__ch {
  font-family: var(--font-mono);
  color: var(--honey-dk);
  font-size: 12px;
}
.step__tag {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
}
.step__yield {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-top: 3px;
}
.step__yield .hl {
  color: var(--rust);
  font-weight: 600;
}
.ghav {
  color: var(--src-f);
  font-weight: 800;
}
.alts {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}
.alts .lbl {
  font-size: 11px;
  color: var(--alt);
  font-weight: 600;
}
.altchip {
  font: inherit;
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(183, 155, 240, 0.14);
  border: 1px solid rgba(183, 155, 240, 0.4);
  color: var(--alt);
}
.altchip:hover {
  background: rgba(183, 155, 240, 0.26);
}
</style>
