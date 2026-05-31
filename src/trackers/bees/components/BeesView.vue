<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { BEE_BY_ID } from '../data/bees.data'
import { COMBS } from '../domain/combs'
import { combColor } from '../domain/colors'
import { useBeesStore } from '../stores/useBeesStore'
import BeeRail from './BeeRail.vue'
import BeeChainGraph from './BeeChainGraph.vue'
import BeePanel from './BeePanel.vue'
import BeeInventory from './BeeInventory.vue'
import CombIcon from './CombIcon.vue'
import BeeTasksModal from './BeeTasksModal.vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { storage } from '@/shared/persistence/storage'
import { useTour } from '@/shared/ui/useTour'
import HintSpot from '@/shared/ui/HintSpot.vue'
import { buildBeesTour } from '../onboarding/beesTour'

const store = useBeesStore()
const tour = useTour(() => buildBeesTour({ selectComb: (n) => store.selectComb(n) }), {
  onDone: () => storage.set('onboard.bees', true),
})
let autoStartTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (!storage.get('onboard.bees', false)) {
    // даём модбару/рейлу отрисоваться; граф появится по демо-выбору внутри тура
    autoStartTimer = setTimeout(() => void tour.start(), 500)
  }
})
onBeforeUnmount(() => clearTimeout(autoStartTimer))
const graphRef = ref<InstanceType<typeof BeeChainGraph>>()

const combPct = computed(() => {
  if (!store.curComb || !store.curTarget) return null
  return COMBS[store.curComb]?.find((p) => p.bee === store.curTarget)?.pct ?? null
})
const recipeCount = computed(() =>
  store.curTarget ? (BEE_BY_ID[store.curTarget]?.parents.length ?? 0) : 0,
)
</script>

<template>
  <div class="beeswrap">
    <!-- Полоса-переключатель режимов: видна всегда, чинит спрятанную кнопку инвентаря. -->
    <div class="modebar" data-tour="bees-modebar">
      <div class="modebar__seg" role="group" aria-label="Режим">
        <button
          type="button"
          :aria-pressed="store.view === 'graph'"
          :class="{ on: store.view === 'graph' }"
          @click="store.setView('graph')"
        >
          <IconBase name="leaf" />Граф
        </button>
        <button
          type="button"
          :aria-pressed="store.view === 'inventory'"
          :class="{ on: store.view === 'inventory' }"
          @click="store.setView('inventory')"
        >
          <IconBase name="box" />Инвентарь
        </button>
      </div>
      <button
        type="button"
        class="modebar__tasks"
        data-tour="bees-tasks"
        @click="store.openTasks()"
      >
        <IconBase name="list" />Задачи
        <span v-if="store.openTaskCount" class="modebar__badge">{{ store.openTaskCount }}</span>
      </button>
      <HintSpot
        text="Инвентарь — отмечаешь выведенных пчёл (склад). Задачи — список крафтов с нужными сотами и прогрессом."
        side="bottom"
      />
      <button class="modebar__tour" type="button" title="Запустить обзор" @click="tour.start()">
        ? Обзор
      </button>
    </div>

    <Transition name="inv" mode="out-in">
      <BeeInventory v-if="store.view === 'inventory'" key="inv" class="bees-inv" />
      <div v-else key="layout" class="bees">
        <BeeRail data-tour="bees-rail" />

        <div class="stage" data-tour="bees-graph">
          <div key="graph" class="stagewrap">
            <div class="crumb">
              <template v-if="store.curTarget">
                <template v-if="store.curComb">
                  <span class="goal">
                    <CombIcon v-if="combColor(store.curComb)" :name="store.curComb" big />
                    <span v-else class="goal__hex">⬡</span>
                    {{ store.curComb }}
                  </span>
                  <span class="arrow">→</span>
                  <span class="muted">вывести</span> <span class="pick">{{ store.curTarget }}</span>
                  <span v-if="combPct != null" class="muted">(сота @{{ combPct }}%)</span>
                </template>
                <template v-else>
                  <span class="goal">{{ store.curTarget }}</span>
                  <span class="muted">дерево выведения</span>
                </template>
                <span v-if="recipeCount > 1" class="muted">· {{ recipeCount }} рецепта</span>
                <span class="tools">
                  <button class="tbtn" type="button" @click="graphRef?.fit()">Вписать</button>
                </span>
              </template>
              <span v-else class="muted">Выбери соту слева →</span>
            </div>

            <BeeChainGraph v-if="store.curTarget" ref="graphRef" class="cy" />
            <div v-else class="welcome">
              <div class="o">⬡</div>
              <h2>Что вывести ради соты?</h2>
              <div>
                Выбери соту слева. Покажу пчёл-производителей (сначала самых лёгких)<br />
                и компактное дерево «что с чем скрестить». Где есть <b>альтернативные рецепты</b> —
                переключишь.
              </div>
            </div>

            <div v-if="store.curTarget" class="legend">
              <span><i style="background: var(--honey)" />цель</span>
              <span
                ><i
                  style="background: var(--card); border: 1.5px solid var(--src-f)"
                />вывести</span
              >
              <span
                ><i style="background: var(--bg2); border: 1.5px dashed var(--muted)" />дикая</span
              >
              <span
                ><i style="background: var(--card); border: 2px double var(--alt)" />есть ⇄ альт.
                рецепты</span
              >
              <span
                ><i
                  style="background: #f4c452; transform: rotate(45deg); width: 9px; height: 9px"
                />ромб = рецепт, шанс %</span
              >
            </div>
          </div>
        </div>

        <BeePanel data-tour="bees-panel" />
      </div>
    </Transition>

    <BeeTasksModal v-if="store.tasksOpen" />
  </div>
