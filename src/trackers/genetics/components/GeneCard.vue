<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { carriersOf, geneKey, type AlleleDef, type TraitDef } from '../domain/genetics'
import { useGenesStore } from '../stores/useGenesStore'
import { useBeesStore } from '@/trackers/bees/stores/useBeesStore'
import { useBeesUiStore } from '@/trackers/bees/stores/useBeesUiStore'
import { CARRIERS } from '../data/carriers'
import EnTip from './EnTip.vue'

const props = defineProps<{ trait: TraitDef; allele: AlleleDef }>()
const emit = defineEmits<{ close: [] }>()
const genes = useGenesStore()
const bees = useBeesStore()
const beesUi = useBeesUiStore()
const router = useRouter()

/** Открыть вид-носитель в графе скрещивания трекера пчёл. */
function openInGraph(ru: string): void {
  beesUi.selectBee(ru)
  beesUi.setView('graph')
  emit('close')
  router.push('/bees')
}
const have = computed(() => genes.has(props.trait.key, props.allele.en))
/** Виды-носители этого аллеля (откуда взять ген). */
const carriers = computed(() => carriersOf(CARRIERS, props.trait.key, props.allele.en))

// Немодальная панель: при открытии переводим фокус на неё, Escape — закрытие.
const root = ref<HTMLElement>()
onMounted(() => root.value?.focus())
</script>

<template>
  <div
    ref="root"
    class="gcard"
    role="region"
    aria-label="Справка по гену"
    tabindex="-1"
    @keydown.esc="emit('close')"
  >
    <header class="gcard__h">
      <div>
        <div class="gcard__t1">
          <EnTip :en="`${trait.en} → ${allele.en}`">{{ trait.ru }} → {{ allele.ru }}</EnTip>
        </div>
        <div class="gcard__t2">{{ trait.en }} · {{ allele.en }}</div>
      </div>
      <span v-if="allele.mod" class="gcard__mod">{{ allele.mod }}</span>
      <button type="button" class="gcard__x" aria-label="Закрыть" @click="emit('close')">✕</button>
    </header>

    <div class="gcard__sec">
      <div class="gcard__lab">ЧТО ДАЁТ</div>
      <p class="gcard__p">{{ trait.desc }}</p>
    </div>

    <div class="gcard__sec">
      <div class="gcard__lab">ШКАЛА ЗНАЧЕНИЙ</div>
      <div class="gcard__scale">
        <span
          v-for="a in trait.alleles"
          :key="geneKey(trait.key, a.en)"
          class="sv"
          :class="{ cur: a.en === allele.en, have: genes.has(trait.key, a.en) }"
        >
          <EnTip :en="a.en">{{ a.ru }}</EnTip>
        </span>
      </div>
    </div>

    <div v-if="carriers.length" class="gcard__sec">
      <div class="gcard__lab">Виды-носители · откуда взять</div>
      <ul class="gcard__carriers">
        <li v-for="c in carriers.slice(0, 8)" :key="c.mod + '|' + c.en">
          <EnTip :en="c.en">{{ c.ru }}</EnTip>
          <span class="gcard__cright">
            <span v-if="bees.isHave(c.ru)" class="gcard__own yes">✓ в складе</span>
            <button
              v-else
              type="button"
              class="gcard__graph"
              :title="`Открыть «${c.ru}» в графе скрещивания`"
              @click="openInGraph(c.ru)"
            >
              → вывести
            </button>
          </span>
        </li>
      </ul>
      <div v-if="carriers.length > 8" class="gcard__more">…ещё {{ carriers.length - 8 }}</div>
    </div>

    <div class="gcard__sec gcard__sec--last">
      <div class="gcard__lab">МОЙ СТАТУС</div>
      <div class="gcard__status" :class="{ yes: have }">
        {{ have ? '✓ Ген собран' : 'Ещё не собран' }}
      </div>
      <button type="button" class="gcard__toggle" @click="genes.toggle(trait.key, allele.en)">
        {{ have ? 'Снять отметку' : 'Отметить собранным' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.gcard {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: 360px;
  max-width: calc(100vw - 36px);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 50;
}
.gcard:focus {
  outline: none;
}
.gcard__h {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  border-bottom: 1px solid var(--line);
}
.gcard__t1 {
  font-weight: 800;
  font-size: 15px;
}
.gcard__t2 {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}
.gcard__mod {
  font-size: 10.5px;
  padding: 3px 8px;
  border-radius: 20px;
  background: var(--src-m-soft);
  color: var(--src-m);
  border: 1px solid var(--src-m);
}
.gcard__x {
  margin-left: auto;
  background: none;
  border: 0;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
}
.gcard__sec {
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
}
.gcard__sec--last {
  border-bottom: 0;
}
.gcard__lab {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.gcard__p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}
.gcard__scale {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.sv {
  font-size: 11px;
  padding: 4px 7px;
  border-radius: 5px;
  background: var(--bg2);
  color: var(--muted);
}
.sv.have {
  background: var(--src-f-soft);
  color: var(--ink);
}
.sv.cur {
  outline: 1px solid var(--honey-dk);
  color: var(--ink);
  font-weight: 700;
}
.gcard__status {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 8px;
}
.gcard__status.yes {
  color: var(--src-f);
}
.gcard__toggle {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--cardln);
  background: var(--bg2);
  color: var(--ink);
  cursor: pointer;
}
.gcard__carriers {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12.5px;
}
.gcard__carriers li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 0;
}
.gcard__own {
  color: var(--muted);
  font-size: 11px;
}
.gcard__own.yes {
  color: var(--src-f);
}
.gcard__graph {
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  background: none;
  border: 0;
  color: var(--honey-dk);
  cursor: pointer;
  padding: 0;
}
.gcard__graph:hover {
  text-decoration: underline;
}
.gcard__more {
  font-size: 11px;
  color: var(--dim);
  margin-top: 4px;
}
</style>
