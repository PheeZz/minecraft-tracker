<script setup lang="ts">
import { computed, ref } from 'vue'
import { PIPELINES } from '../data/pipelines'
import { ITEM_TEX, MACHINE_TEX } from '../data/textures.data'
import EnTip from './EnTip.vue'

const BASE = import.meta.env.BASE_URL
function texFor(en: string): string | null {
  const f = ITEM_TEX[en.toLowerCase()]
  return f ? `${BASE}genetics/items/${f}` : null
}
function machTex(en: string): string | null {
  const f = MACHINE_TEX[en]
  return f ? `${BASE}genetics/blocks/${f}` : null
}

// Порядок вкладок: Gendustry первой.
const TAB_ORDER = ['gendustry', 'binnie'] as const
const tabs = computed(() =>
  TAB_ORDER.map((id) => PIPELINES.find((p) => p.id === id)).filter((p) => p != null),
)
const active = ref<'binnie' | 'gendustry'>('gendustry')
const pipeline = computed(() => PIPELINES.find((p) => p.id === active.value) ?? PIPELINES[0]!)
</script>

<template>
  <section class="pipe">
    <header class="pipe__head">
      <h2 class="pipe__title">Пайплайн машин</h2>
      <div class="seg" role="group" aria-label="Набор машин">
        <button
          v-for="p in tabs"
          :key="p.id"
          type="button"
          class="seg__btn"
          :class="{ on: active === p.id }"
          :aria-pressed="active === p.id"
          @click="active = p.id"
        >
          {{ p.label }}
        </button>
      </div>
    </header>

    <ol class="flow">
      <li v-for="(s, i) in pipeline.steps" :key="s.machine.en" class="step">
        <div class="step__hd">
          <span class="step__num">{{ i + 1 }}</span>
          <img
            v-if="machTex(s.machine.en)"
            class="mtex"
            :src="machTex(s.machine.en)!"
            alt=""
            aria-hidden="true"
          />
          <span class="step__mac"
            ><EnTip :en="s.machine.en">{{ s.machine.ru }}</EnTip></span
          >
        </div>
        <p class="step__guide">{{ s.guide }}</p>
        <div class="step__io">
          <div class="io">
            <span class="io__lab">нужно</span>
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
          <div class="io io--out">
            <span class="io__lab">даёт</span>
            <span class="out">{{ s.outMain }}</span>
            <span v-if="s.outNote" class="out__note">{{ s.outNote }}</span>
          </div>
        </div>
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
  gap: 10px;
}
.step {
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 12px;
  padding: 12px 14px;
  position: relative;
}
.step:not(:last-child)::after {
  content: '↓';
  position: absolute;
  left: 26px;
  bottom: -15px;
  color: var(--honey-dk);
  font-size: 14px;
}
.step__hd {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 6px;
}
.step__num {
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: 6px;
  background: var(--solid);
  color: var(--solid-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.mtex {
  width: 22px;
  height: 22px;
  image-rendering: pixelated;
  flex: none;
}
.step__mac {
  font-weight: 700;
  font-size: 14px;
}
.step__guide {
  margin: 0 0 9px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink2);
}
.step__io {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-size: 11.5px;
}
.io {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.io__lab {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.res {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
.out {
  color: var(--src-f);
  font-weight: 600;
}
.out__note {
  color: var(--muted);
}
.aux {
  margin-top: 24px;
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
