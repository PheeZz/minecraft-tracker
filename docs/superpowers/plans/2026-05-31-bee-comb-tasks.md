# Задачи по сотам (Bee comb-requirement tasks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user create "tasks" (target items) that require several comb types, and auto-track progress against their bee inventory, suggesting the easiest bee to breed for each missing comb.

**Architecture:** Pure domain helpers derive each comb's status (`have`/`ready`/`todo`) from the existing `producersOf` ranking + the `have` set; the Pinia store gains task CRUD + a `view` state (graph/inventory) + a tasks-modal flag; a large modal (`BeeTasksModal`) renders task cards with create/edit-in-place and a "в граф" jump that opens the breeding tree of the suggested bee. Persistence via the `storage` wrapper, no migrations.

**Tech Stack:** Vue 3.5 `<script setup>` + TS strict, Pinia setup store, Vitest (unit), Playwright (chromium+webkit e2e). Spec: `docs/superpowers/specs/2026-05-31-bee-comb-tasks-design.md`.

**Conventions (hard):** localStorage is banned — persist only via `import { storage } from '@/shared/persistence/storage'`. No `Co-Authored-By` lines in commits. Test files use `.test.ts` (NOT `.spec.ts` — the spec's `tasks.spec.ts` name is overridden to follow the repo convention). Run `npx prettier --write` on touched files, `npm run typecheck`, `npx eslint <files>` — all must be clean. Russian comments/UI strings.

---

## File Structure

Create:
- `src/trackers/bees/domain/tasks.ts` — `BeeTask` type, `combStatus`, `taskProgress` (pure).
- `src/trackers/bees/domain/tasks.test.ts` — unit tests for the above.
- `src/trackers/bees/components/BeeTasksModal.vue` — modal shell + task list + empty state.
- `src/trackers/bees/components/BeeTaskCard.vue` — one task card (progress + comb rows).
- `src/trackers/bees/components/BeeTaskEditor.vue` — inline create/edit form (name + comb picker).

Modify:
- `src/trackers/bees/stores/useBeesStore.ts` — replace `inventoryOpen`/`toggleInventory` with `view`/`setView`; add `tasksOpen` + `openTasks`/`closeTasks`/`toggleTasks`; add `tasks` + `addTask`/`updateTask`/`removeTask`/`toggleTaskCollapsed`; expose `producersOf` (already exposed).
- `src/trackers/bees/stores/useBeesStore.test.ts` — add task CRUD tests.
- `src/trackers/bees/components/BeesView.vue` — top mode-switch bar; swap by `view`; mount `BeeTasksModal`.
- `src/trackers/bees/components/BeeRail.vue` — remove the `invbar` "инвентарь" button.

---

## Task 1: Domain — `BeeTask`, `combStatus`, `taskProgress`

**Files:**
- Create: `src/trackers/bees/domain/tasks.ts`
- Test: `src/trackers/bees/domain/tasks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/trackers/bees/domain/tasks.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { combStatus, taskProgress, type CombProducerRanked } from './tasks'

// Фикстуры основаны на реальных данных:
// «Медовые соты» делают Обычная(depth0,35%), Развитая(depth1,40%), Хитрая(depth3).
const honeyProducers: CombProducerRanked[] = [
  { bee: 'Обычная', pct: 35, depth: 0 },
  { bee: 'Развитая', pct: 40, depth: 1 },
  { bee: 'Хитрая', pct: 40, depth: 3 },
]

describe('combStatus', () => {
  it('have: есть пчела-производитель на складе (берёт с макс. шансом)', () => {
    const s = combStatus('Медовые соты', honeyProducers, new Set(['Развитая']))
    expect(s).toEqual({ comb: 'Медовые соты', state: 'have', bee: 'Развитая', depth: 0 })
  })
  it('ready: производителя нет, но проще всего вывести с depth 0', () => {
    const s = combStatus('Медовые соты', honeyProducers, new Set())
    expect(s).toEqual({ comb: 'Медовые соты', state: 'ready', bee: 'Обычная', depth: 0 })
  })
  it('todo: проще всего вывести с depth > 0', () => {
    const diamond: CombProducerRanked[] = [{ bee: 'Алмазная', pct: 1, depth: 7 }]
    const s = combStatus('Алмазные соты', diamond, new Set())
    expect(s).toEqual({ comb: 'Алмазные соты', state: 'todo', bee: 'Алмазная', depth: 7 })
  })
  it('нет производителей → todo, bee=null', () => {
    const s = combStatus('Фантом соты', [], new Set())
    expect(s).toEqual({ comb: 'Фантом соты', state: 'todo', bee: null, depth: 0 })
  })
  it('сортирует defensively (вход в произвольном порядке)', () => {
    const shuffled: CombProducerRanked[] = [
      { bee: 'Хитрая', pct: 40, depth: 3 },
      { bee: 'Обычная', pct: 35, depth: 0 },
    ]
    expect(combStatus('Медовые соты', shuffled, new Set()).bee).toBe('Обычная')
  })
})

describe('taskProgress', () => {
  it('считает done = число have, ready при полном покрытии', () => {
    const statuses = [
      { comb: 'a', state: 'have' as const, bee: 'x', depth: 0 },
      { comb: 'b', state: 'ready' as const, bee: 'y', depth: 0 },
    ]
    expect(taskProgress(statuses)).toEqual({ done: 1, total: 2, ready: false })
  })
  it('ready=true только когда все соты have и их >0', () => {
    expect(taskProgress([{ comb: 'a', state: 'have', bee: 'x', depth: 0 }])).toEqual({
      done: 1,
      total: 1,
      ready: true,
    })
    expect(taskProgress([])).toEqual({ done: 0, total: 0, ready: false })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/trackers/bees/domain/tasks.test.ts`
Expected: FAIL — `Failed to resolve import './tasks'` / `combStatus is not a function`.

- [ ] **Step 3: Write the implementation**

Create `src/trackers/bees/domain/tasks.ts`:

```ts
/**
 * Доменные помощники «задач по сотам». Чистые функции — без Pinia/Vue, чтобы
 * легко тестировались. Связь задача → сота → пчела строится поверх producersOf
 * (ранжированных производителей соты) и склада have. См. спецификацию
 * docs/superpowers/specs/2026-05-31-bee-comb-tasks-design.md.
 */

/** Задача: цель-предмет, требующая набор сот. Хранится в сторе/storage. */
export interface BeeTask {
  /** crypto.randomUUID() */
  id: string
  /** Имя предмета/цели, задаёт игрок. */
  name: string
  /** Имена требуемых сот (ключи COMBS), без дублей. */
  combs: string[]
  /** Свёрнута ли карточка (готовые удобно сворачивать). */
  collapsed?: boolean
}

/** Производитель соты с посчитанной глубиной (структурно = RankedProducer стора). */
export interface CombProducerRanked {
  bee: string
  pct: number
  depth: number
}

/** Состояние требуемой соты: есть / можно вывести сейчас / нужно вывести (N шагов). */
export type CombState = 'have' | 'ready' | 'todo'

export interface CombStatus {
  comb: string
  state: CombState
  /** Пчела, что закрывает (have) или подсказана к выведению; null — нет производителей. */
  bee: string | null
  /** Шагов выведения подсказанной пчелы (0 для have/ready). */
  depth: number
}

/**
 * Статус соты при текущем складе:
 *  - есть владелец-производитель → have (берём с наибольшим шансом среди имеющихся);
 *  - иначе самый лёгкий производитель (depth↑, затем шанс↓): depth 0 → ready, иначе todo;
 *  - нет производителей → todo, bee=null.
 */
export function combStatus(
  comb: string,
  producers: readonly CombProducerRanked[],
  have: ReadonlySet<string>,
): CombStatus {
  if (!producers.length) return { comb, state: 'todo', bee: null, depth: 0 }
  const owned = producers
    .filter((p) => have.has(p.bee))
    .sort((a, b) => b.pct - a.pct)[0]
  if (owned) return { comb, state: 'have', bee: owned.bee, depth: 0 }
  const easiest = [...producers].sort((a, b) => a.depth - b.depth || b.pct - a.pct)[0]!
  return { comb, state: easiest.depth === 0 ? 'ready' : 'todo', bee: easiest.bee, depth: easiest.depth }
}

export interface TaskProgress {
  done: number
  total: number
  ready: boolean
}

/** Прогресс задачи: done = число сот в состоянии have; ready при полном покрытии (>0). */
export function taskProgress(statuses: readonly CombStatus[]): TaskProgress {
  const total = statuses.length
  const done = statuses.filter((s) => s.state === 'have').length
  return { done, total, ready: total > 0 && done === total }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/trackers/bees/domain/tasks.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Lint + commit**

```bash
npx prettier --write src/trackers/bees/domain/tasks.ts src/trackers/bees/domain/tasks.test.ts
npx eslint src/trackers/bees/domain/tasks.ts src/trackers/bees/domain/tasks.test.ts
git add src/trackers/bees/domain/tasks.ts src/trackers/bees/domain/tasks.test.ts
git commit -m "feat(bees): доменные помощники задач по сотам (combStatus, taskProgress)"
```

---

## Task 2: Store — navigation state + task CRUD

**Files:**
- Modify: `src/trackers/bees/stores/useBeesStore.ts`
- Test: `src/trackers/bees/stores/useBeesStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/trackers/bees/stores/useBeesStore.test.ts` (inside the file, new `describe` blocks). First check the file's existing setup (it already uses `setActivePinia(createPinia())` in a `beforeEach` — reuse that; if unsure, open the file and match its pattern). Add:

```ts
describe('навигация view/tasksOpen', () => {
  it('view по умолчанию graph, setView переключает', () => {
    const s = useBeesStore()
    expect(s.view).toBe('graph')
    s.setView('inventory')
    expect(s.view).toBe('inventory')
  })
  it('tasksOpen независим, open/close/toggle', () => {
    const s = useBeesStore()
    expect(s.tasksOpen).toBe(false)
    s.openTasks()
    expect(s.tasksOpen).toBe(true)
    s.closeTasks()
    expect(s.tasksOpen).toBe(false)
    s.toggleTasks()
    expect(s.tasksOpen).toBe(true)
  })
})

describe('CRUD задач', () => {
  it('addTask создаёт задачу с id и дедупом сот', () => {
    const s = useBeesStore()
    s.addTask('Предмет №1', ['Медовые соты', 'Медовые соты', 'Фруктовые соты'])
    expect(s.tasks).toHaveLength(1)
    expect(s.tasks[0]!.name).toBe('Предмет №1')
    expect(s.tasks[0]!.combs).toEqual(['Медовые соты', 'Фруктовые соты'])
    expect(typeof s.tasks[0]!.id).toBe('string')
    expect(s.tasks[0]!.id.length).toBeGreaterThan(0)
  })
  it('updateTask меняет name/combs (с дедупом)', () => {
    const s = useBeesStore()
    s.addTask('A', ['Медовые соты'])
    const id = s.tasks[0]!.id
    s.updateTask(id, { name: 'B', combs: ['Фруктовые соты', 'Фруктовые соты'] })
    expect(s.tasks[0]!.name).toBe('B')
    expect(s.tasks[0]!.combs).toEqual(['Фруктовые соты'])
  })
  it('removeTask удаляет', () => {
    const s = useBeesStore()
    s.addTask('A', ['Медовые соты'])
    s.removeTask(s.tasks[0]!.id)
    expect(s.tasks).toHaveLength(0)
  })
  it('toggleTaskCollapsed переключает флаг', () => {
    const s = useBeesStore()
    s.addTask('A', ['Медовые соты'])
    const id = s.tasks[0]!.id
    s.toggleTaskCollapsed(id)
    expect(s.tasks[0]!.collapsed).toBe(true)
    s.toggleTaskCollapsed(id)
    expect(s.tasks[0]!.collapsed).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/trackers/bees/stores/useBeesStore.test.ts`
Expected: FAIL — `s.view is undefined` / `s.addTask is not a function`.

- [ ] **Step 3: Implement store changes**

In `src/trackers/bees/stores/useBeesStore.ts`:

(a) Add imports at top (next to existing imports):

```ts
import type { BeeTask } from '../domain/tasks'
```

(b) Add a key constant next to `INV_PREFS_KEY`:

```ts
const TASKS_KEY = 'bees.tasks'
```

(c) Replace the `inventoryOpen` ref + its comment:

```ts
  /** Открыт ли раздел инвентаря (замещает канвас-цепочку). */
  const inventoryOpen = ref(false)
```

with:

```ts
  /** Текущий основной экран области пчёл. */
  const view = ref<'graph' | 'inventory'>('graph')
  /** Открыта ли модалка задач (независима от view, рисуется поверх). */
  const tasksOpen = ref(false)
  /** Список задач игрока (цель-предмет → требуемые соты). */
  const tasks = ref<BeeTask[]>(storage.get<BeeTask[]>(TASKS_KEY, []))
```

(d) Replace `toggleInventory`:

```ts
  function toggleInventory(): void {
    inventoryOpen.value = !inventoryOpen.value
  }
```

with:

```ts
  function setView(v: 'graph' | 'inventory'): void {
    view.value = v
  }
  function openTasks(): void {
    tasksOpen.value = true
  }
  function closeTasks(): void {
    tasksOpen.value = false
  }
  function toggleTasks(): void {
    tasksOpen.value = !tasksOpen.value
  }

  function persistTasks(): void {
    storage.set(TASKS_KEY, tasks.value)
  }
  function dedupe(combs: string[]): string[] {
    return [...new Set(combs)]
  }
  function addTask(name: string, combs: string[]): void {
    tasks.value = [...tasks.value, { id: crypto.randomUUID(), name, combs: dedupe(combs) }]
    persistTasks()
  }
  function updateTask(id: string, patch: { name?: string; combs?: string[] }): void {
    tasks.value = tasks.value.map((t) =>
      t.id === id
        ? { ...t, ...(patch.name != null ? { name: patch.name } : {}), ...(patch.combs ? { combs: dedupe(patch.combs) } : {}) }
        : t,
    )
    persistTasks()
  }
  function removeTask(id: string): void {
    tasks.value = tasks.value.filter((t) => t.id !== id)
    persistTasks()
  }
  function toggleTaskCollapsed(id: string): void {
    tasks.value = tasks.value.map((t) => (t.id === id ? { ...t, collapsed: !t.collapsed } : t))
    persistTasks()
  }
```

(e) In the `return { ... }` object: remove `inventoryOpen` and `toggleInventory`; add `view`, `tasksOpen`, `tasks`, `setView`, `openTasks`, `closeTasks`, `toggleTasks`, `addTask`, `updateTask`, `removeTask`, `toggleTaskCollapsed`. (`producersOf` is already returned.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/trackers/bees/stores/useBeesStore.test.ts`
Expected: PASS (existing tests + 6 new).

- [ ] **Step 5: Typecheck (catches remaining `inventoryOpen` users — fixed in Task 3/4)**

Run: `npm run typecheck`
Expected: errors ONLY in `BeesView.vue`/`BeeRail.vue` referencing `inventoryOpen`/`toggleInventory`. These are fixed in Tasks 3–4. (If you want a clean commit now, proceed to Step 6; the typecheck will be green after Task 4.)

- [ ] **Step 6: Lint + commit**

```bash
npx prettier --write src/trackers/bees/stores/useBeesStore.ts src/trackers/bees/stores/useBeesStore.test.ts
npx eslint src/trackers/bees/stores/useBeesStore.ts src/trackers/bees/stores/useBeesStore.test.ts
git add src/trackers/bees/stores/useBeesStore.ts src/trackers/bees/stores/useBeesStore.test.ts
git commit -m "feat(bees): состояние view/tasksOpen и CRUD задач в сторе"
```

---

## Task 3: BeeRail — remove the hidden "инвентарь" button

**Files:**
- Modify: `src/trackers/bees/components/BeeRail.vue`

- [ ] **Step 1: Remove the inventory button from the invbar**

In the template, the `invbar` block currently is:

```html
    <div class="invbar">
      <span
        >в наличии <span class="cnt">{{ store.haveCount }}</span></span
      >
      <button :class="{ on: store.inventoryOpen }" type="button" @click="store.toggleInventory()">
        инвентарь
      </button>
      <button :class="{ on: store.invOnly }" type="button" @click="store.invOnly = !store.invOnly">
        только мои
      </button>
      <button type="button" @click="clearHave">сбросить</button>
    </div>
```

Replace it with (drop only the "инвентарь" button — the top bar in Task 4 owns navigation now):

```html
    <div class="invbar">
      <span
        >в наличии <span class="cnt">{{ store.haveCount }}</span></span
      >
      <button :class="{ on: store.invOnly }" type="button" @click="store.invOnly = !store.invOnly">
        только мои
      </button>
      <button type="button" @click="clearHave">сбросить</button>
    </div>
```

- [ ] **Step 2: Lint + commit**

```bash
npx prettier --write src/trackers/bees/components/BeeRail.vue
npx eslint src/trackers/bees/components/BeeRail.vue
git add src/trackers/bees/components/BeeRail.vue
git commit -m "refactor(bees): убрать спрятанную кнопку инвентаря из рейла"
```

---

## Task 4: BeesView — top mode-switch bar + view swap

**Files:**
- Modify: `src/trackers/bees/components/BeesView.vue`

Context: currently the root is a `<Transition name="inv" mode="out-in">` swapping `<BeeInventory>` (when `inventoryOpen`) vs the `.bees` 3-column layout. We replace `inventoryOpen` with `view`, add a persistent top bar, and (in Task 6) mount the tasks modal.

- [ ] **Step 1: Update the script imports**

Ensure `BeeInventory` import stays. Add (will be used in Task 5/6): no new import yet for the modal — added in Task 6. Add a computed for the unclosed-tasks badge AFTER Task 5 domain wiring; for now add the badge computed referencing the store + domain:

In `<script setup>` of `BeesView.vue`, add near the other imports:

```ts
import { combStatus, taskProgress } from '../domain/tasks'
```

and add a computed (after `recipeCount`):

```ts
// Бейдж на кнопке «Задачи»: число незакрытых задач (done < total).
const openTaskCount = computed(
  () =>
    store.tasks.filter((t) => {
      const st = t.combs.map((c) => combStatus(c, store.producersOf(c), store.have))
      return !taskProgress(st).ready
    }).length,
)
```

- [ ] **Step 2: Restructure the template — add the top bar and swap by `view`**

Replace the entire `<template>` root. The new structure: a `.beeswrap` flex column with the top bar, then the view content. Replace:

```html
<template>
  <!-- Инвентарь ... -->
  <Transition name="inv" mode="out-in">
    <BeeInventory v-if="store.inventoryOpen" key="inv" class="bees-inv" />
    <div v-else key="layout" class="bees">
      <BeeRail />
      ...
      <BeePanel />
    </div>
  </Transition>
</template>
```

with:

```html
<template>
  <div class="beeswrap">
    <!-- Полоса-переключатель режимов: видна всегда, чинит спрятанную кнопку инвентаря. -->
    <div class="modebar">
      <div class="modebar__seg" role="group" aria-label="Режим">
        <button
          type="button"
          :aria-pressed="store.view === 'graph'"
          :class="{ on: store.view === 'graph' }"
          @click="store.setView('graph')"
        >
          🌿 Граф
        </button>
        <button
          type="button"
          :aria-pressed="store.view === 'inventory'"
          :class="{ on: store.view === 'inventory' }"
          @click="store.setView('inventory')"
        >
          📦 Инвентарь
        </button>
      </div>
      <button type="button" class="modebar__tasks" @click="store.openTasks()">
        ✅ Задачи
        <span v-if="openTaskCount" class="modebar__badge">{{ openTaskCount }}</span>
      </button>
    </div>

    <Transition name="inv" mode="out-in">
      <BeeInventory v-if="store.view === 'inventory'" key="inv" class="bees-inv" />
      <div v-else key="layout" class="bees">
        <BeeRail />

        <div class="stage">
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
                ><i style="background: var(--card); border: 1.5px solid var(--src-f)" />вывести</span
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

        <BeePanel />
      </div>
    </Transition>
  </div>
</template>
```

- [ ] **Step 3: Update styles — wrap layout, style the bar, make `.bees`/`.bees-inv` fill remaining height**

In `<style scoped>`, add the wrapper + bar styles and adjust the existing `.bees`/`.bees-inv` so they fill the area below the bar. Add at the top of the style block:

```css
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
```

Then change the existing `.bees` and `.bees-inv` rules to fill the remaining flex space (they previously were `height: 100%`):

```css
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
```

(Leave all other existing styles — `.stage`, `.stagewrap`, `.crumb`, `.cy`, `.welcome`, `.legend`, etc. — unchanged.)

- [ ] **Step 4: Typecheck + verify dev render**

Run: `npm run typecheck`
Expected: PASS (no more `inventoryOpen` references anywhere).

Then start the dev server and confirm the bar renders and switches:
```bash
npm run dev   # note the port (5173/5174)
```
Manually (or skip to Task 7's Playwright): clicking 🌿 Граф / 📦 Инвентарь swaps content; ✅ Задачи currently does nothing visible (modal added in Task 6).

- [ ] **Step 5: Lint + commit**

```bash
npx prettier --write src/trackers/bees/components/BeesView.vue
npx eslint src/trackers/bees/components/BeesView.vue
git add src/trackers/bees/components/BeesView.vue
git commit -m "feat(bees): полоса-переключатель Граф/Инвентарь + кнопка Задачи"
```

---

## Task 5: BeeTaskEditor — inline create/edit form

**Files:**
- Create: `src/trackers/bees/components/BeeTaskEditor.vue`

This is a presentational form: props `initial` (optional task to edit), emits `save({name, combs})` and `cancel`. It does NOT touch the store (the parent does). Comb picker = searchable checkbox list over `COMB_NAMES`.

- [ ] **Step 1: Create the component**

Create `src/trackers/bees/components/BeeTaskEditor.vue`:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { COMB_NAMES, shortComb } from '../domain/combs'
import type { BeeTask } from '../domain/tasks'
import CombIcon from './CombIcon.vue'

const props = defineProps<{ initial?: BeeTask }>()
const emit = defineEmits<{
  save: [payload: { name: string; combs: string[] }]
  cancel: []
}>()

const name = ref(props.initial?.name ?? '')
const picked = ref<Set<string>>(new Set(props.initial?.combs ?? []))
const query = ref('')

const q = computed(() => query.value.trim().toLowerCase())
const rows = computed(() => COMB_NAMES.filter((n) => !q.value || n.toLowerCase().includes(q.value)))
const canSave = computed(() => name.value.trim().length > 0 && picked.value.size > 0)

function toggle(comb: string): void {
  const next = new Set(picked.value)
  if (next.has(comb)) next.delete(comb)
  else next.add(comb)
  picked.value = next
}
function submit(): void {
  if (!canSave.value) return
  emit('save', { name: name.value.trim(), combs: [...picked.value] })
}
</script>

<template>
  <form class="editor" @submit.prevent="submit">
    <input
      v-model="name"
      class="editor__name"
      type="text"
      placeholder="Название задачи (например, Предмет №1)"
      aria-label="Название задачи"
    />

    <label class="editor__search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input v-model="query" type="text" placeholder="найти соту…" />
    </label>

    <div class="editor__combs">
      <button
        v-for="comb in rows"
        :key="comb"
        type="button"
        class="combchip"
        :class="{ on: picked.has(comb) }"
        :aria-pressed="picked.has(comb)"
        @click="toggle(comb)"
      >
        <CombIcon :name="comb" />
        {{ shortComb(comb) }}
      </button>
    </div>

    <div class="editor__actions">
      <span class="editor__count">выбрано: {{ picked.size }}</span>
      <button type="button" class="editor__cancel" @click="emit('cancel')">Отмена</button>
      <button type="submit" class="editor__save" :disabled="!canSave">Сохранить</button>
    </div>
  </form>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--honey-dk);
  border-radius: 12px;
  background: var(--bg2);
}
.editor__name {
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 9px 12px;
  outline: none;
}
.editor__name:focus {
  border-color: var(--honey-dk);
}
.editor__search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 9px;
  padding: 0 10px;
}
.editor__search input {
  flex: 1;
  font: inherit;
  font-size: 13px;
  background: none;
  border: 0;
  padding: 8px 0;
  color: var(--ink);
  outline: none;
}
.editor__search svg {
  width: 15px;
  height: 15px;
  color: var(--honey-dk);
}
.editor__combs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  max-height: 220px;
  overflow: auto;
  padding: 2px;
}
.combchip {
  display: inline-flex;
  align-items: center;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink2);
  background: var(--card);
  border: 1px solid var(--cardln);
  border-radius: 8px;
  padding: 5px 9px;
  cursor: pointer;
  transition: 0.12s;
}
.combchip:hover {
  border-color: var(--honey-dk);
}
.combchip.on {
  background: var(--src-f-soft);
  border-color: var(--src-f);
  color: var(--ink);
}
.editor__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.editor__count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-right: auto;
}
.editor__cancel,
.editor__save {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  border-radius: 9px;
  padding: 8px 14px;
  cursor: pointer;
  border: 1px solid var(--cardln);
}
.editor__cancel {
  background: none;
  color: var(--ink2);
}
.editor__save {
  background: var(--solid);
  color: var(--solid-ink);
  border-color: var(--solid);
}
.editor__save:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
```

- [ ] **Step 2: Typecheck + lint + commit**

```bash
npm run typecheck
npx prettier --write src/trackers/bees/components/BeeTaskEditor.vue
npx eslint src/trackers/bees/components/BeeTaskEditor.vue
git add src/trackers/bees/components/BeeTaskEditor.vue
git commit -m "feat(bees): инлайн-форма создания/редактирования задачи"
```

---

## Task 6: BeeTaskCard + BeeTasksModal — render, CRUD wiring, "в граф"

**Files:**
- Create: `src/trackers/bees/components/BeeTaskCard.vue`
- Create: `src/trackers/bees/components/BeeTasksModal.vue`
- Modify: `src/trackers/bees/components/BeesView.vue` (mount the modal)

- [ ] **Step 1: Create BeeTaskCard.vue**

Displays one task: header (name + progress + edit/delete), progress bar, comb status rows with "в граф" jump. Props `task`; emits `edit`, `remove`, `toggle`, `jump(bee)`. Status derivation uses the store (it needs `producersOf`/`have`).

Create `src/trackers/bees/components/BeeTaskCard.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useBeesStore } from '../stores/useBeesStore'
import { combStatus, taskProgress, type BeeTask, type CombStatus } from '../domain/tasks'
import CombIcon from './CombIcon.vue'

