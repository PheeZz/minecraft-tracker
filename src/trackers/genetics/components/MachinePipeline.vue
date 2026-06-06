<script setup lang="ts">
import { computed, ref } from 'vue'
import { PIPELINES } from '../data/pipelines'
import { ITEM_TEX } from '../data/textures.data'
import EnTip from './EnTip.vue'

const BASE = import.meta.env.BASE_URL
/** URL иконки предмета по EN входа (или null, если текстуры нет). */
function texFor(en: string): string | null {
  const f = ITEM_TEX[en.toLowerCase()]
  return f ? `${BASE}genetics/items/${f}` : null
}

const active = ref<'binnie' | 'gendustry'>('binnie')
const openStep = ref(0)
const pipeline = computed(() => PIPELINES.find((p) => p.id === active.value) ?? PIPELINES[0]!)

function selectChain(id: 'binnie' | 'gendustry'): void {
  active.value = id
  openStep.value = 0
}
</script>

<template>
  <section class="pipe">
    <header class="pipe__head">
      <h2 class="pipe__title">Пайплайн машин</h2>
      <div class="seg" role="group" aria-label="Набор машин">
        <button
          v-for="p in PIPELINES"
          :key="p.id"
          type="button"
          class="seg__btn"
          :class="{ on: active === p.id }"
          :aria-pressed="active === p.id"
          @click="selectChain(p.id)"
        >
          {{ p.label }}
        </button>
      </div>
    </header>

    <ol class="flow">
      <li v-for="(s, i) in pipeline.steps" :key="s.machine.en" class="step">
        <div class="step__io">
          <div class="step__in">
            <span v-for="inp in s.inputs" :key="inp.en" class="res">
              <img
                v-if="texFor(inp.en)"
                class="tex"
                :src="texFor(inp.en)!"
                alt=""
                aria-hidden="true"
              />
              <EnTip :en="inp.en">{{ inp.ru }}</EnTip>
            </span>
          </div>
          <button
            type="button"
            class="mac"
            :class="{ open: openStep === i }"
            :aria-expanded="openStep === i"
            :aria-controls="`gstep-${i}`"
            :title="s.machine.en"
            @click="openStep = openStep === i ? -1 : i"
          >
            <span class="mac__n">{{ s.machine.ru }}</span>
            <span class="mac__chev" aria-hidden="true">▾</span>
          </button>
          <div class="step__out">
            <span class="out">{{ s.outMain }}</span>
            <span v-if="s.outNote" class="out out--note">{{ s.outNote }}</span>
          </div>
        </div>
        <p v-if="openStep === i" :id="`gstep-${i}`" class="step__guide">{{ s.guide }}</p>
      </li>
    </ol>

    <div class="aux">
      <div class="aux__lab">Вспомогательные машины</div>
      <ul class="aux__list">
        <li v-for="a in pipeline.aux" :key="a.machine.en">
          <b
            ><EnTip :en="a.machine.en">{{ a.machine.ru }}</EnTip></b
          >
          — {{ a.note }}
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.pipe {
  padding: 14px 18px;
}
.pipe__head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.pipe__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
}
.seg {
  display: inline-flex;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 2px;
  gap: 2px;
}
.seg__btn {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 6px 12px;
  border-radius: 7px;
  cursor: pointer;
}
.seg__btn.on {
  background: var(--solid);
  color: var(--solid-ink);
}
.seg__btn:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.flow {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step {
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 12px;
  padding: 10px 12px;
  position: relative;
}
.step:not(:last-child)::after {
  content: '↓';
  position: absolute;
  left: 50%;
  bottom: -13px;
  transform: translateX(-50%);
  color: var(--honey-dk);
  font-size: 13px;
}
.step__io {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}
@media (max-width: 720px) {
  .step__io {
    grid-template-columns: 1fr;
  }
}
.step__in {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: flex-end;
}
.res {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  padding: 3px 8px;
  border-radius: 6px;
  color: var(--ink2);
}
.tex {
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
  flex: none;
}
.mac {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font: inherit;
  background: var(--bg2);
  border: 1px solid var(--honey-dk);
  border-radius: 9px;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--ink);
}
.mac__n {
  font-weight: 700;
  font-size: 13px;
}
.mac__chev {
  font-size: 10px;
  color: var(--muted);
  transition: transform 0.2s ease;
}
.mac.open .mac__chev {
  transform: rotate(180deg);
}
.mac:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.step__out {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11.5px;
}
.out {
  color: var(--src-f);
}
.out--note {
  color: var(--muted);
}
.step__guide {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink2);
  border-top: 1px solid var(--line);
  padding-top: 8px;
}
.aux {
  margin-top: 22px;
}
.aux__lab {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 6px;
}
.aux__list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ink2);
}
</style>
