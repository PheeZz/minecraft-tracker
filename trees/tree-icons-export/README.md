# Иконки деревьев (Forestry + Binnie ExtraTrees)

Самодостаточный набор для отрисовки иконок саженцев. Перенеси папку целиком
в свой проект — внешних зависимостей и сети не требует.

## Содержимое

| Путь | Что это |
|---|---|
| `tree-icons.js` | `window.TREEICONS` — Forestry: имя дерева (RU/EN) → путь к готовому PNG |
| `tree-colors.js` | `window.TREECOLORS` — ExtraTrees: имя (RU/EN) → `{tpl, c}` (шаблон кроны + hex-цвет листвы) |
| `tree-icons/` | 28 готовых PNG саженцев Forestry |
| `tree-templates/` | 7 серых шаблонов кроны (`<tpl>.leaves.png` + `<tpl>.trunk.png`) для тонирования ExtraTrees |
| `tree-icons-demo.html` | демо-страница: вся сетка иконок, фильтр, поиск, ползунок размера |

Шаблоны (`tpl`): `default`, `conifer`, `fruit`, `jungle`, `palm`, `poplar`, `shrub`.

## Как рисовать (две механики)

**Forestry** — готовая текстура, рисуется как есть:
```js
const file = window.TREEICONS[name];      // "tree-icons/sapling.treeBaobab.png"
ctx.drawImage(img(file), 0, 0, S, S);
```

**ExtraTrees** — 2 слоя: ствол + тонированная цветом вида крона:
```js
const t = window.TREECOLORS[name];        // { tpl:"fruit", c:"#6d8f1e" }
ctx.drawImage(img(`tree-templates/${t.tpl}.trunk.png`),  0,0,S,S);   // ствол как есть
ctx.drawImage(tint(`tree-templates/${t.tpl}.leaves.png`, t.c), 0,0,S,S); // крона в цвет
```

Тонирование (multiply + восстановление альфы), как для сот/пчёл:
```js
function tint(img, hex){
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'multiply';      x.fillStyle = hex; x.fillRect(0,0,cv.width,cv.height);
  x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0);
  return cv;
}
```
Канвасу задавай `image-rendering: pixelated`, отключай `imageSmoothingEnabled` — текстуры 16×16.

## Лукап имени

Имя ищи сначала в `TREEICONS` (готовая текстура — приоритет), потом в `TREECOLORS`:
```js
function iconFor(name){
  if (window.TREEICONS[name])  return { kind:'forestry',   file: window.TREEICONS[name] };
  if (window.TREECOLORS[name]) return { kind:'extratrees', ...window.TREECOLORS[name] };
  return null;   // нет ассета (напр. ванильные Oak/Birch/Spruce/Jungle/DarkOak)
}
```
Ключи есть и на русском, и на английском названии вида.

## Покрытие

- Forestry: 28 видов (готовые PNG).
- ExtraTrees: 97 видов (тонирование), 0 пропущено.
- Не покрыты 6 базовых ванильных деревьев (Oak, Birch, Spruce, Jungle, Dark Oak, Acacia) —
  у них нет собственных ассетов в модах, в игре используются ванильные саженцы.

Источник: распакованные jar `forestry` и `binnie-mods` (1.7.10).
