<script setup lang="ts">
import { computed, ref } from 'vue'
import { ASPECTS } from '../data/aspects.data'
import { ASPECT_BY_TAG, aspectPath } from '../domain/aspects'
import IconBase from '@/shared/ui/IconBase.vue'
import AspectHex from './AspectHex.vue'

// аспекты по алфавиту латинского тега
const sorted = computed(() => [...ASPECTS].sort((a, b) => a.label.localeCompare(b.label)))
const primals = computed(() => sorted.value.filter((a) => a.primal))
const compounds = computed(() => sorted.value.filter((a) => !a.primal))

// обратный индекс «аспект → во что входит»
const usedIn = computed(() => {
  const m = new Map<string, string[]>()
  for (const a of ASPECTS)
    for (const c of a.components) (m.get(c) ?? m.set(c, []).get(c)!).push(a.tag)
  return m
})

// ── решатель цепочки from → to (выбор кликом по гексам, без селекторов) ──
const from = ref('aqua')
const to = ref('praecantatio')
const path = computed(() => aspectPath(from.value, to.value))
const activeSlot = ref<'from' | 'to' | null>(null)
const toggleSlot = (s: 'from' | 'to'): void => {
  activeSlot.value = activeSlot.value === s ? null : s
}
const pick = (tag: string): void => {
  if (activeSlot.value === 'from') from.value = tag
  else if (activeSlot.value === 'to') to.value = tag
  activeSlot.value = null
}
const swap = (): void => {
  const t = from.value
  from.value = to.value
  to.value = t
}

// ── выбранный в компендиуме аспект ──
const selected = ref<string | null>('praecantatio')
const sel = computed(() => (selected.value ? ASPECT_BY_TAG.get(selected.value) : null))
const selUsedIn = computed(() => (selected.value ? (usedIn.value.get(selected.value) ?? []) : []))
</script>

<template>
  <section class="ap">
    <h2 class="ap__title">Аспекты</h2>
    <p class="ap__sub">
      58 аспектов. Два аспекта соединимы в столе, только если один — прямой компонент другого.
    </p>

    <!-- Решатель цепочки -->
    <div class="card solver">
      <div class="lab">Решатель цепочки — проложи путь между двумя аспектами</div>
      <div class="solver__slots">
        <button
          type="button"
          class="slot"
          :class="{ active: activeSlot === 'from' }"
          :aria-pressed="activeSlot === 'from'"
          @click="toggleSlot('from')"
        >
          <span class="slot__lab">откуда</span>
          <AspectHex :tag="from" :size="44" />
          <span class="slot__nm">{{ ASPECT_BY_TAG.get(from)?.label }}</span>
        </button>
        <button type="button" class="swap" title="Поменять местами" @click="swap">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
          </svg>
        </button>
        <button
          type="button"
          class="slot"
          :class="{ active: activeSlot === 'to' }"
          :aria-pressed="activeSlot === 'to'"
          @click="toggleSlot('to')"
        >
          <span class="slot__lab">куда</span>
          <AspectHex :tag="to" :size="44" />
          <span class="slot__nm">{{ ASPECT_BY_TAG.get(to)?.label }}</span>
        </button>
      </div>

      <!-- инлайн-пикер: плавно раскрывается (grid-rows 0fr→1fr), не дёргая вёрстку -->
      <div class="pk" :class="{ open: !!activeSlot }">
        <div class="pk__inner">
          <div class="picker">
            <div class="picker__lab">
              Выбери аспект для слота «{{ activeSlot === 'to' ? 'куда' : 'откуда' }}»
            </div>
            <div class="picker__grid">
              <button
                v-for="a in sorted"
                :key="a.tag"
                type="button"
                class="pcell"
                :class="{ on: (activeSlot === 'from' ? from : to) === a.tag }"
                :title="`${a.label} · ${a.nameRu}`"
                :tabindex="activeSlot ? 0 : -1"
                @click="pick(a.tag)"
              >
                <AspectHex :tag="a.tag" :size="32" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="path" class="chain">
        <template v-for="(t, i) in path" :key="t">
          <IconBase v-if="i > 0" name="arrow" class="chain__lk" aria-hidden="true" />
          <span class="chain__cell">
            <AspectHex :tag="t" :size="48" />
            <span class="chain__nm">{{ ASPECT_BY_TAG.get(t)?.label }}</span>
          </span>
        </template>
      </div>
      <p v-else class="empty">Эти аспекты нельзя связать (один из них изолирован).</p>
    </div>

    <!-- Компендиум -->
    <div class="cols">
      <div class="grid-wrap">
        <div class="lab">Праймалы</div>
        <div class="grid">
          <button
            v-for="a in primals"
            :key="a.tag"
            type="button"
            class="gcell"
            :class="{ on: selected === a.tag }"
            @click="selected = a.tag"
          >
            <AspectHex :tag="a.tag" :size="50" />
            <span class="gcell__nm">{{ a.label }}</span>
          </button>
        </div>
        <div class="lab" style="margin-top: 14px">Составные</div>
        <div class="grid">
          <button
            v-for="a in compounds"
            :key="a.tag"
            type="button"
            class="gcell"
            :class="{ on: selected === a.tag }"
            @click="selected = a.tag"
          >
            <AspectHex :tag="a.tag" :size="50" />
            <span class="gcell__nm">{{ a.label }}</span>
          </button>
        </div>
      </div>

      <aside v-if="sel" class="card detail">
        <div class="detail__head">
          <AspectHex :tag="sel.tag" :size="64" />
          <div>
            <div class="detail__label">{{ sel.label }}</div>
            <div class="detail__ru">
              {{ sel.nameRu }} <span class="detail__en">/ {{ sel.nameEn }}</span>
            </div>
            <div class="detail__mod">{{ sel.mod }}</div>
          </div>
        </div>

        <div class="lab">Состав</div>
        <div v-if="sel.components.length" class="recipe">
          <span class="recipe__cell"
            ><AspectHex :tag="sel.components[0]!" :size="40" /><span class="recipe__nm">{{
              ASPECT_BY_TAG.get(sel.components[0]!)?.label
            }}</span></span
          >
          <span class="plus">+</span>
          <span class="recipe__cell"
            ><AspectHex :tag="sel.components[1]!" :size="40" /><span class="recipe__nm">{{
              ASPECT_BY_TAG.get(sel.components[1]!)?.label
            }}</span></span
          >
        </div>
        <p v-else class="primal-note">Первичный аспект (праймал) — не раскладывается.</p>

        <div class="lab" style="margin-top: 12px">Входит в составные ({{ selUsedIn.length }})</div>
        <div v-if="selUsedIn.length" class="usedin">
          <button
            v-for="t in selUsedIn"
            :key="t"
            type="button"
            class="usedin__chip"
            @click="selected = t"
          >
            <AspectHex :tag="t" :size="30" />{{ ASPECT_BY_TAG.get(t)?.label }}
          </button>
        </div>
        <p v-else class="primal-note">Не входит в другие аспекты.</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.ap {
  padding: 16px 18px;
}
.ap__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 19px;
}
.ap__sub {
  color: var(--muted);
  font-size: 12.5px;
  margin: 4px 0 14px;
}
.card {
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 14px;
  padding: 13px 15px;
  box-shadow: var(--shadow-card);
}
.lab {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--honey-dk);
  margin-bottom: 9px;
}
.solver__slots {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 12px;
}
.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  max-width: 150px;
  font: inherit;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 12px;
  padding: 8px 10px 9px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}
