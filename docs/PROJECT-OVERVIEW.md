# Катализатор бесконечности — обзор проекта

Справочный документ: архитектура, стек, конвенции, визуальный стиль и анимации.
Vue 3 + TypeScript SPA — трекер прогресса селекции модов **Forestry** (Minecraft).
Два независимых трекера: **«Деревья»** и **«Пчёлы»**. Деплой на GitHub Pages.

> Живой документ. Сгенерирован из аудита кодовой базы 2026-06-06; при крупных изменениях актуализировать.

---

## 1. Стек и инструменты

**Runtime:** Vue ^3.5.13 (`<script setup>`, Composition API) · Vue Router ^4.4.5 · Pinia ^2.2.6 ·
Cytoscape ^3.33.4 (+ `cytoscape-dagre`, `cytoscape-node-html-label`, `dagre`) · `driver.js` ^1.4 (онбординг, ленивый) · `canvas-confetti` ^1.9 (только trees).

**Сборка/дев:** Vite ^6 + `@vitejs/plugin-vue` ^5 · TypeScript ~5.6 · `vue-tsc` ^2 · Vitest ^3 + jsdom + `@vue/test-utils` · ESLint ^9 (flat config) + vue/ts/prettier · Prettier ^3 · Playwright ^1.60 (скриншоты/бренд). Node 22 (CI), `"type":"module"`.

