# План миграции: один Vue 3 + TS проект с двумя независимыми трекерами

Объединяем два трекера Minecraft (деревья Forestry и пчёлы Forestry/ExtraBees) в одно
Vue 3 + TypeScript приложение с переключением между независимыми трекерами.

## Решения (зафиксированы)

- **Объём пчёл v1**: на базе `bees/mockups/bees-5-chain.html` (сота → пчела → план,
  склад «есть/нет», альтернативные рецепты, cytoscape-подграф). Не полный паритет с деревьями.
- **Унификация**: трекеры **максимально независимы** (концепт пчёл ещё не финальный).
  Общий — только хост-каркас, роутинг, обёртки Cytoscape и утилиты.
- **Дизайн**: сохраняем **две темы** (деревья = тёмная «лесная», пчёлы = пергамент/кодекс).
- **Стили**: vanilla CSS + CSS-переменные (токены), scoped в компонентах. Без UI-библиотек/Tailwind.
- **Пользователи**: единственный пользователь — разработчик. **Никаких legacy-миграций
  localStorage и обратной совместимости форматов.** Ключи localStorage переименовываем свободно.

## Принципы

1. Максимальная независимость доменных модулей trees/bees.
2. Инкрементальность: сначала деревья (1:1 с `ragu.html`), потом пчёлы. На каждом этапе приложение запускается.
3. TS strict, доменные типы — единственный источник правды, рантайм-данные валидируются на входе.
4. Cytoscape остаётся; оборачивается в composable. Граф НЕ кладём в Vue-реактивность — стор источник правды, `cy` императивный слой, синхронизация через `watch → cy.batch`.

## Стек

| Решение | Выбор |
|---|---|
| Сборка | Vite |
| Фреймворк | Vue 3 `<script setup>` + TS (strict) |
| Роутинг | Vue Router (`/trees`, `/bees`) |
| Состояние | Pinia (стор на трекер) |
| Граф | Cytoscape + cytoscape-dagre / -elk / node-html-label (npm, не CDN) |
| Стили | Vanilla CSS, scoped + CSS-переменные |
| Линт/тесты | ESLint + Prettier + Vitest |

## Структура

```
src/
  main.ts
  App.vue                      # хост-shell: переключатель трекеров + RouterView, ставит data-tracker
  router/index.ts              # /trees, /bees, redirect /
  shared/
    cytoscape/useCytoscape.ts useNodeHtmlLabel.ts
    persistence/useLocalStorage.ts
    ui/AppButton.vue AppModal.vue AppPopup.vue IconBase.vue
    icons/icons.ts
    types.ts
  trackers/
    trees/
      data/trees.data.ts
      domain/{graph,plan,types}.ts
      stores/{useTreesStore,useTreesUiStore}.ts
      components/TreesView.vue TreeGraph.vue TreeSidebar.vue TreeCard.vue
                 BreedModal.vue InventoryPopup.vue PlanPanel.vue TierFilter.vue
                 HeroStats.vue NodeTooltip.vue
      composables/useTreeGraph.ts
      theme.css
    bees/
      data/bees.json bees.data.ts combColors.ts beeColors.ts
      domain/{graph,combs,types}.ts
      stores/useBeesStore.ts
      components/BeesView.vue BeeRail.vue BeeChainGraph.vue BeePanel.vue
                 BeeProducers.vue BeePlan.vue Breadcrumb.vue
      composables/useBeeIcons.ts
      assets/  (beeCombs.*.png, beebody/*)
      theme.css
```

## Слой данных

**Деревья.** Типы:
```ts
type Tier = 0|1|2|3|4|5|6|7|8|9|10
interface Tree { id: string; tier: Tier; parents?: [string,string][]; fruit?: string; cond?: string; plant: number }
type TreeState = 0 | 2           // none | bred
interface Inv { sap: number; pol: number }
```
`TREES`/`FRUITS`/`PLANT`/`TIERS`/`STARTING_SAPLINGS` → `trees.data.ts`, слияние fruit в фабрике `buildTrees()`.

