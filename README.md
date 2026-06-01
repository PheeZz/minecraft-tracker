# Minecraft Tracker

Трекеры прогресса для модов Minecraft, объединённые в одно Vue 3 + TypeScript приложение
с переключением между независимыми трекерами:

- **Деревья** (Forestry / Binnie ExtraTrees) — граф селекции деревьев, инвентарь
  саженцев/пыльцы, план выведения всех плодов. Тёмная «лесная» тема.
- **Пчёлы** (Forestry / Binnie ExtraBees / MagicBees) — «цепочка выведения»: от соты
  к пчеле-производителю и пошаговому плану скрещиваний. Тема «пергамент/мёд».

## Стек

Vite · Vue 3 (`<script setup>`) · TypeScript (strict + `noUncheckedIndexedAccess`) ·
Pinia · Vue Router · Cytoscape (граф) · Vitest · ESLint/Prettier.

## Команды

```bash
npm run dev          # дев-сервер
npm run build        # сборка (vue-tsc -b + vite build)
npm run preview      # предпросмотр сборки
npm run typecheck    # vue-tsc -b (проверяет проект целиком)
npm run lint         # ESLint --fix
npm test             # Vitest
npm run verify:trees # сверка данных деревьев с trees/recipes_output (Vitest)
npm run verify:bees  # проверка целостности данных пчёл (ссылки/соты/глубина)
npm run gen:bees        # регенерация данных пчёл из bees/mockups/*.js
npm run gen:tree-icons  # регенерация данных иконок деревьев из trees/tree-icons-export
npm run gen:fruit-icons # регенерация данных иконок плодов из trees/fruit-assets/fruits.json
npm run gen:assets      # копирование PNG-ассетов из bees/ и trees/ в public/ (авто в prebuild)
npm run screenshot   # визуальная проверка (Playwright; нужен запущенный preview)
```

## Структура

```
src/
  App.vue                 хост-shell: переключатель трекеров (тема через data-tracker)
  router/                 /trees, /bees (редирект / на последний активный)
  shared/                 общее: persistence/storage (единственное место с localStorage),
                          icons, ui/IconBase, cytoscape-shims, types
  trackers/
    trees/                data · domain (чистые ф-ии) · stores (Pinia) · graph · components
    bees/                 data (генерируется) · domain · stores · graph · components
```

Трекеры **максимально независимы** — общий только хост-каркас, обёртки и утилиты.

## Данные

- **Деревья**: `src/trackers/trees/data/trees.data.ts` — выверены против канона
  `trees/recipes_output/` (`npm run verify:trees`, покрытие 132/132 рецептов).
- **Пчёлы**: `src/trackers/bees/data/*.ts` — **генерируются** из `bees/mockups/*.js`
  (`npm run gen:bees`); вручную не редактировать.

### Конвейер данных и ассетов

Source-of-truth — каталоги `bees/` и `trees/` в корне (исходные `.js`/`.json` и PNG).
Из них производятся два вида артефактов:

- **Данные** (`src/trackers/*/data/*.ts`) — генерируются и коммитятся:
  `gen:bees` (из `bees/mockups/`), `gen:tree-icons` и `gen:fruit-icons` (из `trees/`).
  Файлы помечены «АВТОГЕНЕРАЦИЯ» — править надо source, не их.
- **Картинки** (`public/bees/`, `public/trees/`) — рантайм грузит их по
  `import.meta.env.BASE_URL`. Копируются из source через `gen:assets` (автоматически в
  `prebuild`). Эти копии **не хранятся в git** (`.gitignore`) — единственный источник
  правды остаётся в `bees/`/`trees/`.

## Хранилище

Прогресс хранится в localStorage только через обёртку `@/shared/persistence/storage`
(прямой доступ к `localStorage` запрещён ESLint-правилом). Ключи: `trees.progress`,
`trees.inventory`, `trees.ui`, `bees.have`, `app.tracker`.

## Деплой (GitHub Pages)

CI-workflow `.github/workflows/deploy.yml` собирает и публикует на Pages.
- `base` при сборке = `/minecraft-tracker/` (project Pages); в dev — `/`.
- Для SPA-роутинга копируется `404.html` (= `index.html`), чтобы deep-link
  (`/minecraft-tracker/bees`) открывался корректно.

Чтобы включить:
1. Settings → Pages → Source: **GitHub Actions**.
2. Запушить в `main` (или вручную Actions → Deploy to GitHub Pages → Run на нужной ветке).

Сайт: `https://pheezz.github.io/minecraft-tracker/`.