**TS-строгость** (`tsconfig.app.json` extends `@vue/tsconfig/tsconfig.dom.json`): `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `resolveJsonModule`, `composite`. Алиас `@/*` → `src/*`. Project references (`app` + `node` + `vitest`).

**Vite:** `base` = `BASE_PATH` env ?? (`build`→`/minecraft-tracker/`, dev→`/`). `manualChunks` выносит cytoscape в отдельный vendor-чанк. Vitest встроен: `environment: jsdom`, `include: src/**/*.{test,spec}.ts`.

---

## 2. Структура каталогов

```
src/
  main.ts                  bootstrap: createApp, pinia, router, errorHandler, импорт CSS-тем
  App.vue                  оболочка: nav-переключатель, RouterView+KeepAlive, ErrorBoundary,
                           View Transitions, aria-live region
  router/index.ts          роуты из реестра, ленивая загрузка View, редиректы, titleFor
  reset.css, style.css     сброс + токен-контракт и глобальные правила
  __meta__/                тест мета-тегов index.html
  assets/icons/*.svg       29 SVG-иконок (грузятся как ?raw)
  shared/                  кросс-трекерный код (единственное, что общее)
    registry/trackers.ts   реестр TRACKER_MODULES (id/title/kicker/mark/path/view)
    persistence/           storage.ts (обёртка Web Storage), importExport.ts
    types.ts, icons/icons.ts, cytoscape/registerExtensions.ts, textures/index.ts
    composables/useOnboardingSeen.ts
    ui/                    AppLoader, ErrorBoundary, IconBase, HintSpot, SupportLink,
                           confetti, escapeHtml, useAnnouncer, useFocusTrap, useTour, tour.css
  trackers/
    trees/  data · domain · stores · graph · components · composables · onboarding · theme.css
    bees/   data · domain · stores · graph · components · composables · onboarding · theme.css
scripts/                   gen-bees, gen-tree-icons, gen-fruit-icons, copy-assets, gen-brand-assets, screenshot
bees/, trees/              SOURCE-OF-TRUTH ассеты/мокапы (в git), вход генераторов
.github/workflows/deploy.yml · eslint.config.js
```

---

## 3. Архитектурные принципы

**Независимость трекеров.** Каждый трекер — самодостаточный модуль `src/trackers/<id>/` с одинаковой внутренней структурой. Трекеры не импортируют друг друга; общее — только через `src/shared/`. YAGNI-границы соблюдаются (напр. празднования — фича только trees, не обобщается).

**Трёхслойность внутри трекера:**
- **domain/** — чистые функции и типы, без Pinia/Vue/DOM, легко тестируемы (trees: `graph.ts`, `plan.ts`, `migrate.ts`; bees: `graph.ts`, `combs.ts`, `tasks.ts`, `colors.ts`).
- **stores/** — Pinia (setup-стиль): реактивное состояние + персист + история, оркеструют domain.
- **components/** — презентация (`<script setup lang="ts">`), читают сторы, вызывают actions.
- **graph/ + composables/use*Graph** — императивный Cytoscape-слой; **источник правды живёт в сторе**, граф синхронизируется через `applyStates()`.

**Реестр трекеров** (`shared/registry/trackers.ts`): `TRACKER_MODULES as const satisfies readonly TrackerModule[]` — единый источник для nav, роутов, заголовков, прогрева чанков. `TrackerId` выводится из массива; module augmentation для `RouteMeta.tracker`.

**Ленивая загрузка View:** `view: () => import('…View.vue')` в реестре; router оборачивает в `defineAsyncComponent` (AppLoader, `delay:150`); App.vue прогревает оба чанка в `requestIdleCallback`.

---

## 4. Маршрутизация

`createWebHistory(BASE_URL)`. Роуты строятся из реестра: `/trees`, `/bees` (`meta.tracker`). `/` → редирект на последний активный (`storage.get('app.tracker')`, валидируется, фолбэк `trees`). `*` → `/`. `router.afterEach` ставит `document.title = titleFor(meta.tracker)`. Бренд: **«Катализатор бесконечности»**; заголовок «‹Название› Forestry — схемы скрещивания · ‹Бренд›».

---

## 5. Состояние (Pinia, setup-сторы)

**Trees (3):** `useTreesStore` (`progress` 0|2, `inventory` sap/pol, undo/redo `HISTORY_LIMIT=200`, `breed` списывает 1 sap+1 pol, `hero` computed) · `useTreesUiStore` (фильтры/раскладка, `searchQuery` не персистится, `visibleTiers` Set) · `useTreesCelebration` (milestones fruits/saplings, `seen` навсегда).

**Bees (2):** `useBeesStore` (`have: Set<string>`, `rc` выбор рецепта + `rcVersion`, `tasks`, `depthOf` computed, `producersOf`, CRUD задач, `sanitizeHave/Tasks`, `uid()` с фолбэками) · `useBeesUiStore` (`mode` comb/bee, `view` graph/inventory, настройки инвентаря одним ключом `bees.invPrefs`). Без undo/redo.

---

## 6. Персистентность

Обёртка `storage.ts` (`KeyValueStorage`: get/set/remove/clear; localStorage с молчаливым проглатыванием ошибок, фолбэк memory). **Прямой доступ к Web Storage запрещён ESLint** (`app/no-direct-web-storage`; исключение — сам `storage.ts`).

Ключи: `app.tracker` · `trees.progress` `trees.inventory` `trees.ui` `trees.celebrate.seen` · `bees.have` `bees.tasks` `bees.invPrefs` · `onboard.<trackerId>`.

Import/Export: `downloadJson`, `parseJsonFileText` (без исключений, `ParseResult`), `safeKeys()` (анти prototype-pollution). Trees-импорт версионируется (`TREES_SCHEMA_VERSION=3`, отсекает будущее, пропускает legacy). Bees-экспорт `{v:1, exported, have, tasks}`.

---

## 7. Конвейер данных и ассетов

**Source-of-truth в git:** каталоги `bees/` и `trees/` (мокапы `*.js`/`*.png`, каноны рецептов `trees/recipes_output/`, иконки).

**Генераторы** (`scripts/`, вывод в `src/trackers/*/data/`, **коммитятся** как `*.data.ts` с шапкой «АВТОГЕНЕРАЦИЯ … не редактировать»): `gen:bees` → `bees.data.ts`/`beeColors.ts`/`combColors.ts`; `gen:tree-icons`; `gen:fruit-icons`; `gen:brand`. `trees.data.ts` пишется вручную. Все идемпотентны (prettier.format).

**copy-assets** (`gen:assets`, хук `prebuild`): копирует PNG из `bees/`+`trees/` в `public/` (рантайм грузит по `BASE_URL`). Копии в `public/bees|trees/*` — в `.gitignore` (генерируемы). Также игнорируются `dist`, `docs/superpowers/`, `.superpowers/`, `.playwright-mcp/`, `screenshots/`.

---

## 8. Граф (Cytoscape)

`registerExtensions.ts` — идемпотентная регистрация dagre + node-html-label (`CoreWithHtmlLabel`). HTML-метки нод в обоих трекерах (canvas-иконки вставляются строками; `escapeHtml` — defense-in-depth).

**Trees** (`useTreeGraph.ts` — большой оркестратор): кастомная раскладка `tiers` + dagre; `applyStates(progress)` (batch); подсветка родословной + «marching ants» рёбер (rAF, уважает reduced-motion); точечная перекраска иконок (`dirtyIcons` + flush после пересоздания меток); фильтры/поиск/intro.

**Bees** (`useBeeChainGraph.ts`, `subgraph.ts`): `buildSubgraph(target, have, rc)` — подграф выведения по выбранным рецептам (пары → ромб-рецепт с шансом → потомок), имеющиеся не раскрываются, обрезка по `REAL`. Зависит от reactive `rc`.

> Для будущего трекера генетики: **новый граф не нужен** — связываться с существующим графом скрещивания пчёл (добыча видов-носителей). См. спеку генетики.

---

## 9. Тестирование (Vitest, jsdom, 24 файла, ~165 тестов)

Domain-тесты (чистые функции) · **integrity-тесты** (сверка данных с каноном мода: `verify:trees` 132/132 рецептов; `verify:bees` ссылки/соты/глубина, `KNOWN_MISSING_PARENTS`) · store-тесты · router/meta · shared/ui · **a11y-тесты** графов (WCAG 1.1.1/2.1.1/4.1.2) · onboarding.

---

## 10. Сборка и деплой

`prebuild`(copy-assets) → `build`(`vue-tsc -b && vite build`). Деплой `deploy.yml` (GitHub Pages): триггер — пуш семвер-тега `vX.Y.Z` (+ `workflow_dispatch`). Job build: **проверка, что тег принадлежит `main`** (`git merge-base --is-ancestor`) → `npm ci` → `lint:check` → `test` → `build` → SPA-fallback `404.html` → upload. Job deploy: `deploy-pages@v4`.

---

## 11. Конвенции кода

- Только `<script setup lang="ts">`, Pinia setup-сторы.
- Именование: `use<Name>Store`/`use<Name>UiStore`, `use<Name>` (композаблы), `<Tracker>View.vue`, `*.data.ts`, domain — глаголы (`isAvailable`, `combStatus`).
- Полный strict + `noUncheckedIndexedAccess` → обилие `?.`/`!`/`??`; `as const satisfies` для реестров; дискриминированные юнионы; `Readonly`/`ReadonlySet`.
- **Самодокументирующий код** (память проекта): комментарии только для неочевидного.
- Инкапсуляция: Web Storage только через обёртку (ESLint); SVG-иконки только через реестр `ICONS`/`IconBase` (без inline-SVG); `provide/inject` для actions.
- **A11y сквозная:** live-region singleton, focus-trap, текст-альтернативы графов, reduced-motion, skip-link.
- **Локализация:** весь UI и комментарии — русский; данные модов в RU-именах (`id` = русское имя).

---

# Визуальный стайлгайд

Тема переключается атрибутом `data-tracker` на `<html>` (из App.vue). Обе темы — **тёмные** (`color-scheme: dark`).
Порядок CSS: `reset.css` → `style.css` (токен-контракт + глобальное) → per-tracker `theme.css` (значения токенов) → per-tracker `graph.css` (scoped `[data-tracker='…']`) → scoped-стили компонентов.

## 12. Дизайн-токены (CSS custom properties)

### Тема «Пчёлы» — `[data-tracker='bees']`
- Фоны: `--bg:#1b1711` · `--bg2:#14110c` · `--card:#261f16` · `--cardln:#3b3225` · `--panel:rgba(22,18,12,.62)` · `--line:rgba(232,167,44,.15)` · `--scroll-thumb:#4a3f2c`
- Текст: `--ink:#f1e7d4` · `--ink2:#cdbb98` · `--muted:#9a8868` · `--dim:#a89968`
- Акценты: `--honey:#e8a72c` · `--honey-dk:#f0b54a` (`--accent`) · `--amber:#f4c452` · `--rust:#e0813c` · `--alt:#b79bf0` · `--solid:#e8a72c` + `--solid-ink:#1a1510`
- Источники (Forestry/ExtraBees/MagicBees): `--src-f:#44b87a` · `--src-e:#d8743a` · `--src-m:#9b7ad6` (+ `*-soft` rgba-варианты)
- Шрифты: display `Unbounded`, body `Manrope`, mono `JetBrains Mono`
- Фон body: радиальные honey/rust свечения + `linear-gradient(160deg,var(--bg),var(--bg2))`

### Тема «Деревья» — `[data-tracker='trees']`
- Фоны: `--bg:#0c1410` · `--bg2:#0f1a14` · `--inset:#0e1712` · `--panel:rgba(22,33,26,.72)` · `--edge:#2c4334` · `--line:rgba(143,209,79,.14)`
- Текст: `--ink:#e8f0e6` · `--muted:#8aa394` · `--dark-ink:#06120b`
- Акценты: `--leaf:#8fd14f` (`--accent`) · `--leaf-dim:#5d8a3a` · `--amber:#e6b864` · `--sap:#bcd9f5` · `--avail:#c9a7f0` · `--ok:#7fd99a` · `--bad:#e07a7a`
- Тиры `--t0…--t10` (на ноде как `--tc`): `#5bbf63 #e7d24a #4f8fd1 #ef8a2a #a786e0 #3fae6a #5285d6 #3fc7c0 #e36f9b #e05050 #9a3030`
- Шрифты: display/body `Golos Text`, mono `Noto Sans Mono`
- Фон body: радиальные leaf/blue свечения + `linear-gradient(160deg,var(--bg),var(--bg2))`

Многие shared-компоненты пишутся тема-агностично через фолбэки: `var(--honey, var(--leaf))`.

## 13. Типографика
Шрифты — Google Fonts в `index.html` (preconnect, `display=swap`). Базовый body `14px/1.5`, antialiased, `optimizeLegibility`. Заголовки: display-шрифт, вес 800, 17–23px. Кикеры/лейблы: mono, uppercase, большой letter-spacing (0.16–0.26em). Mono пронизывает все счётчики/бейджи/лейблы (HUD-вид).

## 14. Геометрия
Радиусы: пилюли `999px`; модалки/крупное `14–18`; карточки `12–13`; кнопки/инпуты `8–10`; чипы `5–8`. Карточка инвентаря: `min-height 58`, grid `repeat(auto-fill,minmax(212px,1fr))`, gap 10. Бордеры: hairline `1px var(--line)`, карточки `1px var(--cardln)`, акцент `1.5px`, alt-рецепт `3px double`. Тени: лифт `0 5px 14px rgba(0,0,0,.4)`; модалка `0 24px 60px rgba(0,0,0,.5)`; «have»-свечение = ring + цветной bloom. Кастомный скроллбар 10px, thumb `--scroll-thumb`.

## 15. Компонентные паттерны
Карточки (hover: `border-color:var(--honey)` + `translateY(-1px)`, `transition .13s`; owned-пчёлы тинтятся по источнику `s-F/E/M`). Кнопки (пилюли/8–10px, вес 600–700; primary = honey-фон + тёмный текст; press `scale(.97)`). Чипы/бейджи (mono 9px/700; `chip--wild/ready/depth`; `card__src` — solid `--src-*`). Сегментированные переключатели `.seg` (active `.on` = `--solid`/`--solid-ink`, focus-ring `2px --honey-dk`). Тулбары (flex, gap 12, `flex-wrap`, min-h 48–56, hairline снизу). Прогресс-бары (segmented, абсолютный `*-fill`). Модалки (overlay `inset:0` z-200, `backdrop-filter:blur(4px)`, вход `modalFade`+`modalPop`). Пустые состояния (центр, фейд-глиф 40px, italic, reset-ссылка). Inline-confirm деструктива («точно? да/нет», `да` на `--rust`). Скелетоны `.ico-skel` (shimmer до загрузки текстур).

## 16. Анимации
`@keyframes`: `markPop` (spring переключателя) · `vtOldOut`/`vtNewIn` (View Transitions) · `icoShimmer` · `loaderTrace`+`loaderSlide` · `heartbeat` (SupportLink) · `chkPop` (чекбокс) · `modalFade`+`modalPop` · `treeNodeIn` (+ per-tier delay каскад) · `nodeFilterIn/Out` · `beeNodeIn`.
Переходы: hover `0.13–0.15s`; chevron `transform .2s`; collapse через `grid-template-rows 1fr↔0fr`+opacity `.2s`.
**View Transitions** (смена трекера): `document.startViewTransition` (фолбэк — мгновенный `router.push`); анимируется только снимок `tracker-body` (`vtOldOut` 0.34s → `vtNewIn` 0.34s `cubic-bezier(.22,.61,.36,1)`), `root` статичен (заголовок не дёргается); снимок обходит ограничения трансформа Cytoscape и неинтерполируемые градиенты; reduced-motion → 0.2s. Bees inventory⇄graph — Vue `<Transition name="inv">`.
**Перф-хуки:** `body.is-panning` (на жест пана/зума: снимает тени/переходы нод, гасит drop-shadow/детали; восстановление ~160ms) · `content-visibility:auto` + `contain-intrinsic-size` на карточках инвентаря · `contain:layout style` на нодах · глобальный reduced-motion фолбэк (~0.001ms).
Easing: spring `cubic-bezier(.34,1.56,.64,1)`; settle `cubic-bezier(.2,.7,.3,1)`; VT-in `cubic-bezier(.22,.61,.36,1)`.

## 17. Иконки
**SVG line-иконки** — `src/assets/icons/*.svg` (29 шт.), реестр `shared/icons/icons.ts` (импорт `?raw`), рендер `IconBase.vue` (`v-html`, `aria-hidden`). Стиль Lucide: `viewBox 0 0 24 24`, `fill:none`, `stroke:currentColor`, `stroke-width:1.9`, round caps. Глобально `.icon` = `1.05em`.
**Пиксельные текстуры (пчёлы)** — `BeeIcon`/`CombIcon`: 16×16 на `<canvas>` (показ 18–30px, `image-rendering:pixelated`), тинтинг в `useBeeTextures.ts` (multiply hex + destination-in по альфе, мемоизация по (label,hex)). Скелетон `.ico-skel` до `texturesReady`.
**Бренд** — `public/favicon.svg` (плитка дерево+пчела+сота: зелёный `#3f7d2a` / honey `#e8a72c`), `gen-brand-assets.mjs` рендерит apple-touch-icon и og-cover («Катализатор бесконечности», Unbounded 800).

## 18. Адаптивность
Брейкпоинтов нет (`@media` только для `prefers-reduced-motion`). Фиксированный desktop-лейаут `100vh` (`.shell` grid `auto 1fr`). Bees: `grid-template-columns: 296px 1fr 348px` (rail/graph/panel). Trees: `minmax(0,1fr) 480px` (graph/sidebar). Мягкая адаптивность через `flex-wrap:wrap` на тулбарах и `width:min(…px, 90–100vw)` на модалках. Единственная по-настоящему текучая сетка — карточки инвентаря (`minmax(212px,1fr)`).

## 19. Голос / характер
Тёмный игровой «инженерный дашборд»: тинт-градиентные фоны с мягкими цветными радиальными свечениями, glow-кольца на owned/target-нодах, mono на каждом счётчике/бейдже (HUD), чанковый display-шрифт в заголовках. Микротексты — неформальный русский, нижний регистр, разговорно-императивный («найти пчелу…», «готово к выведению: N», «склад полон», «точно? да / нет», «— ничего —», «Что-то сломалось»). Эмодзи — редко (бренд/OG). A11y всерьёз (skip-link, sr-only/live, `:focus-visible` через `:where()`, role/aria, reduced-motion).

---

## Ключевые файлы
`src/shared/registry/trackers.ts` · `src/shared/persistence/storage.ts` · `src/router/index.ts` · `src/App.vue` · `src/reset.css` · `src/style.css` · `eslint.config.js` · `vite.config.ts` · `.github/workflows/deploy.yml` · `src/trackers/{trees,bees}/theme.css` · `src/trackers/{trees,bees}/graph/graph.css` · `src/trackers/*/stores/*` · `src/shared/ui/*` · `src/shared/icons/icons.ts` · `public/favicon.svg`.
