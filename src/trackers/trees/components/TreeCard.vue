<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconBase from '@/shared/ui/IconBase.vue'
import { BY_ID, TREES } from '../data/trees.data'
import { breedPath, isAvailable, parentReady, unlockScore } from '../domain/graph'
import { parentDemand } from '../domain/plan'
import { invTotal } from '../domain/plan'
import { plantGrid } from '../graph/format'
import { useTreesStore } from '../stores/useTreesStore'
import { useTreesUiStore } from '../stores/useTreesUiStore'
import { useTreeActions } from '../composables/useTreeActions'
import InvCounters from './InvCounters.vue'

const store = useTreesStore()
const ui = useTreesUiStore()
const actions = useTreeActions()

const pathOpen = ref(false)
watch(
  () => ui.selectedId,
  () => {
    pathOpen.value = false
  },
)

const tree = computed(() => (ui.selectedId ? BY_ID[ui.selectedId] : undefined))
const state = computed(() => (ui.selectedId ? (store.progress[ui.selectedId] ?? 0) : 0))
const got = computed(() => state.value === 2)
const avail = computed(
  () => !!tree.value && !got.value && isAvailable(store.progress, tree.value.id),
)

const users = computed(() =>
  tree.value ? TREES.filter((x) => x.parents?.some((p) => p.includes(tree.value!.id))) : [],
)
const demand = computed(() =>
  tree.value ? parentDemand(store.progress, tree.value.id) : { need: 0, needRem: 0 },
)
const path = computed(() => (tree.value ? breedPath(store.progress, tree.value.id) : []))
const unlock = computed(() =>
  tree.value && avail.value ? unlockScore(store.progress, tree.value.id) : 0,
)
const haveTotal = computed(() => (tree.value ? invTotal(store.inv(tree.value.id)) : 0))

const stateLabel = computed(() =>
  got.value ? 'получено' : avail.value ? 'доступно' : 'не получено',
)
const stateMod = computed(() => (got.value ? 'is-bred' : avail.value ? 'is-avail' : 'is-none'))

function stepMod(id: string): string {
  const s = store.progress[id] ?? 0
  if (s === 2) return 'is-bred'
  if (s === 0 && isAvailable(store.progress, id)) return 'is-avail'
  return 'is-locked'
}
</script>

