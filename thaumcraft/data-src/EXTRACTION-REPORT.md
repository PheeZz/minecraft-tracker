# Отчёт об извлечении данных Thaumcraft (MC 1.7.10)

Дата: 2026-06-07. Выход — `thaumcraft/data-src/` и `thaumcraft/textures/`.
Декомпиляция: **CFR 0.152**. Генератор (воспроизводимо): `thaumcraft/data-src/_build/gen_thaumcraft.py`.
Промежуточные lang-файлы: `thaumcraft/_assets/lang*` (из JAR, нужны генератору).

## Использованные JAR

Thaumcraft `4.2.3.5` + аддоны, регистрирующие аспекты/исследования:
MagicBees `2.4.4`, ForbiddenMagic `0.575`, Tainted Magic `8.0.4`, Thaumic Tinkerer `spring-wipe`,
AppliedEnergistics2 `rv3-beta-6` (Thaumic Energistics intgr.), BloodArsenal `1.2-5`,
Avaritia `1.13`, Alfheim `BETA-38`, LoliMagically.

## Задача 1 — аспекты  →  `aspects.json` (+ `textures/aspects/`)

**58 аспектов** = 48 базовых Thaumcraft + **10 кастомных** из аддонов:
- **Forbidden Magic** — 7 (грехи): `infernus, ira, gula, invidia, superbia, desidia, luxuria`
- **MagicBees** — `tempus` · **Avaritia** — `terminus` · **Alfheim** — `tincturem` (радужный)

У каждого: tag, EN/RU название (+ синонимы из lang), `color` (#RRGGBB), `primal`, `components`
(два родительских аспекта), `blend`, `mod`, путь к текстуре. **60 PNG** извлечено в
`textures/aspects/` (50 Thaumcraft + 10 кастомных), `missingTextures` пуст.
`tincturem` (Alfheim) — `RainbowAspect`, цвет `null` (динамическая радуга).

## Задача 2 — исследования («свитки»)  →  `research.json`

**420 записей** из 10 модов:

| Мод | research |
|---|---|
| Thaumcraft | 201 |
| ThaumicTinkerer | 74 |
| ForbiddenMagic | 55 |
| TaintedMagic | 49 |
| AppliedEnergistics2 | 11 |
| Alfheim | 10 |
| MagicBees | 13 |
| BloodArsenal | 3 |
| Avaritia | 2 |
| LoliMagically | 2 |

Поля: `key`, `mod`, `category`, `aspects` (теги аспектов для покупки свитка),
`displayColumn/Row`, `complexity`, `parents` (предпосылки в дереве), `flags`
(autoUnlock/stub/virtual/round/concealed/secondary/special/hidden/lost), `icon`,
`pages` (страницы Таумономикона: lang-ключ + EN/RU текст), а также **`description`**.

### Описания — приоритет русского ✅
- `description_ru` — склейка текстовых страниц из ru_RU.lang (очищено от `<BR>`/`§`-кодов).
- `description_en` — то же из en_US.lang.
- `description` = RU, иначе EN.
- Покрытие: **с описанием 330/420**, из них **с русским описанием 270**.
  Без RU — моды без `ru_RU.lang` (Tainted Magic, BloodArsenal, LoliMagically) и отдельные записи без текста.

## Задача 3 — автоматическое изучение свитков (есть ли в модах) ✅

Да, найдено два готовых механизма:

1. **LoliMagically — предмет `research_scroll`** (`loliland.magically.common.item.l0l00lAND`,
   отображается как «Изучение: <название>»). Генерируется **по одному варианту на каждое
   исследование** из всех категорий (`ResearchCategories.researchCategories`). По ПКМ: если
   исследование ещё не изучено и у игрока есть предпосылки (`doesPlayerHaveRequisites`) — мгновенно
   завершает его (`ResearchManager.completeResearch`) со звуком `thaumcraft:learn`, **минуя
   мини-игру с аспектами**. Лежит в креатив-вкладке. Это и есть «авто-изучение свитков».
   *Нюанс:* проверяет предпосылки, поэтому всё дерево изучается применением свитков в порядке
   зависимостей (родители → потомки), а не одним кликом.

2. **Thaumic Tinkerer — «Sharing Tome»** (`ItemShareBook`): записывает все изученные исследования
   игрока в книгу; другой игрок книгой получает их все (`completeResearch` по списку). Механизм
   «клонирования» прогресса исследований между игроками.

Прочие `completeResearch` в модах (ForbiddenMagic, TaintedMagic, сам Thaumcraft) — точечные
(завершают конкретное исследование при крафте/событии), не массовые.

## Нерешённое / ограничения

1. **AppliedEnergistics2 (11)** — регистрирует research через свой enum-реестр
   (`ResearchRegistry.ResearchTypes`), поэтому взяты через lang-свип (`_langOnly: true`):
   есть `name` + `description` (вкл. RU), но `aspects`/`parents`/позиция не распарсены из кода.
2. **Alfheim (10)** — не локализует названия исследований (нет `research_name`/`research_page`
   ключей в lang): есть `aspects`/`category`/`parents`, но `name`/`description` пустые.
3. **LoliMagically** обфусцирован — извлечены только 2 его собственных research; основная его роль
   здесь — предмет авто-изучения (см. выше).
4. **ThaumicTinkerer** — часть research имеет нестандартную структуру (Kami и пр.); базовые поля
   извлечены, отдельные сложные записи могут быть неполными.
5. Страницы-рецепты (крафт/арканный/инфузия) в `pages` опущены — оставлены только текстовые
   страницы (для описаний). При необходимости можно добавить разбор рецептов.