.slot:hover {
  border-color: var(--honey-dk);
}
.slot.active {
  border-color: var(--honey-dk);
  background: rgba(160, 107, 255, 0.12);
  box-shadow: var(--glow-arcane);
}
.slot:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.slot__lab {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--muted);
}
.slot__nm {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink2);
}
.swap {
  flex: none;
  align-self: center;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  color: var(--honey-dk);
  cursor: pointer;
}
.swap:hover {
  border-color: var(--honey-dk);
  box-shadow: var(--glow-arcane-soft);
}
.swap:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
/* плавное раскрытие пикера по высоте (grid-rows 0fr→1fr) + проявление */
.pk {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.26s ease;
}
.pk.open {
  grid-template-rows: 1fr;
}
.pk__inner {
  overflow: hidden;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.pk.open .pk__inner {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .pk,
  .pk__inner {
    transition: none;
  }
}
.picker {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px dashed var(--cardln);
  border-radius: 10px;
  background: rgba(6, 5, 12, 0.4);
}
.picker__lab {
  font-size: 11.5px;
  color: var(--honey-dk);
  margin-bottom: 8px;
}
.picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 5px;
}
.pcell {
  display: grid;
  place-items: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 4px;
  cursor: pointer;
}
.pcell:hover {
  background: rgba(160, 107, 255, 0.1);
}
.pcell.on {
  border-color: var(--honey-dk);
  background: rgba(160, 107, 255, 0.14);
}
.pcell:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.chain__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.chain__nm {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--ink2);
}
.chain__lk {
  color: var(--honey-dk);
  font-weight: 700;
  filter: drop-shadow(0 0 4px var(--glow-violet));
}
.empty {
  color: var(--muted);
  font-size: 12.5px;
}
.cols {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 16px;
  flex-wrap: wrap;
}
.grid-wrap {
  flex: 2;
  min-width: 300px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
}
.gcell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 6px 2px;
  cursor: pointer;
}
.gcell:hover {
  background: rgba(160, 107, 255, 0.08);
}
.gcell.on {
  border-color: var(--honey-dk);
  background: rgba(160, 107, 255, 0.12);
}
.gcell__nm {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--ink2);
}
.gcell:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.detail {
  flex: 1;
  min-width: 230px;
}
.detail__head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}
.detail__label {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 16px;
}
.detail__ru {
  font-size: 12.5px;
  color: var(--ink2);
}
.detail__en {
  color: var(--muted);
}
.detail__mod {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  margin-top: 2px;
}
.recipe {
  display: flex;
  align-items: center;
  gap: 10px;
}
.recipe__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.recipe__nm {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--ink2);
}
.plus {
  color: var(--honey-dk);
  font-weight: 700;
  font-size: 18px;
}
.primal-note {
  color: var(--muted);
  font-size: 12px;
  margin: 0;
}
.usedin {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.usedin__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink2);
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 20px;
  padding: 2px 9px 2px 3px;
  cursor: pointer;
}
.usedin__chip:hover {
  border-color: var(--honey-dk);
}
</style>
