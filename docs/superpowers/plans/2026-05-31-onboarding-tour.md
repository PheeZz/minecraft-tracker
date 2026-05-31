# Онбординг (coachmark-тур + точечные подсказки) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить coachmark-тур (driver.js, лениво) и точечные подсказки (HintSpot) на обе вкладки — деревья и пчёлы; тур умеет зумиться к ноде графа и подсвечивать её.

**Architecture:** Общий движок `useTour` оборачивает driver.js (грузится динамически отдельным чанком). Шаги тура — данные (`TourStep[]`) из доменных файлов `treesTour.ts`/`beesTour.ts`; шаг может иметь async `before()` (зум к ноде / демо-выбор соты), который выполняется до показа через перехват `onNextClick`/`onPrevClick`. Точечные подсказки — отдельный лёгкий компонент `HintSpot.vue` (свой поповер, без затемнения). Якоримся к UI через `data-tour`-атрибуты и DOM-карточки нод node-html-label (`.node[data-id]` у деревьев, `.gnode[data-id]` у пчёл).

**Tech Stack:** Vue 3.5 `<script setup>` + TS strict, Pinia, Vitest, Playwright (chromium+webkit), driver.js 1.4.0. Спека: `docs/superpowers/specs/2026-05-31-onboarding-tour-design.md`.

**Conventions (hard):** persist только через `@/shared/persistence/storage` (localStorage забанен ESLint). НИКОГДА не добавлять `Co-Authored-By` в коммиты. Тесты — `*.test.ts`. На каждый изменённый файл: `npx prettier --write`, `npm run typecheck`, `npx eslint` — чисто. Русские комментарии/строки. driver.js импортировать ТОЛЬКО динамически (ленивый чанк) — никаких top-level `import 'driver.js'`.

---

## File Structure

Create:
- `src/shared/ui/useTour.ts` — движок тура (ленивый driver.js, async before, reduced-motion).
- `src/shared/ui/HintSpot.vue` — точечная подсказка (свой поповер).
- `src/trackers/trees/onboarding/treesTour.ts` — фабрика шагов тура деревьев (+ тест).
- `src/trackers/trees/onboarding/treesTour.test.ts` — юнит на условную сборку шагов.
- `src/trackers/bees/onboarding/beesTour.ts` — фабрика шагов тура пчёл.

Modify:
- `package.json` — `driver.js` в deps (уже установлен).
- `src/trackers/trees/composables/useTreeGraph.ts` — `tourFocus(id): Promise<void>`.
- `src/trackers/trees/components/TreeGraph.vue` — `bestAvailId`, expose `tourBestId`/`tourSpotlight`/`isReady`; `data-tour` на навбаре/легенде.
- `src/trackers/trees/components/TreeSidebar.vue` — `data-tour` на зонах + HintSpot.
- `src/trackers/trees/components/TreesView.vue` — создать тур, авто-старт по готовности графа, кнопка «?» в топбаре.
- `src/trackers/bees/composables/useBeeChainGraph.ts` — `data-id` в шаблоне ноды.
- `src/trackers/bees/components/BeesView.vue` — `data-tour` на зонах, тур, авто-старт, кнопка «?» в модбаре, HintSpot.

---

## Task 1: Зависимость driver.js

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Убедиться, что driver.js установлен (1.4.0)**

Run: `node -e "console.log(require('./node_modules/driver.js/package.json').version)"`
Expected: `1.4.0`. Если нет — `npm install driver.js@^1.4.0`.

- [ ] **Step 2: Проверить, что в package.json появилась запись**

Run: `grep '"driver.js"' package.json`
Expected: строка вида `"driver.js": "^1.4.0",` в `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: добавить driver.js (для онбординг-тура, грузится лениво)"
```

---

## Task 2: Движок тура `useTour`

**Files:**
- Create: `src/shared/ui/useTour.ts`

- [ ] **Step 1: Создать файл**

Create `src/shared/ui/useTour.ts`:

