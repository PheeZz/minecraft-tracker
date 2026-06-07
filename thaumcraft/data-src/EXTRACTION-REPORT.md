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

## Задача 4 — рецепты, источники аспектов, локализация, текстуры предметов

Расширенное автономное извлечение «по максимуму» (генераторы `gen_sources.py`, `gen_recipes.py`).

### Рецепты  →  `recipes.json` (**402**)
`ThaumcraftApi.add*Recipe(...)` по всем модам: crucible 75, arcane 132, arcane_shapeless 21,
infusion 142, infusion_enchantment 32. По мод: Thaumcraft 231, TaintedMagic 74, ForbiddenMagic 51,
AE2 15, MagicBees 13, Alfheim 10, ThaumicTinkerer 3, BloodArsenal 3, Avaritia 2.
Поля: `research` (ссылка на исследование), `type`, **`aspects`** (стоимость эссенции/вис — главная
ценность; `null` + `aspectsComputed` если считается в рантайме), `output`, `input`/`inputs`,
для infusion — `instability`, `central`, `components`. Предметы разрешены в EN/RU названия там, где
ссылка маппится на lang-ключ (**145 выходов с именами**); иначе `{ref,meta}` (поле
ConfigItems/ConfigBlocks), `{vanilla:srg}` или `{oredict}`.

### Источники аспектов  →  `aspect-sources.json`
Теги сканирования: **375 object-тегов** + **69 entity-тегов** (Thaumcraft/MagicBees/ForbiddenMagic/Avaritia).
`subject.type`: `oredict` ( id ore-dictionary, готов к использованию) | `item` (ref + meta) | `raw`.
`aspectGivers` — обратный индекс «аспект → ore-dict источники» (item-ref источники там опущены, т.к.
требуют разрешения имён). `entityTags` — аспекты всех мобов.

### Локализация предметов  →  `item-names.json` (**1570**)
EN/RU названия всех `item.*.name` / `tile.*.name` по всем 10 модам (Thaumcraft 411, Alfheim 529,
AE2 169, BloodArsenal 100, ThaumicTinkerer 96, ForbiddenMagic 78, Avaritia 62, TaintedMagic 61,
LoliMagically 37, MagicBees 27). Используется как словарь для разрешения ссылок в рецептах.

### Текстуры предметов/блоков  →  `textures/items/<mod>/`, `textures/blocks/<mod>/`
**842 item + 649 block PNG** из 8 модов (см. `textures/textures-manifest.json`). Плюс **60** иконок
аспектов в `textures/aspects/`.

### Ванильные имена предметов  →  `vanilla-names.json`
**342** ванильных предмета/блока: `SRG-поле (field_xxx) → registry-id + EN/RU название`. Источник —
клиент сервера LoliLand: `client.jar` → `net/minecraft/init/{Items,Blocks}` (SRG + строковый
registry-id) + ванильные `en_US/ru_RU.lang` (en из `client.jar`, ru из объекта ассетов по хэшу).
RU восстановлено даже при несовпадении registry-id и unlocalized-ключа (через обратный поиск по EN).
Используется генераторами рецептов/источников: ванильные ссылки в `recipes.json` и
`aspect-sources.json` теперь разрешаются в имена. Промежуточные файлы (декомп `Items/Blocks`,
ванильный lang) лежат вне репозитория, в `Desktop/pricoli-jar/mcvanilla/` — в игровой каталог
ничего не записывалось.

### Имена предметов модов  →  `field-names.json`
**203** поля предметов/блоков модов (`ForbiddenItems.deadlyShards`, `LudicrousItems.*`, `ModItems.*`,
`ConfigItems/Blocks.*` и т.д.) → EN/RU имя. Источник — построчный разбор регистраций во всех
декомпилированных модах (`field = new ItemX().func_77655_b("U")`, `func_149663_c` для блоков,
`GameRegistry.registerItem/Block(field, "R")`, helper-`register(new X(), "N")`) + разрешение через
общий lang. Подключён к генераторам рецептов/источников.

### Итоговое покрытие именами
После ванильного + модового разрешения (+ под-типы по числовой мете через `base.<meta>.name`,
с базами из `field-names.json.bases` — напр. `WandRod.0`→Greatwood Rod, `ItemMaterial.0`→Shadow Metal
Ingot, инертные/заряженные навершия палочек):
- **`recipes.json`**: ~**79 %** ссылок на предметы названы (283 выхода), стоимости аспектов — 100 %.
- **`aspect-sources.json`**: **270/320** item-субъектов названы.

Остаётся не названным (объективный long-tail):
- ссылки без распарсенного поля — касты `(Item)x`, локальные переменные, выражения (≈155);
- под-типы со **строковым** ключом меты (`item.NetherShard.wrath.name`) и предметы, где каждая «мета»
  это **отдельный** зарегистрированный предмет (`singularity_iron`) — нужен массив имён из класса предмета;
- предметы с **переменной** метой из циклов (мета неизвестна статически).
Для них потребовался бы пер-классовый разбор `getUnlocalizedName(meta)`/sub-item списков; ценность
низкая (стоимости аспектов и структура рецептов уже полны).

## Привязка к серверу

Все экспортируемые датасеты (`aspects/research/recipes/item-names/aspect-sources.json`,
оба texture-манифеста, а также `genetics/.../species-genomes.json` и `genetics/textures/manifest.json`)
несут машиночитаемый флаг **`_meta.server = "LoliLand"`** (отдельное поле, не в описании). Данные
специфичны для сборки/версий модов этого сервера; под другой сервер — перегенерировать тем же
генератором на его JAR. Файл `bees/i18n/genetics-i18n.json` намеренно не трогался. В UI флаг пока
не используется.

## Проверка Loli-модов (специфичных для сервера)

Просканированы все 13 `Loli*`/`loli*` JAR на регистрацию контента Thaumcraft
(`registerObjectTag`/`registerComplexObjectTag`/`registerEntityTag`/`add*Recipe`/`registerResearchItem`/`new Aspect`).
**Вывод: ничего, что закрывает пробелы.** Loli-моды только *читают* данные Thaumcraft
(`ThaumcraftCraftingManager.getAspects` ×100, `getCraftingRecipes`) для своих GUI/механик и **не
регистрируют** ни аспектов, ни тегов сканирования, ни рецептов, ни исследований. Единственное
исключение — LoliMagically с предметом `research_scroll` (его 1 research и сам предмет авто-изучения
уже извлечены ранее). Поэтому декомпиляция остальных Loli-модов для пополнения исследования смысла
не имеет; пробелы закрываются только из «родных» источников (TC `ConfigAspects`, AE2 Feature-классы,
MCP-маппинг ванильных SRG-имён).

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
5. Страницы-рецепты в `research.json/pages` опущены, но сами рецепты извлечены отдельно в
   `recipes.json` и связаны полем `research` → можно сджойнить.
6. Ванильные предметы (`{vanilla:field_xxx}`) теперь **разрешаются в имена** EN/RU через
   `vanilla-names.json` (см. ниже). Остаются неразрешёнными лишь предметы с мета-переменной из
   циклов и часть addon-специфичных полей. Стоимости аспектов извлечены полностью.
7. `aspect-sources.json`: часть object-тегов Thaumcraft задаётся в циклах по подтипам предмета
   (`subject.type:"raw"`, ref вроде `is`) — аспекты есть, но конкретный предмет не разрешён.
8. AE2: позиции в дереве добавлены из enum (`displayColumn/Row`), но аспекты исследований по-прежнему
   не распарсены (строятся динамически в Feature-классах).