</template>

<style scoped>
.beeswrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.modebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--line);
  flex: none;
}
.modebar__seg {
  display: inline-flex;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
}
.modebar__seg button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-weight: 700;
  font-size: 13px;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.13s;
}
.modebar__seg button:hover {
  color: var(--ink);
}
.modebar__seg button.on {
  background: var(--solid);
  color: var(--solid-ink);
}
.modebar__seg button:focus-visible,
.modebar__tasks:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.modebar__tasks {
  margin-left: auto;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-weight: 700;
  font-size: 13px;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--cardln);
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.13s;
}
.modebar__tasks:hover {
  border-color: var(--honey-dk);
}
.modebar__tour {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink2);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 7px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.13s;
}
.modebar__tour:hover {
  border-color: var(--honey-dk);
  color: var(--honey-dk);
}
.modebar__badge {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 9px;
  background: var(--honey);
  color: var(--solid-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
}
.bees {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 296px 1fr 348px;
}
/* инвентарь во весь размер области пчёл */
.bees-inv {
  flex: 1;
  min-height: 0;
}
.stage {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
/* обёртка центра (граф/приветствие/легенда) — отдельный узел для <Transition> между
   ним и инвентарём; сохраняет колоночный flex, чтобы .cy тянулся (flex:1). */
.stagewrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.crumb {
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 56px;
}
.crumb .goal {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 17px;
  display: inline-flex;
  align-items: center;
}
.crumb .arrow {
  color: var(--muted);
}
.crumb .pick {
  font-weight: 700;
  color: var(--honey-dk);
}
.crumb .muted {
  color: var(--muted);
  font-size: 13px;
}
.tools {
  margin-left: auto;
  display: flex;
  gap: 7px;
}
.tbtn {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  background: var(--card);
  border: 1px solid var(--cardln);
  padding: 7px 11px;
  border-radius: 9px;
  cursor: pointer;
  color: var(--ink2);
}
.tbtn:hover {
  border-color: var(--honey-dk);
}
.cy {
  flex: 1;
  min-height: 0;
}
.welcome {
  position: absolute;
  inset: 56px 0 0;
  display: grid;
  place-content: center;
  text-align: center;
  color: var(--muted);
  padding: 30px;
}
.welcome .o {
  font-size: 50px;
  color: var(--honey);
  filter: drop-shadow(0 6px 14px rgba(232, 167, 44, 0.4));
}
.welcome h2 {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--ink);
  margin: 14px 0 6px;
  font-size: 22px;
}
.legend {
  position: absolute;
  left: 16px;
  bottom: 14px;
  display: flex;
  gap: 13px;
  font-size: 12px;
  color: var(--muted);
  flex-wrap: wrap;
  max-width: 60%;
  background: var(--panel);
  border: 1px solid var(--cardln);
  padding: 7px 13px;
  border-radius: 14px;
  backdrop-filter: blur(4px);
}
.legend i {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  display: inline-block;
  vertical-align: -1px;
  margin-right: 5px;
}
</style>