```ts
import { onBeforeUnmount } from 'vue'
import type { Driver } from 'driver.js'

/** Шаг тура. element — селектор или функция (для динамических нод графа). */
export interface TourStep {
  element: string | (() => Element | null | undefined)
  title: string
  text: string
  side?: 'top' | 'right' | 'bottom' | 'left' | 'over'
  /** Действие ДО показа шага (зум к ноде, демо-выбор). Ждём резолва промиса. */
  before?: () => void | Promise<void>
}

export interface TourController {
  /** Лениво грузит driver.js и запускает тур. Повторный вызов во время тура — no-op. */
  start: () => Promise<void>
  destroy: () => void
}

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Обёртка над driver.js. Шаги передаются фабрикой getSteps() (вычисляются на
 * момент start, т.к. зависят от состояния — напр. «лучшая нода»). before() шага
 * выполняется до его показа: переходы перехвачены (onNextClick/onPrevClick), мы
 * ждём before() и затем двигаем driver вручную (moveTo).
 */
export function useTour(
  getSteps: () => TourStep[],
  opts: { onDone?: () => void } = {},
): TourController {
  let drv: Driver | null = null

  async function start(): Promise<void> {
    if (drv?.isActive()) return
    const steps = getSteps()
    if (!steps.length) return

    const { driver } = await import('driver.js')
    await import('driver.js/dist/driver.css')
    const reduce = reducedMotion()

    const driveSteps = steps.map((s) => ({
      element:
        typeof s.element === 'function'
          ? () => (s.element as () => Element | null | undefined)() ?? undefined
          : s.element,
      popover: { title: s.title, description: s.text, side: s.side ?? ('bottom' as const) },
    }))

    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      opts.onDone?.()
    }

    async function advance(dir: 1 | -1): Promise<void> {
      if (!drv) return
      const i = drv.getActiveIndex() ?? 0
      const targetIdx = i + dir
      if (targetIdx < 0) return
      if (targetIdx >= steps.length) {
        drv.destroy()
        return
      }
      const target = steps[targetIdx]
      if (target?.before) {
        try {
          await target.before()
        } catch (e) {
          console.error('[tour before]', e)
        }
      }
      drv.moveTo(targetIdx)
    }

    drv = driver({
      animate: !reduce,
      smoothScroll: !reduce,
      allowClose: true,
      showProgress: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      nextBtnText: 'Далее',
      prevBtnText: 'Назад',
      doneBtnText: 'Готово',
      progressText: '{{current}} из {{total}}',
      steps: driveSteps,
      // переходы контролируем сами (ждём before перед показом шага)
      onNextClick: () => void advance(1),
      onPrevClick: () => void advance(-1),
      onCloseClick: () => drv?.destroy(),
      onDestroyed: finish,
    })

    if (steps[0]?.before) {
      try {
        await steps[0].before()
      } catch (e) {
        console.error('[tour before]', e)
      }
    }
    drv.drive()
  }

  function destroy(): void {
    drv?.destroy()
    drv = null
  }

  onBeforeUnmount(destroy)
  return { start, destroy }
}
```

- [ ] **Step 2: Typecheck + lint + commit**

```bash
npm run typecheck
npx prettier --write src/shared/ui/useTour.ts
npx eslint src/shared/ui/useTour.ts
git add src/shared/ui/useTour.ts
git commit -m "feat(core): useTour — обёртка driver.js с ленивой загрузкой и async-before"
```
Expected typecheck: clean (driver.js поставляет типы). Если ESLint ругается на `void advance(...)` — оставить как есть (намеренный fire-and-forget).

---

## Task 3: Точечная подсказка `HintSpot`

**Files:**
- Create: `src/shared/ui/HintSpot.vue`

- [ ] **Step 1: Создать компонент**

Create `src/shared/ui/HintSpot.vue`:

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

defineProps<{ text: string; title?: string; side?: 'top' | 'bottom' | 'left' | 'right' }>()

const open = ref(false)
const root = ref<HTMLElement>()

function toggle(): void {
  open.value = !open.value
}
function onDocClick(e: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') open.value = false
}
document.addEventListener('click', onDocClick)
document.addEventListener('keydown', onKey)
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <span ref="root" class="hint">
    <button
      type="button"
      class="hint__btn"
      :class="{ on: open }"
      :aria-expanded="open"
      aria-label="Подсказка"
      @click.stop="toggle"
    >
      ?
    </button>
    <span v-if="open" class="hint__pop" :class="`hint__pop--${side ?? 'bottom'}`" role="note">
      <span v-if="title" class="hint__title">{{ title }}</span>
      <span class="hint__text">{{ text }}</span>
    </span>
  </span>
</template>

