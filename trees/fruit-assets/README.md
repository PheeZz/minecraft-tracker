# Ассеты плодов (Forestry + Binnie ExtraTrees)

Текстуры плодов из распакованных jar (Minecraft 1.7.10). Все 16×16, кроме
служебного `Fruit progress.PNG` (512×48 — спрайт-лист стадий созревания).

## Категории

### `extratrees-food/` — 110 готовых иконок-предметов плодов (ExtraTrees)
Главная категория: цветные иконки собранных плодов/орехов/специй
(Banana, Mango, Coconut, Almond, Coffee, …). Это то, что лежит в инвентаре.
Имена файлов = английские названия плодов (некоторые с суффиксом вроде `001`
из исходных ассетов мода). `Fruit progress.PNG` — служебный, не плод.

### `forestry-fruits/` — 7 иконок-предметов плодов (Forestry)
cherry, chestnut, dates, lemon, papaya, plum, walnut.

### `extratrees-fruit-shapes/` — 6 форм плодов на дереве (ExtraTrees)
Серые силуэты по размеру (tiny/small/average/large/larger/pear), которыми
рендерятся плоды на листве. Тонируются цветом плода в игре —
при желании можно красить как соты/листву (multiply + альфа).

### `forestry-leaf-overlays/` — 5 наложений плодов на листву (Forestry)
fruits.berries / citrus / nuts / plums / pomes — оверлеи поверх блока листвы.

## Что брать для UI

Для иконок «собранный плод» в интерфейсе используй **`extratrees-food/`**
(110 шт.) + **`forestry-fruits/`** (7 шт.) — это готовые цветные спрайты,
рисуются как есть, без тонирования.

`extratrees-fruit-shapes/` и `forestry-leaf-overlays/` — это то, как плод
выглядит НА дереве (силуэты/оверлеи), нужны только если будешь рисовать
плодоносящее дерево.

## JSON-индекс: `fruits.json` / `fruits.js`

`fruits.js` объявляет `window.FRUITS = { fruits, treeToFruit }` (тот же объект, что в `fruits.json`).

### `fruits` — словарь по id плода (66 шт.: 59 ExtraTrees + 7 Forestry)
```jsonc
"Mango": {
  "id": "Mango",
  "ru": "Манго", "en": "Mango",
  "src": "E",                                  // E=ExtraTrees, F=Forestry
  "icon": "extratrees-food/Mango.png",         // готовая иконка-предмет (null только у Apple — ванильное яблоко)
  "color": "#f29c36",                          // цвет плода (для тонирования формы)
  "shape": "average",                          // tiny/small/average/large/larger/pear/pod
  "shapeIcon": "extratrees-fruit-shapes/average.png"  // силуэт плода на дереве (null если pod/Forestry)
}
```
У Forestry-плодов (`src:"F"`) заполнены только `icon`/`ru`/`en`; `color/shape/shapeIcon` = null.
У 5 «pod»-плодов (Banana, RedBanana, Plantain, Coconut, Papayimar) `color/shapeIcon` = null
(они растут стручком, отдельной формы-силуэта нет — только готовая иконка).

### `treeToFruit` — какой плод даёт дерево (150 ключей)
Имя дерева (RU / EN / enum-id) → id плода в `fruits`:
```jsonc
"Манго (дерево)": "Mango", "Mango Tree": "Mango", "MangoTree": "Mango"
```
Использование: `FRUITS.fruits[ FRUITS.treeToFruit[treeName] ].icon`.

Для иконки «собранный плод» просто рисуй `icon` как есть (готовый цветной спрайт).

Источник: jar `forestry`, `binnie-mods` (ExtraTrees). Данные извлечены из классов
`ExtraTreeFruitGene` (цвет+форма), `ExtraTreeSpecies` (дерево→плод), `Food` (иконки), lang-файлов.