<template>
  <div class="card">
    <template v-if="!tree">
      <div class="hint card__hello">
        <IconBase name="target" /> <b>Клик по ноде</b> — выбрать дерево и подсветить родословную.<br />
        <IconBase name="check" /> Статус «получено» — кнопкой в этой карточке.<br />
        <IconBase name="sprout" /> Счётчики саженцев/пыльцы — здесь и в плане.<br />
        <IconBase name="search" /> Поиск — по названию дерева или плода.
      </div>
    </template>

    <template v-else>
      <div class="card__name">{{ tree.id }}</div>
      <div class="card__tags">
        <span class="pill pill--tier" :class="`t--${tree.tier}`">T{{ tree.tier }}</span>
        <span class="pill pill--state" :class="stateMod">
          <IconBase v-if="got" name="check" /><IconBase v-else-if="avail" name="bolt" />{{
            stateLabel
          }}
        </span>
      </div>

      <div v-if="tree.fruit" class="card__fruit">
        <IconBase name="fruit" /> <b>{{ tree.fruit }}</b>
      </div>
      <div v-if="tree.plant > 1" class="card__cond">
        ⊞ Сажать {{ plantGrid(tree.plant) }} — нужно {{ tree.plant }} саженцев рядом
      </div>
      <div v-if="tree.cond" class="card__cond"><IconBase name="warn" /> {{ tree.cond }}</div>
      <div v-if="avail && unlock" class="hint card__unlock">
        <IconBase name="bolt" /> Разблокирует деревьев: <b>{{ unlock }}</b>
      </div>

      <div v-if="tree.parents" class="card__recipe">
        <b>Рецепт:</b>
        <template v-for="(pair, i) in tree.parents" :key="i">
          <div v-if="i === 0" class="card__recipe-row">
            <span
              class="mark"
              :class="pair.every((p) => parentReady(store.progress, p)) ? 'is-ok' : 'is-bad'"
            >
              <IconBase
                :name="pair.every((p) => parentReady(store.progress, p)) ? 'check' : 'ban'"
              />
            </span>
            <span>
              <template v-for="(p, j) in pair" :key="p">
                <span
                  class="link parent"
                  :class="parentReady(store.progress, p) ? 'is-ready' : 'is-pending'"
                  @click="actions.jump(p)"
                  >{{ p }}</span
                ><span v-if="j === 0"> + </span>
              </template>
            </span>
          </div>
          <div v-else class="card__alt">
            альт:
            <template v-for="(p, j) in pair" :key="p">
              <span class="link parent" @click="actions.jump(p)">{{ p }}</span
              ><span v-if="j === 0"> + </span>
            </template>
          </div>
        </template>
      </div>
      <div v-else class="hint">Базовое дерево — из мира, рецепта нет.</div>

      <button
        class="action"
        :class="got ? 'action--unget' : 'action--get'"
        type="button"
        @click="actions.toggleBred(tree.id)"
      >
        <IconBase :name="got ? 'close' : 'check'" />
        {{ got ? 'Снять «получено»' : 'Отметить полученным' }}
      </button>

      <template v-if="tree.parents">
        <button class="btn btn--xs card__pathbtn" type="button" @click="pathOpen = !pathOpen">
          <IconBase name="list" /> Путь к этому дереву{{ path.length ? ` (${path.length})` : '' }}
        </button>
        <div v-if="pathOpen && path.length" class="path">
          <div
            v-for="(id, i) in path"
            :key="id"
            class="path__step"
            :class="`path__step--${stepMod(id)}`"
          >
            <span class="path__num">{{ i + 1 }}</span>
            <span class="link path__name" @click="actions.jump(id)">{{ id }}</span>
            <span class="hint">← {{ BY_ID[id]?.parents?.[0]?.join(' + ') }}</span>
          </div>
        </div>
        <div v-else-if="pathOpen" class="hint card__pathbtn">
          Дерево уже получено — выводить нечего.
        </div>
      </template>

      <div v-if="users.length && demand.need" class="card__demand">
        <b>Собрать с этого дерева:</b>
        <span class="u-mono" :class="{ 'is-ok': haveTotal >= demand.needRem }"
          >{{ haveTotal }}/{{ demand.needRem }}</span
        >
        <span v-if="demand.need !== demand.needRem" class="hint">
          (всего по плану {{ demand.need }})</span
        >
        <div class="hint">Саженцы и пыльца взаимозаменяемы.</div>
        <InvCounters :id="tree.id" />
      </div>

      <div v-if="users.length" class="card__users">
        <b>Используется в ({{ users.length }}):</b>
        <template v-for="(u, i) in users" :key="u.id">
          <span class="link" @click="actions.jump(u.id)">{{ u.id }}</span
          ><span v-if="i < users.length - 1">, </span>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  min-height: 54px;
}
.card__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 4px;
}
.card__tags {
  margin: 2px 0;
}
.card__fruit {
  color: var(--amber);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.card__cond {
  margin-top: 7px;
  font-size: 12px;
  color: var(--amber);
  display: flex;
  align-items: center;
  gap: 6px;
}
.card__recipe {
  margin-top: 9px;
  font-size: 13px;
  color: #c4ccd8;
}
.card__recipe b {
  color: #cfe0c2;
}
.card__recipe-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
}
.card__alt {
  color: var(--amber);
  font-size: 12px;
  margin-top: 4px;
}
.card__users {
  margin-top: 9px;
  font-size: 12px;
  color: var(--muted);
}
.card__users b {
  color: #cbd2dc;
}
.card__demand {
  margin-top: 10px;
  font-size: 12px;
  color: var(--muted);
}
.card__hello {
  line-height: 1.7;
}
.card__hello b {
  color: #cfe0c2;
}
.card__unlock {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.card__unlock b {
  color: var(--avail);
}
.card__pathbtn {
  margin-top: 10px;
}

.hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
.link {
  cursor: pointer;
  text-decoration: underline dotted;
}
.u-mono {
  font-family: var(--font-mono);
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
  margin-right: 4px;
  background: rgba(255, 255, 255, 0.06);
}
.pill--tier {
  background: var(--tc);
  color: var(--dark-ink);
}
.pill--state.is-bred {
  background: rgba(143, 209, 79, 0.18);
  color: var(--leaf);
}
.pill--state.is-avail {
  background: rgba(201, 167, 240, 0.16);
  color: var(--avail);
}
.pill--state.is-none {
  background: rgba(255, 255, 255, 0.06);
  color: var(--muted);
}

.parent.is-ready {
  color: #9fe09a;
}
.parent.is-pending {
  color: #aab2a8;
}
.mark.is-ok :deep(.icon) {
  color: var(--leaf);
}
.mark.is-bad :deep(.icon) {
  color: var(--bad);
}

.path {
  margin-top: 8px;
  border-left: 2px solid var(--edge);
  padding-left: 8px;
}
.path__step {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 12px;
  flex-wrap: wrap;
}
.path__num {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  min-width: 16px;
}
.path__step--is-bred .path__name {
  color: var(--leaf);
}
.path__step--is-avail .path__name {
  color: var(--avail);
}
.path__step--is-locked .path__name {
  color: #cfe0c2;
}

.action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 12.5px;
  padding: 9px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-top: 10px;
}
.action :deep(.icon) {
  width: 15px;
  height: 15px;
  vertical-align: 0;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
.btn--xs :deep(.icon) {
  color: var(--leaf);
}
</style>