<style scoped>
.hint {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}
.hint__btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--cardln, #3b3225);
  background: var(--card, #261f16);
  color: var(--muted, #9a8868);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  padding: 0;
}
.hint__btn:hover,
.hint__btn.on {
  border-color: var(--honey-dk, var(--leaf, #e8a72c));
  color: var(--honey-dk, var(--leaf, #e8a72c));
}
.hint__btn:focus-visible {
  outline: 2px solid var(--honey-dk, var(--leaf, #e8a72c));
  outline-offset: 1px;
}
.hint__pop {
  position: absolute;
  z-index: 120;
  width: max-content;
  max-width: 240px;
  background: var(--panel, #15201a);
  border: 1px solid var(--line, rgba(232, 167, 44, 0.3));
  border-radius: 10px;
  padding: 9px 11px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink, #f1e7d4);
  text-align: left;
  white-space: normal;
}
.hint__pop--bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}
.hint__pop--top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}
.hint__pop--right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}
.hint__pop--left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}
.hint__title {
  display: block;
  font-weight: 700;
  margin-bottom: 3px;
}
</style>
```

- [ ] **Step 2: Typecheck + lint + commit**

```bash
npm run typecheck
npx prettier --write src/shared/ui/HintSpot.vue
npx eslint src/shared/ui/HintSpot.vue
git add src/shared/ui/HintSpot.vue
git commit -m "feat(core): HintSpot — точечная подсказка по запросу (лёгкий поповер)"
```

---

## Task 4: Графовые хуки (зум к ноде + data-id у пчёл)

**Files:**
- Modify: `src/trackers/trees/composables/useTreeGraph.ts`
- Modify: `src/trackers/trees/components/TreeGraph.vue`
- Modify: `src/trackers/bees/composables/useBeeChainGraph.ts`

- [ ] **Step 1: `tourFocus(id)` в useTreeGraph**

В `src/trackers/trees/composables/useTreeGraph.ts` найти функцию `focus(id)` (она делает `selectNode` + `highlightLineage` + `cy.animate({center,zoom:COMFORT_ZOOM},{duration:400,...})`). Сразу ПОСЛЕ неё добавить:

```ts
  /** Как focus, но возвращает промис, резолвящийся по завершении пан/зума
     (нужно туру, чтобы подсветить ноду уже на финальной позиции). */
  function tourFocus(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (!cy) return resolve()
      const node = cy.getElementById(id)
      if (node.empty()) return resolve()
      selectNode(id)
      highlightLineage(id, 'ancestors')
      const reduce =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
      cy.animate(
        { center: { eles: node }, zoom: COMFORT_ZOOM },
        { duration: reduce ? 0 : 400, easing: 'ease-in-out-cubic', complete: () => resolve() },
      )
    })
  }
```

Затем добавить `tourFocus` в объект `return { ... }` композабла (рядом с `focus`).

- [ ] **Step 2: Проверить экспорт COMFORT_ZOOM/selectNode/highlightLineage доступны в области (они уже используются в focus — значит да). Typecheck.**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: `bestAvailId` + expose в TreeGraph.vue**

В `src/trackers/trees/components/TreeGraph.vue` найти `function bestStep()`. Отрефакторить расчёт «лучшего» в отдельную функцию и переиспользовать. Заменить:

```ts
function bestStep() {
  const av = availSorted()
  if (!av.length) return
  av.sort(
    (a, b) =>
      unlockScore(store.progress, b.id) - unlockScore(store.progress, a.id) ||
      a.tier - b.tier ||
      a.id.localeCompare(b.id, 'ru'),
  )
  ui.selectedId = av[0]!.id
  graph.focus(av[0]!.id)
}
```

на:

```ts
/** id лучшего доступного дерева (макс. разблокировка) или null. */
function bestAvailId(): string | null {
  const av = availSorted()
  if (!av.length) return null
  av.sort(
    (a, b) =>
      unlockScore(store.progress, b.id) - unlockScore(store.progress, a.id) ||
      a.tier - b.tier ||
      a.id.localeCompare(b.id, 'ru'),
  )
  return av[0]!.id
}
function bestStep() {
  const id = bestAvailId()
  if (!id) return
  ui.selectedId = id
  graph.focus(id)
}
```

Затем найти строку `defineExpose({ focus: ..., flash: ... })` и заменить на:

```ts
defineExpose({
  focus: (id: string) => graph.focus(id),
  flash: (ids: string[]) => graph.flash(ids),
  // для онбординг-тура:
  tourBestId: (): string | null => bestAvailId(),
  tourSpotlight: async (id: string): Promise<void> => {
    ui.selectedId = id
    await graph.tourFocus(id)
  },
  isReady: (): boolean => graphReady.value,
})
```

(`graphReady` — ref, добавленный ранее для лоадера; он уже есть в файле.)

- [ ] **Step 4: `data-tour` на навбаре и легенде деревьев**

В template `TreeGraph.vue` на контейнере навбара добавить атрибут:
`<div class="stage__navbar" data-tour="trees-navbar">`.

- [ ] **Step 5: `data-id` в шаблоне ноды пчёл**

В `src/trackers/bees/composables/useBeeChainGraph.ts` найти `return \`<div class="${cls.join(' ')}" style="--pc:${pc}">...\`` в `beeNodeTemplate` и добавить `data-id`:

```ts
    return `<div class="${cls.join(' ')}" data-id="${d.id}" style="--pc:${pc}">${beeIconHtml(d.id)}<span class="gn">${d.id}</span>${hv}${d.alt ? '<span class="gflag">⇄</span>' : ''}${ci}</div>`
```

- [ ] **Step 6: Typecheck + lint + commit**

```bash
npm run typecheck
npx prettier --write src/trackers/trees/composables/useTreeGraph.ts src/trackers/trees/components/TreeGraph.vue src/trackers/bees/composables/useBeeChainGraph.ts
npx eslint src/trackers/trees/composables/useTreeGraph.ts src/trackers/trees/components/TreeGraph.vue src/trackers/bees/composables/useBeeChainGraph.ts
git add -A
git commit -m "feat(graph): хуки для тура — tourFocus/tourSpotlight/tourBestId (деревья), data-id у нод пчёл"
```

---

## Task 5: Тур деревьев + подсказки + интеграция

**Files:**
- Create: `src/trackers/trees/onboarding/treesTour.ts`
- Create: `src/trackers/trees/onboarding/treesTour.test.ts`
- Modify: `src/trackers/trees/components/TreeSidebar.vue`
- Modify: `src/trackers/trees/components/TreesView.vue`

- [ ] **Step 1: Тест фабрики шагов (условный шаг «лучшая нода»)**

Create `src/trackers/trees/onboarding/treesTour.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildTreesTour } from './treesTour'

const graphStub = {
  tourBestId: () => null as string | null,
  tourSpotlight: async () => {},
}

describe('buildTreesTour', () => {
  it('без доступной ноды шаг «лучший выбор» пропускается', () => {
    const steps = buildTreesTour({ ...graphStub, tourBestId: () => null })
    expect(steps.some((s) => s.title.includes('Лучший'))).toBe(false)
  })
  it('с доступной нодой шаг «лучший выбор» присутствует', () => {
    const steps = buildTreesTour({ ...graphStub, tourBestId: () => 'Дуб' })
    expect(steps.some((s) => s.title.includes('Лучший'))).toBe(true)
  })
  it('все шаги имеют element/title/text', () => {
    const steps = buildTreesTour({ ...graphStub, tourBestId: () => 'Дуб' })
    for (const s of steps) {
      expect(s.element).toBeTruthy()
      expect(s.title.length).toBeGreaterThan(0)
      expect(s.text.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Запустить тест — упадёт (нет модуля)**

Run: `npx vitest run src/trackers/trees/onboarding/treesTour.test.ts`
Expected: FAIL — `Failed to resolve import './treesTour'`.

- [ ] **Step 3: Создать `treesTour.ts`**

Create `src/trackers/trees/onboarding/treesTour.ts`:

```ts
import type { TourStep } from '@/shared/ui/useTour'

/** Минимальный контракт графа деревьев, нужный туру. */
export interface TreesTourGraph {
  tourBestId: () => string | null
  tourSpotlight: (id: string) => Promise<void>
}

/** Шаги тура деревьев. Шаг «лучший выбор» включается, только если есть доступная нода. */
export function buildTreesTour(graph: TreesTourGraph): TourStep[] {
  const steps: TourStep[] = [
    {
      element: '[data-tour="trees-sidebar"]',
      title: 'Боковая панель',
      text: 'Поиск дерева, фильтры по тирам, раскладки графа и инструменты — всё здесь.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-search"]',
      title: 'Поиск',
      text: 'Введи название дерева или плода — граф подсветит и сфокусируется на нём.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-tiers"]',
      title: 'Фильтр тиров',
      text: 'Скрывай и показывай тиры, чтобы граф не был перегружен.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-layout"]',
      title: 'Раскладка',
      text: 'Меняй раскладку графа: по тирам, ELK или dagre.',
      side: 'left',
    },
    {
      element: '[data-tour="trees-navbar"]',
      title: 'Навигация по графу',
      text: 'Следующее доступное дерево, лучший шаг, вписать граф, показать все рёбра.',
      side: 'bottom',
    },
  ]

  const bestId = graph.tourBestId()
  if (bestId) {
    steps.push({
      element: () => document.querySelector(`.node[data-id="${cssEscape(bestId)}"]`),
      title: 'Лучший следующий выбор',
      text: 'Вот дерево, которое сейчас выгоднее всего вывести — оно открывает больше всего дальше. Клик по ноде в графе подсвечивает родословную.',
      side: 'top',
      before: () => graph.tourSpotlight(bestId),
    })
  }

  steps.push({
    element: '[data-tour="trees-legend"]',
    title: 'Легенда',
    text: 'Что значат цвета рамок, бейджи и обводки нод.',
    side: 'top',
  })

  return steps
}

/** Экранирование для использования id в CSS-селекторе (кириллица безопасна, но кавычки/спецсимволы — нет). */
function cssEscape(s: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&')
}
```

- [ ] **Step 4: Запустить тест — пройдёт**

Run: `npx vitest run src/trackers/trees/onboarding/treesTour.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: `data-tour` + HintSpot в TreeSidebar.vue**

В `src/trackers/trees/components/TreeSidebar.vue`:
- На корне `<aside class="sidebar">` добавить `data-tour="trees-sidebar"`.
- На `<div class="search">` добавить `data-tour="trees-search"`.
- На `<TierFilter />` — проброс атрибута: `<TierFilter data-tour="trees-tiers" />` (упадёт на корень TierFilter). Если vue-tsc/консоль предупредит о fall-through (мульти-рутовый компонент) — тогда обернуть в обычный `<div data-tour="trees-tiers"><TierFilter /></div>` (sidebar — вертикальный поток, обычный div безопасен; `display:contents` НЕ использовать — у него нет бокса для подсветки).
- На `<select v-model="ui.layout" class="select">` добавить `data-tour="trees-layout"`.
- На легенду (элемент с `class="legend"`) добавить `data-tour="trees-legend"`.
- Импортировать HintSpot: в `<script setup>` добавить `import HintSpot from '@/shared/ui/HintSpot.vue'`.
- Рядом с заголовком «Планирование» (`<h2 class="sidebar__title">Планирование</h2>`) добавить подсказку: заменить на
  `<h2 class="sidebar__title">Планирование <HintSpot text="«Только доступные» прячет ещё не открытые деревья. «Только цепочки к плодам» оставляет ветки, ведущие к плодам." /></h2>`.
- Рядом с заголовком «Инструменты» — `<h2 class="sidebar__title">Инструменты <HintSpot text="Отмена/повтор действий, выбор раскладки, экспорт/импорт прогресса в JSON." /></h2>`.

- [ ] **Step 6: Интеграция тура в TreesView.vue**

В `src/trackers/trees/components/TreesView.vue`:

(a) В `<script setup>` добавить импорты:
```ts
import { storage } from '@/shared/persistence/storage'
import { useTour } from '@/shared/ui/useTour'
import { buildTreesTour } from '../onboarding/treesTour'
import { watch } from 'vue'
```
(`ref`, `onMounted` уже импортированы; `watch` добавить к существующему импорту из 'vue', не дублировать строку).

(b) После `const graphRef = ref<InstanceType<typeof TreeGraph>>()` добавить:
```ts
const tour = useTour(
  () =>
    buildTreesTour({
      tourBestId: () => graphRef.value?.tourBestId() ?? null,
      tourSpotlight: (id) => graphRef.value?.tourSpotlight(id) ?? Promise.resolve(),
    }),
  { onDone: () => storage.set('onboard.trees', true) },
)

// авто-старт один раз, когда граф готов (ноды отрисованы → можно якориться)
let autoStarted = false
watch(
  () => graphRef.value?.isReady?.(),
  (ready) => {
    if (ready && !autoStarted && !storage.get('onboard.trees', false)) {
      autoStarted = true
      void tour.start()
    }
  },
  { immediate: true },
)
```

(c) В template, в `<header class="topbar">`, ПОСЛЕ `<HeroStats />` добавить кнопку запуска:
```html
<button class="topbar__tour" type="button" title="Запустить обзор" @click="tour.start()">
  ? Обзор
</button>
```
И в `<style scoped>` добавить:
```css
.topbar__tour {
  margin-left: auto;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink2, #cdbb98);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 7px 12px;
  cursor: pointer;
  white-space: nowrap;
}
.topbar__tour:hover {
  border-color: var(--leaf, var(--honey-dk));
  color: var(--leaf, var(--honey-dk));
}
```

- [ ] **Step 7: Typecheck + lint + tests + commit**

```bash
npm run typecheck
npm run test
npx prettier --write src/trackers/trees/onboarding/treesTour.ts src/trackers/trees/onboarding/treesTour.test.ts src/trackers/trees/components/TreeSidebar.vue src/trackers/trees/components/TreesView.vue
npx eslint src/trackers/trees/
git add -A
git commit -m "feat(trees): coachmark-тур + точечные подсказки (авто-старт, кнопка «Обзор», зум к лучшей ноде)"
```
Expected: typecheck clean, все тесты зелёные (включая 3 новых treesTour).

---

## Task 6: Тур пчёл + подсказки + интеграция

**Files:**
- Create: `src/trackers/bees/onboarding/beesTour.ts`
- Modify: `src/trackers/bees/components/BeesView.vue`

- [ ] **Step 1: Создать `beesTour.ts`**

Create `src/trackers/bees/onboarding/beesTour.ts`:

```ts
import type { TourStep } from '@/shared/ui/useTour'

/** Демо-сота: тяжелее тривиальной, цепочка чистая (см. спеку). */
export const SAMPLE_COMB = 'Древние соты'

/** Минимальный контракт стора, нужный туру пчёл. */
export interface BeesTourStore {
  selectComb: (name: string) => void
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Шаги тура пчёл. Перед графовыми шагами демонстрационно выбираем соту, чтобы
   появились граф и план; ждём, пока BeeChainGraph смонтируется и построится. */
export function buildBeesTour(store: BeesTourStore): TourStep[] {
  return [
    {
      element: '[data-tour="bees-modebar"]',
      title: 'Режимы',
      text: 'Три режима: Граф (цепочка выведения), Инвентарь (склад пчёл) и Задачи (что нужно для крафта).',
      side: 'bottom',
    },
    {
      element: '[data-tour="bees-rail"]',
      title: 'Выбор цели',
      text: 'Слева выбираешь соту или пчелу. Переключатель Соты/Пчёлы и поиск — здесь же.',
      side: 'right',
    },
    {
      element: '[data-tour="bees-graph"]',
      title: 'Дерево скрещивания',
      text: 'По центру — дерево «что с чем скрестить», чтобы получить выбранную цель.',
      side: 'top',
      // демо-выбор соты + ждём построения графа
      before: async () => {
        store.selectComb(SAMPLE_COMB)
        await delay(650)
      },
    },
    {
      element: '[data-tour="bees-panel"]',
      title: 'Пошаговый план',
      text: 'Справа — пошаговый план: кого с кем скрестить, шансы, альтернативные рецепты.',
      side: 'left',
    },
    {
      element: '[data-tour="bees-tasks"]',
      title: 'Задачи по сотам',
      text: 'Заводи задачи под крафт: какие соты нужны, а приложение покажет прогресс и подскажет, кого вывести.',
      side: 'bottom',
    },
  ]
}
```

- [ ] **Step 2: `data-tour` якоря + интеграция в BeesView.vue**

В `src/trackers/bees/components/BeesView.vue`:

(a) В `<script setup>` добавить импорты:
```ts
import { storage } from '@/shared/persistence/storage'
import { useTour } from '@/shared/ui/useTour'
import HintSpot from '@/shared/ui/HintSpot.vue'
import { buildBeesTour } from '../onboarding/beesTour'
import { onMounted, watch } from 'vue'
```
(`computed`, `ref` уже есть; `onMounted`/`watch` добавить, не дублируя).

(b) После `const store = useBeesStore()` добавить:
```ts
const tour = useTour(() => buildBeesTour({ selectComb: (n) => store.selectComb(n) }), {
  onDone: () => storage.set('onboard.bees', true),
})
onMounted(() => {
  if (!storage.get('onboard.bees', false)) {
    // даём модбару/рейлу отрисоваться; граф появится по демо-выбору внутри тура
    setTimeout(() => void tour.start(), 500)
  }
})
```

(c) `data-tour` атрибуты:
- На `<div class="modebar">` → `data-tour="bees-modebar"`.
- На кнопке «Задачи» (`<button ... class="modebar__tasks" ...>`) → `data-tour="bees-tasks"`.
- На `<BeeRail />` — НЕ оборачивать (обёртка сломала бы grid `.bees`, а `display:contents` не имеет бокса для подсветки). Использовать **проброс атрибута**: `<BeeRail data-tour="bees-rail" />`. У BeeRail один корень `<nav class="rail">` и `inheritAttrs` по умолчанию → атрибут упадёт на `.rail` (реальный бокс). Аналогично `<BeePanel data-tour="bees-panel" />` (корень `<aside class="panel">`).
- На граф: `<BeeChainGraph ... class="cy" />` условный (`v-if="store.curTarget"`) — до демо-выбора его нет. Поэтому якорь `data-tour="bees-graph"` вешаем на **постоянный** контейнер центра `<div class="stage">` (есть всегда в граф-режиме). Шаг «bees-graph» идёт ПОСЛЕ `before()`, который выбирает соту и ждёт построения графа — к моменту показа граф уже внутри `.stage`.

(d) HintSpot у переключателя режимов: внутри `.modebar`, рядом с кнопкой «Задачи», добавить
`<HintSpot text="Инвентарь — отмечаешь выведенных пчёл (склад). Задачи — список крафтов с нужными сотами и прогрессом." side="bottom" />`.

- [ ] **Step 3: Typecheck + lint + commit**

```bash
npm run typecheck
npx prettier --write src/trackers/bees/onboarding/beesTour.ts src/trackers/bees/components/BeesView.vue
npx eslint src/trackers/bees/
git add -A
git commit -m "feat(bees): coachmark-тур + подсказка (авто-старт, кнопка, демо-выбор соты «Древние соты»)"
```

---

## Task 7: E2E (Playwright, оба движка) + полная проверка

**Files:**
- Create (временный): `/tmp/test-onboarding.mjs`

- [ ] **Step 1: Запустить dev-сервер**

```bash
(npm run dev > /tmp/vite-onb.log 2>&1 &) && sleep 4 && cat /tmp/vite-onb.log
```
Запомнить порт (5173/5174) → `BASE` ниже.

- [ ] **Step 2: Написать e2e-скрипт**

Create `/tmp/test-onboarding.mjs` (выставить `BASE` на нужный порт):

```js
import { chromium, webkit } from '/Users/pheezz/Code/own/minecraft-tracker/node_modules/playwright/index.mjs'
const BASE = 'http://localhost:5173/'

async function run(engine, name) {
  const browser = await engine.launch()
  const ctx = await browser.newContext({ viewport: { width: 1320, height: 860 } })
  const page = await ctx.newPage()
  const errors = []
  const driverReqs = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push('PE: ' + e.message))
  page.on('request', (r) => r.url().includes('driver') && driverReqs.push(r.url().split('/').pop()))

  // первый заход (чистый storage) → деревья по умолчанию
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const r = { name }
  // тур деревьев авто-стартует (driver popover появляется); ждём
  await page.waitForSelector('.driver-popover', { timeout: 12000 }).catch(() => {})
  r.treesAutoStarted = await page.locator('.driver-popover').count()
  r.driverLazyLoaded = driverReqs.length > 0 // чанк driver подгрузился только сейчас
  // прокликать «Далее» до конца (макс 10), на каждом шаге — есть подсветка
  let guard = 0
  while ((await page.locator('.driver-popover .driver-popover-next-btn').count()) && guard++ < 10) {
    const last = await page.locator('.driver-popover-next-btn').first().innerText()
    await page.locator('.driver-popover-next-btn').first().click()
    await page.waitForTimeout(700)
    if (/Готово/i.test(last)) break
  }
  await page.waitForTimeout(300)
  r.treesFlagSet = await page.evaluate(() => localStorage.getItem('onboard.trees'))
  r.popoverClosed = await page.locator('.driver-popover').count() // 0

  // перезагрузка → тур НЕ стартует сам
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  r.treesNoAutoOnReturn = await page.locator('.driver-popover').count() // 0
  // кнопка «Обзор» перезапускает
  await page.locator('.topbar__tour').click()
  await page.waitForTimeout(800)
  r.treesReopened = await page.locator('.driver-popover').count() // 1
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // вкладка пчёл → тур пчёл авто-стартует (storage пуст для bees)
  await page.locator('.switcher__btn', { hasText: /Пчёл|Пчел/i }).first().click()
  await page.waitForTimeout(1200)
  r.beesAutoStarted = await page.locator('.driver-popover').count()
  // проходим до демо-графа: жмём «Далее» 2-3 раза
  for (let i = 0; i < 3; i++) {
    const n = page.locator('.driver-popover-next-btn').first()
    if (await n.count()) {
      await n.click()
      await page.waitForTimeout(900)
    }
  }
  r.beesDemoSelected = await page.evaluate(() => !!document.querySelector('.cy')) // граф появился
  r.errors = errors
  await browser.close()
  return r
}

console.log(JSON.stringify(await run(chromium, 'chromium'), null, 1))
console.log(JSON.stringify(await run(webkit, 'webkit'), null, 1))
```

- [ ] **Step 3: Запустить e2e**

Run: `node /tmp/test-onboarding.mjs`
Expected (оба движка): `treesAutoStarted: 1`, `driverLazyLoaded: true`, `treesFlagSet: "true"`, `popoverClosed: 0`, `treesNoAutoOnReturn: 0`, `treesReopened: 1`, `beesAutoStarted: 1`, `beesDemoSelected: true`, `errors: []`. Если что-то не так — починить и перезапустить.

- [ ] **Step 4: Проверка HintSpot вручную в e2e (добавить в скрипт при необходимости) или визуально**

Открыть деревья, кликнуть `.hint__btn` у «Планирование» → появляется `.hint__pop`; Escape/клик-вне закрывают. (Можно добавить ассерты в скрипт аналогично.)

- [ ] **Step 5: Полная проверка + сборка (ленивость driver-чанка)**

```bash
npm run test
npm run typecheck
npx eslint src/
pkill -f vite
BASE_PATH=/ npm run build 2>&1 | grep -E "driver|TreesView|BeesView" | tail
```
Expected: все тесты зелёные; typecheck/eslint чисто; в сборке `driver` — ОТДЕЛЬНЫЙ чанк (а не в index/TreesView), что подтверждает ленивость.

- [ ] **Step 6: Commit (если правились файлы на шаге 3)**

```bash
git add -A
git commit -m "test(onboarding): e2e тура и подсказок (chromium+webkit), фикс по результатам"   # только если есть изменения
```

---

## Self-Review (выполнено автором)

- **Покрытие спеки:** движок driver.js лениво (Task 2), HintSpot свой поповер (Task 3), зум+подсветка ноды через tourSpotlight/tourFocus + `.node[data-id]` (Tasks 4–5), data-id у пчёл (Task 4), туры обоих доменов с контентом (Tasks 5–6), демо-сота «Древние соты» (Task 6), персист `onboard.trees/bees` + авто-старт один раз + кнопка «?» (Tasks 5–6), пропуск шага «лучший выбор» при отсутствии ноды (Task 5 + тест), reduced-motion (Task 2 useTour + tourFocus), e2e оба движка + ленивость чанка (Task 7). Якоримся через `data-tour` (спека это требовала).
- **Плейсхолдеры:** код полный во всех шагах; команды с ожидаемым выводом. Деталь «`display: contents` на обёртках компонентов» — чтобы не ломать grid `.bees`/`.workspace`.
- **Согласованность типов:** `TourStep` (element/title/text/side/before) одинаков в useTour и обоих tour-файлах; `buildTreesTour(graph: {tourBestId, tourSpotlight})` ↔ expose в TreeGraph; `buildBeesTour(store: {selectComb})` ↔ `store.selectComb`. `isReady()` экспонирован в TreeGraph и читается в TreesView watch. `tourFocus` добавлен в useTreeGraph и вызывается из TreeGraph.tourSpotlight.
- **Отклонение от спеки:** `whenIdle()` из спеки реализован как `tourFocus(id): Promise<void>` (промис резолвится по завершении анимации) — то же по сути. Якорь графа пчёл повешен на постоянный `.stage` (`data-tour="bees-graph"`), а не на условный `<BeeChainGraph>`, для стабильности.
