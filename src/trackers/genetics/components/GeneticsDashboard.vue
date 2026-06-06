<script setup lang="ts">
import { computed } from 'vue'
import { TRAITS } from '../data/genetics.data'
import { carriersOf, collectionTotals, targetSummary, traitCompletion } from '../domain/genetics'
import { CARRIERS } from '../data/carriers'
import IconBase from '@/shared/ui/IconBase.vue'
import { useGenesStore } from '../stores/useGenesStore'
import { useGeneTargetsStore } from '../stores/useGeneTargetsStore'
import EnTip from './EnTip.vue'

const emit = defineEmits<{ goto: ['collection' | 'builder' | 'pipeline'] }>()
const genes = useGenesStore()
const targets = useGeneTargetsStore()

function openTarget(id: string): void {
  targets.setActive(id)
  emit('goto', 'builder')
}

const totals = computed(() => collectionTotals(TRAITS, genes.genes))

/** Сводка по каждой цели: имя + готовность + первый нужный ген. */
const targetCards = computed(() =>
  targets.targets.map((t) => {
    const s = targetSummary(TRAITS, t.alleles, genes.genes)
    return { id: t.id, name: t.name, ...s, next: s.need[0] ?? null }
  }),
)

/** Следующий шаг: первый нужный ген активной цели (или любой цели). */
const nextStep = computed(() => {
  const activeCard = targetCards.value.find((c) => c.id === targets.activeId)
  return activeCard?.next ?? targetCards.value.find((c) => c.next)?.next ?? null
})
/** Вид-носитель для гена «следующего шага». */
const nextCarrierRu = computed(() => {
  const n = nextStep.value
  return n ? (carriersOf(CARRIERS, n.trait, n.en)[0]?.ru ?? null) : null
})

/** Прогресс по признакам со шкалой (species без аллелей скрыт). */
const traitBars = computed(() =>
  TRAITS.filter((t) => t.alleles.length > 0).map((t) => ({
    key: t.key,
    ru: t.ru,
    en: t.en,
    pct: traitCompletion(t, genes.genes).pct,
  })),
)
</script>

<template>
  <section class="dash">
    <div class="stats">
      <div class="stat">
        <div class="stat__n">
          {{ totals.have }}<span class="stat__d">/ {{ totals.total }}</span>
        </div>
        <div class="stat__c">генов собрано</div>
      </div>
      <div class="stat">
        <div class="stat__n">{{ targets.targets.length }}</div>
        <div class="stat__c">целей</div>
      </div>
    </div>

    <div class="two">
      <div class="card">
        <div class="lab">Цели</div>
        <template v-if="targetCards.length">
          <div v-for="c in targetCards" :key="c.id" class="tgt">
            <div class="tgt__hd">
              <button type="button" class="tgt__name" @click="openTarget(c.id)">
                {{ c.name }}
              </button>
              <span class="tgt__num">{{ c.have }}/{{ c.filled }}</span>
            </div>
            <div class="bar">
              <i :style="{ width: c.filled ? (c.have / c.filled) * 100 + '%' : '0%' }" />
            </div>
            <div v-if="c.next" class="tgt__next">
              дальше: изолировать <EnTip :en="c.next.en">{{ c.next.ru }}</EnTip>
            </div>
            <div v-else class="tgt__done">готова <IconBase name="check" /></div>
          </div>
        </template>
        <p v-else class="muted">
          Целей пока нет.
          <button type="button" class="link" @click="emit('goto', 'builder')">Создать →</button>
        </p>
      </div>

      <div class="card next" :class="{ 'next--idle': !nextStep }">
        <div class="lab">Следующий шаг</div>
        <template v-if="nextStep">
          <div class="next__big">
            Изолировать
            <b
              ><EnTip :en="nextStep.en">{{ nextStep.ru }}</EnTip></b
            ><template v-if="nextCarrierRu">
              из вида <b>{{ nextCarrierRu }}</b></template
            >
          </div>
          <button type="button" class="link" @click="emit('goto', 'pipeline')">
            <IconBase name="branch" /> Открыть пайплайн →
          </button>
        </template>
        <p v-else class="muted">Всё нужное для целей собрано — или цели ещё не заданы.</p>
      </div>
    </div>

    <div class="card">
      <div class="lab">
        Прогресс по признакам
        <button type="button" class="link" @click="emit('goto', 'collection')">
          в коллекцию →
        </button>
      </div>
      <div class="tbars">
        <div v-for="b in traitBars" :key="b.key" class="tb">
          <span class="tb__n"
            ><EnTip :en="b.en">{{ b.ru }}</EnTip></span
          >
          <span class="bar"><i :style="{ width: b.pct + '%' }" /></span>
          <span class="tb__p">{{ b.pct }}%</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dash {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.stat {
  position: relative;
  background:
    radial-gradient(120% 100% at 50% -20%, rgba(44, 197, 208, 0.1), transparent 70%),
    linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 14px;
  padding: 16px 14px;
  text-align: center;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.stat::before {
  content: '';
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--ring-cyan), transparent);
}
.stat__n {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 800;
  color: var(--src-f);
  text-shadow: 0 0 18px var(--glow-green);
}
.stat__d {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--muted);
  margin-left: 4px;
  text-shadow: none;
}
.stat__c {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 4px;
}
.two {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 14px;
}
@media (max-width: 680px) {
  .two,
  .stats {
    grid-template-columns: 1fr;
  }
}
.card {
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 14px;
  padding: 14px;
  box-shadow: var(--shadow-card);
}
.next {
  position: relative;
  overflow: hidden;
}
.next::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(90% 120% at 100% 0%, var(--glow-cyan), transparent 60%);
  opacity: 0.5;
  pointer-events: none;
}
.next > * {
  position: relative;
}
.lab {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin-bottom: 11px;
}
.tgt {
  padding: 8px 0;
  border-top: 1px solid var(--line);
}
.tgt:first-of-type {
  border-top: 0;
}
.tgt__hd {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 5px;
}
.tgt__name {
  font: inherit;
  font-weight: 700;
  background: none;
  border: 0;
  color: var(--ink);
  cursor: pointer;
  padding: 0;
}
.tgt__name:hover {
  color: var(--honey-dk);
}
.tgt__num {
  color: var(--src-f);
}
.tgt__next {
  font-size: 11.5px;
  color: var(--ink2);
  margin-top: 4px;
}
.tgt__done {
  font-size: 11.5px;
  color: var(--src-f);
  margin-top: 4px;
}
.bar {
  display: block;
  height: 7px;
  background: rgba(6, 13, 18, 0.7);
  border: 1px solid var(--cardln);
  border-radius: 4px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--bar-grad);
  box-shadow: 0 0 10px var(--glow-green);
  transition: width 0.4s ease;
}
.next--idle {
  opacity: 0.85;
}
.next__big {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink2);
  margin: 6px 0 10px;
  line-height: 1.45;
}
.next__big b {
  color: var(--ink);
  font-weight: 800;
}
.link {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  background: none;
  border: 0;
  color: var(--honey-dk);
  cursor: pointer;
  padding: 0;
}
.link:hover {
  text-decoration: underline;
}
.muted {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.tbars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px 16px;
}
@media (max-width: 680px) {
  .tbars {
    grid-template-columns: 1fr;
  }
}
.tb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
}
.tb__n {
  width: 110px;
  flex: none;
  color: var(--ink2);
  font-weight: 500;
}
.tb .bar {
  flex: 1;
}
.tb__p {
  width: 32px;
  text-align: right;
  color: var(--muted);
}
</style>