const props = defineProps<{ task: BeeTask }>()
const emit = defineEmits<{
  edit: []
  remove: []
  toggle: []
  jump: [bee: string]
}>()

const store = useBeesStore()

const statuses = computed<CombStatus[]>(() =>
  props.task.combs.map((c) => combStatus(c, store.producersOf(c), store.have)),
)
const progress = computed(() => taskProgress(statuses.value))
const pct = computed(() =>
  progress.value.total ? Math.round((progress.value.done / progress.value.total) * 100) : 0,
)

const LABEL: Record<CombStatus['state'], string> = {
  have: 'есть',
  ready: 'готова',
  todo: 'нужно вывести',
}
</script>

<template>
  <div class="tcard" :class="{ done: progress.ready }">
    <div class="tcard__head">
      <button
        type="button"
        class="tcard__title"
        :aria-expanded="!task.collapsed"
        @click="emit('toggle')"
      >
        <span class="tcard__chev" :class="{ open: !task.collapsed }">▸</span>
        {{ task.name }}
        <span v-if="progress.ready" class="tcard__done">✅ готово</span>
      </button>
      <span class="tcard__count">{{ progress.done }} / {{ progress.total }}</span>
      <button type="button" class="tcard__icon" title="Изменить" @click="emit('edit')">✎</button>
      <button type="button" class="tcard__icon" title="Удалить" @click="emit('remove')">🗑</button>
    </div>

    <div class="tcard__bar" aria-hidden="true">
      <span class="tcard__bar-fill" :style="{ width: pct + '%' }" />
    </div>

    <ul v-if="!task.collapsed" class="tcard__combs">
      <li v-for="s in statuses" :key="s.comb" class="combrow" :class="`is-${s.state}`">
        <CombIcon :name="s.comb" />
        <span class="combrow__name">{{ s.comb }}</span>
        <span class="combrow__state">
          {{ LABEL[s.state] }}<template v-if="s.bee">
            — {{ s.state === 'todo' ? `${s.bee}, ${s.depth} шаг.` : s.bee }}</template
          ><template v-else> (нет известного производителя)</template>
        </span>
        <button
          v-if="s.state !== 'have' && s.bee"
          type="button"
          class="combrow__jump"
          @click="emit('jump', s.bee)"
        >
          в граф ▸
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tcard {
  border: 1px solid var(--cardln);
  border-radius: 12px;
  background: var(--card);
  padding: 12px 14px;
}
.tcard.done {
  border-color: var(--src-f);
  background: var(--src-f-soft);
}
.tcard__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tcard__title {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font: inherit;
  font-weight: 700;
  font-size: 15px;
  color: var(--ink);
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
  padding: 0;
}
.tcard__chev {
  font-size: 11px;
  color: var(--muted);
  transition: transform 0.18s ease;
}
.tcard__chev.open {
  transform: rotate(90deg);
}
.tcard__done {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--src-f);
}
.tcard__count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
}
.tcard__icon {
  font: inherit;
  font-size: 13px;
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--muted);
  padding: 4px;
}
.tcard__icon:hover {
  color: var(--honey-dk);
}
.tcard__bar {
  position: relative;
  height: 5px;
  border-radius: 3px;
  background: var(--bg2);
  overflow: hidden;
  margin: 8px 0;
}
.tcard__bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: var(--honey);
  transition: width 0.25s ease;
}
.tcard.done .tcard__bar-fill {
  background: var(--src-f);
}
.tcard__combs {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.combrow {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}
.combrow__name {
  font-weight: 600;
  color: var(--ink);
}
.combrow__state {
  color: var(--muted);
  font-size: 12px;
}
.combrow.is-have .combrow__state {
  color: var(--src-f);
}
.combrow.is-ready .combrow__state {
  color: var(--amber);
}
.combrow__jump {
  margin-left: auto;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  color: var(--honey-dk);
  background: none;
  border: 1px solid var(--cardln);
  border-radius: 7px;
  padding: 3px 8px;
  cursor: pointer;
}
.combrow__jump:hover {
  border-color: var(--honey-dk);
}
</style>
```

- [ ] **Step 2: Create BeeTasksModal.vue**

Modal shell (backdrop, dialog, Esc/backdrop close) + list of cards + inline editor for create/edit + empty state. Owns the store wiring.

Create `src/trackers/bees/components/BeeTasksModal.vue`:

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useBeesStore } from '../stores/useBeesStore'
import type { BeeTask } from '../domain/tasks'
import BeeTaskCard from './BeeTaskCard.vue'
import BeeTaskEditor from './BeeTaskEditor.vue'

const store = useBeesStore()

// null = форма закрыта; 'new' = создание; иначе редактируем задачу с этим id.
const editing = ref<'new' | string | null>(null)
const editingTask = ref<BeeTask | undefined>(undefined)

function startNew(): void {
  editingTask.value = undefined
  editing.value = 'new'
}
function startEdit(task: BeeTask): void {
  editingTask.value = task
  editing.value = task.id
}
function onSave(payload: { name: string; combs: string[] }): void {
  if (editing.value === 'new') store.addTask(payload.name, payload.combs)
  else if (editing.value) store.updateTask(editing.value, payload)
  editing.value = null
  editingTask.value = undefined
}
function onCancel(): void {
  editing.value = null
  editingTask.value = undefined
}
function jumpToGraph(bee: string): void {
  store.closeTasks()
  store.setView('graph')
  store.selectBee(bee)
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') store.closeTasks()
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="modal" @click.self="store.closeTasks()">
    <div class="modal__win" role="dialog" aria-modal="true" aria-labelledby="tasks-title">
      <header class="modal__head">
        <h2 id="tasks-title" class="modal__title">Задачи</h2>
        <button type="button" class="modal__close" title="Закрыть" @click="store.closeTasks()">
          ✕
        </button>
      </header>

      <div class="modal__body">
        <BeeTaskEditor
          v-if="editing === 'new'"
          :initial="undefined"
          @save="onSave"
          @cancel="onCancel"
        />
        <button v-else type="button" class="modal__new" @click="startNew">➕ Новая задача</button>

        <div v-if="!store.tasks.length && editing !== 'new'" class="modal__empty">
          Пока нет задач — создай первую.
        </div>

        <template v-for="task in store.tasks" :key="task.id">
          <BeeTaskEditor
            v-if="editing === task.id"
            :initial="editingTask"
            @save="onSave"
            @cancel="onCancel"
          />
          <BeeTaskCard
            v-else
            :task="task"
            @edit="startEdit(task)"
            @remove="store.removeTask(task.id)"
            @toggle="store.toggleTaskCollapsed(task.id)"
            @jump="jumpToGraph"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 24px;
  animation: modalFade 0.18s ease;
}
@keyframes modalFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.modal__win {
  width: min(900px, 100%);
  max-height: min(600px, 90vh);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid var(--cardln);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  animation: modalPop 0.18s ease;
}
@keyframes modalPop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.modal__head {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}
.modal__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  margin: 0;
}
.modal__close {
  margin-left: auto;
  font: inherit;
  font-size: 15px;
  background: var(--card);
  border: 1px solid var(--cardln);
  color: var(--ink2);
  width: 32px;
  height: 32px;
  border-radius: 9px;
  cursor: pointer;
}
.modal__close:hover {
  border-color: var(--honey-dk);
}
.modal__body {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal__new {
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  color: var(--honey-dk);
  background: var(--card);
  border: 1px dashed var(--cardln);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}
.modal__new:hover {
  border-color: var(--honey-dk);
}
.modal__empty {
  color: var(--dim);
  font-style: italic;
  padding: 30px;
  text-align: center;
}
</style>
```

- [ ] **Step 3: Mount the modal in BeesView**

In `src/trackers/bees/components/BeesView.vue`:

(a) Add the import next to the other component imports:

```ts
import BeeTasksModal from './BeeTasksModal.vue'
```

(b) Inside `.beeswrap`, after the closing `</Transition>` and before `</div>` (the `.beeswrap` close), add a teleported/overlay modal:

```html
    <BeeTasksModal v-if="store.tasksOpen" />
```

So the end of the template reads:

```html
    </Transition>

    <BeeTasksModal v-if="store.tasksOpen" />
  </div>
</template>
```

- [ ] **Step 4: Typecheck + lint + commit**

```bash
npm run typecheck
npx prettier --write src/trackers/bees/components/BeeTaskCard.vue src/trackers/bees/components/BeeTasksModal.vue src/trackers/bees/components/BeesView.vue
npx eslint src/trackers/bees/components/BeeTaskCard.vue src/trackers/bees/components/BeeTasksModal.vue src/trackers/bees/components/BeesView.vue
git add src/trackers/bees/components/BeeTaskCard.vue src/trackers/bees/components/BeeTasksModal.vue src/trackers/bees/components/BeesView.vue
git commit -m "feat(bees): модалка задач — карточки, CRUD, переход в граф"
```

---

## Task 7: End-to-end verification (Playwright, both engines) + full suite

**Files:**
- Create (temporary): `/tmp/test-bee-tasks.mjs`

- [ ] **Step 1: Start the dev server**

```bash
(npm run dev > /tmp/vite-tasks.log 2>&1 &) && sleep 4 && cat /tmp/vite-tasks.log
```
Note the port (5173 or 5174). Use it as `BASE` below.

- [ ] **Step 2: Write the e2e script**

Create `/tmp/test-bee-tasks.mjs` (set `BASE` to the dev port):

```js
import { chromium, webkit } from '/Users/pheezz/Code/own/minecraft-tracker/node_modules/playwright/index.mjs'
const BASE = 'http://localhost:5174/'

async function run(engine, name) {
  const browser = await engine.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  await page.goto(BASE, { waitUntil: 'networkidle' })

  const beesTab = page.locator('.switcher__btn', { hasText: /Пчёл|Пчел/i }).first()
  if (await beesTab.count()) { await beesTab.click().catch(() => {}); await page.waitForTimeout(400) }

  const r = { name }
  // open tasks modal
  await page.locator('.modebar__tasks').click()
  await page.waitForTimeout(300)
  r.modalOpen = await page.locator('.modal__win').count()
  r.emptyState = await page.locator('.modal__empty').count()

  // create a task with 2 combs
  await page.locator('.modal__new').click()
  await page.locator('.editor__name').fill('Тестовый предмет')
  // pick first two comb chips
  await page.locator('.combchip').nth(0).click()
  await page.locator('.combchip').nth(1).click()
  await page.locator('.editor__save').click()
  await page.waitForTimeout(300)
  r.cards = await page.locator('.tcard').count()
  r.combRows = await page.locator('.tcard .combrow').count()
  r.countText = (await page.locator('.tcard__count').first().innerText()).trim()

  // jump to graph from a non-have comb (if present)
  const jump = page.locator('.combrow__jump').first()
  if (await jump.count()) {
    await jump.click()
    await page.waitForTimeout(400)
    r.modalClosedAfterJump = await page.locator('.modal__win').count() // 0
    r.graphActive = await page.locator('.modebar__seg button.on', { hasText: 'Граф' }).count() // 1
  }

  // reopen, delete the task
  await page.locator('.modebar__tasks').click()
  await page.waitForTimeout(200)
  await page.locator('.tcard__icon', { hasText: '🗑' }).first().click()
  await page.waitForTimeout(200)
  r.cardsAfterDelete = await page.locator('.tcard').count()

  // Esc closes
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  r.modalClosedByEsc = await page.locator('.modal__win').count() // 0

  r.errors = errors
  await browser.close()
  return r
}

console.log(JSON.stringify(await run(chromium, 'chromium'), null, 1))
console.log(JSON.stringify(await run(webkit, 'webkit'), null, 1))
```

- [ ] **Step 3: Run the e2e script**

Run: `node /tmp/test-bee-tasks.mjs`
Expected (both engines): `modalOpen:1`, `emptyState:1`, `cards:1`, `combRows:2`, `countText` like `"0 / 2"` or `"1 / 2"`, `modalClosedAfterJump:0`, `graphActive:1`, `cardsAfterDelete:0`, `modalClosedByEsc:0`, `errors:[]`.

If any assertion is off, fix the component and re-run before committing.

- [ ] **Step 4: Run the full unit suite + checks**

```bash
npm run test
npm run typecheck
npx eslint src/trackers/bees/
```
Expected: all unit tests pass (87 existing + new task tests), typecheck clean, eslint clean.

- [ ] **Step 5: Stop dev server + final commit (if any fixes were made in Step 3)**

```bash
pkill -f vite
git add -A
git commit -m "test(bees): e2e-проверка задач по сотам (chromium+webkit)"   # only if there are changes
```

---

## Self-Review Notes (author check — done)

- **Spec coverage:** data model (Task 1), `combStatus` 3 states + no-producer (Task 1), `taskProgress` (Task 1), store `view`/`tasksOpen`/CRUD + persistence (Task 2), remove hidden inventory button (Task 3), top mode bar + badge (Task 4), inline editor with comb picker + dedupe + ≥1-comb guard (Tasks 2/5), task cards with statuses + collapse + edit/delete (Task 6), "в граф" jump = close+setView+selectBee (Task 6), modal a11y/Esc/backdrop (Task 6), empty state (Task 6), e2e both engines (Task 7). All covered.
- **Filename deviation:** spec said `tasks.spec.ts`; plan uses `tasks.test.ts` to match the repo's `*.test.ts` convention (intentional).
- **Type consistency:** `combStatus(comb, producers, have)`, `taskProgress(statuses)`, `BeeTask {id,name,combs,collapsed?}`, store `addTask(name,combs)`/`updateTask(id,{name?,combs?})`/`removeTask(id)`/`toggleTaskCollapsed(id)`, `setView('graph'|'inventory')`, `openTasks/closeTasks/toggleTasks`, `selectBee(bee)` (existing) — names match across Tasks 1–7.
- **No placeholders:** every code step has full code; commands have expected output.
