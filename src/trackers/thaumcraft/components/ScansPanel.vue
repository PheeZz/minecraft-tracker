<script setup lang="ts">
import { computed, ref } from 'vue'
import { ASPECTS } from '../data/aspects.data'
import { ASPECT_BY_TAG } from '../domain/aspects'
import { sourcesForAspect, searchSources, aspectsWithSources } from '../domain/sources'
import type { AspectSource } from '../domain/types'
import AspectHex from './AspectHex.vue'
import ItemIcon from './ItemIcon.vue'

type Mode = 'aspect' | 'item'
const mode = ref<Mode>('aspect')

// только аспекты, у которых есть источники; по алфавиту латинского тега
const withSources = aspectsWithSources()
const aspectGrid = computed(() =>
  [...ASPECTS].filter((a) => withSources.has(a.tag)).sort((a, b) => a.label.localeCompare(b.label)),
)

const selectedTag = ref<string>(aspectGrid.value[0]?.tag ?? 'aer')
const hits = computed(() => sourcesForAspect(selectedTag.value))

const query = ref('')
const matched = computed(() => searchSources(query.value).slice(0, 120))

const kindLabel = (s: AspectSource): string => (s.kind === 'entity' ? 'моб' : 'предмет')
const aspectEntries = (s: AspectSource): [string, number][] => Object.entries(s.aspects)
</script>

<template>
  <section class="sc">
    <header class="sc__top">
      <div class="sc__modes" role="group" aria-label="Режим поиска">
        <button
          type="button"
          class="sc__mode"
          :class="{ on: mode === 'aspect' }"
          :aria-pressed="mode === 'aspect'"
          @click="mode = 'aspect'"
        >
          По аспекту
        </button>
        <button
          type="button"
          class="sc__mode"
          :class="{ on: mode === 'item' }"
          :aria-pressed="mode === 'item'"
          @click="mode = 'item'"
        >
          По предмету
        </button>
      </div>
    </header>

    <!-- Режим А: где добыть аспект -->
    <div v-if="mode === 'aspect'" class="sc__aspect">
      <div class="sc__picker" role="group" aria-label="Выбор аспекта">
        <button
          v-for="a in aspectGrid"
          :key="a.tag"
          type="button"
          class="pcell"
          :class="{ on: selectedTag === a.tag }"
          :aria-pressed="selectedTag === a.tag"
          @click="selectedTag = a.tag"
        >
          <AspectHex :tag="a.tag" :size="40" />
          <span class="pcell__nm">{{ a.label }}</span>
        </button>
      </div>

      <div class="sc__results">
        <div class="sc__rhd">
          Источники аспекта
          <strong>{{ ASPECT_BY_TAG.get(selectedTag)?.label }}</strong>
          ({{ hits.length }})
        </div>
        <ul class="srclist">
          <li v-for="(h, i) in hits" :key="i" class="srow">
            <div class="srow__main">
              <span class="srow__nm">
                <ItemIcon :item="{ icon: h.source.icon, en: h.source.name }" />{{ h.source.name }}
              </span>
              <span class="srow__amt"
                ><AspectHex :tag="selectedTag" :size="18" />{{ h.amount }}</span
              >
            </div>
            <div class="srow__meta">
              <span class="kbadge" :data-k="h.source.kind">{{ kindLabel(h.source) }}</span>
              <span class="modtag">{{ h.source.mod }}</span>
            </div>
            <div class="srow__asp">
              <span v-for="[tag, amt] in aspectEntries(h.source)" :key="tag" class="chip">
                <AspectHex :tag="tag" :size="16" />
                <span class="chip__t">{{ ASPECT_BY_TAG.get(tag)?.label ?? tag }} {{ amt }}</span>
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Режим Б: что даёт предмет/моб -->
    <div v-else class="sc__item">
      <input
        v-model="query"
        class="sc__search"
        placeholder="Поиск предмета или моба…"
        aria-label="Поиск источника"
      />
      <p v-if="!query.trim()" class="sc__hint">Введите название предмета или моба.</p>
      <p v-else-if="!matched.length" class="sc__hint">Ничего не найдено.</p>
      <ul v-else class="srclist">
        <li v-for="(s, i) in matched" :key="i" class="srow">
          <div class="srow__main">
            <span class="srow__nm">
              <ItemIcon :item="{ icon: s.icon, en: s.name }" />{{ s.name }}
            </span>
          </div>
          <div class="srow__meta">
            <span class="kbadge" :data-k="s.kind">{{ kindLabel(s) }}</span>
            <span class="modtag">{{ s.mod }}</span>
          </div>
          <div class="srow__asp">
            <span v-for="[tag, amt] in aspectEntries(s)" :key="tag" class="chip">
              <AspectHex :tag="tag" :size="16" />
              <span class="chip__t">{{ ASPECT_BY_TAG.get(tag)?.label ?? tag }} {{ amt }}</span>
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.sc {
  padding: 16px 18px;
}
.sc__top {
  margin-bottom: 16px;
}
.sc__modes {
  display: inline-flex;
  gap: 2px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 3px;
}
.sc__mode {
  font: inherit;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
  background: none;
  border: 0;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.sc__mode:hover:not(.on) {
  color: var(--ink);
  background: rgba(160, 107, 255, 0.08);
}
.sc__mode.on {
  background: linear-gradient(180deg, #a06bff, var(--solid));
  color: var(--solid-ink);
}
.sc__mode:focus-visible,
.pcell:focus-visible {
  outline: 2px solid var(--honey-dk);
  outline-offset: 1px;
}
.sc__aspect {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 760px) {
  .sc__aspect {
    grid-template-columns: 1fr;
  }
}
.sc__picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 6px;
  max-height: 74vh;
  overflow-y: auto;
  padding: 4px;
}
.pcell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 6px 2px;
  cursor: pointer;
}
.pcell:hover {
  background: rgba(160, 107, 255, 0.08);
}
.pcell.on {
  border-color: var(--honey-dk);
  background: rgba(160, 107, 255, 0.12);
}
.pcell__nm {
  font-family: var(--font-mono);
  font-size: 8.5px;
  color: var(--ink2);
}
.sc__rhd {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 10px;
}
.sc__rhd strong {
  color: var(--ink);
}
.sc__search {
  width: 100%;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 9px 12px;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  margin-bottom: 14px;
}
.sc__hint {
  color: var(--muted);
  font-size: 13px;
}
.srclist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.srow {
  content-visibility: auto;
  contain-intrinsic-size: auto 84px;
  background: linear-gradient(180deg, var(--card2), var(--card));
  border: 1px solid var(--cardln);
  border-radius: 12px;
  padding: 10px 13px;
}
.srow__main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.srow__nm {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13.5px;
  color: var(--ink);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.srow__amt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--honey-dk);
  font-weight: 700;
}
.srow__meta {
  display: flex;
  gap: 6px;
  margin: 5px 0 7px;
}
.kbadge {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 7px;
  color: var(--solid-ink);
  background: var(--solid);
}
.kbadge[data-k='entity'] {
  background: var(--rust);
}
.modtag {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--alt);
  border: 1px solid var(--solid);
  border-radius: 6px;
  padding: 2px 7px;
}
.srow__asp {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--bg2);
  border: 1px solid var(--cardln);
  border-radius: 20px;
  padding: 2px 9px 2px 3px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink2);
}
</style>