**Пчёлы.** Источник правды — `bees.json` (id_en/id_ru, parents{p1,p2,chance}, products{comb,chance,type}).
`normalize.ts` маппит в рабочую модель (один формат вместо двух; legacy `bees-data.js` не поддерживаем):
```ts
interface Recipe { p1: string; p2: string; chance: number }
interface Product { comb: string; chance: number; type: 'product'|'specialty' }
type Source = 'Forestry'|'ExtraBees'|'MagicBees'
interface Bee { id: string; en: string; source: Source; parents: Recipe[]; products: Product[] }
```
Цвета (`combColors`, `beeColors`) → типизированные модули из `*-colors.js`.

## Разбор `ragu.html` (1566 строк)

- **domain/** (чистые ф-ии, без DOM): ancestorsOf, effort, isAvailable, breedPath, unlockScore,
  computeUsage, parentDemand, FRUIT_PRODUCERS/TARGETS/CHAIN, fruitUnlocked.
- **Pinia**:
  - `useTreesStore`: state(прогресс), inventory, undo/redo, actions setTreeState/setInv/breed/reset/import/export,
    getters bredCount/availableCount/fruitsUnlocked/planTrees. Persist `trees.progress`/`trees.inventory`.
  - `useTreesUiStore`: layout, onlyAvail/onlyFruit, tierVisible, showAllEdges, bypass, planOpen, selectedId. Persist `trees.ui`.
- **useTreeGraph**: cy, раскладки (tiers/elk/dagre/breadthfirst), applyStates, highlightLineage, tier-headers, лёгкий рендер при пане.
- **Компоненты**: каждый innerHTML-блок (renderInfo/renderPlan/renderStats/openInvPopup/askBreed) → Vue-компонент с props/emit. Делегирование `data-jump`/`data-invk` → Vue-обработчики (внутри графа — делегирование на контейнере, т.к. HTML генерит node-html-label).

## Разбор пчёл (bees-5-chain.html)

- **domain**: depth (мемо, зависит от HAVE), subgraph(target), planSteps(target), индекс COMBS, сортировка производителей по глубине.
- **useBeesStore**: HAVE:Set (persist `bees.have`), invOnly, RC (рецепт на пчелу), mode/curComb/curTarget. Сброс мемо при изменении HAVE.
- **useBeeIcons**: canvas-тинтинг текстур (beeCombs.0/1.png, beebody*), paintAll, перерисовка по render/zoom/pan графа (rAF-throttle, отмена в onUnmounted).
- **BeeChainGraph**: cy с ромбами-рецептами, dagre TB.

## Темы

`shared/ui` задаёт контракт токенов. Каждый трекер — свой `theme.css`, активация по `[data-tracker="trees|bees"]` на корне (ставит хост-shell). Примитивы стилизуются только через токены. Оба набора шрифтов подключаем.

## Этапы

1. **Каркас**: Vite vue-ts, ESLint/Prettier, Pinia, Router, токены, App.vue со свитчером + 2 заглушки. → запускается.
2. **Данные+домен деревьев**: типы + trees.data.ts + чистый domain/ + юнит-тесты.
3. **Стор деревьев**: persist + export/import (без legacy-миграций).
4. **Граф деревьев**: useCytoscape + useTreeGraph.
5. **UI деревьев**: sidebar/card/plan/modal/popup/hero/фильтры/поиск/undo-redo/export-import. → паритет 1:1.
6. **Данные+иконки пчёл**: bees.json → normalize; цвета; useBeeIcons.
7. **Логика+стор пчёл**: depth/subgraph/planSteps, HAVE/RC/invOnly.
8. **UI пчёл**: rail + chain-граф + панель/план. → паритет с chain-макетом.
9. **Полировка**: переключение тем без вспышек, восстановление активного трекера, resize, перф.

## Риски

- Cytoscape ↔ Vue-реактивность: стор источник правды, cy императивен, sync через watch+batch.
- node-html-label пересоздаёт canvas при зуме → перерисовка иконок пчёл по render/zoom/pan.
- HTML внутри нод графа генерит библиотека → там делегирование событий на контейнере.
- Ассеты пчёл (PNG) → public/ или import `?url`, пути в useBeeIcons обновить.
- CDN-библиотеки Cytoscape → перевести в npm-зависимости.
